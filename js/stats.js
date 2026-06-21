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
      pctEl.className = "era-detail__percent";
      pctEl.textContent = era.totalPct + "% complete";

      header.appendChild(name);
      header.appendChild(pctEl);
      section.appendChild(header);

      // Table
      const table = document.createElement("table");
      table.className = "era-detail__table";

      const thead = document.createElement("thead");
      thead.innerHTML = `<tr>
        <th>Set</th>
        <th>Base</th>
        <th>Base %</th>
        <th>Secret</th>
        <th>Secret %</th>
        <th>Total</th>
      </tr>`;
      table.appendChild(thead);

      const tbody = document.createElement("tbody");
      era.sets.forEach((set) => {
        const tr = document.createElement("tr");
        if (set.isComplete) tr.dataset.status = "complete";
        else if (set.isStarted) tr.dataset.status = "started";
        else tr.dataset.status = "untouched";

        const barColor = getBarColor(set.totalPct);

        tr.innerHTML = `
          <td>${escapeHtml(set.name)}</td>
          <td>${set.baseCollected} / ${set.baseTotal}</td>
          <td>${set.basePct}%</td>
          <td>${set.secretTotal > 0 ? set.secretCollected + " / " + set.secretTotal : "—"}</td>
          <td>${set.secretTotal > 0 ? set.secretPct + "%" : "—"}</td>
          <td>
            ${set.totalPct}%
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
  });
})();
