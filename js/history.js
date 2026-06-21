/**
 * PokéTrack — Shared history persistence API
 *
 * Loaded by both index.html and stats.html so that firebase.js can
 * call the history functions on any page.
 */
(function () {
  "use strict";

  var HISTORY_KEY = "poketrack:history:v1";
  var HISTORY_SYNCED_KEY = "poketrack:history-synced-at:v1";
  var HISTORY_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

  function loadHistory() {
    try {
      var raw = localStorage.getItem(HISTORY_KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (_) {
      return [];
    }
  }

  function saveHistory(history) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (_) { /* ignore */ }
  }

  /**
   * Append a change entry to the local history log.
   * Prunes entries older than 90 days.
   */
  window.appendHistory = function (setId, kind, from, to) {
    if (from === to) return;
    var history = loadHistory();
    history.push({ set: setId, kind: kind, from: from, to: to, at: Date.now() });
    var cutoff = Date.now() - HISTORY_MAX_AGE_MS;
    saveHistory(history.filter(function (e) { return e.at > cutoff; }));
  };

  /** Return the full local history array (read-only copy). */
  window.getLocalHistory = function () {
    return loadHistory().slice();
  };

  /** Return the timestamp of the last successful cloud sync. */
  window.getHistorySyncedAt = function () {
    try {
      return parseInt(localStorage.getItem(HISTORY_SYNCED_KEY), 10) || 0;
    } catch (_) { return 0; }
  };

  /** Update the last-synced timestamp after a successful cloud sync. */
  window.markHistorySynced = function (timestamp) {
    try {
      localStorage.setItem(HISTORY_SYNCED_KEY, String(timestamp));
    } catch (_) { /* ignore */ }
  };

  /** Merge cloud history entries into local storage (for pull from other devices). */
  window.mergeHistoryFromCloud = function (cloudEntries) {
    if (!Array.isArray(cloudEntries) || cloudEntries.length === 0) return 0;
    var local = loadHistory();
    var existing = {};
    local.forEach(function (e) { existing[e.set + "|" + e.kind + "|" + e.at] = true; });
    var added = 0;
    cloudEntries.forEach(function (e) {
      var key = e.set + "|" + e.kind + "|" + e.at;
      if (!existing[key]) {
        local.push(e);
        existing[key] = true;
        added++;
      }
    });
    if (added > 0) {
      var cutoff = Date.now() - HISTORY_MAX_AGE_MS;
      saveHistory(local.filter(function (e) { return e.at > cutoff; }));
    }
    return added;
  };

  /** Clear all history (used by reset). */
  window.clearHistory = function () {
    saveHistory([]);
    try { localStorage.removeItem(HISTORY_SYNCED_KEY); } catch (_) { /* ignore */ }
  };
})();
