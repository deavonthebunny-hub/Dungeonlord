# Dungeonlord

Dungeonlord is an endless dungeon-defense roguelite built with React and Vite. Players construct a connected dungeon, staff monster rooms, choose invading expeditions, survive Escalation Raids, negotiate with the Council of Dungeonlords, and use an evolving roster, artifacts, doctrines, and the Flesh Market to keep the Core alive.

Current release target: **private alpha 0.1.0-alpha.1**.

## Local Development

Requirements:

- Node.js 20 or newer
- npm

Commands:

```powershell
npm install
npm run dev
npm run lint
npm run test
npm run build
```

The deployed GitHub Pages base path is `/Dungeonlord/`, configured in `vite.config.js`.

## Browser Smoke Tests

Install the Playwright Chromium runtime once:

```powershell
npx playwright install chromium
```

Then run:

```powershell
npm run test:e2e
```

The smoke suite covers desktop, tablet landscape, tablet portrait, and phone layouts.

## Saves And Reproduction

- Current save key: `dungeonlord.save.v1`
- Automatic backup key: `dungeonlord.save.backup.v1`
- Saves are versioned JSON and can be exported/imported from Toolbox > Advanced Management > Run.
- Every run has a visible deterministic seed and RNG cursor.
- `Copy Diagnostics` includes the build, seed, day, phase, raid metadata, validation state, and recent logs.
- `Copy With Save` includes the full state for exact reproduction.

Old saves are normalized by the load path in `src/App.jsx`. New persisted fields must always have safe defaults so existing runs remain loadable.

## Project Structure

- `src/App.jsx` - current game shell, state transitions, combat, Council, markets, and UI
- `src/gameContent.js` - authored monsters, rooms, artifacts, raids, statuses, and sponsor content
- `src/random.js` - deterministic seeded run randomness
- `src/gameRules.js` - extracted cadence rules
- `src/playtestSupport.js` - saves, backups, exports, and diagnostic bundles
- `docs/Dungeonlord_Guidebook.html` - editable guidebook source
- `docs/Dungeonlord_Guidebook.pdf` - rendered player guide
- `tests/e2e/` - responsive browser smoke tests

Future refactors should continue extracting pure gameplay rules from `App.jsx` without changing save semantics.

## Private Alpha Release Checklist

- `npm run lint` passes
- `npm run test` passes
- `npm run build` passes
- responsive smoke tests pass
- a fresh run reaches Day 10
- Normal, Elite, and Escalation raids have been cleared
- one Council session has been concluded
- save export/import and backup restoration have been verified
- no known save-loss or repeatable blank-screen defects remain

## Playtest Bug Reports

Ask testers to include:

1. device and browser
2. build version and run seed
3. expected and actual behavior
4. exact reproduction steps
5. copied diagnostics or exported save
6. screenshot for visual issues

Do not request personal information. Diagnostics are local and copied only when the tester chooses to share them.
