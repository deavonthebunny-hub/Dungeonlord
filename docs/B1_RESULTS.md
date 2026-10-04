# B1 — Correctness and Reproducible Baseline

Implementation and verification completed: 2026-10-03. Release identifier remains `0.1.0-alpha.2`. This records the verification performed before the subsequent commit/push request, not deployment status.

## Completed fixes

- Pulse permits one pending activation per turn. Duplicate dispatch does not spend Dominion, the button is disabled with a visible queued explanation, and the accepted Pulse resolves once.
- Already-active Speed/Strength cannot spend again for the same turn. Resolution clears the buffs for reuse.
- Shield refuses purchases at or above the existing 30-point power cap without reducing shielding already above it. Below the cap, the original price buys up to 10 shield points, including partial gains near the cap.
- Pulse without a present hero, Speed/Strength without a living fielded defender, unavailable phases, insufficient currency, and unknown power identifiers cannot spend on an unavailable effect.
- The UI and action transition share `dominionPowerAvailability()` in the raid-action subsystem.
- Active raid metadata uses the active encounter instead of the `nextRaidType` field cleared at raid start. The Escalation heading and level stay correct during combat.
- Combat and monster readouts share `effectiveMonsterMaxHp()`. The preserved fused defender displays **38/38**, not 38/35. Base/permanent/fused stats are not rewritten and the doctrine is not applied twice. Inventory, Evolution, and Toolbox monster readouts use the effective maximum; hero HP remains unchanged.

No encounter sizes, damage values, starting roster/resources, prices, rewards, day cadence, Ward placement, or Core-persistence rules were tuned.

## Capture and restoration evidence

All verification used isolated Playwright contexts, not the autonomous-playtest browser profile.

Verified through ordinary controls:

1. Copy With Save generated a nonempty JSON diagnostic bundle with a portable save.
2. Its embedded save imported into a second isolated context and survived reload.
3. Preserved Day 11, 15, and 31 exports imported with Core/currencies/room counts intact, survived reload, and restored from the automatic backup after a temporary alternate import.
4. Original export SHA-256 hashes were unchanged after verification.
5. Day 31's selected defender showed the corrected effective HP maximum.

Timestamped evidence is generated under `output/b1-verification/`: a checkpoint-verification JSON and a new nonempty Day 31 Copy With Save bundle. The original zero-byte `completed-run-reproduction-bundle.txt` remains untouched. The current workflow succeeded; the cause of the earlier empty capture is not established. No production clipboard or persistence rewrite was necessary.

Checkpoint evidence records saved and hydrated RNG cursors. Day 11 and Day 31 retained their cursors; Day 15's Build-phase import regenerated the forced plan and advanced 1641 to 1643. This is existing hydration behavior, retained in B1 and recorded as B-008 for an intent/reproducibility review before checkpoint-based encounter comparisons. Usable restoration is verified, not byte-identical reconstruction of every normalized field or forecast. Active-raid cursor preservation remains covered by existing migration tests.

## Local deterministic opening workflow

Run from the repository:

```powershell
npm.cmd run balance:baseline -- --seed DL--1F0BD67D --days 5
```

The command creates a new timestamped JSON under `output/balance-baselines/`, without touching browser storage or replacing reports. It records:

- build, source commit/working-tree status, seed, strategy version, and RNG cursors
- explicit decisions and requested stopping condition
- every combat turn from Day 1, with before/after Core, currencies, defenders, heroes, and queued invaders
- deaths and new game log lines, plus a warning if the 90-line log cap could truncate a turn
- per-raid identity, party size, kills, losses, currency deltas, Core damage, and clear/defeat status
- purchase, replacement, and power spending, explicitly zero for this initial policy

The policy `unchanged-starter-normal-no-purchases-or-powers-v1` retains the starter layout/roster, chooses Normal on ordinary days, accepts forced Escalations, and advances turns. It runs the production raid/combat transitions through Vite, not a second simulation. Supported limits are Days 1-9, before Council handling.

For the original seed, this deliberately minimal reference clears two raids and is defeated on Day 3. It reports that failure honestly rather than claiming a completed five-day run. The underlying final Core value is -11, reflecting existing overkill behavior. It is **not** a replay of the autonomous player's purchases/powers, a recommended beginner strategy, or the reasonable mixed opening policy to be defined in B2.

Unit tests verify identical reports for the same seed/policy and honest turn-limit termination. B2-B4 will expand decision policies; the full three-strategy, multi-seed study is not claimed complete here.

## Verification

`npm.cmd run check:alpha` passed with the optional local checkpoint directory enabled:

- ESLint passed
- 77 unit tests passed across 15 files
- production build passed
- 16 applicable browser tests passed
- 24 profile-specific tests skipped as designed

Clipboard tests run serially because the clipboard is a shared external surface. Existing responsive opening/control tests still cover all five profiles.

To repeat preserved-export verification:

```powershell
$env:DUNGEONLORD_CHECKPOINT_DIR = Join-Path (Get-Location) 'output/autonomous-playtest-2026-10-03'
npm.cmd run test:e2e -- --project=desktop tests/e2e/playtest-correctness.spec.js
Remove-Item Env:DUNGEONLORD_CHECKPOINT_DIR
```

Without the environment variable, that local-evidence case skips because the exports are untracked, not repository fixtures. Permanent synthetic power/display, diagnostic round-trip, and legacy backup tests do not depend on those exports. Vitest/esbuild required the documented approved filesystem-sandbox rerun; this was not a game regression.

## Next

Proceed to **B2 — A recoverable Days 1-5 opening** in [PLAYTEST_FOLLOW_UP_PLAN.md](PLAYTEST_FOLLOW_UP_PLAN.md). Define a reasonable opening policy, compare seeds, and tune one supported category at a time. Physical Samsung tablet verification and first-time human sessions remain outstanding.

No commit, push, or deployment was performed during the B1 implementation/verification step. Publication is a separate user-authorized step.
