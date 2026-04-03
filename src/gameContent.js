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
    locked: true,
    lockedReason: "Unlocks once the Flesh Market is fully implemented.",
    boon: {
      key: "flesh-market-license",
      title: "Flesh Market License",
      desc: "Future boon: unlock the Flesh Market until the next Council.",
      reward: null,
      raidEffect: null,
    },
    quests: {
      standard: {
        id: "fresh-stock-standard",
        title: "Fresh Stock",
        desc: "Future quest: feed Maltheron fresh material once the Flesh Market is live.",
        metricKey: "monsterEvolutionCount",
        goalBands: [1, 1, 1],
        reward: { type: "darkcrystals", bands: [3, 5, 7] },
      },
      hard: {
        id: "fresh-stock-hard",
        title: "Fresh Stock",
        desc: "Future quest: complete a larger Flesh Market order.",
        metricKey: "monsterEvolutionCount",
        goalBands: [2, 2, 2],
        reward: { type: "darkcrystals", bands: [5, 8, 11] },
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
    locked: true,
    lockedReason: "Unlocks once final-approach rules are formalized.",
    boon: {
      key: "ash-covenant",
      title: "Ash Covenant",
      desc: "Future boon: Nihaza will turn looming defeat into ash and attrition.",
      reward: null,
      raidEffect: null,
    },
    quests: {
      standard: {
        id: "ashes-remain-standard",
        title: "Ashes Remain",
        desc: "Future quest: survive a final-approach raid once that phase exists.",
        metricKey: "highCoreRaidCount",
        goalBands: [1, 1, 1],
        reward: { type: "darkcrystals", bands: [3, 5, 7] },
      },
      hard: {
        id: "ashes-remain-hard",
        title: "Ashes Remain",
        desc: "Future quest: survive repeated final-approach pressure.",
        metricKey: "highCoreRaidCount",
        goalBands: [2, 2, 2],
        reward: { type: "darkcrystals", bands: [5, 8, 11] },
      },
    },
  },
};

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

  return warnings;
}
