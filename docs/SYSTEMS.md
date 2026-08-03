# Dungeonlord Implemented Systems

Last updated: 2026-08-03
Current release: `0.1.0-alpha.2`

This document describes systems present in the current checkout. Proposed features are listed in [ROADMAP.md](ROADMAP.md), not here.

## Runtime Organization

- `App.jsx` owns the authoritative React state and coordinates the game view.
- `src/hooks/usePersistence.js` owns browser save effects, status, and player-facing persistence commands.
- `src/persistence/` owns the current schema, legacy migrations, and browser-storage access.
- `src/systems/` owns run hydration, dungeon, economy, monster, market, raid, Council, pathing, combat, and state-transition logic.
- `src/components/` owns the major presentational panels.
- Subsystem actions accept state and return state without calling React setters.
- Gameplay randomness continues through the seeded run RNG.
- The current unit suite contains 59 tests across 13 files, including focused coverage for save schema/migrations/storage, raids/Core, Council/Nihaza, monster management/fusion, artifacts, and doctrines.

## Content Inventory

| Content | Count |
|---|---:|
| Standard monsters | 62 |
| Flesh Market unique monsters | 6 |
| Standard artifacts | 33 |
| Flesh Market unique artifacts | 5 |
| Trap rooms | 13 |
| Monster rooms | 11 |
| Utility rooms | 13 |
| Total buildable rooms | 37 |
| Fusion archetypes | 7 |
| Expedition orders | 4 |
| Standard hero profiles | 8 |
| Leader traits | 5 |
| Status definitions | 11 |
| Council sponsors | 12 |
| Council retaliation factions | 12 |

`validateGameContent()` currently validates cross-references, required room-link descriptions, fusion hints, and other authored-data contracts.

## Run Initialization

A fresh run creates:

- an 8x8 grid
- fixed Entrance at `(1,1)`
- starter Training Den at `(2,1)`
- Core at `(3,1)`
- two generated starter monsters deployed in the Training Den
- 10 Essence
- 30 Soulshards
- zero Evolution, Dominion, and Darkcrystals
- Dungeon Level 1
- two stable Day 1 invasion choices
- a visible seed and RNG cursor
- the 7-step first-run checklist

## Phases and Day Cadence

### Build phase

Allows:

- invasion selection
- room construction and clearing
- room movement
- monster staffing and withdrawal
- dungeon and doctrine upgrades
- market purchases
- fusion and sacrifice when available
- Council interaction on Council days

### Battle phase

Allows:

- Start Raid
- Dominion powers
- End Turn
- inspection through the grid and management panels

### Cadence

- Ordinary days: choose Normal or Elite.
- Day 5, 15, 25, and so on: forced Escalation.
- Day 10, 20, 30, and so on: Council overrides Escalation.
- Council concludes into the next Build day.
- Punitive Council raids override an ordinary choice when scheduled.

## Dungeon Construction

- Three room families: trap, monster, utility.
- Tier upgrades up to Tier 3 where supported.
- Dungeon Level capped at 10.
- Current room-cap formula starts at 4 and adds 2 per level.
- Build and movement operations preserve validation requirements.
- Clearing a monster room returns its monsters to inventory.
- Entrance cannot be moved.
- Utility rooms are non-walkable.
- Ash Breaches cannot hold rooms or be cleared during an active trial.

## Path Validation and Entrances

- Entrance, Core, trap rooms, monster rooms, and Ash Breaches are traversable.
- Orthogonal connections only.
- Normal runs have the permanent Entrance.
- Ash Trials add one or two temporary runtime entrances.
- Validation checks every active entrance, not only the permanent Entrance.
- Hero spawning uses weighted active-entrance selection.
- Ash Breaches collapse on trial success or failure.

## Room Links

- Blood, Ward, and Hunt are the current link tags.
- Only new tagged rooms participate.
- Orthogonal same-tag adjacency activates both rooms.
- One matching neighbor is enough.
- Link effects do not stack.
- Link state is runtime-derived.
- Selected Tile, Tile Details, and Glossary expose tag, state, and bonus.

## Utility Auras

- Utility rooms influence nearby tiles independently of links.
- Aura range uses the authored room effect and effective tier.
- Utility tiers can be improved by doctrines and artifacts.
- A tile can be aura-affected while reporting Link `none` or `n/a`.
- Auras never make utility rooms traversable.

## Traps

Implemented trap data includes:

- type
- base and linked effects
- tier
- stars and rank
- armed state
- charges
- cooldown

Trap charges are reset at raid start through `resetTrapsForRaid()`, with doctrine, artifact, linked Aegis Lantern, and Ash Trial modifiers applied. Triggering consumes charges; cooldown and delayed effects resolve during raid turns.

Readiness chips show remaining raid charges. Build-phase Disarm/Rearm remains available but is not required for normal raid-to-raid reset.

## Monster Roster

Standard monsters are authored with:

- unlock day
- recruitment weight
- class pool
- optional affinity pool
- optional passive bias
- optional fusion hint

Generic monster generation filters by unlock day and uses weighted selection. Themed sponsor and faction rewards preserve authored pools while respecting unlock rules unless explicitly unique.

## Monster Stats, Stars, Passives, and Evolution

- Star cap: 5
- Evolution stage cap: 2
- Star multipliers increase base stats.
- Day bands constrain generated stars.
- Passives can be biased by authored monster identity.
- Evolution costs currently progress from 20 to 50 Evolution.
- Permanent room-placement bonuses persist when a monster is returned to inventory.
- Save hydration rebuilds derived monster stats while preserving current HP, status, fusion, unique, evolution, and permanent-bonus state.

## Monster Room Staffing

- Explicit inventory selector
- Place Selected Monster
- Inventory shortcut: Assign to Selected Room
- Per-monster Return to Inventory
- Withdraw All
- Build-phase only
- Disabled during move mode
- Capacity respects room tier, doctrines, artifacts, and temporary Nihaza reward
- Stable Hooks heals withdrawn monsters to full

## Fusion

Flesh Market fusion:

- exactly two inventory parents
- first parent is primary body
- second parent supplies recipe bias and contribution
- Unique, deployed, and fused monsters are ineligible
- Darkcrystal cost
- artifact cost reduction support
- inherited star and evolution stage
- up to two inherited passives without rerolling
- seven archetype outcomes
- visible preview with result name/icon/passives/star/stage
- resulting monster persists through save/load

Fused monsters are currently non-sacrificable.

## Flesh Market

The Flesh Market opens through Maltheron Council access for a timed window.

Implemented actions:

- purchase six unique monsters
- purchase five unique artifacts
- sacrifice eligible inventory monsters for Darkcrystals
- fuse eligible monsters

Unique stock is finite and tracked by purchased keys.

## Standard Markets

### Monster Trader

- Three daily offers
- Unlock-banded, weighted standard roster
- Purchases use Soulshards

### Shady Dealer

- Four offers by default
- Five with Black Satchel
- Filters by unlock day
- Excludes artifacts already at copy cap
- Finite catalog with completion-aware empty state
- Owned counts and tags shown in UI

## Artifacts

Artifacts remain repeated entries in `state.artifacts`; copy count is derived rather than stored in a separate schema.

Modifier hooks support:

- economy on hero death and trap kill
- global and linked trap damage
- trap charges
- monster ATK, DEF, and SPD
- linked Blood/Ward/Hunt room effects
- Core damage reduction and retaliation
- scouting and reveal changes
- utility potency
- room capacity
- withdrawal healing
- Shady Dealer stock
- dungeon and doctrine upgrade discounts
- Ash Trial combat bonuses
- fusion discounts

## Doctrines

Four branches:

- Trap
- Monster
- Utility
- Core

Doctrine effects are derived by `getDoctrineEffects()` and consumed by room, combat, Core, trap, utility, and economy calculations. Black Catechism reduces doctrine upgrade costs.

## Dominion Powers

Dominion is capped at 4 and supports tactical battle powers, including:

- Pulse
- Shield
- Speed
- Strength

Dominion regenerates through the current turn cadence. Effects are temporary and battle-oriented.

## Combat Statuses and Feedback

Statuses are data-driven through `STATUS_RULES`. The current catalog includes eleven definitions, covering damage-over-time, protection, debuffs, and targeting effects.

Combat logs expose:

- attacks
- reductions and shields
- trap damage components
- status application
- deaths and reward sources
- Core hits and retaliation
- raid reports

Selected Tile and detailed management surfaces show occupants, readiness, effects, links, and auras.

## Radar Pings

Monster rooms replace the old H/M grid chips with CSS-animated pings:

- green: player monsters
- red: invading heroes
- maximum four visible pings per side
- exact counts remain in Selected Tile and Tile Details
- display-only; no within-room position state is stored

## Raid Generation

### Normal Raid

- one expedition order
- mixed eligible standard profiles
- no guaranteed leader
- mild directive
- baseline rewards

### Elite Expedition

- one expedition order
- smaller, stronger party
- guaranteed named leader with one trait
- stronger directive
- `x1.3` base reward multiplier
- `+1 Evolution` clear bonus

### Escalation Raid

- forced cadence
- level based on completed Escalations
- elite-style identity
- guaranteed leader
- growing party, stats, rewards, and Evolution bonus

### Council Retaliation

- monster-faction composition
- sponsor/faction directive
- faction-weighted archetypes
- deterministic attacker ordering by lowest favor

## Invader AI

Behavior archetypes:

- Zealot
- Cautious
- Scout
- Breaker
- Purifier

Directives:

- Rush Core
- Break Frontline
- Purge Support
- Probe Flanks

Active raids carry `raidIntel`:

- danger tiles
- trap hubs
- utility hubs
- monster hubs
- directive
- leader ID

Invaders carry objective memory, target tile, commitment turns, route memory, and loop-breaking metadata. Scouts and Purifiers discover hubs; Cautious invaders use shared danger; Zealots largely ignore it.

## Scouting and Raid Forecast

Raid Forecast displays:

- choice or forced raid type
- expedition order and crest
- directive
- expected archetype mix
- elite leader trait
- reward multiplier
- revealed upcoming invaders

The separate Scout Report card was removed; revealed queue information is folded into Raid Forecast.

## Council

The Council includes twelve Dungeonlords, a dynamic attendee roster, art-backed chamber, crest nodes, dark decree details, and a full-screen interaction state.

Mechanics:

- attend or decline
- favor shifts and rivalries
- sponsor boons
- standard and hard quests
- active quest completion/expiry
- punitive retaliation after repeated decline
- Conclude Council day advancement
- deterministic retaliation selection

## Favor

Favor rules:

- Attend: `+1` with each attendee
- Decline: `-1` with each attendee
- Accept boon: `+2` with sponsor
- Accept quest: `+1` with sponsor
- Complete quest: `+2` with sponsor
- Fail/expire quest: `-2` with sponsor
- Each Council: one step toward neutral
- Rivalry: fixed one-point opposite spillover

Sponsor access:

- Hostile: no boon or quests
- Wary: boon only
- Neutral: boon and standard quest
- Favored: boon, standard, and hard quest
- Allied: same access plus improved banded rewards

## Nihaza Ash Trial

State:

- active
- difficulty
- breach positions
- completed raids
- required raids
- expiry day

Placement:

- edge tile
- empty
- not Entrance/Core/room/breach
- not adjacent to permanent Entrance
- within Manhattan distance 2 of a trap or monster room
- spacing from another active entrance/breach
- preflight availability shown in Council UI

Rewards:

- Standard: `+1` capacity to all monster rooms until next Council
- Hard: `+1` permanent room cap

Failure:

- breaches collapse
- `-25` Core maximum HP until the following Council
- sponsor favor penalty

## Save, Backup, Import, and Diagnostics

- Explicit current save version and compatibility-sensitive field list
- Pure legacy currency/trap-field migrations before final `runState` normalization
- Browser storage isolated from domain systems and React coordination
- Autosave status and save/load/import/export/restore commands isolated in `usePersistence`
- Automatic browser-local current save
- One automatic browser-local backup
- Visible save status
- Manual Save Now
- Export Save
- Import Save
- Restore Backup with confirmation
- Imported/restored runs preserve the prior backup through their first normalized autosave
- Reset Run confirmation
- New Run confirmation
- build version, seed, and RNG cursor in save
- Copy Diagnostics
- Copy Diagnostics with Save
- local-only data; nothing is transmitted automatically

## Error Recovery

The top-level Error Boundary provides:

- readable crash state
- current build version
- Reload Game
- Copy Diagnostics
- current-save inclusion
- backup availability
- no automatic save deletion

## Onboarding and Guidebook

- Seven-step first-run checklist
- Contextual rules links
- Advanced Management collapsed by default
- Guidebook in the hamburger menu and Playtest Support
- PDF and HTML guidebook sources
- private-alpha bug report template

## Responsive UI

- Universal hamburger menu
- Fixed wide-screen dungeon shell
- Left internally scrollable management panel
- Centered grid/HUD
- Right internally scrollable Selected Tile/guidance/action rail
- Coarse-pointer and short-height tablet recovery
- Stacked phone layout
- responsive Playwright matrix
