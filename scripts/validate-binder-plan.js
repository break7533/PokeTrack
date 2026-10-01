/**
 * Validates the frozen binder allocation in js/binders.js against the set
 * data in js/sets/*.js.
 *
 * js/binders.js is hand-maintained: it is the plan, and the plan only changes
 * when you decide it does. What this script protects against is the plan and
 * the set data drifting apart — a set renamed or re-numbered in js/sets, a
 * new set added and never filed, a binder edited into overflow.
 *
 * Checks:
 *   - every set id in the plan resolves against js/sets/*.js
 *   - every non-excluded set is allocated to exactly one binder
 *   - no binder needs more pockets than it holds
 *   - no unlocked binder mixes generations
 *   - every binder size is one you can actually buy
 *
 * Exits non-zero on any violation, so it works as a pre-commit or CI gate.
 *
 * Usage: node scripts/validate-binder-plan.js
 *        node scripts/validate-binder-plan.js --verbose   (per-binder table)
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const SETS_DIR = path.join(ROOT, "js", "sets");

const {
  POKETRACK_BINDERS,
  POKETRACK_BINDER_SIZES,
  POKETRACK_BINDER_EXCLUDED_ERAS
} = require(path.join(ROOT, "js", "binders.js"));

// ---------- Load set data ----------

// Same approach as functions/generate-sets-data.js: the set files are plain
// scripts that push onto a shared array, so concatenate and evaluate them.
const SET_FILES = [
  "_config.js",
  "mega-evolution.js",
  "scarlet-violet.js",
  "sword-shield.js",
  "sun-moon.js",
  "xy.js",
  "black-white.js",
  "hgss.js",
  "platinum.js",
  "diamond-pearl.js",
  "ex.js",
  "e-card.js",
  "legendary-collection.js",
  "neo.js",
  "original-series.js",
  "other.js",
  "_index.js"
];

const combined = SET_FILES.map((file) =>
  fs.readFileSync(path.join(SETS_DIR, file), "utf8")
).join("\n");

const eras = new vm.Script(combined + "\n; POKEMON_TCG_ERAS;", {
  filename: "sets-combined.js"
}).runInContext(vm.createContext({}));

/** setId -> { id, name, base, secret, era } */
const setsById = new Map();
const eraNames = new Map();

for (const era of eras) {
  eraNames.set(era.id, era.name);
  for (const set of era.sets) {
    setsById.set(set.id, Object.assign({}, set, { era: era.id }));
  }
}

// ---------- Validate ----------

const errors = [];
const allocated = new Map(); // setId -> binder id that claimed it

for (const binder of POKETRACK_BINDERS) {
  if (!POKETRACK_BINDER_SIZES.includes(binder.size)) {
    errors.push(`${binder.id}: size ${binder.size} is not a purchasable size`);
  }
  if (!eraNames.has(binder.era)) {
    errors.push(`${binder.id}: unknown era "${binder.era}"`);
  }

  const generations = new Set();
  let used = 0;

  for (const setId of binder.sets) {
    const set = setsById.get(setId);
    if (!set) {
      errors.push(`${binder.id}: unknown set id "${setId}"`);
      continue;
    }
    if (allocated.has(setId)) {
      errors.push(
        `${setId} allocated twice: ${allocated.get(setId)} and ${binder.id}`
      );
    }
    allocated.set(setId, binder.id);
    generations.add(set.era);
    used += set.base + 1; // +1 pocket for the divider card
  }

  if (used > binder.size) {
    errors.push(
      `${binder.id}: needs ${used} pockets but holds ${binder.size} ` +
        `(over by ${used - binder.size})`
    );
  }
  // The locked vintage binder is allowed to mix generations — it was filled
  // before the rule existed and was never re-planned.
  if (generations.size > 1 && !binder.locked) {
    errors.push(
      `${binder.id}: mixes generations (${Array.from(generations).join(", ")})`
    );
  }

  binder._used = used;
}

for (const era of eras) {
  if (POKETRACK_BINDER_EXCLUDED_ERAS.includes(era.id)) {
    for (const set of era.sets) {
      if (allocated.has(set.id)) {
        errors.push(
          `${set.id} is in excluded era "${era.id}" but allocated to ` +
            allocated.get(set.id)
        );
      }
    }
    continue;
  }
  for (const set of era.sets) {
    if (!allocated.has(set.id)) {
      errors.push(`${set.id} (${set.name}) is not allocated to any binder`);
    }
  }
}

if (errors.length > 0) {
  console.error("Binder plan is invalid:\n");
  for (const err of errors) console.error("  - " + err);
  console.error(
    `\n${errors.length} problem(s). Fix js/binders.js (or js/sets/*.js) and re-run.`
  );
  process.exit(1);
}

// ---------- Report ----------

const newBinders = POKETRACK_BINDERS.filter((b) => !b.locked);
const emptyTotal = newBinders.reduce(
  (sum, b) => sum + (b.size - b._used),
  0
);

if (process.argv.includes("--verbose")) {
  console.log("Binder      Era                    Size   Used  Empty  Sets");
  for (const binder of POKETRACK_BINDERS) {
    const empty = binder.size - binder._used;
    console.log(
      (binder.id + (binder.locked ? " 🔒" : "")).padEnd(12) +
        (eraNames.get(binder.era) || binder.era).padEnd(23) +
        String(binder.size).padStart(5) +
        String(binder._used).padStart(6) +
        String(empty).padStart(7) +
        String(binder.sets.length).padStart(6)
    );
  }
  console.log("");
}

console.log(
  `Binder plan OK: ${POKETRACK_BINDERS.length} binders ` +
    `(${newBinders.length} unlocked, ${POKETRACK_BINDERS.length - newBinders.length} locked), ` +
    `${allocated.size} sets allocated, ${emptyTotal} empty pockets.`
);
