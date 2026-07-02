/**
 * Generates a static JSON snapshot of set data for the Cloud Function.
 * Run before deploying: `node generate-sets-data.js`
 * Also runs automatically via firebase.json predeploy hook.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SETS_DIR = path.resolve(__dirname, "..", "js", "sets");

const FILES = [
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

// Concatenate and evaluate
const combined = FILES.map((file) =>
  fs.readFileSync(path.join(SETS_DIR, file), "utf8")
).join("\n");

const script = new vm.Script(combined + "\n; POKEMON_TCG_ERAS;", {
  filename: "sets-combined.js"
});
const context = vm.createContext({});
const eras = script.runInContext(context);

// Strip symbols, keep only what the function needs
const minimal = eras.map((era) => ({
  id: era.id,
  name: era.name,
  sets: era.sets.map((s) => ({
    id: s.id,
    name: s.name,
    base: s.base,
    secret: s.secret
  }))
}));

const outPath = path.join(__dirname, "sets-data.json");
fs.writeFileSync(outPath, JSON.stringify(minimal, null, 2));

const totalSets = minimal.reduce((sum, e) => sum + e.sets.length, 0);
console.log(`Generated sets-data.json: ${minimal.length} eras, ${totalSets} sets`);
