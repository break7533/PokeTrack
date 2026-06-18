# PokéTrack ⚡

A lightweight, browser-based **Pokémon Trading Card Game collection tracker**.
Track how close you are to completing every English TCG set, with separate
progress for **base cards** and **secret rares** — all stored locally in your
browser. No accounts, no servers, no sync — just open the page and start
typing.

> Live site (after enabling Pages): `https://break7533.github.io/PokeTrack/`

---

## ✨ Features

- **Every English main-series set** — from Base Set (1999) all the way through
  the latest Scarlet & Violet expansions, organized by era.
- **Base + secret tracking** — each set tracks the printed set count and the
  "secret"/chase cards (full arts, rainbow rares, gold cards, etc.) as
  independent metrics.
- **Inline number inputs** — type a number, it saves instantly to
  `localStorage`. No "save" button required.
- **Per-set, per-era, and overall progress bars** with color-coded fills
  (red → yellow → green → glowing green at 100%).
- **Collapsible eras** so you can focus on the sets you're actually
  collecting.
- **Secret cards hidden by default** — a small per-set toggle reveals them.
- **Input validation** — values can't go below `0` or above the set's printed
  total.
- **Responsive design** — works on phones, tablets, and desktops.
- **Persistent UI prefs** — collapsed eras and open secret sections are
  remembered between visits.
- **Reset button** with confirmation, in case you want a clean slate.

---

## 🗂 Project structure

```
PokeTrack/
├── index.html              # Markup, overall stats panel, era/set templates
├── css/
│   └── style.css           # Pokémon-themed styling, progress bars, responsive layout
├── js/
│   ├── sets.js             # All TCG expansions grouped by era (data only)
│   └── app.js              # Rendering, localStorage persistence, progress math
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Pages deployment workflow
└── README.md
```

The project is **100% static** — no build step, no dependencies, no framework.
Open `index.html` directly in a browser and it works.

---

## 🚀 Running locally

Because everything is static, you have a few options:

### Option 1 — Open the file directly

Just double-click `index.html`. It will work in any modern browser; data is
saved to that browser's `localStorage` for the `file://` origin.

### Option 2 — Serve with a simple local web server (recommended)

This keeps `localStorage` tied to a stable `http://localhost:...` origin, which
is closer to the production GitHub Pages environment.

```bash
# Python 3
python3 -m http.server 8000

# Node (if you have it installed)
npx http-server -p 8000
```

Then visit <http://localhost:8000>.

---

## ☁️ Deploying to GitHub Pages

A workflow is included at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
that publishes the repo root to GitHub Pages on every push to `main`.

**One-time setup** (after merging this branch):

1. In the repo, go to **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Push to `main` (or run the workflow manually from the **Actions** tab).
4. Your site will be live at `https://<your-username>.github.io/<repo>/`.

> The workflow uploads the entire repository root as the Pages artifact —
> there is no build step.

### Alternative: deploy without the workflow

If you'd rather not use Actions, you can use the classic Pages flow:
**Settings → Pages → Source → Deploy from a branch**, choose `main` and `/ (root)`.

---

## 💾 How data is stored

All collection counts and UI preferences are saved to the browser's
`localStorage` under these keys:

| Key                              | Contents                                                |
| -------------------------------- | ------------------------------------------------------- |
| `poketrack:v1`                   | `{ "<set-id>": { "base": N, "secret": N }, ... }`       |
| `poketrack:collapsed-eras:v1`    | Array of era ids the user has collapsed                 |
| `poketrack:open-secrets:v1`      | Array of set ids whose secret row is currently revealed |

A few important notes:

- Data is **per browser and per device** — clearing site data or using a
  different browser will give you an empty tracker.
- There is **no cloud sync**. If you want to back up your data, copy the
  value of `poketrack:v1` from DevTools → Application → Local Storage.
- The **Reset all data** button in the header clears `poketrack:v1` and
  `poketrack:open-secrets:v1` (it leaves your era collapse preferences alone).

---

## 🧩 Adding or correcting sets

All set data lives in [`js/sets.js`](js/sets.js) and is intentionally just a
JavaScript array — no build step, no JSON parsing.

To add a set, append an object to the appropriate era's `sets` array:

```js
{
  id: "sv-some-new-set",   // unique id; used as the localStorage key
  name: "Some New Set",    // display name
  base: 162,               // number of cards in the printed/base set
  secret: 30               // number of secret/extra cards beyond the base
}
```

Use `secret: 0` for sets with no secret rares — the toggle will be hidden
automatically.

Card counts are based on
[Bulbapedia's expansion list](https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_Trading_Card_Game_expansions).
PRs to correct any counts are welcome.

---

## 🛣 Roadmap ideas

Not implemented, but easy follow-ups:

- Export / import collection data as JSON.
- Search & filter across all sets.
- Per-card checklists (rather than just totals).
- Optional dark mode.
- Side-loading set images / logos.

---

## ⚖️ Disclaimer

PokéTrack is a fan-made tool created for personal use. It is **not affiliated
with, endorsed by, or sponsored by** The Pokémon Company, Nintendo, Game
Freak, Creatures Inc., or The Pokémon Company International. "Pokémon" and
all related names are trademarks of their respective owners.
