# Dungeonlord Game Design

Last updated: 2026-07-28
Current release: `0.1.0-alpha.2`

## Purpose

Dungeonlord is an endless dungeon-defense roguelite. The player is not an adventurer clearing rooms; the player is the Dungeonlord designing the route, recruiting and developing monsters, setting traps, managing a long-run economy, and surviving increasingly distinct invasions.

The game is built around three ideas:

1. **The dungeon layout is the primary strategy.** Route shape, room order, room links, utility coverage, monster staffing, and temporary Ash Breaches all matter.
2. **Every run asks for tradeoffs.** Resources compete across rooms, monsters, artifacts, doctrines, upgrades, and the Flesh Market.
3. **The run is endless pressure, not a final-floor campaign.** Escalations, persistent Core damage, Council relationships, and sponsor trials create long-term stakes.

## Core Loop

1. Enter the Build phase.
2. Inspect the dungeon, inventory, markets, Raid Forecast, and current long-term pressures.
3. Build, clear, move, upgrade, link, and staff rooms.
4. On an ordinary day, choose a Normal Hero Raid or Elite Expedition.
5. Begin Battle, then Start Raid.
6. End turns while invaders enter, path through the dungeon, fight defenders, trigger traps, and pressure the Core.
7. Resolve rewards, evolution progress, quests, escalation progress, and Core damage.
8. Advance to the next day and repeat.

Special days override the ordinary choice:

- Days divisible by 5 but not 10 force an Escalation Raid.
- Days divisible by 10 open the Council of the Dungeonlords.
- Repeated Council declines can schedule a punitive Council retaliation.

## Dungeon Rules

### Board

- The board is an `8 x 8` orthogonal grid.
- The starting layout contains:
  - Entrance at `(1,1)`
  - Training Den at `(2,1)`
  - Core at `(3,1)`
- The Entrance is fixed.
- The Core and rooms can be moved during valid Build-phase move operations.
- A valid dungeon requires every active entrance to reach the Core through traversable rooms.

### Traversable and non-traversable tiles

Traversable path tiles:

- Entrance
- Core
- Trap rooms
- Monster rooms
- Active Ash Breaches

Non-traversable tiles:

- Utility rooms
- Empty/unexcavated tiles

Utility rooms influence nearby rooms through auras but do not form part of invader paths.

### Dungeon level and room cap

- Dungeon Level is capped at `10`.
- The implemented room-cap formula is:

  `4 + ((Dungeon Level - 1) * 2) + permanent room-cap bonuses`

- This currently yields `22` buildable rooms at Level 10 before permanent bonuses.
- This differs from an earlier design target of `35` occupied tiles at Level 10 and remains an explicit design question. See [BUGS.md](BUGS.md) and [DECISIONS.md](DECISIONS.md).

### Room families

The current authored catalog contains:

- 13 traps
- 11 monster rooms
- 13 utility rooms
- 37 buildable room definitions total

Rooms can have tiers, stars, readiness, capacity, combat effects, permanent placement effects, or utility influence depending on family.

## Links and Auras

Links and auras are separate systems.

### Room links

- Only the authored Blood, Ward, and Hunt rooms participate.
- A participating room is Linked when at least one orthogonally adjacent participating room has the same tag.
- One matching neighbor is sufficient.
- Link bonuses do not stack from multiple matching neighbors.
- Link state is computed from the current grid and is not persisted separately.

### Utility auras

- Utility rooms influence tiles within their authored range.
- An affected tile can report an aura even when neither room is Linked.
- Existing utility rooms without a Blood, Ward, or Hunt tag can provide auras but cannot create links.

## Monsters

The current catalog contains:

- 62 standard recruitable monsters
- 6 Flesh Market unique monsters
- 7 fusion archetypes

Monsters can have:

- race/profile identity
- class
- affinity
- stars
- evolution stage
- stats and current HP
- passives and passive ranks
- statuses
- unique or fused flags
- permanent room-placement bonuses

### Staffing

- Staffing is Build-phase only.
- The player chooses which inventory monster to place.
- Monsters can be returned individually or by withdrawing the full room.
- Direct room-to-room transfer is intentionally a two-step return-and-place operation.
- Current entity state is retained when withdrawn.
- Permanent Training Den and Thick Hide-style placement bonuses remain baked into the monster.
- Stable Hooks heals withdrawn monsters to full.

### Fusion

- Fusion uses exactly two eligible inventory monsters.
- Deployed, Unique, and already-fused monsters are not valid v1 ingredients.
- Fusion is archetype-based, not exact-pair authored.
- The primary parent supplies the body/name base.
- The secondary parent supplies recipe bias, stat contribution, and one inherited trait.
- The result preserves the higher eligible star and evolution stage.
- Fused monsters retain a visible fused identity and are non-sacrificable in the current rules.

## Combat

Combat remains:

- turn-based
- room-local
- resolved on the dungeon grid
- integrated into ordinary raid turns

There is no separate battle screen.

Implemented combat depth includes:

- SPD-based action ordering
- ATK, DEF, HP, and shields/Guard
- statuses including Poison, Burn, Weaken, Slow, Guard, Marked, and related authored effects
- monster roles, classes, passives, room effects, utility effects, artifacts, doctrines, and raid modifiers
- trap charges, cooldowns, stars, ranks, and automatic raid-start reset
- compact radar pings on monster rooms for heroes and monsters

Persistent Core damage is intentional long-term pressure. There is no ordinary Core repair action. Core Doctrine can increase maximum HP and add the resulting amount to current HP when upgraded.

## Raids

### Ordinary invasion choice

Most Build days present two stable choices:

- **Normal Hero Raid**
  - baseline party and rewards
  - one expedition order
  - no guaranteed leader
- **Elite Expedition**
  - smaller but stronger force
  - guaranteed named leader trait
  - `x1.3` base kill rewards
  - `+1 Evolution` on clear

The selected choice can be changed until Battle begins.

### Escalation Raids

- Forced on Days 5, 15, 25, and so on.
- Council days override escalation on Days 10, 20, 30, and so on.
- The escalation level advances only after a successful Escalation clear.
- Escalations use elite-style identity, stronger scaling, a guaranteed leader trait, larger parties, reward multipliers, and an Evolution clear bonus.

### Expedition identity

The current hero-side catalog contains:

- 4 expedition orders
- 8 standard hero profiles
- 5 elite leader traits
- 5 behavior archetypes
- 4 raid directives

Orders:

- Iron Crusade
- Veiled Rangers
- Rift Collegium
- Grave Wardens

Invaders use short-term objectives, raid-local shared intel, danger memory, role preferences, and anti-loop pathing. Council retaliations remain monster-faction raids rather than standard hero parties.

### Reward multiplier boundary

Raid multipliers apply to base hero-kill Essence and Soulshards. They do not multiply artifact bonuses, Ash Tribute, Soul Altar, room-link bonuses, or Council rewards.

## Council of the Dungeonlords

- Council convenes every 10 days.
- The player can attend or decline.
- Attendance changes favor and opens sponsor decisions.
- The player concludes Council to advance to the next Build day.
- Repeated declines can create punitive retaliation raids.

### Favor

Favor is stored per Dungeonlord and clamped to `-6...+6`.

Bands:

- Hostile: `-6...-4`
- Wary: `-3...-1`
- Neutral: `0...+1`
- Favored: `+2...+4`
- Allied: `+5...+6`

Favor controls boon and contract access. Allied sponsors improve banded rewards by one reward band. Favor drifts one point toward neutral when a new Council convenes, and rivalries create one-point opposite spillover.

### Nihaza and Ash Breaches

Matriarch Nihaza represents Extinction and structural pressure.

- Ash Tribute grants `+3 Essence` per hero death until the next Council.
- Standard Defiance of Extinction opens 1 temporary Ash Breach.
- Hard Defiance of Extinction opens 2 temporary Ash Breaches.
- Breaches spawn on valid edge tiles within Manhattan distance 2 of a trap or monster room.
- Utility rooms do not qualify as placement anchors.
- Every active entrance must remain connected to the Core.
- Two successful connected raids complete the trial.
- Breaches collapse immediately on success.
- Failure at the next Council collapses the breaches and applies `-25` Core maximum HP until the following Council.

Nihaza is currently part of the normal Council pool. A later-stage encounter gate has been proposed but is not implemented.

## Economy and Progression

Currencies:

- **Essence:** rooms, dungeon upgrades, artifacts, and infrastructure
- **Soulshards:** monster recruitment, artifacts, and roster pressure
- **Evolution:** monster evolution and progression choices
- **Dominion:** tactical battle powers
- **Darkcrystals:** Core Doctrine and Flesh Market leverage

The Shady Dealer uses a finite standard-artifact catalog:

- 33 standard artifacts
- 5 Flesh Market unique artifacts
- per-artifact unlock days
- per-artifact copy caps
- 4 standard daily offers, with Black Satchel increasing stock to 5

Doctrines provide four long-run branches:

- Trap
- Monster
- Utility
- Core

## Player Experience Principles

- The grid should remain the visual anchor.
- Build information belongs near the dungeon; deep management belongs in hamburger panels.
- Desktop and wide tablets use a fixed-height shell with internally scrollable side rails.
- Phones use a stacked flow with a thumb-friendly action rail.
- Important state must have a readable fallback if art fails to load.
- The first-run experience uses contextual guidance and a PDF guidebook rather than a separate scripted tutorial mode.
- Major content additions are paused during the private-alpha readiness period.
