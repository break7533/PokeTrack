/**
 * PokéTrack — Firebase integration
 *
 * Adds optional cloud sync on top of the existing localStorage-only tracker.
 *
 *   - Sign-in:        Google (Firebase Auth, popup flow)
 *   - Storage:        Cloud Firestore, one document per user at /users/{uid}
 *   - Offline policy: app works fully without sign-in (localStorage only).
 *                     If Firestore is blocked (ad blocker, offline, etc.) we
 *                     log a warning and keep going with local data.
 *
 * Merge strategy on sign-in:
 *   For every set we keep the HIGHER of {local, cloud} for both `base` and
 *   `secret`. This assumes users add cards over time and protects against
 *   accidental data loss when signing in on a fresh browser.
 *
 * Config:
 *   The placeholders below (e.g. `__FIREBASE_API_KEY__`) are replaced at
 *   deploy time by .github/workflows/deploy.yml using GitHub Secrets. For
 *   local development, you can temporarily hard-code the values, but DO NOT
 *   commit real keys to the repo.
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection as firestoreCollection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ---------- Config (replaced at deploy time) ----------
const firebaseConfig = {
  apiKey: "__FIREBASE_API_KEY__",
  authDomain: "__FIREBASE_AUTH_DOMAIN__",
  projectId: "__FIREBASE_PROJECT_ID__",
  storageBucket: "__FIREBASE_STORAGE_BUCKET__",
  messagingSenderId: "__FIREBASE_MESSAGING_SENDER_ID__",
  appId: "__FIREBASE_APP_ID__"
};

// Bail out gracefully if the workflow didn't run (placeholders still present).
const looksUnconfigured = Object.values(firebaseConfig).some(
  (v) => typeof v === "string" && v.startsWith("__FIREBASE_")
);

let app, auth, db, provider;
let currentUser = null;
let syncTimer = null;

if (!looksUnconfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    provider = new GoogleAuthProvider();
  } catch (err) {
    console.warn("PokéTrack: Firebase init failed — staying local-only.", err);
  }
} else {
  console.info(
    "PokéTrack: Firebase config not injected (running unbuilt). Cloud sync disabled."
  );
}

// ---------- Public API exposed to js/app.js ----------

/**
 * Debounced write of the entire collection to Firestore.
 * Called by app.js after every input change.
 *
 * @param {Record<string, { base:number, secret:number }>} collection
 */
window.syncCollectionToCloud = function (collection) {
  if (!currentUser || !db) return;
  // Debounce — typing in a number input can fire many "input" events
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    try {
      const ref = doc(db, "users", currentUser.uid);
      // Store under a stable field so we can extend the doc later (e.g. prefs)
      await setDoc(ref, { collection }, { merge: true });
    } catch (e) {
      console.warn(
        "PokéTrack: Firestore write failed (ad blocker / offline?). Local data is safe.",
        e.message || e
      );
    }
  }, 600);
};

/**
 * Wipe the user's cloud document. Called by the Reset button when the user
 * also chooses to clear cloud data.
 */
window.wipeCloudCollection = async function () {
  if (!currentUser || !db) return false;
  try {
    const ref = doc(db, "users", currentUser.uid);
    await setDoc(ref, { collection: {} }, { merge: true });
    return true;
  } catch (e) {
    console.warn("PokéTrack: Firestore wipe failed.", e.message || e);
    return false;
  }
};

/**
 * Lightweight sign-in probe used by js/app.js when deciding whether to offer
 * the "also wipe cloud?" confirm on reset. Returns true only if Firebase is
 * configured AND the user is currently signed in.
 */
window.isSignedInToCloud = function () {
  return Boolean(currentUser && db);
};

/**
 * Manual history sync — push local unsynced entries to Firestore, pull
 * entries from other devices. Returns { pushed, pulled }.
 */
window.syncHistoryToCloud = async function () {
  if (!currentUser || !db) throw new Error("Not signed in");

  const localHistory = window.getLocalHistory ? window.getLocalHistory() : [];
  const lastSynced = window.getHistorySyncedAt ? window.getHistorySyncedAt() : 0;

  // 1. Push local entries newer than last sync
  const toPush = localHistory.filter((e) => e.at > lastSynced);
  const histRef = firestoreCollection(db, "users", currentUser.uid, "history");

  if (toPush.length > 0) {
    // Use batched writes (max 500 per batch)
    for (let i = 0; i < toPush.length; i += 450) {
      const batch = writeBatch(db);
      const chunk = toPush.slice(i, i + 450);
      chunk.forEach((entry) => {
        const docRef = doc(histRef);
        batch.set(docRef, entry);
      });
      await batch.commit();
    }
  }

  // 2. Pull entries from cloud that are newer than last sync (from other devices)
  let pulled = 0;
  try {
    const q = lastSynced > 0
      ? query(histRef, where("at", ">", lastSynced), orderBy("at", "asc"))
      : query(histRef, orderBy("at", "asc"));
    const snapshot = await getDocs(q);
    const cloudEntries = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data && data.set && data.at) cloudEntries.push(data);
    });
    if (cloudEntries.length > 0 && typeof window.mergeHistoryFromCloud === "function") {
      pulled = window.mergeHistoryFromCloud(cloudEntries) || 0;
    }
  } catch (e) {
    console.warn("PokéTrack: failed to pull cloud history", e.message || e);
  }

  // 3. Mark sync timestamp
  const now = Date.now();
  if (typeof window.markHistorySynced === "function") {
    window.markHistorySynced(now);
  }

  return { pushed: toPush.length, pulled: pulled };
};

/**
 * Load full history from cloud (used by stats page).
 * Merges cloud entries into local storage and returns the combined array.
 */
window.loadHistoryFromCloud = async function () {
  if (!currentUser || !db) return [];

  try {
    const histRef = firestoreCollection(db, "users", currentUser.uid, "history");
    // Only load last 90 days
    const cutoff = Date.now() - (90 * 24 * 60 * 60 * 1000);
    const q = query(histRef, where("at", ">", cutoff), orderBy("at", "asc"));
    const snapshot = await getDocs(q);
    const cloudEntries = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data && data.set && data.at) cloudEntries.push(data);
    });
    // Merge into local
    if (cloudEntries.length > 0 && typeof window.mergeHistoryFromCloud === "function") {
      window.mergeHistoryFromCloud(cloudEntries);
    }
    return window.getLocalHistory ? window.getLocalHistory() : [];
  } catch (e) {
    console.warn("PokéTrack: failed to load cloud history", e.message || e);
    return window.getLocalHistory ? window.getLocalHistory() : [];
  }
};

// ---------- Internals ----------

async function loadFromCloud(uid) {
  if (!db) return null;
  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      // Old (illustrator-checklist-style) docs may have stored fields at the
      // top level; in this app we always nest under `collection`.
      return data.collection || null;
    }
  } catch (e) {
    console.warn(
      "PokéTrack: Firestore read failed (ad blocker / offline?). Using local data.",
      e.message || e
    );
  }
  return null;
}

/**
 * Merge cloud + local using last-write-wins per set/kind.
 * Each entry can have `baseAt` / `secretAt` timestamps. The side with the
 * more recent timestamp wins for that field. If no timestamp exists (legacy
 * data), the value is treated as infinitely old so any timestamped entry wins.
 * As a fallback (both sides lack timestamps), take the higher value to avoid
 * accidental data loss.
 */
function mergeCollections(local, cloud) {
  const out = {};
  const allIds = new Set([
    ...Object.keys(local || {}),
    ...Object.keys(cloud || {})
  ]);
  allIds.forEach((id) => {
    const l = (local && local[id]) || {};
    const c = (cloud && cloud[id]) || {};

    const lBaseAt = l.baseAt || 0;
    const cBaseAt = c.baseAt || 0;
    const lSecretAt = l.secretAt || 0;
    const cSecretAt = c.secretAt || 0;

    let base, baseAt, secret, secretAt;

    // Base: last-write-wins, fallback to max if no timestamps
    if (lBaseAt || cBaseAt) {
      if (lBaseAt >= cBaseAt) { base = l.base | 0; baseAt = lBaseAt; }
      else { base = c.base | 0; baseAt = cBaseAt; }
    } else {
      base = Math.max(l.base | 0, c.base | 0);
      baseAt = 0;
    }

    // Secret: last-write-wins, fallback to max if no timestamps
    if (lSecretAt || cSecretAt) {
      if (lSecretAt >= cSecretAt) { secret = l.secret | 0; secretAt = lSecretAt; }
      else { secret = c.secret | 0; secretAt = cSecretAt; }
    } else {
      secret = Math.max(l.secret | 0, c.secret | 0);
      secretAt = 0;
    }

    out[id] = { base, secret };
    if (baseAt) out[id].baseAt = baseAt;
    if (secretAt) out[id].secretAt = secretAt;
  });
  return out;
}

function renderAuthButton(user) {
  const btn = document.getElementById("auth-btn");
  if (!btn) return;

  // Clear existing content safely
  btn.textContent = "";

  if (user) {
    btn.title = `Signed in as ${user.displayName || user.email} — click to sign out`;
    btn.setAttribute("aria-label", "Sign out");
    btn.classList.add("auth-btn--signed-in");

    if (user.photoURL) {
      const img = document.createElement("img");
      img.src = user.photoURL;
      img.alt = "";
      img.width = 22;
      img.height = 22;
      img.referrerPolicy = "no-referrer";
      btn.appendChild(img);
    } else {
      const span = document.createElement("span");
      span.className = "auth-btn__initial";
      span.textContent = (user.displayName || user.email || "?")
        .charAt(0)
        .toUpperCase();
      btn.appendChild(span);
    }
  } else {
    btn.title = "Sign in with Google to sync across devices";
    btn.setAttribute("aria-label", "Sign in with Google");
    btn.classList.remove("auth-btn--signed-in");

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "16");
    svg.setAttribute("height", "16");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");

    const paths = [
      "M21.6 12.227c0-.708-.064-1.39-.182-2.045H12v3.868h5.39a4.604 4.604 0 0 1-1.997 3.022v2.51h3.231c1.89-1.741 2.976-4.305 2.976-7.355z",
      "M12 22c2.7 0 4.964-.895 6.62-2.418l-3.232-2.51c-.895.6-2.04.955-3.388.955-2.605 0-4.81-1.76-5.598-4.123H3.064v2.59A9.996 9.996 0 0 0 12 22z",
      "M6.402 13.904a6.01 6.01 0 0 1 0-3.808V7.506H3.064a10 10 0 0 0 0 8.988l3.338-2.59z",
      "M12 5.973c1.468 0 2.786.505 3.823 1.496l2.867-2.867C16.96 3.003 14.696 2 12 2 8.09 2 4.713 4.247 3.064 7.506l3.338 2.59C7.19 7.733 9.395 5.973 12 5.973z"
    ];
    paths.forEach((d) => {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("fill", "currentColor");
      path.setAttribute("d", d);
      svg.appendChild(path);
    });
    btn.appendChild(svg);

    const label = document.createElement("span");
    label.className = "auth-btn__label";
    label.textContent = "Sign in";
    btn.appendChild(label);
  }
}

function bindAuthButton() {
  const btn = document.getElementById("auth-btn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    if (!auth || !provider) {
      alert(
        "Cloud sync is not configured for this deployment. " +
          "Your data is still being saved locally in this browser."
      );
      return;
    }
    try {
      if (currentUser) {
        await signOut(auth);
      } else {
        await signInWithPopup(auth, provider);
      }
    } catch (e) {
      // Popup-closed-by-user is benign; everything else gets surfaced.
      if (e && e.code !== "auth/popup-closed-by-user") {
        console.error("PokéTrack: auth failed", e);
        alert("Sign-in failed: " + (e.message || e.code || "unknown error"));
      }
    }
  });
}

// ---------- Auth state listener ----------

if (auth) {
  onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    renderAuthButton(user);

    if (!user) return;

    const cloud = await loadFromCloud(user.uid);
    const local = window.getLocalCollection ? window.getLocalCollection() : null;
    const merged = mergeCollections(local, cloud);

    if (typeof window.applyCloudCollection === "function") {
      window.applyCloudCollection(merged);
    }
    // Push the merged result back up so cloud and local match after sign-in.
    if (typeof window.syncCollectionToCloud === "function") {
      window.syncCollectionToCloud(merged);
    }
  });
}

// ---------- Boot ----------

document.addEventListener("DOMContentLoaded", () => {
  renderAuthButton(null);
  bindAuthButton();
});
