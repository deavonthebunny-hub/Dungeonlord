# Dungeonlord Private Alpha Known Issues

Version: `0.1.0-alpha.2`

## Confirmed Limitations

- Saves are browser-local unless the player exports the JSON file. Clearing browser storage can remove the current save and its automatic backup.
- Core damage persists across raids as long-term run pressure. There is currently no ordinary Core repair action.
- The game is designed around current Chromium-based desktop, tablet, and phone browsers. Other engines may work but are not part of the alpha smoke matrix.
- The interface contains dense management panels. The first-run checklist and guidebook explain the intended opening flow, but advanced systems remain intentionally discoverable rather than tutorial-locked.
- Diagnostic and save sharing is manual and player-controlled. No report is uploaded automatically.

## Release Gate

There are no intentionally accepted save-loss, blank-screen, hard-lock, or inaccessible-control defects. Any reproducible example should be reported as a Blocker with diagnostics and, when possible, an exported save.
