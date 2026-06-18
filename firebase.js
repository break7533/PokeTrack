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
  setDoc
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
 * Merge cloud + local, taking the higher count for each (set, kind).
 * This way, signing in on a new browser won't blow away progress, and a fresh
 * device pulling cloud data won't lose anything entered locally first.
 */
function mergeCollections(local, cloud) {
  const out = {};
  const allIds = new Set([
    ...Object.keys(local || {}),
    ...Object.keys(cloud || {})
  ]);
  allIds.forEach((id) => {
    const l = (local && local[id]) || { base: 0, secret: 0 };
    const c = (cloud && cloud[id]) || { base: 0, secret: 0 };
    out[id] = {
      base: Math.max(l.base | 0, c.base | 0),
      secret: Math.max(l.secret | 0, c.secret | 0)
    };
  });
  return out;
}

function renderAuthButton(user) {
  const btn = document.getElementById("auth-btn");
  if (!btn) return;

  if (user) {
    btn.title = `Signed in as ${user.displayName || user.email} — click to sign out`;
    btn.setAttribute("aria-label", "Sign out");
    btn.classList.add("auth-btn--signed-in");
    btn.innerHTML = user.photoURL
      ? `<img src="${user.photoURL}" alt="" width="22" height="22" referrerpolicy="no-referrer" />`
      : `<span class="auth-btn__initial">${(user.displayName || user.email || "?")
          .charAt(0)
          .toUpperCase()}</span>`;
  } else {
    btn.title = "Sign in with Google to sync across devices";
    btn.setAttribute("aria-label", "Sign in with Google");
    btn.classList.remove("auth-btn--signed-in");
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M21.6 12.227c0-.708-.064-1.39-.182-2.045H12v3.868h5.39a4.604 4.604 0 0 1-1.997 3.022v2.51h3.231c1.89-1.741 2.976-4.305 2.976-7.355z"/>
        <path fill="currentColor" d="M12 22c2.7 0 4.964-.895 6.62-2.418l-3.232-2.51c-.895.6-2.04.955-3.388.955-2.605 0-4.81-1.76-5.598-4.123H3.064v2.59A9.996 9.996 0 0 0 12 22z"/>
        <path fill="currentColor" d="M6.402 13.904a6.01 6.01 0 0 1 0-3.808V7.506H3.064a10 10 0 0 0 0 8.988l3.338-2.59z"/>
        <path fill="currentColor" d="M12 5.973c1.468 0 2.786.505 3.823 1.496l2.867-2.867C16.96 3.003 14.696 2 12 2 8.09 2 4.713 4.247 3.064 7.506l3.338 2.59C7.19 7.733 9.395 5.973 12 5.973z"/>
      </svg>
      <span class="auth-btn__label">Sign in</span>
    `;
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
