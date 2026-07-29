# Dungeonlord Architecture

Last updated: 2026-07-29
Current release: `0.1.0-alpha.2`

## Technology

- React 19
- Vite 7
- JavaScript and JSX
- CSS
- Browser `localStorage`
- Vitest unit tests
- Playwright browser smoke tests
- GitHub Pages deployment

Dungeonlord is a browser-only static application. It has no backend, database, router, TypeScript layer, external state library, telemetry service, or server-side save.

## Runtime Shape

```text
src/main.jsx
  -> ErrorBoundary
    -> App
      -> state creation and hydration from systems/runState.js
      -> domain rules and transitions from systems/
      -> presentational panels from components/
      -> authored data from gameContent.js
      -> seeded RNG from random.js
      -> browser save/diagnostic support from playtestSupport.js
      -> presentation rules from App.css and static art from public/assets
```

The application now uses explicit subsystem and presentation boundaries:

- `src/App.jsx`: approximately 1,175 lines
- `src/App.css`: approximately 2,846 lines
- `src/gameContent.js`: approximately 1,838 lines
- `src/systems/combat.js`: approximately 1,290 lines
- `src/components/ToolboxPanel.jsx`: approximately 1,074 lines

`App.jsx` remains the authoritative React state owner, but it no longer contains domain algorithms or the full JSX tree. Combat and Toolbox are the largest remaining focused modules.

## Important Files

### Application

- [`../src/main.jsx`](../src/main.jsx)
  React entry point and application error-boundary mounting.

- [`../src/App.jsx`](../src/App.jsx)
  Main game coordinator. Owns React state, browser-facing effects, derived view data, and thin subsystem dispatch handlers.

- `../src/systems/`
  Pure or deterministic domain helpers and state transitions for run hydration, dungeon actions, monsters, economy, markets, raids, Council, pathing, combat, and presentation selectors.

- `../src/components/`
  Presentational shell, Council, dungeon, Toolbox, inventory, evolution, glossary, and log components.

- [`../src/App.css`](../src/App.css)
  Main visual and responsive layout system, including dungeon art layers, Council, market cards, fixed desktop/tablet shell, and phone breakpoints.

- [`../src/index.css`](../src/index.css)
  Global page defaults.

- [`../src/ErrorBoundary.jsx`](../src/ErrorBoundary.jsx)
  Top-level crash screen with reload and copied diagnostics. It does not delete current or backup saves.

### Authored data and pure helpers

- [`../src/gameContent.js`](../src/gameContent.js)
  Authored content for hero behavior, raid directives, raid metadata, orders, hero profiles, leader traits, Council factions, favor bands, sponsor content, monsters, rooms, artifacts, doctrines, statuses, and fusion archetypes. Also exports `validateGameContent()`.

- [`../src/gameRules.js`](../src/gameRules.js)
  Extracted day-cadence rules: Council days, Escalation days, and ordinary invasion-choice days.

- [`../src/random.js`](../src/random.js)
  Deterministic seeded random stream with a persisted cursor.

- [`../src/playtestSupport.js`](../src/playtestSupport.js)
  Build version, save keys, save snapshots, backup writes, export helpers, clipboard fallback, and diagnostics.

### Tests

- [`../src/gameContent.test.js`](../src/gameContent.test.js)
- [`../src/gameRules.test.js`](../src/gameRules.test.js)
- [`../src/random.test.js`](../src/random.test.js)
- [`../src/playtestSupport.test.js`](../src/playtestSupport.test.js)
- [`../tests/e2e/playtest-smoke.spec.js`](../tests/e2e/playtest-smoke.spec.js)
- [`../vitest.config.js`](../vitest.config.js)
- [`../playwright.config.js`](../playwright.config.js)

### Documentation and player support

- [`Dungeonlord_Guidebook.html`](Dungeonlord_Guidebook.html)
  Editable guidebook source.

- [`Dungeonlord_Guidebook.pdf`](Dungeonlord_Guidebook.pdf)
  Rendered player guide.

- [`PRIVATE_ALPHA_RELEASE_NOTES.md`](PRIVATE_ALPHA_RELEASE_NOTES.md)
- [`KNOWN_ISSUES.md`](KNOWN_ISSUES.md)
- [`PRIVATE_ALPHA_TEST_PLAN.md`](PRIVATE_ALPHA_TEST_PLAN.md)
- [`BUG_REPORT_TEMPLATE.md`](BUG_REPORT_TEMPLATE.md)

### Assets

- `public/assets/tiles/path/` — six topology images
- `public/assets/tiles/support/` — sealed sanctum shell and utility centerpieces
- `public/assets/tiles/empty/` — unexcavated stone
- `public/assets/tiles/markers/` — Entrance, Core, and Ash Breach markers
- `public/assets/council/` — chamber, crests, silhouette, scroll texture
- `public/assets/markets/` — trader, dealer, Flesh Market, and fusion art
- `public/assets/expeditions/` — expedition-order crests

## State Model

`App` owns one large state object. Major groups include:

- dungeon grid and selected tile
- currencies and doctrines
- artifacts and market stock
- Core HP and shield
- Ash Trial and timed Nihaza effects
- heroes, monsters, raid queues, and raid intel
- day, phase, current raid metadata, and last raid report
- Council session, favor, quest, counters, and punitive raid metadata
- invasion choices and escalation progression
- dungeon level and build selectors
- movement payload
- run seed and RNG cursor
- first-run dismissal

Transient UI state is kept in separate React state variables, including:

- active hamburger tab
- Council screen and focus
- fusion and sacrifice selection
- selected inventory monster
- broken image-source fallbacks
- save status
- advanced-management disclosure

## Grid Schema

The grid is an array of 8 rows by 8 cells. A cell can carry combinations of:

- `entrance`
- `core`
- `room`: `trap`, `monster`, `utility`, or null
- room type key and tier
- monsters
- trap armed state, type, stars, rank, charges, and cooldown
- other derived or persisted combat fields

Ash Breaches are intentionally stored outside the permanent grid in `state.ashTrial.breaches`.

Runtime-derived values such as path validity, room links, auras, topology art, and tile radar are not stored as permanent schema.

## Persistence

Current keys:

- Current save: `dungeonlord.save.v1`
- Automatic backup: `dungeonlord.save.backup.v1`

Save behavior:

1. `buildSaveSnapshot()` adds build version, seed, and RNG cursor.
2. Autosave/manual save serializes the complete state.
3. The previous valid save becomes the automatic backup before the current slot is replaced.
4. Load runs through the defensive normalization path in `systems/runState.js`.
5. Missing fields receive safe defaults, allowing older saves to migrate softly.

Exported saves are JSON files. Imports are validated for an object containing a grid before normalization.

Important rule: any new persisted field must have a safe load default. Do not make old saves depend on the new field already existing.

## Randomness

All gameplay randomness should use `randomFloat()` or helpers built on it.

- A visible run seed identifies the random stream.
- The cursor identifies how far the stream has advanced.
- Seed and cursor are persisted.
- Diagnostics include both values.

Do not use `Math.random()` for gameplay. Non-gameplay visual animation may remain CSS-driven.

## Pathing and Simulation

- Orthogonal pathing only.
- Dungeon validity requires all active entrances to reach the Core.
- Invader movement uses objective selection plus neighbor scoring.
- Raid-local `raidIntel` stores danger and discovered hubs.
- Anti-loop behavior penalizes recent patterns and low-value backtracking.
- Pathfinding and invader decisions live in `systems/pathing.js`.
- Combat turns, rewards, Core pressure, and raid completion live in `systems/combat.js`.
- `App.jsx` dispatches `resolveCombatTurn()` without containing the simulation.

## Responsive Shell

### Wide desktop/tablet (`min-width: 981px`)

- Fixed-height application shell
- Left internal management panel selected by the hamburger menu
- Center dungeon HUD and grid
- Right Selected Tile, first-run guidance, and action rail
- Internal side-panel scrolling rather than whole-page scrolling
- Extra touch/short-height scrollbar behavior for coarse pointers or short viewports

### Narrow tablet/phone (`max-width: 980px`)

- Stacked hamburger/tab flow
- Grid-first ordering
- Selected Tile below the grid
- Phone action rail remains thumb-oriented

The dedicated Playwright `tablet-short-landscape` profile exists because real tablet browser chrome can substantially reduce usable CSS height.

## Art Rendering

Path-carrying tiles use topology-derived art:

- isolated
- dead end
- straight
- corner
- tee
- cross

The art layer rotates independently from the tile and retains state overlays.

Utility rooms use:

- shared sealed sanctum shell
- unique transparent centerpiece

Empty tiles use shared unexcavated-stone art.

All image-backed tile paths have glyph/CSS fallbacks when a source fails.

## Build, Test, and Deploy

Use `npm.cmd` in this Windows PowerShell environment when script execution policy blocks `npm.ps1`.

```powershell
npm.cmd run dev
npm.cmd run lint
npm.cmd run test
npm.cmd run build
npm.cmd run check
npm.cmd run check:alpha
```

- `check`: lint, unit tests, production build
- `check:alpha`: full check plus Playwright
- Vite base path: `/Dungeonlord/`
- GitHub workflow: `.github/workflows/main.yml`
- Pushes to `main` build and deploy `dist` to GitHub Pages.

## Architectural Constraints

- `App.jsx` must remain a coordinator; domain rules belong in `systems/`.
- State-transition modules must not call React setters, the DOM, clipboard APIs, downloads, or `localStorage`.
- Cross-system imports must remain acyclic and flow from shared foundations toward composed systems.
- Save semantics are compatibility-sensitive.
- CSS contains many layered responsive rules; new rules must be scoped carefully and tested at all Playwright profiles.
- Council and market UI depend on static art but must retain usable fallbacks.
- The private alpha requires deterministic reproduction and local-only diagnostics.
- Do not introduce a backend or analytics as an incidental refactor.

## Current Module Responsibilities

1. `shared`, `economy`, `dungeon`, and `monsters` provide foundational calculations.
2. `markets`, `raids`, `council`, and `pathing` compose those foundations without importing React.
3. `*Actions` modules expose state-in/state-out transitions.
4. `runState` owns initial-state creation and defensive save hydration.
5. `combat` owns full raid-turn resolution.
6. `App` owns the authoritative state and browser effects.
7. `components` render props and invoke callbacks without changing game rules.

## Verified Boundary Baseline

Verified on 2026-07-29:

- 16 production modules under `src/systems/`
- no circular imports in the production subsystem graph
- no React, DOM, clipboard, download, or browser-storage APIs in production subsystem modules
- 12 presentational modules under `src/components/`
- 6 Vitest files with 17 passing unit tests
- 12 applicable Playwright tests passing, with 8 profile-specific skips

Keep `gameContent.js` as the authored data layer. Further refinement should split a focused module only when its internal responsibilities become independently testable; do not recreate a generic catch-all utilities file.
