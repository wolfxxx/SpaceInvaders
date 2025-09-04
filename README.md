# Modern Space Invaders (Phaser 3)

Just for fun and education. A fast, modern take on the arcade classic built with Phaser 3. Battle waves of invaders, face periodic boss fights, stack a combo multiplier, charge up a piercing shot, and chase a persistent high score — all with crunchy SFX and adaptive music.

## Features
- Arcade action: smooth movement, snappy shots, destructible shields, starfield backdrop.
- Waves and boss fights: a boss appears every 3rd level with patterns, dashes, and phases.
- Combo multiplier: chain kills to raise a time‑based multiplier (up to x5) with on‑screen popups.
- Overcharge (piercing) shot: damage the boss to fill a charge bar; unleash a magenta pierce round when full.
- Extra life reward: defeating a boss grants +1 life with a celebratory effect.
- Powerups: Double, Spread, Rapid, Shield (wave levels).
- HUD and persistence: score, lives, level, “Best” high score saved to localStorage.
- Audio: WebAudio SFX, level/boss music, volume slider, and SFX mute toggle.

## Controls
- Move: Left/Right Arrow keys
- Fire: Space
- Pause: P
- Mute SFX: M
- Start: Space or click/tap
- Music Volume: slider at bottom of the page

## Run Locally
Because the game loads audio files, use a local web server (file:// may block audio in some browsers):

- Python (3.x): `python -m http.server -d src 5173`
- Node: `npx http-server src -p 5173`
- VS Code: Live Server on the `src/` folder

Then open http://localhost:5173

Alternatively, you can open `src/index.html` directly, but some browsers may restrict audio autoplay or file loading.

## Deploy to GitHub Pages
Two simple options:

1) Serve from repo root (recommended for Pages)
- A root `index.html` is included that points to `src/` via `<base href="src/">`.
- Push to GitHub, then enable Pages: Settings → Pages → “Deploy from a branch” → `main` → `/ (root)` → Save.

2) Serve from `src/` directory
- Enable Pages from the `src` folder (if available in your repo settings), or publish via GitHub Actions to the `gh-pages` branch with `src/` as the site root.

## Project Structure
- `src/index.html` — HTML shell, Phaser CDN, canvas styling, volume slider
- `src/game.js` — core game (scenes, entities, waves, boss, scoring, powerups)
- `src/music.js` — music loader and simple volume control
- `src/assets/music/*.mp3` — level and boss music tracks

## Screenshots / GIF
- Add gameplay GIFs/screenshots to a `docs/` folder and link them here.
- Example (once added):
  - `![Gameplay](docs/gameplay.gif)`

## Global Leaderboard (optional)
This project includes a simple Firebase Firestore leaderboard suitable for GitHub Pages.

Enable it
- In `index.html` (root) or `src/index.html`, paste your Firebase web config in the `window.FIREBASE_CONFIG` block and uncomment the two leaderboard script tags:
  - `window.FIREBASE_CONFIG = { apiKey, authDomain, projectId }`
  - `<script type="module" src="leaderboard.js"></script>`
- Create a Firestore DB in your Firebase project.
- Optional but recommended: enable Anonymous Auth in Authentication.
 - Optional but recommended: enable App Check for Web (reCAPTCHA v3) and set `window.FIREBASE_APPCHECK_SITE_KEY`.

Firestore rules (starter, permissive read / restricted write)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /scores/{doc} {
      allow read: if true;
      allow create: if request.auth != null
                    && request.resource.data.name is string
                    && request.resource.data.score is number
                    && request.resource.data.score >= 0 && request.resource.data.score <= 1000000
                    && request.resource.data.name.size() > 0 && request.resource.data.name.size() <= 24;
    }
  }
}
```

How it works
- On Game Over, you’re prompted for a name; score is submitted if the leaderboard is enabled.
- Start screen shows the Top 10 (name, score, date).

App Check (recommended)
- Firebase Console → Build → App Check → Add app → Web → choose reCAPTCHA v3 → copy the site key.
- In `index.html`, set `window.FIREBASE_APPCHECK_SITE_KEY = '...';`.
- In Firestore, enforce App Check for read/write once verified.


## Audio Credits
Tracks sourced from Pixabay (free for use, no attribution required — included here for courtesy):
- Level 1 music by UFO‑Man — https://pixabay.com/music/techno-trance-space-invaders-13809/
- Level 2 music by MaxKoMusic — https://pixabay.com/music/epic-cinematic-the-last-stand-13886/
- Boss music by WinnieTheMoog — https://pixabay.com/music/video-games-epic-boss-battle-15242/

## Tech Stack
- Phaser 3 (via CDN)
- JavaScript (no build step)
- WebAudio API for procedural SFX

## Roadmap / Ideas
- Touch controls and gamepad support
- Options pause menu (music/SFX sliders, restart)
- Enemy variety (divers, tanks) and level scripting
- GitHub Pages root build (optional) and screenshots/GIFs for the README

## License
No license provided — treat as “all rights reserved” unless a LICENSE file is added. Music assets are credited above per their Pixabay listings.
