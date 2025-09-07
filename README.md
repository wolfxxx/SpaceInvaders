# Modern Space Invaders (Phaser 3)

A fast, modern take on the arcade classic built with Phaser 3. Battle waves of invaders, face periodic boss fights, stack a combo multiplier, charge up a piercing shot, and chase a persistent high score — all with crunchy SFX and music.

## Features
- Arcade action: smooth movement, snappy shots, destructible shields, starfield backdrop.
- Waves and boss fights: boss every 3rd level; 3 boss variants with evolving patterns, dashes, and phases.
- Combo multiplier: chain kills to raise a timed multiplier (up to x5) with on‑screen popups.
- Overcharge (piercing) shot: damage the boss to fill a charge bar; unleash a magenta pierce round when full.
- Extra life reward: defeating a boss grants +1 life with a celebratory effect.
- Powerups: Double, Spread, Rapid, Shield (wave levels).
- HUD and persistence: score, lives, level, and “Best” high score saved to localStorage.
- Audio: Procedural WebAudio SFX, level/boss music, volume slider, and SFX mute toggle.
- Quality & accessibility: adaptive quality scaler (Auto/High/Medium/Low) and CRT overlay toggle.

## Controls
- Move: Left/Right Arrow keys
- Fire: Space
- Pause: P
- Mute SFX: M
- Start: Space or click/tap
- Music Volume: slider at bottom of the page

## Run Locally
Because the game loads audio files, use a local web server (file:// may block audio in some browsers):

- Python (3.x): `python -m http.server 5173 --directory src`
- Node: `npx http-server src -p 5173`
- VS Code: Live Server on the `src/` folder

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
- `src/game.js` — core game (scenes, entities, waves, bosses, scoring, powerups)
- `src/leaderboard.js` — lightweight Firebase client for global scores (optional)
- `src/music.js` — music loader and simple volume control
- `src/assets/music/*.mp3` — level and boss music tracks

## Quality & CRT Settings
- Quality modes: Auto, High, Medium, Low.
  - Auto monitors FPS and adjusts visuals to keep 60 FPS; it scales particles/trails and trims some glow layers at lower levels.
  - The game respects “prefers‑reduced‑motion” by starting at a lower quality in Auto on such systems.
- CRT overlay: toggle scanlines and vignette on/off.
- Where: on the Start screen (top‑right) you can click the labels to change these settings.
- Persistence: stored in localStorage keys `si_quality` and `si_crt`.

## Global Leaderboard (optional)
This project includes a simple Firebase Firestore leaderboard suitable for GitHub Pages.

Enable it
- In `index.html` (root) and `src/index.html`, replace the demo Firebase web config in the `window.FIREBASE_CONFIG` block with your own.
- The leaderboard script tag is already included; remove it if you want to disable the leaderboard.
- Create a Firestore DB in your Firebase project.
- Recommended: enable Anonymous Auth in Authentication.
- Recommended: enable App Check for Web (reCAPTCHA v3) and set `window.FIREBASE_APPCHECK_SITE_KEY`.

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

### App Check (recommended)
- Firebase Console → Build → App Check → Add app → Web → choose reCAPTCHA v3 → copy the site key.
- In `index.html` (root) and `src/index.html` (local), set `window.FIREBASE_APPCHECK_SITE_KEY = '...';` before `leaderboard.js`.
- In Firestore, enforce App Check once verified requests appear in App Check → Requests.

## Use Your Own Firebase (forks/collaborators)
If you fork/clone and want your own independent high scores, set up your own Firebase project. This repo ships a safe local debug pattern (`src/local-dev.js` is ignored by Git).

1) Create Firebase project
- Firestore Database → Create database (Production mode)
- Authentication → Sign‑in method → Enable Anonymous

2) App Check (reCAPTCHA v3)
- reCAPTCHA Admin → Create a v3 key with Domains:
  - Your GitHub Pages host (e.g., `yourname.github.io`)
  - `localhost` and `127.0.0.1` for local dev (optional; otherwise use a debug token)
- Firebase Console → App Check → Your Web app → reCAPTCHA v3 → Use existing key → paste Site + Secret

3) Wire config
- Put your web config in both files, before `leaderboard.js`:
  - `index.html` (root, for Pages)
  - `src/index.html` (for local dev)
- Set `window.FIREBASE_APPCHECK_SITE_KEY = '...'`

4) Firestore rules (publish):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /scores/{doc} {
      allow read: if true;
      allow create: if request.auth != null
                    && request.resource.data.keys().hasOnly(['name','score','createdAt'])
                    && request.resource.data.name is string
                    && request.resource.data.name.size() > 0 && request.resource.data.name.size() <= 24
                    && request.resource.data.score is int
                    && request.resource.data.score >= 0 && request.resource.data.score <= 1000000;
      allow update, delete: if false;
    }
  }
}
```

5) Verify App Check then enforce
- App Check → Requests should show “Verified”
- Firestore → Settings → App Check enforcement → Enable

6) Optional index
- If prompted, create a composite index (or keep the simplified score‑only query already used).

### Local development (debug token)
- File `src/local-dev.js` is ignored by Git. Add your token:
```
self.FIREBASE_APPCHECK_DEBUG_TOKEN = 'YOUR_DEBUG_TOKEN';
```
- App Check → Debug tokens → Add token (paste same string)
- Serve from `http://localhost:PORT` and hard‑refresh; App Check Requests show “Verified (Debug)”

### Production hardening
- Do not commit debug tokens
- Optionally remove `localhost`/`127.0.0.1` from your reCAPTCHA v3 Domains
- Keep Firestore enforcement ON and rules restrictive as above

## Performance Notes
- Phaser config targets 60 FPS with a 30 FPS minimum; device pixel ratio is capped to reduce overdraw on high‑DPI displays.
- WebGL is preferred; Canvas fallback works automatically via `Phaser.AUTO`.
- On Low quality, cosmetic effects are reduced for smoother performance on low‑end GPUs/CPUs.

## Troubleshooting
- Audio doesn’t play: interact with the page first (click/keypress). Serve over HTTP (not file://). iOS Safari requires a user gesture to start audio.
- Black or empty canvas: browser may have WebGL disabled. The game falls back to Canvas; update graphics drivers, enable hardware acceleration, or set Quality to Low and disable CRT overlay on the Start screen.
- Low FPS or stutter: set Quality to Low and turn off CRT overlay. Close other heavy tabs/apps. Ensure your browser’s hardware acceleration is enabled.
- Leaderboard not loading: replace the demo `window.FIREBASE_CONFIG` with your own, enable Anonymous Auth, set App Check site key, and check DevTools console for errors. If fails, the game still runs without the leaderboard.
- Opening files directly: use a local server (see Run Locally). Some browsers restrict audio or module imports from file://.
- Mobile tips: audio starts after first tap; keyboard controls aren’t available. Consider using on-screen controls if you add them.

## Screenshots / GIFs
- Add media to `docs/` and reference from the README. Example:

  ```md
  ![Gameplay](docs/gameplay.gif)
  ```

- Quick capture tip (desktop): record a short MP4 (OBS), then convert to a web-friendly GIF or MP4 snippet.
  - Example ffmpeg to GIF:
    ```
    ffmpeg -i clip.mp4 -vf "fps=30,scale=800:-1:flags=lanczos" -t 8 docs/gameplay.gif
    ```

## Audio Credits
Tracks sourced from Pixabay (free for use, attribution not required — included here for courtesy):
- Level 1 music by UFO‑Man — https://pixabay.com/music/techno-trance-space-invaders-13809/
- Level 2 music by MaxKoMusic — https://pixabay.com/music/epic-cinematic-the-last-stand-13886/
- Boss music by WinnieTheMoog — https://pixabay.com/music/video-games-epic-boss-battle-15242/

## Tech Stack
- Phaser 3 (via CDN)
- JavaScript (no build step)
- WebAudio API for procedural SFX

## License
No license provided — treat as “all rights reserved” unless a LICENSE file is added. Music assets are credited above per their Pixabay listings.
