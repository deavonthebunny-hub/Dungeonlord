# Dungeonlord Handoff

Last updated: 2026-07-29
Current release: `0.1.0-alpha.2`

This is the starting document for a new Codex session. Read it first, then follow the linked detail documents rather than reconstructing the project from chat history.

## Project Purpose

Dungeonlord is an endless dungeon-defense roguelite built with React and Vite. The player constructs and staffs a connected dungeon, chooses or survives distinct invasions, develops monsters and artifacts, negotiates with the Council, and protects a persistently damaged Core.

The project is in a private-alpha feature freeze. The current goal is tester readiness and evidence-backed stabilization, not another large content expansion.

## Current Architecture

- Browser-only React 19 + Vite 7
- No backend, database, router, TypeScript, state library, or analytics
- 8x8 grid
- One authoritative React state object coordinated by `src/App.jsx`
- Domain rules and state transitions in `src/systems/`
- Presentational panels in `src/components/`
- Authored data in `src/gameContent.js`
- Seeded RNG in `src/random.js`
- Day cadence in `src/gameRules.js`
- Save/backup/export/diagnostics in `src/playtestSupport.js`
- Top-level crash recovery in `src/ErrorBoundary.jsx`
- Browser-local save plus one browser-local backup
- Vitest unit tests and Playwright responsive smoke tests

Architecture detail: [ARCHITECTURE.md](ARCHITECTURE.md)

## Completed Systems

- Build/Battle loop and dungeon validation
- 37 room definitions across trap, monster, and utility families
- Blood/Ward/Hunt room links and separate utility auras
- 62 standard monsters and 6 Flesh Market uniques
- explicit monster-room staffing and withdrawal
- stars, passives, evolution, statuses, and room effects
- 7 fusion archetypes, sacrifice, and Darkcrystals
- 33 standard artifacts and 5 unique artifacts
- four doctrine branches
- Normal/Elite invasion choice
- forced Escalation cadence
- 4 expedition orders, 8 hero profiles, 5 leader traits
- objective-based invader AI with shared raid intel
- 12-member Council, favor, boons, quests, rivalries, and punitive raids
- Nihaza Ash Breach trial
- topology, support, empty, Council, market, and expedition art
- first-run checklist and PDF guidebook
- error boundary, deterministic seed, diagnostics, export/import, and backup restore
- responsive desktop, tablet, short-tablet, and phone shell

System detail: [SYSTEMS.md](SYSTEMS.md)

## Important Files

| Path | Purpose |
|---|---|
| `src/App.jsx` | React state owner, browser effects, derived view data, and subsystem coordination; about 1,175 lines |
| `src/App.css` | Main visual and responsive system; about 2,846 lines |
| `src/gameContent.js` | Authored content and validation |
| `src/systems/` | Run state, dungeon, economy, monsters, markets, raids, Council, pathing, combat, and pure transitions |
| `src/components/` | Top bar, dungeon, Council, Toolbox, inventory, evolution, glossary, and log presentation |
| `src/gameRules.js` | Council/Escalation cadence |
| `src/random.js` | Seeded RNG and cursor |
| `src/playtestSupport.js` | Build version, saves, backups, exports, diagnostics |
| `src/ErrorBoundary.jsx` | Crash recovery |
| `tests/e2e/playtest-smoke.spec.js` | Responsive opening-flow and tablet tests |
| `playwright.config.js` | Five browser/device profiles |
| `docs/Dungeonlord_Guidebook.html` | Editable player guide |
| `docs/Dungeonlord_Guidebook.pdf` | Rendered guide |
| `.github/workflows/main.yml` | GitHub Pages deployment |

## Documentation Map

- [GAME_DESIGN.md](GAME_DESIGN.md) — intended game and current rules
- [ARCHITECTURE.md](ARCHITECTURE.md) — code, state, saves, tests, deployment
- [SYSTEMS.md](SYSTEMS.md) — implemented feature inventory
- [DECISIONS.md](DECISIONS.md) — active, proposed, deferred, superseded decisions
- [PROJECT_STATUS.md](PROJECT_STATUS.md) — current release and readiness state
- [BUGS.md](BUGS.md) — open discrepancies, risks, and constraints
- [ROADMAP.md](ROADMAP.md) — ordered next milestones

Existing tester documents:

- [PRIVATE_ALPHA_RELEASE_NOTES.md](PRIVATE_ALPHA_RELEASE_NOTES.md)
- [PRIVATE_ALPHA_TEST_PLAN.md](PRIVATE_ALPHA_TEST_PLAN.md)
- [KNOWN_ISSUES.md](KNOWN_ISSUES.md)
- [BUG_REPORT_TEMPLATE.md](BUG_REPORT_TEMPLATE.md)

## Current Branch and Repository Workflow

Phase 1 baseline published on 2026-07-29:

- branch: `main`
- Phase 1 verification commit: `78af118 Verify Phase 1 architecture baseline`
- remote: `origin https://github.com/deavonthebunny-hub/Dungeonlord.git`

Do not commit or push without explicit user authorization.

Use `npm.cmd` in PowerShell:

```powershell
npm.cmd run dev
npm.cmd run lint
npm.cmd run test
npm.cmd run build
npm.cmd run check
npm.cmd run check:alpha
```

`npm.cmd run check:alpha` is the release-candidate gate.

It last passed on 2026-07-29 after subsystem extraction: lint, 17 unit tests across 6 files, production build, and 12 applicable Playwright tests passed with 8 profile-specific skips. In a managed Codex filesystem sandbox, Vitest/esbuild may require an approved rerun if it reports `Cannot read directory "../..": Access is denied`.

### Verified subsystem boundary baseline

Verified on 2026-07-29:

- `src/systems/` contains 16 production modules with an acyclic internal import graph.
- Production subsystem modules contain no React, DOM, clipboard, download, or browser-storage APIs.
- `src/components/` contains 12 presentational component modules.
- `App.jsx` remains the authoritative React state and browser-effect coordinator.
- Domain changes continue to enter through pure state-in/state-out subsystem transitions.

GitHub Pages deploys from `main` with base `/Dungeonlord/`. The workflow pins Node 24, installs with `npm ci`, runs the full `check:alpha` gate, and creates the Pages artifact only after lint, unit tests, the production build, and Playwright pass. The deploy job depends on that verified artifact.

## Design Decisions

Critical decisions:

- endless mode, no final boss/floor
- 8x8 orthogonal grid
- utility rooms are non-walkable
- combat stays turn-based, room-local, and on-grid
- ordinary Normal/Elite choice, Escalation on non-Council fifth days, Council on tenth days
- Ash Breaches are temporary runtime entrances
- links and auras are separate
- fusion is archetype-based
- standard artifact catalog is finite
- deterministic gameplay RNG
- local-only saves and diagnostics
- contextual checklist plus PDF instead of scripted tutorial
- private-alpha feature freeze

Full record: [DECISIONS.md](DECISIONS.md)

## Known Bugs and Constraints

No accepted reproducible Blocker or Major is currently recorded.

Open items:

1. **Room-cap discrepancy:** code yields 22 Level 10 rooms before permanent bonuses; earlier design target was 35.
2. **Physical tablet verification:** re-test internal scrolling on the actual Samsung playtest tablet after the latest CSS/E2E change.
3. **Focused-module depth:** combat and Toolbox are now isolated, but remain the largest modules and need targeted regression coverage.
4. **Test depth:** current unit suite does not cover full combat, Council, Nihaza, or every save migration.
5. **Browser-local durability:** current and backup saves can both be lost if site storage is cleared.
6. **Chromium-first alpha:** other browser engines are not release gates.
7. **Tracked empty file:** root `Selected` file appears unused.

Full register: [BUGS.md](BUGS.md)

## Known Constraints for Changes

- Preserve old saves with safe normalization defaults.
- Route gameplay randomness through `randomFloat()`.
- Keep diagnostics local; do not add automatic transmission.
- Keep `App.jsx` as a coordinator; add game rules to the owning subsystem and UI to the owning component.
- Preserve the acyclic subsystem dependency direction and state-in/state-out action contracts.
- Test every CSS shell change at all Playwright profiles.
- Keep art fallbacks functional.
- Do not change Council cadence, Nihaza rules, Core persistence, or room-cap formula incidentally.
- Preserve the fixed desktop/tablet shell and local scrolling unless the task explicitly changes it.
- Work around unrelated user changes; never reset the worktree destructively.

## Unfinished Features

Not implemented:

- later-stage Nihaza eligibility gate
- hero/monster combat sprite presentation
- room-local combat staging
- cloud saves/accounts
- scripted tutorial mode
- final boss/final floor
- direct room-to-room transfers
- crafting or artifact slots

## Current Priority

Run the private alpha and fix evidence-backed Blocker/Major defects.

Do not begin the Combat Presentation Pass until:

- the physical Samsung tablet is usable
- manual Normal/Elite/Escalation/Council flow passes
- export/import and backup restoration pass
- testers can complete the opening without live coaching
- no reproducible Blocker or Major remains

## Exact Next Steps

1. Run:

   ```powershell
   git status --short
   npm.cmd run check:alpha
   ```

2. On the physical Samsung tablet:
   - open Toolbox
   - scroll to Raid Forecast
   - select Normal, then Elite
   - close the panel
   - scroll the right rail to every action
   - verify the grid remains visible

3. Complete a fresh manual run:
   - Normal clear
   - Elite clear
   - Day 5 Escalation clear
   - Day 10 Council attend/decline and Conclude

4. Verify save support:
   - Export Save
   - import in another browser/profile
   - Restore Backup
   - Copy Diagnostics

5. Start invited alpha sessions using [PRIVATE_ALPHA_TEST_PLAN.md](PRIVATE_ALPHA_TEST_PLAN.md).

6. For each defect:
   - classify severity
   - reproduce from seed/save
   - fix only the confirmed scope
   - add regression coverage where practical
   - rerun `npm.cmd run check:alpha`

7. After the blocker pass:
   - resolve the Level 10 room-cap target
   - make one focused onboarding/balance patch from repeated reports
   - prototype the Combat Presentation Pass

## Handoff Warning

Do not treat historical chat plans as current code. Confirm implementation in the repository and update these documents whenever a decision, system boundary, release version, or open defect changes.
