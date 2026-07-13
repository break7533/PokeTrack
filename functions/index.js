/**
 * PokéTrack — Cloud Functions
 *
 * Scheduled function: generates a daily collection recommendation per user
 * using GitHub Models API (OpenAI gpt-5) and writes it to Firestore.
 */
"use strict";

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { buildContext, buildPrompt } = require("./prompt");
const logger = require("firebase-functions/logger");

initializeApp();

const GITHUB_MODELS_TOKEN = defineSecret("GITHUB_MODELS_TOKEN");

/**
 * Call GitHub Models API (OpenAI-compatible endpoint).
 */
async function callModel(token, prompt) {
  const res = await fetch("https://models.inference.ai.azure.com/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "openai/gpt-5",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    })
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`GitHub Models API error ${res.status}: ${errBody}`);
  }

  const data = await res.json();
  return data.choices[0].message.content.trim();
}

/**
 * Daily recommendation generator.
 * Runs at 05:00 UTC every day.
 * Iterates all users, builds context from their collection + history,
 * calls GitHub Models API, and writes the recommendation to Firestore.
 */
exports.generateDailyRecommendation = onSchedule(
  {
    schedule: "0 5 * * *",
    timeZone: "Etc/GMT",
    maxInstances: 1,
    timeoutSeconds: 120,
    secrets: [GITHUB_MODELS_TOKEN]
  },
  async (event) => {
    const db = getFirestore();
    const token = GITHUB_MODELS_TOKEN.value();

    // Get all users
    const usersSnapshot = await db.collection("users").get();

    if (usersSnapshot.empty) {
      logger.info("No users found. Skipping recommendation generation.");
      return;
    }

    for (const userDoc of usersSnapshot.docs) {
      const uid = userDoc.id;
      try {
        await generateForUser(db, token, uid, userDoc);
      } catch (err) {
        logger.error(`Failed to generate recommendation for user ${uid}:`, err);
      }
    }

    logger.info(`Recommendation generation complete for ${usersSnapshot.size} user(s).`);
  }
);

async function generateForUser(db, token, uid, userDoc) {
  // 1. Load collection data
  const userData = userDoc.data();
  const collection = userData.collection || {};

  if (Object.keys(collection).length === 0) {
    logger.info(`User ${uid} has empty collection. Skipping.`);
    return;
  }

  // 2. Load history (last 90 days)
  const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const historySnapshot = await db
    .collection("users")
    .doc(uid)
    .collection("history")
    .where("at", ">", cutoff)
    .orderBy("at", "asc")
    .get();

  const history = [];
  historySnapshot.forEach((doc) => {
    const data = doc.data();
    if (data && data.set && data.at) history.push(data);
  });

  // 3. Load previous recommendation (to avoid repeats)
  const recRef = db.collection("users").doc(uid).collection("recommendations").doc("daily");
  const prevRecSnap = await recRef.get();
  const prevRec = prevRecSnap.exists ? prevRecSnap.data() : null;

  // 4. Build context and prompt
  const context = buildContext(collection, history, prevRec);
  const prompt = buildPrompt(context);

  // 5. Call GitHub Models API
  const text = await callModel(token, prompt);

  // 6. Parse JSON response
  let recommendation;
  try {
    // Strip markdown code fences if present
    const cleaned = text.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "");
    recommendation = JSON.parse(cleaned);
  } catch (parseErr) {
    logger.error(`Failed to parse model response for user ${uid}:`, text);
    throw new Error("Invalid JSON from model: " + parseErr.message);
  }

  // 7. Validate structure
  if (!recommendation.quote || !recommendation.focus || !recommendation.reasoning) {
    logger.error(`Incomplete recommendation for user ${uid}:`, recommendation);
    throw new Error("Recommendation missing required fields");
  }

  // 8. Write to Firestore
  const recData = {
    quote: recommendation.quote,
    focus: {
      setId: recommendation.focus.setId || "",
      name: recommendation.focus.name || "",
      reason: recommendation.focus.reason || ""
    },
    reasoning: recommendation.reasoning,
    tone: context.tone,
    generatedAt: Date.now(),
    date: new Date().toISOString().split("T")[0]
  };

  await recRef.set(recData);
  logger.info(`Recommendation written for user ${uid}: focus=${recData.focus.name}`);
}
