/**
 * Pokémon TCG Set Data
 *
 * Comprehensive list of all main-series Pokémon TCG English expansions,
 * organized by era. Card counts are based on Bulbapedia's expansion list:
 * https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_Trading_Card_Game_expansions
 *
 * Each set entry contains:
 *   - id:       unique identifier (used as the localStorage key)
 *   - name:     display name of the set
 *   - base:     number of cards in the base/printed set (the "main" set
 *               number, e.g. 198/198)
 *   - secret:   number of secret/extra cards printed beyond the base count
 *               (full arts, rainbow rares, gold cards, alt arts, Shiny
 *               Vault, Trainer Gallery, Galarian Gallery, Radiant
 *               Collection, etc.)
 *   - symbol:   URL of the set's expansion symbol image, served from
 *               Bulbagarden Archives (archives.bulbagarden.net). These
 *               URLs are the public file-page paths used by Bulbapedia
 *               itself; they're cached aggressively at the CDN layer
 *               and additionally cached by js/app.js for 7 days via the
 *               Cache Storage API. Optional — omit (or set to "") if no
 *               image is available; the renderer falls back to `fallback`.
 *   - fallback: short emoji shown when `symbol` is missing or fails to
 *               load. Required (defaults to "•" if not provided).
 *
 * Eras are listed newest-first so the most relevant sets appear at the
 * top of the page. WITHIN each era, sets are also listed newest-first
 * (most recent release at the top, oldest at the bottom) — this matches
 * how active collectors actually browse: the new set is what you're
 * filling in right now.
 *
 * Note on numeric literals: all numbers are written WITHOUT leading
 * zeros. In JavaScript, a leading-zero numeric literal like `030` is
 * parsed as octal (= decimal 24) under strict mode, which would
 * silently miscount.
 */

// Centralized base for set-symbol images. Using the canonical Bulbagarden
// Archives upload path keeps URLs short and lets us swap hosts later
// without touching every entry.
const SYMBOL_BASE = "https://archives.bulbagarden.net/media/upload";

const POKEMON_TCG_ERAS = [
  {
    id: "mega-evolution",
    name: "Mega Evolution",
    sets: [
      { id: "me-pitch-black",       name: "Pitch Black",                      base:  84, secret: 36, symbol: `${SYMBOL_BASE}/4/4b/SetSymbolPitch_Black.png`,        fallback: "⚫" },
      { id: "me-chaos-rising",      name: "Chaos Rising",                     base:  86, secret: 36, symbol: `${SYMBOL_BASE}/8/8f/SetSymbolChaos_Rising.png`,       fallback: "🌪" },
      { id: "me-perfect-order",     name: "Perfect Order",                    base:  88, secret: 36, symbol: `${SYMBOL_BASE}/2/2c/SetSymbolPerfect_Order.png`,      fallback: "🧩" },
      { id: "me-ascended-heroes",   name: "Ascended Heroes",                  base: 217, secret: 78, symbol: `${SYMBOL_BASE}/c/c8/SetSymbolAscended_Heroes.png`,    fallback: "✨" },
      { id: "me-phantasmal-flames", name: "Phantasmal Flames",                base:  94, secret: 36, symbol: `${SYMBOL_BASE}/0/0b/SetSymbolPhantasmal_Flames.png`,  fallback: "👻" },
      { id: "me-mega-evolution",    name: "Mega Evolution",                   base: 132, secret: 56, symbol: `${SYMBOL_BASE}/9/9c/SetSymbolMega_Evolution.png`,     fallback: "🌀" }
    ]
  },
  {
    id: "scarlet-violet",
    name: "Scarlet & Violet",
    sets: [
      { id: "sv-white-flare",          name: "White Flare",                   base:  86, secret:  87, symbol: `${SYMBOL_BASE}/4/4d/SetSymbolWhite_Flare.png`,           fallback: "⚪" },
      { id: "sv-black-bolt",           name: "Black Bolt",                    base:  86, secret:  86, symbol: `${SYMBOL_BASE}/1/13/SetSymbolBlack_Bolt.png`,            fallback: "⚫" },
      { id: "sv-destined-rivals",      name: "Destined Rivals",               base: 182, secret:  62, symbol: `${SYMBOL_BASE}/d/d2/SetSymbolDestined_Rivals.png`,       fallback: "⚔️" },
      { id: "sv-journey-together",     name: "Journey Together",              base: 159, secret:  31, symbol: `${SYMBOL_BASE}/6/64/SetSymbolJourney_Together.png`,      fallback: "🤝" },
      { id: "sv-prismatic-evolutions", name: "Prismatic Evolutions",          base: 131, secret:  49, symbol: `${SYMBOL_BASE}/0/05/SetSymbolPrismatic_Evolutions.png`,  fallback: "💎" },
      { id: "sv-surging-sparks",       name: "Surging Sparks",                base: 191, secret:  61, symbol: `${SYMBOL_BASE}/7/79/SetSymbolSurging_Sparks.png`,        fallback: "⚡" },
      { id: "sv-stellar-crown",        name: "Stellar Crown",                 base: 142, secret:  33, symbol: `${SYMBOL_BASE}/c/c0/SetSymbolStellar_Crown.png`,         fallback: "👑" },
      { id: "sv-shrouded-fable",       name: "Shrouded Fable",                base:  64, secret:  35, symbol: `${SYMBOL_BASE}/c/c4/SetSymbolShrouded_Fable.png`,        fallback: "🌫" },
      { id: "sv-twilight-masquerade",  name: "Twilight Masquerade",           base: 167, secret:  59, symbol: `${SYMBOL_BASE}/4/40/SetSymbolTwilight_Masquerade.png`,   fallback: "🎭" },
      { id: "sv-temporal-forces",      name: "Temporal Forces",               base: 162, secret:  56, symbol: `${SYMBOL_BASE}/4/45/SetSymbolTemporal_Forces.png`,       fallback: "⏳" },
      { id: "sv-paldean-fates",        name: "Paldean Fates",                 base:  91, secret: 154, symbol: `${SYMBOL_BASE}/2/2a/SetSymbolPaldean_Fates.png`,         fallback: "✨" },
      { id: "sv-paradox-rift",         name: "Paradox Rift",                  base: 182, secret:  84, symbol: `${SYMBOL_BASE}/5/5e/SetSymbolParadox_Rift.png`,          fallback: "🌀" },
      { id: "sv-151",                  name: "Scarlet & Violet 151",          base: 165, secret:  42, symbol: `${SYMBOL_BASE}/c/c8/SetSymbolScarlet_%26_Violet_151.png`,fallback: "1️⃣" },
      { id: "sv-obsidian-flames",      name: "Obsidian Flames",               base: 197, secret:  33, symbol: `${SYMBOL_BASE}/4/49/SetSymbolObsidian_Flames.png`,       fallback: "🔥" },
      { id: "sv-paldea-evolved",       name: "Paldea Evolved",                base: 193, secret:  86, symbol: `${SYMBOL_BASE}/f/f0/SetSymbolPaldea_Evolved.png`,        fallback: "🌿" },
      { id: "sv-base",                 name: "Scarlet & Violet",              base: 198, secret:  60, symbol: `${SYMBOL_BASE}/2/2d/SetSymbolScarlet_%26_Violet.png`,    fallback: "🔴" }
    ]
  },
  {
    id: "sword-shield",
    name: "Sword & Shield",
    sets: [
      { id: "swsh-crown-zenith",    name: "Crown Zenith",                    base: 159, secret: 71, symbol: `${SYMBOL_BASE}/9/97/SetSymbolCrown_Zenith.png`,    fallback: "👑" },
      { id: "swsh-silver-tempest",  name: "Silver Tempest",                  base: 195, secret: 50, symbol: `${SYMBOL_BASE}/9/95/SetSymbolSilver_Tempest.png`,  fallback: "🌪" },
      { id: "swsh-lost-origin",     name: "Lost Origin",                     base: 196, secret: 51, symbol: `${SYMBOL_BASE}/9/91/SetSymbolLost_Origin.png`,     fallback: "🌌" },
      { id: "swsh-pokemon-go",      name: "Pokémon GO",                      base:  78, secret: 10, symbol: `${SYMBOL_BASE}/0/09/SetSymbolPok%C3%A9mon_GO.png`, fallback: "📱" },
      { id: "swsh-astral-radiance", name: "Astral Radiance",                 base: 189, secret: 57, symbol: `${SYMBOL_BASE}/9/93/SetSymbolAstral_Radiance.png`, fallback: "🌠" },
      { id: "swsh-brilliant-stars", name: "Brilliant Stars",                 base: 172, secret: 44, symbol: `${SYMBOL_BASE}/9/9c/SetSymbolBrilliant_Stars.png`, fallback: "⭐" },
      { id: "swsh-fusion-strike",   name: "Fusion Strike",                   base: 264, secret: 20, symbol: `${SYMBOL_BASE}/4/4e/SetSymbolFusion_Strike.png`,   fallback: "🔀" },
      { id: "swsh-celebrations",    name: "Celebrations",                    base:  25, secret: 25, symbol: `${SYMBOL_BASE}/8/8a/SetSymbolCelebrations.png`,    fallback: "🎉" },
      { id: "swsh-evolving-skies",  name: "Evolving Skies",                  base: 203, secret: 34, symbol: `${SYMBOL_BASE}/4/4d/SetSymbolEvolving_Skies.png`,  fallback: "🐉" },
      { id: "swsh-chilling-reign",  name: "Chilling Reign",                  base: 198, secret: 35, symbol: `${SYMBOL_BASE}/d/d0/SetSymbolChilling_Reign.png`,  fallback: "❄️" },
      { id: "swsh-battle-styles",   name: "Battle Styles",                   base: 163, secret: 20, symbol: `${SYMBOL_BASE}/0/04/SetSymbolBattle_Styles.png`,   fallback: "🥋" },
      { id: "swsh-shining-fates",   name: "Shining Fates",                   base:  72, secret: 123, symbol: `${SYMBOL_BASE}/3/33/SetSymbolShining_Fates.png`,  fallback: "✨" },
      { id: "swsh-vivid-voltage",   name: "Vivid Voltage",                   base: 185, secret: 18, symbol: `${SYMBOL_BASE}/3/30/SetSymbolVivid_Voltage.png`,   fallback: "⚡" },
      { id: "swsh-champions-path",  name: "Champion's Path",                 base:  73, secret:  7, symbol: `${SYMBOL_BASE}/5/5c/SetSymbolChampion%27s_Path.png`, fallback: "🏆" },
      { id: "swsh-darkness-ablaze", name: "Darkness Ablaze",                 base: 189, secret: 12, symbol: `${SYMBOL_BASE}/4/41/SetSymbolDarkness_Ablaze.png`, fallback: "🌑" },
      { id: "swsh-rebel-clash",     name: "Rebel Clash",                     base: 192, secret: 17, symbol: `${SYMBOL_BASE}/d/dd/SetSymbolRebel_Clash.png`,     fallback: "⚔️" },
      { id: "swsh-base",            name: "Sword & Shield",                  base: 202, secret: 14, symbol: `${SYMBOL_BASE}/5/53/SetSymbolSword_%26_Shield.png`, fallback: "⚔️" }
    ]
  },
  {
    id: "sun-moon",
    name: "Sun & Moon",
    sets: [
      { id: "sm-cosmic-eclipse",     name: "Cosmic Eclipse",                 base: 236, secret: 35, symbol: `${SYMBOL_BASE}/4/4e/SetSymbolCosmic_Eclipse.png`,     fallback: "🌑" },
      { id: "sm-hidden-fates",       name: "Hidden Fates",                   base:  68, secret: 95, symbol: `${SYMBOL_BASE}/2/22/SetSymbolHidden_Fates.png`,       fallback: "🌙" },
      { id: "sm-unified-minds",      name: "Unified Minds",                  base: 236, secret: 22, symbol: `${SYMBOL_BASE}/8/8e/SetSymbolUnified_Minds.png`,      fallback: "🧠" },
      { id: "sm-unbroken-bonds",     name: "Unbroken Bonds",                 base: 214, secret: 20, symbol: `${SYMBOL_BASE}/0/0c/SetSymbolUnbroken_Bonds.png`,     fallback: "🔗" },
      { id: "sm-detective-pikachu",  name: "Detective Pikachu",              base:  18, secret:  0, symbol: `${SYMBOL_BASE}/2/2e/SetSymbolDetective_Pikachu.png`,  fallback: "🔍" },
      { id: "sm-team-up",            name: "Team Up",                        base: 181, secret: 15, symbol: `${SYMBOL_BASE}/4/4f/SetSymbolTeam_Up.png`,            fallback: "🤝" },
      { id: "sm-lost-thunder",       name: "Lost Thunder",                   base: 214, secret: 22, symbol: `${SYMBOL_BASE}/3/3d/SetSymbolLost_Thunder.png`,       fallback: "⚡" },
      { id: "sm-dragon-majesty",     name: "Dragon Majesty",                 base:  70, secret:  8, symbol: `${SYMBOL_BASE}/2/22/SetSymbolDragon_Majesty.png`,     fallback: "🐉" },
      { id: "sm-celestial-storm",    name: "Celestial Storm",                base: 168, secret: 15, symbol: `${SYMBOL_BASE}/8/80/SetSymbolCelestial_Storm.png`,    fallback: "🌌" },
      { id: "sm-forbidden-light",    name: "Forbidden Light",                base: 131, secret: 15, symbol: `${SYMBOL_BASE}/6/61/SetSymbolForbidden_Light.png`,    fallback: "💡" },
      { id: "sm-ultra-prism",        name: "Ultra Prism",                    base: 156, secret: 17, symbol: `${SYMBOL_BASE}/0/0c/SetSymbolUltra_Prism.png`,        fallback: "🔷" },
      { id: "sm-crimson-invasion",   name: "Crimson Invasion",               base: 111, secret: 13, symbol: `${SYMBOL_BASE}/c/c4/SetSymbolCrimson_Invasion.png`,   fallback: "🟥" },
      { id: "sm-shining-legends",    name: "Shining Legends",                base:  73, secret:  5, symbol: `${SYMBOL_BASE}/9/96/SetSymbolShining_Legends.png`,    fallback: "✨" },
      { id: "sm-burning-shadows",    name: "Burning Shadows",                base: 147, secret: 22, symbol: `${SYMBOL_BASE}/3/30/SetSymbolBurning_Shadows.png`,    fallback: "🔥" },
      { id: "sm-guardians-rising",   name: "Guardians Rising",               base: 145, secret: 24, symbol: `${SYMBOL_BASE}/8/8a/SetSymbolGuardians_Rising.png`,   fallback: "🛡" },
      { id: "sm-base",               name: "Sun & Moon",                     base: 149, secret: 14, symbol: `${SYMBOL_BASE}/0/03/SetSymbolSun_%26_Moon.png`,       fallback: "☀️" }
    ]
  },
  {
    id: "xy",
    name: "XY",
    sets: [
      { id: "xy-evolutions",      name: "Evolutions",                        base: 108, secret:  5, symbol: `${SYMBOL_BASE}/2/2f/SetSymbolEvolutions.png`,        fallback: "🧬" },
      { id: "xy-steam-siege",     name: "Steam Siege",                       base: 114, secret:  2, symbol: `${SYMBOL_BASE}/3/3e/SetSymbolSteam_Siege.png`,       fallback: "🚂" },
      { id: "xy-fates-collide",   name: "Fates Collide",                     base: 124, secret:  1, symbol: `${SYMBOL_BASE}/8/84/SetSymbolFates_Collide.png`,     fallback: "🔮" },
      { id: "xy-generations",     name: "Generations",                       base:  83, secret: 32, symbol: `${SYMBOL_BASE}/7/72/SetSymbolGenerations.png`,       fallback: "🎂" },
      { id: "xy-breakpoint",      name: "BREAKpoint",                        base: 122, secret:  1, symbol: `${SYMBOL_BASE}/1/19/SetSymbolBREAKpoint.png`,        fallback: "💥" },
      { id: "xy-breakthrough",    name: "BREAKthrough",                      base: 162, secret:  2, symbol: `${SYMBOL_BASE}/c/cb/SetSymbolBREAKthrough.png`,      fallback: "💥" },
      { id: "xy-ancient-origins", name: "Ancient Origins",                   base:  98, secret:  2, symbol: `${SYMBOL_BASE}/9/96/SetSymbolAncient_Origins.png`,   fallback: "🗿" },
      { id: "xy-roaring-skies",   name: "Roaring Skies",                     base: 108, secret:  2, symbol: `${SYMBOL_BASE}/8/8a/SetSymbolRoaring_Skies.png`,     fallback: "🐲" },
      { id: "xy-double-crisis",   name: "Double Crisis",                     base:  34, secret:  0, symbol: `${SYMBOL_BASE}/4/4d/SetSymbolDouble_Crisis.png`,     fallback: "💢" },
      { id: "xy-primal-clash",    name: "Primal Clash",                      base: 160, secret:  4, symbol: `${SYMBOL_BASE}/c/cf/SetSymbolPrimal_Clash.png`,      fallback: "🌊" },
      { id: "xy-phantom-forces",  name: "Phantom Forces",                    base: 119, secret:  3, symbol: `${SYMBOL_BASE}/0/0d/SetSymbolPhantom_Forces.png`,    fallback: "👻" },
      { id: "xy-furious-fists",   name: "Furious Fists",                     base: 111, secret:  2, symbol: `${SYMBOL_BASE}/6/62/SetSymbolFurious_Fists.png`,     fallback: "👊" },
      { id: "xy-flashfire",       name: "Flashfire",                         base: 106, secret:  3, symbol: `${SYMBOL_BASE}/c/c6/SetSymbolFlashfire.png`,         fallback: "🔥" },
      { id: "xy-base",            name: "XY",                                base: 146, secret:  0, symbol: `${SYMBOL_BASE}/8/80/SetSymbolXY.png`,                fallback: "✖️" },
      { id: "xy-kalos-starter",   name: "Kalos Starter Set",                 base:  39, secret:  0, symbol: `${SYMBOL_BASE}/4/47/SetSymbolKalos_Starter_Set.png`, fallback: "🎴" }
    ]
  },
  {
    id: "black-white",
    name: "Black & White",
    sets: [
      { id: "bw-legendary-treasures", name: "Legendary Treasures",           base: 113, secret: 27, symbol: `${SYMBOL_BASE}/c/c8/SetSymbolLegendary_Treasures.png`, fallback: "🏺" },
      { id: "bw-plasma-blast",        name: "Plasma Blast",                  base: 101, secret:  4, symbol: `${SYMBOL_BASE}/8/84/SetSymbolPlasma_Blast.png`,        fallback: "💣" },
      { id: "bw-plasma-freeze",       name: "Plasma Freeze",                 base: 116, secret:  6, symbol: `${SYMBOL_BASE}/8/82/SetSymbolPlasma_Freeze.png`,       fallback: "🧊" },
      { id: "bw-plasma-storm",        name: "Plasma Storm",                  base: 135, secret:  3, symbol: `${SYMBOL_BASE}/7/77/SetSymbolPlasma_Storm.png`,        fallback: "🌩" },
      { id: "bw-boundaries-crossed",  name: "Boundaries Crossed",            base: 149, secret:  4, symbol: `${SYMBOL_BASE}/3/3b/SetSymbolBoundaries_Crossed.png`,  fallback: "🌐" },
      { id: "bw-dragon-vault",        name: "Dragon Vault",                  base:  20, secret:  1, symbol: `${SYMBOL_BASE}/3/32/SetSymbolDragon_Vault.png`,        fallback: "🐉" },
      { id: "bw-dragons-exalted",     name: "Dragons Exalted",               base: 124, secret:  4, symbol: `${SYMBOL_BASE}/4/4e/SetSymbolDragons_Exalted.png`,     fallback: "🐲" },
      { id: "bw-dark-explorers",      name: "Dark Explorers",                base: 108, secret:  3, symbol: `${SYMBOL_BASE}/c/cb/SetSymbolDark_Explorers.png`,      fallback: "🌑" },
      { id: "bw-next-destinies",      name: "Next Destinies",                base:  99, secret:  4, symbol: `${SYMBOL_BASE}/c/cf/SetSymbolNext_Destinies.png`,      fallback: "➡️" },
      { id: "bw-noble-victories",     name: "Noble Victories",               base: 101, secret:  1, symbol: `${SYMBOL_BASE}/9/97/SetSymbolNoble_Victories.png`,     fallback: "🏅" },
      { id: "bw-emerging-powers",     name: "Emerging Powers",               base:  98, secret:  0, symbol: `${SYMBOL_BASE}/0/0a/SetSymbolEmerging_Powers.png`,     fallback: "💪" },
      { id: "bw-base",                name: "Black & White",                 base: 114, secret:  1, symbol: `${SYMBOL_BASE}/8/89/SetSymbolBlack_%26_White.png`,     fallback: "⚫" }
    ]
  },
  {
    id: "hgss",
    name: "HeartGold & SoulSilver",
    sets: [
      { id: "hgss-call-of-legends", name: "Call of Legends",                 base:  95, secret: 11, symbol: `${SYMBOL_BASE}/4/45/SetSymbolCall_of_Legends.png`, fallback: "🌟" },
      { id: "hgss-triumphant",      name: "HS—Triumphant",                   base: 102, secret:  1, symbol: `${SYMBOL_BASE}/d/d4/SetSymbolHS%E2%80%94Triumphant.png`, fallback: "🏆" },
      { id: "hgss-undaunted",       name: "HS—Undaunted",                    base:  90, secret:  1, symbol: `${SYMBOL_BASE}/1/13/SetSymbolHS%E2%80%94Undaunted.png`,  fallback: "🛡" },
      { id: "hgss-unleashed",       name: "HS—Unleashed",                    base:  95, secret:  1, symbol: `${SYMBOL_BASE}/3/3b/SetSymbolHS%E2%80%94Unleashed.png`,  fallback: "🔓" },
      { id: "hgss-base",            name: "HeartGold & SoulSilver",          base: 123, secret:  1, symbol: `${SYMBOL_BASE}/2/2e/SetSymbolHeartGold_%26_SoulSilver.png`, fallback: "💛" }
    ]
  },
  {
    id: "diamond-pearl",
    name: "Diamond & Pearl / Platinum",
    sets: [
      { id: "pt-arceus",              name: "Arceus",                        base:  99, secret: 12, symbol: `${SYMBOL_BASE}/9/9c/SetSymbolArceus.png`,              fallback: "🌟" },
      { id: "pt-supreme-victors",     name: "Supreme Victors",               base: 147, secret:  6, symbol: `${SYMBOL_BASE}/6/63/SetSymbolSupreme_Victors.png`,     fallback: "🏆" },
      { id: "pt-rising-rivals",       name: "Rising Rivals",                 base: 111, secret:  9, symbol: `${SYMBOL_BASE}/2/22/SetSymbolRising_Rivals.png`,       fallback: "⚔️" },
      { id: "pt-base",                name: "Platinum",                      base: 127, secret:  6, symbol: `${SYMBOL_BASE}/9/9e/SetSymbolPlatinum.png`,            fallback: "⬜" },
      { id: "dp-stormfront",          name: "Stormfront",                    base: 100, secret:  6, symbol: `${SYMBOL_BASE}/0/04/SetSymbolStormfront.png`,          fallback: "🌩" },
      { id: "dp-legends-awakened",    name: "Legends Awakened",              base: 146, secret:  0, symbol: `${SYMBOL_BASE}/d/de/SetSymbolLegends_Awakened.png`,    fallback: "📜" },
      { id: "dp-majestic-dawn",       name: "Majestic Dawn",                 base: 100, secret:  0, symbol: `${SYMBOL_BASE}/3/3c/SetSymbolMajestic_Dawn.png`,       fallback: "🌅" },
      { id: "dp-great-encounters",    name: "Great Encounters",              base: 106, secret:  0, symbol: `${SYMBOL_BASE}/0/0a/SetSymbolGreat_Encounters.png`,    fallback: "🤝" },
      { id: "dp-secret-wonders",      name: "Secret Wonders",                base: 132, secret:  0, symbol: `${SYMBOL_BASE}/e/e3/SetSymbolSecret_Wonders.png`,      fallback: "❓" },
      { id: "dp-mysterious-treasures",name: "Mysterious Treasures",          base: 123, secret:  1, symbol: `${SYMBOL_BASE}/f/f0/SetSymbolMysterious_Treasures.png`,fallback: "💎" },
      { id: "dp-base",                name: "Diamond & Pearl",               base: 130, secret:  0, symbol: `${SYMBOL_BASE}/4/43/SetSymbolDiamond_%26_Pearl.png`,   fallback: "💠" }
    ]
  },
  {
    id: "ex",
    name: "EX Series",
    sets: [
      { id: "ex-power-keepers",       name: "EX Power Keepers",              base: 108, secret:  0, symbol: `${SYMBOL_BASE}/8/8e/SetSymbolEX_Power_Keepers.png`,       fallback: "🔋" },
      { id: "ex-dragon-frontiers",    name: "EX Dragon Frontiers",           base: 101, secret:  0, symbol: `${SYMBOL_BASE}/c/cd/SetSymbolEX_Dragon_Frontiers.png`,    fallback: "🐉" },
      { id: "ex-crystal-guardians",   name: "EX Crystal Guardians",          base: 100, secret:  0, symbol: `${SYMBOL_BASE}/1/16/SetSymbolEX_Crystal_Guardians.png`,   fallback: "🔮" },
      { id: "ex-holon-phantoms",      name: "EX Holon Phantoms",             base: 110, secret:  1, symbol: `${SYMBOL_BASE}/4/4d/SetSymbolEX_Holon_Phantoms.png`,      fallback: "👻" },
      { id: "ex-legend-maker",        name: "EX Legend Maker",               base:  92, secret:  1, symbol: `${SYMBOL_BASE}/4/4f/SetSymbolEX_Legend_Maker.png`,        fallback: "📜" },
      { id: "ex-delta-species",       name: "EX Delta Species",              base: 113, secret:  1, symbol: `${SYMBOL_BASE}/4/4c/SetSymbolEX_Delta_Species.png`,       fallback: "Δ"  },
      { id: "ex-unseen-forces",       name: "EX Unseen Forces",              base: 115, secret: 30, symbol: `${SYMBOL_BASE}/d/db/SetSymbolEX_Unseen_Forces.png`,       fallback: "👁" },
      { id: "ex-emerald",             name: "EX Emerald",                    base: 106, secret:  1, symbol: `${SYMBOL_BASE}/8/83/SetSymbolEX_Emerald.png`,             fallback: "💚" },
      { id: "ex-deoxys",              name: "EX Deoxys",                     base: 107, secret:  1, symbol: `${SYMBOL_BASE}/4/4f/SetSymbolEX_Deoxys.png`,              fallback: "🧬" },
      { id: "ex-team-rocket-returns", name: "EX Team Rocket Returns",        base: 109, secret:  2, symbol: `${SYMBOL_BASE}/d/d3/SetSymbolEX_Team_Rocket_Returns.png`, fallback: "🅡" },
      { id: "ex-firered-leafgreen",   name: "EX FireRed & LeafGreen",        base: 112, secret:  4, symbol: `${SYMBOL_BASE}/6/68/SetSymbolEX_FireRed_%26_LeafGreen.png`,fallback: "🔥" },
      { id: "ex-hidden-legends",      name: "EX Hidden Legends",             base: 101, secret:  1, symbol: `${SYMBOL_BASE}/3/3d/SetSymbolEX_Hidden_Legends.png`,      fallback: "🗿" },
      { id: "ex-team-magma-aqua",     name: "EX Team Magma vs Team Aqua",    base:  95, secret:  2, symbol: `${SYMBOL_BASE}/3/36/SetSymbolEX_Team_Magma_vs_Team_Aqua.png`, fallback: "🌋" },
      { id: "ex-dragon",              name: "EX Dragon",                     base:  97, secret:  3, symbol: `${SYMBOL_BASE}/5/52/SetSymbolEX_Dragon.png`,              fallback: "🐲" },
      { id: "ex-sandstorm",           name: "EX Sandstorm",                  base: 100, secret:  0, symbol: `${SYMBOL_BASE}/8/8c/SetSymbolEX_Sandstorm.png`,           fallback: "🏜" },
      { id: "ex-ruby-sapphire",       name: "EX Ruby & Sapphire",            base: 109, secret:  0, symbol: `${SYMBOL_BASE}/3/3a/SetSymbolEX_Ruby_%26_Sapphire.png`,   fallback: "💎" }
    ]
  },
  {
    id: "e-card",
    name: "e-Card",
    sets: [
      { id: "ecard-skyridge",   name: "Skyridge",                            base: 144, secret: 38, symbol: `${SYMBOL_BASE}/2/2c/SetSymbolSkyridge.png`,            fallback: "🌥" },
      { id: "ecard-aquapolis",  name: "Aquapolis",                           base: 147, secret: 35, symbol: `${SYMBOL_BASE}/8/89/SetSymbolAquapolis.png`,           fallback: "🌊" },
      { id: "ecard-expedition", name: "Expedition Base Set",                 base: 165, secret:  0, symbol: `${SYMBOL_BASE}/6/64/SetSymbolExpedition_Base_Set.png`, fallback: "🧭" }
    ]
  },
  {
    id: "legendary-collection",
    name: "Legendary Collection",
    sets: [
      { id: "lc-base", name: "Legendary Collection",                         base: 110, secret:  0, symbol: `${SYMBOL_BASE}/9/97/SetSymbolLegendary_Collection.png`, fallback: "🏛" }
    ]
  },
  {
    id: "neo",
    name: "Neo",
    sets: [
      { id: "neo-destiny",     name: "Neo Destiny",                          base: 105, secret: 8, symbol: `${SYMBOL_BASE}/4/4b/SetSymbolNeo_Destiny.png`,     fallback: "🌙" },
      { id: "neo-revelation",  name: "Neo Revelation",                       base:  64, secret: 2, symbol: `${SYMBOL_BASE}/4/4d/SetSymbolNeo_Revelation.png`,  fallback: "📖" },
      { id: "neo-discovery",   name: "Neo Discovery",                        base:  75, secret: 0, symbol: `${SYMBOL_BASE}/7/7e/SetSymbolNeo_Discovery.png`,   fallback: "🔭" },
      { id: "neo-genesis",     name: "Neo Genesis",                          base: 111, secret: 0, symbol: `${SYMBOL_BASE}/c/c4/SetSymbolNeo_Genesis.png`,     fallback: "🌱" }
    ]
  },
  {
    id: "gym",
    name: "Gym",
    sets: [
      { id: "gym-challenge", name: "Gym Challenge",                          base: 132, secret: 0, symbol: `${SYMBOL_BASE}/3/30/SetSymbolGym_Challenge.png`, fallback: "🥊" },
      { id: "gym-heroes",    name: "Gym Heroes",                             base: 132, secret: 0, symbol: `${SYMBOL_BASE}/0/0c/SetSymbolGym_Heroes.png`,    fallback: "🦸" }
    ]
  },
  {
    id: "base",
    name: "Original / Base Series",
    sets: [
      { id: "base-team-rocket", name: "Team Rocket",                         base:  82, secret: 1, symbol: `${SYMBOL_BASE}/4/42/SetSymbolTeam_Rocket.png`, fallback: "🅡" },
      { id: "base-set-2",       name: "Base Set 2",                          base: 130, secret: 0, symbol: `${SYMBOL_BASE}/5/5f/SetSymbolBase_Set_2.png`,  fallback: "2️⃣" },
      { id: "base-fossil",      name: "Fossil",                              base:  62, secret: 0, symbol: `${SYMBOL_BASE}/0/07/SetSymbolFossil.png`,      fallback: "🦴" },
      { id: "base-jungle",      name: "Jungle",                              base:  64, secret: 0, symbol: `${SYMBOL_BASE}/d/dd/SetSymbolJungle.png`,      fallback: "🌴" },
      { id: "base-set",         name: "Base Set",                            base: 102, secret: 0, symbol: `${SYMBOL_BASE}/d/d2/SetSymbolBase_Set.png`,    fallback: "🟡" }
    ]
  },
  {
    id: "other",
    name: "Other",
    sets: [
      // Trick or Trade (newest first)
      { id: "other-tot-2024", name: "Trick or Trade 2024",                   base:  30, secret: 0, symbol: "", fallback: "🎃" },
      { id: "other-tot-2023", name: "Trick or Trade 2023",                   base:  30, secret: 0, symbol: "", fallback: "🎃" },
      { id: "other-tot-2022", name: "Trick or Trade 2022",                   base:  30, secret: 0, symbol: "", fallback: "🎃" },
      // McDonald's Collection (newest first)
      { id: "other-mcd-2024", name: "McDonald's Collection 2024",            base:  15, secret: 0, symbol: "", fallback: "🍟" },
      { id: "other-mcd-2023", name: "McDonald's Collection 2023",            base:  15, secret: 0, symbol: "", fallback: "🍟" },
      { id: "other-mcd-2022", name: "McDonald's Collection 2022",            base:  15, secret: 0, symbol: "", fallback: "🍟" },
      { id: "other-mcd-2021", name: "McDonald's Collection 2021",            base:  25, secret: 0, symbol: "", fallback: "🍟" },
      { id: "other-mcd-2019", name: "McDonald's Collection 2019",            base:  12, secret: 0, symbol: "", fallback: "🍟" },
      { id: "other-mcd-2018", name: "McDonald's Collection 2018",            base:  12, secret: 0, symbol: "", fallback: "🍟" },
      { id: "other-mcd-2017", name: "McDonald's Collection 2017",            base:  12, secret: 0, symbol: "", fallback: "🍟" },
      { id: "other-mcd-2016", name: "McDonald's Collection 2016",            base:  12, secret: 0, symbol: "", fallback: "🍟" },
      { id: "other-mcd-2015", name: "McDonald's Collection 2015",            base:  12, secret: 0, symbol: "", fallback: "🍟" },
      { id: "other-mcd-2014", name: "McDonald's Collection 2014",            base:  12, secret: 0, symbol: "", fallback: "🍟" },
      { id: "other-mcd-2013", name: "McDonald's Collection 2013",            base:  12, secret: 0, symbol: "", fallback: "🍟" },
      { id: "other-mcd-2012", name: "McDonald's Collection 2012",            base:  12, secret: 0, symbol: "", fallback: "🍟" },
      { id: "other-mcd-2011", name: "McDonald's Collection 2011",            base:  12, secret: 0, symbol: "", fallback: "🍟" },
      // Basic Energy Cards (newest first)
      { id: "other-mee-basic-energies", name: "MEE Basic Energies",          base:   8, secret: 0, symbol: "", fallback: "🔋" },
      { id: "other-sve-basic-energies", name: "SVE Basic Energies",          base:  24, secret: 0, symbol: "", fallback: "🔋" }
    ]
  }
];

// Export for both <script> and module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = POKEMON_TCG_ERAS;
}
