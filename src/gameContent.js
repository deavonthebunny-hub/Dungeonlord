export const HERO_ARCHETYPE_RULES = {
  zealot: {
    key: "zealot",
    name: "Zealot",
    desc: "Prioritizes the shortest push toward the Core.",
    weights: { core: 7, lure: 0.6, danger: 1.1, trap: 0.2, monster: 0.3, utility: -0.4, backtrack: 5.5 },
    intent: "Rush the Core",
  },
  cautious: {
    key: "cautious",
    name: "Cautious",
    desc: "Avoids lethal rooms and remembers danger.",
    weights: { core: 4.5, lure: 0.9, danger: 2.9, trap: -1.6, monster: -1.1, utility: -0.2, backtrack: 6.5 },
    intent: "Avoid danger",
  },
  scout: {
    key: "scout",
    name: "Scout",
    desc: "Investigates side branches and lure paths.",
    weights: { core: 3.3, lure: 2.8, danger: 1.4, trap: 0.3, monster: 0.7, utility: 0.3, backtrack: 4.5 },
    intent: "Probe side routes",
  },
  breaker: {
    key: "breaker",
    name: "Breaker",
    desc: "Targets monster rooms to clear resistance before pushing on.",
    weights: { core: 4.2, lure: 1.6, danger: 1.6, trap: -0.3, monster: 2.6, utility: -0.2, backtrack: 5.2 },
    intent: "Break defenders",
  },
  purifier: {
    key: "purifier",
    name: "Purifier",
    desc: "Seeks trap and utility nodes to dismantle the dungeon's support.",
    weights: { core: 4.1, lure: 1.9, danger: 1.7, trap: 2.4, monster: 0.6, utility: 1.8, backtrack: 5.4 },
    intent: "Purge support rooms",
  },
};

export const RAID_TYPE_META = {
  normal: {
    key: "normal",
    label: "Hero Raid",
    desc: "A standard adventuring party probes the dungeon.",
  },
  elite: {
    key: "elite",
    label: "Elite Expedition",
    desc: "Disciplined heroes strike with better gear and clearer intent.",
  },
  council: {
    key: "council",
    label: "Council Retaliation",
    desc: "A rival Dungeonlord sends their own creations to punish your absence.",
  },
};

export const COUNCIL_RAID_FACTIONS = {
  malachar: {
    key: "malachar",
    raidName: "Tyrant Host",
    desc: "Disciplined enforcers who press the core relentlessly.",
    monsterPool: ["hobgoblin", "duergar", "dullahan", "orc", "bugbear"],
    classPool: ["Warrior", "Tank", "Warden", "Knight"],
    passiveBias: ["bulwark", "warding", "cruelty"],
    statBias: { hp: 1.15, atk: 1.05, def: 1 },
    archetypes: ["zealot", "breaker"],
    raidModifier: "Presses the main route and punishes weak front lines.",
  },
  "crimson-twins": {
    key: "crimson-twins",
    raidName: "Crimson Masque",
    desc: "Fast, theatrical killers who love flank paths and pain.",
    monsterPool: ["drow", "harpy", "vampire", "imp", "deepSpider"],
    classPool: ["Rogue", "Stalker", "Warlock", "Ranger"],
    passiveBias: ["swift", "cruelty", "dread-howl"],
    statBias: { hp: 0.95, atk: 1.15, def: 0.9 },
    archetypes: ["scout", "purifier"],
    raidModifier: "Favours detours and side pressure over direct force.",
  },
  zephyra: {
    key: "zephyra",
    raidName: "Riftbound Conclave",
    desc: "Void-tainted casters with volatile spellcraft.",
    monsterPool: ["wraith", "specter", "lich", "elemental", "caveNaga"],
    classPool: ["Mage", "Hexer", "Warlock", "Seer"],
    passiveBias: ["hex", "venom-aura", "mender"],
    statBias: { hp: 1, atk: 1.2, def: 0.9 },
    archetypes: ["purifier", "scout"],
    raidModifier: "Hits support rooms and inflicts layered debuffs.",
  },
  grimjaw: {
    key: "grimjaw",
    raidName: "Iron Pact Vanguard",
    desc: "Heavy raiders who value honorable frontal assaults.",
    monsterPool: ["ogre", "duergar", "animatedArmor", "gargoyle", "minotaur"],
    classPool: ["Tank", "Warrior", "Warden", "Knight"],
    passiveBias: ["bulwark", "ironhide", "warding"],
    statBias: { hp: 1.2, atk: 1, def: 1.1 },
    archetypes: ["zealot", "cautious"],
    raidModifier: "Hard to kill and difficult to dislodge from the core path.",
  },
  blackthorn: {
    key: "blackthorn",
    raidName: "Serpent Cabal",
    desc: "Manipulators and skirmishers who exploit weak angles.",
    monsterPool: ["drow", "gremlin", "kobold", "gnoll", "imp"],
    classPool: ["Rogue", "Ranger", "Hexer", "Stalker"],
    passiveBias: ["hex", "swift", "mender"],
    statBias: { hp: 0.95, atk: 1.1, def: 1 },
    archetypes: ["scout", "breaker"],
    raidModifier: "Prefers split pressure and exploitable weak rooms.",
  },
  lyralei: {
    key: "lyralei",
    raidName: "Veiled Archive",
    desc: "Patient infiltrators guided by old knowledge.",
    monsterPool: ["specter", "mimic", "spiderkin", "drow", "deepSpider"],
    classPool: ["Hexer", "Rogue", "Seer", "Ranger"],
    passiveBias: ["hex", "mender", "swift"],
    statBias: { hp: 1, atk: 1.05, def: 1 },
    archetypes: ["cautious", "purifier"],
    raidModifier: "Avoids the worst killboxes and seeks information-rich routes.",
  },
  maltheron: {
    key: "maltheron",
    raidName: "Fleshforged Procession",
    desc: "Warped brutes and stitched horrors pushing with raw body mass.",
    monsterPool: ["ogre", "troll", "mummy", "zombie", "chimera"],
    classPool: ["Brute", "Tank", "Marauder", "Warrior"],
    passiveBias: ["leech", "savage", "bloodcall"],
    statBias: { hp: 1.2, atk: 1.1, def: 0.95 },
    archetypes: ["breaker", "zealot"],
    raidModifier: "Heavy sustain and brutal room-clearing pressure.",
  },
  vexira: {
    key: "vexira",
    raidName: "Toxblood Swarm",
    desc: "Venomous packs built to make every tile expensive.",
    monsterPool: ["sporeling", "myconid", "gnoll", "hellhound", "specter"],
    classPool: ["Hexer", "Skirmisher", "Ranger", "Marauder"],
    passiveBias: ["venom-aura", "rot-cloud", "cruelty"],
    statBias: { hp: 1, atk: 1.12, def: 0.95 },
    archetypes: ["purifier", "scout"],
    raidModifier: "Attrition pressure rises with every exchange.",
  },
  tharos: {
    key: "tharos",
    raidName: "Black Veil Knives",
    desc: "Silent killers who prefer weak side corridors and support rooms.",
    monsterPool: ["deepSpider", "drow", "gremlin", "wraith", "batSwarm"],
    classPool: ["Rogue", "Stalker", "Ranger", "Reaper"],
    passiveBias: ["swift", "cruelty", "dread-howl"],
    statBias: { hp: 0.92, atk: 1.15, def: 0.95 },
    archetypes: ["scout", "purifier"],
    raidModifier: "Assassin-minded raiders hunt backline utility and trap hubs.",
  },
  xaldros: {
    key: "xaldros",
    raidName: "Hall of Mirrors",
    desc: "Illusory raiders who behave erratically but with purpose.",
    monsterPool: ["specter", "wraith", "imp", "mimic", "nightmare"],
    classPool: ["Hexer", "Warlock", "Rogue", "Seer"],
    passiveBias: ["dread-howl", "hex", "swift"],
    statBias: { hp: 0.98, atk: 1.1, def: 0.95 },
    archetypes: ["scout", "cautious"],
    raidModifier: "Unpredictable routeing that still converges on weak points.",
  },
  zurkhan: {
    key: "zurkhan",
    raidName: "Beast Tyrant Stampede",
    desc: "Savage packs that force direct fights.",
    monsterPool: ["hellhound", "direBoar", "bonehound", "werewolf", "harpy"],
    classPool: ["Brute", "Skirmisher", "Marauder", "Warrior"],
    passiveBias: ["savage", "packleader", "leech"],
    statBias: { hp: 1.08, atk: 1.16, def: 0.92 },
    archetypes: ["zealot", "breaker"],
    raidModifier: "Fast beasts collapse on front-line rooms and force trades.",
  },
  nihaza: {
    key: "nihaza",
    raidName: "Ashen Catacomb",
    desc: "Silent doom-bearers who turn every push into attrition.",
    monsterPool: ["mummy", "wraith", "nightmare", "dullahan", "gargoyle"],
    classPool: ["Tank", "Hexer", "Warrior", "Warden"],
    passiveBias: ["rot-cloud", "bulwark", "dread-howl"],
    statBias: { hp: 1.12, atk: 1.08, def: 1.02 },
    archetypes: ["cautious", "purifier"],
    raidModifier: "Slow, relentless, and punishing to fragmented layouts.",
  },
};

export const COUNCIL_SPONSOR_CONTENT = {
  malachar: {
    boon: {
      key: "tyrants-levy",
      title: "Tyrant's Levy",
      desc: "Gain Essence to fortify your defenses.",
      reward: { type: "essence", bands: [80, 130, 180] },
      raidEffect: {
        key: "tyrants-levy",
        label: "Tyrant's Levy",
        desc: "Next raid party size -1 and invader ATK -10%.",
        partySizeDelta: -1,
        atkMult: 0.9,
      },
    },
    quests: {
      standard: {
        id: "no-breach-standard",
        title: "No Breach",
        desc: "Finish 1 raid with 0 Core damage before the next Council.",
        metricKey: "zeroCoreDamageRaidCount",
        goalBands: [1, 1, 1],
        reward: { type: "essence", bands: [120, 180, 260] },
      },
      hard: {
        id: "no-breach-hard",
        title: "No Breach",
        desc: "Finish 2 raids with 0 Core damage before the next Council.",
        metricKey: "zeroCoreDamageRaidCount",
        goalBands: [2, 2, 2],
        reward: { type: "essence", bands: [180, 260, 350] },
      },
    },
  },
  "crimson-twins": {
    boon: {
      key: "scarlet-patronage",
      title: "Scarlet Patronage",
      desc: "A flanker slips into your service.",
      reward: { type: "monster", count: 1, monsterPool: ["drow", "harpy", "imp", "deepSpider", "vampire"] },
      raidEffect: {
        key: "scarlet-patronage",
        label: "Scarlet Patronage",
        desc: "Next raid is easier to lure into side paths.",
        lureBoost: 2,
      },
    },
    quests: {
      standard: {
        id: "stage-the-slaughter-standard",
        title: "Stage the Slaughter",
        desc: "Kill heroes with traps before the next Council.",
        metricKey: "trapKillCount",
        goalBands: [2, 3, 4],
        reward: { type: "soulshards", bands: [25, 40, 60] },
      },
      hard: {
        id: "stage-the-slaughter-hard",
        title: "Stage the Slaughter",
        desc: "Kill more heroes with traps before the next Council.",
        metricKey: "trapKillCount",
        goalBands: [3, 5, 7],
        reward: { type: "soulshards", bands: [35, 55, 80] },
      },
    },
  },
  zephyra: {
    boon: {
      key: "dominion-charter",
      title: "Dominion Charter",
      desc: "The Riftmind grants controlled Dominion power.",
      reward: { type: "dominion", amount: 1 },
      raidEffect: {
        key: "dominion-charter",
        label: "Dominion Charter",
        desc: "Next raid reveals +1 invader and is easier to lure off the core route.",
        scoutRevealBonus: 1,
        lureBoost: 1,
      },
    },
    quests: {
      standard: {
        id: "forbidden-growth-standard",
        title: "Forbidden Growth",
        desc: "Evolve 1 monster before the next Council.",
        metricKey: "monsterEvolutionCount",
        goalBands: [1, 1, 1],
        reward: { type: "evolution", bands: [4, 6, 8] },
      },
      hard: {
        id: "forbidden-growth-hard",
        title: "Forbidden Growth",
        desc: "Spend 30 Evolution before the next Council.",
        metricKey: "evolutionSpentSinceCouncil",
        goalBands: [30, 30, 30],
        reward: { type: "evolution", bands: [7, 10, 14] },
      },
    },
  },
  grimjaw: {
    boon: {
      key: "iron-oath",
      title: "Iron Oath",
      desc: "Grimjaw fortifies the Core for the next assault.",
      reward: null,
      raidEffect: {
        key: "iron-oath",
        label: "Iron Oath",
        desc: "Next raid starts with +15 Core Shield and Core retaliation +2.",
        coreShieldBonus: 15,
        coreRetaliationBonus: 2,
      },
    },
    quests: {
      standard: {
        id: "hold-the-line-standard",
        title: "Hold the Line",
        desc: "Survive 2 raids before the next Council.",
        metricKey: "survivedRaidCount",
        goalBands: [2, 2, 2],
        reward: { type: "darkcrystals", bands: [3, 5, 7] },
      },
      hard: {
        id: "hold-the-line-hard",
        title: "Hold the Line",
        desc: "Survive 2 raids with Core HP at or above 80%.",
        metricKey: "highCoreRaidCount",
        goalBands: [2, 2, 2],
        reward: { type: "darkcrystals", bands: [5, 8, 11] },
      },
    },
  },
  blackthorn: {
    boon: {
      key: "black-ledger",
      title: "Black Ledger",
      desc: "Blackthorn converts influence into hard currency.",
      reward: { type: "soulshards", bands: [18, 30, 45] },
      raidEffect: {
        key: "black-ledger",
        label: "Black Ledger",
        desc: "Next raid rolls one star step lower.",
        starBias: -1,
      },
    },
    quests: {
      standard: {
        id: "black-audit-standard",
        title: "Black Audit",
        desc: "Gain Soulshards before the next Council.",
        metricKey: "soulshardsEarnedSinceCouncil",
        goalBands: [30, 60, 90],
        reward: { type: "essence", bands: [120, 180, 260] },
      },
      hard: {
        id: "black-audit-hard",
        title: "Black Audit",
        desc: "Gain even more Soulshards before the next Council.",
        metricKey: "soulshardsEarnedSinceCouncil",
        goalBands: [45, 75, 110],
        reward: { type: "essence", bands: [180, 260, 350] },
      },
    },
  },
  lyralei: {
    boon: {
      key: "veiled-briefing",
      title: "Veiled Briefing",
      desc: "Lyralei shares a deep scout report.",
      reward: null,
      raidEffect: {
        key: "veiled-briefing",
        label: "Veiled Briefing",
        desc: "Next raid reveals +3 invaders and party size -1.",
        scoutRevealBonus: 3,
        partySizeDelta: -1,
      },
    },
    quests: {
      standard: {
        id: "eyes-in-the-dark-standard",
        title: "Eyes in the Dark",
        desc: "Reveal invaders before the next Council.",
        metricKey: "revealedInvaderCount",
        goalBands: [3, 5, 7],
        reward: { type: "evolution", bands: [4, 6, 8] },
      },
      hard: {
        id: "eyes-in-the-dark-hard",
        title: "Eyes in the Dark",
        desc: "Reveal even more invaders before the next Council.",
        metricKey: "revealedInvaderCount",
        goalBands: [5, 7, 9],
        reward: { type: "evolution", bands: [7, 10, 14] },
      },
    },
  },
  maltheron: {
    boon: {
      key: "flesh-market-license",
      title: "Flesh Market License",
      desc: "Maltheron opens the Flesh Market until the next Council.",
      reward: null,
      marketAccess: true,
      raidEffect: null,
    },
    quests: {
      standard: {
        id: "fresh-stock-standard",
        title: "Fresh Stock",
        desc: "Sacrifice monsters before the next Council.",
        metricKey: "monsterSacrificeCount",
        goalBands: [2, 3, 4],
        reward: { type: "darkcrystals", bands: [4, 6, 8] },
      },
      hard: {
        id: "vault-of-meat-hard",
        title: "Vault of Meat",
        desc: "Earn Darkcrystals before the next Council.",
        metricKey: "darkcrystalsEarnedSinceCouncil",
        goalBands: [12, 18, 24],
        reward: { type: "darkcrystals", bands: [7, 10, 14] },
      },
    },
  },
  vexira: {
    boon: {
      key: "caustic-stockpile",
      title: "Caustic Stockpile",
      desc: "Vexira poisons your kill-zone for the next raid.",
      reward: null,
      raidEffect: {
        key: "caustic-stockpile",
        label: "Caustic Stockpile",
        desc: "Next raid traps deal +20% damage.",
        trapDamageMult: 0.2,
      },
    },
    quests: {
      standard: {
        id: "slow-death-standard",
        title: "Slow Death",
        desc: "Kill poisoned or trap-damaged heroes before the next Council.",
        metricKey: "trapOrPoisonKillCount",
        goalBands: [3, 5, 7],
        reward: { type: "essence", bands: [120, 180, 260] },
      },
      hard: {
        id: "slow-death-hard",
        title: "Slow Death",
        desc: "Kill more poisoned or trap-damaged heroes before the next Council.",
        metricKey: "trapOrPoisonKillCount",
        goalBands: [4, 6, 8],
        reward: { type: "essence", bands: [180, 260, 350] },
      },
    },
  },
  tharos: {
    boon: {
      key: "assassins-ledger",
      title: "Assassin's Ledger",
      desc: "Tharos marks the next raid's leader for death.",
      reward: null,
      raidEffect: {
        key: "assassins-ledger",
        label: "Assassin's Ledger",
        desc: "Next raid reveals +2 invaders, and the highest-star invader starts at -20% HP.",
        scoutRevealBonus: 2,
        leaderHpMult: 0.8,
      },
    },
    quests: {
      standard: {
        id: "cut-the-leader-standard",
        title: "Cut the Leader",
        desc: "Kill the highest-star invader in 1 raid before the next Council.",
        metricKey: "highestStarLeaderKillCount",
        goalBands: [1, 1, 1],
        reward: { type: "soulshards", bands: [25, 40, 60] },
      },
      hard: {
        id: "cut-the-leader-hard",
        title: "Cut the Leader",
        desc: "Kill the highest-star invader in 2 raids before the next Council.",
        metricKey: "highestStarLeaderKillCount",
        goalBands: [2, 2, 2],
        reward: { type: "soulshards", bands: [35, 55, 80] },
      },
    },
  },
  xaldros: {
    boon: {
      key: "hall-of-mirrors",
      title: "Hall of Mirrors",
      desc: "Xaldros muddies the invaders' intent.",
      reward: null,
      raidEffect: {
        key: "hall-of-mirrors",
        label: "Hall of Mirrors",
        desc: "Next raid rolls one star step lower and is slightly easier to lure away from the core route.",
        starBias: -1,
        lureBoost: 1,
      },
    },
    quests: {
      standard: {
        id: "lead-them-astray-standard",
        title: "Lead Them Astray",
        desc: "Force detours before the next Council.",
        metricKey: "detourCount",
        goalBands: [4, 6, 8],
        reward: { type: "evolution", bands: [4, 6, 8] },
      },
      hard: {
        id: "lead-them-astray-hard",
        title: "Lead Them Astray",
        desc: "Force many detours before the next Council.",
        metricKey: "detourCount",
        goalBands: [6, 8, 10],
        reward: { type: "evolution", bands: [7, 10, 14] },
      },
    },
  },
  zurkhan: {
    boon: {
      key: "beast-draft",
      title: "Beast Draft",
      desc: "Zurkhan sends one of his war-beasts to join the dungeon.",
      reward: { type: "monster", count: 1, monsterPool: ["hellhound", "direBoar", "bonehound", "werewolf", "harpy"] },
      raidEffect: null,
    },
    quests: {
      standard: {
        id: "trial-of-fangs-standard",
        title: "Trial of Fangs",
        desc: "Kill heroes inside monster rooms, not by traps.",
        metricKey: "monsterRoomKillCount",
        goalBands: [4, 6, 8],
        reward: { type: "soulshards", bands: [25, 40, 60] },
      },
      hard: {
        id: "trial-of-fangs-hard",
        title: "Trial of Fangs",
        desc: "Kill more heroes inside monster rooms, not by traps.",
        metricKey: "monsterRoomKillCount",
        goalBands: [6, 8, 10],
        reward: { type: "soulshards", bands: [35, 55, 80] },
      },
    },
  },
  nihaza: {
    boon: {
      key: "ash-tribute",
      title: "Ash Tribute",
      desc: "Until the next Council, every hero death feeds the cinders of extinction.",
      reward: { type: "ash-tribute", amount: 3 },
      raidEffect: null,
    },
    quests: {
      standard: {
        id: "defiance-of-extinction-standard",
        title: "Defiance of Extinction",
        desc: "Nihaza opens 1 Ash Breach. Complete 2 raids while every active entrance remains connected to the Core.",
        questType: "ash-breach-trial",
        breachCount: 1,
        goalBands: [2, 2, 2],
        reward: { type: "monster-room-cap-bonus", amount: 1 },
        failurePenalty: "Failing the trial curses the Core: -25 max HP until the following Council.",
      },
      hard: {
        id: "defiance-of-extinction-hard",
        title: "Defiance of Extinction - Unforgiving",
        desc: "Nihaza opens 2 Ash Breaches. Complete 2 raids while every active entrance remains connected to the Core.",
        questType: "ash-breach-trial",
        breachCount: 2,
        goalBands: [2, 2, 2],
        reward: { type: "room-cap-bonus", amount: 1 },
        failurePenalty: "Failing the trial curses the Core: -25 max HP until the following Council.",
      },
    },
  },
};

export const FLESH_MARKET_UNIQUE_MONSTERS = [
  {
    key: "patchmaw-chimera",
    name: "Patchmaw Chimera",
    race: "Beast",
    class: "Brute",
    icon: "PC",
    passiveKeys: ["savage", "leech"],
    passiveRanks: { savage: 1, leech: 1 },
    starByEra: [3, 4, 5],
    costByEra: [16, 24, 34],
    baseStats: { hp: 14, atk: 6, def: 2 },
    desc: "A stitched predator that mauls and feeds on the weak.",
  },
  {
    key: "stitchwitch-huldra",
    name: "Stitchwitch Huldra",
    race: "Abomination",
    class: "Hexer",
    icon: "SH",
    passiveKeys: ["hex", "mender"],
    passiveRanks: { hex: 1, mender: 1 },
    starByEra: [3, 4, 5],
    costByEra: [18, 26, 36],
    baseStats: { hp: 12, atk: 6, def: 2 },
    desc: "A fleshweaver who curses intruders and tends her creations.",
  },
  {
    key: "graft-knight",
    name: "Graft Knight",
    race: "Abomination",
    class: "Warden",
    icon: "GK",
    passiveKeys: ["bulwark", "warding"],
    passiveRanks: { bulwark: 1, warding: 1 },
    starByEra: [3, 4, 5],
    costByEra: [18, 28, 38],
    baseStats: { hp: 16, atk: 5, def: 3 },
    desc: "A plated horror built to anchor the front line.",
  },
  {
    key: "carrion-saint",
    name: "Carrion Saint",
    race: "Undead",
    class: "Warlock",
    icon: "CS",
    passiveKeys: ["rot-cloud", "bloodcall"],
    passiveRanks: { "rot-cloud": 1, bloodcall: 1 },
    starByEra: [3, 4, 5],
    costByEra: [17, 25, 35],
    baseStats: { hp: 13, atk: 6, def: 2 },
    desc: "A grave-born preacher who rots the living and restores the damned.",
  },
  {
    key: "razorwing-matron",
    name: "Razorwing Matron",
    race: "Beast",
    class: "Stalker",
    icon: "RM",
    passiveKeys: ["swift", "cruelty"],
    passiveRanks: { swift: 1, cruelty: 1 },
    starByEra: [3, 4, 5],
    costByEra: [16, 24, 34],
    baseStats: { hp: 12, atk: 7, def: 1 },
    desc: "A circling huntress that finishes off wounded prey.",
  },
  {
    key: "vatborn-alpha",
    name: "Vatborn Alpha",
    race: "Abomination",
    class: "Packlord",
    icon: "VA",
    passiveKeys: ["packleader", "ironhide"],
    passiveRanks: { packleader: 1, ironhide: 1 },
    starByEra: [3, 4, 5],
    costByEra: [19, 28, 40],
    baseStats: { hp: 15, atk: 6, def: 2 },
    desc: "An engineered packmaster grown for coordinated slaughter.",
  },
];

export const STANDARD_ARTIFACTS = [
  {
    key: "graven-coin",
    name: "Graven Coin",
    desc: "+2 Essence on hero death.",
    cost: { currency: "soulshards", amount: 20 },
    tags: ["economy"],
    maxCopies: 2,
    unlockDay: 1,
    mods: { essenceOnKill: 2 },
  },
  {
    key: "shard-prism",
    name: "Shard Prism",
    desc: "+1 Soulshard on hero death.",
    cost: { currency: "soulshards", amount: 18 },
    tags: ["economy"],
    maxCopies: 2,
    unlockDay: 1,
    mods: { soulshardOnKill: 1 },
  },
  {
    key: "rage-brand",
    name: "Rage Brand",
    desc: "Monsters gain +1 ATK.",
    cost: { currency: "essence", amount: 25 },
    tags: ["monster"],
    maxCopies: 2,
    unlockDay: 1,
    mods: { monsterAtk: 1 },
  },
  {
    key: "wicked-gears",
    name: "Wicked Gears",
    desc: "Traps deal +15% damage.",
    cost: { currency: "essence", amount: 20 },
    tags: ["trap"],
    maxCopies: 2,
    unlockDay: 1,
    mods: { trapMult: 0.15 },
  },
  {
    key: "dread-veil",
    name: "Dread Veil",
    desc: "Core takes -1 damage from hero hits (min 1).",
    cost: { currency: "soulshards", amount: 30 },
    tags: ["core"],
    maxCopies: 2,
    unlockDay: 1,
    mods: { coreDamageReduction: 1 },
  },
  {
    key: "cinder-chain",
    name: "Cinder Chain",
    desc: "Traps deal +1 flat damage.",
    cost: { currency: "essence", amount: 22 },
    tags: ["trap"],
    maxCopies: 2,
    unlockDay: 6,
    mods: { trapFlatDamage: 1 },
  },
  {
    key: "warden-spikes",
    name: "Warden Spikes",
    desc: "Core retaliation deals +1 damage.",
    cost: { currency: "soulshards", amount: 24 },
    tags: ["core"],
    maxCopies: 2,
    unlockDay: 6,
    mods: { coreRetaliationBonus: 1 },
  },
  {
    key: "iron-kennel-sigil",
    name: "Iron Kennel Sigil",
    desc: "Monsters gain +1 DEF.",
    cost: { currency: "essence", amount: 24 },
    tags: ["monster"],
    maxCopies: 2,
    unlockDay: 8,
    mods: { monsterDef: 1 },
  },
  {
    key: "scout-lens",
    name: "Scout Lens",
    desc: "Reveal +1 invader at battle start.",
    cost: { currency: "soulshards", amount: 20 },
    tags: ["scouting"],
    maxCopies: 2,
    unlockDay: 8,
    mods: { scoutRevealBonus: 1 },
  },
  {
    key: "clockwork-magazine",
    name: "Clockwork Magazine",
    desc: "Armed traps start each raid with +1 charge.",
    cost: { currency: "essence", amount: 28 },
    tags: ["trap"],
    maxCopies: 1,
    unlockDay: 12,
    mods: { trapChargeBonus: 1 },
  },
  {
    key: "beast-lash",
    name: "Beast Lash",
    desc: "Monster rooms gain +1 capacity.",
    cost: { currency: "essence", amount: 34 },
    tags: ["room"],
    maxCopies: 1,
    unlockDay: 14,
    mods: { monsterRoomCapBonus: 1 },
  },
  {
    key: "soul-sluice",
    name: "Soul Sluice",
    desc: "Trap kills grant +2 Essence.",
    cost: { currency: "soulshards", amount: 22 },
    tags: ["economy", "trap"],
    maxCopies: 2,
    unlockDay: 14,
    mods: { trapKillEssence: 2 },
  },
  {
    key: "ashen-mortar",
    name: "Ashen Mortar",
    desc: "Utility rooms count as +1 effective tier.",
    cost: { currency: "soulshards", amount: 30 },
    tags: ["utility"],
    maxCopies: 1,
    unlockDay: 18,
    mods: { utilityPotencyBonus: 1 },
  },
  {
    key: "stable-hooks",
    name: "Stable Hooks",
    desc: "Returning a monster from a room heals it to full.",
    cost: { currency: "soulshards", amount: 26 },
    tags: ["management"],
    maxCopies: 1,
    unlockDay: 18,
    mods: { roomWithdrawHealFull: 1 },
  },
  {
    key: "black-satchel",
    name: "Black Satchel",
    desc: "Shady Dealer offers +1 extra artifact each day.",
    cost: { currency: "essence", amount: 28 },
    tags: ["shop", "economy"],
    maxCopies: 1,
    unlockDay: 18,
    mods: { shadyStockBonus: 1 },
  },
];

export const FLESH_MARKET_UNIQUE_ARTIFACTS = [
  {
    key: "cadaver-ledger",
    name: "Cadaver Ledger",
    desc: "Sacrifices grant +2 bonus Darkcrystals.",
    costByEra: [12, 18, 24],
    mods: { sacrificeBonusDarkcrystals: 2 },
  },
  {
    key: "grafted-standard",
    name: "Grafted Standard",
    desc: "Monsters with 2+ passives gain +1 ATK.",
    costByEra: [14, 20, 28],
    mods: { multiPassiveAtkBonus: 1 },
  },
  {
    key: "preserved-heart",
    name: "Preserved Heart",
    desc: "Core starts each raid with +8 Shield.",
    costByEra: [14, 22, 30],
    mods: { coreStartShield: 8 },
  },
  {
    key: "vivisection-tools",
    name: "Vivisection Tools",
    desc: "Trap-damaged heroes take +1 extra damage from monsters.",
    costByEra: [13, 19, 27],
    mods: { trapDamageVulnerability: 1 },
  },
  {
    key: "vatglass-lantern",
    name: "Vatglass Lantern",
    desc: "Newly bought Unique monsters gain +4 Max HP.",
    costByEra: [12, 18, 24],
    mods: { uniqueMonsterHpOnBuy: 4 },
  },
];

export const DOCTRINE_RULES = {
  trap: {
    key: "trap",
    name: "Trap Doctrine",
    currency: "essence",
    levels: [
      { cost: 35, desc: "+2 trap damage." },
      { cost: 80, desc: "+1 trap charge on reset." },
      { cost: 140, desc: "-1 trap cooldown after triggering." },
    ],
  },
  monster: {
    key: "monster",
    name: "Monster Doctrine",
    currency: "soulshards",
    levels: [
      { cost: 40, desc: "+1 ATK to defending monsters." },
      { cost: 90, desc: "+3 Max HP to defending monsters." },
      { cost: 150, desc: "+1 monster room capacity." },
    ],
  },
  utility: {
    key: "utility",
    name: "Utility Doctrine",
    currency: "evolution",
    levels: [
      { cost: 12, desc: "+1 potency to utility room effects." },
      { cost: 28, desc: "Utility rooms extend lure value and scouting." },
      { cost: 50, desc: "+1 additional potency to utility room effects." },
    ],
  },
  core: {
    key: "core",
    name: "Core Doctrine",
    currency: "darkcrystals",
    levels: [
      { cost: 8, desc: "+25 Core Max HP." },
      { cost: 18, desc: "+5 starting Core Shield each raid." },
      { cost: 32, desc: "Dungeonlord retaliations deal +2 damage." },
    ],
  },
};

export const STATUS_RULES = {
  poison: { key: "poison", name: "Poison", short: "PSN", desc: "Takes damage at end of turn." },
  burn: { key: "burn", name: "Burn", short: "BRN", desc: "Takes fire damage at end of turn." },
  weaken: { key: "weaken", name: "Weaken", short: "WEK", desc: "-1 DEF while active." },
  guard: { key: "guard", name: "Guard", short: "GRD", desc: "Reduces the next incoming hit." },
  marked: { key: "marked", name: "Marked", short: "MRK", desc: "Death or focused hits trigger bonus effects." },
  fear: { key: "fear", name: "Fear", short: "FER", desc: "-1 ATK while active." },
  slow: { key: "slow", name: "Slow", short: "SLW", desc: "Can lose movement on the next turn." },
  root: { key: "root", name: "Root", short: "ROT", desc: "Cannot move while active." },
  stun: { key: "stun", name: "Stun", short: "STN", desc: "Skips the next action." },
  arrow: { key: "arrow", name: "Arrow Mark", short: "ARR", desc: "Takes delayed damage from Arrow Gallery." },
  bloodlust: { key: "bloodlust", name: "Bloodlust", short: "BLD", desc: "+1 ATK after a kill for 1 turn." },
};

export const FUSION_ARCHETYPE_RULES = {
  vanguard: {
    key: "vanguard",
    name: "Stitchguard",
    icon: "SG",
    classTags: ["Tank", "Warrior", "Knight", "Warden"],
    passiveBias: ["bulwark", "warding", "ironhide", "thorns"],
    baseCost: 8,
    secondaryWeights: { hp: 0.4, atk: 0.18, def: 0.35, spd: 0 },
  },
  predator: {
    key: "predator",
    name: "Gorebeast",
    icon: "GB",
    classTags: ["Brute", "Marauder", "Packlord", "Alpha", "Tyrant"],
    passiveBias: ["savage", "leech", "cruelty", "packleader"],
    baseCost: 8,
    secondaryWeights: { hp: 0.28, atk: 0.42, def: 0.2, spd: 0 },
  },
  stalker: {
    key: "stalker",
    name: "Nightsplice",
    icon: "NS",
    classTags: ["Rogue", "Skirmisher", "Ranger", "Stalker", "Reaper"],
    passiveBias: ["swift", "cruelty", "thorns"],
    baseCost: 7,
    secondaryWeights: { hp: 0.2, atk: 0.34, def: 0.12, spd: 1 },
  },
  hexer: {
    key: "hexer",
    name: "Gravecaster",
    icon: "GC",
    classTags: ["Hexer", "Mage", "Warlock", "Seer", "Cleric"],
    passiveBias: ["hex", "venom-aura", "mender", "rot-cloud", "bloodcall"],
    baseCost: 9,
    secondaryWeights: { hp: 0.22, atk: 0.3, def: 0.16, spd: 0 },
  },
};

export function validateGameContent() {
  const warnings = [];

  for (const [key, rule] of Object.entries(HERO_ARCHETYPE_RULES)) {
    if (!rule.weights || typeof rule.weights.core !== "number") {
      warnings.push(`Hero archetype "${key}" is missing score weights.`);
    }
  }

  for (const [key, rule] of Object.entries(DOCTRINE_RULES)) {
    if (!Array.isArray(rule.levels) || rule.levels.length === 0) {
      warnings.push(`Doctrine "${key}" has no levels configured.`);
      continue;
    }
    rule.levels.forEach((level, idx) => {
      if (!Number.isFinite(level.cost)) {
        warnings.push(`Doctrine "${key}" level ${idx + 1} has no numeric cost.`);
      }
      if (!level.desc) {
        warnings.push(`Doctrine "${key}" level ${idx + 1} is missing a description.`);
      }
    });
  }

  for (const [key, faction] of Object.entries(COUNCIL_RAID_FACTIONS)) {
    if (!Array.isArray(faction.monsterPool) || faction.monsterPool.length === 0) {
      warnings.push(`Council faction "${key}" has no monster pool.`);
    }
    if (!Array.isArray(faction.classPool) || faction.classPool.length === 0) {
      warnings.push(`Council faction "${key}" has no class pool.`);
    }
    if (!Array.isArray(faction.passiveBias) || faction.passiveBias.length === 0) {
      warnings.push(`Council faction "${key}" has no passive bias list.`);
    }
  }

  for (const [key, sponsor] of Object.entries(COUNCIL_SPONSOR_CONTENT)) {
    if (!sponsor.boon || !sponsor.quests?.standard || !sponsor.quests?.hard) {
      warnings.push(`Council sponsor "${key}" is missing boon or quest definitions.`);
    }
  }

  for (const monster of FLESH_MARKET_UNIQUE_MONSTERS) {
    if (!monster.key || !monster.name || !Array.isArray(monster.starByEra) || !Array.isArray(monster.costByEra)) {
      warnings.push(`Unique Flesh Market monster "${monster.key || "unknown"}" is missing key fields.`);
    }
  }

  for (const artifact of FLESH_MARKET_UNIQUE_ARTIFACTS) {
    if (!artifact.key || !artifact.name || !Array.isArray(artifact.costByEra) || !artifact.mods) {
      warnings.push(`Unique Flesh Market artifact "${artifact.key || "unknown"}" is missing key fields.`);
    }
  }

  for (const artifact of STANDARD_ARTIFACTS) {
    if (
      !artifact.key ||
      !artifact.name ||
      !artifact.cost ||
      !artifact.cost.currency ||
      !Number.isFinite(artifact.cost.amount) ||
      !Array.isArray(artifact.tags) ||
      !artifact.tags.length ||
      !Number.isFinite(artifact.maxCopies) ||
      !Number.isFinite(artifact.unlockDay) ||
      !artifact.mods
    ) {
      warnings.push(`Standard artifact "${artifact.key || "unknown"}" is missing key fields.`);
    }
  }

  for (const [key, rule] of Object.entries(FUSION_ARCHETYPE_RULES)) {
    if (!rule.name || !rule.icon || !Array.isArray(rule.classTags) || !rule.classTags.length) {
      warnings.push(`Fusion archetype "${key}" is missing name, icon, or class tags.`);
    }
    if (!rule.secondaryWeights || !Number.isFinite(rule.baseCost)) {
      warnings.push(`Fusion archetype "${key}" is missing secondary weights or base cost.`);
    }
  }

  for (const [key, rule] of Object.entries(STATUS_RULES)) {
    if (!rule.name || !rule.short || !rule.desc) {
      warnings.push(`Status rule "${key}" is missing name, short label, or description.`);
    }
  }

  return warnings;
}
