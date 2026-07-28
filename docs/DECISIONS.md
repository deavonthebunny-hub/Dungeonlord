# Dungeonlord Design and Engineering Decisions

Last updated: 2026-07-28
Status vocabulary: **Active**, **Proposed**, **Deferred**, **Superseded**

## Active Decisions

### D-001 — Endless mode is the core format

**Status:** Active

Dungeonlord does not currently build toward a final floor or final boss. Long-term pressure comes from Escalations, Council consequences, Core attrition, economic competition, and sponsor trials.

### D-002 — The dungeon is an 8x8 orthogonal board

**Status:** Active

Pathing, links, movement, Ash placement, and validation use orthogonal relationships. Diagonal adjacency does not create routes or room links.

### D-003 — Utility rooms are non-walkable

**Status:** Active

Utility rooms affect nearby tiles but never count as invader path exits. This preserves route legibility and separates support placement from corridor construction.

### D-004 — Grid art is connectivity-based

**Status:** Active

Entrance, Core, trap rooms, monster rooms, and Ash Breaches use six reusable topology images rotated from orthogonal exit masks. Utility rooms use sealed sanctums, and empty tiles use unexcavated stone. Room identity remains in borders, markers, badges, and overlays.

### D-005 — Dungeon Level is capped at 10

**Status:** Active, with unresolved cap target

The code caps Dungeon Level at 10. The implemented room-cap formula is `4 + 2 per additional level + permanent bonuses`, yielding 22 rooms at Level 10 before bonuses.

An earlier product decision described 35 occupiable tiles at Level 10. The discrepancy must be resolved deliberately before balancing late-run layout pressure.

### D-006 — Combat stays turn-based and room-local

**Status:** Active

Combat remains on the main grid and advances through ordinary raid turns. No separate battle scene or second combat simulation is planned for the current alpha.

### D-007 — Ordinary raid choice plus fixed special-day cadence

**Status:** Active

- Ordinary Build days: Normal or Elite choice
- Day 5 multiples excluding 10: forced Escalation
- Day 10 multiples: Council
- Council punitive raids override the next ordinary choice

Council is a non-raid day and advances through Conclude Council.

### D-008 — Raid reward multipliers affect only base kill rewards

**Status:** Active

Normal/Elite/Escalation multipliers change base hero-kill Essence and Soulshards. They do not multiply artifact bonuses, room bonuses, Ash Tribute, Soul Altar, or Council rewards.

### D-009 — Nihaza creates temporary structural pressure

**Status:** Active

Ash Breaches are runtime-only temporary entrances, not permanent grid corruption or an endgame phase. They collapse immediately on success and at expiry on failure.

### D-010 — Ash Breaches require an existing combat frontier

**Status:** Active

A breach must be an eligible edge tile within Manhattan distance 2 of a trap or monster room. Utility rooms do not anchor placement. If enough candidates do not exist, the relevant Nihaza quest is unavailable rather than falling back to arbitrary edge placement.

### D-011 — Favor gates Council access

**Status:** Active

Favor is individual per Dungeonlord, clamped to `-6...+6`, drifts toward neutral each Council, and controls boon/standard/hard access. Rivalries create fixed opposite one-point spillover.

### D-012 — Links and auras are distinct

**Status:** Active

Blood, Ward, and Hunt rooms link through orthogonal same-tag adjacency. Utility auras are independent radius effects. An aura never creates a link.

### D-013 — Monster staffing is explicit and Build-phase only

**Status:** Active

Players select the exact inventory monster to place and can return monsters individually or all at once. Direct room-to-room transfer remains a two-step return-and-place workflow.

### D-014 — Fusion is archetype-based

**Status:** Active

Fusion is based on the primary body, secondary fusion hint/inference, and one secondary contribution. Exact race-pair recipes are deferred. Unique and fused ingredients are ineligible, and fused results are non-sacrificable.

### D-015 — Standard artifacts are a finite collectible catalog

**Status:** Active

Dealer stock filters by unlock day and copy cap. It does not fall back to evergreen filler offers when the catalog is exhausted.

### D-016 — Gameplay randomness is seeded

**Status:** Active

Gameplay randomness must use the deterministic run RNG. Seed and cursor are persisted and exposed in diagnostics. This is required for alpha bug reproduction.

### D-017 — Saves and diagnostics are local and player-controlled

**Status:** Active

There is no analytics or automatic upload. Current save, backup, exports, and diagnostics remain local unless a tester chooses to share them.

### D-018 — Save migration is soft

**Status:** Active

New persisted fields receive defaults during normalization. Old runs should not be rejected simply because new metadata is absent.

### D-019 — First-run guidance is contextual, not a tutorial mode

**Status:** Active

The alpha uses a seven-step checklist, contextual Glossary links, and a PDF guidebook. A separate scripted tutorial is not justified before alpha feedback proves it necessary.

### D-020 — The dungeon is the primary shell surface

**Status:** Active

Desktop and tablet prioritize the grid. Management panels open through one hamburger menu. Wide layouts use local side-rail scrolling; phones use a stacked flow and thumb-friendly actions.

### D-021 — Private-alpha feature freeze

**Status:** Active

Reproducible Blocker and Major defects take precedence over new monsters, rooms, artifacts, Council sponsors, or large mechanics until the private-alpha gate is met.

### D-022 — Domain systems use explicit module boundaries

**Status:** Active

`App.jsx` owns the authoritative React state and browser-facing effects. Gameplay rules, deterministic state transitions, save hydration, combat, pathing, and Council/market behavior live in focused modules under `src/systems/`. Presentational panels live under `src/components/`.

Subsystem actions receive state and return state. They do not call React setters, the DOM, downloads, clipboard APIs, or browser storage. Imports must remain acyclic, and save fields retain soft-migration defaults.

## Proposed Decisions

### P-001 — Gate Nihaza as a later-stage Dungeonlord

**Status:** Proposed, not implemented

Recommended eligibility:

- Day 30 or later
- Dungeon Level 5 or later
- at least 2 completed Escalation Raids

Recommended presentation:

1. Meeting the requirements makes Nihaza eligible.
2. The next Council shows an omen or empty ash-marked seat.
3. Nihaza is guaranteed at the following Council if she did not appear.
4. First encounter offers Standard Defiance of Extinction.
5. Hard becomes available after completing Standard and reaching Favored standing.

Compatibility requirement: existing saves with Nihaza favor, an active Nihaza quest, or an active Ash Trial must retain that state.

This gate would define “late stage” through demonstrated run maturity rather than day alone.

## Deferred Decisions

### F-001 — Combat Presentation Pass

**Status:** Deferred until the alpha blocker pass

Planned direction:

- hero and monster pixel sprites
- room-local combat staging
- clearer attack and status feedback
- no combat-system rewrite

### F-002 — Further focused-module refinement

**Status:** Deferred until evidence justifies it

The foundation extraction is complete. Further splitting should target a focused module only when its responsibilities or regression evidence support a clearer boundary; line count alone is not sufficient.

### F-003 — Direct room-to-room monster transfer

**Status:** Deferred

Current two-step transfer is explicit and easier to keep save-safe.

### F-004 — Artifact crafting, slots, and evergreen stock

**Status:** Deferred

The current artifact model remains finite, passive, and copy-capped.

### F-005 — Final boss or final floor

**Status:** Deferred

Endless mode remains the product identity.

## Superseded Decisions

### S-001 — Desktop three-column always-visible panels

**Status:** Superseded

This layout cramped the dungeon and caused tablet collisions. It was replaced by the hamburger-controlled shell with internally scrollable side areas.

### S-002 — H/M occupant chips on monster rooms

**Status:** Superseded

They were replaced by animated red/green radar pings. Exact counts remain in inspection panels.

### S-003 — Arbitrary edge Ash Breach placement

**Status:** Superseded

It could force unaffordable map-wide expansion. Frontline-constrained placement now prevents bad trial states.
