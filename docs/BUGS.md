# Dungeonlord Bugs, Risks, and Known Constraints

Last updated: 2026-10-03
Current release: `0.1.0-alpha.2`

## Current Blockers

No reproducible Blocker is intentionally accepted in the current release candidate.

Any repeatable crash, blank screen, save loss, hard lock, or inaccessible required control is a Blocker and should stop feature work.

## Current Major Bugs

No reproducible Major defect is intentionally accepted in the current release candidate.

This statement does not mean the game is bug-free. The private alpha exists to identify defects that the current automated and manual checks do not cover.

## Open Design/Implementation Discrepancies

### B-001 — Level 10 room-cap target differs from implementation

**Severity:** Design decision / balance risk
**Status:** Open

Earlier design discussion targeted 35 occupiable tiles at Dungeon Level 10. Current code implements:

`4 + ((level - 1) * 2) + permanent bonuses`

That yields 22 rooms at Level 10 before permanent bonuses.

Do not “fix” this by changing one constant. The economy, Ash Breach space, layout density, upgrade value, and late-run pacing should be reviewed together.

### B-002 — Physical Samsung tablet scroll recovery needs fresh verification

**Severity:** Major if inaccessible; otherwise closed regression risk
**Status:** Awaiting hardware re-test

The code and Playwright short-tablet profile provide internal scrolling for:

- right Selected Tile/onboarding/action rail
- left Toolbox and other hamburger panels

The physical Samsung tablet used for playtests should confirm:

- Upgrade Dungeon and all action rows are reachable
- Normal and Elite choices are reachable and selectable
- the grid remains visible
- no whole-page scroll is required

If this fails, capture viewport size, device scale, browser version, screenshot, and diagnostics.

### B-003 — Tracked zero-byte `Selected` file has no known purpose

**Severity:** Repository hygiene
**Status:** Open

The repository root contains a tracked empty file named `Selected`. It has no code references. Remove it only after confirming it is not part of an external workflow.

## October 3 Playtest Follow-Up

### B-004 — Dominion powers can spend without an additional effect

**Severity:** Major
**Status:** Fixed locally in B1; not yet published

The playtest reproduced two Pulse purchases resolving as one. The action/UI now reject duplicate queued Pulse, already-active Speed/Strength, capped Shield, and powers with no possible present target, without spending. Costs, effect strength, and Shield cap are unchanged. Direct-action/combat and browser regressions cover the fix.

### B-005 — Active Escalation heading falls back to Normal

**Severity:** Minor
**Status:** Fixed locally in B1; not yet published

The heading now uses active encounter identity after `nextRaidType` is cleared. A browser regression verifies Escalation identity and level before and after a combat turn.

### B-006 — Doctrine maximum HP missing from monster readouts

**Severity:** Minor
**Status:** Fixed locally in B1; not yet published

Monster displays and combat share the effective-maximum helper. The preserved Day 31 fused defender displays 38/38. Base stats and save schema remain unchanged.

### B-007 — Opening roster losses followed by late trap dominance

**Severity:** Balance observation
**Status:** Open; next investigation is B2

One autonomous seed lost five defenders across Days 1-2, then sustained no Core damage after Day 5 with a developed trap lane. Small late Elites, accumulated income, and low monster participation require controlled comparisons. No numerical tuning has been performed. Other clarity gaps and the untested construction-reroll hypothesis are tracked in [PLAYTEST_FOLLOW_UP_PLAN.md](PLAYTEST_FOLLOW_UP_PLAN.md).

Capture/restore evidence and limitations are in [B1_RESULTS.md](B1_RESULTS.md). The earlier empty bundle remains preserved; current copy passed, so an in-game clipboard defect was not established.

### B-008 — Forced-day Build-phase hydration regenerates the raid plan

**Severity:** Reproducibility risk / intent review
**Status:** Open; existing behavior retained in B1

Importing the preserved Day 15 Build save advances the RNG cursor from 1641 to 1643 while `prepareRaidPlanForDay()` regenerates the forced encounter plan. Core, currencies, and layout restore successfully; active-raid cursor preservation remains tested. Decide whether the saved pending plan should be reused before using forced-day checkpoints for matched encounter comparisons. B1's fresh seeded mechanical baseline does not depend on save hydration.

## Known Constraints, Not Bugs

### Browser-local saves

Current and backup saves live in the same browser storage. Clearing site data can remove both. Export is the cross-device and durable-backup path.

### One automatic backup

The game keeps one previous valid slot, not a multi-version save history.

### Persistent Core damage

Core damage persists between raids. There is no ordinary repair action. This is an active design choice for alpha measurement.

### Chromium-first support

The alpha smoke matrix uses Chrome/Chromium. Other engines are not currently a release gate.

### Dense management UI

Advanced systems remain discoverable rather than tutorial-locked. The checklist and guidebook mitigate, but do not remove, the learning curve.

### Local-only diagnostics

No analytics or reports are uploaded automatically. Tester quality depends on copied diagnostics, exported saves, and clear reproduction steps.

## Engineering Risks

### R-001 — Subsystem boundary regression

`src/App.jsx` has been reduced to approximately 192 lines and now composes separate controller, view-model, persistence, system, and component boundaries. `GameView` receives seven grouped domain contracts. The original monolith risk is substantially mitigated, but cross-system gameplay still shares one authoritative run-state object and the grouped contracts must not drift back into catch-all bundles.

Mitigation:

- keep state transitions pure and state-in/state-out
- keep gameplay command wiring in `useGameController` and derived display data in `useGameViewModel`
- keep the seven `GameView` contracts domain-focused
- prevent circular subsystem imports
- keep browser effects in the persistence/support adapters
- run the full alpha gate after changes that cross domain boundaries

### R-002 — Unit tests do not exhaust full combat resolution

The current 60 unit tests cover content, cadence, RNG, save schema/migrations/storage, defensive run hydration, layout-preserving run reset, raid/Core lifecycle, Council and Nihaza outcomes, monster staffing and fusion, artifact/doctrine progression, representative subsystem transitions, and an opening raid through combat. Browser smoke tests cover the opening flow, responsive access, and legacy import/backup restore, but the suite does not exercise every status, passive, room, artifact, doctrine, Council quest definition, or migration path in combination.

Mitigation:

- add a regression test with every confirmed Major fix
- add focused combat-hook and migration cases alongside changes to those contracts

### R-003 — CSS responsive-rule layering

The shell has accumulated desktop, touch, short-height, tablet, and phone overrides. A later rule can unintentionally override panel visibility or overflow.

Mitigation:

- keep breakpoints explicit
- test all Playwright projects
- prefer one responsibility per breakpoint
- verify on the physical tablet

### R-004 — Save compatibility boundary can regress

The game still persists the large runtime state object, so field changes remain compatibility-sensitive. The current version, minimum shape, legacy transformations, and browser-storage keys are now explicit under `src/persistence/`, with final defensive normalization isolated in `src/systems/runState.js`.

Mitigation:

- preserve safe defaults
- extend migration coverage whenever persisted state fields change
- preserve both existing browser-storage keys
- keep migration transforms pure and storage access outside domain systems

## Recently Stabilized Regressions

These are not currently open, but future sessions should know they previously failed:

- fusion selection blank-screen crash
- trap charges remaining empty between raids
- room Link versus utility Aura confusion
- Council scroll cards cutting off action content
- market art containers clipping child controls
- Selected Tile/grid collisions
- desktop/tablet hamburger panel visibility
- short tablet action and invasion controls being unreachable
- HUD pills bleeding into the right rail

Treat a recurrence as a regression and add automated coverage where practical.

## Reporting

Use [BUG_REPORT_TEMPLATE.md](BUG_REPORT_TEMPLATE.md).

Required:

- device and browser
- build version and seed
- expected and actual behavior
- exact reproduction steps
- Copy Diagnostics or Copy With Save
- screenshot for visual defects

Severity:

- **Blocker:** crash, save loss, hard lock, unusable required controls
- **Major:** broken raid/content mechanic or unavoidable invalid state
- **Minor:** misleading UI, layout defect, unclear explanation
- **Balance/Idea:** tuning or feature suggestion
