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

  return warnings;
}
