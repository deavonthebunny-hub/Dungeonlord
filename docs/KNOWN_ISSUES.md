# Dungeonlord Private Alpha Known Issues

Version: `0.1.0-alpha.2`

## Confirmed Limitations

- Saves are browser-local unless the player exports the JSON file. Clearing browser storage can remove the current save and its automatic backup.
- Core damage persists across raids as long-term run pressure. There is currently no ordinary Core repair action.
- The game is designed around current Chromium-based desktop, tablet, and phone browsers. Other engines may work but are not part of the alpha smoke matrix.
- The interface contains dense management panels. The first-run checklist and guidebook explain the intended opening flow, but advanced systems remain intentionally discoverable rather than tutorial-locked.
- Diagnostic and save sharing is manual and player-controlled. No report is uploaded automatically.

## October 3 Working-Tree Follow-Up

B1 fixes duplicate/no-benefit Dominion purchases, the active Escalation heading, and doctrine-adjusted monster HP readouts; it is committed and pushed as `98c753d`. Copy With Save and preserved Day 11/15/31 import/reload/backup workflows passed in isolated test contexts; the original empty diagnostic artifact remains unexplained and preserved.

B2's local authored starter pair and limited paid Day 2 recovery offer meet the fixed-seed normal-opening pilot targets. They do not guarantee wins; repeated losses in the severe stress suite and first-time human usability still need review. Later trap dominance, small Elites, transaction previews, and other clarity gaps remain under investigation. Construction-star reroll abuse was not demonstrated. See [PLAYTEST_FOLLOW_UP_PLAN.md](PLAYTEST_FOLLOW_UP_PLAN.md), [B1_RESULTS.md](B1_RESULTS.md), and [B2_RESULTS.md](B2_RESULTS.md).

## Release Gate

There are no intentionally accepted save-loss, blank-screen, hard-lock, or inaccessible-control defects. Any reproducible example should be reported as a Blocker with diagnostics and, when possible, an exported save.
