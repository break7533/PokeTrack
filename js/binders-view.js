/**
 * PokéTrack — binder plan page
 *
 * Renders the frozen allocation in js/binders.js and derives everything that
 * depends on the user:
 *
 *   fill = (base cards owned in this binder's sets + 1 divider per set) / size
 *
 * Nothing about fill is stored — it is recomputed from the same saved
 * collection the tracker writes, so the page can never disagree with it. A
 * visitor with no collection sees the plan at 0%, which is the shareable view.
 *
 * The only persisted state is the SHELF: the physical binders you actually
 * own. A plan slot counts as owned when a shelf binder is assigned to it, so
 * "bought" cannot contradict "which binder is it". Shelf binders whose size
 * is not in the plan can be tracked but not assigned — they would not fit.
 *
 * Saved to localStorage, and synced to Firestore when signed in via the
 * window.* hooks in firebase.js (no-op when signed out).
 */
(function () {
  "use strict";

  // ---------- Constants ----------

  const COLLECTION_KEY = "poketrack:v1"; // written by js/app.js
  // Sentinel values for the assignment dropdown. Prefixed so they can never
  // collide with a binder id from the plan.
  const OTHER_VALUE = "__other";
  const PURPOSE_VALUE = "__purpose";
  const SHELF_KEY = "poketrack:shelf:v1";
  const THEME_KEY = "poketrack:theme:v1";

  // ---------- State ----------

  /** @type {Record<string, { base:number, secret:number }>} */
  let collection = {};
  /**
   * A shelf binder is in one of three states:
   *   - unassigned
   *   - assigned to a plan slot      (assignedTo: "ME-01", purpose: null)
   *   - kept for something off-plan  (assignedTo: null, purpose: "Promos")
   *
   * @type {Array<{
   *   uid: string, size: number, color: string, label: string,
   *   inUse: boolean, assignedTo: string|null, purpose: string|null,
   *   updatedAt: number
   * }>}
   */
  let shelf = [];

  /** setId -> set record, built once at boot. */
  const setsById = new Map();
  /** eraId -> era name. */
  const eraNames = new Map();

  let applyingCloudShelf = false;
  // firebase.js can resolve auth before DOMContentLoaded, and rendering before
  // boot has indexed the set data would read undefined sets. Anything that can
  // fire early checks this first.
  let booted = false;

  // ---------- Persistence ----------

  function loadCollection() {
    try {
      const raw = localStorage.getItem(COLLECTION_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (err) {
      console.warn("PokéTrack: failed to read saved collection", err);
      return {};
    }
  }

  function loadShelf() {
    try {
      const raw = localStorage.getItem(SHELF_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(normalizeShelfEntry) : [];
    } catch (err) {
      console.warn("PokéTrack: failed to read saved shelf", err);
      return [];
    }
  }

  function saveShelf() {
    try {
      localStorage.setItem(SHELF_KEY, JSON.stringify(shelf));
    } catch (err) {
      console.warn("PokéTrack: failed to save shelf", err);
    }
    if (!applyingCloudShelf && typeof window.syncShelfToCloud === "function") {
      window.syncShelfToCloud(shelf);
    }
  }

  function normalizeShelfEntry(entry) {
    const e = entry || {};
    const assignedTo =
      typeof e.assignedTo === "string" && e.assignedTo ? e.assignedTo : null;
    const purpose =
      typeof e.purpose === "string" && e.purpose.trim() ? e.purpose.trim() : null;
    return {
      uid: typeof e.uid === "string" && e.uid ? e.uid : makeUid(),
      size: Number.isFinite(e.size) ? e.size : 0,
      color: typeof e.color === "string" ? e.color : "",
      label: typeof e.label === "string" ? e.label : "",
      // "In use" means the binder has a job, so it cannot outlive the
      // assignment. Enforced here as well as on write, to repair entries
      // already saved in the old shape.
      inUse: Boolean(e.inUse) && (assignedTo !== null || purpose !== null),
      // A plan slot and an off-plan purpose are mutually exclusive: one
      // physical binder does one job.
      assignedTo: purpose ? null : assignedTo,
      purpose: purpose,
      updatedAt: Number.isFinite(e.updatedAt) ? e.updatedAt : 0
    };
  }

  function makeUid() {
    return "b" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // ---------- Colour parsing ----------

  /**
   * Turn what the user typed into something CSS understands, so "dark grey",
   * "light blue" and "#0af" all work. We ask the browser to parse it rather
   * than keeping a colour list of our own: assigning to a detached element's
   * style silently drops anything invalid, which is exactly the test we want.
   *
   * @param {string} input
   * @returns {{ ok: boolean, css: string, label: string }}
   */
  function parseColor(input) {
    const label = String(input || "").trim();
    if (!label) return { ok: false, css: "", label: "" };

    const candidates = [label];
    // CSS names have no spaces and spell it "gray"; accept the human spellings.
    const squashed = label.toLowerCase().replace(/\s+/g, "");
    candidates.push(squashed, squashed.replace(/grey/g, "gray"));
    // Bare hex without the hash: "0af", "ff8800".
    if (/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(squashed)) {
      candidates.push("#" + squashed);
    }

    const probe = document.createElement("span").style;
    for (const candidate of candidates) {
      probe.color = "";
      probe.color = candidate;
      if (probe.color !== "") {
        return { ok: true, css: probe.color, label: label };
      }
    }
    return { ok: false, css: "", label: label };
  }

  /**
   * Pick black or white text for a swatch, so a colour name stays readable on
   * its own colour. Uses the sRGB relative-luminance threshold.
   */
  function readableTextOn(cssColor) {
    const match = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(cssColor);
    if (!match) return "#000";
    const [r, g, b] = [match[1], match[2], match[3]].map((v) => {
      const channel = Number(v) / 255;
      return channel <= 0.03928
        ? channel / 12.92
        : Math.pow((channel + 0.055) / 1.055, 2.4);
    });
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance > 0.36 ? "#000" : "#fff";
  }

  // ---------- Derived values ----------

  function ownedBase(setId) {
    const entry = collection[setId];
    return entry && Number.isFinite(entry.base) ? entry.base : 0;
  }

  /**
   * Everything the UI needs about one planned binder. Pure function of the
   * plan plus the saved collection.
   */
  function describeBinder(binder) {
    let owned = 0;
    let total = 0;
    const sets = binder.sets.map((id) => {
      const set = setsById.get(id);
      const have = Math.min(ownedBase(id), set.base);
      owned += have;
      total += set.base;
      return { id: id, name: set.name, base: set.base, owned: have };
    });

    // Dividers always count as filled — you always have them.
    const dividers = binder.sets.length;
    const filled = owned + dividers;
    const capacity = total + dividers;

    return {
      binder: binder,
      sets: sets,
      owned: owned,
      total: total,
      dividers: dividers,
      filled: filled,
      empty: binder.size - capacity,
      stillToCollect: total - owned,
      fill: binder.size > 0 ? (filled / binder.size) * 100 : 0,
      shelfBinder: shelf.find((s) => s.assignedTo === binder.id) || null
    };
  }

  /** Matches the modifier names in css/style.css. */
  function progressClass(percent) {
    if (percent >= 100) return "progress-bar__fill--complete";
    if (percent >= 66) return "progress-bar__fill--high";
    if (percent >= 33) return "progress-bar__fill--mid";
    return "progress-bar__fill--low";
  }

  // ---------- Rendering: planned binders ----------

  const planContainer = () => document.getElementById("binder-list");
  const shelfContainer = () => document.getElementById("shelf-list");

  function render() {
    if (!booted) return;
    renderSummary();
    renderPlan();
    renderBuyOrder();
    renderShelf();
  }

  function renderSummary() {
    const described = POKETRACK_BINDERS.map(describeBinder);
    // Two different counts on purpose: "on the shelf" is every binder you own
    // (it opens the list those binders are in), while "still to buy" counts
    // plan slots with nothing in them. A binder kept for promos is owned but
    // fills no slot, so the two no longer have to add up to the plan's size.
    const slotsFilled = described.filter((d) => d.shelfBinder).length;
    const pockets = POKETRACK_BINDERS.reduce((sum, b) => sum + b.size, 0);
    const cardsOwned = described.reduce((sum, d) => sum + d.owned, 0);
    const cardsTotal = described.reduce((sum, d) => sum + d.total, 0);

    setText("summary-binders", POKETRACK_BINDERS.length);
    setText("summary-owned", shelf.length);
    setText("summary-to-buy", POKETRACK_BINDERS.length - slotsFilled);
    setText("summary-pockets", pockets.toLocaleString());
    setText("summary-cards", cardsOwned.toLocaleString());
    setText("summary-cards-total", cardsTotal.toLocaleString());

    const percent = cardsTotal ? Math.round((cardsOwned / cardsTotal) * 100) : 0;
    setText("summary-percent", percent);
    const bar = document.getElementById("summary-bar");
    if (bar) {
      bar.style.width = percent + "%";
      // Re-derive the colour band rather than accumulating modifiers across
      // re-renders.
      bar.className = "progress-bar__fill " + progressClass(percent);
    }
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = String(value);
  }

  function renderPlan() {
    const container = planContainer();
    if (!container) return;

    const described = POKETRACK_BINDERS.map(describeBinder);
    const hasCollection = described.some((d) => d.owned > 0);

    const note = document.getElementById("order-note");
    if (note) {
      note.textContent = hasCollection
        ? "Grouped by generation, fullest binder first within each one — buy from the top of a group."
        : "Grouped by generation, newest first. Fill rates appear once you track cards on the Tracker page.";
    }

    // Generations in set-file order (newest first), keeping only those the
    // plan actually uses. Grouping wins over one flat fullest-first list
    // because the list is meant to be read, not just sorted: 25 unlabelled
    // cards is what made the markdown hard to follow.
    const groups = [];
    const byEra = new Map();
    described.forEach((d) => {
      const eraId = d.binder.era;
      if (!byEra.has(eraId)) {
        const group = { eraId: eraId, binders: [] };
        byEra.set(eraId, group);
        groups.push(group);
      }
      byEra.get(eraId).binders.push(d);
    });

    container.innerHTML = "";

    groups.forEach((group) => {
      // Within a generation, fullest first once there's something to rank by.
      // Dividers alone would sort LC-01 (1/160) over SM-01 (8/1088) — noise —
      // so with no collection the plan's own order stands.
      const binders = hasCollection
        ? group.binders.slice().sort((a, b) => b.fill - a.fill)
        : group.binders;

      const owned = binders.filter((d) => d.shelfBinder).length;

      const section = document.createElement("section");
      section.className = "binder-group";

      const heading = document.createElement("h3");
      heading.className = "binder-group__title";
      heading.textContent = eraNames.get(group.eraId) || group.eraId;

      const count = document.createElement("span");
      count.className = "binder-group__count";
      count.textContent =
        binders.length +
        (binders.length === 1 ? " binder" : " binders") +
        (owned > 0 ? " · " + owned + " owned" : "");
      heading.appendChild(count);

      const list = document.createElement("div");
      list.className = "binder-list";
      binders.forEach((d) => list.appendChild(binderCard(d)));

      section.appendChild(heading);
      section.appendChild(list);
      container.appendChild(section);
    });
  }

  function binderCard(d) {
    const tpl = document.getElementById("binder-card-template");
    const node = tpl.content.firstElementChild.cloneNode(true);
    const b = d.binder;
    const percent = Math.round(d.fill);

    node.dataset.binderId = b.id;

    node.querySelector(".binder-card__id").textContent = b.id;
    node.querySelector(".binder-card__era").textContent =
      eraNames.get(b.era) || b.era;
    node.querySelector(".binder-card__size").textContent =
      b.size.toLocaleString() + " pockets";

    const lock = node.querySelector(".binder-card__lock");
    if (b.locked) {
      lock.hidden = false;
      lock.title = "Locked — already filled, not re-planned";
    }

    const status = node.querySelector(".binder-card__status");
    if (d.shelfBinder) {
      status.textContent = d.shelfBinder.inUse ? "Owned · in use" : "Owned";
      status.classList.add("is-owned");
      const swatch = node.querySelector(".binder-card__swatch");
      const parsed = parseColor(d.shelfBinder.color);
      if (parsed.ok) {
        swatch.hidden = false;
        swatch.style.background = parsed.css;
        swatch.title = d.shelfBinder.color;
      }
    } else {
      status.textContent = "To buy";
      status.classList.add("is-to-buy");
    }

    const bar = node.querySelector(".progress-bar__fill");
    bar.style.width = Math.min(percent, 100) + "%";
    bar.classList.add(progressClass(percent));
    node.querySelector(".progress-bar").setAttribute("aria-valuenow", percent);
    node.querySelector(".binder-card__percent").textContent = percent + "%";

    node.querySelector(".binder-card__filled").textContent =
      d.filled.toLocaleString();

    // "Pockets used" counts dividers, which surprises people when a binder
    // they own nothing for still reads 5/624. Spell the sum out.
    const breakdown = node.querySelector(".binder-card__breakdown");
    const cardWord = d.owned === 1 ? "card" : "cards";
    const dividerWord = d.dividers === 1 ? "divider" : "dividers";
    breakdown.textContent =
      d.owned.toLocaleString() + " " + cardWord + " + " +
      d.dividers + " " + dividerWord;
    if (d.owned === 0) breakdown.classList.add("is-dividers-only");
    node.querySelector(".binder-card__capacity").textContent =
      b.size.toLocaleString();
    node.querySelector(".binder-card__remaining").textContent =
      d.stillToCollect.toLocaleString();
    node.querySelector(".binder-card__empty").textContent =
      d.empty.toLocaleString();

    // Set list — collapsed by default so the page scans as a list of binders.
    const setList = node.querySelector(".binder-card__sets");
    d.sets.forEach((set) => {
      const li = document.createElement("li");
      li.className = "binder-set";
      const setPercent = set.base ? Math.round((set.owned / set.base) * 100) : 0;
      li.innerHTML =
        '<span class="binder-set__name"></span>' +
        '<span class="binder-set__count"></span>';
      li.querySelector(".binder-set__name").textContent = set.name;
      li.querySelector(".binder-set__count").textContent =
        set.owned + " / " + set.base + " (" + setPercent + "%)";
      if (set.owned >= set.base) li.classList.add("is-complete");
      setList.appendChild(li);
    });

    const toggle = node.querySelector(".binder-card__toggle");
    toggle.querySelector(".binder-card__toggle-count").textContent =
      d.sets.length + (d.sets.length === 1 ? " set" : " sets");
    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      setList.hidden = expanded;
    });

    renderCardActions(node, d);
    return node;
  }

  function renderCardActions(node, d) {
    const actions = node.querySelector(".binder-card__actions");
    actions.innerHTML = "";

    if (d.shelfBinder) {
      const inUse = button(
        d.shelfBinder.inUse ? "In use ✓" : "Mark in use",
        "btn btn--ghost",
        () => {
          updateShelfEntry(d.shelfBinder.uid, {
            inUse: !d.shelfBinder.inUse
          });
        }
      );
      const unassign = button("Unassign", "btn btn--ghost", () => {
        updateShelfEntry(d.shelfBinder.uid, { assignedTo: null });
      });
      actions.appendChild(inUse);
      actions.appendChild(unassign);
      return;
    }

    // Not owned. Offer the one-tap "bought it" path, plus assignment from any
    // unassigned shelf binder of the right size.
    actions.appendChild(
      button("I bought this", "btn btn--primary", () => {
        const color = promptColor("What colour is your " + d.binder.id + " binder?");
        if (color === null) return;
        addShelfEntry({
          size: d.binder.size,
          color: color,
          assignedTo: d.binder.id,
          inUse: true
        });
      })
    );

    const candidates = shelf.filter(
      (s) => !s.assignedTo && !s.purpose && s.size === d.binder.size
    );
    if (candidates.length > 0) {
      const select = document.createElement("select");
      select.className = "binder-card__assign";
      select.setAttribute("aria-label", "Assign a shelf binder to " + d.binder.id);
      select.appendChild(new Option("Assign from shelf…", ""));
      candidates.forEach((s) => {
        select.appendChild(
          new Option(
            (s.label || s.color || "Unnamed") + " (" + s.size + ")",
            s.uid
          )
        );
      });
      select.addEventListener("change", () => {
        if (!select.value) return;
        updateShelfEntry(select.value, { assignedTo: d.binder.id });
      });
      actions.appendChild(select);
    }
  }

  function button(text, className, onClick) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = className;
    btn.textContent = text;
    btn.addEventListener("click", onClick);
    return btn;
  }

  function promptColor(message) {
    const answer = window.prompt(
      message + "\n\nType a colour name — “dark grey”, “light blue”, “red” — or a hex code."
    );
    if (answer === null) return null;
    const parsed = parseColor(answer);
    if (!parsed.ok && answer.trim() !== "") {
      window.alert(
        "“" + answer.trim() + "” isn’t a colour I recognise. Saving it as a label with no swatch."
      );
    }
    return answer.trim();
  }

  /**
   * Ask what an off-plan binder is for. Returns null when cancelled or left
   * blank, so the caller can leave the binder as it was.
   */
  function promptPurpose(current) {
    const answer = window.prompt(
      "What is this binder for?\n\nSomething the plan doesn’t cover — “Promos”, “Charizard master set”, “Japanese cards”.",
      current || ""
    );
    if (answer === null) return null;
    const name = answer.trim();
    return name === "" ? null : name;
  }

  // ---------- Rendering: ranked buy order ----------

  /**
   * The page groups binders by generation, which answers "where does this set
   * go". This answers the other question — "which binder do I buy next" — as
   * one flat ranking across every generation.
   *
   * Fullest first: the binder you have the most cards for is the one sitting
   * in a box right now, so it earns its shelf space soonest. Only binders
   * with no physical binder assigned appear; the rest are already bought.
   */
  function renderBuyOrder() {
    const container = document.getElementById("buy-list");
    if (!container) return;

    const toBuy = POKETRACK_BINDERS.map(describeBinder)
      .filter((d) => !d.shelfBinder)
      .sort((a, b) => b.fill - a.fill || b.owned - a.owned);

    const note = document.getElementById("buy-note");
    const hasCollection = toBuy.some((d) => d.owned > 0);
    if (note) {
      if (toBuy.length === 0) {
        note.textContent =
          "Every binder in the plan has a binder on your shelf assigned to it. Nothing left to buy.";
      } else if (hasCollection) {
        note.textContent =
          "Fullest first — the binder you already have the most cards for earns its shelf space soonest.";
      } else {
        note.textContent =
          "No collection data yet, so there is nothing to rank by. Track cards on the Tracker page and this becomes a real priority order.";
      }
    }

    container.innerHTML = "";

    toBuy.forEach((d, index) => {
      const row = document.createElement("li");
      row.className = "buy-row";

      const rank = document.createElement("span");
      rank.className = "buy-row__rank";
      rank.textContent = String(index + 1);

      const info = document.createElement("div");
      info.className = "buy-row__info";

      const title = document.createElement("span");
      title.className = "buy-row__id";
      title.textContent = d.binder.id;

      const meta = document.createElement("span");
      meta.className = "buy-row__meta";
      meta.textContent =
        (eraNames.get(d.binder.era) || d.binder.era) +
        " · " +
        d.binder.size.toLocaleString() +
        " pockets · " +
        d.sets.length +
        (d.sets.length === 1 ? " set" : " sets");

      const bar = document.createElement("div");
      bar.className = "progress-bar";
      const percent = Math.round(d.fill);
      const fill = document.createElement("div");
      fill.className = "progress-bar__fill " + progressClass(percent);
      fill.style.width = Math.min(percent, 100) + "%";
      bar.appendChild(fill);

      info.appendChild(title);
      info.appendChild(meta);
      info.appendChild(bar);

      const figure = document.createElement("div");
      figure.className = "buy-row__figure";
      const pct = document.createElement("span");
      pct.className = "buy-row__percent";
      pct.textContent = percent + "%";
      const have = document.createElement("span");
      have.className = "buy-row__have";
      have.textContent = d.owned.toLocaleString() + " cards ready";
      figure.appendChild(pct);
      figure.appendChild(have);

      row.appendChild(rank);
      row.appendChild(info);
      row.appendChild(figure);
      container.appendChild(row);
    });
  }

  // ---------- Rendering: shelf ----------

  function renderShelf() {
    const container = shelfContainer();
    if (!container) return;

    container.innerHTML = "";

    if (shelf.length === 0) {
      const empty = document.createElement("p");
      empty.className = "shelf-empty";
      empty.textContent =
        "No binders on your shelf yet. Add the ones you already own, or mark a planned binder as bought.";
      container.appendChild(empty);
      return;
    }

    const planSizes = new Set(POKETRACK_BINDERS.map((b) => b.size));

    shelf.forEach((entry) => {
      const tpl = document.getElementById("shelf-row-template");
      const node = tpl.content.firstElementChild.cloneNode(true);
      const parsed = parseColor(entry.color);

      const swatch = node.querySelector(".shelf-row__swatch");
      if (parsed.ok) {
        swatch.style.background = parsed.css;
        swatch.style.color = readableTextOn(parsed.css);
        swatch.textContent = "";
        swatch.title = entry.color;
      } else {
        swatch.classList.add("is-unknown");
        swatch.textContent = "?";
        swatch.title = entry.color
          ? entry.color + " — not a colour I can show"
          : "No colour set";
      }

      node.querySelector(".shelf-row__color").textContent =
        entry.color || "No colour";
      node.querySelector(".shelf-row__size").textContent =
        entry.size ? entry.size.toLocaleString() + " pockets" : "Size unknown";

      const assigned = node.querySelector(".shelf-row__assigned");
      const offPlan = !planSizes.has(entry.size);

      if (entry.assignedTo) {
        assigned.textContent = "→ " + entry.assignedTo;
        assigned.classList.add("is-assigned");
      } else if (entry.purpose) {
        assigned.textContent = "→ " + entry.purpose;
        assigned.classList.add("is-off-plan");
      } else if (offPlan) {
        // A size the plan never uses can't take a plan slot — the sets would
        // not fit — but it can still be given a purpose of its own.
        assigned.textContent = "Unassigned — no plan slot this size";
      } else {
        assigned.textContent = "Unassigned";
      }

      const actions = node.querySelector(".shelf-row__actions");

      // Assignment: a plan slot, or "Other" for a binder you keep for
      // something the plan doesn't cover — promos, a master set. Off-plan
      // sizes get the same control, minus the plan slots.
      const select = document.createElement("select");
      select.className = "shelf-row__assign";
      select.setAttribute("aria-label", "What this binder is used for");
      select.appendChild(new Option("Unassigned", ""));

      if (!offPlan) {
        POKETRACK_BINDERS.filter(
          (b) =>
            b.size === entry.size &&
            !shelf.some((s) => s.assignedTo === b.id && s.uid !== entry.uid)
        ).forEach((b) => {
          select.appendChild(new Option(b.id, b.id));
        });
      }

      // The current purpose needs an option of its own or the select would
      // have nothing to show for it.
      if (entry.purpose) {
        select.appendChild(new Option(entry.purpose, PURPOSE_VALUE));
      }
      select.appendChild(
        new Option(entry.purpose ? "Rename…" : "Other…", OTHER_VALUE)
      );

      const currentValue = entry.assignedTo
        ? entry.assignedTo
        : entry.purpose
          ? PURPOSE_VALUE
          : "";
      select.value = currentValue;

      select.addEventListener("change", () => {
        if (select.value === PURPOSE_VALUE) return; // already there

        if (select.value === OTHER_VALUE) {
          const name = promptPurpose(entry.purpose);
          // Cancelled or blank: put the select back, don't drop the binder's
          // existing job on the floor.
          if (name === null) {
            select.value = currentValue;
            return;
          }
          updateShelfEntry(entry.uid, { assignedTo: null, purpose: name });
          return;
        }

        updateShelfEntry(entry.uid, {
          assignedTo: select.value || null,
          purpose: null
        });
      });
      actions.appendChild(select);

      const inUseBtn = button(
        entry.inUse ? "In use ✓" : "Not in use",
        "btn btn--ghost",
        () => {
          updateShelfEntry(entry.uid, { inUse: !entry.inUse });
        }
      );
      if (!entry.assignedTo && !entry.purpose) {
        inUseBtn.disabled = true;
        inUseBtn.textContent = "Not in use";
        inUseBtn.title = "Give this binder a job first — a plan slot, or Other.";
      }
      actions.appendChild(inUseBtn);
      actions.appendChild(
        button("Recolour", "btn btn--ghost", () => {
          const color = promptColor("New colour for this binder?");
          if (color === null) return;
          updateShelfEntry(entry.uid, { color: color });
        })
      );
      actions.appendChild(
        button("Remove", "btn btn--danger", () => {
          if (
            !window.confirm(
              "Remove this binder from your shelf?" +
                (entry.assignedTo ? " " + entry.assignedTo + " goes back to “to buy”." : "")
            )
          ) {
            return;
          }
          shelf = shelf.filter((s) => s.uid !== entry.uid);
          saveShelf();
          render();
        })
      );

      container.appendChild(node);
    });
  }

  // ---------- Mutations ----------

  function addShelfEntry(fields) {
    shelf.push(
      normalizeShelfEntry(
        Object.assign({ uid: makeUid(), updatedAt: Date.now() }, fields)
      )
    );
    saveShelf();
    render();
  }

  function updateShelfEntry(uid, fields) {
    const entry = shelf.find((s) => s.uid === uid);
    if (!entry) return;

    // One physical binder per plan slot: assigning here clears anyone else
    // holding the slot, so the two can't both claim it. Losing the slot also
    // ends "in use" — that flag means "filed into its plan slot", so an
    // unassigned binder cannot be in use.
    if (fields.assignedTo) {
      shelf.forEach((other) => {
        if (other.uid !== uid && other.assignedTo === fields.assignedTo) {
          other.assignedTo = null;
          other.purpose = null;
          other.inUse = false;
          other.updatedAt = Date.now();
        }
      });
    }

    Object.assign(entry, fields, { updatedAt: Date.now() });
    // Whatever the caller changed, a binder with no job is not in use.
    if (!entry.assignedTo && !entry.purpose) entry.inUse = false;
    saveShelf();
    render();
  }

  // ---------- Add-to-shelf form ----------

  function bindShelfForm() {
    const form = document.getElementById("shelf-form");
    if (!form) return;

    const sizeInput = document.getElementById("shelf-size");
    const colorInput = document.getElementById("shelf-color");
    const preview = document.getElementById("shelf-color-preview");

    // Live swatch: type "dark grey" and see it before committing.
    function updatePreview() {
      const parsed = parseColor(colorInput.value);
      if (parsed.ok) {
        preview.style.background = parsed.css;
        preview.classList.remove("is-unknown");
        preview.textContent = "";
        preview.title = parsed.label;
      } else {
        preview.style.background = "";
        preview.classList.add("is-unknown");
        preview.textContent = colorInput.value.trim() ? "?" : "";
        preview.title = colorInput.value.trim()
          ? "Not a colour I can show"
          : "Type a colour";
      }
    }
    colorInput.addEventListener("input", updatePreview);
    updatePreview();

    // Purchasable sizes only — a binder is one of the sizes you can buy. What
    // varies is the job it does, and that is the assignment dropdown's
    // problem, not this one. Sizes the plan never uses are marked, because
    // they can't take a plan slot.
    const planSizes = new Set(POKETRACK_BINDERS.map((b) => b.size));
    sizeInput.appendChild(new Option("Pick a size…", ""));
    POKETRACK_BINDER_SIZES.forEach((size) => {
      sizeInput.appendChild(
        new Option(
          size.toLocaleString() +
            " pockets" +
            (planSizes.has(size) ? "" : " (not in the plan)"),
          String(size)
        )
      );
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const size = parseInt(sizeInput.value, 10);
      if (!Number.isFinite(size) || size <= 0) {
        window.alert("Pick the binder's size.");
        sizeInput.focus();
        return;
      }

      addShelfEntry({ size: size, color: colorInput.value.trim() });
      colorInput.value = "";
      sizeInput.value = "";
      updatePreview();
      colorInput.focus();
    });
  }

  // ---------- Shelf modal ----------

  /**
   * Each modal hangs off the summary card whose number it explains — the
   * shelf behind "On the shelf", the ranked buy order behind "Still to buy" —
   * so the page itself stays just the plan.
   */
  function bindDialog(openerId, dialogId) {
    const dialog = document.getElementById(dialogId);
    const opener = document.getElementById(openerId);
    if (!dialog || !opener) return;

    opener.addEventListener("click", () => {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", ""); // no <dialog> support: inline it
    });

    // Click the backdrop to dismiss. The dialog element itself covers only the
    // panel, so a click landing on it is a click outside the content.
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  }

  // ---------- Header height ----------

  // .site-header is position: fixed and body's padding-top comes from this
  // variable, which js/app.js and js/stats.js each set for their own page.
  // Without it here the plan's first lines hide behind the bar.
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

  // ---------- Theme toggle (same contract as the other pages) ----------

  function bindThemeToggle() {
    const btn = document.getElementById("theme-btn");
    if (!btn) return;
    const icon = btn.querySelector(".icon-btn__icon");

    function paint() {
      const dark =
        document.documentElement.getAttribute("data-theme") === "dark";
      if (icon) icon.textContent = dark ? "☀️" : "🌙";
    }
    paint();

    btn.addEventListener("click", () => {
      const dark =
        document.documentElement.getAttribute("data-theme") === "dark";
      try {
        localStorage.setItem(THEME_KEY, dark ? "light" : "dark");
      } catch (_) {
        /* ignore */
      }
      if (dark) document.documentElement.removeAttribute("data-theme");
      else document.documentElement.setAttribute("data-theme", "dark");
      paint();
    });
  }

  // ---------- Cloud bridge (called by firebase.js) ----------

  window.getLocalShelf = function () {
    return shelf.map((entry) => Object.assign({}, entry));
  };

  window.applyCloudShelf = function (merged) {
    if (!Array.isArray(merged)) return;
    applyingCloudShelf = true;
    try {
      shelf = merged.map(normalizeShelfEntry);
      saveShelf();
      render();
    } finally {
      applyingCloudShelf = false;
    }
  };

  // The tracker may have changed on another tab or been pulled from the cloud
  // after sign-in; recompute fill from whatever is in storage now.
  window.addEventListener("storage", (event) => {
    if (event.key === COLLECTION_KEY) {
      collection = loadCollection();
      render();
    }
  });

  document.addEventListener("poketrack:auth-ready", () => {
    collection = loadCollection();
    render();
  });

  // ---------- Boot ----------

  document.addEventListener("DOMContentLoaded", () => {
    if (
      typeof POKEMON_TCG_ERAS === "undefined" ||
      typeof POKETRACK_BINDERS === "undefined"
    ) {
      const container = planContainer();
      if (container) {
        container.innerHTML =
          '<p class="error">Could not load the binder plan. Please refresh the page.</p>';
      }
      return;
    }

    POKEMON_TCG_ERAS.forEach((era) => {
      eraNames.set(era.id, era.name);
      era.sets.forEach((set) => setsById.set(set.id, set));
    });

    // Fail loudly in the console if the plan references a set that no longer
    // exists — the generator checks this too, but the page must not render
    // silently wrong numbers if someone edits js/sets without regenerating.
    const missing = POKETRACK_BINDERS.flatMap((b) =>
      b.sets.filter((id) => !setsById.has(id))
    );
    if (missing.length > 0) {
      console.error("PokéTrack: binder plan references unknown sets", missing);
    }

    collection = loadCollection();
    shelf = loadShelf();

    booted = true;
    setupHeaderHeightVar();
    bindThemeToggle();
    bindShelfForm();
    bindDialog("shelf-open", "shelf-dialog");
    bindDialog("buy-open", "buy-dialog");
    render();
  });
})();
