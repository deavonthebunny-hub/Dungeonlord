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

The B1 verified gate was 77 unit tests and 16 applicable browser tests with 24 profile-specific skips when the optional local checkpoint test was enabled. B1 did not tune encounter sizes, damage values, rewards, starting resources, or progression prices, and was subsequently pushed as `98c753d`. See [B1_RESULTS.md](B1_RESULTS.md).

## B2 Local Opening Pilot — 2026-10-03

- New runs start with an ordinary two-star Ogre and Boar, with seeded classes/passives and the existing Training Den bonus applied once.
- Layout-preserving resets supply that pair in inventory for manual staffing; valid saved rosters are preserved.
- If no living owned monsters remain after Day 1, Day 2 includes one optional two-star Ogre trader offer for 20 Soulshards. It must be purchased/staffed and does not heal the Core or recur later.
- Checklist/glossary copy explains a mixed opening and the paid recovery opportunity.
- A declared ten-seed mixed policy retains Day 1 defenders in 10/10 runs and reaches Council without repeated full wipes in 9/10. A deliberately fragile Day 1 stress recovers Day 2 defenders in 8/8 wipe cases. Human first-time testing and broader encounter/economy tuning remain outstanding.

B2 is not yet committed or pushed. Encounter counts, hero scaling, general prices/rewards, later markets, and persistent Core damage are unchanged. See [B2_RESULTS.md](B2_RESULTS.md).

The final B2 gate passes 86 unit tests and 18 applicable browser tests with 32 profile-specific skips when the optional preserved-checkpoint verification is enabled.

## Testing Priorities

- Complete the first raid without verbal assistance.
- Compare Normal and Elite invasion choices.
- Reach and clear the Day 5 Escalation Raid.
- Reach and conclude the Day 10 Council.
- Confirm that persistent Core damage, trap resets, room links, and utility auras are understandable.
- Export a save, import it in another browser or device, and verify that the run resumes safely.

## Reporting

Use `docs/BUG_REPORT_TEMPLATE.md`. Include copied diagnostics or an exported save whenever a defect can be reproduced. Dungeonlord does not collect or transmit analytics automatically.
