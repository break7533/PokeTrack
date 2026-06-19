/**
 * PokéTrack — main application logic
 *
 * Responsibilities:
 *   - Render eras and their sets from POKEMON_TCG_ERAS (js/sets.js)
 *   - Persist user-entered collection counts in localStorage
 *   - Recompute per-set, per-era, and overall progress on every change
 *   - Toggle visibility of secret rows globally and entire era sections
 *   - Toggle light / dark theme
 *   - Validate input (non-negative integers, capped at the set's total)
 *   - Optionally sync to Firestore via the window.* hooks defined by
 *     firebase.js (no-op if firebase.js failed to init or isn't loaded)
 */
(function () {
  "use strict";

  // ---------- Constants ----------

  const STORAGE_KEY = "poketrack:v1";
  const ERA_COLLAPSED_KEY = "poketrack:collapsed-eras:v1";
  const SHOW_SECRETS_KEY = "poketrack:show-secrets:v1";
  const THEME_KEY = "poketrack:theme:v1";

  // ---------- State ----------

  /** @type {Record<string, { base: number, secret: number }>} */
  let collection = loadCollection();
  /** @type {Set<string>} */
  let collapsedEras = loadStringSet(ERA_COLLAPSED_KEY);

  // When firebase.js pushes a merged cloud snapshot back into us, we don't
  // want each per-set value-write to re-trigger a cloud sync. This flag lets
  // us suppress that round-trip.
  let applyingCloudSnapshot = false;

  // ---------- Persistence ----------

  function loadCollection() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (err) {
      console.warn("PokéTrack: failed to read saved collection", err);
      return {};
    }
  }

  function saveCollection() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
    } catch (err) {
      console.warn("PokéTrack: failed to save collection", err);
    }
  }

  function loadStringSet(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return new Set();
      const arr = JSON.parse(raw);
      return new Set(Array.isArray(arr) ? arr : []);
    } catch (err) {
      console.warn("PokéTrack: failed to read", key, err);
      return new Set();
    }
  }

  function saveStringSet(key, set) {
    try {
      localStorage.setItem(key, JSON.stringify(Array.from(set)));
    } catch (err) {
      console.warn("PokéTrack: failed to save", key, err);
    }
  }

  function loadBool(key) {
    try {
      return localStorage.getItem(key) === "1";
    } catch (_) {
      return false;
    }
  }

  function saveBool(key, value) {
    try {
      localStorage.setItem(key, value ? "1" : "0");
    } catch (_) { /* ignore */ }
  }

  // ---------- Helpers ----------

  function clamp(value, min, max) {
    if (Number.isNaN(value)) return min;
    return Math.max(min, Math.min(max, value));
  }

  function getCollected(setId) {
    const entry = collection[setId];
    return {
      base: entry && Number.isFinite(entry.base) ? entry.base : 0,
      secret: entry && Number.isFinite(entry.secret) ? entry.secret : 0
    };
  }

  function setCollected(setId, kind, value) {
    if (!collection[setId]) collection[setId] = { base: 0, secret: 0 };
    collection[setId][kind] = value;
    saveCollection();
    // Cloud sync hook — no-op if firebase.js isn't loaded or user is signed out.
    // Skipped while we're applying a cloud snapshot to avoid an echo write.
    if (!applyingCloudSnapshot && typeof window.syncCollectionToCloud === "function") {
      window.syncCollectionToCloud(collection);
    }
  }

  function percent(collected, total) {
    if (!total || total <= 0) return 0;
    return Math.round((collected / total) * 100);
  }

  // ---------- Rendering ----------

  function render() {
    const container = document.getElementById("eras-container");
    const eraTemplate = document.getElementById("era-template");
    const setTemplate = document.getElementById("set-template");

    if (!container || !eraTemplate || !setTemplate) return;
    container.innerHTML = "";

    POKEMON_TCG_ERAS.forEach((era) => {
      const eraNode = eraTemplate.content.firstElementChild.cloneNode(true);
      eraNode.dataset.eraId = era.id;
      eraNode.querySelector(".era__name").textContent = era.name;

      const toggleBtn = eraNode.querySelector(".era__toggle");
      const isCollapsed = collapsedEras.has(era.id);
      if (isCollapsed) {
        eraNode.classList.add("era--collapsed");
        toggleBtn.setAttribute("aria-expanded", "false");
      }

      toggleBtn.addEventListener("click", () => {
        const nowCollapsed = !eraNode.classList.contains("era--collapsed");
        eraNode.classList.toggle("era--collapsed", nowCollapsed);
        toggleBtn.setAttribute("aria-expanded", String(!nowCollapsed));
        if (nowCollapsed) collapsedEras.add(era.id);
        else collapsedEras.delete(era.id);
        saveStringSet(ERA_COLLAPSED_KEY, collapsedEras);
      });

      const list = eraNode.querySelector(".set-list");
      era.sets.forEach((set) => list.appendChild(buildSetNode(set, setTemplate)));

      container.appendChild(eraNode);
    });

    updateAllProgress();
  }

  function buildSetNode(set, setTemplate) {
    const node = setTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.setId = set.id;
    node.querySelector(".set__name").textContent = set.name;

    const collected = getCollected(set.id);
    const hasSecret = set.secret > 0;

    // Mark sets that have no secret cards so the global "Show secrets"
    // toggle (driven by the .show-secrets class on <html>) won't reveal
    // an empty row for them.
    if (!hasSecret) {
      node.classList.add("set--no-secret");
    }

    // ----- Base row -----
    const baseInput = node.querySelector(".set__input--base");
    const baseTotal = node.querySelector(".set__total--base");
    baseInput.max = String(set.base);
    baseInput.value = String(collected.base);
    baseTotal.textContent = String(set.base);

    baseInput.addEventListener("input", () => {
      const value = clamp(parseInt(baseInput.value, 10), 0, set.base);
      if (String(value) !== baseInput.value) baseInput.value = String(value);
      setCollected(set.id, "base", value);
      updateSetProgress(node, set);
      updateEraProgress(node.closest(".era"));
      updateOverallProgress();
    });

    // ----- Secret row -----
    const secretRow = node.querySelector(".set__row--secret");
    const secretInput = node.querySelector(".set__input--secret");
    const secretTotal = node.querySelector(".set__total--secret");

    if (hasSecret) {
      secretInput.max = String(set.secret);
      secretInput.value = String(collected.secret);
      secretTotal.textContent = String(set.secret);

      secretInput.addEventListener("input", () => {
        const value = clamp(parseInt(secretInput.value, 10), 0, set.secret);
        if (String(value) !== secretInput.value) secretInput.value = String(value);
        setCollected(set.id, "secret", value);
        updateSetProgress(node, set);
        updateEraProgress(node.closest(".era"));
        updateOverallProgress();
      });
    } else {
      // No secrets for this set — strip the secret row entirely so it
      // can never be revealed by the global toggle.
      secretRow.remove();
    }

    return node;
  }

  // ---------- Progress updates ----------

  function updateSetProgress(node, set) {
    const collected = getCollected(set.id);

    const basePct = percent(collected.base, set.base);
    const baseBar = node.querySelector(".progress-bar__fill--base");
    baseBar.style.width = basePct + "%";
    baseBar.parentElement.setAttribute("aria-valuenow", String(basePct));
    node.querySelector(".set__percent--base").textContent = basePct + "%";
    setBarTint(baseBar, basePct);

    if (set.secret > 0) {
      const secretPct = percent(collected.secret, set.secret);
      const secretBar = node.querySelector(".progress-bar__fill--secret");
      if (secretBar) {
        secretBar.style.width = secretPct + "%";
        secretBar.parentElement.setAttribute("aria-valuenow", String(secretPct));
        node.querySelector(".set__percent--secret").textContent = secretPct + "%";
        setBarTint(secretBar, secretPct);
      }
    }
  }

  function updateEraProgress(eraNode) {
    if (!eraNode) return;
    const eraId = eraNode.dataset.eraId;
    const era = POKEMON_TCG_ERAS.find((e) => e.id === eraId);
    if (!era) return;

    let baseCollected = 0;
    let baseTotal = 0;
    let secretCollected = 0;
    let secretTotal = 0;

    era.sets.forEach((set) => {
      const c = getCollected(set.id);
      baseCollected += Math.min(c.base, set.base);
      baseTotal += set.base;
      secretCollected += Math.min(c.secret, set.secret);
      secretTotal += set.secret;
    });

    eraNode.querySelector(".era__summary-base").textContent =
      `${baseCollected} / ${baseTotal} base (${percent(baseCollected, baseTotal)}%)`;
    eraNode.querySelector(".era__summary-secret").textContent =
      secretTotal > 0
        ? `${secretCollected} / ${secretTotal} secret (${percent(secretCollected, secretTotal)}%)`
        : "no secrets";
  }

  function updateOverallProgress() {
    let baseCollected = 0;
    let baseTotal = 0;
    let secretCollected = 0;
    let secretTotal = 0;

    POKEMON_TCG_ERAS.forEach((era) => {
      era.sets.forEach((set) => {
        const c = getCollected(set.id);
        baseCollected += Math.min(c.base, set.base);
        baseTotal += set.base;
        secretCollected += Math.min(c.secret, set.secret);
        secretTotal += set.secret;
      });
    });

    setStatCard("base", baseCollected, baseTotal);
    setStatCard("secret", secretCollected, secretTotal);
    setStatCard(
      "total",
      baseCollected + secretCollected,
      baseTotal + secretTotal
    );
  }

  function setStatCard(kind, collected, total) {
    const pct = percent(collected, total);
    const collectedEl = document.getElementById(`overall-${kind}-collected`);
    const totalEl = document.getElementById(`overall-${kind}-total`);
    const barEl = document.getElementById(`overall-${kind}-bar`);
    const percentEl = document.getElementById(`overall-${kind}-percent`);
    if (collectedEl) collectedEl.textContent = String(collected);
    if (totalEl) totalEl.textContent = String(total);
    if (barEl) {
      barEl.style.width = pct + "%";
      barEl.parentElement.setAttribute("aria-valuenow", String(pct));
      setBarTint(barEl, pct);
    }
    if (percentEl) percentEl.textContent = String(pct);
  }

  function updateAllProgress() {
    document.querySelectorAll(".set").forEach((node) => {
      const setId = node.dataset.setId;
      const set = findSet(setId);
      if (set) updateSetProgress(node, set);
    });
    document.querySelectorAll(".era").forEach(updateEraProgress);
    updateOverallProgress();
  }

  /**
   * Refresh the value attribute of every visible input from current state.
   * Used after a cloud snapshot is applied so the user sees the merged numbers
   * without us having to fully re-render (which would lose focus on inputs).
   */
  function refreshAllInputs() {
    document.querySelectorAll(".set").forEach((node) => {
      const setId = node.dataset.setId;
      const set = findSet(setId);
      if (!set) return;
      const collected = getCollected(setId);
      const baseInput = node.querySelector(".set__input--base");
      if (baseInput && document.activeElement !== baseInput) {
        baseInput.value = String(collected.base);
      }
      if (set.secret > 0) {
        const secretInput = node.querySelector(".set__input--secret");
        if (secretInput && document.activeElement !== secretInput) {
          secretInput.value = String(collected.secret);
        }
      }
    });
  }

  function findSet(setId) {
    for (const era of POKEMON_TCG_ERAS) {
      const found = era.sets.find((s) => s.id === setId);
      if (found) return found;
    }
    return null;
  }

  function setBarTint(barEl, pct) {
    // Adds a class so CSS can color-code progress (red → yellow → green)
    barEl.classList.remove("progress-bar__fill--low", "progress-bar__fill--mid", "progress-bar__fill--high", "progress-bar__fill--complete");
    if (pct >= 100) barEl.classList.add("progress-bar__fill--complete");
    else if (pct >= 67) barEl.classList.add("progress-bar__fill--high");
    else if (pct >= 34) barEl.classList.add("progress-bar__fill--mid");
    else barEl.classList.add("progress-bar__fill--low");
  }

  // ---------- Sticky header sizing ----------

  /**
   * The header is position: fixed. Reserve space for it on <body> via a
   * CSS variable so the first era card isn't hidden underneath it.
   * Re-measure on resize and whenever the header's own size changes
   * (e.g. when buttons wrap to a new row on narrow viewports).
   */
  function setupHeaderHeightVar() {
    const header = document.querySelector(".site-header");
    if (!header) return;

    const apply = () => {
      const h = header.getBoundingClientRect().height;
      document.documentElement.style.setProperty("--site-header-height", h + "px");
    };

    apply();
    window.addEventListener("resize", apply);
    if (typeof ResizeObserver !== "undefined") {
      new ResizeObserver(apply).observe(header);
    }
  }

  // ---------- Theme & secret-row toggles ----------

  function bindThemeToggle() {
    const btn = document.getElementById("theme-btn");
    if (!btn) return;

    const iconEl = btn.querySelector(".icon-btn__icon");
    const sync = () => {
      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      btn.setAttribute("aria-pressed", String(isDark));
      btn.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
      btn.setAttribute("title", isDark ? "Switch to light mode" : "Switch to dark mode");
      if (iconEl) iconEl.textContent = isDark ? "☀️" : "🌙";
    };
    sync();

    btn.addEventListener("click", () => {
      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      if (isDark) {
        document.documentElement.removeAttribute("data-theme");
        try { localStorage.setItem(THEME_KEY, "light"); } catch (_) { /* ignore */ }
      } else {
        document.documentElement.setAttribute("data-theme", "dark");
        try { localStorage.setItem(THEME_KEY, "dark"); } catch (_) { /* ignore */ }
      }
      sync();
    });
  }

  function bindShowSecretsToggle() {
    const btn = document.getElementById("show-secrets-btn");
    if (!btn) return;

    // The initial state was already applied to <html> by the inline
    // pre-paint script in index.html, but read it back so the button
    // label / aria-pressed are correct.
    const sync = () => {
      const on = document.documentElement.classList.contains("show-secrets");
      btn.setAttribute("aria-pressed", String(on));
      btn.textContent = on ? "Hide secret rows" : "Show secret rows";
    };
    sync();

    btn.addEventListener("click", () => {
      const on = !document.documentElement.classList.contains("show-secrets");
      document.documentElement.classList.toggle("show-secrets", on);
      saveBool(SHOW_SECRETS_KEY, on);
      sync();
    });
  }

  // ---------- Header actions ----------

  function bindHeaderActions() {
    const expandBtn = document.getElementById("expand-all-btn");
    const collapseBtn = document.getElementById("collapse-all-btn");
    const resetBtn = document.getElementById("reset-btn");

    if (expandBtn) {
      expandBtn.addEventListener("click", () => {
        collapsedEras.clear();
        saveStringSet(ERA_COLLAPSED_KEY, collapsedEras);
        document.querySelectorAll(".era").forEach((eraNode) => {
          eraNode.classList.remove("era--collapsed");
          const btn = eraNode.querySelector(".era__toggle");
          if (btn) btn.setAttribute("aria-expanded", "true");
        });
      });
    }

    if (collapseBtn) {
      collapseBtn.addEventListener("click", () => {
        POKEMON_TCG_ERAS.forEach((era) => collapsedEras.add(era.id));
        saveStringSet(ERA_COLLAPSED_KEY, collapsedEras);
        document.querySelectorAll(".era").forEach((eraNode) => {
          eraNode.classList.add("era--collapsed");
          const btn = eraNode.querySelector(".era__toggle");
          if (btn) btn.setAttribute("aria-expanded", "false");
        });
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", async () => {
        const confirmed = window.confirm(
          "Reset all collection data? This will clear every saved count and cannot be undone."
        );
        if (!confirmed) return;

        // If signed in, also offer to wipe the cloud copy. Default: yes,
        // because otherwise the next page-load would re-pull the cloud data
        // and "un-reset" everything.
        let alsoWipeCloud = false;
        if (typeof window.wipeCloudCollection === "function" &&
            typeof window.isSignedInToCloud === "function" &&
            window.isSignedInToCloud()) {
          alsoWipeCloud = window.confirm(
            "You're signed in. Also delete the cloud copy of your collection?\n\n" +
            "OK = delete cloud data too (recommended)\n" +
            "Cancel = keep cloud data (it will sync back on next sign-in)"
          );
        }

        collection = {};
        saveCollection();
        render();

        if (alsoWipeCloud) {
          try { await window.wipeCloudCollection(); } catch (_) { /* surfaced in firebase.js */ }
        }
      });
    }
  }

  // ---------- Cloud-sync bridge (called by firebase.js) ----------

  /** Read-only accessor for the in-memory collection. */
  window.getLocalCollection = function () {
    // Return a shallow copy so callers can't mutate our state by accident
    const out = {};
    Object.keys(collection).forEach((k) => {
      const v = collection[k] || {};
      out[k] = { base: v.base | 0, secret: v.secret | 0 };
    });
    return out;
  };

  /**
   * Replace local state with the merged cloud+local snapshot from firebase.js,
   * persist to localStorage, and refresh the UI without a full re-render.
   *
   * @param {Record<string, { base:number, secret:number }>} merged
   */
  window.applyCloudCollection = function (merged) {
    if (!merged || typeof merged !== "object") return;
    applyingCloudSnapshot = true;
    try {
      collection = {};
      Object.keys(merged).forEach((k) => {
        const v = merged[k] || {};
        collection[k] = { base: v.base | 0, secret: v.secret | 0 };
      });
      saveCollection();
      refreshAllInputs();
      updateAllProgress();
    } finally {
      applyingCloudSnapshot = false;
    }
  };

  // ---------- Boot ----------

  document.addEventListener("DOMContentLoaded", () => {
    if (typeof POKEMON_TCG_ERAS === "undefined") {
      console.error("PokéTrack: set data (js/sets.js) failed to load.");
      const container = document.getElementById("eras-container");
      if (container) {
        container.innerHTML =
          '<p class="error">Could not load Pokémon TCG set data. Please refresh the page.</p>';
      }
      return;
    }
    setupHeaderHeightVar();
    bindThemeToggle();
    bindShowSecretsToggle();
    render();
    bindHeaderActions();
  });
})();
