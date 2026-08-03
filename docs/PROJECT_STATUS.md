# Dungeonlord Project Status

Last updated: 2026-08-03
Release: `0.1.0-alpha.2`
Release stage: Private-alpha release candidate

## Executive Status

Dungeonlord is beyond prototype status and has a complete, identifiable endless-run loop. The current priority is not another content wave; it is validating the game with 5–15 invited testers, fixing reproducible blockers, and learning where first-time players become confused.

Current assessment:

- **Playable:** yes
- **Suitable for a small guided alpha:** yes
- **Suitable for an unrestricted public demo:** not yet
- **Major feature freeze:** active
- **Known accepted save-loss or blank-screen bug:** none

## Repository Snapshot

- Branch at documentation start: `main`
- Base commit at documentation start: `9982161 Improve short tablet scrolling and add responsive E2E coverage`
- Remote: `https://github.com/deavonthebunny-hub/Dungeonlord.git`
- Working tree before these documents: clean
- Deployment: GitHub Pages from `main`
- Vite base: `/Dungeonlord/`

Always re-run `git status --short` before changing code. Do not assume this snapshot is still current in a future session.

## Completed Product Milestones

### Core dungeon loop

- 8x8 dungeon board
- Build and Battle phases
- path validation
- room construction, clearing, tiers, movement, and capacity
- persistent Core HP and shield
- Dungeon Level cap
- responsive dungeon-first shell

### Dungeon content

- 37 buildable rooms
- Blood/Ward/Hunt room links
- utility auras
- topology path art
- support sanctum art
- empty unexcavated-stone art
- Core, Entrance, and Ash markers

### Monsters and progression

- 62 standard monsters
- 6 unique Flesh Market monsters
- explicit room staffing
- withdrawal and Stable Hooks behavior
- stars, classes, affinities, passives, evolution
- 7 fusion archetypes
- sacrifice and Darkcrystals

### Artifacts and doctrines

- 33 standard artifacts
- 5 unique artifacts
- unlock bands and copy caps
- Shady Dealer stock filtering
- four doctrine branches
- artifact/doctrine hooks across combat, economy, scouting, rooms, Ash Trials, and fusion

### Raid tactics

- Normal and Elite choice
- forced Escalation cadence
- Council override cadence
- 4 expedition orders
- 8 hero profiles
- 5 leader traits
- behavior archetypes and directives
- raid-local shared intel
- anti-loop pathing
- Council faction retaliation

### Council

- 12 Dungeonlords
- chamber art and crests
- dynamic attendee ring
- sponsor boons and quests
- favor bands, decay, rivalries, and access gating
- punitive retaliation
- Nihaza Ash Breach trial

### Playtest safety

- application error boundary
- visible build version and seed
- deterministic RNG
- current save plus automatic backup
- export/import
- backup restore
- save status
- destructive-action confirmations
- diagnostics with or without save
- local-only tester support

### Engineering foundation

- domain rules split into acyclic modules under `src/systems/`
- state-in/state-out transitions for dungeon, monster, market, raid, Council, and combat actions
- save creation and hydration isolated from browser storage
- major JSX surfaces split into focused presentational components
- `App.jsx` reduced from approximately 10,277 to 1,175 lines
- GitHub Pages deployment gated by locked installation, lint, unit tests, production build, and Playwright

### First-run support

- seven-step checklist
- contextual rules links
- advanced-management disclosure
- player guidebook
- alpha test plan
- bug report template

## Automated Readiness

Available commands:

```powershell
npm.cmd run lint
npm.cmd run test
npm.cmd run build
npm.cmd run check
npm.cmd run check:alpha
```

Current unit suite:

- authored content validation and minimum catalog coverage
- ordinary/Escalation/Council cadence
- deterministic RNG replay and cursor persistence
- save snapshot/version metadata and import validation
- deterministic run creation, legacy defaults, malformed optional data, active-raid hydration, and attended-Council hydration
- trap reset, linked effects, raid completion, Core destruction, and clean-run reset
- Council attend/decline/conclusion, punitive raids, ordinary quest completion/expiry, and Nihaza placement/success/failure
- monster staffing, withdrawal, room clearing, fusion completion, and fusion rejection paths
- artifact unlocks, copy caps, modifier stacking, doctrine thresholds, discounts, and Core Doctrine HP changes
- representative dungeon, market, raid, and combat transitions

Current browser suite:

- first-run invasion flow through raid completion
- grid and action-rail availability
- short-landscape tablet scrolling
- invasion selection in the tablet Toolbox
- portable save export

Profiles:

- desktop
- tablet landscape
- short tablet landscape with touch
- tablet portrait
- Galaxy S9+ phone

### Verification snapshot

Verified on 2026-08-03 with `npm.cmd run check:alpha`:

- ESLint passed
- 10 Vitest files passed
- 48 unit tests passed
- production build passed
- Playwright: 12 applicable tests passed
- Playwright: 8 project-specific tests skipped as designed

The first sandboxed Codex attempt could not let Vitest/esbuild read the config path; rerunning the same command with the required filesystem permission passed. This was an execution-sandbox limitation, not a repository test failure.

## Current Alpha Priorities

1. Re-test the short-height internal scrolling on the physical Samsung playtest tablet.
2. Run at least one complete manual scenario through:
   - Normal clear
   - Elite clear
   - Day 5 Escalation
   - Day 10 Council conclusion
   - save export/import
3. Recruit 5–15 testers across the three groups in the test plan.
4. Require version, seed, reproduction steps, and diagnostics for defects.
5. Fix every reproducible Blocker and Major before new feature work.
6. Use repeated reports—not one-off suggestions—to drive the first onboarding/balance patch.

## Open Product Questions

- Should the Level 10 room cap be the implemented 22 rooms or the earlier 35-tile target?
- Does persistent Core damage feel like earned long-term pressure or create unavoidable early failure?
- Do first-time players understand links versus auras?
- Can new players finish the first raid without verbal coaching?
- Should Nihaza be gated behind run maturity rather than appearing in the ordinary Council pool?
- Does the physical tablet shell remain usable under real browser chrome and device scaling?

## Alpha Exit Criteria

- At least three testers reach Day 10.
- Fresh runs complete Normal, Elite, Escalation, and first Council flows.
- Export/import and backup restoration work across browsers.
- Desktop, tablet landscape, tablet portrait, and phone remain usable.
- No reproducible crash, save-loss, hard-lock, or inaccessible-control defect remains open.
- Repeated onboarding confusion has one focused response.

## Next Player-Facing Milestone

After the alpha blocker pass: Combat Presentation.

- pixel sprites for heroes and monsters
- clearer room-local attack/status presentation
- retain current grid combat and rules
- no separate battle screen

See [ROADMAP.md](ROADMAP.md) for sequencing.
