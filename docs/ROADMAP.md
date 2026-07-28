# Dungeonlord Roadmap

Last updated: 2026-07-28
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

Expand tests for:

- trap reset and linked effects
- active-raid save migration
- Council completion/failure
- Nihaza placement, success, and expiry
- staffing and withdrawal
- fusion completion
- artifact unlock/cap/mod hooks
- Core destruction and reset

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
