# Dungeonlord Private Alpha Test Plan

Target: 5-15 invited testers on `0.1.0-alpha.2`.

## Tester Groups

1. New strategy players use only the in-game first-run checklist.
2. Guidebook players read the PDF before beginning.
3. Experienced testers use supplied saves or natural runs to target Council, Escalation, Nihaza, fusion, and late-run management.

## Required Session Notes

- First point of confusion.
- Whether the first raid was completed without help.
- Why Normal or Elite was selected.
- Whether Day 5 and Day 10 were reached.
- Whether persistent Core damage was understood.
- Whether room links were distinguishable from utility auras.
- Any device, browser, layout, or control issue.
- Whether defeat felt earned, unclear, or unavoidable.

## B2 Opening Validation

The local B2 mechanical pilot uses ten declared seeds; reproduce with `npm.cmd run balance:opening` and `npm.cmd run balance:opening -- --poor-first-raid`. The stress command explicitly sets Day 1 defenders to 1 HP once and is not a natural playthrough. Exact policy and measured Core bands are in [B2_RESULTS.md](B2_RESULTS.md).

Fresh human runs should record Day 1 survivors, purchases, whether the paid Day 2 recovery offer was understood/used after losing all monsters, Core HP after Days 3 and 5, complete roster wipes, and arrival at Council. Test checklist-only players separately from players shown the pilot layout. Existing saves retain their roster and should not be mistaken for a fresh authored-pair run. Confirm that casualties remain understandable and that a replacement leaves a useful development choice.

## Defect Triage

- **Blocker:** crash, save loss, hard lock, or unusable required controls.
- **Major:** broken raid/content mechanic or unavoidable invalid state.
- **Minor:** misleading UI, layout defect, or unclear explanation.
- **Balance/Idea:** tuning feedback or feature suggestion.

## Release Checklist

- Fresh run reaches Day 10.
- Normal, Elite, and Escalation raids are cleared.
- One Council session is concluded.
- Save export, import, and backup restoration are verified.
- Desktop, tablet landscape, tablet portrait, and phone are exercised.
- No reproducible Blocker or Major defect remains open.
