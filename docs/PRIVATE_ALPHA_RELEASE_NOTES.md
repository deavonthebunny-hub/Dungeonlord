# Dungeonlord 0.1.0-alpha.2

This release is the private-alpha candidate for invited testing. Major feature work is temporarily frozen while testers validate the endless dungeon loop, onboarding, saves, and responsive controls.

## Alpha Candidate Highlights

- Deterministic run seeds and reproducible diagnostic bundles.
- Visible save status, automatic backup restoration, and portable save export/import.
- First-run checklist and an updated player guidebook.
- Normal, Elite, Escalation, Council, and Nihaza raid flows.
- Responsive desktop, tablet, and phone shell with hamburger panel navigation.
- Automated content, cadence, save-support, and responsive browser smoke tests.

## B1 Local Stabilization — 2026-10-03

Changes verified before the separate commit/push step:

- One queued Pulse per turn; duplicate purchases no longer consume Dominion.
- Already-active Speed/Strength and capped Shield cannot consume currency for no additional effect; empty-target powers are unavailable.
- Active Escalation identity remains correct during combat.
- Monster HP displays include the doctrine maximum without changing base combat stats.
- New tactical/UI regressions, isolated diagnostic/save verification, and a local deterministic opening-report command.

The verified gate is 77 unit tests and 16 applicable browser tests with 24 profile-specific skips when the optional local checkpoint test is enabled. Encounter sizes, damage values, rewards, starting resources, and progression prices remain unchanged. Opening recovery and encounter/economy tuning are next, not completed fixes. See [B1_RESULTS.md](B1_RESULTS.md).

## Testing Priorities

- Complete the first raid without verbal assistance.
- Compare Normal and Elite invasion choices.
- Reach and clear the Day 5 Escalation Raid.
- Reach and conclude the Day 10 Council.
- Confirm that persistent Core damage, trap resets, room links, and utility auras are understandable.
- Export a save, import it in another browser or device, and verify that the run resumes safely.

## Reporting

Use `docs/BUG_REPORT_TEMPLATE.md`. Include copied diagnostics or an exported save whenever a defect can be reproduced. Dungeonlord does not collect or transmit analytics automatically.
