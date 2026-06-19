/**
 * Pokémon TCG Set Data
 *
 * Comprehensive list of all main-series Pokémon TCG English expansions,
 * organized by era. Card counts are based on Bulbapedia's expansion list.
 *
 * Each set entry contains:
 *   - id:     unique identifier (used as the localStorage key)
 *   - name:   display name of the set
 *   - base:   number of cards in the base/printed set (the "main" set number,
 *             e.g. 198/198)
 *   - secret: number of secret/extra cards printed beyond the base count
 *             (e.g. full arts, rainbow rares, gold cards, alt arts, etc.)
 *
 * Eras are listed newest-first so the most relevant sets appear at the top.
 */
const POKEMON_TCG_ERAS = [
  {
    id: "mega-evolution",
    name: "Mega Evolution",
    sets: [
      { id: "me-mega-evolution",    name: "Mega Evolution",                   base: 132, secret:  56 },
      { id: "me-phantasmal-flames", name: "Phantasmal Flames",                base:  94, secret:  36 },
      { id: "me-ascended-heroes",   name: "Ascended Heroes",                  base: 217, secret:  78 },
      { id: "me-perfect-order",     name: "Perfect Order",                    base:  88, secret:  36 },
      { id: "me-chaos-rising",      name: "Chaos Rising",                     base:  86, secret:  36 }
    ]
  },
  {
    id: "scarlet-violet",
    name: "Scarlet & Violet",
    sets: [
      { id: "sv-base",           name: "Scarlet & Violet",                  base: 198, secret:  60 },
      { id: "sv-paldea-evolved", name: "Paldea Evolved",                    base: 193, secret:  86 },
      { id: "sv-obsidian-flames",name: "Obsidian Flames",                   base: 197, secret:  33 },
      { id: "sv-151",            name: "Scarlet & Violet 151",              base: 165, secret:  42 },
      { id: "sv-paradox-rift",   name: "Paradox Rift",                      base: 182, secret:  84 },
      { id: "sv-paldean-fates",  name: "Paldean Fates",                     base: 91,  secret: 154 },
      { id: "sv-temporal-forces",name: "Temporal Forces",                   base: 162, secret:  56 },
      { id: "sv-twilight-masquerade", name: "Twilight Masquerade",          base: 167, secret:  59 },
      { id: "sv-shrouded-fable", name: "Shrouded Fable",                    base: 64,  secret:  35 },
      { id: "sv-stellar-crown",  name: "Stellar Crown",                     base: 142, secret:  33 },
      { id: "sv-surging-sparks", name: "Surging Sparks",                    base: 191, secret:  61 },
      { id: "sv-prismatic-evolutions", name: "Prismatic Evolutions",        base: 131, secret:  49 },
      { id: "sv-journey-together", name: "Journey Together",                base: 159, secret:  31 },
      { id: "sv-destined-rivals",name: "Destined Rivals",                   base: 182, secret:  62 },
      { id: "sv-black-bolt",     name: "Black Bolt",                        base:  86, secret:  86 },
      { id: "sv-white-flare",    name: "White Flare",                       base:  86, secret:  87 }
    ]
  },
  {
    id: "sword-shield",
    name: "Sword & Shield",
    sets: [
      { id: "swsh-base",           name: "Sword & Shield",                  base: 202, secret:  14 },
      { id: "swsh-rebel-clash",    name: "Rebel Clash",                     base: 192, secret:  17 },
      { id: "swsh-darkness-ablaze",name: "Darkness Ablaze",                 base: 189, secret:  12 },
      { id: "swsh-champions-path", name: "Champion's Path",                 base: 073, secret:  07 },
      { id: "swsh-vivid-voltage",  name: "Vivid Voltage",                   base: 185, secret:  18 },
      { id: "swsh-shining-fates",  name: "Shining Fates",                   base: 072, secret:  123 },
      { id: "swsh-battle-styles",  name: "Battle Styles",                   base: 163, secret:  20 },
      { id: "swsh-chilling-reign", name: "Chilling Reign",                  base: 198, secret:  35 },
      { id: "swsh-evolving-skies", name: "Evolving Skies",                  base: 203, secret:  34 },
      { id: "swsh-celebrations",   name: "Celebrations",                    base: 025, secret:  25 },
      { id: "swsh-fusion-strike",  name: "Fusion Strike",                   base: 264, secret:  20 },
      { id: "swsh-brilliant-stars",name: "Brilliant Stars",                 base: 172, secret:  14 },
      { id: "swsh-astral-radiance",name: "Astral Radiance",                 base: 189, secret:  27 },
      { id: "swsh-pokemon-go",     name: "Pokémon GO",                      base: 078, secret:  10 },
      { id: "swsh-lost-origin",    name: "Lost Origin",                     base: 196, secret:  21 },
      { id: "swsh-silver-tempest", name: "Silver Tempest",                  base: 195, secret:  20 },
      { id: "swsh-crown-zenith",   name: "Crown Zenith",                    base: 159, secret:  71 }
    ]
  },
  {
    id: "sun-moon",
    name: "Sun & Moon",
    sets: [
      { id: "sm-base",                name: "Sun & Moon",                   base: 149, secret:  14 },
      { id: "sm-guardians-rising",   name: "Guardians Rising",              base: 145, secret:  24 },
      { id: "sm-burning-shadows",    name: "Burning Shadows",               base: 147, secret:  22 },
      { id: "sm-shining-legends",    name: "Shining Legends",               base: 073, secret:  05 },
      { id: "sm-crimson-invasion",   name: "Crimson Invasion",              base: 111, secret:  13 },
      { id: "sm-ultra-prism",        name: "Ultra Prism",                   base: 156, secret:  17 },
      { id: "sm-forbidden-light",    name: "Forbidden Light",               base: 131, secret:  15 },
      { id: "sm-celestial-storm",    name: "Celestial Storm",               base: 168, secret:  15 },
      { id: "sm-dragon-majesty",     name: "Dragon Majesty",                base: 070, secret:  08 },
      { id: "sm-lost-thunder",       name: "Lost Thunder",                  base: 214, secret:  22 },
      { id: "sm-team-up",            name: "Team Up",                       base: 181, secret:  15 },
      { id: "sm-detective-pikachu",  name: "Detective Pikachu",             base: 018, secret:  08 },
      { id: "sm-unbroken-bonds",     name: "Unbroken Bonds",                base: 214, secret:  20 },
      { id: "sm-unified-minds",      name: "Unified Minds",                 base: 236, secret:  22 },
      { id: "sm-hidden-fates",       name: "Hidden Fates",                  base: 068, secret:  095 },
      { id: "sm-cosmic-eclipse",     name: "Cosmic Eclipse",                base: 236, secret:  35 }
    ]
  },
  {
    id: "xy",
    name: "XY",
    sets: [
      { id: "xy-kalos-starter",      name: "Kalos Starter Set",             base: 039, secret:  00 },
      { id: "xy-base",               name: "XY",                            base: 146, secret:  00 },
      { id: "xy-flashfire",          name: "Flashfire",                     base: 106, secret:  07 },
      { id: "xy-furious-fists",      name: "Furious Fists",                 base: 111, secret:  04 },
      { id: "xy-phantom-forces",     name: "Phantom Forces",                base: 119, secret:  05 },
      { id: "xy-primal-clash",       name: "Primal Clash",                  base: 160, secret:  04 },
      { id: "xy-double-crisis",      name: "Double Crisis",                 base: 034, secret:  00 },
      { id: "xy-roaring-skies",      name: "Roaring Skies",                 base: 108, secret:  02 },
      { id: "xy-ancient-origins",    name: "Ancient Origins",               base: 098, secret:  02 },
      { id: "xy-breakthrough",       name: "BREAKthrough",                  base: 162, secret:  03 },
      { id: "xy-breakpoint",         name: "BREAKpoint",                    base: 122, secret:  01 },
      { id: "xy-generations",        name: "Generations",                   base: 083, secret:  032 },
      { id: "xy-fates-collide",      name: "Fates Collide",                 base: 124, secret:  01 },
      { id: "xy-steam-siege",        name: "Steam Siege",                   base: 114, secret:  02 },
      { id: "xy-evolutions",         name: "Evolutions",                    base: 108, secret:  05 }
    ]
  },
  {
    id: "black-white",
    name: "Black & White",
    sets: [
      { id: "bw-base",               name: "Black & White",                 base: 114, secret:  01 },
      { id: "bw-emerging-powers",    name: "Emerging Powers",               base: 098, secret:  00 },
      { id: "bw-noble-victories",    name: "Noble Victories",               base: 101, secret:  01 },
      { id: "bw-next-destinies",     name: "Next Destinies",                base: 099, secret:  04 },
      { id: "bw-dark-explorers",     name: "Dark Explorers",                base: 108, secret:  03 },
      { id: "bw-dragons-exalted",    name: "Dragons Exalted",               base: 124, secret:  04 },
      { id: "bw-dragon-vault",       name: "Dragon Vault",                  base: 020, secret:  01 },
      { id: "bw-boundaries-crossed", name: "Boundaries Crossed",            base: 149, secret:  04 },
      { id: "bw-plasma-storm",       name: "Plasma Storm",                  base: 135, secret:  03 },
      { id: "bw-plasma-freeze",      name: "Plasma Freeze",                 base: 116, secret:  06 },
      { id: "bw-plasma-blast",       name: "Plasma Blast",                  base: 101, secret:  04 },
      { id: "bw-legendary-treasures",name: "Legendary Treasures",           base: 113, secret:  100 }
    ]
  },
  {
    id: "hgss",
    name: "HeartGold & SoulSilver",
    sets: [
      { id: "hgss-base",             name: "HeartGold & SoulSilver",        base: 123, secret:  01 },
      { id: "hgss-unleashed",        name: "HS—Unleashed",                  base: 095, secret:  01 },
      { id: "hgss-undaunted",        name: "HS—Undaunted",                  base: 090, secret:  01 },
      { id: "hgss-triumphant",       name: "HS—Triumphant",                 base: 102, secret:  01 },
      { id: "hgss-call-of-legends",  name: "Call of Legends",               base: 095, secret:  11 }
    ]
  },
  {
    id: "diamond-pearl",
    name: "Diamond & Pearl / Platinum",
    sets: [
      { id: "dp-base",               name: "Diamond & Pearl",               base: 130, secret:  00 },
      { id: "dp-mysterious-treasures",name:"Mysterious Treasures",          base: 124, secret:  00 },
      { id: "dp-secret-wonders",     name: "Secret Wonders",                base: 132, secret:  00 },
      { id: "dp-great-encounters",   name: "Great Encounters",              base: 106, secret:  00 },
      { id: "dp-majestic-dawn",      name: "Majestic Dawn",                 base: 100, secret:  00 },
      { id: "dp-legends-awakened",   name: "Legends Awakened",              base: 146, secret:  00 },
      { id: "dp-stormfront",         name: "Stormfront",                    base: 100, secret:  03 },
      { id: "pt-base",               name: "Platinum",                      base: 127, secret:  03 },
      { id: "pt-rising-rivals",      name: "Rising Rivals",                 base: 111, secret:  09 },
      { id: "pt-supreme-victors",    name: "Supreme Victors",               base: 147, secret:  06 },
      { id: "pt-arceus",             name: "Arceus",                        base: 099, secret:  12 }
    ]
  },
  {
    id: "ex",
    name: "EX Series",
    sets: [
      { id: "ex-ruby-sapphire",      name: "EX Ruby & Sapphire",            base: 109, secret:  00 },
      { id: "ex-sandstorm",          name: "EX Sandstorm",                  base: 100, secret:  00 },
      { id: "ex-dragon",             name: "EX Dragon",                     base: 097, secret:  03 },
      { id: "ex-team-magma-aqua",    name: "EX Team Magma vs Team Aqua",    base: 095, secret:  02 },
      { id: "ex-hidden-legends",     name: "EX Hidden Legends",             base: 101, secret:  01 },
      { id: "ex-firered-leafgreen",  name: "EX FireRed & LeafGreen",        base: 112, secret:  04 },
      { id: "ex-team-rocket-returns",name: "EX Team Rocket Returns",        base: 109, secret:  02 },
      { id: "ex-deoxys",             name: "EX Deoxys",                     base: 107, secret:  01 },
      { id: "ex-emerald",            name: "EX Emerald",                    base: 106, secret:  00 },
      { id: "ex-unseen-forces",      name: "EX Unseen Forces",              base: 115, secret:  030 },
      { id: "ex-delta-species",      name: "EX Delta Species",              base: 113, secret:  00 },
      { id: "ex-legend-maker",       name: "EX Legend Maker",               base: 092, secret:  00 },
      { id: "ex-holon-phantoms",     name: "EX Holon Phantoms",             base: 110, secret:  00 },
      { id: "ex-crystal-guardians",  name: "EX Crystal Guardians",          base: 100, secret:  00 },
      { id: "ex-dragon-frontiers",   name: "EX Dragon Frontiers",           base: 101, secret:  00 },
      { id: "ex-power-keepers",      name: "EX Power Keepers",              base: 108, secret:  00 }
    ]
  },
  {
    id: "e-card",
    name: "e-Card",
    sets: [
      { id: "ecard-expedition",      name: "Expedition Base Set",           base: 165, secret:  00 },
      { id: "ecard-aquapolis",       name: "Aquapolis",                     base: 147, secret:  035 },
      { id: "ecard-skyridge",        name: "Skyridge",                      base: 144, secret:  038 }
    ]
  },
  {
    id: "neo",
    name: "Neo",
    sets: [
      { id: "neo-genesis",           name: "Neo Genesis",                   base: 111, secret:  00 },
      { id: "neo-discovery",         name: "Neo Discovery",                 base: 075, secret:  00 },
      { id: "neo-revelation",        name: "Neo Revelation",                base: 064, secret:  02 },
      { id: "neo-destiny",           name: "Neo Destiny",                   base: 105, secret:  00 }
    ]
  },
  {
    id: "gym",
    name: "Gym",
    sets: [
      { id: "gym-heroes",            name: "Gym Heroes",                    base: 132, secret:  00 },
      { id: "gym-challenge",         name: "Gym Challenge",                 base: 132, secret:  00 }
    ]
  },
  {
    id: "base",
    name: "Original / Base Series",
    sets: [
      { id: "base-set",              name: "Base Set",                      base: 102, secret:  00 },
      { id: "base-jungle",           name: "Jungle",                        base: 064, secret:  00 },
      { id: "base-fossil",           name: "Fossil",                        base: 062, secret:  00 },
      { id: "base-set-2",            name: "Base Set 2",                    base: 130, secret:  00 },
      { id: "base-team-rocket",      name: "Team Rocket",                   base: 082, secret:  001 },
      { id: "base-legendary",        name: "Legendary Collection",          base: 110, secret:  00 }
    ]
  }
];

// Export for both <script> and module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = POKEMON_TCG_ERAS;
}
