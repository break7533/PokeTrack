/**
 * Pokémon TCG Set Data
 *
 * Comprehensive list of all main-series Pokémon TCG English expansions,
 * organized by era. Card counts are based on Bulbapedia's expansion list:
 * https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_Trading_Card_Game_expansions
 *
 * Each set entry contains:
 *   - id:     unique identifier (used as the localStorage key)
 *   - name:   display name of the set
 *   - base:   number of cards in the base/printed set (the "main" set number,
 *             e.g. 198/198)
 *   - secret: number of secret/extra cards printed beyond the base count
 *             (full arts, rainbow rares, gold cards, alt arts, Shiny Vault,
 *             Trainer Gallery, Galarian Gallery, Radiant Collection, etc.)
 *
 * Eras are listed newest-first so the most relevant sets appear at the top.
 *
 * Note on numeric literals: all numbers are written WITHOUT leading zeros.
 * In JavaScript, a leading-zero numeric literal like `030` is parsed as
 * octal (= decimal 24) under strict mode, which would silently miscount.
 */
const POKEMON_TCG_ERAS = [
  {
    id: "mega-evolution",
    name: "Mega Evolution",
    sets: [
      { id: "me-mega-evolution",    name: "Mega Evolution",                   base: 132, secret: 56 },
      { id: "me-phantasmal-flames", name: "Phantasmal Flames",                base:  94, secret: 36 },
      { id: "me-ascended-heroes",   name: "Ascended Heroes",                  base: 217, secret: 78 },
      { id: "me-perfect-order",     name: "Perfect Order",                    base:  88, secret: 36 },
      { id: "me-chaos-rising",      name: "Chaos Rising",                     base:  86, secret: 36 },
      { id: "me-pitch-black",       name: "Pitch Black",                      base:  84, secret: 36 }
    ]
  },
  {
    id: "scarlet-violet",
    name: "Scarlet & Violet",
    sets: [
      { id: "sv-base",                 name: "Scarlet & Violet",              base: 198, secret:  60 },
      { id: "sv-paldea-evolved",       name: "Paldea Evolved",                base: 193, secret:  86 },
      { id: "sv-obsidian-flames",     name: "Obsidian Flames",                base: 197, secret:  33 },
      { id: "sv-151",                 name: "Scarlet & Violet 151",           base: 165, secret:  42 },
      { id: "sv-paradox-rift",        name: "Paradox Rift",                   base: 182, secret:  84 },
      { id: "sv-paldean-fates",       name: "Paldean Fates",                  base:  91, secret: 154 },
      { id: "sv-temporal-forces",     name: "Temporal Forces",                base: 162, secret:  56 },
      { id: "sv-twilight-masquerade", name: "Twilight Masquerade",            base: 167, secret:  59 },
      { id: "sv-shrouded-fable",      name: "Shrouded Fable",                 base:  64, secret:  35 },
      { id: "sv-stellar-crown",       name: "Stellar Crown",                  base: 142, secret:  33 },
      { id: "sv-surging-sparks",      name: "Surging Sparks",                 base: 191, secret:  61 },
      { id: "sv-prismatic-evolutions",name: "Prismatic Evolutions",           base: 131, secret:  49 },
      { id: "sv-journey-together",    name: "Journey Together",               base: 159, secret:  31 },
      { id: "sv-destined-rivals",     name: "Destined Rivals",                base: 182, secret:  62 },
      { id: "sv-black-bolt",          name: "Black Bolt",                     base:  86, secret:  86 },
      { id: "sv-white-flare",         name: "White Flare",                    base:  86, secret:  87 }
    ]
  },
  {
    id: "sword-shield",
    name: "Sword & Shield",
    sets: [
      { id: "swsh-base",            name: "Sword & Shield",                  base: 202, secret: 14 },
      { id: "swsh-rebel-clash",     name: "Rebel Clash",                     base: 192, secret: 17 },
      { id: "swsh-darkness-ablaze", name: "Darkness Ablaze",                 base: 189, secret: 12 },
      { id: "swsh-champions-path",  name: "Champion's Path",                 base:  73, secret:  7 },
      { id: "swsh-vivid-voltage",   name: "Vivid Voltage",                   base: 185, secret: 18 },
      { id: "swsh-shining-fates",   name: "Shining Fates",                   base:  72, secret: 123 },
      { id: "swsh-battle-styles",   name: "Battle Styles",                   base: 163, secret: 20 },
      { id: "swsh-chilling-reign",  name: "Chilling Reign",                  base: 198, secret: 35 },
      { id: "swsh-evolving-skies",  name: "Evolving Skies",                  base: 203, secret: 34 },
      { id: "swsh-celebrations",    name: "Celebrations",                    base:  25, secret: 25 },
      { id: "swsh-fusion-strike",   name: "Fusion Strike",                   base: 264, secret: 20 },
      { id: "swsh-brilliant-stars", name: "Brilliant Stars",                 base: 172, secret: 44 },
      { id: "swsh-astral-radiance", name: "Astral Radiance",                 base: 189, secret: 57 },
      { id: "swsh-pokemon-go",      name: "Pokémon GO",                      base:  78, secret: 10 },
      { id: "swsh-lost-origin",     name: "Lost Origin",                     base: 196, secret: 51 },
      { id: "swsh-silver-tempest",  name: "Silver Tempest",                  base: 195, secret: 50 },
      { id: "swsh-crown-zenith",    name: "Crown Zenith",                    base: 159, secret: 71 }
    ]
  },
  {
    id: "sun-moon",
    name: "Sun & Moon",
    sets: [
      { id: "sm-base",               name: "Sun & Moon",                     base: 149, secret: 14 },
      { id: "sm-guardians-rising",   name: "Guardians Rising",               base: 145, secret: 24 },
      { id: "sm-burning-shadows",    name: "Burning Shadows",                base: 147, secret: 22 },
      { id: "sm-shining-legends",    name: "Shining Legends",                base:  73, secret:  5 },
      { id: "sm-crimson-invasion",   name: "Crimson Invasion",               base: 111, secret: 13 },
      { id: "sm-ultra-prism",        name: "Ultra Prism",                    base: 156, secret: 17 },
      { id: "sm-forbidden-light",    name: "Forbidden Light",                base: 131, secret: 15 },
      { id: "sm-celestial-storm",    name: "Celestial Storm",                base: 168, secret: 15 },
      { id: "sm-dragon-majesty",     name: "Dragon Majesty",                 base:  70, secret:  8 },
      { id: "sm-lost-thunder",       name: "Lost Thunder",                   base: 214, secret: 22 },
      { id: "sm-team-up",            name: "Team Up",                        base: 181, secret: 15 },
      { id: "sm-detective-pikachu",  name: "Detective Pikachu",              base:  18, secret:  0 },
      { id: "sm-unbroken-bonds",     name: "Unbroken Bonds",                 base: 214, secret: 20 },
      { id: "sm-unified-minds",      name: "Unified Minds",                  base: 236, secret: 22 },
      { id: "sm-hidden-fates",       name: "Hidden Fates",                   base:  68, secret: 95 },
      { id: "sm-cosmic-eclipse",     name: "Cosmic Eclipse",                 base: 236, secret: 35 }
    ]
  },
  {
    id: "xy",
    name: "XY",
    sets: [
      { id: "xy-kalos-starter",   name: "Kalos Starter Set",                 base:  39, secret:  0 },
      { id: "xy-base",            name: "XY",                                base: 146, secret:  0 },
      { id: "xy-flashfire",       name: "Flashfire",                         base: 106, secret:  3 },
      { id: "xy-furious-fists",   name: "Furious Fists",                     base: 111, secret:  2 },
      { id: "xy-phantom-forces",  name: "Phantom Forces",                    base: 119, secret:  3 },
      { id: "xy-primal-clash",    name: "Primal Clash",                      base: 160, secret:  4 },
      { id: "xy-double-crisis",   name: "Double Crisis",                     base:  34, secret:  0 },
      { id: "xy-roaring-skies",   name: "Roaring Skies",                     base: 108, secret:  2 },
      { id: "xy-ancient-origins", name: "Ancient Origins",                   base:  98, secret:  2 },
      { id: "xy-breakthrough",    name: "BREAKthrough",                      base: 162, secret:  2 },
      { id: "xy-breakpoint",      name: "BREAKpoint",                        base: 122, secret:  1 },
      { id: "xy-generations",     name: "Generations",                       base:  83, secret: 32 },
      { id: "xy-fates-collide",   name: "Fates Collide",                     base: 124, secret:  1 },
      { id: "xy-steam-siege",     name: "Steam Siege",                       base: 114, secret:  2 },
      { id: "xy-evolutions",      name: "Evolutions",                        base: 108, secret:  5 }
    ]
  },
  {
    id: "black-white",
    name: "Black & White",
    sets: [
      { id: "bw-base",                name: "Black & White",                 base: 114, secret:  1 },
      { id: "bw-emerging-powers",     name: "Emerging Powers",               base:  98, secret:  0 },
      { id: "bw-noble-victories",     name: "Noble Victories",               base: 101, secret:  1 },
      { id: "bw-next-destinies",      name: "Next Destinies",                base:  99, secret:  4 },
      { id: "bw-dark-explorers",      name: "Dark Explorers",                base: 108, secret:  3 },
      { id: "bw-dragons-exalted",     name: "Dragons Exalted",               base: 124, secret:  4 },
      { id: "bw-dragon-vault",        name: "Dragon Vault",                  base:  20, secret:  1 },
      { id: "bw-boundaries-crossed",  name: "Boundaries Crossed",            base: 149, secret:  4 },
      { id: "bw-plasma-storm",        name: "Plasma Storm",                  base: 135, secret:  3 },
      { id: "bw-plasma-freeze",       name: "Plasma Freeze",                 base: 116, secret:  6 },
      { id: "bw-plasma-blast",        name: "Plasma Blast",                  base: 101, secret:  4 },
      { id: "bw-legendary-treasures", name: "Legendary Treasures",           base: 113, secret: 27 }
    ]
  },
  {
    id: "hgss",
    name: "HeartGold & SoulSilver",
    sets: [
      { id: "hgss-base",            name: "HeartGold & SoulSilver",          base: 123, secret:  1 },
      { id: "hgss-unleashed",       name: "HS—Unleashed",                    base:  95, secret:  1 },
      { id: "hgss-undaunted",       name: "HS—Undaunted",                    base:  90, secret:  1 },
      { id: "hgss-triumphant",      name: "HS—Triumphant",                   base: 102, secret:  1 },
      { id: "hgss-call-of-legends", name: "Call of Legends",                 base:  95, secret: 11 }
    ]
  },
  {
    id: "diamond-pearl",
    name: "Diamond & Pearl / Platinum",
    sets: [
      { id: "dp-base",                name: "Diamond & Pearl",               base: 130, secret:  0 },
      { id: "dp-mysterious-treasures",name: "Mysterious Treasures",          base: 123, secret:  1 },
      { id: "dp-secret-wonders",      name: "Secret Wonders",                base: 132, secret:  0 },
      { id: "dp-great-encounters",    name: "Great Encounters",              base: 106, secret:  0 },
      { id: "dp-majestic-dawn",       name: "Majestic Dawn",                 base: 100, secret:  0 },
      { id: "dp-legends-awakened",    name: "Legends Awakened",              base: 146, secret:  0 },
      { id: "dp-stormfront",          name: "Stormfront",                    base: 100, secret:  6 },
      { id: "pt-base",                name: "Platinum",                      base: 127, secret:  6 },
      { id: "pt-rising-rivals",       name: "Rising Rivals",                 base: 111, secret:  9 },
      { id: "pt-supreme-victors",     name: "Supreme Victors",               base: 147, secret:  6 },
      { id: "pt-arceus",              name: "Arceus",                        base:  99, secret: 12 }
    ]
  },
  {
    id: "ex",
    name: "EX Series",
    sets: [
      { id: "ex-ruby-sapphire",       name: "EX Ruby & Sapphire",            base: 109, secret:  0 },
      { id: "ex-sandstorm",           name: "EX Sandstorm",                  base: 100, secret:  0 },
      { id: "ex-dragon",              name: "EX Dragon",                     base:  97, secret:  3 },
      { id: "ex-team-magma-aqua",     name: "EX Team Magma vs Team Aqua",    base:  95, secret:  2 },
      { id: "ex-hidden-legends",      name: "EX Hidden Legends",             base: 101, secret:  1 },
      { id: "ex-firered-leafgreen",   name: "EX FireRed & LeafGreen",        base: 112, secret:  4 },
      { id: "ex-team-rocket-returns", name: "EX Team Rocket Returns",        base: 109, secret:  2 },
      { id: "ex-deoxys",              name: "EX Deoxys",                     base: 107, secret:  1 },
      { id: "ex-emerald",             name: "EX Emerald",                    base: 106, secret:  1 },
      { id: "ex-unseen-forces",       name: "EX Unseen Forces",              base: 115, secret: 30 },
      { id: "ex-delta-species",       name: "EX Delta Species",              base: 113, secret:  1 },
      { id: "ex-legend-maker",        name: "EX Legend Maker",               base:  92, secret:  1 },
      { id: "ex-holon-phantoms",      name: "EX Holon Phantoms",             base: 110, secret:  1 },
      { id: "ex-crystal-guardians",   name: "EX Crystal Guardians",          base: 100, secret:  0 },
      { id: "ex-dragon-frontiers",    name: "EX Dragon Frontiers",           base: 101, secret:  0 },
      { id: "ex-power-keepers",       name: "EX Power Keepers",              base: 108, secret:  0 }
    ]
  },
  {
    id: "e-card",
    name: "e-Card",
    sets: [
      { id: "ecard-expedition", name: "Expedition Base Set",                 base: 165, secret:  0 },
      { id: "ecard-aquapolis",  name: "Aquapolis",                           base: 147, secret: 35 },
      { id: "ecard-skyridge",   name: "Skyridge",                            base: 144, secret: 38 }
    ]
  },
  {
    id: "legendary-collection",
    name: "Legendary Collection",
    sets: [
      { id: "lc-base", name: "Legendary Collection",                         base: 110, secret:  0 }
    ]
  },
  {
    id: "neo",
    name: "Neo",
    sets: [
      { id: "neo-genesis",     name: "Neo Genesis",                          base: 111, secret: 0 },
      { id: "neo-discovery",   name: "Neo Discovery",                        base:  75, secret: 0 },
      { id: "neo-revelation",  name: "Neo Revelation",                       base:  64, secret: 2 },
      { id: "neo-destiny",     name: "Neo Destiny",                          base: 105, secret: 8 }
    ]
  },
  {
    id: "gym",
    name: "Gym",
    sets: [
      { id: "gym-heroes",    name: "Gym Heroes",                             base: 132, secret: 0 },
      { id: "gym-challenge", name: "Gym Challenge",                          base: 132, secret: 0 }
    ]
  },
  {
    id: "base",
    name: "Original / Base Series",
    sets: [
      { id: "base-set",         name: "Base Set",                            base: 102, secret: 0 },
      { id: "base-jungle",      name: "Jungle",                              base:  64, secret: 0 },
      { id: "base-fossil",      name: "Fossil",                              base:  62, secret: 0 },
      { id: "base-set-2",       name: "Base Set 2",                          base: 130, secret: 0 },
      { id: "base-team-rocket", name: "Team Rocket",                         base:  82, secret: 1 }
    ]
  },
  {
    id: "other",
    name: "Other",
    sets: [
      // Basic Energy Cards
      { id: "other-sve-basic-energies", name: "SVE Basic Energies",          base:  24, secret: 0 },
      { id: "other-mee-basic-energies", name: "MEE Basic Energies",          base:   8, secret: 0 },
      // McDonald's Collection
      { id: "other-mcd-2011", name: "McDonald's Collection 2011",            base:  12, secret: 0 },
      { id: "other-mcd-2012", name: "McDonald's Collection 2012",            base:  12, secret: 0 },
      { id: "other-mcd-2013", name: "McDonald's Collection 2013",            base:  12, secret: 0 },
      { id: "other-mcd-2014", name: "McDonald's Collection 2014",            base:  12, secret: 0 },
      { id: "other-mcd-2015", name: "McDonald's Collection 2015",            base:  12, secret: 0 },
      { id: "other-mcd-2016", name: "McDonald's Collection 2016",            base:  12, secret: 0 },
      { id: "other-mcd-2017", name: "McDonald's Collection 2017",            base:  12, secret: 0 },
      { id: "other-mcd-2018", name: "McDonald's Collection 2018",            base:  12, secret: 0 },
      { id: "other-mcd-2019", name: "McDonald's Collection 2019",            base:  12, secret: 0 },
      { id: "other-mcd-2021", name: "McDonald's Collection 2021",            base:  25, secret: 0 },
      { id: "other-mcd-2022", name: "McDonald's Collection 2022",            base:  15, secret: 0 },
      { id: "other-mcd-2023", name: "McDonald's Collection 2023",            base:  15, secret: 0 },
      { id: "other-mcd-2024", name: "McDonald's Collection 2024",            base:  15, secret: 0 },
      // Trick or Trade
      { id: "other-tot-2022", name: "Trick or Trade 2022",                   base:  30, secret: 0 },
      { id: "other-tot-2023", name: "Trick or Trade 2023",                   base:  30, secret: 0 },
      { id: "other-tot-2024", name: "Trick or Trade 2024",                   base:  30, secret: 0 }
    ]
  }
];

// Export for both <script> and module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = POKEMON_TCG_ERAS;
}
