# Square Dash — Roguelike

`Square Dash` is a browser roguelike built with TypeScript and [Phaser 3](https://phaser.io/),
bundled by Vite. It grew out of a tiny single-file collector game and is now a run-based
roguelike with procedural arenas, draftable upgrades, and persistent meta-progression.

## The Game

You control a glowing square and descend through floors:

- Collect gold orbs to gain score and time, and to fill each floor's collection quota.
- Avoid red orbs and enemies — they drain your time bank and score.
- Clear a floor's quota before the time bank empties to descend. Run out of time and the run ends.
- After every floor you draft one of three upgrades, building a unique run.
- Every fifth floor is a boss; some floors are tougher "elite" floors.
- When a run ends you earn shards. Spend them in the Meta Hub on permanent upgrades and to
  unlock new draftable upgrades for future runs.

### Orb and enemy types

- Gold orb: score and time, counts toward the quota.
- Red orb: score and time penalty (shields can block it).
- Neutral orb: a gamble — a bonus or a penalty.
- Shield, multiplier, and ghost orbs appear on deeper floors.
- Chaser, patroller, and bomber enemies are introduced from floor 4 onward.

## Controls

- `W`, `A`, `S`, `D` or arrow keys to move
- Tap / click-and-hold to move toward the pointer (touch friendly)
- `Esc` or `P` to pause
- `1` / `2` / `3` or click to pick an upgrade

## Tech Stack

- TypeScript (strict) + Phaser 3
- Vite for dev server, bundling, and HMR
- Vitest for unit tests
- ESLint + Prettier for code quality
- Procedural textures and Web Audio SFX — the project ships no binary art or audio assets

## Project Structure

- [index.html](/Users/shahab/Desktop/Projects/typescript/firstgame/index.html) — page shell that mounts the Phaser canvas.
- [src/main.ts](/Users/shahab/Desktop/Projects/typescript/firstgame/src/main.ts) — Phaser bootstrap and scene registration.
- `src/scenes/` — Boot, MainMenu, Run, LevelUp, Death, and MetaHub scenes.
- `src/entities/` — Player, Orb, and Enemy game objects.
- `src/systems/` — difficulty curves, spawning, and the upgrade system.
- `src/generation/` — seeded RNG and the procedural `ArenaGenerator`.
- `src/meta/` — `SaveManager` (versioned localStorage) and the unlock registry.
- `src/config/` — tunable gameplay numbers, upgrade definitions, and themes.
- `src/ui/` — HUD, floating text, and reusable widgets.

## Setup

Install dependencies once:

```bash
npm install
```

## Develop

Start the Vite dev server with hot reload:

```bash
npm run dev
```

Then open the URL it prints (default `http://localhost:5173`).

## Other Scripts

```bash
npm run build       # type-check then produce a production build in dist/
npm run preview     # serve the production build locally
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run format      # prettier --write
npm test            # run the Vitest unit suite
```

## Notes

- Progress (best score, shards, unlocks, and settings) is stored in the browser via
  `localStorage` and degrades gracefully if storage is unavailable.
- The Daily Challenge uses a date-derived seed, so every player gets the same arenas that day.
