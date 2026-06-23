/**
 * PokéTrack — Statistics page logic
 *
 * Reads collection data from localStorage, computes per-set/era/overall
 * statistics, and renders Chart.js charts + HTML tables.
 */
(function () {
  "use strict";

  const STORAGE_KEY = "poketrack:v1";
  const THEME_KEY = "poketrack:theme:v1";

  // ---------- Data loading ----------

  function loadCollection() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (err) {
      console.warn("PokéTrack Stats: failed to read collection", err);
      return {};
    }
  }

  function getCollected(collection, setId) {
    const entry = collection[setId];
    return {
      base: entry && Number.isFinite(entry.base) ? entry.base : 0,
      secret: entry && Number.isFinite(entry.secret) ? entry.secret : 0
    };
  }

  function percent(collected, total) {
    if (!total || total <= 0) return 0;
    return Math.round((collected / total) * 100);
  }

  // ---------- Stats computation ----------

  function computeStats(collection) {
    let overallBase = 0, overallBaseTotal = 0;
    let overallSecret = 0, overallSecretTotal = 0;
    let setsComplete = 0, setsStarted = 0, setsUntouched = 0;

    const eras = POKEMON_TCG_ERAS.map((era) => {
      let eraBase = 0, eraBaseTotal = 0;
      let eraSecret = 0, eraSecretTotal = 0;

      const sets = era.sets.map((set) => {
        const c = getCollected(collection, set.id);
        const baseCollected = Math.min(c.base, set.base);
        const secretCollected = Math.min(c.secret, set.secret);
        const totalCollected = baseCollected + secretCollected;
        const totalCards = set.base + set.secret;

        eraBase += baseCollected;
        eraBaseTotal += set.base;
        eraSecret += secretCollected;
        eraSecretTotal += set.secret;

        const basePct = percent(baseCollected, set.base);
        const secretPct = percent(secretCollected, set.secret);
        const totalPct = percent(totalCollected, totalCards);

        const isComplete = basePct >= 100 && (set.secret === 0 || secretPct >= 100);
        const isStarted = totalCollected > 0;

        if (isComplete) setsComplete++;
        else if (isStarted) setsStarted++;
        else setsUntouched++;

        return {
          id: set.id,
          name: set.name,
          baseCollected,
          baseTotal: set.base,
          basePct,
          secretCollected,
          secretTotal: set.secret,
          secretPct,
          totalCollected,
          totalCards,
          totalPct,
          isComplete,
          isStarted
        };
      });

      overallBase += eraBase;
      overallBaseTotal += eraBaseTotal;
      overallSecret += eraSecret;
      overallSecretTotal += eraSecretTotal;

      return {
        id: era.id,
        name: era.name,
        sets,
        baseCollected: eraBase,
        baseTotal: eraBaseTotal,
        basePct: percent(eraBase, eraBaseTotal),
        secretCollected: eraSecret,
        secretTotal: eraSecretTotal,
        secretPct: percent(eraSecret, eraSecretTotal),
        totalCollected: eraBase + eraSecret,
        totalCards: eraBaseTotal + eraSecretTotal,
        totalPct: percent(eraBase + eraSecret, eraBaseTotal + eraSecretTotal)
      };
    });

    // Find best era
    let bestEra = eras[0];
    eras.forEach((e) => {
      if (e.totalPct > bestEra.totalPct) bestEra = e;
    });

    return {
      overall: {
        baseCollected: overallBase,
        baseTotal: overallBaseTotal,
        basePct: percent(overallBase, overallBaseTotal),
        secretCollected: overallSecret,
        secretTotal: overallSecretTotal,
        secretPct: percent(overallSecret, overallSecretTotal),
        totalCollected: overallBase + overallSecret,
        totalCards: overallBaseTotal + overallSecretTotal,
        totalPct: percent(overallBase + overallSecret, overallBaseTotal + overallSecretTotal)
      },
      eras,
      milestones: {
        complete: setsComplete,
        started: setsStarted,
        untouched: setsUntouched,
        bestEra: bestEra ? bestEra.name : "—"
      }
    };
  }

  // ---------- Theme ----------

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
      // Re-render charts with new theme colours
      renderCharts(currentStats);
    });
  }

  // ---------- Rendering: Summary cards ----------

  function renderSummary(stats) {
    const o = stats.overall;

    setText("stat-base-collected", o.baseCollected);
    setText("stat-base-total", o.baseTotal);
    setText("stat-base-percent", o.basePct);
    setBar("stat-base-bar", o.basePct);

    setText("stat-secret-collected", o.secretCollected);
    setText("stat-secret-total", o.secretTotal);
    setText("stat-secret-percent", o.secretPct);
    setBar("stat-secret-bar", o.secretPct);

    setText("stat-total-collected", o.totalCollected);
    setText("stat-total-total", o.totalCards);
    setText("stat-total-percent", o.totalPct);
    setBar("stat-total-bar", o.totalPct);

    // Milestones
    setText("milestone-complete", stats.milestones.complete);
    setText("milestone-started", stats.milestones.started);
    setText("milestone-untouched", stats.milestones.untouched);
    setText("milestone-best-era", stats.milestones.bestEra);
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = String(value);
  }

  function setBar(id, pct) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.width = pct + "%";
    el.parentElement.setAttribute("aria-valuenow", String(pct));
    // Tint
    el.classList.remove("progress-bar__fill--low", "progress-bar__fill--mid", "progress-bar__fill--high", "progress-bar__fill--complete");
    if (pct >= 100) el.classList.add("progress-bar__fill--complete");
    else if (pct >= 67) el.classList.add("progress-bar__fill--high");
    else if (pct >= 34) el.classList.add("progress-bar__fill--mid");
    else el.classList.add("progress-bar__fill--low");
  }

  // ---------- Rendering: Charts ----------

  let doughnutChart = null;
  let eraBarChart = null;
  let currentStats = null;

  function getThemeColors() {
    const style = getComputedStyle(document.documentElement);
    return {
      text: style.getPropertyValue("--color-text").trim(),
      textMuted: style.getPropertyValue("--color-text-muted").trim(),
      border: style.getPropertyValue("--color-border").trim(),
      surface: style.getPropertyValue("--color-surface").trim(),
      yellow: style.getPropertyValue("--color-yellow").trim(),
      red: style.getPropertyValue("--color-red").trim(),
      blue: style.getPropertyValue("--color-blue").trim(),
      progressHigh: style.getPropertyValue("--progress-high").trim(),
      progressTrack: style.getPropertyValue("--progress-track").trim()
    };
  }

  function renderCharts(stats) {
    const colors = getThemeColors();
    renderDoughnutChart(stats, colors);
    renderEraBarChart(stats, colors);
  }

  function renderDoughnutChart(stats, colors) {
    const ctx = document.getElementById("chart-overall-doughnut");
    if (!ctx) return;

    const collected = stats.overall.totalCollected;
    const remaining = stats.overall.totalCards - collected;

    const data = {
      labels: ["Collected", "Remaining"],
      datasets: [{
        data: [collected, remaining],
        backgroundColor: [colors.progressHigh, colors.progressTrack],
        borderColor: [colors.progressHigh, colors.progressTrack],
        borderWidth: 1,
        hoverOffset: 4
      }]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: true,
      cutout: "65%",
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              const pct = percent(ctx.raw, stats.overall.totalCards);
              return ctx.label + ": " + ctx.raw.toLocaleString() + " (" + pct + "%)";
            }
          }
        }
      }
    };

    if (doughnutChart) {
      doughnutChart.data = data;
      doughnutChart.options = options;
      doughnutChart.update();
    } else {
      doughnutChart = new Chart(ctx, { type: "doughnut", data, options });
    }
  }

  function renderEraBarChart(stats, colors) {
    const ctx = document.getElementById("chart-era-bars");
    if (!ctx) return;

    const labels = stats.eras.map((e) => e.name);
    const baseData = stats.eras.map((e) => e.basePct);
    const secretData = stats.eras.map((e) => e.secretPct);

    const data = {
      labels,
      datasets: [
        {
          label: "Base %",
          data: baseData,
          backgroundColor: colors.yellow + "CC",
          borderColor: colors.yellow,
          borderWidth: 1,
          borderRadius: 3
        },
        {
          label: "Secret %",
          data: secretData,
          backgroundColor: colors.red + "AA",
          borderColor: colors.red,
          borderWidth: 1,
          borderRadius: 3
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "y",
      scales: {
        x: {
          beginAtZero: true,
          max: 100,
          ticks: {
            color: colors.textMuted,
            callback: (v) => v + "%"
          },
          grid: { color: colors.border + "44" }
        },
        y: {
          ticks: { color: colors.text, font: { size: 11 } },
          grid: { display: false }
        }
      },
      plugins: {
        legend: {
          labels: { color: colors.text, padding: 16 }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ctx.dataset.label + ": " + ctx.raw + "%"
          }
        }
      }
    };

    if (eraBarChart) {
      eraBarChart.data = data;
      eraBarChart.options = options;
      eraBarChart.update();
    } else {
      eraBarChart = new Chart(ctx, { type: "bar", data, options });
    }
  }

  // ---------- Rendering: Era detail tables ----------

  function renderEraDetails(stats) {
    const container = document.getElementById("era-details");
    if (!container) return;

    // Keep the section title
    const title = container.querySelector(".stats-section__title");
    container.innerHTML = "";
    if (title) container.appendChild(title);

    stats.eras.forEach((era) => {
      const section = document.createElement("div");
      section.className = "era-detail";
      section.dataset.eraId = era.id;

      // Header
      const header = document.createElement("div");
      header.className = "era-detail__header";

      const name = document.createElement("h3");
      name.className = "era-detail__name";
      name.textContent = era.name;

      const pctEl = document.createElement("span");
      pctEl.className = "era-detail__percent " + pctColorClass(era.totalPct);
      pctEl.textContent = era.totalPct + "% complete";

      header.appendChild(name);
      header.appendChild(pctEl);
      section.appendChild(header);

      // Era summary line
      const summary = document.createElement("div");
      summary.className = "era-detail__summary";
      summary.innerHTML =
        `<span>${era.baseCollected.toLocaleString()} / ${era.baseTotal.toLocaleString()} base</span>` +
        `<span class="era-detail__summary-sep">·</span>` +
        (era.secretTotal > 0
          ? `<span>${era.secretCollected.toLocaleString()} / ${era.secretTotal.toLocaleString()} secret</span><span class="era-detail__summary-sep">·</span>`
          : "") +
        `<span>${era.totalCollected.toLocaleString()} / ${era.totalCards.toLocaleString()} total</span>`;
      section.appendChild(summary);

      // Table
      const table = document.createElement("table");
      table.className = "era-detail__table";

      const thead = document.createElement("thead");
      thead.innerHTML = `<tr>
        <th>Set</th>
        <th class="hide-mobile">Base</th>
        <th>Base %</th>
        <th class="hide-mobile">Secret</th>
        <th>Secret %</th>
        <th>Total</th>
      </tr>`;
      table.appendChild(thead);

      // Sort sets by total completion (highest first)
      const sortedSets = era.sets.slice().sort((a, b) => b.totalPct - a.totalPct);

      const tbody = document.createElement("tbody");
      sortedSets.forEach((set) => {
        const tr = document.createElement("tr");
        if (set.isComplete) tr.dataset.status = "complete";
        else if (set.totalPct >= 90) tr.dataset.status = "almost";
        else if (set.isStarted) tr.dataset.status = "started";
        else tr.dataset.status = "untouched";

        const barColor = getBarColor(set.totalPct);

        tr.innerHTML = `
          <td>${escapeHtml(set.name)}</td>
          <td class="hide-mobile">${set.baseCollected} / ${set.baseTotal}</td>
          <td class="${pctColorClass(set.basePct)}" data-detail="${set.baseCollected} / ${set.baseTotal}" tabindex="0">${set.basePct}%</td>
          <td class="hide-mobile">${set.secretTotal > 0 ? set.secretCollected + " / " + set.secretTotal : "—"}</td>
          <td class="${set.secretTotal > 0 ? pctColorClass(set.secretPct) : ""}" ${set.secretTotal > 0 ? 'data-detail="' + set.secretCollected + ' / ' + set.secretTotal + '" tabindex="0"' : ''}>${set.secretTotal > 0 ? set.secretPct + "%" : "—"}</td>
          <td class="era-detail__total-cell" data-detail="${set.totalCollected} / ${set.totalCards}" tabindex="0">
            <strong class="${pctColorClass(set.totalPct)}">${set.totalPct}%</strong>
            <span class="mini-bar"><span class="mini-bar__fill" style="width:${set.totalPct}%;background:${barColor}"></span></span>
          </td>
        `;
        tbody.appendChild(tr);
      });

      table.appendChild(tbody);
      section.appendChild(table);
      container.appendChild(section);
    });
  }

  function pctColorClass(pct) {
    if (pct >= 100) return "pct--complete";
    if (pct >= 90) return "pct--almost";
    if (pct >= 67) return "pct--high";
    if (pct >= 34) return "pct--mid";
    if (pct > 0) return "pct--low";
    return "pct--zero";
  }

  function getBarColor(pct) {
    if (pct >= 100) return "var(--progress-complete)";
    if (pct >= 67) return "var(--progress-high)";
    if (pct >= 34) return "var(--progress-mid)";
    return "var(--progress-low)";
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ---------- Header height ----------

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

  // ---------- Growth section ----------

  let growthChart = null;
  let currentRange = 7; // default to 7 days
  let historyData = [];

  function filterHistoryByRange(history, days) {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    return history.filter((e) => e.at > cutoff);
  }

  function localDateKey(ts) {
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function computeGrowth(history, range) {
    // Net cards added
    let net = 0;
    history.forEach((e) => { net += (e.to - e.from); });

    // Per-day buckets (local dates so midnight-ish entries land on the
    // correct day from the user's perspective)
    const dayMap = {};
    history.forEach((e) => {
      const day = localDateKey(e.at);
      dayMap[day] = (dayMap[day] || 0) + (e.to - e.from);
    });

    // Always show exactly `range` days ending today (local)
    const days = [];
    const values = [];
    const now = new Date();
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = localDateKey(d.getTime());
      days.push(key);
      values.push(dayMap[key] || 0);
    }

    // Top movers (group by set)
    const setMap = {};
    history.forEach((e) => {
      if (!setMap[e.set]) setMap[e.set] = { base: 0, secret: 0 };
      setMap[e.set][e.kind] += (e.to - e.from);
    });
    const movers = Object.keys(setMap).map((id) => ({
      id,
      name: getSetName(id),
      base: setMap[id].base,
      secret: setMap[id].secret,
      total: setMap[id].base + setMap[id].secret
    }));
    movers.sort((a, b) => Math.abs(b.total) - Math.abs(a.total));

    return { net, days, values, movers: movers.slice(0, 10) };
  }

  function getSetName(setId) {
    for (const era of POKEMON_TCG_ERAS) {
      const found = era.sets.find((s) => s.id === setId);
      if (found) return found.name;
    }
    return setId;
  }

  function renderGrowth(history, range) {
    const filtered = filterHistoryByRange(history, range);
    const growth = computeGrowth(filtered, range);
    const colors = getThemeColors();

    renderGrowthSummary(growth);
    renderGrowthChart(growth, colors);
    renderGrowthMovers(growth);
    renderGrowthNote(history);
  }

  function renderGrowthSummary(growth) {
    const valueEl = document.getElementById("growth-value");
    if (!valueEl) return;

    const prefix = growth.net > 0 ? "+" : "";
    valueEl.textContent = prefix + growth.net;
    valueEl.classList.remove("growth-summary__value--positive", "growth-summary__value--negative", "growth-summary__value--zero");
    if (growth.net > 0) valueEl.classList.add("growth-summary__value--positive");
    else if (growth.net < 0) valueEl.classList.add("growth-summary__value--negative");
    else valueEl.classList.add("growth-summary__value--zero");
  }

  function renderGrowthChart(growth, colors) {
    const ctx = document.getElementById("chart-growth");
    if (!ctx) return;

    if (growth.days.length === 0) {
      // No data — hide chart, show empty message
      ctx.style.display = "none";
      const container = ctx.closest(".chart-container--growth");
      if (container && !container.querySelector(".growth-empty")) {
        const msg = document.createElement("p");
        msg.className = "growth-empty";
        msg.textContent = "No activity recorded yet. Changes will appear here as you update your collection.";
        container.appendChild(msg);
      }
      return;
    }

    ctx.style.display = "";
    // Remove any empty message
    const emptyMsg = ctx.closest(".chart-container--growth").querySelector(".growth-empty");
    if (emptyMsg) emptyMsg.remove();

    // Format labels as shorter dates
    const labels = growth.days.map((d) => {
      const date = new Date(d + "T00:00:00");
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    });

    const barColors = growth.values.map((v) => v >= 0 ? colors.progressHigh + "CC" : colors.red + "CC");
    const borderColors = growth.values.map((v) => v >= 0 ? colors.progressHigh : colors.red);

    const data = {
      labels,
      datasets: [{
        label: "Cards added",
        data: growth.values,
        backgroundColor: barColors,
        borderColor: borderColors,
        borderWidth: 1,
        borderRadius: 3
      }]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: { color: colors.textMuted, font: { size: 10 }, maxRotation: 45 },
          grid: { display: false }
        },
        y: {
          beginAtZero: true,
          ticks: { color: colors.textMuted, precision: 0 },
          grid: { color: colors.border + "44" }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const v = ctx.raw;
              return (v >= 0 ? "+" : "") + v + " cards";
            }
          }
        }
      }
    };

    if (growthChart) {
      growthChart.data = data;
      growthChart.options = options;
      growthChart.update();
    } else {
      growthChart = new Chart(ctx, { type: "bar", data, options });
    }
  }

  function renderGrowthMovers(growth) {
    const container = document.getElementById("growth-movers");
    if (!container) return;
    container.innerHTML = "";

    if (growth.movers.length === 0) return;

    const title = document.createElement("h3");
    title.className = "growth-movers__title";
    title.textContent = "Top Movers";
    container.appendChild(title);

    const table = document.createElement("table");
    table.className = "growth-movers__table";
    table.innerHTML = `<thead><tr>
      <th>Set</th>
      <th>Base</th>
      <th>Secret</th>
      <th>Net</th>
    </tr></thead>`;

    const tbody = document.createElement("tbody");
    growth.movers.forEach((m) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(m.name)}</td>
        <td class="${deltaClass(m.base)}">${formatDelta(m.base)}</td>
        <td class="${deltaClass(m.secret)}">${formatDelta(m.secret)}</td>
        <td class="${deltaClass(m.total)}"><strong>${formatDelta(m.total)}</strong></td>
      `;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);
  }

  function formatDelta(n) {
    if (n === 0) return "—";
    return (n > 0 ? "+" : "") + n;
  }

  function deltaClass(n) {
    if (n > 0) return "growth-movers__delta--positive";
    if (n < 0) return "growth-movers__delta--negative";
    return "";
  }

  function renderGrowthNote(history) {
    const el = document.getElementById("growth-note");
    if (!el) return;
    if (history.length === 0) {
      el.textContent = "";
      return;
    }
    const earliest = history.reduce((min, e) => e.at < min ? e.at : min, history[0].at);
    const date = new Date(earliest).toLocaleDateString(undefined, {
      year: "numeric", month: "short", day: "numeric"
    });
    el.textContent = "Tracking since " + date + ". Sync across devices using the Sync button on the tracker page.";
  }

  function bindRangeToggle() {
    const container = document.getElementById("range-toggle");
    if (!container) return;

    container.addEventListener("click", (e) => {
      const btn = e.target.closest(".range-btn");
      if (!btn) return;
      const range = parseInt(btn.dataset.range, 10);
      if (!range) return;

      currentRange = range;
      container.querySelectorAll(".range-btn").forEach((b) => b.classList.remove("range-btn--active"));
      btn.classList.add("range-btn--active");
      renderGrowth(historyData, currentRange);
    });
  }

  // ---------- Boot ----------

  document.addEventListener("DOMContentLoaded", () => {
    if (typeof POKEMON_TCG_ERAS === "undefined") {
      console.error("PokéTrack Stats: set data failed to load.");
      return;
    }
    if (typeof Chart === "undefined") {
      console.error("PokéTrack Stats: Chart.js failed to load.");
      return;
    }

    setupHeaderHeightVar();
    bindThemeToggle();

    const collection = loadCollection();
    currentStats = computeStats(collection);

    renderSummary(currentStats);
    renderCharts(currentStats);
    renderEraDetails(currentStats);

    // Growth section
    historyData = window.getLocalHistory ? window.getLocalHistory() : [];
    bindRangeToggle();
    renderGrowth(historyData, currentRange);

    // Auto-fetch cloud history when auth is ready (non-blocking)
    document.addEventListener("poketrack:auth-ready", function (e) {
      if (!e.detail || !e.detail.signedIn) return;
      if (typeof window.loadHistoryFromCloud !== "function") return;
      window.loadHistoryFromCloud().then(function (merged) {
        if (merged && merged.length > historyData.length) {
          historyData = merged;
          renderGrowth(historyData, currentRange);
        }
      }).catch(function () { /* local data is fine */ });
    });
  });
})();
