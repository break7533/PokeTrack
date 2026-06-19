# PokéTrack ⚡

A lightweight, browser-based **Pokémon Trading Card Game collection tracker**.
Track how close you are to completing every English TCG set, with separate
progress for **base cards** and **secret rares** — all stored locally in your
browser by default, with optional one-click Google sign-in to sync across
devices via Firebase.

> Live site (after enabling Pages): `https://break7533.github.io/PokeTrack/`

---

## ✨ Features

- **Every English main-series set** — from Base Set (1999) all the way through
  the latest Scarlet & Violet and Mega Evolution expansions, organized by era.
- **Extras era** — McDonald's Collection 2011–2024, Trick or Trade 2022–2024,
  and SVE/MEE Basic Energies. (Black Star Promos are intentionally excluded —
  ongoing counts make completion an unsolvable target.)
- **Base + secret tracking** — each set tracks the printed set count and the
  "secret"/chase cards (full arts, rainbow rares, gold cards, Trainer Gallery,
  Galarian Gallery, Shiny Vault, Radiant Collection, etc.) as independent
  metrics.
- **Inline number inputs** — type a number and it saves instantly. No "save"
  button required.
- **Per-set, per-era, and overall progress bars** with color-coded fills
  (red → yellow → green → glowing green at 100%).
- **Collapsible eras** with expand-all / collapse-all controls.
- **Global "Show secret rows" toggle** in the header — flips every set's
  secret row on/off at once instead of having to expand them one by one. Sets
  with no secret rares stay hidden either way.
- **Dark mode by default**, with a 🌙 / ☀️ toggle in the header. First-time
  visitors get dark mode; the choice you click is remembered across reloads
  and applied before first paint so there's no flash.
- **Sticky compact header** — overall stats and controls stay visible while
  you scroll through 15+ eras of sets.
- **Optional Google sign-in** — sign in with a Google account to sync your
  collection to Firestore at `/users/{uid}`. Without sign-in, PokéTrack is
  100% local. With sign-in, your data follows you between devices.
- **Input validation** — values can't go below `0` or above the set's printed
  total.
- **Responsive design** — works on phones, tablets, and desktops.
- **Reset button** with confirmation, including an optional "also wipe cloud
  copy" prompt if you're signed in.

---

## 🗂 Project structure

```
PokeTrack/
├── index.html              # Markup, overall stats panel, era/set templates
├── css/
│   └── style.css           # Pokémon-themed styling, light + dark themes, responsive layout
├── js/
│   ├── sets.js             # All TCG expansions grouped by era (data only)
│   └── app.js              # Rendering, localStorage persistence, progress math, toggles
├── firebase.js             # Optional Google sign-in + Firestore sync (ES module)
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Pages deployment workflow
└── README.md
```

The project is **100% static** — no build step, no bundler, no framework. Open
`index.html` directly in a browser and it works. Firebase is loaded directly
from `gstatic.com` as an ES module when `firebase.js` is configured.

---

## 🚀 Running locally

Because everything is static, you have a few options:

### Option 1 — Open the file directly

Just double-click `index.html`. It will work in any modern browser; data is
saved to that browser's `localStorage` for the `file://` origin.

> Google sign-in does **not** work from `file://` — Firebase Auth requires an
> http(s) origin. Use Option 2 if you want to test sign-in locally.

### Option 2 — Serve with a simple local web server (recommended)

This keeps `localStorage` tied to a stable `http://localhost:...` origin,
which is closer to the production GitHub Pages environment.

```bash
# Python 3
python3 -m http.server 8000

# Node (if you have it installed)
npx http-server -p 8000
```

Then visit <http://localhost:8000>. To use Google sign-in locally, add
`localhost` to your Firebase project's **Authentication → Settings →
Authorized domains** list.

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
**Settings → Pages → Source → Deploy from a branch**, choose `main` and
`/ (root)`.

---

## 🔐 Optional: Google sign-in & cloud sync

PokéTrack works perfectly without ever signing in — everything stays in your
browser. If you'd like your collection to sync across devices, you can wire up
a free Firebase project:

1. Create a Firebase project at <https://console.firebase.google.com/>.
2. **Authentication → Sign-in method → Google** → enable.
3. **Firestore Database → Create database** (production mode is fine).
4. **Project settings → General → Your apps → Add app → Web** and copy the
   config snippet.
5. Paste the values into the config object at the top of
   [`firebase.js`](firebase.js).
6. Add your GitHub Pages domain (and `localhost` for local dev) under
   **Authentication → Settings → Authorized domains**.

Recommended Firestore rules — each user can only read/write their own doc:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

If `firebase.js` isn't configured (or fails to load), the auth button is
hidden and the app stays 100% local.

---

## 💾 How data is stored

Collection counts and UI preferences are saved to the browser's
`localStorage` under these keys:

| Key                              | Contents                                                |
| -------------------------------- | ------------------------------------------------------- |
| `poketrack:v1`                   | `{ "<set-id>": { "base": N, "secret": N }, ... }`       |
| `poketrack:collapsed-eras:v1`    | Array of era ids the user has collapsed                 |
| `poketrack:show-secrets:v1`      | `"1"` if the global "Show secret rows" toggle is on     |
| `poketrack:theme:v1`             | `"dark"` or `"light"` (controls the theme on reload)    |
| `poketrack:open-secrets:v1`      | _Legacy._ No longer read or written; safe to delete.    |

When signed in, the same shape is mirrored to Firestore at
`/users/{uid}.collection`. On sign-in, the cloud and local copies are merged
(taking the higher value per `{ setId, kind }`) so neither side overwrites
progress the other had recorded.

A few important notes:

- Without sign-in, data is **per browser and per device** — clearing site data
  or switching browsers gives you an empty tracker.
- The **Reset all data** button in the header clears `poketrack:v1`. If
  you're signed in, it will additionally ask whether to wipe the cloud copy
  — say yes unless you want the next sign-in to restore everything.
- Theme and era-collapse preferences are intentionally **not** synced to the
  cloud; they're per-device by design.

---

## 🌗 Dark mode

Dark mode is the default — first-time visitors land on the dark theme. Click
the **🌙 / ☀️** button in the header to switch, and your choice is saved to
`poketrack:theme:v1`. The saved choice is applied via an inline script in
`index.html` *before* the stylesheet paints, so there's no flash of the wrong
theme when reloading.

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

Use `secret: 0` for sets with no secret rares — those sets will never show a
secret row, even when the global "Show secret rows" toggle is on.

> ⚠️ **Always write counts as plain decimal numbers.** A leading-zero literal
> like `030` is parsed as **octal** in JavaScript (= decimal 24) and silently
> miscounts. Write `30`, never `030`.

Card counts are based on
[Bulbapedia's expansion list](https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_Trading_Card_Game_expansions).
PRs to correct any counts are welcome.

---

## 🛣 Roadmap ideas

Not implemented, but easy follow-ups:

- Export / import collection data as JSON.
- Search & filter across all sets.
- Per-card checklists (rather than just totals).
- Set logos / cover images.
- Respect `prefers-color-scheme` as the first-visit default (currently
  hard-defaults to dark).
- Black Star Promos tracking (deferred — set count is open-ended).

---

## ⚖️ Disclaimer

PokéTrack is a fan-made tool created for personal use. It is **not affiliated
with, endorsed by, or sponsored by** The Pokémon Company, Nintendo, Game
Freak, Creatures Inc., or The Pokémon Company International. "Pokémon" and
all related names are trademarks of their respective owners.
