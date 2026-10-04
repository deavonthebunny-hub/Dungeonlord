# Dungeonlord Playtest Follow-Up Objectives

Created: 2026-10-03

Baseline release: `0.1.0-alpha.2`, commit `6a41c5b`

Status: B1 implemented and verified locally on 2026-10-03; B2-B6 remain proposed. Numerical balance tuning has not started.

## Direction

The next milestone is **opening recovery, encounter pressure, and sustainable progression**. The architectural extraction is complete enough to support this work in the owning subsystems. This is a focused private-alpha stabilization and balance pass, not a new content wave or another architecture rewrite.

The intended experience is a learnable opening with recoverable mistakes, followed by increasing and varied defensive decisions. Monster-heavy, trap-heavy, and mixed defenses should each be credible choices. Strong placement and investment should remain rewarding; a successful build does not need to take compulsory Core damage.

Use the labels **B1-B6** below to distinguish this balance/stabilization sequence from the completed engineering Phases 1-5.

## Evidence and limits

Primary evidence:

- Chat: **Play Dungeonlord through Day 30**, ID `01a10412-35af-7ee3-b60a-48f237e36873`. Review included both the initial run through Day 23 and the resumed completion through Day 30.
- [Complete playthrough report](../output/autonomous-playtest-2026-10-03/playthrough-report.md), also supplied as `C:\Users\Deavo\Downloads\playthrough-report.md`.
- [Chronological gameplay log](../output/autonomous-playtest-2026-10-03/chronological-gameplay-log.md), [structured journal](../output/autonomous-playtest-2026-10-03/gameplay-log.json), selected combat/UI logs, and Day 11, 15, and 31 exports in the same output folder.

Observed baseline, seed `DL--1F0BD67D`:

| Window | Observation | Question to answer |
|---|---|---|
| Days 1-2 | Two starter Imps, a purchased Skeleton, and two replacements all died. Core damage was 49 then 64. | Can an ordinary first-time defense retain investment and recover without perfect play? |
| Days 1-5 | 160 total Core damage; Core fell to 90/250. | Is permanent attrition concentrated too heavily before the player learns the systems? |
| Days 6-29 | Every raid dealt zero Core damage after trap charges, damage, cooldowns, and income improved. | Does a trap investment threshold remove too much subsequent pressure? |
| Late Elites | Days 21, 23, and 26 had one invader and cleared in two turns. | Do smaller parties actually justify their Elite identity and progression rewards? |
| End of Day 30 | 2,101 Essence; rear fused defender had zero personal Evolution. | Is defensive success feeding useful choices, or making further economy and monster progression largely irrelevant? |

This is one successful run and one evolving strategy, not population-wide balance evidence. It supports prioritizing investigation and controlled tuning, not declaring all monsters weak or all trap builds overpowered.

The early roster loop can feel negative-sum even when the whole run earns resources: replacing casualties consumes roster investment without developing surviving defenders. Measure roster replacement costs separately from total raid profit.

Evidence limitations to address:

- `completed-run-reproduction-bundle.txt` is currently zero bytes. Verify capture and the normal Copy With Save workflow; do not infer an in-game clipboard defect from an empty automation artifact alone.
- The continuous turn-observation file starts on Day 6. The opening is supported by the journal, chat, selected logs, and screenshots, but lacks equivalent every-turn coverage.
- Portable exports exist, but a successful fresh-profile import/restore has not been established by this run.
- The output folder is currently untracked. Preserve originals and deliberately decide which evidence/fixtures to retain in version control; do not bulk-add opaque exports incidentally.

## B1 — Correctness and reproducible baseline

**Status:** Completed locally. See [B1_RESULTS.md](B1_RESULTS.md) for fixes, capture/restore evidence, the deterministic workflow, and verification limits.

**Objective:** Remove silent tactical-resource loss and establish trustworthy before/after evidence.

Work:

1. Reproduce duplicate Pulse spending with at least 4 Dominion and two clicks before End Turn. The transition currently deducts currency twice while setting a single `pulsePending` boolean.
2. Proposed behavior: one queued Pulse at a time; reject a second purchase without spending, show pending status, and guard the domain transition as well as the button. Stacking would be a separate balance decision. Audit Speed/Strength refreshes and Shield caps for the same pay-without-benefit pattern, without assuming they are all defective.
3. Verify nonempty Copy With Save capture and import the existing exports in an isolated browser/profile, preserving the original local save and evidence.
4. Establish a local, deterministic balance-test/report workflow using existing raid and combat transitions, not a second simulation. Record seed, RNG cursor, build, strategy, decisions, and per-raid results. Keep autonomous player-facing runs separate from developer fixture tests.
5. Reproduce the active Escalation heading and effective maximum-HP display mismatch. Correct these small information defects before interpreting further playtests.

Done when:

- A second Pulse activation cannot silently consume Dominion for no additional effect; regression tests cover the action and resolution.
- Capture/restore results are recorded honestly, with remaining limitations explicit.
- Core loss, roster deaths, spending, and raid identity are consistently logged for the opening as well as later raids.

Primary owners: `raidActions.js`, `combat.js`, presentation selectors/components, `playtestSupport.js`, persistence/browser tests, and local test tooling.

## B2 — A recoverable Days 1-5 opening

**Objective:** Give a new player a chance to learn and grow instead of repeatedly purchasing disposable defenders.

Investigate together:

- Starter roster durability, room effects, route length, and first raid composition.
- Early hero stars, armor, class/passive combinations, party size, and damage events.
- Replacement affordability versus raid income, available trader stock, and ordinary upgrade choices.
- Early trap charges/exhaustion and whether Dominion use is an understandable rescue option or mandatory perfect timing.

Tune the smallest supported combination of starter defense, opening encounter budget, and replacement economy. Do not simultaneously make large changes to all three: compare one category at a time before combining successful adjustments.

Preserve the possibility of casualties and defeat. Do not grant automatic daily Core healing, invulnerable starters, or guaranteed raid wins as incidental fixes.

Proposed pilot targets, to confirm before tuning:

- Across ten predeclared seeds, a documented reasonable mixed opening on Normal retains at least one fielded defender after Day 1 in at least eight runs.
- At least eight of those runs reach the first Council without external coaching or repeated complete roster wipes; record Core HP at Days 3 and 5 to set an evidence-backed attrition band.
- After a poor first raid, an affordable next-day defense can recover without relying on rare stock, rebuild-star hunting, or advance knowledge of that seed. Recovery leaves a credible development choice rather than obliging every resource to fund casualties.

These are provisional product targets, not claims about current behavior or a requirement that every beginner survives Day 10. Human first-time testing remains necessary.

Primary owners: `runState.js`, `shared.js`, `gameContent.js`, `monsters.js`, `raids.js`, and economy/market rules.

## B3 — Coherent Normal, Elite, and Escalation pressure

**Objective:** Make difficulty labels and later escalation correspond to meaningful threat, not merely reward multipliers.

Current rules confirmed during review:

- Ordinary base party size is 2-4, independent of day. Elite subtracts one, allowing 1-3 before boons.
- Elite applies a 1.2 HP/ATK raid multiplier, star bias, and a guaranteed leader trait; it pays a 1.3 base-kill reward multiplier and one clear Evolution.
- Escalation increases party size and stats with escalation level. Stars, profiles, directives, leaders, and boons also affect threat; party count alone is not the complete scaling rule.

Work:

1. Define encounter budgets for the opening, Days 6-10, Days 11-20, and Days 21-30, including forced Days 5, 15, and 25.
2. Compare matched encounters against fixed defensive snapshots. Assess combined durability, damage, speed, armor, healing, trap interaction, leader effects, and queue behavior. Use behavioral tests alongside any numeric threat score.
3. Decide whether small Elite squads should remain. If they do, give them sufficient concentrated threat; otherwise revise the size rule. Do not prescribe a minimum party count without measuring the whole encounter.
4. Make Elite a recognizable risk/reward choice across representative builds. Review clear Evolution relative to actual threat and total rewards, not just the displayed multiplier.
5. Make successive Escalations test stronger established defenses while preserving their cadence and authored identities.

Done when:

- Late one-invader Elites no longer constitute a consistently trivial progression shortcut in the benchmark matrix.
- Elite has demonstrable additional pressure over matched Normal cases for more than one defense style, with documented exceptions for favorable counters/boons.
- Later Escalations create a meaningful adaptation or reserve-resource decision in representative runs. Zero Core damage is still acceptable when earned.

Primary owners: `raids.js`, `shared.js`, `gameContent.js`, and focused raid/combat regression tests.

## B4 — Sustainable trap economy and useful monster development

**Objective:** Keep traps rewarding without making income, later encounters, and monster growth collapse into one dominant loop.

Work:

1. Measure the established lane with and without individual damage artifacts, Trap Doctrine charge/cooldown thresholds, Ward coverage, and Soul Altar. Current damage uses stacked flat bonuses and additive percentage contributions; do not assume every modifier multiplies every other modifier.
2. Separate income from base kills, artifacts, altar coverage, quests, and boons. Track net investment and replacement costs, not just final Essence. Review whether available spending choices have already become irrelevant.
3. Test free trap construction and clear/rebuild stars in a disposable run. Source currently rolls stars during construction without deducting currency, but repeated abuse was not demonstrated in the playtest. Decide deliberately between free layout planning with persistent/deterministic quality, a limited reroll mechanic, or priced construction. Do not add broad room fees merely to close an untested hypothesis.
4. Compare monster-heavy, trap-heavy, and mixed development paths. Assess combat participation, survival, useful room synergies, and time to a meaningful evolution/fusion choice. Rear insurance need not gain personal points for fights it never participates in.
5. Review competition between global Evolution spending on doctrines and monsters. Personal plus global Evolution can fund evolution; the current first stage costs 20, while this run ended with 11 global points after other spending. This is not evidence of a broken eligibility calculation.
6. If participation rewards or progression costs need changes, choose them explicitly after measurement. Do not automatically grant full personal kill credit to idle defenders or force players to weaken their traps for experience.

Done when:

- More than one defense style supports credible development through the first Council and into mid-run.
- Additional trap investment has value without making every later defensive decision redundant across the seed matrix.
- Monster progression is reachable through a documented ordinary development path, and the tradeoff with doctrine spending is understandable.
- The construction-quality policy and economy copy agree; any anti-reroll change has save-compatible tests.

Primary owners: `combat.js`, `dungeon.js`, `dungeonActions.js`, `economy.js`, `monsters.js`, market actions/content, and progression tests.

## B5 — Decision clarity and accessible everyday controls

**Objective:** Let players understand decisions before spending, losing a monster, or beginning a raid.

Required follow-ups:

- Recruit: explicitly resolve the current blind-random purchase design. It generates the monster and variable Essence price on activation; there is no fixed selected offer to quote beforehand. A stable offer/confirmation would enable an exact preview, while retained blind recruitment requires honest cost/outcome information and an agreed spending limit. Do not display a guessed exact price.
- Sacrifice: show the selected monster's exact Darkcrystal yield before irreversible confirmation; retain fusion's useful result/cost preview.
- Room upgrades: show before/after damage, charges, cooldown, capacity, healing, or aura effect as relevant. Do not imply every upgrade improves every statistic.
- Evolution: display cost, personal contribution, available global contribution, deficit, and competition with other spending.
- Everyday management: make construction, staffing, and battle powers discoverable without implying they are optional advanced features.
- Party display: clearly distinguish initial roster/intel from live HP, casualties, and spawned/queued invaders.
- Trap badges: distinguish rank, stars, remaining charges, and cooldown. Verify what each actual badge means before renaming it; the report's interpretation of R is not authoritative.
- Forecast: state whether profile text describes tendencies or promised composition; reproduce the Day 1 pre/post-start change and later profile mismatches before deciding whether copy or generation is wrong.
- Council: keyboard/focus/button semantics for clickable cards; explicitly show when completed quests pay out, including Fresh Stock's raid-clear trigger.

Ward Lantern placement is **not a defect**. In the final layout, (2,2) covers actual traps at (2,1) and (3,1); Entrance and Soul Altar do not receive trap damage bonuses. At (3,2), it would cover (2,1), (3,1), and (4,1), but that site already holds the altar. Moving or swapping utilities changes damage and kill-income coverage. Aura influence includes diagonals; room links and paths remain orthogonal. The reported +40% reflects effective utility potency, not an invariant Tier 3 base bonus.

An aura-coverage highlight/count is an optional readability improvement, not required to correct the tester's choices. Balance tests should include both reasonable imperfect and optimized placements, so basic viability does not depend on finding one exact layout.

Done when pre-spend information matches resolved rules, essential controls are reachable without coaching, and Council/management interactions pass keyboard and responsive checks. Start the B1 correctness-related display fixes early; complete the remaining previews after the relevant balance/design choices settle.

Primary owners: `useGameViewModel.js`, the owning panels, shared presentation helpers, and browser regressions. Domain calculations should remain in their subsystems.

## B6 — Verification and release decision

**Objective:** Demonstrate a better opening and a healthier longer run without losing the completed engineering safeguards.

Validation matrix:

1. Predeclare ten seeds, including `DL--1F0BD67D`; run the same documented monster-heavy, trap-heavy, and mixed strategies through Day 10 before and after tuning.
2. Carry at least five of those seeds, including the original, through Day 30 for all three strategies. Record defeats as results; do not replace unfavorable seeds with successful ones.
3. Use fixed-state encounter fixtures at early, middle, and late bands to isolate Normal/Elite/Escalation pressure. A shared seed alone does not guarantee identical encounters when strategies consume different RNG draws.
4. Log Core loss, defender deaths and replacement spend, net currencies by source, power spend, trap exhaustion, combat duration, monster participation, and progression opportunities. Report ranges and failures, not only averages or final bank balances.
5. Run new first-time human sessions using only the in-game help. Keep the existing alpha goal of at least three testers reaching Day 10; verify the physical Samsung tablet as well as automated responsive profiles.
6. Verify export/import, backup restore, old-save normalization, Council conclusion, Escalations, and affected Nihaza/fusion mechanics. Do not overwrite the original playtest saves.
7. Run `npm.cmd run check:alpha`; update the bug register, known issues, release notes, guidebook, and project status with verified results and remaining balance limits.

Ship when the agreed opening targets, encounter-pressure checks, progression paths, and existing alpha reliability gates pass. Do not require damage on every raid or declare balance complete from one clean run.

## Execution boundaries and first implementation slice

Recommended sequence: **B1 -> B2 -> B3 -> B4 -> finish B5 -> B6**. B5 information work can proceed alongside earlier stages where it enables better decisions and tests; B6 measurements begin with the B1 baseline and repeat throughout.

The first implementation slice should be the duplicate-Pulse transition/UI guard and regression, followed by baseline capture/restore verification and the two reproduced display corrections. Numerical balance changes start only after that slice establishes trustworthy results.

Preserve the one authoritative state, pure subsystem transitions, seeded randomness, acyclic imports, local-only diagnostics, and old-save compatibility. Keep gameplay rules out of `App.jsx` and presentation-only code out of domain systems.

Do not incidentally change persistent Core damage, Council/Escalation cadence, Nihaza eligibility, the Level 10 room cap, or the finite artifact catalog. Room-cap resolution remains a separate explicit design decision if capacity becomes a measured late-run constraint. New content and the combat sprite pass remain deferred until this stabilization work is verified.

Only B1 has been implemented following the user's execution request. B2-B6 remain objectives, not completed fixes. No commit, push, or deployment has been performed.
