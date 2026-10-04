# Dungeonlord Roadmap

Last updated: 2026-10-03
Current release: `0.1.0-alpha.2`

## Roadmap Principle

Dungeonlord already has enough systems and content for a meaningful alpha. The roadmap now prioritizes recoverability, comprehension, regression prevention, and evidence-backed tuning over raw feature count.

## Milestone 1 — Private Alpha Execution

**Status:** Current

Target 5–15 invited testers.

### Tester groups

1. New players use only the in-game checklist.
2. Guidebook players read the PDF first.
3. Experienced players test targeted Council, Escalation, Nihaza, fusion, and late-run saves.

### Immediate checklist

1. Run `npm.cmd run check:alpha`.
2. Verify the physical Samsung tablet:
   - right control-rail scroll
   - Toolbox scroll
   - Normal and Elite selection
   - all action buttons
3. Complete a fresh manual run through Day 10.
4. Verify Normal, Elite, Day 5 Escalation, and Council conclusion.
5. Export a save and import it in a second browser/profile.
6. Supply testers with:
   - guidebook
   - bug report template
   - instructions for Copy Diagnostics
7. Triage reports as Blocker, Major, Minor, or Balance/Idea.

### Exit criteria

- no reproducible Blocker
- no unresolved reproducible Major
- at least three testers reach Day 10
- first raid can be completed without verbal assistance
- device/layout access is stable

## Milestone 2 — Alpha Blocker and UX Patch

**Status:** Next, evidence-dependent

Only address issues supported by repeated reports or a clear reproduction.

The October 3 autonomous run completed Day 30 and exposed early roster wipes, later trap dominance, duplicate queued-Pulse spending, small Elite encounters, and decision-clarity gaps. The proposed next execution sequence is [PLAYTEST_FOLLOW_UP_PLAN.md](PLAYTEST_FOLLOW_UP_PLAN.md), using B1-B6 labels distinct from the completed engineering phases. It prioritizes tactical correctness and reproducible evidence, opening recovery, encounter pressure, sustainable progression, and verified player-facing clarity. No numerical balance changes have been implemented by drafting that plan.

B1 is now completed locally: guarded tactical spending, active raid/HP display corrections, nonempty diagnostic capture, isolated checkpoint restoration, and a deterministic opening report. The alpha gate passed with 77 unit tests and 16 applicable browser tests. See [B1_RESULTS.md](B1_RESULTS.md). B2 opening recovery is the next implementation objective; no numerical tuning has started.

Likely work:

- save, crash, or hard-lock fixes
- device-specific control access
- misleading rules copy
- first-run emphasis
- glossary/guidebook corrections
- reward or Core-pressure tuning if early losses repeatedly feel unavoidable
- one decision on the Level 10 room-cap discrepancy

Every fixed Blocker or Major should add a unit or Playwright regression when practical.

## Milestone 3 — Combat Presentation Pass

**Status:** Planned after alpha stability

Goals:

- pixel sprites for heroes and monsters
- readable attacker/target presentation
- room-local staging
- clearer attack, Guard, damage-over-time, Marked, and death feedback
- preserve grid-first combat

Boundaries:

- no separate battle screen
- no replacement combat simulation
- no formation-system rewrite
- art should map to authored profile/race identity without requiring one-off logic per encounter

Recommended implementation sequence:

1. Define sprite dimensions, transparency, facing, anchor, and fallback contract.
2. Add one hero and one monster prototype.
3. Build a reusable room-combat presentation layer.
4. Validate at real tile size.
5. Expand the sprite catalog only after the fallback and staging rules work.

## Milestone 4 — Foundation Extraction

**Status:** Completed foundation pass

Completed:

1. save creation and normalization
2. raid planning and generation
3. combat and rewards
4. pathing, objective selection, and raid intel
5. Council and market resolution
6. dungeon, monster, economy, and progression transitions
7. major presentational panels

`App.jsx` is now the authoritative state coordinator rather than the domain implementation.

Phase 3 regression expansion completed on 2026-08-03 for:

- trap reset and linked effects
- active-raid save migration
- Council completion/failure
- Nihaza placement, success, and expiry
- staffing and withdrawal
- fusion completion
- artifact unlock/cap/mod hooks
- Core destruction and reset

The resulting baseline is 48 passing unit tests across 10 files. Continue adding focused tests for individual combat hooks, save migrations, and confirmed alpha defects rather than treating this pass as exhaustive coverage.

Phase 4 persistence extraction completed on 2026-08-03:

- current save version and compatibility-sensitive fields are explicit
- legacy transformations are pure and precede defensive run-state normalization
- all browser-storage access is isolated in `src/persistence/browserStorage.js`
- `usePersistence` owns autosave status and save/load/import/export/restore/diagnostic commands
- import and restore preserve the prior backup through the first normalized autosave
- persistence coverage raises the baseline to 59 unit tests across 13 files, plus a browser import/restore contract

Phase 5 application-coordination extraction completed on 2026-08-03:

- `useGameController` groups dungeon, monster, market, raid, Council, combat, and run commands while calling the existing subsystem transitions
- `useGameViewModel` owns derived validation, tile, raid-forecast, Council, artifact, inventory, onboarding, and shell presentation data
- `GameView` now receives seven domain contracts: `run`, `dungeon`, `raid`, `council`, `inventory`, `shell`, and `actions`
- leaf components no longer receive the raw React run-state setter
- the layout-preserving run reset is a pure tested transition in `src/systems/runActions.js`
- `App.jsx` is now a 192-line authoritative state owner and composition root
- the verified baseline is 60 unit tests across 13 files plus 13 applicable Playwright tests

## Milestone 5 — Late-Run Identity

**Status:** Candidate; validate after alpha

Candidate direction: make Nihaza a later-stage Dungeonlord.

Recommended maturity gate:

- Day 30+
- Dungeon Level 5+
- 2 Escalation clears

Use an omen Council before guaranteed arrival. Preserve all existing Nihaza save state. See [DECISIONS.md](DECISIONS.md).

Other late-run questions:

- Does the room cap create enough labyrinth space?
- Is the Core attrition curve sustainable?
- Does the finite artifact catalog exhaust too early?
- Do Escalations stay distinct at high levels?

Do not answer these by adding content before alpha data exists.

## Deferred

- final boss or final floor
- direct room-to-room monster transfer
- artifact crafting
- artifact equipment slots
- evergreen Shady Dealer offers
- exact-pair fusion recipes
- separate combat screen
- online accounts or cloud saves
- automatic analytics
- major Council roster expansion
- another broad room/monster/artifact wave

## Release Sequence

```text
0.1.0-alpha.2
  -> private alpha
  -> blocker/major patch
  -> focused onboarding/balance patch
  -> combat presentation prototype
  -> foundation extraction
  -> late-run identity/content decisions
```
