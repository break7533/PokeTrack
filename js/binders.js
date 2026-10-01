/**
 * PokéTrack — frozen binder allocation ("fewest binders" plan)
 *
 * This file is the SINGLE SOURCE OF TRUTH for the binder plan — hand-
 * maintained, and the only place the allocation is written down. After editing
 * it, run `node scripts/validate-binder-plan.js`, which checks the plan still
 * agrees with js/sets/*.js and obeys the rules below.
 *
 * What lives here is PLAN data only: which sets share a binder, what size
 * that binder is, and whether the binder is locked (already filled and not
 * re-planned). Anything that depends on the user — cards owned, fill rate,
 * whether a binder has been bought, its colour — is computed or stored
 * per-user at runtime and deliberately absent, so a visitor with no
 * collection sees the plan and nothing personal.
 *
 * Rules the allocation obeys:
 *   - Counts are `base` only; secret rares excluded.
 *   - +1 pocket per set for the divider card that identifies it.
 *   - No set is split across two binders.
 *   - Binders hold consecutive sets only, filed oldest -> newest.
 *   - No mixed generations: one generation never shares a binder with another.
 *   - The entire "Other" era (Trick or Trade, McDonald's) is excluded.
 *
 * Set ids key directly into POKEMON_TCG_ERAS (js/sets/*.js) and into the
 * saved collection object, which is what lets fill rate be derived rather
 * than stored.
 *
 * Decided 2026-09-20. Frozen 2026-10-01.
 */

/** Binder sizes (pockets) that are actually purchasable. */
const POKETRACK_BINDER_SIZES = [160, 360, 480, 540, 576, 624, 720, 1024, 1088];

/**
 * The allocation, presented newest generation first to match the set files.
 *
 * @type {Array<{
 *   id: string,        // shelf label, e.g. "SV-01"
 *   era: string,       // era id from POKEMON_TCG_ERAS
 *   size: number,      // pockets
 *   locked?: boolean,  // already filled; excluded from the optimisation
 *   sets: string[]     // set ids, oldest -> newest
 * }>}
 */
const POKETRACK_BINDERS = [
  // ---------- Mega Evolution ----------
  {
    id: "ME-01",
    era: "mega-evolution",
    size: 624,
    locked: true,
    sets: [
      "me-mega-evolution",
      "me-phantasmal-flames",
      "me-ascended-heroes",
      "me-perfect-order",
      "me-chaos-rising"
    ]
  },
  {
    id: "ME-02",
    era: "mega-evolution",
    size: 360,
    sets: ["me-pitch-black", "me-30th-celebration", "me-delta-reign"]
  },

  // ---------- Scarlet & Violet ----------
  // SV 151 lives in VNT-01 (below, with the Original Series vintage sets),
  // so Scarlet & Violet is necessarily filed in two runs. The split is free.
  {
    id: "SV-01",
    era: "scarlet-violet",
    size: 624,
    sets: ["sv-base", "sv-paldea-evolved", "sv-obsidian-flames"]
  },
  {
    id: "SV-02",
    era: "scarlet-violet",
    size: 624,
    sets: [
      "sv-paradox-rift",
      "sv-paldean-fates",
      "sv-temporal-forces",
      "sv-twilight-masquerade"
    ]
  },
  {
    id: "SV-03",
    era: "scarlet-violet",
    size: 1088,
    sets: [
      "sv-shrouded-fable",
      "sv-stellar-crown",
      "sv-surging-sparks",
      "sv-prismatic-evolutions",
      "sv-journey-together",
      "sv-destined-rivals",
      "sv-black-bolt",
      "sv-white-flare"
    ]
  },

  // ---------- Sword & Shield ----------
  {
    id: "SWSH-01",
    era: "sword-shield",
    size: 1088,
    sets: [
      "swsh-base",
      "swsh-rebel-clash",
      "swsh-darkness-ablaze",
      "swsh-champions-path",
      "swsh-vivid-voltage",
      "swsh-shining-fates",
      "swsh-battle-styles"
    ]
  },
  {
    id: "SWSH-02",
    era: "sword-shield",
    size: 720,
    sets: [
      "swsh-chilling-reign",
      "swsh-evolving-skies",
      "swsh-celebrations",
      "swsh-fusion-strike"
    ]
  },
  {
    id: "SWSH-03",
    era: "sword-shield",
    size: 1024,
    sets: [
      "swsh-brilliant-stars",
      "swsh-astral-radiance",
      "swsh-pokemon-go",
      "swsh-lost-origin",
      "swsh-silver-tempest",
      "swsh-crown-zenith"
    ]
  },

  // ---------- Sun & Moon ----------
  {
    id: "SM-01",
    era: "sun-moon",
    size: 1088,
    sets: [
      "sm-base",
      "sm-guardians-rising",
      "sm-burning-shadows",
      "sm-shining-legends",
      "sm-crimson-invasion",
      "sm-ultra-prism",
      "sm-forbidden-light",
      "sm-celestial-storm"
    ]
  },
  {
    id: "SM-02",
    era: "sun-moon",
    size: 720,
    sets: [
      "sm-dragon-majesty",
      "sm-lost-thunder",
      "sm-team-up",
      "sm-detective-pikachu",
      "sm-unbroken-bonds"
    ]
  },
  {
    id: "SM-03",
    era: "sun-moon",
    size: 576,
    sets: ["sm-unified-minds", "sm-hidden-fates", "sm-cosmic-eclipse"]
  },

  // ---------- XY ----------
  {
    id: "XY-01",
    era: "xy",
    size: 720,
    sets: [
      "xy-kalos-starter",
      "xy-base",
      "xy-flashfire",
      "xy-furious-fists",
      "xy-phantom-forces",
      "xy-primal-clash"
    ]
  },
  {
    id: "XY-02",
    era: "xy",
    size: 1024,
    sets: [
      "xy-double-crisis",
      "xy-roaring-skies",
      "xy-ancient-origins",
      "xy-breakthrough",
      "xy-breakpoint",
      "xy-generations",
      "xy-fates-collide",
      "xy-steam-siege",
      "xy-evolutions"
    ]
  },

  // ---------- Black & White ----------
  {
    id: "BW-01",
    era: "black-white",
    size: 720,
    sets: [
      "bw-base",
      "bw-emerging-powers",
      "bw-noble-victories",
      "bw-next-destinies",
      "bw-dark-explorers",
      "bw-dragons-exalted",
      "bw-dragon-vault"
    ]
  },
  {
    id: "BW-02",
    era: "black-white",
    size: 624,
    sets: [
      "bw-boundaries-crossed",
      "bw-plasma-storm",
      "bw-plasma-freeze",
      "bw-plasma-blast",
      "bw-legendary-treasures"
    ]
  },

  // ---------- HeartGold & SoulSilver ----------
  {
    id: "HGSS-01",
    era: "hgss",
    size: 540,
    sets: [
      "hgss-base",
      "hgss-unleashed",
      "hgss-undaunted",
      "hgss-triumphant",
      "hgss-call-of-legends"
    ]
  },

  // ---------- Platinum ----------
  {
    id: "PT-01",
    era: "platinum",
    size: 540,
    sets: ["pt-base", "pt-rising-rivals", "pt-supreme-victors", "pt-arceus"]
  },

  // ---------- Diamond & Pearl ----------
  {
    id: "DP-01",
    era: "diamond-pearl",
    size: 1024,
    sets: [
      "dp-base",
      "dp-mysterious-treasures",
      "dp-secret-wonders",
      "dp-great-encounters",
      "dp-majestic-dawn",
      "dp-legends-awakened",
      "dp-stormfront"
    ]
  },

  // ---------- EX Series ----------
  {
    id: "EX-01",
    era: "ex",
    size: 624,
    sets: [
      "ex-ruby-sapphire",
      "ex-sandstorm",
      "ex-dragon",
      "ex-team-magma-aqua",
      "ex-hidden-legends",
      "ex-firered-leafgreen"
    ]
  },
  {
    id: "EX-02",
    era: "ex",
    size: 1088,
    sets: [
      "ex-team-rocket-returns",
      "ex-deoxys",
      "ex-emerald",
      "ex-unseen-forces",
      "ex-delta-species",
      "ex-legend-maker",
      "ex-holon-phantoms",
      "ex-crystal-guardians",
      "ex-dragon-frontiers",
      "ex-power-keepers"
    ]
  },

  // ---------- e-Card ----------
  {
    id: "EC-01",
    era: "e-card",
    size: 480,
    sets: ["ecard-expedition", "ecard-aquapolis", "ecard-skyridge"]
  },

  // ---------- Legendary Collection ----------
  // Forced 49 empty pockets: a single 110-card generation, and 160 is the
  // smallest binder sold.
  {
    id: "LC-01",
    era: "legendary-collection",
    size: 160,
    sets: ["lc-base"]
  },

  // ---------- Neo ----------
  {
    id: "NEO-01",
    era: "neo",
    size: 360,
    sets: ["neo-genesis", "neo-discovery", "neo-revelation", "neo-destiny"]
  },

  // ---------- Original Series ----------
  // VNT-01 is the vintage binder: the three 1999 sets plus SV 151, which is
  // why it is the one binder that mixes generations. Locked, so the rule
  // never applied to it.
  {
    id: "VNT-01",
    era: "base",
    size: 480,
    locked: true,
    sets: ["base-set", "base-jungle", "base-fossil", "sv-151"]
  },
  {
    id: "OS-01",
    era: "base",
    size: 480,
    sets: ["base-set-2", "base-team-rocket", "gym-heroes", "gym-challenge"]
  }
];

/**
 * Eras deliberately left out of the plan entirely.
 * Kept as data so the generator can assert the exclusion rather than
 * silently reporting unallocated sets.
 */
const POKETRACK_BINDER_EXCLUDED_ERAS = ["other"];

/* Node (doc generator) uses require(); the browser uses the globals. */
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    POKETRACK_BINDERS,
    POKETRACK_BINDER_SIZES,
    POKETRACK_BINDER_EXCLUDED_ERAS
  };
}
