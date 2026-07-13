/**
 * PokéTrack — Prompt builder for daily recommendation
 *
 * Transforms raw collection + history data into a structured context
 * string, then wraps it in a prompt requesting 3 distinct recommendations.
 */
"use strict";

const { getMinimalSets } = require("./load-sets");

const TONES = ["motivational", "analytical", "suggestion", "trivia"];

/**
 * Build full context object from Firestore data.
 *
 * @param {Object} collection - User's collection { [setId]: { base, secret } }
 * @param {Array} history - History entries [{ set, kind, from, to, at }]
 * @param {Array|null} prevItems - Previous day's recommendation items (to vary from)
 * @returns {Object} Context for prompt
 */
function buildContext(collection, history, prevItems) {
  const eras = getMinimalSets();
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  // Overall stats
  let totalBase = 0, totalBaseAvailable = 0;
  let totalSecret = 0, totalSecretAvailable = 0;
  const setDetails = [];

  for (const era of eras) {
    for (const set of era.sets) {
      const entry = collection[set.id] || {};
      const baseCollected = Math.min(entry.base || 0, set.base);
      const secretCollected = Math.min(entry.secret || 0, set.secret);
      const totalCards = set.base + set.secret;
      const collected = baseCollected + secretCollected;
      const pct = totalCards > 0 ? Math.round((collected / totalCards) * 100) : 0;

      totalBase += baseCollected;
      totalBaseAvailable += set.base;
      totalSecret += secretCollected;
      totalSecretAvailable += set.secret;

      setDetails.push({
        id: set.id,
        name: set.name,
        era: era.name,
        baseCollected,
        baseTotal: set.base,
        secretCollected,
        secretTotal: set.secret,
        totalCollected: collected,
        totalCards,
        pct,
        remaining: totalCards - collected
      });
    }
  }

  const overallTotal = totalBaseAvailable + totalSecretAvailable;
  const overallCollected = totalBase + totalSecret;
  const overallPct = overallTotal > 0 ? Math.round((overallCollected / overallTotal) * 100) : 0;

  // Closest to completion (started but not complete, sorted by remaining)
  const closestToComplete = setDetails
    .filter((s) => s.pct > 0 && s.pct < 100)
    .sort((a, b) => a.remaining - b.remaining)
    .slice(0, 5);

  // Untouched sets
  const untouched = setDetails.filter((s) => s.pct === 0);

  // Completed sets
  const completed = setDetails.filter((s) => s.pct >= 100);

  // Recent activity
  const yesterdayActivity = history.filter((e) => e.at > oneDayAgo);
  const weekActivity = history.filter((e) => e.at > sevenDaysAgo);

  const weekNet = weekActivity.reduce((sum, e) => sum + (e.to - e.from), 0);
  const yesterdayNet = yesterdayActivity.reduce((sum, e) => sum + (e.to - e.from), 0);

  // Streak calculation (consecutive days with activity)
  const daySet = new Set();
  history.forEach((e) => {
    const d = new Date(e.at);
    daySet.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  });
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 90; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (daySet.has(key)) streak++;
    else break;
  }

  // Top active sets this week
  const weekSetMap = {};
  weekActivity.forEach((e) => {
    weekSetMap[e.set] = (weekSetMap[e.set] || 0) + (e.to - e.from);
  });
  const topActiveThisWeek = Object.entries(weekSetMap)
    .map(([id, net]) => {
      const detail = setDetails.find((s) => s.id === id);
      return { id, name: detail ? detail.name : id, net };
    })
    .sort((a, b) => b.net - a.net)
    .slice(0, 5);

  // Determine tone
  const dayOfYear = Math.floor((now - new Date(today.getFullYear(), 0, 0)) / (24 * 60 * 60 * 1000));
  const tone = TONES[dayOfYear % TONES.length];

  return {
    overall: { collected: overallCollected, total: overallTotal, pct: overallPct },
    setsCompleted: completed.length,
    setsStarted: setDetails.filter((s) => s.pct > 0).length,
    totalSets: setDetails.length,
    closestToComplete,
    untouchedCount: untouched.length,
    yesterdayNet,
    weekNet,
    streak,
    topActiveThisWeek,
    tone,
    prevItems: prevItems || null
  };
}

/**
 * Build the prompt string requesting 3 distinct recommendations.
 */
function buildPrompt(context) {
  const lines = [];

  lines.push("You are a Pokemon TCG collection advisor. Analyze the collector's progress and provide 3 distinct daily recommendations.");
  lines.push("");
  lines.push("## Collector's Current Status");
  lines.push(`- Overall: ${context.overall.collected} / ${context.overall.total} cards (${context.overall.pct}%)`);
  lines.push(`- Sets completed: ${context.setsCompleted} / ${context.totalSets}`);
  lines.push(`- Sets started: ${context.setsStarted}`);
  lines.push(`- Untouched sets: ${context.untouchedCount}`);
  lines.push(`- Current streak: ${context.streak} days`);
  lines.push(`- Cards added yesterday: ${context.yesterdayNet}`);
  lines.push(`- Cards added this week: ${context.weekNet}`);
  lines.push("");

  if (context.closestToComplete.length > 0) {
    lines.push("## Closest to Completion");
    context.closestToComplete.forEach((s) => {
      lines.push(`- ${s.name} (${s.era}): ${s.totalCollected}/${s.totalCards} = ${s.pct}% — ${s.remaining} cards remaining`);
    });
    lines.push("");
  }

  if (context.topActiveThisWeek.length > 0) {
    lines.push("## Most Active Sets This Week");
    context.topActiveThisWeek.forEach((s) => {
      lines.push(`- ${s.name}: +${s.net} cards`);
    });
    lines.push("");
  }

  lines.push(`## Tone for Today: ${context.tone}`);
  lines.push(`Adjust your response style to be ${context.tone}.`);
  if (context.tone === "motivational") lines.push("Be encouraging and highlight achievements.");
  if (context.tone === "analytical") lines.push("Focus on numbers, trends, and data-driven insights.");
  if (context.tone === "suggestion") lines.push("Give a specific actionable collecting tip or strategy.");
  if (context.tone === "trivia") lines.push("Include a fun fact about Pokemon TCG collecting, sets, or cards.");
  lines.push("");

  if (context.prevItems && context.prevItems.length > 0) {
    lines.push("## Yesterday's Recommendations (vary from these)");
    context.prevItems.forEach((item, i) => {
      lines.push(`${i + 1}. "${item.quote}" — Focus: ${item.focus?.name || "none"}`);
    });
    lines.push("Vary your angle and phrasing. You MAY recommend the same set if it's genuinely the best focus, but offer a fresh perspective.");
    lines.push("");
  }

  lines.push("## Instructions");
  lines.push("Provide 3 DISTINCT recommendations. Each should focus on a DIFFERENT set and offer a unique angle.");
  lines.push("Respond with ONLY a valid JSON array (no markdown fencing, no extra text). Schema:");
  lines.push(`[`);
  lines.push(`  {`);
  lines.push(`    "quote": "1-2 sentence ${context.tone} message about their progress",`);
  lines.push(`    "focus": {`);
  lines.push(`      "setId": "exact set ID from the data above",`);
  lines.push(`      "name": "set name",`);
  lines.push(`      "reason": "1 sentence explaining why to focus here"`);
  lines.push(`    },`);
  lines.push(`    "reasoning": "2-3 sentences connecting recent activity to your suggestion"`);
  lines.push(`  },`);
  lines.push(`  ... (3 items total)`);
  lines.push(`]`);

  return lines.join("\n");
}

module.exports = { buildContext, buildPrompt, TONES };
