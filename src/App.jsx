import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import { COUNCIL_RAID_FACTIONS, DOCTRINE_RULES, HERO_ARCHETYPE_RULES, RAID_TYPE_META, validateGameContent } from "./gameContent";

const W = 8;
const H = 8;

const MAX_ROOMS_BASE = 4;
const ROOMS_PER_LEVEL = 2;

const CORE_MAX_HP = 250;
const DAY_START_PARTY_MIN = 2;
const DAY_START_PARTY_MAX = 4;
const ROOM_TIER_MAX = 3;

const HERO_BASE = { hp: 20, atk: 4 };
const TRAP = { dmg: 10 };
const HERO_KILL_ESSENCE = 15;
const HERO_KILL_SOULSHARDS = 5;

const HERO_CAP = 6;

const DUNGEON_LORD_ATK = 6;
const SAVE_KEY = "dungeonlord.save.v1";
const DOMINION_CAP = 4;
const BASE_MONSTER_ROOM_CAP = 3;
const COUNCIL_INTERVAL = 10;
const FLESH_MARKET_COST = 100;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const ECONOMY_ROLES = [
  ["Essence", "Build tempo: rooms, upgrades, and trap infrastructure."],
  ["Soulshards", "Roster growth: trader purchases and monster recruitment pressure."],
  ["Evolution", "Branch power: doctrine utility and monster evolution choices."],
  ["Dominion", "Tactical tempo: battle powers that rescue a shaky raid."],
  ["Darkcrystals", "High-risk investment: core doctrine and Flesh Market leverage."],
];
const STAR_MULTIPLIERS = {
  1: 1.0,
  2: 1.35,
  3: 1.75,
  4: 2.25,
  5: 3.0,
};
const MAX_MONSTER_STAR = 5;
const MAX_EVOLUTION_STAGE = 2;
const EVOLUTION_COSTS = {
  0: 20,
  1: 50,
};

const MONSTERS = {
  goblin: { key: "goblin", name: "Goblin", icon: "G", hp: 8, atk: 3, cost: 15 },
  kobold: { key: "kobold", name: "Kobold", icon: "Kb", hp: 6, atk: 3, cost: 12 },
  hobgoblin: { key: "hobgoblin", name: "Hobgoblin", icon: "Hg", hp: 12, atk: 4, cost: 18 },
  ogre: { key: "ogre", name: "Ogre", icon: "O", hp: 24, atk: 6, cost: 30 },
  imp: { key: "imp", name: "Imp", icon: "I", hp: 6, atk: 4, cost: 12 },
  skeleton: { key: "skeleton", name: "Skeleton", icon: "S", hp: 10, atk: 4, cost: 14 },
  zombie: { key: "zombie", name: "Zombie", icon: "Z", hp: 14, atk: 3, cost: 12 },
  specter: { key: "specter", name: "Specter", icon: "Sp", hp: 10, atk: 4, cost: 18 },
  bonehound: { key: "bonehound", name: "Bone Hound", icon: "Bh", hp: 10, atk: 4, cost: 14 },
  mummy: { key: "mummy", name: "Mummy", icon: "Mu", hp: 16, atk: 4, cost: 18 },
  slime: { key: "slime", name: "Slime", icon: "L", hp: 12, atk: 2, cost: 10 },
  wraith: { key: "wraith", name: "Wraith", icon: "W", hp: 14, atk: 5, cost: 22 },
  direRat: { key: "direRat", name: "Dire Rat", icon: "Dr", hp: 6, atk: 3, cost: 10 },
  batSwarm: { key: "batSwarm", name: "Bat Swarm", icon: "Bs", hp: 8, atk: 3, cost: 12 },
  hellhound: { key: "hellhound", name: "Hellhound", icon: "Hh", hp: 14, atk: 5, cost: 22 },
  boar: { key: "boar", name: "Boar", icon: "Bo", hp: 16, atk: 4, cost: 18 },
  direBoar: { key: "direBoar", name: "Dire Boar", icon: "Db", hp: 20, atk: 5, cost: 26 },
  carrionCrow: { key: "carrionCrow", name: "Carrion Crow", icon: "Cc", hp: 8, atk: 3, cost: 12 },
  sporeling: { key: "sporeling", name: "Sporeling", icon: "Sl", hp: 10, atk: 3, cost: 14 },
  mimic: { key: "mimic", name: "Mimic", icon: "Mi", hp: 18, atk: 6, cost: 28 },
  animatedArmor: { key: "animatedArmor", name: "Animated Armor", icon: "Aa", hp: 20, atk: 5, cost: 26 },
  gremlin: { key: "gremlin", name: "Gremlin", icon: "Gr", hp: 8, atk: 3, cost: 12 },
  myconid: { key: "myconid", name: "Myconid", icon: "My", hp: 14, atk: 4, cost: 18 },
  chimera: { key: "chimera", name: "Chimera", icon: "Ch", hp: 22, atk: 7, cost: 36 },
  kuoToa: { key: "kuoToa", name: "Kuo-toa", icon: "Kt", hp: 12, atk: 4, cost: 16 },
  caveNaga: { key: "caveNaga", name: "Cave Naga", icon: "Cn", hp: 16, atk: 6, cost: 26 },
  deepSpider: { key: "deepSpider", name: "Deep Spider", icon: "Ds", hp: 12, atk: 4, cost: 18 },
  gnoll: { key: "gnoll", name: "Gnoll", icon: "Gn", hp: 14, atk: 5, cost: 20 },
  lizardfolk: { key: "lizardfolk", name: "Lizardfolk", icon: "Lf", hp: 14, atk: 5, cost: 20 },
  duergar: { key: "duergar", name: "Duergar", icon: "Dg", hp: 16, atk: 5, cost: 24 },
  drow: { key: "drow", name: "Drow", icon: "Dw", hp: 12, atk: 5, cost: 22 },
  bugbear: { key: "bugbear", name: "Bugbear", icon: "Bb", hp: 18, atk: 6, cost: 26 },
  ghoul: { key: "ghoul", name: "Ghoul", icon: "Gh", hp: 16, atk: 5, cost: 20 },
  orc: { key: "orc", name: "Orc", icon: "Or", hp: 18, atk: 6, cost: 24 },
  troll: { key: "troll", name: "Troll", icon: "Tr", hp: 26, atk: 7, cost: 34 },
  vampire: { key: "vampire", name: "Vampire", icon: "V", hp: 18, atk: 7, cost: 30 },
  werewolf: { key: "werewolf", name: "Werewolf", icon: "WW", hp: 20, atk: 8, cost: 32 },
  lich: { key: "lich", name: "Lich", icon: "Li", hp: 16, atk: 8, cost: 36 },
  harpy: { key: "harpy", name: "Harpy", icon: "H", hp: 14, atk: 5, cost: 20 },
  gargoyle: { key: "gargoyle", name: "Gargoyle", icon: "Ga", hp: 22, atk: 6, cost: 28 },
  basilisk: { key: "basilisk", name: "Basilisk", icon: "Ba", hp: 20, atk: 7, cost: 30 },
  spiderkin: { key: "spiderkin", name: "Spiderkin", icon: "Sp", hp: 12, atk: 4, cost: 18 },
  minotaur: { key: "minotaur", name: "Minotaur", icon: "M", hp: 24, atk: 8, cost: 38 },
  drake: { key: "drake", name: "Drake", icon: "D", hp: 22, atk: 7, cost: 34 },
  elemental: { key: "elemental", name: "Elemental", icon: "E", hp: 20, atk: 6, cost: 30 },
  construct: { key: "construct", name: "Construct", icon: "C", hp: 24, atk: 5, cost: 28 },
  sahagin: { key: "sahagin", name: "Sahagin", icon: "Sa", hp: 18, atk: 6, cost: 26 },
  unicorn: { key: "unicorn", name: "Unicorn", icon: "U", hp: 18, atk: 6, cost: 28 },
  nightmare: { key: "nightmare", name: "Nightmare", icon: "Nm", hp: 20, atk: 7, cost: 32 },
  dullahan: { key: "dullahan", name: "Dullahan", icon: "Du", hp: 22, atk: 7, cost: 34 },
};
const MONSTER_KEYS = Object.keys(MONSTERS);

const HERO_RACES = ["Human", "Elf", "Dwarf", "Orc", "Tiefling", "Halfling"];
const HERO_CLASSES = ["Warrior", "Rogue", "Mage", "Ranger", "Cleric", "Monk"];
const HERO_NAMES = ["Arin", "Bela", "Cora", "Dain", "Eris", "Fenn", "Garr", "Hale", "Iria", "Joss"];
const HERO_PASSIVE_RULES = [
  { key: "brave", name: "Brave", desc: "Holds the line; resists fear effects." },
  { key: "cunning", name: "Cunning", desc: "Favors traps and flanking routes." },
  { key: "stoic", name: "Stoic", desc: "Reduced damage from the first hit each turn." },
  { key: "quick", name: "Quick", desc: "Moves first when possible." },
  { key: "vigorous", name: "Vigorous", desc: "Recovers 1 HP at end of turn." },
  { key: "focused", name: "Focused", desc: "Increased chance to resist debuffs." },
  { key: "unyielding", name: "Unyielding", desc: "Takes -1 damage while above 50% HP." },
  { key: "reckless", name: "Reckless", desc: "Gains +1 ATK but takes +1 damage." },
  { key: "warded", name: "Warded", desc: "Resists the first debuff each raid." },
  { key: "bloodlust", name: "Bloodlust", desc: "Gains +1 ATK for 1 turn after killing a monster." },
  { key: "keen", name: "Keen", desc: "Deals +1 damage vs traps." },
  { key: "resolute", name: "Resolute", desc: "Unaffected by Slow for 1 turn when it would apply." },
];
const HERO_PASSIVES = HERO_PASSIVE_RULES.map((p) => p.name);
const HERO_PASSIVE_MAP = Object.fromEntries(HERO_PASSIVE_RULES.map((p) => [p.key, p]));

const MONSTER_ARCHETYPES = ["Brute", "Skirmisher", "Hexer", "Packlord", "Tyrant", "Stalker"];
const MONSTER_PASSIVE_RULES = [
  { key: "savage", name: "Savage", desc: "Single-target: monster strikes deal +2 damage." },
  { key: "leech", name: "Leech", desc: "Single-target: heals 2 when this monster deals damage." },
  { key: "hex", name: "Hex", desc: "Single-target: hits apply Weaken (-1 DEF, 2 turns)." },
  { key: "thorns", name: "Thorns", desc: "Single-target: attackers take 1 damage on hit." },
  { key: "warbanner", name: "Warbanner", desc: "AoE boon: monsters in this room gain +1 ATK." },
  { key: "bloodcall", name: "Bloodcall", desc: "AoE boon: monsters in this room heal +1 HP at end of turn." },
  { key: "venom-aura", name: "Venom Aura", desc: "AoE harm: heroes entering this room are Poisoned (2 dmg, 2 turns)." },
  { key: "dread-howl", name: "Dread Howl", desc: "AoE harm: heroes entering this room suffer Fear (-1 ATK, 2 turns)." },
  { key: "mender", name: "Mender", desc: "Single-target boon: heals lowest-HP ally in room by 1 at end of turn." },
  { key: "swift", name: "Swift", desc: "Single-target boon: this room's monsters act first." },
  { key: "cruelty", name: "Cruelty", desc: "Single-target: monster strikes deal +1 damage to wounded heroes." },
  { key: "bulwark", name: "Bulwark", desc: "Single-target boon: first hit each turn reduced by 1." },
  { key: "rot-cloud", name: "Rot Cloud", desc: "AoE harm: heroes entering this room take 1 damage." },
  { key: "ironhide", name: "Ironhide", desc: "Single-target boon: +1 DEF while above 50% HP." },
  { key: "packleader", name: "Packleader", desc: "AoE boon: if 2+ monsters, all gain +1 ATK." },
  { key: "warding", name: "Warding", desc: "AoE boon: monsters in this room gain +1 DEF." },
];
const MONSTER_PASSIVE_MAP = Object.fromEntries(MONSTER_PASSIVE_RULES.map((p) => [p.key, p]));
const MONSTER_PASSIVES = MONSTER_PASSIVE_RULES.map((p) => p.key);
const MONSTER_TITLES = ["Grim", "Ragged", "Iron", "Soot", "Feral", "Rot"];
const MONSTER_EVOLUTION_BRANCHES = ["Knight", "Reaper", "Warlock", "Stalker", "Alpha", "Seer", "Warden", "Marauder"];
const BRANCH_PASSIVE_BY_CLASS = {
  Knight: "bulwark",
  Reaper: "cruelty",
  Warlock: "hex",
  Stalker: "swift",
  Alpha: "packleader",
  Seer: "mender",
  Warden: "warding",
  Marauder: "savage",
};

const COUNCIL_MEMBERS = [
  {
    key: "malachar",
    name: "Lord Malachar",
    title: "The Cruel",
    theme: "Tyranny & Torment",
    vibe: "ruthless, calculating",
    role: "control-obsessed strategist",
    personality: "Measured, merciless, always three moves ahead.",
    deal: "Offers tactical counsel and a small Essence stipend for discipline.",
    rivalries: ["blackthorn", "zurkhan"],
  },
  {
    key: "crimson-twins",
    name: "Selene & Vespera Nightwhisper",
    title: "The Crimson Twins",
    theme: "Beauty & Pain",
    vibe: "seductive, elegant",
    role: "social warfare",
    personality: "Poetic cruelty paired with icy pragmatism.",
    deal: "Can sponsor a rare monster recruitment at reduced cost.",
    rivalries: ["grimjaw", "lyralei"],
  },
  {
    key: "zephyra",
    name: "Archmage Zephyra Voidcaller",
    title: "The Riftmind",
    theme: "Void & Forbidden Magic",
    vibe: "mysterious, obsessive",
    role: "reality-bending theorist",
    personality: "Speaks in riddles, hoards forbidden knowledge.",
    deal: "Shares intelligence on hero tactics and grants Evolution.",
    rivalries: ["xaldros", "nihaza"],
  },
  {
    key: "grimjaw",
    name: "Overlord Grimjaw Ironbeast",
    title: "The Iron Pact",
    theme: "Iron & Honor",
    vibe: "honorable, fierce",
    role: "keeps the council in check",
    personality: "Rigid honor, steady temper, brutal justice.",
    deal: "Offers a Dominion boon for those who hold the line.",
    rivalries: ["crimson-twins", "zurkhan"],
  },
  {
    key: "blackthorn",
    name: "Baron Thaddeus Blackthorn",
    title: "The Masked Serpent",
    theme: "Politics & Intrigue",
    vibe: "charismatic, diplomatic",
    role: "alliance-maker",
    personality: "Smiling blades and veiled threats.",
    deal: "Trade favors for Soulshards and spy rumors.",
    rivalries: ["malachar", "tharos"],
  },
  {
    key: "lyralei",
    name: "Countess Lyralei Shadowdancer",
    title: "The Veiled Scholar",
    theme: "Shadows & Wisdom",
    vibe: "patient, calm",
    role: "archivist of secrets",
    personality: "Soft-spoken, unsettlingly precise.",
    deal: "Reveals scouting intelligence and grants a quest.",
    rivalries: ["crimson-twins", "xaldros"],
  },
  {
    key: "maltheron",
    name: "Lord Maltheron",
    title: "The Flesh Shaper",
    theme: "Flesh & Mutation",
    vibe: "calm, twisted",
    role: "Flesh Market broker",
    personality: "Clinical curiosity masking monstrous intent.",
    deal: "Flesh Market access: fuse monsters or harvest Dark Crystals.",
    rivalries: ["nihaza", "grimjaw"],
  },
  {
    key: "vexira",
    name: "Vexira the Vile",
    title: "The Toxblood Queen",
    theme: "Poisons & Plagues",
    vibe: "sadistic, venomous",
    role: "attrition specialist",
    personality: "Laughs at suffering, delights in slow victory.",
    deal: "Supplies toxins that strengthen traps for a time.",
    rivalries: ["grimjaw", "zurkhan"],
  },
  {
    key: "tharos",
    name: "Tharos Dreadveil",
    title: "The Black Veil",
    theme: "Assassination & Secrets",
    vibe: "silent, calculating",
    role: "information warfare",
    personality: "Few words; every one a threat.",
    deal: "Grants a covert bounty quest for Essence.",
    rivalries: ["blackthorn", "xaldros"],
  },
  {
    key: "xaldros",
    name: "Xaldros the Hollow",
    title: "The Mirror King",
    theme: "Madness & Illusions",
    vibe: "theatrical, unstable",
    role: "misdirection incarnate",
    personality: "Chaotic, mocking, impossibly charismatic.",
    deal: "Offers a risky boon that doubles a reward but cuts a resource.",
    rivalries: ["zephyra", "lyralei"],
  },
  {
    key: "zurkhan",
    name: "Zurkhan Bloodlash",
    title: "The Beast Tyrant",
    theme: "Beasts & Brutality",
    vibe: "brash, savage",
    role: "raw-force extremist",
    personality: "Respects only strength and spectacle.",
    deal: "Can recruit a powerful beast at higher Essence cost.",
    rivalries: ["grimjaw", "malachar"],
  },
  {
    key: "nihaza",
    name: "Matriarch Nihaza",
    title: "The Stillborn Flame",
    theme: "Extinction & Ash",
    vibe: "silent, apocalyptic",
    role: "prophecy with teeth",
    personality: "Rarely speaks; when she does, it is doom.",
    deal: "Grants a prophecy quest for Evolution.",
    rivalries: ["zephyra", "maltheron"],
  },
];

const MONSTER_CLASS_RULES = {
  goblin: ["Warrior", "Rogue", "Skirmisher", "Ranger"],
  kobold: ["Rogue", "Skirmisher", "Ranger"],
  hobgoblin: ["Warrior", "Tank", "Skirmisher"],
  ogre: ["Brute", "Tank", "Warrior"],
  imp: ["Rogue", "Skirmisher", "Hexer", "Mage"],
  skeleton: ["Warrior", "Tank", "Hexer"],
  zombie: ["Brute", "Tank", "Warrior"],
  specter: ["Hexer", "Mage", "Skirmisher"],
  bonehound: ["Skirmisher", "Ranger", "Warrior"],
  mummy: ["Warrior", "Hexer", "Tank"],
  slime: ["Brute", "Tank"],
  wraith: ["Hexer", "Mage", "Skirmisher"],
  direRat: ["Rogue", "Skirmisher"],
  batSwarm: ["Skirmisher", "Ranger"],
  hellhound: ["Brute", "Skirmisher", "Warrior"],
  boar: ["Brute", "Tank", "Warrior"],
  direBoar: ["Brute", "Tank", "Warrior"],
  carrionCrow: ["Skirmisher", "Ranger"],
  sporeling: ["Hexer", "Skirmisher"],
  mimic: ["Brute", "Tank", "Hexer"],
  animatedArmor: ["Tank", "Warrior", "Brute"],
  gremlin: ["Rogue", "Skirmisher", "Hexer"],
  myconid: ["Hexer", "Warrior", "Tank"],
  chimera: ["Brute", "Warrior", "Mage"],
  kuoToa: ["Warrior", "Skirmisher", "Hexer"],
  caveNaga: ["Mage", "Hexer"],
  deepSpider: ["Rogue", "Skirmisher", "Hexer"],
  gnoll: ["Warrior", "Brute", "Skirmisher"],
  lizardfolk: ["Warrior", "Skirmisher", "Tank"],
  duergar: ["Warrior", "Tank", "Hexer"],
  drow: ["Rogue", "Mage", "Hexer"],
  bugbear: ["Brute", "Warrior", "Rogue"],
  ghoul: ["Brute", "Warrior", "Hexer"],
  orc: ["Warrior", "Brute", "Tank"],
  troll: ["Brute", "Tank", "Warrior"],
  vampire: ["Rogue", "Mage", "Hexer", "Skirmisher"],
  werewolf: ["Brute", "Skirmisher", "Warrior"],
  lich: ["Mage", "Hexer"],
  harpy: ["Skirmisher", "Ranger", "Rogue"],
  gargoyle: ["Tank", "Warrior", "Brute"],
  basilisk: ["Hexer", "Brute", "Tank"],
  spiderkin: ["Rogue", "Skirmisher", "Hexer"],
  minotaur: ["Brute", "Warrior", "Tank"],
  drake: ["Warrior", "Brute", "Mage"],
  sahagin: ["Warrior", "Skirmisher", "Ranger"],
  dullahan: ["Warrior", "Brute", "Tank"],
};

const MONSTER_AFFINITY_RULES = {
  elemental: ["Fire", "Water", "Earth", "Air"],
  construct: ["Steel", "Stone", "Arcane"],
  unicorn: ["Light"],
  nightmare: ["Dark"],
};

const CLASS_STAT_MODS = {
  Warrior: { hp: 4, atk: 1, def: 1 },
  Rogue: { hp: -1, atk: 2, def: 0 },
  Brute: { hp: 6, atk: 1, def: 0 },
  Skirmisher: { hp: 0, atk: 1, def: 0 },
  Ranger: { hp: 0, atk: 1, def: 0 },
  Mage: { hp: -2, atk: 3, def: -1 },
  Cleric: { hp: 2, atk: 0, def: 1 },
  Tank: { hp: 8, atk: -1, def: 2 },
  Hexer: { hp: 0, atk: 2, def: 0 },
};

const AFFINITY_STAT_MODS = {
  Fire: { hp: 0, atk: 2, def: 0 },
  Water: { hp: 2, atk: 0, def: 0 },
  Earth: { hp: 4, atk: 0, def: 1 },
  Air: { hp: 0, atk: 1, def: 0 },
  Steel: { hp: 4, atk: 0, def: 2 },
  Stone: { hp: 6, atk: -1, def: 2 },
  Arcane: { hp: 0, atk: 2, def: 0 },
  Light: { hp: 2, atk: 1, def: 1 },
  Dark: { hp: 0, atk: 2, def: 0 },
};

const ARTIFACTS = [
  { key: "graven-coin", name: "Graven Coin", desc: "+2 Essence on hero death.", cost: { currency: "soulshards", amount: 20 }, mods: { essenceOnKill: 2 } },
  { key: "shard-prism", name: "Shard Prism", desc: "+1 Soulshard on hero death.", cost: { currency: "soulshards", amount: 18 }, mods: { soulshardOnKill: 1 } },
  { key: "rage-brand", name: "Rage Brand", desc: "Monsters gain +1 ATK.", cost: { currency: "essence", amount: 25 }, mods: { monsterAtk: 1 } },
  { key: "wicked-gears", name: "Wicked Gears", desc: "Traps deal +15% damage.", cost: { currency: "essence", amount: 20 }, mods: { trapMult: 0.15 } },
  { key: "dread-veil", name: "Dread Veil", desc: "Core takes -1 damage from hero hits (min 1).", cost: { currency: "soulshards", amount: 30 }, mods: { coreDamageReduction: 1 } },
];
const ARTIFACT_MAP = Object.fromEntries(ARTIFACTS.map((a) => [a.key, a]));

const UTILITY_ROOMS = [
  { key: "soul-altar", name: "Soul Altar", desc: "Hero dies within 1 tile: +15 Essence." },
  { key: "siphon-pylon", name: "Essence Siphon Pylon", desc: "Hero takes damage within 1 tile: +1 Essence (cap 10 per hero)." },
  { key: "reinforced-keystone", name: "Reinforced Keystone", desc: "Monsters within 1 tile gain +2 DEF." },
  { key: "blood-sigil", name: "Blood Sigil", desc: "Monsters within 1 tile heal +2 HP at end of turn." },
  { key: "war-drum", name: "War Drum Totem", desc: "Monsters within 1 tile gain +1 ATK." },
  { key: "haste-glyph", name: "Haste Glyph", desc: "Monsters within 1 tile act first." },
  { key: "fear-idol", name: "Fear Idol", desc: "Heroes entering adjacent tiles get -1 ATK for 2 turns." },
  { key: "ward-lantern", name: "Ward Lantern", desc: "Traps within 1 tile deal +25% damage." },
  { key: "seal-silence", name: "Seal of Silence", desc: "Heroes within 1 tile cannot gain buffs." },
  { key: "scout-mirror", name: "Scout's Mirror", desc: "Raid start reveals next 2 hero spawns." },
];

const MONSTER_ROOMS = [
  { key: "training-den", name: "Training Den", desc: "Placed monsters gain +1 ATK (permanent)." },
  { key: "thick-hide", name: "Thick Hide Pens", desc: "Placed monsters gain +3 Max HP (permanent)." },
  { key: "rally-banner", name: "Rally Banner", desc: "If 2+ monsters, they gain +1 ATK." },
  { key: "ambush-alcove", name: "Ambush Alcove", desc: "First hero entry triggers an extra monster strike." },
  { key: "savage-kennels", name: "Savage Kennels", desc: "Monsters heal 2 when they deal damage." },
  { key: "hex-circle", name: "Hex Circle", desc: "Monster hits apply Weaken (-1 DEF, 2 turns)." },
  { key: "pack-tactics", name: "Pack Tactics Den", desc: "+1 ATK per other monster (max +2)." },
  { key: "brawlers-ring", name: "Brawler's Ring", desc: "First hit each turn reduced by 2 damage." },
];

const TRAP_TYPES = [
  { key: "spike-pit", name: "Spike Pit", desc: "On entry: 10 damage.", baseDmg: 10, baseCooldown: 1 },
  { key: "poison-vent", name: "Poison Vent", desc: "On entry: 4 damage + Poison (2 dmg, 3 turns).", baseDmg: 4, baseCooldown: 1 },
  { key: "frost-rune", name: "Frost Rune", desc: "On entry: 5 damage + Slow (2 turns).", baseDmg: 5, baseCooldown: 1 },
  { key: "shock-coil", name: "Shock Coil", desc: "On entry: 6 damage + Stun (skip next move).", baseDmg: 6, baseCooldown: 2 },
  { key: "snare-net", name: "Snare Net", desc: "On entry: Rooted (skip next move).", baseDmg: 0, baseCooldown: 1 },
  { key: "flame-jet", name: "Flame Jet", desc: "On entry: 8 damage (+4 if already damaged).", baseDmg: 8, baseCooldown: 1 },
  { key: "cursed-brand", name: "Cursed Brand", desc: "On entry: Mark hero; on death +10 Essence.", baseDmg: 0, baseCooldown: 1 },
  { key: "blink-trap", name: "Blink Trap", desc: "On entry: Teleport hero back 1 tile.", baseDmg: 0, baseCooldown: 2 },
  { key: "shatter-floor", name: "Shatter Floor", desc: "First entry: 12 damage, then breaks.", baseDmg: 12, baseCooldown: 0 },
  { key: "arrow-gallery", name: "Arrow Gallery", desc: "On entry: 3 damage + 3 damage next turn.", baseDmg: 3, baseCooldown: 1 },
];

const UTILITY_ICONS = {
  "soul-altar": "SA",
  "siphon-pylon": "SP",
  "reinforced-keystone": "RK",
  "blood-sigil": "BS",
  "war-drum": "WD",
  "haste-glyph": "HG",
  "fear-idol": "FI",
  "ward-lantern": "WL",
  "seal-silence": "SS",
  "scout-mirror": "SM",
};

const MONSTER_ROOM_ICONS = {
  "training-den": "TD",
  "thick-hide": "TH",
  "rally-banner": "RB",
  "ambush-alcove": "AA",
  "savage-kennels": "SK",
  "hex-circle": "HC",
  "pack-tactics": "PT",
  "brawlers-ring": "BR",
};

const TRAP_ICONS = {
  "spike-pit": "SP",
  "poison-vent": "PV",
  "frost-rune": "FR",
  "shock-coil": "SC",
  "snare-net": "SN",
  "flame-jet": "FJ",
  "cursed-brand": "CB",
  "blink-trap": "BT",
  "shatter-floor": "SF",
  "arrow-gallery": "AG",
};

const TRAP_GLYPHS = {
  "flame-jet": { unarmed: "\u2668", armed: "\u2668" },
  "poison-vent": { unarmed: "\u2623", armed: "\u2623" },
  "frost-rune": { unarmed: "\u2744", armed: "\u2744" },
  "shock-coil": { unarmed: "\u26A1", armed: "\u26A1" },
  "spike-pit": { unarmed: "\u25BC", armed: "\u25BC" },
  "snare-net": { unarmed: "\u25A6", armed: "\u25A6" },
  "cursed-brand": { unarmed: "\u2297", armed: "\u2297" },
  "blink-trap": { unarmed: "\u25C9", armed: "\u25C9" },
  "shatter-floor": { unarmed: "\u25A7", armed: "\u25A7" },
  "arrow-gallery": { unarmed: "\u27B5", armed: "\u27B5" },
};

const UTILITY_GLYPHS = {
  "soul-altar": "\u2727",
  "siphon-pylon": "\u03A8",
  "reinforced-keystone": "\u2302",
  "blood-sigil": "\u271A",
  "war-drum": "\u266B",
  "haste-glyph": "\u00BB",
  "fear-idol": "\u2620",
  "ward-lantern": "\u263C",
  "seal-silence": "\u26D4",
  "scout-mirror": "\u25C8",
};

const UTILITY_MAP = Object.fromEntries(UTILITY_ROOMS.map((r) => [r.key, r]));
const MONSTER_ROOM_MAP = Object.fromEntries(MONSTER_ROOMS.map((r) => [r.key, r]));
const TRAP_MAP = Object.fromEntries(TRAP_TYPES.map((r) => [r.key, r]));

const DAILY_EVENTS = [
  { key: "none", name: "Calm Day", desc: "No unusual effects today.", mods: {} },
  { key: "hero-fervor", name: "Heroic Fervor", desc: "Heroes gain +1 ATK.", mods: { heroAtk: 1 } },
  { key: "monster-rally", name: "Monster Rally", desc: "Monsters gain +1 ATK.", mods: { monsterAtk: 1 } },
  { key: "iron-wards", name: "Iron Wards", desc: "Monsters gain +1 DEF.", mods: { monsterDef: 1 } },
  { key: "swift-march", name: "Swift March", desc: "Heroes gain +1 SPD.", mods: { heroSpd: 1 } },
  { key: "essence-winds", name: "Essence Winds", desc: "Essence gains +25%.", mods: { essenceMult: 1.25 } },
  { key: "shard-bloom", name: "Shard Bloom", desc: "Soulshard gains +25%.", mods: { soulshardMult: 1.25 } },
  { key: "dominion-surge", name: "Dominion Surge", desc: "Dominion regenerates faster today.", mods: { dpRegenBoost: 1 } },
];

function rollDailyEvent() {
  const r = Math.random();
  if (r < 0.35) return pick(DAILY_EVENTS.filter((e) => e.key !== "none"));
  return DAILY_EVENTS[0];
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickUnique(arr, count) {
  const copy = arr.slice();
  const out = [];
  while (copy.length && out.length < count) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

function nextCouncilDay(day) {
  const d = Math.max(1, day || 1);
  return Math.ceil(d / COUNCIL_INTERVAL) * COUNCIL_INTERVAL;
}

function buildCouncilRoster(lastRoster = []) {
  const keep = pickUnique(lastRoster, Math.min(2, lastRoster.length));
  const remainingPool = COUNCIL_MEMBERS.filter((m) => !keep.some((k) => k.key === m.key));
  const fresh = pickUnique(remainingPool, Math.max(0, 6 - keep.length));
  return [...keep, ...fresh];
}

const COUNCIL_RUMORS = [
  "Scouts report a surge in hero enlistment near the eastern frontier.",
  "A new relic was unearthed beneath the capital. The clergy guards it fiercely.",
  "Hero supply lines are stretched thin after a northern crusade.",
  "A rival guild is testing anti-trap tactics in the wilds.",
  "A noble house funds elite expeditions to purge rogue dungeons.",
  "Wandering paladins have rallied; raids may intensify soon.",
];

const COUNCIL_DIALOGUE = [
  "{name}: The council grows restless. The heroes are adapting faster than expected.",
  "{name}: The mortal kingdoms bleed, but their resolve sharpens. We must respond.",
  "{name}: I smell fear in their ranks. The next raids will be bold, not wise.",
  "{name}: Keep your halls disciplined. Chaos invites collapse.",
  "{name}: My spies whisper of a new blessing for the invaders.",
  "{name}: The core is the heart. Guard it, or lose everything.",
  "{name}: We should share the burden, or the council will fracture.",
  "{name}: Power gathers like stormclouds. Strike before it breaks.",
];

const COUNCIL_OFFER_TEMPLATES = [
  { type: "essence", title: "War Chest", desc: "Receive an Essence grant to fortify your dungeon." },
  { type: "soulshards", title: "Soul Tithe", desc: "A tribute of Soulshards arrives by midnight." },
  { type: "dominion", title: "Dominion Charter", desc: "Council grants a small burst of Dominion power." },
  { type: "evolution", title: "Eldritch Codex", desc: "A tome of growth grants Evolution points." },
  { type: "monster", title: "Conscription", desc: "A monster is pressed into your service." },
];

const COUNCIL_QUESTS = [
  { key: "cull", title: "Cull the Vanguard", desc: "Defeat {goal} heroes before the next Council.", reward: { type: "essence" } },
  { key: "harvest", title: "Harvest Souls", desc: "Defeat {goal} heroes before the next Council.", reward: { type: "soulshards" } },
  { key: "survive", title: "Hold the Line", desc: "Defeat {goal} heroes before the next Council.", reward: { type: "evolution" } },
];

function buildCouncilSession(roster, day) {
  const speakers = pickUnique(roster, Math.min(4, roster.length));
  const dialogue = speakers.map((s) => pick(COUNCIL_DIALOGUE).replace("{name}", s.name));
  if (roster.length >= 2) {
    const a = roster[0];
    const b = roster[1];
    dialogue.push(`${a.name} and ${b.name} clash over strategy, but no blood is spilled... this time.`);
  }
  const rumors = pickUnique(COUNCIL_RUMORS, 2);
  const sponsors = pickUnique(roster, Math.min(2, roster.length));
  const offers = pickUnique(COUNCIL_OFFER_TEMPLATES, 2).map((o, idx) => {
    const amount = Math.max(1, Math.round(scaleByDay(20 + idx * 10, day, 0.06, 4)));
    const sponsor = sponsors[idx % Math.max(1, sponsors.length)] || roster[0] || null;
    return {
      id: `${o.type}-${day}-${idx}`,
      ...o,
      amount,
      sponsorKey: sponsor?.key || null,
      sponsorName: sponsor?.name || "The Council",
      raidEffect: buildCouncilOfferRaidEffect(sponsor?.key, day),
    };
  });
  const questTemplate = pick(COUNCIL_QUESTS);
  const goal = Math.max(6, Math.round(scaleByDay(8, day, 0.04, 3.5)));
  const questSponsor = pick(roster);
  const quest = {
    id: `${questTemplate.key}-${day}`,
    title: questTemplate.title,
    goal,
    progress: 0,
    reward: { type: questTemplate.reward.type, amount: Math.max(2, Math.round(scaleByDay(12, day, 0.05, 4))) },
    desc: questTemplate.desc.replace("{goal}", goal),
    sponsorKey: questSponsor?.key || null,
    sponsorName: questSponsor?.name || "The Council",
  };
  return {
    day,
    status: "pending",
    dialogue,
    rumors,
    offers,
    quest,
  };
}

function buildCouncilOfferRaidEffect(sponsorKey, day) {
  switch (sponsorKey) {
    case "lyralei":
    case "tharos":
      return {
        key: "intel",
        label: "Shadow Briefing",
        desc: "Next raid reveals +2 extra invaders and suffers -1 party size.",
        partySizeDelta: -1,
        scoutRevealBonus: 2,
      };
    case "blackthorn":
    case "xaldros":
      return {
        key: "fracture",
        label: "Fractured Command",
        desc: "Next raid loses cohesion and rolls one star step lower.",
        starBias: -1,
      };
    case "grimjaw":
    case "malachar":
      return {
        key: "sober-campaign",
        label: "Measured Advance",
        desc: "Next raid loses 10% ATK and party size is reduced by 1.",
        partySizeDelta: -1,
        atkMult: 0.9,
      };
    case "zephyra":
      return {
        key: "void-static",
        label: "Void Static",
        desc: "Next raid is easier to lure away from the core route.",
        lureBoost: 2,
        scoutRevealBonus: 1,
      };
    default:
      return {
        key: "pressure-relief",
        label: "Pressure Relief",
        desc: "Next raid size is reduced by 1.",
        partySizeDelta: -1,
      };
  }
}

function applyCouncilFavorShift(favorMap, memberKey, delta) {
  if (!memberKey) return favorMap || {};
  const next = { ...(favorMap || {}) };
  next[memberKey] = (next[memberKey] || 0) + delta;
  const member = COUNCIL_MEMBERS.find((m) => m.key === memberKey);
  for (const rivalKey of member?.rivalries || []) {
    next[rivalKey] = (next[rivalKey] || 0) - Math.sign(delta || 0);
  }
  return next;
}

function buildCouncilRaidFromRoster(roster = [], day = 1, favorMap = {}) {
  const sorted = [...roster].sort((a, b) => {
    const aScore = (favorMap[a.key] || 0) + Math.random() * 0.35;
    const bScore = (favorMap[b.key] || 0) + Math.random() * 0.35;
    return aScore - bScore;
  });
  const attackerCount = sorted.length > 1 && day >= 40 ? 2 : 1;
  const attackers = sorted.slice(0, attackerCount).map((member) => {
    const faction = COUNCIL_RAID_FACTIONS[member.key] || {};
    return {
      key: member.key,
      memberName: member.name,
      memberTitle: member.title,
      raidName: faction.raidName || member.title,
      desc: faction.desc || member.theme,
      raidModifier: faction.raidModifier || member.role,
    };
  });
  return {
    day,
    attackers,
    label: `Council Retaliation: ${attackers.map((a) => a.memberName).join(" & ")}`,
    desc: attackers.map((a) => a.raidName).join(" / "),
    modifierText: attackers.map((a) => a.raidModifier).join(" "),
  };
}

function rollStars(turnsSurvived = 0, bonusStep = 6) {
  const r = Math.random();
  const bonus = Math.min(3, Math.floor(Math.max(0, turnsSurvived) / bonusStep));
  if (r < 0.02) return 6;
  if (r < 0.1) return Math.min(6, 5 + bonus);
  if (r < 0.3) return Math.min(6, 4 + bonus);
  if (r < 0.55) return Math.min(6, 3 + bonus);
  if (r < 0.8) return Math.min(6, 2 + bonus);
  return Math.min(6, 1 + bonus);
}

function dayMultiplier(day, perDay = 0.03, cap = 2.0) {
  const d = Math.max(1, day || 1);
  return Math.min(cap, 1 + (d - 1) * perDay);
}

function scaleByDay(value, day, perDay = 0.03, cap = 2.0) {
  const mult = dayMultiplier(day, perDay, cap);
  return Math.max(1, Math.round(value * mult));
}

function monsterStarCapForDay(day = 1) {
  const safeDay = Math.max(0, day || 0);
  if (safeDay <= 10) return 2;
  if (safeDay <= 25) return 3;
  if (safeDay <= 36) return 4;
  return 5;
}

function clampMonsterStar(stars) {
  return clamp(Math.round(stars || 1), 1, MAX_MONSTER_STAR);
}

function monsterStarMultiplier(stars) {
  return STAR_MULTIPLIERS[clampMonsterStar(stars)] || STAR_MULTIPLIERS[1];
}

function rollAuthoritativeStar(day = 1, explicitCap) {
  const safeDay = Math.max(1, day || 1);
  const requestedCap = Number.isFinite(explicitCap) ? explicitCap : MAX_MONSTER_STAR;
  const maxStar = Math.min(MAX_MONSTER_STAR, requestedCap, monsterStarCapForDay(safeDay));
  const r = Math.random();
  if (maxStar <= 2) {
    if (explicitCap == null && safeDay <= 10 && requestedCap >= 3 && r >= 0.99) return 3;
    return r < 0.72 ? 1 : 2;
  }
  if (maxStar === 3) {
    if (r < 0.48) return 1;
    if (r < 0.88) return 2;
    return 3;
  }
  if (maxStar === 4) {
    if (r < 0.3) return 1;
    if (r < 0.62) return 2;
    if (r < 0.9) return 3;
    return 4;
  }
  if (r < 0.22) return 1;
  if (r < 0.54) return 2;
  if (r < 0.8) return 3;
  if (r < 0.97) return 4;
  return 5;
}

function normalizeHeroPassiveKey(value) {
  if (!value) return HERO_PASSIVE_RULES[0].key;
  if (HERO_PASSIVE_MAP[value]) return value;
  return HERO_PASSIVE_RULES.find((rule) => rule.name === value)?.key || HERO_PASSIVE_RULES[0].key;
}

function getHeroArchetypeRule(key) {
  return HERO_ARCHETYPE_RULES[key] || HERO_ARCHETYPE_RULES.zealot;
}

function pickHeroPassiveRule(pool = HERO_PASSIVE_RULES) {
  const normalizedPool = Array.isArray(pool)
    ? pool
        .map((entry) => {
          if (typeof entry === "string") return HERO_PASSIVE_RULES.find((rule) => rule.name === entry || rule.key === entry);
          return entry;
        })
        .filter(Boolean)
    : HERO_PASSIVE_RULES;
  return pick(normalizedPool.length ? normalizedPool : HERO_PASSIVE_RULES);
}

function pickHeroArchetypeKey(heroClass, passiveKey, raidType = null) {
  const key = normalizeHeroPassiveKey(passiveKey);
  if (raidType === "elite") {
    if (["brave", "stoic", "unyielding"].includes(key)) return "zealot";
    if (["focused", "warded"].includes(key)) return "cautious";
  }
  if (["cunning", "quick"].includes(key)) return "scout";
  if (["brave", "bloodlust"].includes(key)) return "breaker";
  if (["stoic", "warded", "focused"].includes(key)) return "cautious";
  if (["Mage", "Cleric"].includes(heroClass)) return "purifier";
  if (["Ranger", "Rogue"].includes(heroClass)) return "scout";
  return "zealot";
}

function applyRaidStarBias(stars, day = 1, raidType = null, bias = 0) {
  const cap = monsterStarCapForDay(day);
  let next = clampMonsterStar(stars);
  const totalBias =
    bias +
    (raidType === "elite" ? 0.45 : 0) +
    (raidType === "council" ? 0.6 : 0);
  if (totalBias > 0 && Math.random() < totalBias) {
    next = Math.min(cap, next + 1);
  }
  if (totalBias < 0 && Math.random() < Math.abs(totalBias)) {
    next = Math.max(1, next - 1);
  }
  return next;
}

function buildRaidModifiers(raidBoons = []) {
  return (raidBoons || []).reduce(
    (acc, boon) => {
      if (!boon) return acc;
      acc.partySizeDelta += boon.partySizeDelta || 0;
      acc.scoutRevealBonus += boon.scoutRevealBonus || 0;
      acc.starBias += boon.starBias || 0;
      acc.atkMult *= boon.atkMult || 1;
      acc.lureBoost += boon.lureBoost || 0;
      return acc;
    },
    { partySizeDelta: 0, scoutRevealBonus: 0, starBias: 0, atkMult: 1, lureBoost: 0 }
  );
}

function getDoctrineEffects(doctrines = {}) {
  const trap = doctrines?.trap || 0;
  const monster = doctrines?.monster || 0;
  const utility = doctrines?.utility || 0;
  const core = doctrines?.core || 0;
  return {
    trapFlatDamage: trap >= 1 ? 2 : 0,
    trapChargeBonus: trap >= 2 ? 1 : 0,
    trapCooldownReduction: trap >= 3 ? 1 : 0,
    monsterAtkBonus: monster >= 1 ? 1 : 0,
    monsterHpBonus: monster >= 2 ? 3 : 0,
    monsterRoomCapBonus: monster >= 3 ? 1 : 0,
    utilityPotencyBonus: utility >= 1 ? 1 : 0,
    utilityScoutBonus: utility >= 2 ? 1 : 0,
    utilityPotencyBonusExtra: utility >= 3 ? 1 : 0,
    coreMaxHpBonus: core >= 1 ? 25 : 0,
    coreShieldBonus: core >= 2 ? 5 : 0,
    dungeonlordAtkBonus: core >= 3 ? 2 : 0,
  };
}

function raidTypeMeta(raidType, councilRaid = null) {
  if (raidType === "council" && councilRaid) {
    return {
      label: councilRaid.label,
      desc: `${RAID_TYPE_META.council.desc} ${councilRaid.desc}. ${councilRaid.modifierText}`,
    };
  }
  return RAID_TYPE_META[raidType || "normal"] || RAID_TYPE_META.normal;
}

function getCoreMaxHp(stateLike) {
  const doctrineEffects = getDoctrineEffects(stateLike?.doctrines || {});
  return CORE_MAX_HP + doctrineEffects.coreMaxHpBonus;
}

function rollPassiveCount(stars) {
  switch (clampMonsterStar(stars)) {
    case 1:
      return Math.random() < 0.55 ? 0 : 1;
    case 2:
      return 1;
    case 3:
      return Math.random() < 0.5 ? 1 : 2;
    case 4:
      return 2;
    default:
      return Math.random() < 0.55 ? 2 : 3;
  }
}

function createPassiveRanks(passiveKeys = [], existingRanks = {}) {
  const ranks = {};
  for (const key of passiveKeys) {
    ranks[key] = Math.max(1, existingRanks[key] || 1);
  }
  return ranks;
}

function passiveRankLabel(rank) {
  const numerals = ["I", "II", "III", "IV", "V"];
  return numerals[Math.max(0, Math.min(rank, numerals.length) - 1)] || `${rank}`;
}

function formatMonsterPassiveList(passiveKeys = [], passiveRanks = {}) {
  if (!Array.isArray(passiveKeys) || passiveKeys.length === 0) return "None";
  return passiveKeys
    .map((key) => {
      const name = MONSTER_PASSIVE_MAP[key]?.name || key;
      const rank = passiveRanks[key] || 1;
      return rank > 1 ? `${name} ${passiveRankLabel(rank)}` : name;
    })
    .join(", ");
}

function normalizePassiveKeysForMonster(monster) {
  if (!monster) return [];
  if (Array.isArray(monster.passiveKeys) && monster.passiveKeys.length > 0) {
    return Array.from(new Set(monster.passiveKeys.filter(Boolean)));
  }
  if (monster.passiveKey) return [monster.passiveKey];
  const keys = String(monster.passive || "")
    .split(",")
    .map((part) => part.trim())
    .map((part) => MONSTER_PASSIVE_RULES.find((rule) => part.startsWith(rule.name))?.key)
    .filter(Boolean);
  return Array.from(new Set(keys));
}

function monsterEvolutionStageValue(monster) {
  const raw = Number.isFinite(monster?.evolutionStage) ? monster.evolutionStage : monster?.evolution || 0;
  return clamp(raw, 0, MAX_EVOLUTION_STAGE);
}

function monsterEvolutionCost(monster) {
  if (!monster || !MONSTERS[monster.key]) return null;
  const stage = monsterEvolutionStageValue(monster);
  if (stage >= MAX_EVOLUTION_STAGE) return null;
  return EVOLUTION_COSTS[stage] || null;
}

function monsterCanEvolve(monster, globalEvolution = 0) {
  const cost = monsterEvolutionCost(monster);
  if (cost === null) return false;
  const personal = Math.max(0, monster?.evoPoints || 0);
  return personal + Math.max(0, globalEvolution || 0) >= cost;
}

function defaultBranchClass(monster) {
  if (monster?.branchClass && BRANCH_PASSIVE_BY_CLASS[monster.branchClass]) return monster.branchClass;
  if (monster?.class && BRANCH_PASSIVE_BY_CLASS[monster.class]) return monster.class;
  const passiveKeys = normalizePassiveKeysForMonster(monster);
  const reverse = Object.entries(BRANCH_PASSIVE_BY_CLASS).find(([, passiveKey]) => passiveKeys.includes(passiveKey));
  return reverse?.[0] || MONSTER_EVOLUTION_BRANCHES[0];
}

function monsterBaseDef(base) {
  if (!base) return 0;
  if (Number.isFinite(base.def)) return Math.max(0, base.def);
  return Math.max(0, Math.round(base.hp / 12 + base.atk / 6 - 1));
}

function buildMonsterStats(kind, stars, evolutionStage = 0) {
  const base = MONSTERS[kind];
  if (!base) {
    return { maxHp: 1, atk: 1, def: 0 };
  }
  const mult = monsterStarMultiplier(stars);
  const stage = clamp(evolutionStage || 0, 0, MAX_EVOLUTION_STAGE);
  const stats = {
    maxHp: Math.max(1, Math.round(base.hp * mult)),
    atk: Math.max(1, Math.round(base.atk * mult)),
    def: Math.max(0, Math.round(monsterBaseDef(base) * mult)),
  };
  if (stage > 0) {
    stats.maxHp += stage * 4;
    stats.atk += stage * 2;
    stats.def += Math.floor((stage + 1) / 2);
  }
  return stats;
}

function rebuildMonsterEntity(monster, overrides = {}, options = {}) {
  const merged = { ...monster, ...overrides };
  const stars = clampMonsterStar(merged.stars);
  const evolutionStage = monsterEvolutionStageValue(merged);
  const passiveKeys = normalizePassiveKeysForMonster(merged);
  const passiveRanks = createPassiveRanks(passiveKeys, merged.passiveRanks || {});
  const stats = buildMonsterStats(merged.key, stars, evolutionStage);
  const priorMaxHp = Math.max(1, merged.stats?.maxHp || merged.hp || stats.maxHp);
  const healed = !!options.healToFull;
  const hp = healed ? stats.maxHp : Math.max(1, Math.min(stats.maxHp, merged.hp || stats.maxHp));
  return {
    ...merged,
    stars,
    stats,
    hp: hp > 0 ? hp : Math.max(1, Math.round((merged.hp || priorMaxHp) / priorMaxHp * stats.maxHp)),
    atk: stats.atk,
    def: stats.def,
    passiveKey: passiveKeys[0] || null,
    passiveKeys,
    passiveRanks,
    passive: formatMonsterPassiveList(passiveKeys, passiveRanks),
    evolutionStage,
    evolution: evolutionStage,
    branchClass: evolutionStage > 0 ? defaultBranchClass(merged) : merged.branchClass || null,
  };
}

function spendEvolutionPoints(personalPoints, globalPoints, cost) {
  const personalSpend = Math.min(Math.max(0, personalPoints || 0), cost);
  const remaining = cost - personalSpend;
  const globalSpend = Math.min(Math.max(0, globalPoints || 0), remaining);
  if (personalSpend + globalSpend < cost) return null;
  let source = "personal";
  if (personalSpend > 0 && globalSpend > 0) source = "mixed";
  else if (globalSpend > 0) source = "global";
  return {
    personalLeft: Math.max(0, (personalPoints || 0) - personalSpend),
    globalLeft: Math.max(0, (globalPoints || 0) - globalSpend),
    personalSpend,
    globalSpend,
    source,
  };
}

function trapChargesForStar(star, doctrineEffects = null) {
  return 1 + Math.floor((clampMonsterStar(star) - 1) / 2) + (doctrineEffects?.trapChargeBonus || 0);
}

function trapCooldownAfterTrigger(trapType, star, doctrineEffects = null) {
  const baseCooldown = TRAP_MAP[trapType]?.baseCooldown ?? 1;
  return Math.max(0, baseCooldown - Math.floor((clampMonsterStar(star) - 1) / 2) - (doctrineEffects?.trapCooldownReduction || 0));
}

function scaleStat(base, stars) {
  return Math.max(1, Math.round(base * monsterStarMultiplier(stars)));
}

function heroRaidStatMultiplier(raidType) {
  if (raidType === "elite") return 1.2;
  if (raidType === "council") return 1.35;
  return 1;
}

function buildHeroStats(stars, raidType) {
  const safeStars = clampMonsterStar(stars);
  const raidMult = heroRaidStatMultiplier(raidType);
  return {
    maxHp: Math.max(1, Math.round(scaleStat(HERO_BASE.hp, safeStars) * raidMult)),
    atk: Math.max(1, Math.round(scaleStat(HERO_BASE.atk, safeStars) * raidMult)),
    def: Math.max(0, Math.floor(safeStars / 2)),
    shd: Math.max(0, safeStars - 2),
    spd: Math.max(1, 2 + safeStars),
  };
}

function normalizeHeroEntity(hero, day = 1, raidType = null) {
  const safeDay = Math.max(1, day || 1);
  const stars = Math.min(clampMonsterStar(hero?.stars || 1), monsterStarCapForDay(safeDay));
  const stats = buildHeroStats(stars, raidType);
  const previousMaxHp = Math.max(1, hero?.stats?.maxHp ?? hero?.hp ?? stats.maxHp);
  const hpRatio = clamp((hero?.hp ?? previousMaxHp) / previousMaxHp, 0, 1);
  const heroPassiveKey = normalizeHeroPassiveKey(hero?.heroPassiveKey || hero?.passive);
  const archetypeKey = HERO_ARCHETYPE_RULES[hero?.archetypeKey]
    ? hero.archetypeKey
    : pickHeroArchetypeKey(hero?.class, heroPassiveKey, raidType);
  return {
    ...hero,
    id: Number.isFinite(hero?.id) ? hero.id : 1,
    x: Number.isFinite(hero?.x) ? hero.x : 0,
    y: Number.isFinite(hero?.y) ? hero.y : 0,
    hp: Math.max(1, Math.round(stats.maxHp * hpRatio)),
    atk: stats.atk,
    def: stats.def,
    shd: stats.shd,
    spd: stats.spd,
    race: hero?.race || HERO_RACES[0],
    class: hero?.class || HERO_CLASSES[0],
    stars,
    passive: hero?.passive || HERO_PASSIVE_MAP[heroPassiveKey]?.name || HERO_PASSIVES[0],
    heroPassiveKey,
    archetypeKey,
    archetypeLabel: getHeroArchetypeRule(archetypeKey).name,
    unitKind: hero?.unitKind || "hero",
    factionKey: hero?.factionKey || null,
    factionName: hero?.factionName || null,
    raidOriginLabel: hero?.raidOriginLabel || null,
    traitPassiveKey: hero?.traitPassiveKey || null,
    traitPassiveName: hero?.traitPassiveName || null,
    stats,
    name: hero?.name || `${HERO_NAMES[0]} the ${hero?.class || HERO_CLASSES[0]}`,
    statuses: hero?.statuses || {},
    memory: hero?.memory || { danger: {}, lastIntent: null },
    counters: {
      stunnedOnce: false,
      siphonGained: 0,
      tookDamageThisRaid: false,
      cursedMark: 0,
      wardedUsed: false,
      resoluteUsed: false,
      stoicUsed: false,
      ...(hero?.counters || {}),
    },
  };
}

function generateHero(id, entrancePos, turnsSurvived, raidType, day = 1, options = {}) {
  const classPool = options.classPool || HERO_CLASSES;
  const passivePool = options.passivePool || HERO_PASSIVE_RULES;
  const racePool = options.racePool || HERO_RACES;
  const passiveRule = pickHeroPassiveRule(passivePool);
  const heroClass = pick(classPool);
  const archetypeKey = options.archetypeKey || pickHeroArchetypeKey(heroClass, passiveRule.key, raidType);
  const stars = applyRaidStarBias(rollAuthoritativeStar(day), day, raidType, options.starBias || 0);
  const race = pick(racePool);
  const name = `${pick(HERO_NAMES)} the ${heroClass}`;
  const stats = buildHeroStats(stars, raidType);

  return {
    id,
    x: entrancePos.x,
    y: entrancePos.y,
    hp: stats.maxHp,
    atk: stats.atk,
    def: stats.def,
    shd: stats.shd,
    spd: stats.spd,
    prev: null,
    race,
    class: heroClass,
    stars,
    passive: passiveRule.name,
    heroPassiveKey: passiveRule.key,
    archetypeKey,
    archetypeLabel: getHeroArchetypeRule(archetypeKey).name,
    unitKind: "hero",
    factionKey: null,
    factionName: null,
    raidOriginLabel: raidTypeMeta(raidType).label,
    traitPassiveKey: null,
    traitPassiveName: null,
    stats,
    name,
    statuses: {},
    memory: { danger: {}, lastIntent: null },
    counters: {
      stunnedOnce: false,
      siphonGained: 0,
      tookDamageThisRaid: false,
      cursedMark: 0,
      wardedUsed: false,
      resoluteUsed: false,
      stoicUsed: false,
    },
  };
}

function generateCouncilRaider(id, entrancePos, turnsSurvived, day = 1, councilRaid = null, raidBoons = []) {
  const attackers = councilRaid?.attackers?.length ? councilRaid.attackers : [{ key: "malachar", memberName: "The Council" }];
  const attacker = attackers[(id - 1) % attackers.length];
  const faction = COUNCIL_RAID_FACTIONS[attacker.key] || COUNCIL_RAID_FACTIONS.malachar;
  const raidMods = buildRaidModifiers(raidBoons);
  const monsterKey = pick(faction.monsterPool);
  const monsterBase = MONSTERS[monsterKey] || MONSTERS.goblin;
  const className = pick(faction.classPool.filter(Boolean).length ? faction.classPool : MONSTER_CLASS_RULES[monsterKey] || MONSTER_ARCHETYPES);
  const traitPassiveKey = pick(faction.passiveBias.filter(Boolean).length ? faction.passiveBias : MONSTER_PASSIVES);
  const passiveRule = pickHeroPassiveRule(HERO_PASSIVE_RULES);
  const archetypeKey = pick(faction.archetypes?.length ? faction.archetypes : Object.keys(HERO_ARCHETYPE_RULES));
  const stars = applyRaidStarBias(rollAuthoritativeStar(day), day, "council", raidMods.starBias || 0);
  const monsterStats = buildMonsterStats(monsterKey, stars, 0);
  const stats = {
    maxHp: Math.max(1, Math.round(monsterStats.maxHp * (faction.statBias?.hp || 1))),
    atk: Math.max(1, Math.round(monsterStats.atk * (faction.statBias?.atk || 1) * (raidMods.atkMult || 1))),
    def: Math.max(0, Math.round((monsterStats.def || 0) * (faction.statBias?.def || 1))),
    shd: Math.max(0, Math.floor(stars / 2)),
    spd: Math.max(1, 2 + stars + (archetypeKey === "scout" ? 1 : 0)),
  };
  return {
    id,
    x: entrancePos.x,
    y: entrancePos.y,
    hp: stats.maxHp,
    atk: stats.atk,
    def: stats.def,
    shd: stats.shd,
    spd: stats.spd,
    prev: null,
    race: monsterBase.name,
    class: className,
    stars,
    passive: `${passiveRule.name} / ${MONSTER_PASSIVE_MAP[traitPassiveKey]?.name || "Faction Trait"}`,
    heroPassiveKey: passiveRule.key,
    archetypeKey,
    archetypeLabel: getHeroArchetypeRule(archetypeKey).name,
    unitKind: "council-raider",
    factionKey: attacker.key,
    factionName: attacker.memberName,
    raidOriginLabel: councilRaid?.label || RAID_TYPE_META.council.label,
    traitPassiveKey,
    traitPassiveName: MONSTER_PASSIVE_MAP[traitPassiveKey]?.name || "Faction Trait",
    stats,
    name: `${attacker.memberName.split(" ")[0]} ${monsterBase.name}`,
    statuses: {},
    memory: { danger: {}, lastIntent: null },
    counters: {
      stunnedOnce: false,
      siphonGained: 0,
      tookDamageThisRaid: false,
      cursedMark: 0,
      wardedUsed: false,
      resoluteUsed: false,
      stoicUsed: false,
    },
  };
}

function generateMonster(kind, turnsSurvived, starCap, day = 1) {
  const base = MONSTERS[kind];
  const stars = rollAuthoritativeStar(day, starCap);
  const passiveKeys = pickUnique(MONSTER_PASSIVES, rollPassiveCount(stars));
  const passiveRanks = createPassiveRanks(passiveKeys);
  let archetype = pick(MONSTER_ARCHETYPES);
  let affinity = null;
  if (MONSTER_AFFINITY_RULES[kind]) {
    affinity = pick(MONSTER_AFFINITY_RULES[kind]);
    archetype = `${affinity} Affinity`;
  } else if (MONSTER_CLASS_RULES[kind]) {
    archetype = pick(MONSTER_CLASS_RULES[kind]);
  }
  const stats = buildMonsterStats(kind, stars, 0);
  const name = `${pick(MONSTER_TITLES)} ${base.name}`;

  return {
    key: base.key,
    name,
    icon: base.icon,
    hp: stats.maxHp,
    atk: stats.atk,
    def: stats.def,
    race: base.name,
    class: archetype,
    stars,
    passive: formatMonsterPassiveList(passiveKeys, passiveRanks),
    passiveKey: passiveKeys[0] || null,
    passiveKeys,
    passiveRanks,
    stats,
    affinity,
    evoPoints: 0,
    evolutionStage: 0,
    evolution: 0,
    branchClass: null,
    foughtThisRaid: false,
    shieldedThisTurn: false,
  };
}

function initMonsterInventory(turnsSurvived, count = 4, starCap, day = 1) {
  return Array.from({ length: count }, () => generateMonster(pick(MONSTER_KEYS), turnsSurvived, starCap, day));
}

function generateHeroParty(turnsSurvived, raidType, day = 1, options = {}) {
  const raidMods = buildRaidModifiers(options.raidBoons || []);
  const baseSize = DAY_START_PARTY_MIN + Math.floor(Math.random() * (DAY_START_PARTY_MAX - DAY_START_PARTY_MIN + 1));
  const eliteBonus = raidType === "elite" ? 1 : 0;
  const size = Math.max(1, baseSize + eliteBonus + (raidMods.partySizeDelta || 0));
  const basePos = { x: 0, y: 0 };
  const party = [];
  let nextId = 1;
  const eliteOptions =
    raidType === "elite"
      ? {
          classPool: ["Warrior", "Ranger", "Cleric", "Monk", "Warrior", "Ranger"],
          passivePool: ["Brave", "Stoic", "Focused", "Warded", "Quick", "Unyielding"],
          starBias: 0.35 + (raidMods.starBias || 0),
        }
      : {
          starBias: raidMods.starBias || 0,
        };
  for (let i = 0; i < size; i++) {
    const hero = generateHero(nextId, basePos, turnsSurvived, raidType, day, eliteOptions);
    party.push(hero);
    nextId += 1;
  }
  return party;
}

function generateRaidParty(turnsSurvived, raidType, day = 1, options = {}) {
  if (raidType === "council") {
    const raidMods = buildRaidModifiers(options.raidBoons || []);
    const baseSize = DAY_START_PARTY_MIN + Math.floor(Math.random() * (DAY_START_PARTY_MAX - DAY_START_PARTY_MIN + 1));
    const size = Math.max(1, baseSize + 1 + (raidMods.partySizeDelta || 0));
    const basePos = { x: 0, y: 0 };
    return Array.from({ length: size }, (_, idx) =>
      generateCouncilRaider(idx + 1, basePos, turnsSurvived, day, options.councilRaid, options.raidBoons || [])
    );
  }
  return generateHeroParty(turnsSurvived, raidType, day, options);
}

function generateTraderStock(turnsSurvived, day = 1) {
  const count = 3;
  return Array.from({ length: count }, () => generateMonster(pick(MONSTER_KEYS), turnsSurvived, undefined, day));
}

function generateArtifactStock() {
  return pickUnique(ARTIFACTS, 3).map((a) => ({ ...a }));
}

function monsterRoomCap(tier) {
  return BASE_MONSTER_ROOM_CAP + Math.max(0, (tier || 1) - 1);
}

function applyMonsterRoomPlacementStatic(monster, roomType, roomTier = 1) {
  const m = {
    ...monster,
    stats: {
      ...(monster.stats || {
        maxHp: monster.hp || 1,
        atk: monster.atk || 1,
        def: monster.def || 0,
      }),
    },
  };
  if (!roomType) return m;
  const tierBonus = Math.max(0, roomTier - 1);
  if (roomType === "training-den") {
    m.atk += 1 + tierBonus;
    m.stats.atk = m.atk;
  } else if (roomType === "thick-hide") {
    const delta = 3 + tierBonus * 2;
    m.stats.maxHp = (m.stats.maxHp || m.hp || 1) + delta;
    m.hp = Math.min(m.stats.maxHp, (m.hp || m.stats.maxHp) + delta);
  }
  return m;
}

function normalizeMonsterEntity(monster, roomType, roomTier = 1) {
  if (!monster || !MONSTERS[monster.key]) return monster;
  const stage = monsterEvolutionStageValue(monster);
  const branchClass = stage > 0 ? defaultBranchClass(monster) : monster.branchClass || null;
  let normalized = rebuildMonsterEntity(
    {
      ...monster,
      stars: clampMonsterStar(monster.stars),
      evolutionStage: stage,
      evolution: stage,
      branchClass,
    },
    {},
    { healToFull: false }
  );
  if (roomType) {
    normalized = applyMonsterRoomPlacementStatic(normalized, roomType, roomTier);
  }
  normalized.hp = Math.max(1, Math.min(normalized.stats.maxHp, monster.hp || normalized.stats.maxHp));
  normalized.foughtThisRaid = !!monster.foughtThisRaid;
  normalized.shieldedThisTurn = !!monster.shieldedThisTurn;
  normalized.evoPoints = Math.max(0, monster.evoPoints || 0);
  return normalized;
}

function calcArtifactMods(artifacts, day = 1) {
  const mods = {
    essenceOnKill: 0,
    soulshardOnKill: 0,
    monsterAtk: 0,
    trapMult: 0,
    coreDamageReduction: 0,
  };
  const effectMult = dayMultiplier(day, 0.015, 1.6);
  for (const art of artifacts || []) {
    if (!art || !art.mods) continue;
    for (const [key, val] of Object.entries(art.mods)) {
      if (typeof val === "number") {
        mods[key] = (mods[key] || 0) + (key === "trapMult" ? val * effectMult : Math.round(val * effectMult));
      } else {
        mods[key] = (mods[key] || 0) + val;
      }
    }
  }
  return mods;
}

function initStartingGrid() {
  const grid = makeGrid();
  grid[0][0].entrance = true;
  const room = grid[0][1];
  room.room = "monster";
  room.roomType = MONSTER_ROOMS[0].key;
  room.roomTier = 1;
  room.monsters = [];
  grid[0][2].core = true;
  return grid;
}

function makeTile() {
  return {
    entrance: false,
    core: false,
    room: null, // "trap" | "monster" | null
    roomType: null,
    roomTier: 1,
    trap: false,
    trapType: null,
    trapStar: 1,
    trapStars: 1,
    trapRank: 1,
    trapChargesRemaining: 0,
    trapCooldownRemaining: 0,
    trapBroken: false,
    ambushUsed: false,
    monsters: [], // {key,name,icon,hp,atk}
  };
}

function makeGrid() {
  return Array.from({ length: H }, () => Array.from({ length: W }, () => makeTile()));
}

function cloneGrid(grid) {
  return grid.map((row) =>
    row.map((t) => ({
      entrance: t.entrance,
      core: t.core,
      room: t.room,
      roomType: t.roomType,
      roomTier: t.roomTier ?? 1,
      trap: t.trap,
      trapType: t.trapType,
      trapStar: t.trapStar ?? t.trapStars ?? 1,
      trapStars: t.trapStars,
      trapRank: t.trapRank ?? t.roomTier ?? 1,
      trapChargesRemaining: t.trapChargesRemaining ?? (t.trap ? trapChargesForStar(t.trapStar ?? t.trapStars ?? 1) : 0),
      trapCooldownRemaining: t.trapCooldownRemaining ?? 0,
      trapBroken: t.trapBroken,
      ambushUsed: t.ambushUsed,
      monsters: t.monsters.map((m) => ({ ...m })),
    }))
  );
}

function keyOf(x, y) {
  return `${x},${y}`;
}

function neighbors(x, y) {
  const pts = [];
  if (x > 0) pts.push({ x: x - 1, y });
  if (x < W - 1) pts.push({ x: x + 1, y });
  if (y > 0) pts.push({ x, y: y - 1 });
  if (y < H - 1) pts.push({ x, y: y + 1 });
  return pts;
}

function inAuraRange(ax, ay, bx, by) {
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by)) <= 1;
}

function utilityTier(grid, x, y, key) {
  let tier = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
      const t = grid[ny][nx];
      if (t.room === "utility" && t.roomType === key) {
        tier = Math.max(tier, t.roomTier || 1);
      }
    }
  }
  return tier;
}

function hasUtilityAura(grid, x, y, key) {
  return utilityTier(grid, x, y, key) > 0;
}

function tileWalkable(t) {
  return t.entrance || t.core || t.room === "trap" || t.room === "monster";
}

function findEntranceAndCore(grid) {
  let entrance = null;
  let core = null;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (grid[y][x].entrance) entrance = { x, y };
      if (grid[y][x].core) core = { x, y };
    }
  }
  return { entrance, core };
}

function countRooms(grid) {
  let n = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (grid[y][x].room) n++;
    }
  }
  return n;
}

function validateDungeon(grid) {
  const { entrance, core } = findEntranceAndCore(grid);
  if (!entrance) return { ok: false, reason: "Entrance not placed." };
  if (!core) return { ok: false, reason: "Core not placed." };

  const q = [entrance];
  const seen = new Set([keyOf(entrance.x, entrance.y)]);
  while (q.length) {
    const cur = q.shift();
    if (cur.x === core.x && cur.y === core.y) return { ok: true, reason: "" };

    for (const p of neighbors(cur.x, cur.y)) {
      if (seen.has(keyOf(p.x, p.y))) continue;
      if (!tileWalkable(grid[p.y][p.x])) continue;
      seen.add(keyOf(p.x, p.y));
      q.push(p);
    }
  }
  return { ok: false, reason: "No valid path from Entrance to Core." };
}

function aStarPath(grid, start, goal) {
  const heuristic = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  const openSet = [{ pos: start, f: heuristic(start, goal), g: 0, parent: null }];
  const closedSet = new Set();
  const openMap = new Map();
  openMap.set(keyOf(start.x, start.y), openSet[0]);

  while (openSet.length > 0) {
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift();
    openMap.delete(keyOf(current.pos.x, current.pos.y));

    if (current.pos.x === goal.x && current.pos.y === goal.y) {
      const path = [];
      let node = current;
      while (node) {
        path.unshift(node.pos);
        node = node.parent;
      }
      return path;
    }

    closedSet.add(keyOf(current.pos.x, current.pos.y));

    for (const neighbor of neighbors(current.pos.x, current.pos.y)) {
      if (!tileWalkable(grid[neighbor.y][neighbor.x])) continue;
      const key = keyOf(neighbor.x, neighbor.y);
      if (closedSet.has(key)) continue;

      const g = current.g + 1;
      const h = heuristic(neighbor, goal);
      const f = g + h;

      const existing = openMap.get(key);
      if (!existing || g < existing.g) {
        const node = { pos: neighbor, f, g, parent: current };
        if (existing) {
          existing.g = g;
          existing.f = f;
          existing.parent = current;
        } else {
          openSet.push(node);
          openMap.set(key, node);
        }
      }
    }
  }
  return null;
}

function pathDistance(grid, start, goal) {
  const path = aStarPath(grid, start, goal);
  return path ? Math.max(0, path.length - 1) : Number.POSITIVE_INFINITY;
}

function trapThreatScore(tile) {
  if (!tile || tile.room !== "trap" || !tile.trap || tile.trapBroken) return 0;
  const trap = TRAP_MAP[tile.trapType];
  const star = clampMonsterStar(tile.trapStar ?? tile.trapStars ?? 1);
  const rank = Math.max(1, tile.trapRank ?? tile.roomTier ?? 1);
  const base = trap?.baseDmg || 0;
  return Math.max(1, Math.round(base * (1 + 0.25 * (star - 1)) + (rank - 1) * 2));
}

function tileThreatScore(grid, x, y) {
  const tile = grid[y]?.[x];
  if (!tile) return 0;
  let threat = 0;
  if (tile.room === "trap") {
    threat += trapThreatScore(tile);
    if ((tile.trapCooldownRemaining || 0) > 0) threat *= 0.5;
  }
  if (tile.room === "monster") {
    const monsters = tile.monsters || [];
    threat += monsters.reduce((sum, monster) => sum + Math.max(1, monster.atk || 0), 0);
    threat += monsters.length * 2;
  }
  if (tile.room === "utility") {
    if (tile.roomType === "fear-idol") threat += 2;
    if (tile.roomType === "ward-lantern") threat += 1;
  }
  return threat;
}

function branchLureScore(grid, start, corePos, maxDepth = 4) {
  const seen = new Set([keyOf(start.x, start.y)]);
  const queue = [{ ...start, depth: 0 }];
  let value = 0;
  const directDist = pathDistance(grid, start, corePos);
  while (queue.length > 0) {
    const cur = queue.shift();
    const tile = grid[cur.y]?.[cur.x];
    if (!tile) continue;
    if (tile.room === "trap") value += 3;
    else if (tile.room === "monster") value += 4 + Math.min(3, tile.monsters?.length || 0);
    else if (tile.room === "utility") value += 2;
    if (cur.depth >= maxDepth) continue;
    for (const next of neighbors(cur.x, cur.y)) {
      if (!tileWalkable(grid[next.y][next.x])) continue;
      const nextKey = keyOf(next.x, next.y);
      if (seen.has(nextKey)) continue;
      const coreDist = pathDistance(grid, next, corePos);
      if (coreDist > directDist + 3) continue;
      seen.add(nextKey);
      queue.push({ ...next, depth: cur.depth + 1 });
    }
  }
  return value;
}

function invaderLabel(entity) {
  if (!entity) return "Invader";
  if (entity.unitKind === "council-raider") {
    const prefix = entity.factionName ? entity.factionName.split(" ")[0] : "Raider";
    return `${prefix}#${entity.id}`;
  }
  if (entity.raidOriginLabel === RAID_TYPE_META.elite.label) return `Elite#${entity.id}`;
  return `Hero#${entity.id}`;
}

function invaderPassiveSummary(entity) {
  if (!entity) return "None";
  if (entity.unitKind === "council-raider" && entity.traitPassiveName) {
    return String(entity.passive || "").includes(entity.traitPassiveName)
      ? entity.passive
      : `${entity.passive || "None"} | Faction Trait ${entity.traitPassiveName}`;
  }
  return entity.passive || "None";
}

function chooseInvaderMove(entity, grid, corePos, raidBoons = [], doctrineEffects = {}) {
  if (!entity || !corePos) return { next: null, options: [], intent: "No path" };
  const archetype = getHeroArchetypeRule(entity.archetypeKey);
  const current = { x: entity.x, y: entity.y };
  const currentCoreDist = pathDistance(grid, current, corePos);
  const raidMods = buildRaidModifiers(raidBoons);
  const options = neighbors(entity.x, entity.y)
    .filter((next) => tileWalkable(grid[next.y][next.x]))
    .map((next) => {
      const tile = grid[next.y][next.x];
      const coreDist = pathDistance(grid, next, corePos);
      if (!Number.isFinite(coreDist)) return null;
      const threat = tileThreatScore(grid, next.x, next.y) + (entity.memory?.danger?.[keyOf(next.x, next.y)] || 0);
      const lure = branchLureScore(grid, next, corePos) + (raidMods.lureBoost || 0) + (doctrineEffects.utilityScoutBonus || 0);
      const roomBias =
        (tile.room === "trap" ? archetype.weights.trap : 0) +
        (tile.room === "monster" ? archetype.weights.monster : 0) +
        (tile.room === "utility" ? archetype.weights.utility : 0);
      const progress = Number.isFinite(currentCoreDist) ? currentCoreDist - coreDist : 0;
      const backtrackPenalty = entity.prev && entity.prev.x === next.x && entity.prev.y === next.y ? archetype.weights.backtrack : 0;
      const score = progress * archetype.weights.core + lure * archetype.weights.lure + roomBias - threat * archetype.weights.danger - backtrackPenalty;
      const intent =
        tile.core
          ? "Press Core"
          : tile.room === "monster"
          ? "Pressure monster room"
          : tile.room === "trap"
          ? "Force the trap line"
          : tile.room === "utility"
          ? "Disrupt support"
          : "Advance";
      return { next, tile, score, threat, lure, coreDist, intent };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.coreDist - b.coreDist);
  const best = options[0] || null;
  return {
    next: best?.next || null,
    options,
    intent: best ? best.intent : "Hold position",
  };
}

function anyUtilityRoom(grid, key) {
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const t = grid[y][x];
      if (t.room === "utility" && t.roomType === key) return true;
    }
  }
  return false;
}

function maxUtilityTier(grid, key) {
  let tier = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const t = grid[y][x];
      if (t.room === "utility" && t.roomType === key) {
        tier = Math.max(tier, t.roomTier || 1);
      }
    }
  }
  return tier;
}

function addLog(state, msg) {
  const log = [msg, ...state.log].slice(0, 90);
  return { ...state, log };
}

function resetLayoutKeepStructure(grid) {
  const g = cloneGrid(grid);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const t = g[y][x];
      t.roomTier = t.roomTier || 1;
      if (t.room === "trap") {
        t.trap = true;
        t.trapStar = t.trapStar || t.trapStars || 1;
        t.trapStars = t.trapStar;
        t.trapRank = t.trapRank || t.roomTier || 1;
        t.trapChargesRemaining = trapChargesForStar(t.trapStar);
        t.trapCooldownRemaining = 0;
        t.trapBroken = false;
        t.monsters = [];
      } else if (t.room === "monster") {
        t.trap = false;
        t.trapStar = 1;
        t.trapStars = 1;
        t.trapRank = 1;
        t.trapChargesRemaining = 0;
        t.trapCooldownRemaining = 0;
        t.ambushUsed = false;
        t.monsters = [];
      } else {
        t.trap = false;
        t.trapStar = 1;
        t.trapStars = 1;
        t.trapRank = 1;
        t.trapChargesRemaining = 0;
        t.trapCooldownRemaining = 0;
        t.trapBroken = false;
        t.ambushUsed = false;
        t.monsters = [];
      }
    }
  }
  return g;
}

export default function App() {
  const [activeTab, setActiveTab] = useState("dungeon"); // "dungeon" | "toolbox" | "log"
  const [sidePanel, setSidePanel] = useState("log"); // "log" | "inventory" | "evolution" | "glossary" | "council"
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [councilScreenOpen, setCouncilScreenOpen] = useState(false);
  const [focusedCouncilKey, setFocusedCouncilKey] = useState(null);
  const [fuseA, setFuseA] = useState("");
  const [fuseB, setFuseB] = useState("");
  const [sacrificeIdx, setSacrificeIdx] = useState("");
function defaultState() {
    const startingParty = generateRaidParty(0, null, 1);
    const dailyEvent = rollDailyEvent();
    const traderStock = generateTraderStock(0, 1);
    const shadyStock = generateArtifactStock();
    const grid = initStartingGrid();
    let invMonsters = initMonsterInventory(0, 2, 2, 1);
    const starterRoom = grid[0]?.[1];
    if (starterRoom && starterRoom.room === "monster") {
      starterRoom.monsters = invMonsters.map((m) => ({ ...m }));
      invMonsters = [];
    }
    return {
      grid,
      selected: { x: 0, y: 0 },
      currency: {
        soulshards: 30,
        evolution: 0,
        dominion: 0,
        essence: 10,
        darkcrystals: 0,
      },
      doctrines: {
        trap: 0,
        monster: 0,
        utility: 0,
        core: 0,
      },
      artifacts: [],
      shadyStock,
      coreHp: getCoreMaxHp({ doctrines: { trap: 0, monster: 0, utility: 0, core: 0 } }),
      coreShield: 0,
      fleshMarketUntilDay: 0,
      heroes: [],
      nextHeroId: 1,
      invMonsters,
      log: ["Day 1 begins. Build phase skipped. Prepare for the raid."],
      raidActive: false,
      raidRemaining: 0, // heroes left to spawn in THIS raid
      raidStartTurn: 0,
      raidStartEssence: 0,
      raidStartShards: 30,
      raidStartCoreHp: getCoreMaxHp({ doctrines: { trap: 0, monster: 0, utility: 0, core: 0 } }),
      raidKills: 0,
      raidType: null,
      lastRaidReport: null,
      turnsSurvived: 0,
      day: 1,
      phase: "battle",
      currentParty: startingParty,
      currentPartyRaidType: null,
      partyQueue: startingParty.map((h) => ({ ...h })),
      dailyEvent,
      traderStock,
      dpRegenCounter: 0,
      dominionEffects: {
        monsterAtk: 0,
        monsterFirstStrike: false,
        pulsePending: false,
      },
      council: {
        active: false,
        day: null,
        roster: [],
        lastRoster: [],
        declinedStreak: 0,
      },
      councilFavor: {},
      councilSession: null,
      councilQuest: null,
      nextRaidType: null,
      pendingPunitiveRaid: false,
      pendingCouncilRaid: null,
      nextRaidBoons: [],
      activeRaidBoons: [],
      dungeonLevel: 1,
      selectedTrapType: TRAP_TYPES[0].key,
      selectedMonsterRoomType: MONSTER_ROOMS[0].key,
      selectedUtilityRoomType: UTILITY_ROOMS[0].key,
      scoutQueue: [],
      evolutionOffer: null,
      movePayload: null,
    };
  }

  function loadSavedState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed) return null;
      const base = defaultState();
      const normalizeGrid = (rawGrid) => {
        if (!Array.isArray(rawGrid) || rawGrid.length !== H) return base.grid;
        const next = base.grid.map((row, y) => {
          if (!Array.isArray(rawGrid[y]) || rawGrid[y].length !== W) return row;
          return row.map((cell, x) => {
            const rawCell = rawGrid[y][x] || {};
            const trapStar = clampMonsterStar(rawCell.trapStar ?? rawCell.trapStars ?? cell.trapStar);
            const trapRank = Math.max(1, rawCell.trapRank ?? rawCell.roomTier ?? cell.trapRank);
            const roomType = rawCell.roomType || cell.roomType;
            const roomTier = rawCell.roomTier ?? cell.roomTier ?? 1;
            const monsters = Array.isArray(rawCell.monsters)
              ? rawCell.monsters
                  .filter((monster) => monster && MONSTERS[monster.key])
                  .map((monster) =>
                    normalizeMonsterEntity(monster, rawCell.room === "monster" ? roomType : null, roomTier)
                  )
              : [];
            return {
              ...cell,
              ...rawCell,
              roomTier,
              trapStar,
              trapStars: trapStar,
              trapRank,
              trapChargesRemaining: Number.isFinite(rawCell.trapChargesRemaining)
                ? Math.max(0, rawCell.trapChargesRemaining)
                : rawCell.trap && !rawCell.trapBroken
                ? trapChargesForStar(trapStar)
                : 0,
              trapCooldownRemaining: Number.isFinite(rawCell.trapCooldownRemaining)
                ? Math.max(0, rawCell.trapCooldownRemaining)
                : 0,
              monsters,
            };
          });
        });
        return next;
      };
      const grid = normalizeGrid(parsed.grid);
      const selected =
        parsed.selected && Number.isFinite(parsed.selected.x) && Number.isFinite(parsed.selected.y)
          ? {
              x: clamp(parsed.selected.x, 0, W - 1),
              y: clamp(parsed.selected.y, 0, H - 1),
            }
          : base.selected;
      const currency = parsed.currency
        ? { ...base.currency, ...parsed.currency }
        : { ...base.currency, essence: parsed.essence ?? base.currency.essence };
      const dailyEvent = parsed.dailyEvent || base.dailyEvent;
      const traderStock = parsed.traderStock || base.traderStock;
      const shadyStock = parsed.shadyStock || base.shadyStock;
      const artifacts = parsed.artifacts || base.artifacts;
      const doctrines = {
        trap: Math.max(0, parsed.doctrines?.trap || 0),
        monster: Math.max(0, parsed.doctrines?.monster || 0),
        utility: Math.max(0, parsed.doctrines?.utility || 0),
        core: Math.max(0, parsed.doctrines?.core || 0),
      };
      const dominionEffects = parsed.dominionEffects || base.dominionEffects;
      const evolutionOffer = parsed.evolutionOffer || base.evolutionOffer;
      const coreShield = Number.isFinite(parsed.coreShield) ? parsed.coreShield : base.coreShield;
      const councilRaw = parsed.council || base.council;
      const council = {
        active: !!councilRaw.active,
        day: councilRaw.day ?? null,
        roster: Array.isArray(councilRaw.roster) ? councilRaw.roster : [],
        lastRoster: Array.isArray(councilRaw.lastRoster) ? councilRaw.lastRoster : [],
        declinedStreak: Number.isFinite(councilRaw.declinedStreak) ? councilRaw.declinedStreak : 0,
      };
      const councilFavor = parsed.councilFavor && typeof parsed.councilFavor === "object" ? parsed.councilFavor : {};
      const fleshMarketUntilDay = parsed.fleshMarketUntilDay || base.fleshMarketUntilDay;
      const nextRaidType = parsed.nextRaidType || base.nextRaidType;
      const pendingPunitiveRaid =
        !!parsed.pendingPunitiveRaid || (council.declinedStreak >= 2 && nextRaidType === "council");
      const pendingCouncilRaid =
        parsed.pendingCouncilRaid ||
        (pendingPunitiveRaid && council.roster?.length ? buildCouncilRaidFromRoster(council.roster, parsed.day || base.day, councilFavor) : null);
      const currentPartyRaidType = parsed.currentPartyRaidType || null;
      const councilSession = parsed.councilSession || base.councilSession;
      const councilQuest = parsed.councilQuest || base.councilQuest;
      const nextRaidBoons = Array.isArray(parsed.nextRaidBoons) ? parsed.nextRaidBoons.filter(Boolean) : [];
      const activeRaidBoons = Array.isArray(parsed.activeRaidBoons) ? parsed.activeRaidBoons.filter(Boolean) : [];
      const savedDay = Math.max(1, parsed.day || base.day || 1);
      const normalizeHeroList = (list, raidType = null) =>
        Array.isArray(list) ? list.filter(Boolean).map((hero) => normalizeHeroEntity(hero, savedDay, raidType)) : [];
      return {
        ...base,
        ...parsed,
        grid,
        selected,
        currency,
        doctrines,
        dailyEvent,
        traderStock,
        shadyStock,
        artifacts,
        dominionEffects,
        evolutionOffer,
        coreShield,
        council,
        councilFavor,
        councilSession,
        councilQuest,
        fleshMarketUntilDay,
        nextRaidType,
        pendingPunitiveRaid,
        pendingCouncilRaid,
        nextRaidBoons,
        activeRaidBoons,
        currentPartyRaidType,
        heroes: normalizeHeroList(parsed.heroes, parsed.raidType || currentPartyRaidType),
        currentParty: normalizeHeroList(parsed.currentParty, currentPartyRaidType),
        partyQueue: normalizeHeroList(parsed.partyQueue, currentPartyRaidType),
        scoutQueue: normalizeHeroList(parsed.scoutQueue, currentPartyRaidType),
        invMonsters: Array.isArray(parsed.invMonsters)
          ? parsed.invMonsters
              .filter((monster) => monster && MONSTERS[monster.key])
              .map((monster) => normalizeMonsterEntity(monster))
          : base.invMonsters,
      };
    } catch {
      return null;
    }
  }

  const [state, setState] = useState(() => loadSavedState() || defaultState());

  useEffect(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch {
      // Ignore save failures (private mode or storage full).
    }
  }, [state]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") {
        cancelMove();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (state.councilSession && state.councilSession.day === state.day && state.councilSession.status === "pending") {
      setSidePanel("council");
      setCouncilScreenOpen(false);
      setFocusedCouncilKey(null);
    }
  }, [state.councilSession, state.day]);

  const locked = state.coreHp <= 0;
  const isBuildPhase = state.phase === "build";
  const isBattlePhase = state.phase === "battle";
  const councilSessionActive = state.councilSession && state.councilSession.day === state.day;
  const showCouncilPrompt = councilSessionActive && state.councilSession.status === "pending";
  const councilRoster = councilSessionActive ? state.council?.roster || [] : [];
  const focusedCouncilMember = councilRoster.find((m) => m.key === focusedCouncilKey) || councilRoster[0] || null;

  useEffect(() => {
    if (!councilRoster.length) return;
    if (!focusedCouncilKey || !councilRoster.some((member) => member.key === focusedCouncilKey)) {
      setFocusedCouncilKey(councilRoster[0].key);
    }
  }, [councilRoster, focusedCouncilKey]);

  const { entrance, core } = useMemo(() => findEntranceAndCore(state.grid), [state.grid]);
  const validation = useMemo(() => validateDungeon(state.grid), [state.grid]);
  const roomsPlaced = useMemo(() => countRooms(state.grid), [state.grid]);
  const doctrineEffects = useMemo(() => getDoctrineEffects(state.doctrines || {}), [state.doctrines]);
  const contentWarnings = useMemo(() => validateGameContent(), []);
  const coreMaxHp = useMemo(() => getCoreMaxHp(state), [state.doctrines]);
  const dungeonLevel = Number.isFinite(state.dungeonLevel) ? state.dungeonLevel : 1;
  const maxRooms = MAX_ROOMS_BASE + (dungeonLevel - 1) * ROOMS_PER_LEVEL;

  const heroesByTile = useMemo(() => {
    const map = new Map();
    for (const h of state.heroes) {
      const k = keyOf(h.x, h.y);
      const arr = map.get(k) || [];
      arr.push(h);
      map.set(k, arr);
    }
    return map;
  }, [state.heroes]);

  const selectedTile = state.grid[state.selected.y][state.selected.x];
  const selectedHeroes = heroesByTile.get(keyOf(state.selected.x, state.selected.y)) || [];
  const roomUpgradePrice = selectedTile.room ? roomUpgradeCost(selectedTile.roomTier || 1) : null;

  function setSelected(x, y) {
    if (locked) return;
    setState((s) => {
      if (s.movePayload) {
        const grid = cloneGrid(s.grid);
        const t = grid[y][x];
        if (t.entrance) return addLog(s, "Cannot move onto the Entrance.");
        if (t.core || t.room) return addLog(s, "That tile is already occupied.");

        const payload = s.movePayload;
        if (payload.type === "core") {
          t.core = true;
        } else if (payload.type === "room") {
          t.room = payload.room;
          t.roomType = payload.roomType;
          t.roomTier = payload.roomTier || 1;
          t.trap = payload.trap;
          t.trapType = payload.trapType;
          t.trapStar = payload.trapStar ?? payload.trapStars ?? 1;
          t.trapStars = payload.trapStar ?? payload.trapStars ?? 1;
          t.trapRank = payload.trapRank ?? payload.roomTier ?? 1;
          t.trapChargesRemaining = payload.trapChargesRemaining ?? (payload.trap ? trapChargesForStar(payload.trapStar ?? payload.trapStars ?? 1) : 0);
          t.trapCooldownRemaining = payload.trapCooldownRemaining ?? 0;
          t.trapBroken = payload.trapBroken;
          t.ambushUsed = payload.ambushUsed;
          t.monsters = payload.monsters.map((m) => ({ ...m }));
        }

        const nextState = { ...s, grid, selected: { x, y }, movePayload: null };
        return addLog(nextState, "Room moved.");
      }
      return { ...s, selected: { x, y } };
    });
  }

  function clearTile() {
    if (locked) return;
    if (!isBuildPhase) {
      setState((s) => addLog(s, "You can only clear tiles during the build phase."));
      return;
    }
    if (state.movePayload) {
      setState((s) => addLog(s, "Finish moving before clearing tiles."));
      return;
    }
    setState((s) => {
      const grid = cloneGrid(s.grid);
      const t = grid[s.selected.y][s.selected.x];
      if (t.entrance) return addLog(s, "Entrance cannot be cleared once placed.");

      const invMonsters = [...s.invMonsters, ...t.monsters.map((m) => ({ ...m }))];

      t.entrance = false;
      t.core = false;
      t.room = null;
      t.roomType = null;
      t.roomTier = 1;
      t.trap = false;
      t.trapType = null;
      t.trapStar = 1;
      t.trapStars = 1;
      t.trapRank = 1;
      t.trapChargesRemaining = 0;
      t.trapCooldownRemaining = 0;
      t.trapBroken = false;
      t.ambushUsed = false;
      t.monsters = [];

      return addLog({ ...s, grid, invMonsters }, `Cleared tile at (${s.selected.x + 1},${s.selected.y + 1}).`);
    });
  }

  function placeEntrance() {
    if (locked) return;
    if (!isBuildPhase) {
      setState((s) => addLog(s, "You can only place rooms during the build phase."));
      return;
    }
    if (state.movePayload) {
      setState((s) => addLog(s, "Finish moving before placing rooms."));
      return;
    }
    setState((s) => {
      const { entrance: ent } = findEntranceAndCore(s.grid);
      if (ent) return addLog(s, "Entrance is fixed and cannot be moved.");
      const grid = cloneGrid(s.grid);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) grid[y][x].entrance = false;

      const t = grid[s.selected.y][s.selected.x];
      t.entrance = true;

      t.room = null;
      t.roomType = null;
      t.trap = false;
      t.trapType = null;
      t.trapStar = 1;
      t.trapStars = 1;
      t.trapRank = 1;
      t.trapChargesRemaining = 0;
      t.trapCooldownRemaining = 0;
      t.trapBroken = false;
      t.ambushUsed = false;

      const invMonsters = [...s.invMonsters, ...t.monsters.map((m) => ({ ...m }))];
      t.monsters = [];

      return addLog({ ...s, grid, invMonsters }, `Entrance placed at (${s.selected.x + 1},${s.selected.y + 1}).`);
    });
  }

  function placeCore() {
    if (locked) return;
    if (!isBuildPhase) {
      setState((s) => addLog(s, "You can only place rooms during the build phase."));
      return;
    }
    if (state.movePayload) {
      setState((s) => addLog(s, "Finish moving before placing rooms."));
      return;
    }
    setState((s) => {
      const grid = cloneGrid(s.grid);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) grid[y][x].core = false;

      const t = grid[s.selected.y][s.selected.x];
      t.core = true;

      t.room = null;
      t.roomType = null;
      t.trap = false;
      t.trapType = null;
      t.trapStar = 1;
      t.trapStars = 1;
      t.trapRank = 1;
      t.trapChargesRemaining = 0;
      t.trapCooldownRemaining = 0;
      t.trapBroken = false;
      t.ambushUsed = false;

      const invMonsters = [...s.invMonsters, ...t.monsters.map((m) => ({ ...m }))];
      t.monsters = [];

      return addLog({ ...s, grid, invMonsters }, `Core placed at (${s.selected.x + 1},${s.selected.y + 1}).`);
    });
  }

  function buildTrapRoom() {
    if (locked) return;
    if (!isBuildPhase) {
      setState((s) => addLog(s, "You can only build during the build phase."));
      return;
    }
    if (state.movePayload) {
      setState((s) => addLog(s, "Finish moving before building rooms."));
      return;
    }
    setState((s) => {
      const grid = cloneGrid(s.grid);
      const t = grid[s.selected.y][s.selected.x];

      if (t.entrance || t.core) return addLog(s, "Cannot build on Entrance/Core.");
      if (t.room) return addLog(s, "That tile already has a room.");
      const level = Number.isFinite(s.dungeonLevel) ? s.dungeonLevel : 1;
      const cap = MAX_ROOMS_BASE + (level - 1) * ROOMS_PER_LEVEL;
      if (countRooms(grid) >= cap) return addLog(s, `Room limit reached (${cap}).`);

      const trapStar = rollAuthoritativeStar(s.day);
      t.room = "trap";
      t.roomTier = 1;
      t.trap = true;
      t.trapType = s.selectedTrapType;
      t.trapStar = trapStar;
      t.trapStars = trapStar;
      t.trapRank = 1;
      t.trapChargesRemaining = trapChargesForStar(trapStar);
      t.trapCooldownRemaining = 0;
      t.trapBroken = false;
      t.monsters = [];

      const trapName = TRAP_MAP[t.trapType]?.name || "Trap Room";
      return addLog(
        { ...s, grid },
        `Built ${trapName} at (${s.selected.x + 1},${s.selected.y + 1}) as ${formatStars(trapStar)} with ${t.trapChargesRemaining} charge(s).`
      );
    });
  }

  function buildMonsterRoom() {
    if (locked) return;
    if (!isBuildPhase) {
      setState((s) => addLog(s, "You can only build during the build phase."));
      return;
    }
    if (state.movePayload) {
      setState((s) => addLog(s, "Finish moving before building rooms."));
      return;
    }
    setState((s) => {
      const grid = cloneGrid(s.grid);
      const t = grid[s.selected.y][s.selected.x];

      if (t.entrance || t.core) return addLog(s, "Cannot build on Entrance/Core.");
      if (t.room) return addLog(s, "That tile already has a room.");
      const level = Number.isFinite(s.dungeonLevel) ? s.dungeonLevel : 1;
      const cap = MAX_ROOMS_BASE + (level - 1) * ROOMS_PER_LEVEL;
      if (countRooms(grid) >= cap) return addLog(s, `Room limit reached (${cap}).`);

      t.room = "monster";
      t.roomTier = 1;
      t.trap = false;
      t.roomType = s.selectedMonsterRoomType;
      t.ambushUsed = false;
      t.trapStar = 1;
      t.trapStars = 1;
      t.trapRank = 1;
      t.trapChargesRemaining = 0;
      t.trapCooldownRemaining = 0;
      t.monsters = [];

      const roomName = MONSTER_ROOM_MAP[t.roomType]?.name || "Monster Room";
      return addLog({ ...s, grid }, `Built ${roomName} at (${s.selected.x + 1},${s.selected.y + 1}).`);
    });
  }

  function buildUtilityRoom() {
    if (locked) return;
    if (!isBuildPhase) {
      setState((s) => addLog(s, "You can only build during the build phase."));
      return;
    }
    if (state.movePayload) {
      setState((s) => addLog(s, "Finish moving before building rooms."));
      return;
    }
    setState((s) => {
      const grid = cloneGrid(s.grid);
      const t = grid[s.selected.y][s.selected.x];

      if (t.entrance || t.core) return addLog(s, "Cannot build on Entrance/Core.");
      if (t.room) return addLog(s, "That tile already has a room.");
      const level = Number.isFinite(s.dungeonLevel) ? s.dungeonLevel : 1;
      const cap = MAX_ROOMS_BASE + (level - 1) * ROOMS_PER_LEVEL;
      if (countRooms(grid) >= cap) return addLog(s, `Room limit reached (${cap}).`);

      t.room = "utility";
      t.roomTier = 1;
      t.roomType = s.selectedUtilityRoomType;
      t.trap = false;
      t.trapType = null;
      t.trapStar = 1;
      t.trapStars = 1;
      t.trapRank = 1;
      t.trapChargesRemaining = 0;
      t.trapCooldownRemaining = 0;
      t.trapBroken = false;
      t.monsters = [];

      const roomName = UTILITY_MAP[t.roomType]?.name || "Utility Room";
      return addLog({ ...s, grid }, `Built ${roomName} at (${s.selected.x + 1},${s.selected.y + 1}).`);
    });
  }

  function armTrap() {
    if (locked) return;
    if (!isBuildPhase) {
      setState((s) => addLog(s, "You can only arm traps during the build phase."));
      return;
    }
    if (state.movePayload) {
      setState((s) => addLog(s, "Finish moving before arming traps."));
      return;
    }
    setState((s) => {
      const grid = cloneGrid(s.grid);
      const t = grid[s.selected.y][s.selected.x];
      if (t.room !== "trap") return addLog(s, "Select a trap room first.");

      t.trap = !t.trap;
      if (t.trap) {
        if (t.trapBroken) {
          t.trapBroken = false;
        }
        t.trapChargesRemaining = trapChargesForStar(t.trapStar || t.trapStars || 1);
        t.trapCooldownRemaining = 0;
        return addLog({ ...s, grid }, `Trap armed. ${t.trapChargesRemaining} charge(s) ready.`);
      }
      t.trapChargesRemaining = 0;
      t.trapCooldownRemaining = 0;
      return addLog({ ...s, grid }, "Trap disarmed.");
    });
  }

  function recruitMonster() {
    if (locked) return;
    if (!isBuildPhase) {
      setState((s) => addLog(s, "You can only recruit during the build phase."));
      return;
    }
    if (state.movePayload) {
      setState((s) => addLog(s, "Finish moving before recruiting."));
      return;
    }
    setState((s) => {
      const kind = pick(MONSTER_KEYS);
      const previewMonster = generateMonster(kind, s.turnsSurvived, undefined, s.day);
      const scaledCost = traderPrice(previewMonster, s.day);
      if (s.currency.essence < scaledCost) return addLog(s, "Not enough Essence.");

      const invMonsters = [...s.invMonsters, previewMonster];
      return addLog(
        { ...s, currency: { ...s.currency, essence: s.currency.essence - scaledCost }, invMonsters },
        `Recruited ${previewMonster.name} for ${scaledCost} Essence.`
      );
    });
  }

  function buildEvolutionOptions(monster) {
    const stage = monsterEvolutionStageValue(monster);
    const baseRace = monster.race || MONSTERS[monster.key]?.name || "Monster";
    if (stage >= MAX_EVOLUTION_STAGE) return [];
    if (stage === 0) {
      return pickUnique(MONSTER_EVOLUTION_BRANCHES, 3).map((branch) => {
        const passiveKey = BRANCH_PASSIVE_BY_CLASS[branch];
        return {
          name: `${baseRace} ${branch}`,
          class: branch,
          passive: MONSTER_PASSIVE_MAP[passiveKey]?.name || "None",
          passiveKey,
        };
      });
    }
    const branchClass = defaultBranchClass(monster);
    const passiveKey = BRANCH_PASSIVE_BY_CLASS[branchClass];
    return [
      {
        name: `Ascended ${monster.name}`,
        class: branchClass,
        passive: MONSTER_PASSIVE_MAP[passiveKey]?.name || "None",
        passiveKey,
      },
    ];
  }

  function evoSourceKey(source) {
    if (!source) return "";
    if (source.type === "inv") return `inv:${source.index}`;
    return `room:${source.x},${source.y}:${source.index}`;
  }

  function getMonsterFromSource(state, source) {
    if (!source) return null;
    if (source.type === "inv") return state.invMonsters[source.index];
    if (source.type === "room") {
      const tile = state.grid[source.y]?.[source.x];
      if (!tile || tile.room !== "monster") return null;
      return tile.monsters[source.index];
    }
    return null;
  }

  function startEvolution(source) {
    if (locked) return;
    if (!isBuildPhase) {
      setState((s) => addLog(s, "You can only evolve during the build phase."));
      return;
    }
    setState((s) => {
      const target = getMonsterFromSource(s, source);
      if (!target) return s;
      const cost = monsterEvolutionCost(target);
      if (cost === null) {
        return addLog(s, `${target.name} has already reached the final evolution stage.`);
      }
      if (!monsterCanEvolve(target, s.currency.evolution)) {
        return addLog(s, `Not enough Evolution. Need ${cost} EP.`);
      }
      const options = buildEvolutionOptions(target);
      return { ...s, evolutionOffer: { source, options, cost, stage: monsterEvolutionStageValue(target) } };
    });
  }

  function chooseEvolution(source, option) {
    if (locked) return;
    setState((s) => {
      if (!s.evolutionOffer || evoSourceKey(s.evolutionOffer.source) !== evoSourceKey(source)) return s;
      const target = getMonsterFromSource(s, source);
      if (!target) return s;
      const cost = monsterEvolutionCost(target);
      if (cost === null) return addLog(s, `${target.name} has already reached the final evolution stage.`);
      const spend = spendEvolutionPoints(target.evoPoints || 0, s.currency.evolution, cost);
      if (!spend) {
        return addLog(s, `Not enough Evolution. Need ${cost} EP.`);
      }
      const currentStage = monsterEvolutionStageValue(target);
      const nextStage = currentStage + 1;
      const branchClass = currentStage === 0 ? option.class : defaultBranchClass(target);
      const branchPassiveKey = option.passiveKey || BRANCH_PASSIVE_BY_CLASS[branchClass];
      const passiveKeys = normalizePassiveKeysForMonster(target);
      const passiveRanks = createPassiveRanks(passiveKeys, target.passiveRanks || {});
      let passiveNote = "";
      if (branchPassiveKey) {
        if (passiveRanks[branchPassiveKey]) {
          passiveRanks[branchPassiveKey] += 1;
          passiveNote = `${MONSTER_PASSIVE_MAP[branchPassiveKey]?.name || branchPassiveKey} is strengthened.`;
        } else {
          passiveKeys.push(branchPassiveKey);
          passiveRanks[branchPassiveKey] = 1;
          passiveNote = `${MONSTER_PASSIVE_MAP[branchPassiveKey]?.name || branchPassiveKey} added.`;
        }
      }
      const evolvedBase = rebuildMonsterEntity(
        {
          ...target,
          name: currentStage === 0 ? option.name : `Ascended ${target.name.replace(/^Ascended\s+/, "")}`,
          class: branchClass,
          branchClass,
          passiveKeys,
          passiveRanks,
          evolutionStage: nextStage,
          evolution: nextStage,
          evoPoints: spend.personalLeft,
        },
        {},
        { healToFull: true }
      );
      const currency = { ...s.currency, evolution: spend.globalLeft };
      let invMonsters = s.invMonsters;
      let grid = s.grid;
      if (source.type === "inv") {
        invMonsters = s.invMonsters.map((m, i) => (i === source.index ? evolvedBase : m));
      } else if (source.type === "room") {
        grid = cloneGrid(s.grid);
        const tile = grid[source.y][source.x];
        if (tile && tile.room === "monster") {
          const buffed = applyMonsterRoomPlacement(evolvedBase, tile.roomType, tile.roomTier);
          buffed.evoPoints = evolvedBase.evoPoints;
          buffed.evolutionStage = evolvedBase.evolutionStage;
          buffed.evolution = evolvedBase.evolution;
          buffed.branchClass = evolvedBase.branchClass;
          buffed.passive = evolvedBase.passive;
          buffed.passiveKey = evolvedBase.passiveKey;
          buffed.passiveKeys = evolvedBase.passiveKeys;
          buffed.passiveRanks = evolvedBase.passiveRanks;
          buffed.foughtThisRaid = evolvedBase.foughtThisRaid;
          tile.monsters = tile.monsters.map((m, i) => (i === source.index ? buffed : m));
        }
      }
      return addLog(
        { ...s, grid, invMonsters, currency, evolutionOffer: null },
        `${target.name} reaches Stage ${nextStage}/${MAX_EVOLUTION_STAGE} as ${currentStage === 0 ? branchClass : evolvedBase.class}. ${passiveNote} (${cost} ${spend.source} EP).`
      );
    });
  }

  function cancelEvolution() {
    setState((s) => ({ ...s, evolutionOffer: null }));
  }

  function applyMonsterRoomPlacement(monster, roomType, roomTier = 1) {
    return applyMonsterRoomPlacementStatic(monster, roomType, roomTier);
  }

  function addMonsterToRoom() {
    if (locked) return;
    if (!isBuildPhase) {
      setState((s) => addLog(s, "You can only summon during the build phase."));
      return;
    }
    if (state.movePayload) {
      setState((s) => addLog(s, "Finish moving before summoning."));
      return;
    }
    setState((s) => {
      const grid = cloneGrid(s.grid);
      const t = grid[s.selected.y][s.selected.x];
      if (t.room !== "monster") return addLog(s, "Select a monster room first.");
      const cap = monsterRoomCap(t.roomTier || 1) + getDoctrineEffects(s.doctrines).monsterRoomCapBonus;
      if (t.monsters.length >= cap) return addLog(s, `Monster room is full (max ${cap}).`);
      if (s.invMonsters.length <= 0) return addLog(s, "No monsters in inventory.");

      const monster = applyMonsterRoomPlacement(s.invMonsters[0], t.roomType, t.roomTier);
      t.monsters.push(monster);

      const invMonsters = s.invMonsters.slice(1);
      return addLog({ ...s, grid, invMonsters }, `Placed ${monster.name} in room.`);
    });
  }

  function startMove() {
    if (locked) return;
    if (!isBuildPhase) {
      setState((s) => addLog(s, "You can only move rooms during the build phase."));
      return;
    }
    setState((s) => {
      const grid = cloneGrid(s.grid);
      const t = grid[s.selected.y][s.selected.x];
      if (t.entrance) return addLog(s, "Entrance cannot be moved.");
      if (t.core) {
        t.core = false;
        return addLog(
          { ...s, grid, movePayload: { type: "core", origin: { ...s.selected } } },
          "Core picked up. Select a new tile to place it."
        );
      }
      if (t.room) {
        const payload = {
          type: "room",
          room: t.room,
          roomType: t.roomType,
          roomTier: t.roomTier || 1,
          trap: t.trap,
          trapType: t.trapType,
          trapStar: t.trapStar ?? t.trapStars ?? 1,
          trapStars: t.trapStars,
          trapRank: t.trapRank ?? t.roomTier ?? 1,
          trapChargesRemaining: t.trapChargesRemaining ?? 0,
          trapCooldownRemaining: t.trapCooldownRemaining ?? 0,
          trapBroken: t.trapBroken,
          ambushUsed: t.ambushUsed,
          monsters: t.monsters.map((m) => ({ ...m })),
          origin: { ...s.selected },
        };
        t.room = null;
        t.roomType = null;
        t.roomTier = 1;
        t.trap = false;
        t.trapType = null;
        t.trapStar = 1;
        t.trapStars = 1;
        t.trapRank = 1;
        t.trapChargesRemaining = 0;
        t.trapCooldownRemaining = 0;
        t.trapBroken = false;
        t.ambushUsed = false;
        t.monsters = [];
        return addLog({ ...s, grid, movePayload: payload }, "Room picked up. Select a new tile to place it.");
      }
      return addLog(s, "Select a room or the Core to move it.");
    });
  }

  function cancelMove() {
    setState((s) => {
      if (!s.movePayload) return s;
      const grid = cloneGrid(s.grid);
      const { origin } = s.movePayload;
      if (!origin) return { ...s, movePayload: null };
      const t = grid[origin.y][origin.x];
      if (t.entrance || t.core || t.room) {
        return addLog(s, "Cannot cancel move - original tile is occupied.");
      }
      if (s.movePayload.type === "core") {
        t.core = true;
      } else {
        t.room = s.movePayload.room;
        t.roomType = s.movePayload.roomType;
        t.roomTier = s.movePayload.roomTier || 1;
        t.trap = s.movePayload.trap;
        t.trapType = s.movePayload.trapType;
        t.trapStar = s.movePayload.trapStar ?? s.movePayload.trapStars ?? 1;
        t.trapStars = s.movePayload.trapStar ?? s.movePayload.trapStars ?? 1;
        t.trapRank = s.movePayload.trapRank ?? s.movePayload.roomTier ?? 1;
        t.trapChargesRemaining = s.movePayload.trapChargesRemaining ?? 0;
        t.trapCooldownRemaining = s.movePayload.trapCooldownRemaining ?? 0;
        t.trapBroken = s.movePayload.trapBroken;
        t.ambushUsed = s.movePayload.ambushUsed;
        t.monsters = s.movePayload.monsters.map((m) => ({ ...m }));
      }
      return addLog({ ...s, grid, movePayload: null }, "Move canceled.");
    });
  }

  function upgradeDungeon() {
    if (locked) return;
    if (!isBuildPhase) {
      setState((s) => addLog(s, "You can only upgrade during the build phase."));
      return;
    }
    setState((s) => {
      if (s.raidActive) return addLog(s, "Cannot upgrade during a raid.");
      const currentLevel = Number.isFinite(s.dungeonLevel) ? s.dungeonLevel : 1;
      const cost = scaleByDay(25 + currentLevel * 15, s.day, 0.03, 3.0);
      if (s.currency.essence < cost) return addLog(s, `Not enough Essence to upgrade (${cost}).`);
      const dungeonLevel = currentLevel + 1;
      return addLog(
        { ...s, currency: { ...s.currency, essence: s.currency.essence - cost }, dungeonLevel },
        `Dungeon upgraded to Level ${dungeonLevel}.`
      );
    });
  }

  function upgradeDoctrine(kind) {
    if (locked) return;
    if (!isBuildPhase) {
      setState((s) => addLog(s, "Doctrines can only be advanced during the build phase."));
      return;
    }
    setState((s) => {
      const rule = DOCTRINE_RULES[kind];
      if (!rule) return s;
      const currentLevel = s.doctrines?.[kind] || 0;
      const nextLevelDef = rule.levels[currentLevel];
      if (!nextLevelDef) return addLog(s, `${rule.name} is already mastered.`);
      const currencyKey = rule.currency;
      if ((s.currency?.[currencyKey] || 0) < nextLevelDef.cost) {
        return addLog(s, `Not enough ${currencyKey} for ${rule.name} (${nextLevelDef.cost}).`);
      }
      const doctrines = { ...(s.doctrines || {}), [kind]: currentLevel + 1 };
      const currency = { ...s.currency, [currencyKey]: (s.currency?.[currencyKey] || 0) - nextLevelDef.cost };
      let coreHp = s.coreHp;
      if (kind === "core") {
        const previousMax = getCoreMaxHp(s);
        const nextMax = getCoreMaxHp({ doctrines });
        coreHp = Math.min(nextMax, Math.max(1, coreHp + (nextMax - previousMax)));
      }
      return addLog(
        { ...s, doctrines, currency, coreHp },
        `${rule.name} advanced to ${currentLevel + 1}/${rule.levels.length}. ${nextLevelDef.desc}`
      );
    });
  }

  function roomUpgradeCost(tier) {
    return 20 + tier * 10;
  }

  function upgradeRoom() {
    if (locked) return;
    if (!isBuildPhase) {
      setState((s) => addLog(s, "You can only upgrade rooms during the build phase."));
      return;
    }
    if (state.movePayload) {
      setState((s) => addLog(s, "Finish moving before upgrading rooms."));
      return;
    }
    setState((s) => {
      const grid = cloneGrid(s.grid);
      const t = grid[s.selected.y][s.selected.x];
      if (!t.room) return addLog(s, "Select a room to upgrade.");
      const tier = t.roomTier || 1;
      if (tier >= ROOM_TIER_MAX) return addLog(s, "Room is already at max tier.");
      const cost = scaleByDay(roomUpgradeCost(tier), s.day, 0.03, 3.0);
      if (s.currency.essence < cost) return addLog(s, `Not enough Essence (${cost}).`);

      const nextTier = tier + 1;
      t.roomTier = nextTier;
      if (t.room === "trap") {
        t.trapRank = nextTier;
        if (t.trap) {
          t.trapChargesRemaining = trapChargesForStar(t.trapStar || t.trapStars || 1, getDoctrineEffects(s.doctrines));
          t.trapCooldownRemaining = 0;
        }
      }
      if (t.room === "monster") {
        for (const m of t.monsters) {
          if (t.roomType === "training-den") {
            m.atk += 1;
            m.stats.atk = m.atk;
          } else if (t.roomType === "thick-hide") {
            m.stats.maxHp = (m.stats.maxHp || m.hp) + 2;
            m.hp += 2;
          }
        }
      }

      const currency = { ...s.currency, essence: s.currency.essence - cost };
      if (t.room === "trap") {
        return addLog(
          { ...s, grid, currency },
          `Upgraded trap room to Tier ${nextTier}. Rank ${t.trapRank} increases trigger damage and recovery.`
        );
      }
      return addLog({ ...s, grid, currency }, `Upgraded room to Tier ${nextTier}.`);
    });
  }

  function buyArtifact(idx) {
    if (locked) return;
    if (!isBuildPhase) {
      setState((s) => addLog(s, "You can only trade during the build phase."));
      return;
    }
    setState((s) => {
      const stock = s.shadyStock ? [...s.shadyStock] : [];
      const target = stock[idx];
      if (!target) return s;
      const rawCost = target.cost || { currency: "soulshards", amount: 0 };
      const cost = {
        ...rawCost,
        amount: scaleByDay(rawCost.amount || 0, s.day, 0.04, 2.5),
      };
      const currency = { ...s.currency };
      if (currency[cost.currency] < cost.amount) {
        return addLog(s, `Not enough ${cost.currency}.`);
      }
      currency[cost.currency] -= cost.amount;
      stock.splice(idx, 1);
      const artifacts = [...s.artifacts, target];
      return addLog({ ...s, currency, shadyStock: stock, artifacts }, `Bought ${target.name} for ${cost.amount} ${cost.currency}.`);
    });
  }

  function useDominionPower(kind) {
    if (locked) return;
    if (!isBattlePhase) {
      setState((s) => addLog(s, "Dominion powers can only be used in battle."));
      return;
    }
    if (!state.raidActive && state.heroes.length === 0) {
      setState((s) => addLog(s, "No active raid to target."));
      return;
    }
    const costByKind = { pulse: 2, shield: 2, speed: 1, strength: 1 };
    const cost = costByKind[kind] || 1;
    setState((s) => {
      if (s.currency.dominion < cost) return addLog(s, "Not enough Dominion.");
      let dominionEffects = { ...s.dominionEffects };
      let coreShield = s.coreShield || 0;
      let msg = "Dominion power activated.";
      if (kind === "pulse") {
        dominionEffects.pulsePending = true;
        msg = "Dominion Pulse readied.";
      } else if (kind === "shield") {
        coreShield = Math.min(30, coreShield + 10);
        msg = "Core Shield reinforced.";
      } else if (kind === "speed") {
        dominionEffects.monsterFirstStrike = true;
        msg = "Dominion Speed grants monsters first strike.";
      } else if (kind === "strength") {
        dominionEffects.monsterAtk = Math.max(dominionEffects.monsterAtk || 0, 1);
        msg = "Dominion Strength empowers monsters.";
      }
      const currency = { ...s.currency, dominion: s.currency.dominion - cost };
      return addLog({ ...s, currency, dominionEffects, coreShield }, msg);
    });
  }

  function beginBattle() {
    if (locked) return;
    if (!isBuildPhase) {
      setState((s) => addLog(s, "Battle already active."));
      return;
    }
    if (state.council?.active) {
      setState((s) => addLog(s, "Council is in session. Attend or decline first."));
      return;
    }
    setState((s) => {
      const raidType = s.pendingPunitiveRaid ? "council" : s.nextRaidType;
      const party = generateRaidParty(s.turnsSurvived, raidType, s.day, {
        councilRaid: s.pendingCouncilRaid,
        raidBoons: s.nextRaidBoons,
      });
      let scoutQueue = [];
      const doctrineEffects = getDoctrineEffects(s.doctrines);
      const raidMods = buildRaidModifiers(s.nextRaidBoons);
      const mirrorTier = maxUtilityTier(s.grid, "scout-mirror") + doctrineEffects.utilityScoutBonus;
      if (mirrorTier > 0) {
        const revealCount = Math.min(party.length, 2 + (mirrorTier - 1) + raidMods.scoutRevealBonus);
        scoutQueue = party.slice(0, revealCount).map((h) => ({ ...h }));
      }
      let ns = {
        ...s,
        phase: "battle",
        currentParty: party,
        currentPartyRaidType: raidType || null,
        partyQueue: party.map((h) => ({ ...h })),
        scoutQueue,
      };
      const meta = raidTypeMeta(raidType, s.pendingCouncilRaid);
      ns = addLog(ns, `Day ${s.day} battle begins. ${meta.label}. Party size ${party.length}.`);
      ns = addLog(ns, meta.desc);
      if (scoutQueue.length > 0) {
        const previews = scoutQueue
          .map((h) => `${h.name} (${formatStars(safeEntityStars(h))}, ATK ${h.atk}, HP ${h.hp})`)
          .join(" | ");
        ns = addLog(ns, `Scout's Mirror reveals: ${previews}`);
      }
      return ns;
    });
  }

  function spawnOneHero(heroes, nextId, entrancePos, turnsSurvived, queueIn, grid, raidType, day = 1) {
    let queue = queueIn ? [...queueIn] : [];
    let hero;
    if (queue.length > 0) {
      hero = { ...queue.shift() };
      hero.x = entrancePos.x;
      hero.y = entrancePos.y;
    } else {
      hero = generateHero(nextId, entrancePos, turnsSurvived, raidType, day);
    }
    if (grid && hasUtilityAura(grid, hero.x, hero.y, "fear-idol")) {
      hero.statuses = hero.statuses || {};
      hero.statuses.fear = { turns: 2, value: 1 };
    }
    heroes.push(hero);
    const nextHeroId = Math.max(nextId, hero.id + 1);
    return { nextHeroId, scoutQueue: queue, spawned: hero };
  }

  function startRaid() {
    if (locked) return;
    if (state.council?.active) {
      setState((s) => addLog(s, "Council is in session. Attend or decline first."));
      return;
    }
    if (state.movePayload) {
      setState((s) => addLog(s, "Finish moving before starting a raid."));
      return;
    }
    if (!validation.ok) {
      setState((s) => addLog(s, `Cannot start raid: ${validation.reason}`));
      return;
    }

    setState((s) => {
      if (s.raidActive) return addLog(s, "Raid is already active.");
      if (s.phase !== "battle") return addLog(s, "You can only start raids during battle.");

      const { entrance: ent } = findEntranceAndCore(s.grid);
      if (!ent) return addLog(s, "Place an Entrance first.");

      const grid = cloneGrid(s.grid);
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const t = grid[y][x];
          if (t.room === "monster") {
            for (const m of t.monsters) m.foughtThisRaid = false;
          } else if (t.room === "trap") {
            const trapStar = t.trapStar ?? t.trapStars ?? 1;
            t.trapStar = trapStar;
            t.trapStars = trapStar;
            t.trapRank = Math.max(1, t.trapRank ?? t.roomTier ?? 1);
            if (t.trap && !t.trapBroken) {
              t.trapChargesRemaining = trapChargesForStar(trapStar, getDoctrineEffects(s.doctrines));
              t.trapCooldownRemaining = 0;
            } else {
              t.trapChargesRemaining = 0;
              t.trapCooldownRemaining = 0;
            }
          }
        }
      }

      let heroes = [...s.heroes];
      let nextId = s.nextHeroId;
      const raidType = s.pendingPunitiveRaid ? "council" : s.nextRaidType;
      const reuseParty =
        s.currentParty &&
        s.currentParty.length &&
        (s.currentPartyRaidType || null) === (raidType || null);
      const party = reuseParty
        ? s.currentParty
        : generateRaidParty(s.turnsSurvived, raidType, s.day, {
            councilRaid: s.pendingCouncilRaid,
            raidBoons: s.nextRaidBoons,
          });
      let partyQueue = [...party];
      let raidRemaining = partyQueue.length;
      let raidKills = 0;
      let scoutQueue = [];

      const doctrineEffects = getDoctrineEffects(s.doctrines);
      const raidMods = buildRaidModifiers(s.nextRaidBoons);
      const mirrorTier = maxUtilityTier(s.grid, "scout-mirror") + doctrineEffects.utilityScoutBonus;
      const doctrineShield = doctrineEffects.coreShieldBonus || 0;
      const fortifiedCoreShield = (s.coreShield || 0) + doctrineShield;
      if (mirrorTier > 0) {
        const revealCount = Math.min(partyQueue.length, 2 + (mirrorTier - 1) + raidMods.scoutRevealBonus);
        scoutQueue = partyQueue.slice(0, revealCount).map((h) => ({ ...h }));
      }

      if (heroes.length < HERO_CAP && partyQueue.length > 0) {
        const spawnResult = spawnOneHero(heroes, nextId, ent, s.turnsSurvived, partyQueue, grid, raidType, s.day);
        nextId = spawnResult.nextHeroId;
        partyQueue = spawnResult.scoutQueue;
        raidRemaining = partyQueue.length;
        let ns = {
          ...s,
          grid,
          raidActive: true,
          raidRemaining,
          heroes,
          nextHeroId: nextId,
          raidStartTurn: s.turnsSurvived,
          raidStartEssence: s.currency.essence,
          raidStartShards: s.currency.soulshards,
          raidStartCoreHp: s.coreHp,
          coreShield: fortifiedCoreShield,
          raidKills,
          scoutQueue,
          currentParty: party,
          currentPartyRaidType: raidType || null,
          partyQueue,
          raidType: raidType || null,
          nextRaidType: null,
          pendingPunitiveRaid: false,
          pendingCouncilRaid: null,
          nextRaidBoons: [],
          activeRaidBoons: [...(s.nextRaidBoons || [])],
        };
        const meta = raidTypeMeta(raidType, s.pendingCouncilRaid);
        if (doctrineShield > 0) {
          ns = addLog(ns, `Core Doctrine fortifies the Core with +${doctrineShield} Shield.`);
        }
        ns = addLog(ns, `Raid started. ${meta.label}. Party size ${party.length}. ${invaderLabel(spawnResult.spawned)} breaches the Entrance.`);
        if (scoutQueue.length > 0) {
          const previews = scoutQueue
            .map((h) => `${h.name} (${formatStars(safeEntityStars(h))}, ATK ${h.atk}, HP ${h.hp})`)
            .join(" | ");
          ns = addLog(ns, `Scout's Mirror reveals: ${previews}`);
        }
        return ns;
      }

      // Start raid even if cap is already reached; it will drip later.
      let ns = {
        ...s,
        grid,
        raidActive: true,
        raidRemaining,
        nextHeroId: nextId,
        raidStartTurn: s.turnsSurvived,
        raidStartEssence: s.currency.essence,
        raidStartShards: s.currency.soulshards,
        raidStartCoreHp: s.coreHp,
        coreShield: fortifiedCoreShield,
        raidKills,
        scoutQueue,
        currentParty: party,
        currentPartyRaidType: raidType || null,
        partyQueue,
        raidType: raidType || null,
        nextRaidType: null,
        pendingPunitiveRaid: false,
        pendingCouncilRaid: null,
        nextRaidBoons: [],
        activeRaidBoons: [...(s.nextRaidBoons || [])],
      };
      const meta = raidTypeMeta(raidType, s.pendingCouncilRaid);
      if (doctrineShield > 0) {
        ns = addLog(ns, `Core Doctrine fortifies the Core with +${doctrineShield} Shield.`);
      }
      ns = addLog(ns, `Raid started. ${meta.label}. Party size ${party.length}. (Cap reached; no spawn yet.)`);
      if (scoutQueue.length > 0) {
        const previews = scoutQueue
          .slice(0, 2)
          .map((h) => `${h.name} (${formatStars(safeEntityStars(h))}, ATK ${h.atk}, HP ${h.hp})`)
          .join(" | ");
        ns = addLog(ns, `Scout's Mirror reveals: ${previews}`);
      }
      return ns;
    });
  }

  function endTurn() {
    if (locked) return;

    if (!state.raidActive && state.heroes.length === 0) {
      setState((s) => addLog(s, "No active raid. Press Start Raid to begin."));
      return;
    }

    const v = validateDungeon(state.grid);
    if (!v.ok) {
      setState((s) => addLog(s, `Dungeon not valid: ${v.reason}`));
      return;
    }

    setState((s) => {
      let grid = cloneGrid(s.grid);
      let heroesOut = [];
      let essence = s.currency.essence;
      let soulshards = s.currency.soulshards;
      let coreHp = s.coreHp;
      let coreShield = s.coreShield || 0;

      let raidActive = s.raidActive;
      let raidRemaining = s.raidRemaining;
      let raidKills = s.raidKills || 0;
      let scoutQueue = s.scoutQueue ? [...s.scoutQueue] : [];
      let advanceDay = false;
      let dpRegenCounter = s.dpRegenCounter || 0;
      const eventMods = s.dailyEvent?.mods || {};
      const artifactMods = calcArtifactMods(s.artifacts, s.day);
      const dominionEffects = s.dominionEffects || {};
      const doctrineEffectsLocal = getDoctrineEffects(s.doctrines || {});
      const raidBoons = s.activeRaidBoons || [];
      const raidMult = s.raidType === "council" ? 1.6 : s.raidType === "elite" ? 1.3 : 1;

      let turnsSurvived = s.turnsSurvived;
      let heroesIn = s.heroes;

      const { entrance: ent, core: corePos } = findEntranceAndCore(grid);

      const logLines = [];
      const push = (msg) => logLines.push(msg);

      const dist = (ax, ay, bx, by) => Math.abs(ax - bx) + Math.abs(ay - by);
      const effectiveUtilityTier = (x, y, key) => {
        const baseTier = utilityTier(grid, x, y, key);
        if (baseTier <= 0) return 0;
        return baseTier + doctrineEffectsLocal.utilityPotencyBonus + doctrineEffectsLocal.utilityPotencyBonusExtra;
      };

      const getStatus = (h, key) => h.statuses?.[key] || { turns: 0, value: 0 };
      const setStatus = (h, key, turns, value) => {
        const cur = getStatus(h, key);
        h.statuses = h.statuses || {};
        h.statuses[key] = {
          turns: Math.max(cur.turns, turns),
          value: value !== undefined ? value : cur.value || 0,
        };
      };
      const tickStatus = (h, key) => {
        const cur = getStatus(h, key);
        if (cur.turns > 0) {
          cur.turns -= 1;
          h.statuses[key] = cur;
        }
        return cur.turns > 0;
      };
      const consumeStatus = (h, key) => {
        const cur = getStatus(h, key);
        if (cur.turns > 0) {
          cur.turns -= 1;
          h.statuses[key] = cur;
          return true;
        }
        return false;
      };

      const heroHasPassive = (h, name) => normalizeHeroPassiveKey(h.heroPassiveKey || h.passive) === normalizeHeroPassiveKey(name);
      const rememberDanger = (h, x, y, amount = 1) => {
        h.memory = h.memory || { danger: {}, lastIntent: null };
        const key = keyOf(x, y);
        h.memory.danger[key] = Math.min(12, (h.memory.danger[key] || 0) + Math.max(1, Math.round(amount)));
      };

      const tryApplyDebuff = (h, key, turns, value, label) => {
        h.counters = h.counters || {};
        if (heroHasPassive(h, "Warded") && !h.counters.wardedUsed) {
          h.counters.wardedUsed = true;
          return false;
        }
        if (heroHasPassive(h, "Brave") && key === "fear") return false;
        if (heroHasPassive(h, "Resolute") && key === "slow" && !h.counters.resoluteUsed) {
          h.counters.resoluteUsed = true;
          return false;
        }
        if (heroHasPassive(h, "Focused") && Math.random() < 0.5) return false;
        setStatus(h, key, turns, value);
        if (label) push(label);
        return true;
      };

      let kills = 0;
      function heroDies(h, why) {
        const essenceGain = Math.round(HERO_KILL_ESSENCE * (eventMods.essenceMult || 1) * raidMult);
        const shardGain = Math.round(HERO_KILL_SOULSHARDS * (eventMods.soulshardMult || 1) * raidMult);
        const extraEssence = artifactMods.essenceOnKill || 0;
        const extraShards = artifactMods.soulshardOnKill || 0;
        essence += essenceGain + extraEssence;
        soulshards += shardGain + extraShards;
        kills += 1;
        if (h.counters?.cursedMark) {
          const curseGain = Math.round(h.counters.cursedMark * (eventMods.essenceMult || 1));
          essence += curseGain;
          push(`Cursed Brand triggers on ${invaderLabel(h)}. +${curseGain} Essence`);
        }
        const altarTier = effectiveUtilityTier(h.x, h.y, "soul-altar");
        if (altarTier > 0) {
          const altarGain = 15 + (altarTier - 1) * 5;
          essence += Math.round(altarGain * (eventMods.essenceMult || 1));
          push(`Soul Altar feeds on ${invaderLabel(h)}. +${altarGain} Essence`);
        }
        const totalEssence = essenceGain + extraEssence;
        const totalShards = shardGain + extraShards;
        push(`${invaderLabel(h)} dies (${why}). +${totalEssence} Essence, +${totalShards} Soulshards`);
      }

      turnsSurvived += 1;
      push(`Turn ${turnsSurvived}`);

      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const t = grid[y][x];
          if (t.room === "monster") {
            for (const m of t.monsters) {
              m.shieldedThisTurn = false;
            }
          }
        }
      }

      const heroAtkValue = (h) => {
        const bonus =
          (heroHasPassive(h, "Reckless") ? 1 : 0) +
          (getStatus(h, "bloodlust").turns > 0 ? 1 : 0) +
          (eventMods.heroAtk || 0);
        return Math.max(1, h.atk + (getStatus(h, "fear").turns > 0 ? -1 : 0) + bonus);
      };
      const heroDefValue = (h) => (h.def || 0) + (getStatus(h, "weaken").turns > 0 ? -1 : 0);

      function applySiphon(h, x, y) {
        const tier = effectiveUtilityTier(x, y, "siphon-pylon");
        if (tier <= 0) return;
        h.counters = h.counters || { stunnedOnce: false, siphonGained: 0, tookDamageThisRaid: false, cursedMark: 0 };
        const cap = 10 + (tier - 1) * 5;
        if ((h.counters.siphonGained || 0) >= cap) return;
        essence += Math.round(1 * (eventMods.essenceMult || 1));
        h.counters.siphonGained = (h.counters.siphonGained || 0) + 1;
      }

      function applyHeroDamage(h, dmg, x, y, mitigated = true) {
        let final = mitigated ? Math.max(1, dmg - heroDefValue(h)) : Math.max(0, dmg);
        const maxHp = safeEntityMaxHp(h) || h.hp || 1;
        if (heroHasPassive(h, "Unyielding") && h.hp / maxHp > 0.5) {
          final = Math.max(0, final - 1);
        }
        if (heroHasPassive(h, "Stoic") && !h.counters?.stoicUsed) {
          final = Math.max(0, final - 1);
          h.counters = h.counters || {};
          h.counters.stoicUsed = true;
        }
        if (heroHasPassive(h, "Reckless")) {
          final += 1;
        }
        if (final > 0) {
          h.hp -= final;
          h.counters = h.counters || { stunnedOnce: false, siphonGained: 0, tookDamageThisRaid: false, cursedMark: 0 };
          h.counters.tookDamageThisRaid = true;
          rememberDanger(h, x, y, Math.max(1, Math.round(final / 4)));
          applySiphon(h, x, y);
        }
        return final;
      }

      function monsterAtkBonus(room, x, y) {
        let bonus = 0;
        const warTier = effectiveUtilityTier(x, y, "war-drum");
        if (warTier > 0) bonus += warTier;
        const roomTierBonus = Math.max(0, (room.roomTier || 1) - 1);
        bonus += roomTierBonus;
        if (room.roomType === "rally-banner" && room.monsters.length >= 2) bonus += 1;
        if (room.roomType === "pack-tactics") bonus += Math.min(2, room.monsters.length - 1);
        if (roomHasPassive(room, "warbanner")) bonus += roomPassiveRank(room, "warbanner");
        if (roomHasPassive(room, "packleader") && room.monsters.length >= 2) bonus += roomPassiveRank(room, "packleader");
        bonus += eventMods.monsterAtk || 0;
        bonus += artifactMods.monsterAtk || 0;
        bonus += dominionEffects.monsterAtk || 0;
        bonus += doctrineEffectsLocal.monsterAtkBonus || 0;
        return bonus;
      }

      function monsterMaxHp(m) {
        const baseMax = m.stats && Number.isFinite(m.stats.maxHp) ? m.stats.maxHp : m.hp;
        return baseMax + (doctrineEffectsLocal.monsterHpBonus || 0);
      }

      function monsterDefBonus(x, y) {
        const tier = effectiveUtilityTier(x, y, "reinforced-keystone");
        const base = tier > 0 ? 2 + (tier - 1) : 0;
        let bonus = base + (eventMods.monsterDef || 0);
        const room = grid[y][x];
        if (room && room.room === "monster" && roomHasPassive(room, "warding")) {
          bonus += roomPassiveRank(room, "warding");
        }
        return bonus;
      }

      function trapDamage(tile, base, x, y, extraFlat = 0) {
        if (!base && !extraFlat) return 0;
        const trapStar = clampMonsterStar(tile.trapStar ?? tile.trapStars ?? 1);
        const trapRank = Math.max(1, tile.trapRank ?? tile.roomTier ?? 1);
        let dmg = base * (1 + 0.25 * (trapStar - 1)) + (trapRank - 1) * 2 + extraFlat + (doctrineEffectsLocal.trapFlatDamage || 0);
        let mult = 1;
        const wardTier = effectiveUtilityTier(x, y, "ward-lantern");
        if (wardTier > 0) mult += 0.25 + 0.05 * (wardTier - 1);
        if (artifactMods.trapMult) mult += artifactMods.trapMult;
        return Math.max(0, Math.round(dmg * mult));
      }

      if (dominionEffects.pulsePending && heroesIn.length > 0) {
        const afterPulse = [];
        for (const h0 of heroesIn) {
          let h = { ...h0 };
          h.statuses = h.statuses || {};
          h.counters = h.counters || { stunnedOnce: false, siphonGained: 0, tookDamageThisRaid: false, cursedMark: 0 };
          const dmg = applyHeroDamage(h, 5, h.x, h.y, false);
          push(`Dominion Pulse hits ${invaderLabel(h)} for ${dmg}. HP ${Math.max(0, h.hp)}`);
          if (h.hp <= 0) {
            heroDies(h, "dominion pulse");
            continue;
          }
          afterPulse.push(h);
        }
        heroesIn = afterPulse;
      }

      for (const h0 of heroesIn) {
        let h = { ...h0 };
        h.statuses = h.statuses || {};
        h.counters = h.counters || {
          stunnedOnce: false,
          siphonGained: 0,
          tookDamageThisRaid: false,
          cursedMark: 0,
          wardedUsed: false,
          resoluteUsed: false,
          stoicUsed: false,
        };
        h.counters.stoicUsed = false;
        if (h.hp <= 0) continue;

        if (eventMods.heroSpd) {
          h.spd = (h.spd || 0) + eventMods.heroSpd;
        }

        const t = grid[h.y][h.x];

        // CORE FIGHT
        if (t.core) {
          let heroAtk = heroAtkValue(h);
          const reduction = artifactMods.coreDamageReduction || 0;
          if (reduction > 0) heroAtk = Math.max(1, heroAtk - reduction);
          if (coreShield > 0) {
            const blocked = Math.min(coreShield, heroAtk);
            if (blocked > 0) {
              coreShield -= blocked;
              heroAtk -= blocked;
              push(`Core shield absorbs ${blocked}.`);
            }
          }
          coreHp -= heroAtk;
          const coreCounter = DUNGEON_LORD_ATK + (doctrineEffectsLocal.dungeonlordAtkBonus || 0);
          const coreDmg = applyHeroDamage(h, coreCounter, h.x, h.y, true);
          push(
            `${invaderLabel(h)} hits Core for ${heroAtk}. Core HP ${Math.max(0, coreHp)}. Core retaliates for ${coreDmg} (${DUNGEON_LORD_ATK}${doctrineEffectsLocal.dungeonlordAtkBonus ? `+${doctrineEffectsLocal.dungeonlordAtkBonus}` : ""}). ${invaderLabel(h)} HP ${Math.max(0, h.hp)}`
          );

          if (h.hp <= 0) {
            heroDies(h, "slain at the Core");
            continue;
          }
          heroesOut.push(h);
          continue;
        }

        // MONSTER FIGHT
        if (t.room === "monster" && t.monsters.length > 0) {
          const m = t.monsters[0];
          const heroAtk = heroAtkValue(h);
          const atkBonus = monsterAtkBonus(t, h.x, h.y);
          let monsterAtk = m.atk + atkBonus;
          const hasteFirst =
            effectiveUtilityTier(h.x, h.y, "haste-glyph") > 0 ||
            dominionEffects.monsterFirstStrike ||
            roomHasPassive(t, "swift");
          let tempDefBonus = 0;
          if (monsterHasPassive(m, "ironhide")) {
            const maxHp = monsterMaxHp(m);
            if (m.hp / Math.max(1, maxHp) > 0.5) {
              tempDefBonus = monsterPassiveRank(m, "ironhide");
            }
          }
          if (monsterHasPassive(m, "cruelty") && h.hp < safeEntityMaxHp(h) * 0.5) {
            monsterAtk += monsterPassiveRank(m, "cruelty");
          }

          const heroStrike = () => {
            const def = (m.def || 0) + monsterDefBonus(h.x, h.y) + tempDefBonus;
            let dmg = Math.max(1, heroAtk - def);
            let mitigation = heroAtk - dmg;
            if (t.roomType === "brawlers-ring" && !m.shieldedThisTurn) {
              mitigation += 2;
              dmg = Math.max(0, dmg - 2);
              m.shieldedThisTurn = true;
            }
            if (monsterHasPassive(m, "thorns")) {
              applyHeroDamage(h, monsterPassiveRank(m, "thorns"), h.x, h.y, false);
            }
            if (monsterHasPassive(m, "bulwark") && !m.shieldedThisTurn) {
              mitigation += monsterPassiveRank(m, "bulwark");
              dmg = Math.max(0, dmg - monsterPassiveRank(m, "bulwark"));
              m.shieldedThisTurn = true;
            }
            m.hp -= dmg;
            return { dmg, base: heroAtk, defense: def, mitigation };
          };

          const monsterStrike = () => {
            let bonus = 0;
            if (monsterHasPassive(m, "savage")) bonus += 2 * monsterPassiveRank(m, "savage");
            const totalBase = monsterAtk + bonus;
            const defense = heroDefValue(h);
            const dmg = applyHeroDamage(h, totalBase, h.x, h.y, true);
            if (dmg > 0 && t.roomType === "savage-kennels") {
              m.hp = Math.min(monsterMaxHp(m), m.hp + 2);
            }
            if (dmg > 0 && t.roomType === "hex-circle") {
              tryApplyDebuff(h, "weaken", 2, 1);
            }
            if (dmg > 0 && monsterHasPassive(m, "hex")) {
              tryApplyDebuff(h, "weaken", 2, monsterPassiveRank(m, "hex"));
            }
            if (dmg > 0 && monsterHasPassive(m, "leech")) {
              m.hp = Math.min(monsterMaxHp(m), m.hp + 2 * monsterPassiveRank(m, "leech"));
            }
            return { dmg, base: totalBase, defense };
          };

          for (const roomMonster of t.monsters) {
            roomMonster.foughtThisRaid = true;
          }

          if (t.roomType === "ambush-alcove" && !t.ambushUsed) {
            const ambush = monsterStrike();
            t.ambushUsed = true;
            push(`Ambush! ${m.name} -> ${invaderLabel(h)}: base ${ambush.base}, DEF ${ambush.defense}, final ${ambush.dmg}. HP ${Math.max(0, h.hp)}`);
            if (h.hp <= 0) {
              heroDies(h, "ambushed");
              continue;
            }
          }

          if (hasteFirst) {
            const hitOnInvader = monsterStrike();
            if (hitOnInvader.dmg > 0) {
              push(`${m.name} -> ${invaderLabel(h)}: base ${hitOnInvader.base}, DEF ${hitOnInvader.defense}, final ${hitOnInvader.dmg}. HP ${Math.max(0, h.hp)}`);
            }
            if (h.hp <= 0) {
              heroDies(h, "killed in battle");
              continue;
            }
            const hitOnMonster = heroStrike();
            push(`${invaderLabel(h)} -> ${m.name}: base ${hitOnMonster.base}, DEF ${hitOnMonster.defense}, mitigation ${hitOnMonster.mitigation}, final ${hitOnMonster.dmg}. ${m.name} HP ${Math.max(0, m.hp)}`);
          } else {
            const hitOnMonster = heroStrike();
            push(`${invaderLabel(h)} -> ${m.name}: base ${hitOnMonster.base}, DEF ${hitOnMonster.defense}, mitigation ${hitOnMonster.mitigation}, final ${hitOnMonster.dmg}. ${m.name} HP ${Math.max(0, m.hp)}`);
            if (m.hp > 0) {
              const hitOnInvader = monsterStrike();
              if (hitOnInvader.dmg > 0) {
                push(`${m.name} -> ${invaderLabel(h)}: base ${hitOnInvader.base}, DEF ${hitOnInvader.defense}, final ${hitOnInvader.dmg}. HP ${Math.max(0, h.hp)}`);
              }
            }
          }

          if (m.hp <= 0) {
            t.monsters.shift();
            push(`${m.name} defeated.`);
            if (heroHasPassive(h, "Bloodlust")) {
              setStatus(h, "bloodlust", 1, 1);
            }
          } else {
            if (monsterHasPassive(m, "bulwark")) {
              if (!m.shieldedThisTurn) {
                m.shieldedThisTurn = true;
              }
            }
          }

          if (h.hp <= 0) {
            heroDies(h, "killed in battle");
            continue;
          }

          heroesOut.push(h);
          continue;
        }

        const applyFearAura = () => {
          const fearTier = effectiveUtilityTier(h.x, h.y, "fear-idol");
          if (fearTier > 0) tryApplyDebuff(h, "fear", 2 + (fearTier - 1), 1);
        };

        // MOVE
        let moved = false;
        let skipped = false;
        if (consumeStatus(h, "stun")) {
          skipped = true;
          push(`${invaderLabel(h)} is stunned.`);
        }
        if (consumeStatus(h, "root")) {
          skipped = true;
          push(`${invaderLabel(h)} is rooted.`);
        }
        if (consumeStatus(h, "slow")) {
          if (!heroHasPassive(h, "Quick")) {
            skipped = true;
            push(`${invaderLabel(h)} is slowed.`);
          }
        }

        if (!skipped) {
          const moveChoice = chooseInvaderMove(h, grid, corePos, raidBoons, doctrineEffectsLocal);
          if (moveChoice.next) {
            const next = moveChoice.next;
            h.prev = { x: h.x, y: h.y };
            h.x = next.x;
            h.y = next.y;
            h.memory = h.memory || { danger: {}, lastIntent: null };
            h.memory.lastIntent = moveChoice.intent;
            moved = true;
            push(`${invaderLabel(h)} moves to (${h.x + 1},${h.y + 1}) - ${moveChoice.intent}`);
          } else {
            push(`${invaderLabel(h)} waits (no path).`);
          }
        }

        if (moved) {
          applyFearAura();
        }

        // TRAP TRIGGER
        const t2 = grid[h.y][h.x];
        if (moved && t2.room === "monster" && t2.monsters.length > 0) {
          if (roomHasPassive(t2, "venom-aura")) {
            if (tryApplyDebuff(h, "poison", 2 + Math.max(0, roomPassiveRank(t2, "venom-aura") - 1), 2 + roomPassiveRank(t2, "venom-aura"))) {
              push(`${invaderLabel(h)} is poisoned by Venom Aura.`);
            }
          }
          if (roomHasPassive(t2, "dread-howl")) {
            if (tryApplyDebuff(h, "fear", 2 + Math.max(0, roomPassiveRank(t2, "dread-howl") - 1), 1)) {
              push(`${invaderLabel(h)} is terrified by Dread Howl.`);
            }
          }
          if (roomHasPassive(t2, "rot-cloud")) {
            const rotDmg = applyHeroDamage(h, roomPassiveRank(t2, "rot-cloud"), h.x, h.y, false);
            if (rotDmg > 0) {
              push(`${invaderLabel(h)} is seared by Rot Cloud for ${rotDmg}.`);
            }
            if (h.hp <= 0) {
              heroDies(h, "rot cloud");
              continue;
            }
          }
        }
        if (moved && t2.room === "trap" && t2.trap) {
          if ((t2.trapType || "spike-pit") === "shatter-floor" && t2.trapBroken) {
            push("Shatter Floor is broken.");
          } else {
            const trapKey = t2.trapType || "spike-pit";
            const trapStar = clampMonsterStar(t2.trapStar ?? t2.trapStars ?? 1);
            const trapRank = Math.max(1, t2.trapRank ?? t2.roomTier ?? 1);
            const charges = Math.max(0, t2.trapChargesRemaining ?? 0);
            const cooldown = Math.max(0, t2.trapCooldownRemaining ?? 0);
            if (charges > 0 && cooldown === 0) {
              const trapBase = TRAP_MAP[trapKey]?.baseDmg || 0;
              const extraFlat = trapKey === "flame-jet" && h.counters.tookDamageThisRaid ? 4 : 0;
              let trapDmg = trapDamage(t2, trapBase, h.x, h.y, extraFlat);

              if (heroHasPassive(h, "Keen")) {
                trapDmg = Math.max(0, trapDmg - 1);
              }

              let dealt = 0;
              if (trapDmg > 0) {
                dealt = applyHeroDamage(h, trapDmg, h.x, h.y, false);
              }

              if (trapKey === "poison-vent") {
                const poisonTurns = 3 + Math.floor((trapStar - 1) / 2);
                const poisonValue = 2 + Math.floor((trapStar - 1) / 2);
                if (tryApplyDebuff(h, "poison", poisonTurns, poisonValue)) {
                  push(`${invaderLabel(h)} is poisoned.`);
                }
              } else if (trapKey === "frost-rune") {
                const slowTurns = 2 + Math.floor((trapStar - 1) / 2);
                if (tryApplyDebuff(h, "slow", slowTurns, 1)) {
                  push(`${invaderLabel(h)} is slowed.`);
                }
              } else if (trapKey === "shock-coil") {
                if (!h.counters.stunnedOnce) {
                  if (tryApplyDebuff(h, "stun", 1, 1)) {
                    h.counters.stunnedOnce = true;
                    push(`${invaderLabel(h)} is stunned.`);
                  }
                }
              } else if (trapKey === "snare-net") {
                const rootTurns = 1 + Math.floor((trapStar - 1) / 2);
                if (tryApplyDebuff(h, "root", rootTurns, 1)) {
                  push(`${invaderLabel(h)} is rooted.`);
                }
              } else if (trapKey === "cursed-brand") {
                h.counters.cursedMark = 10 + (trapRank - 1) * 2 + (trapStar - 1) * 2;
                push(`${invaderLabel(h)} is cursed.`);
              } else if (trapKey === "blink-trap") {
                const back = h.prev ? { ...h.prev } : ent;
                if (back) {
                  const from = { x: h.x, y: h.y };
                  h.x = back.x;
                  h.y = back.y;
                  h.prev = from;
                  push(`${invaderLabel(h)} blinks back to (${h.x + 1},${h.y + 1}).`);
                  applyFearAura();
                }
              } else if (trapKey === "arrow-gallery") {
                const arrowDamage = trapDamage(t2, trapBase, h.x, h.y, 0);
                setStatus(h, "arrow", 1, arrowDamage);
                push(`${invaderLabel(h)} is targeted by arrows.`);
              }

              t2.trapChargesRemaining = Math.max(0, charges - 1);
              t2.trapCooldownRemaining = trapCooldownAfterTrigger(trapKey, trapStar);
              push(
                `${TRAP_MAP[trapKey]?.name || "Trap"} (${formatStars(trapStar)}) -> ${invaderLabel(h)}: base ${trapBase}, star x${(1 + 0.25 * (trapStar - 1)).toFixed(2)}, rank +${(trapRank - 1) * 2}, final ${dealt}, charges ${t2.trapChargesRemaining}, cd ${t2.trapCooldownRemaining}.`
              );

              if (trapKey === "shatter-floor") {
                t2.trapBroken = true;
                t2.trapChargesRemaining = 0;
                t2.trapCooldownRemaining = 0;
              }
            }
          }

          if (h.hp <= 0) {
            heroDies(h, "trap");
            continue;
          }
        }

        if (getStatus(h, "poison").turns > 0) {
          const poisonVal = getStatus(h, "poison").value || 2;
          const poisonDmg = applyHeroDamage(h, poisonVal, h.x, h.y, false);
          consumeStatus(h, "poison");
          push(`${invaderLabel(h)} takes ${poisonDmg} poison damage. HP ${Math.max(0, h.hp)}`);
          if (h.hp <= 0) {
            heroDies(h, "poison");
            continue;
          }
        }

        if (getStatus(h, "arrow").turns > 0) {
          const arrowDmg = applyHeroDamage(h, getStatus(h, "arrow").value || 3, h.x, h.y, false);
          consumeStatus(h, "arrow");
          push(`${invaderLabel(h)} is hit by arrows for ${arrowDmg}. HP ${Math.max(0, h.hp)}`);
          if (h.hp <= 0) {
            heroDies(h, "arrows");
            continue;
          }
        }

        tickStatus(h, "fear");
        tickStatus(h, "weaken");
        tickStatus(h, "bloodlust");

        if (heroHasPassive(h, "Vigorous")) {
          h.hp = Math.min(safeEntityMaxHp(h), h.hp + 1);
        }

        heroesOut.push(h);
      }

      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const t = grid[y][x];
          if (t.room === "trap" && t.trapCooldownRemaining > 0) {
            t.trapCooldownRemaining = Math.max(0, t.trapCooldownRemaining - 1);
          }
          const sigilTier = effectiveUtilityTier(x, y, "blood-sigil");
          if (t.room === "monster" && t.monsters.length > 0) {
            if (sigilTier > 0) {
              const heal = 2 + (sigilTier - 1);
              for (const m of t.monsters) {
                m.hp = Math.min(monsterMaxHp(m), m.hp + heal);
              }
            }
            if (roomHasPassive(t, "bloodcall")) {
              for (const m of t.monsters) {
                m.hp = Math.min(monsterMaxHp(m), m.hp + roomPassiveRank(t, "bloodcall"));
              }
            }
            if (roomHasPassive(t, "mender")) {
              let lowest = null;
              for (const m of t.monsters) {
                if (!lowest || m.hp < lowest.hp) lowest = m;
              }
              if (lowest) {
                lowest.hp = Math.min(monsterMaxHp(lowest), lowest.hp + roomPassiveRank(t, "mender"));
              }
            }
          }
        }
      }

      // GAME OVER
      if (kills > 0) {
        raidKills += kills;
        push(`Heroes defeated this turn: ${kills}`);
      }

      if (coreHp <= 0) {
        raidActive = false;
        let nextState = {
          ...s,
          grid,
          heroes: heroesOut,
          currency: { ...s.currency, essence, soulshards },
          coreShield,
          coreHp,
          raidActive,
          raidRemaining,
          turnsSurvived,
          raidKills,
          scoutQueue: [],
          activeRaidBoons: [],
        };
        nextState = addLog(nextState, "CORE DESTROYED - Defeat.");
        for (let i = logLines.length - 1; i >= 0; i--) nextState = addLog(nextState, logLines[i]);
        return nextState;
      }

      // DRIP SPAWN (finite)
      let nextHeroId = s.nextHeroId;
      let partyQueue = s.partyQueue ? [...s.partyQueue] : [];
      if (raidActive && partyQueue.length > 0 && ent && heroesOut.length < HERO_CAP) {
        const spawnResult = spawnOneHero(heroesOut, nextHeroId, ent, turnsSurvived, partyQueue, grid, s.raidType, s.day);
        nextHeroId = spawnResult.nextHeroId;
        partyQueue = spawnResult.scoutQueue;
        raidRemaining = partyQueue.length;
        push(`${invaderLabel(spawnResult.spawned)} enters. (${raidRemaining} left in this raid)`);
      } else if (raidActive && partyQueue.length > 0 && heroesOut.length >= HERO_CAP) {
        raidRemaining = partyQueue.length;
        push(`Invader cap reached (${HERO_CAP}). (${raidRemaining} still pending)`);
      }

      // AUTO-STOP (finite raid ends only when none left to spawn AND none alive)
      if (raidActive && raidRemaining === 0 && heroesOut.length === 0) {
        raidActive = false;
        const turnsSpent = Math.max(0, turnsSurvived - (s.raidStartTurn || 0));
        const essenceGained = Math.max(0, essence - (s.raidStartEssence || 0));
        const soulshardsGained = Math.max(0, soulshards - (s.raidStartShards || 0));
        const coreDamage = Math.max(0, (s.raidStartCoreHp || getCoreMaxHp(s)) - coreHp);
        push(`Raid ended. Build phase.`);
        push(`Raid report: ${turnsSpent} turns, ${raidKills} kills, +${essenceGained} Essence, +${soulshardsGained} Soulshards, ${coreDamage} core damage.`);
        scoutQueue = [];
        partyQueue = [];
        raidRemaining = 0;
        raidActive = false;
        advanceDay = true;
      }

      let nextState = {
        ...s,
        grid,
        heroes: heroesOut,
        currency: { ...s.currency, essence, soulshards },
        coreHp,
        coreShield,
        raidActive,
        raidRemaining,
        turnsSurvived,
        nextHeroId,
        raidKills,
        scoutQueue,
        partyQueue,
        dpRegenCounter,
        activeRaidBoons: raidActive ? raidBoons : [],
      };
      nextState.dominionEffects = { monsterAtk: 0, monsterFirstStrike: false, pulsePending: false };

      if (advanceDay) {
        nextState.day = (s.day || 1) + 1;
        nextState.phase = "build";
        nextState.currentParty = [];
        nextState.partyQueue = [];
        nextState.dailyEvent = rollDailyEvent();
        nextState.traderStock = generateTraderStock(nextState.turnsSurvived, nextState.day);
        nextState.shadyStock = generateArtifactStock();
        nextState.dpRegenCounter = 0;
        let evoAwards = 0;
        for (let y = 0; y < H; y++) {
          for (let x = 0; x < W; x++) {
            const t = grid[y][x];
            if (t.room === "monster") {
              for (const m of t.monsters) {
                if (m.foughtThisRaid) {
                  m.evoPoints = (m.evoPoints || 0) + 1;
                  evoAwards += 1;
                }
                m.foughtThisRaid = false;
              }
            }
          }
        }
        if (evoAwards > 0) {
          nextState = addLog(nextState, `Monsters that fought gain +1 Evolution (${evoAwards}).`);
        }
        const evoGain = Math.floor(raidKills / Math.max(2, Math.round(dayMultiplier(nextState.day, 0.05, 4))));
        if (evoGain > 0) {
          nextState.currency = { ...nextState.currency, evolution: nextState.currency.evolution + evoGain };
          nextState = addLog(nextState, `Evolution gained: +${evoGain}.`);
        }
        if (nextState.councilQuest?.active) {
          const progress = (nextState.councilQuest.progress || 0) + (s.raidKills || 0);
          const goal = nextState.councilQuest.goal || 0;
          if (progress >= goal) {
            const reward = nextState.councilQuest.reward || { type: "essence", amount: 0 };
            const currency = { ...nextState.currency };
            if (reward.type === "soulshards") currency.soulshards += reward.amount;
            else if (reward.type === "dominion") currency.dominion = Math.min(DOMINION_CAP, currency.dominion + reward.amount);
            else if (reward.type === "evolution") currency.evolution += reward.amount;
            else currency.essence += reward.amount;
            nextState.currency = currency;
            nextState = addLog(nextState, `Council quest completed: ${nextState.councilQuest.title}. Reward claimed.`);
            nextState.councilQuest = { ...nextState.councilQuest, active: false, progress: goal };
          } else {
            nextState.councilQuest = { ...nextState.councilQuest, progress };
          }
        }
        const councilDue = nextState.day % COUNCIL_INTERVAL === 0;
        if (councilDue) {
          const council = nextState.council || { active: false, day: null, roster: [], lastRoster: [], declinedStreak: 0 };
          const roster = buildCouncilRoster(council.lastRoster || []);
          const councilFavor = nextState.councilFavor || {};
          nextState.council = {
            ...council,
            active: true,
            day: nextState.day,
            roster,
            lastRoster: roster,
          };
          const punitive = council.declinedStreak >= 2;
          nextState.nextRaidType = punitive ? "council" : "elite";
          nextState.pendingPunitiveRaid = punitive;
          nextState.pendingCouncilRaid = punitive ? buildCouncilRaidFromRoster(roster, nextState.day, councilFavor) : null;
          nextState.councilSession = buildCouncilSession(roster, nextState.day);
          nextState = addLog(nextState, "Council of the Dungeonlords convenes. Attend or decline.");
        }
        if (nextState.councilSession && nextState.councilSession.day !== nextState.day) {
          nextState.councilSession = null;
        }
        if (!councilDue) {
          nextState.pendingCouncilRaid = nextState.pendingPunitiveRaid ? nextState.pendingCouncilRaid : null;
        }
        nextState.raidType = null;
        nextState.activeRaidBoons = [];
        nextState = addLog(nextState, `Day ${nextState.day} begins. Build phase.`);
        if (nextState.dailyEvent?.key && nextState.dailyEvent.key !== "none") {
          nextState = addLog(nextState, `Daily Event: ${nextState.dailyEvent.name} - ${nextState.dailyEvent.desc}`);
        }
      }

      if (!raidActive && raidRemaining === 0 && heroesOut.length === 0) {
        const turnsSpent = Math.max(0, turnsSurvived - (s.raidStartTurn || 0));
        const essenceGained = Math.max(0, essence - (s.raidStartEssence || 0));
        const soulshardsGained = Math.max(0, soulshards - (s.raidStartShards || 0));
        const coreDamage = Math.max(0, (s.raidStartCoreHp || getCoreMaxHp(s)) - coreHp);
        nextState.lastRaidReport = {
          turns: turnsSpent,
          kills: raidKills,
          essence: essenceGained,
          soulshards: soulshardsGained,
          coreDamage,
        };
      }

      if (raidActive) {
        dpRegenCounter += 1;
        const regenStep = 2 - (eventMods.dpRegenBoost || 0);
        if (dpRegenCounter >= Math.max(1, regenStep)) {
          dpRegenCounter = 0;
          nextState.currency = {
            ...nextState.currency,
            dominion: Math.min(DOMINION_CAP, nextState.currency.dominion + 1),
          };
          nextState = addLog(nextState, "Dominion regenerates (+1).");
        }
      }
      nextState.dpRegenCounter = dpRegenCounter;

      for (let i = logLines.length - 1; i >= 0; i--) nextState = addLog(nextState, logLines[i]);
      return nextState;
    });
  }

  function resetRun() {
    setState((s) => {
      const grid = resetLayoutKeepStructure(s.grid);
      const startingParty = generateRaidParty(0, null, 1);
      const dailyEvent = rollDailyEvent();
      const traderStock = generateTraderStock(0, 1);
      const shadyStock = generateArtifactStock();
      let ns = {
        ...s,
        grid,
        currency: {
          ...s.currency,
          soulshards: 30,
          essence: 10,
          evolution: 0,
          dominion: 0,
          darkcrystals: 0,
        },
        doctrines: {
          trap: 0,
          monster: 0,
          utility: 0,
          core: 0,
        },
        artifacts: [],
        shadyStock,
        coreHp: getCoreMaxHp({ doctrines: { trap: 0, monster: 0, utility: 0, core: 0 } }),
        coreShield: 0,
        heroes: [],
        nextHeroId: 1,
        invMonsters: initMonsterInventory(0, 2, 2, 1),
        raidActive: false,
        raidRemaining: 0,
        turnsSurvived: 0,
        raidStartTurn: 0,
        raidStartEssence: 0,
        raidStartShards: 30,
        raidStartCoreHp: getCoreMaxHp({ doctrines: { trap: 0, monster: 0, utility: 0, core: 0 } }),
        raidKills: 0,
        raidType: null,
        lastRaidReport: null,
        movePayload: null,
        scoutQueue: [],
        day: 1,
        phase: "battle",
        currentParty: startingParty,
        currentPartyRaidType: null,
        partyQueue: startingParty.map((h) => ({ ...h })),
        dailyEvent,
        traderStock,
        dpRegenCounter: 0,
        dominionEffects: {
          monsterAtk: 0,
          monsterFirstStrike: false,
          pulsePending: false,
        },
        council: {
          active: false,
          day: null,
          roster: [],
          lastRoster: [],
          declinedStreak: 0,
        },
        councilFavor: {},
        councilSession: null,
        councilQuest: null,
        nextRaidType: null,
        pendingPunitiveRaid: false,
        pendingCouncilRaid: null,
        nextRaidBoons: [],
        activeRaidBoons: [],
        fleshMarketUntilDay: 0,
        evolutionOffer: null,
      };
      ns = addLog(ns, "Run reset (layout kept).");
      return ns;
    });
  }

  function newRun() {
    setState(() => ({
      ...defaultState(),
      log: ["Day 1 begins. Build phase skipped. Prepare for the raid."],
    }));
  }

  function loadRun() {
    const loaded = loadSavedState();
    if (!loaded) {
      setState((s) => addLog(s, "No saved run found."));
      return;
    }
    setState(() => loaded);
  }

  function saveRun() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      setState((s) => addLog(s, "Run saved."));
    } catch {
      setState((s) => addLog(s, "Save failed."));
    }
  }

  function attendCouncil() {
    if (!state.council?.active) return;
    setSidePanel("council");
    setCouncilScreenOpen(true);
    setState((s) => {
      const council = { ...s.council, active: false, declinedStreak: 0 };
      const nextRaidType = "elite";
      const councilSession = s.councilSession ? { ...s.councilSession, status: "attended" } : s.councilSession;
      let councilFavor = { ...(s.councilFavor || {}) };
      for (const member of council.roster || []) {
        councilFavor = applyCouncilFavorShift(councilFavor, member.key, 1);
      }
      let ns = {
        ...s,
        council,
        councilFavor,
        nextRaidType,
        pendingPunitiveRaid: false,
        pendingCouncilRaid: null,
        councilSession,
      };
      ns = addLog(ns, "You attended the Council.");
      if (council.roster?.length) {
        const names = council.roster.map((m) => m.name).join(", ");
        ns = addLog(ns, `Council attendees: ${names}.`);
      }
      if (s.phase === "battle") {
        const party = generateRaidParty(s.turnsSurvived, nextRaidType, s.day, {
          councilRaid: null,
          raidBoons: s.nextRaidBoons,
        });
        let scoutQueue = [];
        const doctrineEffects = getDoctrineEffects(s.doctrines);
        const raidMods = buildRaidModifiers(s.nextRaidBoons);
        const mirrorTier = maxUtilityTier(s.grid, "scout-mirror") + doctrineEffects.utilityScoutBonus;
        if (mirrorTier > 0) {
          const revealCount = Math.min(party.length, 2 + (mirrorTier - 1) + raidMods.scoutRevealBonus);
          scoutQueue = party.slice(0, revealCount).map((h) => ({ ...h }));
        }
        ns = {
          ...ns,
          currentParty: party,
          currentPartyRaidType: nextRaidType || null,
          partyQueue: party.map((h) => ({ ...h })),
          scoutQueue,
        };
        ns = addLog(ns, "Council choice updated today's raid.");
      }
      return ns;
    });
  }

  function declineCouncil() {
    if (!state.council?.active) return;
    setSidePanel("council");
    setCouncilScreenOpen(false);
    setState((s) => {
      const declinedStreak = (s.council?.declinedStreak || 0) + 1;
      const council = { ...s.council, active: false, declinedStreak };
      const nextRaidType = declinedStreak >= 2 ? "council" : "elite";
      const councilSession = s.councilSession ? { ...s.councilSession, status: "declined" } : s.councilSession;
      let councilFavor = { ...(s.councilFavor || {}) };
      for (const member of council.roster || []) {
        councilFavor = applyCouncilFavorShift(councilFavor, member.key, -1);
      }
      const pendingCouncilRaid = declinedStreak >= 2 ? buildCouncilRaidFromRoster(council.roster, s.day, councilFavor) : null;
      let ns = {
        ...s,
        council,
        councilFavor,
        nextRaidType,
        pendingPunitiveRaid: declinedStreak >= 2,
        pendingCouncilRaid,
        councilSession,
      };
      ns = addLog(ns, "You declined the Council.");
      if (declinedStreak >= 2) {
        ns = addLog(ns, `The Council prepares a punitive raid. ${pendingCouncilRaid?.label || ""}`.trim());
      }
      if (s.phase === "battle") {
        const party = generateRaidParty(s.turnsSurvived, nextRaidType, s.day, {
          councilRaid: pendingCouncilRaid,
          raidBoons: s.nextRaidBoons,
        });
        let scoutQueue = [];
        const doctrineEffects = getDoctrineEffects(s.doctrines);
        const raidMods = buildRaidModifiers(s.nextRaidBoons);
        const mirrorTier = maxUtilityTier(s.grid, "scout-mirror") + doctrineEffects.utilityScoutBonus;
        if (mirrorTier > 0) {
          const revealCount = Math.min(party.length, 2 + (mirrorTier - 1) + raidMods.scoutRevealBonus);
          scoutQueue = party.slice(0, revealCount).map((h) => ({ ...h }));
        }
        ns = {
          ...ns,
          currentParty: party,
          currentPartyRaidType: nextRaidType || null,
          partyQueue: party.map((h) => ({ ...h })),
          scoutQueue,
        };
        ns = addLog(ns, "Council choice updated today's raid.");
      }
      return ns;
    });
  }

  function acceptCouncilOffer(offerId) {
    setState((s) => {
      if (!s.councilSession || s.councilSession.status !== "attended") return s;
      const offer = (s.councilSession.offers || []).find((o) => o.id === offerId);
      if (!offer) return s;
      let ns = { ...s };
      const currency = { ...s.currency };
      if (offer.type === "soulshards") currency.soulshards += offer.amount;
      else if (offer.type === "dominion") currency.dominion = Math.min(DOMINION_CAP, currency.dominion + offer.amount);
      else if (offer.type === "evolution") currency.evolution += offer.amount;
      else if (offer.type === "monster") {
        const count = Math.max(1, Math.min(2, Math.round(offer.amount / 20)));
        const invMonsters = [...s.invMonsters];
        for (let i = 0; i < count; i++) {
          invMonsters.push(generateMonster(pick(MONSTER_KEYS), s.turnsSurvived, undefined, s.day));
        }
        ns.invMonsters = invMonsters;
      } else {
        currency.essence += offer.amount;
      }
      ns.councilFavor = applyCouncilFavorShift(s.councilFavor || {}, offer.sponsorKey, 2);
      ns.nextRaidBoons = [...(s.nextRaidBoons || []), { ...(offer.raidEffect || {}), sponsorKey: offer.sponsorKey, sponsorName: offer.sponsorName }].filter(Boolean);
      ns.currency = currency;
      ns.councilSession = {
        ...s.councilSession,
        offers: (s.councilSession.offers || []).filter((o) => o.id !== offerId),
      };
      return addLog(ns, `Council boon received: ${offer.title} from ${offer.sponsorName}. ${offer.raidEffect?.desc || ""}`.trim());
    });
  }

  function acceptCouncilQuest() {
    setState((s) => {
      if (!s.councilSession || s.councilSession.status !== "attended") return s;
      if (s.councilQuest?.active) return addLog(s, "You already have an active Council quest.");
      const quest = s.councilSession.quest;
      if (!quest) return s;
      const councilQuest = { ...quest, active: true };
      const councilSession = { ...s.councilSession, quest: null };
      const councilFavor = applyCouncilFavorShift(s.councilFavor || {}, quest.sponsorKey, 1);
      return addLog({ ...s, councilQuest, councilSession, councilFavor }, `Council quest accepted: ${quest.title} (${quest.sponsorName}).`);
    });
  }

  function buyFleshMarket() {
    setState((s) => {
      if (s.currency.essence < FLESH_MARKET_COST) return addLog(s, "Not enough Essence for the Flesh Market.");
      const untilDay = nextCouncilDay(s.day);
      const currency = { ...s.currency, essence: s.currency.essence - FLESH_MARKET_COST };
      return addLog({ ...s, currency, fleshMarketUntilDay: untilDay }, `Flesh Market open until Day ${untilDay}.`);
    });
  }

  function fuseMonsters(aIdx, bIdx) {
    setState((s) => {
      if (aIdx === bIdx) return addLog(s, "Choose two different monsters to fuse.");
      if (aIdx < 0 || bIdx < 0) return s;
      const inv = [...s.invMonsters];
      const first = inv[aIdx];
      const second = inv[bIdx];
      if (!first || !second) return s;
      const statsA = first.stats || { maxHp: first.hp, atk: first.atk, def: first.def || 0 };
      const statsB = second.stats || { maxHp: second.hp, atk: second.atk, def: second.def || 0 };
      const maxHp = Math.round((statsA.maxHp + statsB.maxHp) * 0.6);
      const atk = Math.round((statsA.atk + statsB.atk) * 0.6);
      const def = Math.round((statsA.def + statsB.def) * 0.6);
      const stars = Math.min(MAX_MONSTER_STAR, Math.max(safeEntityStars(first), safeEntityStars(second)) + 1);
      const passiveKeys = Array.from(new Set([first.passiveKey, second.passiveKey])).filter(Boolean);
      const passiveRanks = createPassiveRanks(passiveKeys);
      const hybrid = {
        key: "abomination",
        name: `Abomination of ${first.race}/${second.race}`,
        icon: "Ab",
        hp: maxHp,
        atk,
        def,
        race: "Abomination",
        class: "Abomination",
        stars,
        passiveKey: passiveKeys[0],
        passiveKeys,
        passiveRanks,
        passive: formatMonsterPassiveList(passiveKeys, passiveRanks),
        stats: { maxHp, atk, def },
        affinity: null,
        evoPoints: 0,
        evolutionStage: 0,
        evolution: 0,
        branchClass: null,
        foughtThisRaid: false,
        shieldedThisTurn: false,
      };
      const a = Math.max(aIdx, bIdx);
      const b = Math.min(aIdx, bIdx);
      inv.splice(a, 1);
      inv.splice(b, 1);
      inv.push(hybrid);
      return addLog({ ...s, invMonsters: inv }, "Flesh Market fused two monsters into an Abomination.");
    });
  }

  function sacrificeMonster(idx) {
    setState((s) => {
      const inv = [...s.invMonsters];
      const target = inv[idx];
      if (!target) return s;
      inv.splice(idx, 1);
      const gain = 5 + safeEntityStars(target) * 2;
      const currency = { ...s.currency, darkcrystals: (s.currency.darkcrystals || 0) + gain };
      return addLog({ ...s, invMonsters: inv, currency }, `Sacrificed ${target.name}. +${gain} Dark Crystals.`);
    });
  }
  function traderPrice(monster, dayOverride = state.day) {
    const stars = safeEntityStars(monster);
    const baseCost = MONSTERS[monster.key]?.cost || 20;
    const dayCost = scaleByDay(baseCost, dayOverride, 0.05, 3.0);
    return Math.round(dayCost * monsterStarMultiplier(stars));
  }

  function buyFromTrader(index) {
    if (locked) return;
    if (!isBuildPhase) {
      setState((s) => addLog(s, "You can only trade during the build phase."));
      return;
    }
    setState((s) => {
      const stock = s.traderStock ? [...s.traderStock] : [];
      const target = stock[index];
      if (!target) return addLog(s, "That stock item is no longer available.");
      const price = traderPrice(target, s.day);
      if (s.currency.soulshards < price) return addLog(s, "Not enough Soulshards.");
      stock.splice(index, 1);
      const invMonsters = [...s.invMonsters, target];
      const currency = { ...s.currency, soulshards: s.currency.soulshards - price };
      return addLog({ ...s, traderStock: stock, invMonsters, currency }, `Bought ${target.name} for ${price} Soulshards.`);
    });
  }

  function tileLabel(x, y, t) {
    const hs = heroesByTile.get(keyOf(x, y));
    if (hs && hs.length > 0) return "H";
    if (t.entrance) return "E";
    if (t.core) return "C";
    if (t.room === "trap") return TRAP_ICONS[t.trapType] || "TR";
    if (t.room === "monster") {
      const icon = MONSTER_ROOM_ICONS[t.roomType] || "MR";
      return t.monsters.length ? `${icon}${t.monsters.length}` : icon;
    }
    if (t.room === "utility") return UTILITY_ICONS[t.roomType] || "UR";
    return "";
  }

  function getTileGlyph(tile, heroesOnTileCount, monstersOnTileCount) {
    if (heroesOnTileCount > 0) {
      return { text: "H", subtext: heroesOnTileCount > 1 ? `Hx${heroesOnTileCount}` : "", tone: "hero" };
    }
    if (tile.entrance) return { text: "E", tone: "entrance" };
    if (tile.core) return { text: "C", tone: "core" };
    if (tile.room === "trap") {
      const glyph = TRAP_GLYPHS[tile.trapType] || { unarmed: "?", armed: "!" };
      return { text: tile.trap ? glyph.armed : glyph.unarmed, tone: tile.trap ? "trap-armed" : "trap-unarmed" };
    }
    if (tile.room === "monster") {
      const icon = MONSTER_ROOM_ICONS[tile.roomType] || "MR";
      const sub = monstersOnTileCount > 0 ? `mx${monstersOnTileCount}` : "";
      return { text: icon, subtext: sub, tone: "monster" };
    }
    if (tile.room === "utility") {
      return { text: UTILITY_GLYPHS[tile.roomType] || "+", tone: "utility" };
    }
    return { text: "" };
  }

  function tileClass(t, x, y) {
    const sel = state.selected.x === x && state.selected.y === y ? " selected" : "";
    const tier = t.room ? " tier-" + (t.roomTier || 1) : "";
    const path = previewPathKeys.has(keyOf(x, y)) ? " path-preview" : "";
    const lure = lureCandidateKeys.has(keyOf(x, y)) ? " lure-candidate" : "";
    const aura = tileHasAura(x, y) ? " aura-affected" : "";
    if (t.entrance) return "tile entrance" + sel + path + lure + aura;
    if (t.core) return "tile core" + sel + path + lure + aura;
    if (t.room === "trap") return "tile trap" + tier + sel + path + lure + aura;
    if (t.room === "monster") return "tile monster" + tier + sel + path + lure + aura;
    if (t.room === "utility") return "tile utility" + tier + sel + path + lure + aura;
    return "tile" + sel + path + lure + aura;
  }

  function roomTypeName(tile) {
    if (!tile.room) return "none";
    if (tile.room === "trap") return TRAP_MAP[tile.trapType]?.name || "Trap Room";
    if (tile.room === "monster") return MONSTER_ROOM_MAP[tile.roomType]?.name || "Monster Room";
    if (tile.room === "utility") return UTILITY_MAP[tile.roomType]?.name || "Utility Room";
    return tile.room;
  }

  function roomTypeDesc(tile) {
    if (!tile.room) return "";
    if (tile.room === "trap") {
      const tier = tile.roomTier || 1;
      const trap = TRAP_MAP[tile.trapType];
      if (!trap) return "";
      const base = trap.baseDmg || 0;
      const star = clampMonsterStar(tile.trapStar ?? tile.trapStars ?? 1);
      const rank = Math.max(1, tile.trapRank ?? tier);
      const scaled = Math.max(0, Math.round(base * (1 + 0.25 * (star - 1)) + (rank - 1) * 2 + doctrineEffects.trapFlatDamage));
      const charges = trapChargesForStar(star, doctrineEffects);
      const cooldown = trapCooldownAfterTrigger(tile.trapType, star, doctrineEffects);
      return `${trap.desc} Tier ${tier}. ${formatStars(star)} / Rank ${rank}. Trigger ${scaled} dmg, ${charges} charge(s), cooldown ${cooldown}.`;
    }
    if (tile.room === "monster") {
      const tier = tile.roomTier || 1;
      const cap = monsterRoomCap(tier) + doctrineEffects.monsterRoomCapBonus;
      if (tile.roomType === "training-den") {
        return `Tier ${tier}: Monsters placed here gain +${1 + (tier - 1)} ATK permanently. Cap ${cap}.`;
      }
      if (tile.roomType === "thick-hide") {
        return `Tier ${tier}: Monsters placed here gain +${3 + (tier - 1) * 2} Max HP permanently. Cap ${cap}.`;
      }
      return `${MONSTER_ROOM_MAP[tile.roomType]?.desc || "Monster Room"} Cap ${cap}.`;
    }
    if (tile.room === "utility") {
      const tier = (tile.roomTier || 1) + doctrineEffects.utilityPotencyBonus + doctrineEffects.utilityPotencyBonusExtra;
      if (tile.roomType === "soul-altar") {
        return `Tier ${tier}: Hero dies within 1 tile: +${15 + (tier - 1) * 5} Essence.`;
      }
      if (tile.roomType === "siphon-pylon") {
        return `Tier ${tier}: Hero takes damage within 1 tile: +1 Essence (cap ${10 + (tier - 1) * 5} per hero).`;
      }
      if (tile.roomType === "reinforced-keystone") {
        return `Tier ${tier}: Monsters within 1 tile gain +${2 + (tier - 1)} DEF.`;
      }
      if (tile.roomType === "blood-sigil") {
        return `Tier ${tier}: Monsters within 1 tile heal +${2 + (tier - 1)} HP at end of turn.`;
      }
      if (tile.roomType === "war-drum") {
        return `Tier ${tier}: Monsters within 1 tile gain +${1 + (tier - 1)} ATK.`;
      }
      if (tile.roomType === "fear-idol") {
        return `Tier ${tier}: Heroes entering adjacent tiles get -1 ATK for ${2 + (tier - 1)} turns.`;
      }
      if (tile.roomType === "ward-lantern") {
        return `Tier ${tier}: Traps within 1 tile deal +${25 + (tier - 1) * 5}% damage.`;
      }
      if (tile.roomType === "scout-mirror") {
        return `Tier ${tier}: Raid start reveals next ${2 + (tier - 1)} hero spawns.`;
      }
      return UTILITY_MAP[tile.roomType]?.desc || "";
    }
    return "";
  }

  function roomTypeIcon(tile) {
    if (!tile.room) return "";
    if (tile.room === "trap") return TRAP_ICONS[tile.trapType] || "TR";
    if (tile.room === "monster") return MONSTER_ROOM_ICONS[tile.roomType] || "MR";
    if (tile.room === "utility") return UTILITY_ICONS[tile.roomType] || "UR";
    return "";
  }

  function monsterPassiveInfo(monster) {
    if (!monster) return null;
    const keys = monsterPassiveKeys(monster);
    if (keys.length > 0) return MONSTER_PASSIVE_MAP[keys[0]] || null;
    return null;
  }

  function monsterPassiveKeys(monster) {
    return normalizePassiveKeysForMonster(monster);
  }

  function monsterPassiveRank(monster, key) {
    if (!monsterHasPassive(monster, key)) return 0;
    return Math.max(1, monster?.passiveRanks?.[key] || 1);
  }

  function monsterHasPassive(monster, key) {
    return monsterPassiveKeys(monster).includes(key);
  }

  function roomPassiveRank(room, key) {
    let rank = 0;
    for (const monster of room.monsters || []) {
      rank = Math.max(rank, monsterPassiveRank(monster, key));
    }
    return rank;
  }

  function roomHasPassive(room, key) {
    return roomPassiveRank(room, key) > 0;
  }

  function formatStars(stars) {
    return stars === 6 ? "6-Star (Unique)" : `${stars}-Star`;
  }

  function safeEntityStars(entity) {
    return typeof entity.stars === "number" ? entity.stars : 1;
  }

  function safeEntityMaxHp(entity) {
    return entity.stats && typeof entity.stats.maxHp === "number" ? entity.stats.maxHp : entity.hp || 0;
  }

  function safeEntityLabel(entity, fallback) {
    return entity ? entity : fallback;
  }

  function effectiveMonsterRoomCap(tile) {
    if (!tile || tile.room !== "monster") return "n/a";
    return monsterRoomCap(tile.roomTier || 1) + doctrineEffects.monsterRoomCapBonus;
  }

  function effectiveUtilityTierAt(x, y, key) {
    const baseTier = utilityTier(state.grid, x, y, key);
    if (baseTier <= 0) return 0;
    return baseTier + doctrineEffects.utilityPotencyBonus + doctrineEffects.utilityPotencyBonusExtra;
  }

  function describeTileAuras(x, y) {
    return UTILITY_ROOMS.map((room) => ({ room, tier: effectiveUtilityTierAt(x, y, room.key) }))
      .filter((entry) => entry.tier > 0)
      .map((entry) => `${entry.room.name} T${entry.tier}`);
  }

  function projectedTrapDamage(tile, x, y) {
    if (!tile || tile.room !== "trap") return 0;
    const trap = TRAP_MAP[tile.trapType];
    if (!trap) return 0;
    const star = clampMonsterStar(tile.trapStar ?? tile.trapStars ?? 1);
    const rank = Math.max(1, tile.trapRank ?? tile.roomTier ?? 1);
    const wardTier = effectiveUtilityTierAt(x, y, "ward-lantern");
    let mult = 1 + (wardTier > 0 ? 0.25 + 0.05 * (wardTier - 1) : 0);
    if (state.artifacts.some((artifact) => artifact.key === "wicked-gears")) mult += 0.15;
    return Math.max(
      0,
      Math.round((trap.baseDmg * (1 + 0.25 * (star - 1)) + (rank - 1) * 2 + doctrineEffects.trapFlatDamage) * mult)
    );
  }

  function tileStateChip(tile, x, y) {
    if (tile.room === "trap") {
      if (tile.trapBroken) return "BRK";
      if (!tile.trap) return "OFF";
      const cooldown = Math.max(0, tile.trapCooldownRemaining ?? 0);
      if (cooldown > 0) return `CD${cooldown}`;
      return `R${Math.max(0, tile.trapChargesRemaining ?? 0)}`;
    }
    if (tile.room === "monster") {
      if ((tile.monsters || []).some((monster) => monster.hp < safeEntityMaxHp(monster))) return "W";
      if ((tile.monsters || []).length > 0) return `M${tile.monsters.length}`;
    }
    return "";
  }

  function tileHasAura(x, y) {
    return describeTileAuras(x, y).length > 0;
  }

  const selectedTileAuras = describeTileAuras(state.selected.x, state.selected.y);
  const selectedHeroIntent = selectedHeroes[0] && core ? chooseInvaderMove(selectedHeroes[0], state.grid, core, state.activeRaidBoons, doctrineEffects) : null;
  const focusedCouncilFavor = focusedCouncilMember ? state.councilFavor?.[focusedCouncilMember.key] || 0 : 0;
  const focusedCouncilBoons = focusedCouncilMember
    ? (state.nextRaidBoons || []).filter((boon) => boon.sponsorKey === focusedCouncilMember.key)
    : [];

  const previewPathKeys = useMemo(() => {
    if (selectedHeroes[0] && core) {
      const choice = chooseInvaderMove(selectedHeroes[0], state.grid, core, state.activeRaidBoons, doctrineEffects);
      const current = keyOf(selectedHeroes[0].x, selectedHeroes[0].y);
      const routed = choice?.next ? aStarPath(state.grid, choice.next, core) || [choice.next] : aStarPath(state.grid, { x: selectedHeroes[0].x, y: selectedHeroes[0].y }, core);
      return new Set([current, ...(routed || []).map((pos) => keyOf(pos.x, pos.y))]);
    }
    if (entrance && core) {
      const path = aStarPath(state.grid, entrance, core);
      return new Set((path || []).map((pos) => keyOf(pos.x, pos.y)));
    }
    return new Set();
  }, [selectedHeroes, state.grid, core, entrance, state.activeRaidBoons, doctrineEffects]);

  const lureCandidateKeys = useMemo(() => {
    if (!selectedHeroes[0] || !core) return new Set();
    const choice = chooseInvaderMove(selectedHeroes[0], state.grid, core, state.activeRaidBoons, doctrineEffects);
    return new Set(
      (choice.options || [])
        .filter((option) => option.lure >= 4 && !option.tile.core)
        .map((option) => keyOf(option.next.x, option.next.y))
    );
  }, [selectedHeroes, state.grid, core, state.activeRaidBoons, doctrineEffects]);

  const pendingRaidMeta = raidTypeMeta(state.pendingPunitiveRaid ? "council" : state.nextRaidType, state.pendingCouncilRaid);

  const invPreview = state.invMonsters.slice(0, 3);

  const checklist = {
    entrancePlaced: !!entrance,
    corePlaced: !!core,
    validPath: validation.ok,
  };

  const canStartRaid = !locked && isBattlePhase && !state.raidActive && validation.ok;
  const canEndTurn = !locked && isBattlePhase && (state.raidActive || state.heroes.length > 0);

  function evolutionButtonLabel(monster) {
    const cost = monsterEvolutionCost(monster);
    if (cost === null) return "Max Stage";
    return `${monsterEvolutionStageValue(monster) === 0 ? "Evolve" : "Ascend"} (${cost} EP)`;
  }

  function evolutionStageLabel(monster) {
    return `Stage ${monsterEvolutionStageValue(monster)}/${MAX_EVOLUTION_STAGE}`;
  }

  const mobileTabs = [
    { key: "dungeon", label: "Dungeon", desc: "Grid only" },
    { key: "toolbox", label: "Toolbox", desc: "Build and raid actions" },
    { key: "inventory", label: "Inventory", desc: "View monsters and items" },
    { key: "evolution", label: "Evolution", desc: "Spend evolution points" },
    { key: "glossary", label: "Glossary", desc: "Read passives and terms" },
    { key: "log", label: "Log", desc: "Recent events" },
  ];
  if (state.councilSession && state.councilSession.day === state.day) {
    mobileTabs.push({ key: "council", label: "Council", desc: "Council session details" });
  }
  const activeMobileTab = mobileTabs.find((tab) => tab.key === activeTab) || mobileTabs[0];

  function selectMobileTab(tab) {
    setActiveTab(tab);
    if (["log", "inventory", "evolution", "glossary", "council"].includes(tab)) {
      setSidePanel(tab);
    }
    setMobileMenuOpen(false);
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="mobileNav">
          <button
            className={`mobileMenuBtn ${mobileMenuOpen ? "active" : ""}`}
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-drawer"
          >
            <span className="mobileMenuIcon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span className="mobileMenuText">
              <span className="mobileMenuLabel">Mobile Menu</span>
              <span className="mobileMenuCurrent">{activeMobileTab.label}</span>
            </span>
          </button>
          {mobileMenuOpen && (
            <div className="mobileDrawer" id="mobile-nav-drawer">
              {mobileTabs.map((tab) => (
                <button
                  key={tab.key}
                  className={`mobileNavBtn ${activeTab === tab.key ? "active" : ""}`}
                  onClick={() => selectMobileTab(tab.key)}
                >
                  <span>{tab.label}</span>
                  <span className="mobileNavMeta">{tab.desc}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="title">Dungeonlord (Barebones Prototype)</div>
        <div className="status">
          <span className="pill">Essence: {state.currency.essence}</span>
          <span className="pill">Soulshards: {state.currency.soulshards}</span>
          <span className="pill">Dominion: {state.currency.dominion}</span>
          <span className="pill">Evolution: {state.currency.evolution}</span>
          <span className="pill">Day: {state.day}</span>
          <span className="pill">Dungeon Lvl: {dungeonLevel}</span>
          <span className="pill">Room Cap: {maxRooms}</span>
          <span className="pill">Next Upgrade: {25 + dungeonLevel * 15} Essence</span>
          <span className="pill">
            Core HP: {Math.max(0, state.coreHp)} / {coreMaxHp}
          </span>
          <span className="pill">Core Shield: {state.coreShield}</span>
          <span className="pill">Turns: {state.turnsSurvived}</span>
          <span className="pill">Mode: {state.phase === "build" ? "BUILD" : "BATTLE"}</span>
          {state.raidActive && <span className="pill">Raid Left: {state.raidRemaining}</span>}
          <span className={"pill " + (validation.ok ? "ok" : "bad")}>
            {validation.ok ? "Dungeon Valid" : "Invalid"}
          </span>
        </div>
        <div className="panelToggle">
          <span className="panelLabel">Side Panel</span>
          <button
            className={`btn toggle ${sidePanel === "log" ? "active" : ""}`}
            onClick={() => {
              setSidePanel("log");
              setActiveTab("log");
            }}
          >
            Log
          </button>
          <button
            className={`btn toggle ${sidePanel === "inventory" ? "active" : ""}`}
            onClick={() => {
              setSidePanel("inventory");
              setActiveTab("inventory");
            }}
          >
            Inventory
          </button>
          <button
            className={`btn toggle ${sidePanel === "evolution" ? "active" : ""}`}
            onClick={() => {
              setSidePanel("evolution");
              setActiveTab("evolution");
            }}
          >
            Evolution
          </button>
          <button
            className={`btn toggle ${sidePanel === "glossary" ? "active" : ""}`}
            onClick={() => {
              setSidePanel("glossary");
              setActiveTab("glossary");
            }}
          >
            Glossary
          </button>
          {state.councilSession && state.councilSession.day === state.day && (
            <button
              className={`btn toggle ${sidePanel === "council" ? "active" : ""}`}
              onClick={() => {
                setSidePanel("council");
                setActiveTab("council");
              }}
            >
              Council
            </button>
          )}
        </div>
      </header>

      {showCouncilPrompt && (
        <div className="councilPrompt">
          <div className="councilPromptCard">
            <div className="councilPromptTitle">Council of the Dungeonlords</div>
            <div className="muted">It is time for the Council to convene.</div>
            <div className="row">
              <button className="btn" onClick={attendCouncil}>
                Attend
              </button>
              <button className="btn danger" onClick={declineCouncil}>
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {councilScreenOpen && councilSessionActive && (
        <div className="councilScreen">
          <div className="councilScreenHeader">
            <div className="councilScreenTitle">Council of the Dungeonlords - Day {state.day}</div>
            <button className="btn" onClick={() => setCouncilScreenOpen(false)}>
              Return to Dungeon
            </button>
          </div>
          <div className="councilScreenBody">
            <div className="councilRing">
              <div className="councilCenter">
                <div className="councilCenterTitle">The Council Hall</div>
                <div className="muted">Attending lords gather to plot, barter, and threaten.</div>
              </div>
              {councilRoster.map((m, idx) => {
                const count = Math.max(1, councilRoster.length);
                const angle = (idx / count) * Math.PI * 2 - Math.PI / 2;
                const baseRadius = 210 + (count > 5 ? 30 : 0);
                const radius = baseRadius + (idx % 2 === 0 ? 30 : -10);
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                return (
                  <div
                    className={`councilNode ${focusedCouncilMember?.key === m.key ? "active" : ""}`}
                    key={`council-node-${m.key}`}
                    style={{ transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` }}
                    onClick={() => setFocusedCouncilKey(m.key)}
                  >
                    <div className="councilNodeName">{m.name}</div>
                    <div className="councilNodeMeta">{m.title}</div>
                  </div>
                );
              })}
            </div>

            <div className="councilDetails">
              <div className="card">
                <div className="cardTitle">Focused Dungeonlord</div>
                {focusedCouncilMember ? (
                  <>
                    <div className="entityName">{focusedCouncilMember.name}</div>
                    <div className="entityMeta">
                      {focusedCouncilMember.title} - {focusedCouncilMember.theme}
                    </div>
                    <div className="row">
                      <span className={`badge ${focusedCouncilFavor > 0 ? "favorGood" : focusedCouncilFavor < 0 ? "favorBad" : "favorNeutral"}`}>
                        Favor {focusedCouncilFavor >= 0 ? `+${focusedCouncilFavor}` : focusedCouncilFavor}
                      </span>
                      <div className="muted">{focusedCouncilMember.role}</div>
                    </div>
                    <div className="muted">Personality: {focusedCouncilMember.personality}</div>
                    <div className="muted">Current Deal: {focusedCouncilMember.deal}</div>
                    <div className="muted">
                      Rivalries:{" "}
                      {(focusedCouncilMember.rivalries || [])
                        .map((r) => COUNCIL_MEMBERS.find((m) => m.key === r)?.name || r)
                        .join(", ")}
                    </div>
                    <div className="muted">
                      Leverage in next raid: {focusedCouncilBoons.length ? focusedCouncilBoons.map((boon) => boon.label).join(", ") : "none"}
                    </div>
                  </>
                ) : (
                  <div className="entityEmpty">Select a Dungeonlord.</div>
                )}
              </div>
              <div className="card">
                <div className="cardTitle">Council Discourse</div>
                <div className="entityList">
                  {state.councilSession.dialogue.map((line, idx) => (
                    <div className="entityItem" key={`council-line-${idx}`}>
                      <div className="entityMeta">{line}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <div className="cardTitle">Rumors & Intelligence</div>
                <div className="entityList">
                  {state.councilSession.rumors.map((line, idx) => (
                    <div className="entityItem" key={`council-rumor-${idx}`}>
                      <div className="entityMeta">{line}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <div className="cardTitle">Boons</div>
                {state.councilSession.offers.length ? (
                  <div className="entityList">
                    {state.councilSession.offers.map((o) => (
                      <div className="entityItem" key={o.id}>
                        <div className="entityName">{o.title}</div>
                        <div className="entityMeta">{o.sponsorName}</div>
                        <div className="entityMeta">
                          {o.desc} ({o.type === "monster" ? "Recruit" : `+${o.amount}`})
                        </div>
                        <div className="muted small">{o.raidEffect?.desc || "No raid leverage."}</div>
                        <div className="row">
                          <button className="btn" onClick={() => acceptCouncilOffer(o.id)}>
                            Accept
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="entityEmpty">No boons remaining.</div>
                )}
              </div>
              <div className="card">
                <div className="cardTitle">Council Quest</div>
                {state.councilQuest?.active ? (
                  <>
                    <div className="entityName">{state.councilQuest.title}</div>
                    <div className="entityMeta">{state.councilQuest.desc}</div>
                    <div className="muted">
                      Progress: {state.councilQuest.progress}/{state.councilQuest.goal}
                    </div>
                  </>
                ) : state.councilSession.quest ? (
                  <>
                    <div className="entityName">{state.councilSession.quest.title}</div>
                    <div className="entityMeta">{state.councilSession.quest.desc}</div>
                    <div className="muted">{state.councilSession.quest.sponsorName}</div>
                    <div className="muted">
                      Reward: +{state.councilSession.quest.reward.amount} {state.councilSession.quest.reward.type}
                    </div>
                    <div className="row">
                      <button className="btn" onClick={acceptCouncilQuest}>
                        Accept Quest
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="entityEmpty">No active quest.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="layout" data-tab={activeTab} data-side={sidePanel}>
        <section className="panel panel--dungeon">
          <div className="panelTitle">
            Dungeon Layout (place up to {maxRooms} rooms)
            <span className="capMeta">
              Remaining: {Math.max(0, maxRooms - roomsPlaced)} | Next cap: {maxRooms + ROOMS_PER_LEVEL}
            </span>
          </div>

          <div className="gridWrap">
            <div className="grid">
              {state.grid.map((row, y) =>
                row.map((t, x) => (
                  <button
                    key={keyOf(x, y)}
                    className={tileClass(t, x, y)}
                    onClick={() => setSelected(x, y)}
                    title={`(${x + 1},${y + 1})`}
                    disabled={locked}
                  >
                    {(() => {
                      const heroesHere = heroesByTile.get(keyOf(x, y)) || [];
                      const monstersHere = t.room === "monster" ? t.monsters.length : 0;
                      const glyph = getTileGlyph(t, heroesHere.length, monstersHere);
                      const stateChip = tileStateChip(t, x, y);
                      if (!glyph.text && !glyph.subtext && !stateChip) return null;
                      return (
                        <>
                          {stateChip ? <span className="tileChip tileChipState">{stateChip}</span> : null}
                          {glyph.text ? <span className={`tileGlyph ${glyph.tone || ""}`}>{glyph.text}</span> : null}
                          {glyph.subtext ? <span className="tileGlyphSub">{glyph.subtext}</span> : null}
                        </>
                      );
                    })()}
                  </button>
                ))
              )}
            </div>
          </div>

          {state.movePayload && (
            <div className="moveBanner">
              Moving {state.movePayload.type === "core" ? "Core" : "Room"} - click a new tile to place it. Press Esc or Cancel to abort.
            </div>
          )}

 {/* Mobile-only always-visible actions */}
      <div className="mobileBar">
        <button className="btn primary" onClick={startRaid} disabled={!canStartRaid || state.movePayload}>
          Start Raid
        </button>
        <button className="btn primary" onClick={endTurn} disabled={!canEndTurn || state.movePayload}>
          End Turn
        </button>
        <div className="mobileMeta">
          {locked ? "Defeat" : state.raidActive ? `RAID - Left ${state.raidRemaining}` : state.phase === "build" ? "BUILD" : "BATTLE"}
        </div>
      </div>

          <div className="hint">
            Place <b>E</b> and <b>C</b>, connect with rooms. Hero cap <b>{HERO_CAP}</b>. Each raid spawns a party of <b>2-4</b> heroes.
          </div>
        </section>

        <section className="panel panel--toolbox">
          <div className="panelTitle">Toolbox</div>

          <div className="toolboxScroll">
            <div className="card">
              <div className="cardTitle">Checklist</div>
              <div className="checkRow">
                <span className={"checkDot " + (checklist.entrancePlaced ? "on" : "off")} />
                Entrance placed
              </div>
              <div className="checkRow">
                <span className={"checkDot " + (checklist.corePlaced ? "on" : "off")} />
                Core placed
              </div>
              <div className="checkRow">
                <span className={"checkDot " + (checklist.validPath ? "on" : "off")} />
                Valid path E to C
              </div>
              {!validation.ok && <div className="warn">{validation.reason}</div>}
            </div>

            <div className="card">
              <div className="cardTitle">Daily Event</div>
              <div className="muted">{state.dailyEvent?.name || "Calm Day"}</div>
              <div className="muted small">{state.dailyEvent?.desc || "No unusual effects today."}</div>
            </div>

            <div className="card">
              <div className="cardTitle">Raid Forecast</div>
              <div className="entityName">{pendingRaidMeta.label}</div>
              <div className="muted">{pendingRaidMeta.desc}</div>
              {state.pendingCouncilRaid?.attackers?.length ? (
                <div className="entityList">
                  {state.pendingCouncilRaid.attackers.map((attacker) => (
                    <div className="entityItem" key={`raid-attacker-${attacker.key}`}>
                      <div className="entityName">{attacker.memberName}</div>
                      <div className="entityMeta">{attacker.raidName}</div>
                      <div className="muted">{attacker.raidModifier}</div>
                    </div>
                  ))}
                </div>
              ) : null}
              {state.nextRaidBoons?.length ? (
                <div className="entityList">
                  {state.nextRaidBoons.map((boon, idx) => (
                    <div className="entityItem" key={`raid-boon-${idx}`}>
                      <div className="entityName">{boon.label || "Raid Influence"}</div>
                      <div className="entityMeta">{boon.sponsorName || "Council leverage"}</div>
                      <div className="entityMeta">{boon.desc}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="muted small">No stored council leverage for the next raid.</div>
              )}
            </div>

            <div className="card">
              <div className="cardTitle">Currencies</div>
              <div className="kv">
                <div>Soulshards</div>
                <div>{state.currency.soulshards}</div>
                <div>Essence</div>
                <div>{state.currency.essence}</div>
                <div>Dominion</div>
                <div>{state.currency.dominion}</div>
                <div>Evolution</div>
                <div>{state.currency.evolution}</div>
                <div>Darkcrystals</div>
                <div>{state.currency.darkcrystals}</div>
              </div>
            </div>

            <div className="card">
              <div className="cardTitle">Economy Roles</div>
              <div className="entityList">
                {ECONOMY_ROLES.map(([name, desc]) => (
                  <div className="entityItem" key={`economy-${name}`}>
                    <div className="entityName">{name}</div>
                    <div className="entityMeta">{desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="cardTitle">Doctrine Tree</div>
              <div className="entityList">
                {Object.values(DOCTRINE_RULES).map((rule) => {
                  const currentLevel = state.doctrines?.[rule.key] || 0;
                  const nextLevel = rule.levels[currentLevel] || null;
                  return (
                    <div className="entityItem" key={`doctrine-${rule.key}`}>
                      <div className="entityName">
                        {rule.name} ({currentLevel}/{rule.levels.length})
                      </div>
                      <div className="entityMeta">Uses {rule.currency}. Current: {rule.levels.slice(0, currentLevel).map((level) => level.desc).join(" ") || "No doctrine bonus yet."}</div>
                      <div className="row">
                        <button className="btn" onClick={() => upgradeDoctrine(rule.key)} disabled={!nextLevel || locked || !isBuildPhase}>
                          {nextLevel ? `Upgrade (${nextLevel.cost} ${rule.currency})` : "Maxed"}
                        </button>
                        <div className="muted">{nextLevel ? nextLevel.desc : "Mastered."}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card">
              <div className="cardTitle">Council of Dungeonlords</div>
              {state.council?.active ? (
                <>
                  <div className="muted">Day {state.council.day} Council is in session.</div>
                  <div className="entityList">
                    {(state.council?.roster || []).map((m) => (
                      <div className="entityItem" key={m.key}>
                        <div className="entityName">
                          {m.name} - {m.title}
                        </div>
                        <div className="entityMeta">{m.theme}</div>
                        <div className="muted">
                          Favor {(state.councilFavor?.[m.key] || 0) >= 0 ? `+${state.councilFavor?.[m.key] || 0}` : state.councilFavor?.[m.key] || 0} | {m.role}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="row">
                    <button className="btn" onClick={attendCouncil}>
                      Attend
                    </button>
                    <button className="btn danger" onClick={declineCouncil}>
                      Decline
                    </button>
                  </div>
                </>
              ) : (
                <div className="muted">Next Council: Day {nextCouncilDay(state.day)}.</div>
              )}
            </div>

            {state.council?.active && (state.council?.roster || []).some((m) => m.key === "maltheron") && (
              <div className="card">
                <div className="cardTitle">Flesh Market (Maltheron)</div>
                <div className="muted">Cost {FLESH_MARKET_COST} Essence. Access until next Council.</div>
                <div className="row">
                  <button className="btn" onClick={buyFleshMarket} disabled={state.currency.essence < FLESH_MARKET_COST}>
                    Unlock Flesh Market
                  </button>
                </div>
              </div>
            )}

            {state.fleshMarketUntilDay >= state.day && state.fleshMarketUntilDay > 0 && (
              <div className="card">
                <div className="cardTitle">Flesh Market</div>
                <div className="muted">Open until Day {state.fleshMarketUntilDay}.</div>
                <div className="row">
                  <select className="select" value={fuseA} onChange={(e) => setFuseA(e.target.value)}>
                    <option value="">Fuse: pick first</option>
                    {state.invMonsters.map((m, idx) => (
                      <option key={`fuseA-${idx}`} value={idx}>
                        {m.name} ({formatStars(safeEntityStars(m))})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="row">
                  <select className="select" value={fuseB} onChange={(e) => setFuseB(e.target.value)}>
                    <option value="">Fuse: pick second</option>
                    {state.invMonsters.map((m, idx) => (
                      <option key={`fuseB-${idx}`} value={idx}>
                        {m.name} ({formatStars(safeEntityStars(m))})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="row">
                  <button
                    className="btn"
                    onClick={() => fuseMonsters(Number(fuseA), Number(fuseB))}
                    disabled={fuseA === "" || fuseB === "" || state.invMonsters.length < 2}
                  >
                    Fuse Monsters
                  </button>
                </div>
                <div className="row">
                  <select className="select" value={sacrificeIdx} onChange={(e) => setSacrificeIdx(e.target.value)}>
                    <option value="">Sacrifice: pick monster</option>
                    {state.invMonsters.map((m, idx) => (
                      <option key={`sac-${idx}`} value={idx}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="row">
                  <button
                    className="btn danger"
                    onClick={() => sacrificeMonster(Number(sacrificeIdx))}
                    disabled={sacrificeIdx === ""}
                  >
                    Sacrifice
                  </button>
                </div>
              </div>
            )}

            <div className="card">
              <div className="cardTitle">Selected Tile</div>
              <div className="kv">
                <div>Pos</div>
                <div>({state.selected.x + 1}, {state.selected.y + 1})</div>
                <div>Entrance</div>
                <div>{selectedTile.entrance ? "YES" : "no"}</div>
                <div>Core</div>
                <div>{selectedTile.core ? "YES" : "no"}</div>
                <div>Room</div>
                <div>
                  <span className="iconBadge">{roomTypeIcon(selectedTile) || "--"}</span>
                  {roomTypeName(selectedTile)}
                </div>
                <div>Room Tier</div>
                <div>{selectedTile.room ? selectedTile.roomTier || 1 : "n/a"}</div>
                <div>Monster Cap</div>
                <div>{effectiveMonsterRoomCap(selectedTile)}</div>
                <div>Room Effect</div>
                <div>{roomTypeDesc(selectedTile) || "n/a"}</div>
                <div>Readiness</div>
                <div>{tileStateChip(selectedTile, state.selected.x, state.selected.y) || "n/a"}</div>
                <div>Trap Armed</div>
                <div>{selectedTile.room === "trap" ? (selectedTile.trap ? "YES" : "no") : "n/a"}</div>
                <div>Trap Star</div>
                <div>{selectedTile.room === "trap" ? formatStars(selectedTile.trapStar ?? selectedTile.trapStars ?? 1) : "n/a"}</div>
                <div>Trap Rank</div>
                <div>{selectedTile.room === "trap" ? Math.max(1, selectedTile.trapRank ?? selectedTile.roomTier ?? 1) : "n/a"}</div>
                <div>Trap Charges</div>
                <div>{selectedTile.room === "trap" ? Math.max(0, selectedTile.trapChargesRemaining ?? 0) : "n/a"}</div>
                <div>Trap Cooldown</div>
                <div>{selectedTile.room === "trap" ? Math.max(0, selectedTile.trapCooldownRemaining ?? 0) : "n/a"}</div>
                <div>Trap Broken</div>
                <div>{selectedTile.room === "trap" ? (selectedTile.trapBroken ? "YES" : "no") : "n/a"}</div>
                <div>Projected Trap</div>
                <div>{selectedTile.room === "trap" ? projectedTrapDamage(selectedTile, state.selected.x, state.selected.y) : "n/a"}</div>
                <div>Nearby Auras</div>
                <div>{selectedTileAuras.length ? selectedTileAuras.join(", ") : "none"}</div>
                <div>Heroes Here</div>
                <div>
                  {selectedHeroes.length ? (
                    <div className="entityList">
                      {selectedHeroes.map((h) => (
                        <div className="entityItem" key={h.id}>
                          <div className="entityName">
                            {h.name} ({invaderLabel(h)})
                          </div>
                          <div className="entityMeta">
                            {safeEntityLabel(h.race, "Unknown")} {safeEntityLabel(h.class, "Hero")} | {formatStars(safeEntityStars(h))} | {invaderPassiveSummary(h)}
                          </div>
                          <div className="entityStats">
                            HP {h.hp}/{safeEntityMaxHp(h)} | ATK {h.atk} | DEF {h.def || 0} | SHD {h.shd || 0} | SPD {h.spd || 0}
                          </div>
                          <div className="muted">
                            Origin {h.raidOriginLabel || "Hero Raid"}{h.factionName ? ` | ${h.factionName}` : ""} | Behavior {h.archetypeLabel || "Zealot"}{h.memory?.lastIntent ? ` | Intent ${h.memory.lastIntent}` : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="entityEmpty">none</div>
                  )}
                </div>
                <div>Monsters Here</div>
                <div>
                  {selectedTile.monsters.length ? (
                    <div className="entityList">
                      {selectedTile.monsters.map((m, idx) => (
                        <div className="entityItem" key={`${m.key}-${idx}`}>
                          <div className="entityName">{m.name}</div>
                          <div className="entityMeta">
                            {safeEntityLabel(m.race, "Monster")}
                            <span className="badge class">{safeEntityLabel(m.class, "Brute")}</span> | {formatStars(safeEntityStars(m))} |{" "}
                            {safeEntityLabel(m.passive, "None")}
                          </div>
                        <div className="entityStats">
                          HP {m.hp}/{safeEntityMaxHp(m)} | ATK {m.atk} | Evo {m.evoPoints || 0}
                        </div>
                        <div className="muted">
                          {evolutionStageLabel(m)}{m.branchClass ? ` | Branch ${m.branchClass}` : ""}
                        </div>
                      </div>
                      ))}
                    </div>
                  ) : (
                    <div className="entityEmpty">none</div>
                  )}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="cardTitle">Path Preview</div>
              {selectedHeroes[0] && selectedHeroIntent ? (
                <>
                  <div className="entityName">{invaderLabel(selectedHeroes[0])}</div>
                  <div className="entityMeta">
                    {selectedHeroes[0].archetypeLabel || "Zealot"} | {selectedHeroIntent.intent}
                  </div>
                  <div className="muted">
                    Path tiles glow cyan. Likely lure candidates glow amber.
                  </div>
                </>
              ) : entrance && core ? (
                <div className="muted">Default entrance-to-core route is highlighted while no invader is selected.</div>
              ) : (
                <div className="muted">Place Entrance and Core to preview the main route.</div>
              )}
            </div>

            <div className="card">
              <div className="cardTitle">Place Entrance / Core</div>
              <div className="row">
                <button
  className="btn"
  onClick={() => {
    placeEntrance();
    setActiveTab("dungeon");
  }}
  disabled={locked || state.movePayload || !isBuildPhase || checklist.entrancePlaced}
>
  Place Entrance (E)
</button>

                <div className="muted">Choose any tile.</div>
              </div>
              <div className="row">
                <button
  className="btn"
  onClick={() => {
    placeCore();
    setActiveTab("dungeon");
  }}
  disabled={locked || state.movePayload || !isBuildPhase}
>
  Place Core (C)
</button>

                <div className="muted">Choose any tile.</div>
              </div>
            </div>

            <div className="card">
              <div className="cardTitle">Build Rooms</div>
              <div className="row">
                <select
                  className="select"
                  value={state.selectedTrapType}
                  onChange={(e) => setState((s) => ({ ...s, selectedTrapType: e.target.value }))}
                  disabled={locked || state.movePayload || !isBuildPhase}
                >
                  {TRAP_TYPES.map((trap) => (
                    <option key={trap.key} value={trap.key}>
                      {TRAP_ICONS[trap.key] || "TR"} - {trap.name}
                    </option>
                  ))}
                </select>
                <div className="muted">Trap type.</div>
              </div>
              <div className="row">
                <button
  className="btn"
  onClick={() => {
    buildTrapRoom();        // whatever your function is called
    setActiveTab("dungeon");
  }}
  disabled={locked || state.movePayload || !isBuildPhase}
>
  Build Trap Room
</button>
                <div className="muted">Counts toward {maxRooms} rooms.</div>
              </div>
              <div className="row">
                <select
                  className="select"
                  value={state.selectedMonsterRoomType}
                  onChange={(e) => setState((s) => ({ ...s, selectedMonsterRoomType: e.target.value }))}
                  disabled={locked || state.movePayload || !isBuildPhase}
                >
                  {MONSTER_ROOMS.map((room) => (
                    <option key={room.key} value={room.key}>
                      {MONSTER_ROOM_ICONS[room.key] || "MR"} - {room.name}
                    </option>
                  ))}
                </select>
                <div className="muted">Monster room passive.</div>
              </div>
              <div className="row">
                <button
  className="btn"
  onClick={() => {
    buildMonsterRoom();     // whatever your function is called
    setActiveTab("dungeon");
  }}
  disabled={locked || state.movePayload || !isBuildPhase}
                >
  Build Monster Room
</button>

                <div className="muted">Up to {monsterRoomCap(1) + doctrineEffects.monsterRoomCapBonus} monsters inside.</div>
              </div>
              <div className="row">
                <select
                  className="select"
                  value={state.selectedUtilityRoomType}
                  onChange={(e) => setState((s) => ({ ...s, selectedUtilityRoomType: e.target.value }))}
  disabled={locked || state.movePayload || !isBuildPhase}
                >
                  {UTILITY_ROOMS.map((room) => (
                    <option key={room.key} value={room.key} disabled={anyUtilityRoom(state.grid, room.key)}>
                      {UTILITY_ICONS[room.key] || "UR"} - {room.name} (Unique)
                    </option>
                  ))}
                </select>
                <div className="muted">
                  Utility aura <span className="badge unique">Unique</span>
                </div>
              </div>
              <div className="row">
                <button
                  className="btn"
                  onClick={() => {
                    buildUtilityRoom();
                    setActiveTab("dungeon");
                  }}
  disabled={locked || state.movePayload || !isBuildPhase}
                >
                  Build Utility Room
                </button>
                <div className="muted">Affects adjacent tiles.</div>
              </div>
              <div className="row">
                <button
                  className="btn"
                  onClick={armTrap}
                  disabled={locked || state.movePayload || !isBuildPhase || selectedTile.room !== "trap"}
                >
                  {selectedTile.room === "trap" && selectedTile.trap ? "Disarm Trap" : "Arm Trap"}
                </button>
                <div className="muted">Trap stars add charges. Rank adds damage. Cooldown refreshes every turn.</div>
              </div>
              <div className="row">
                <button
                  className="btn"
                  onClick={addMonsterToRoom}
                  disabled={locked || state.movePayload || !isBuildPhase || selectedTile.room !== "monster" || state.invMonsters.length === 0}
                >
                  Summon Monster
                </button>
                <div className="muted">Inv: {state.invMonsters.length}</div>
              </div>
              <div className="row">
                <button className="btn danger" onClick={clearTile} disabled={locked || state.movePayload || !isBuildPhase || selectedTile.entrance}>Clear Tile</button>
                <div className="muted">Clears room/flags. Monsters return to inventory. Entrance is fixed.</div>
              </div>

              <div className="muted small">Rooms placed: {roomsPlaced} / {maxRooms}</div>
            </div>

            <div className="card">
              <div className="cardTitle">Room Architect</div>
              <div className="row">
                <button
                  className="btn"
                  onClick={upgradeRoom}
                  disabled={
                    locked ||
                    state.movePayload ||
                    !isBuildPhase ||
                    !selectedTile.room ||
                    (selectedTile.roomTier || 1) >= ROOM_TIER_MAX ||
                    (roomUpgradePrice !== null && state.currency.essence < roomUpgradePrice)
                  }
                >
                  Upgrade Room
                </button>
                <div className="muted">
                  {selectedTile.room
                    ? `Cost ${scaleByDay(roomUpgradePrice, state.day, 0.03, 3.0)} Essence. Max Tier ${ROOM_TIER_MAX}.`
                    : "Select a room to upgrade."}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="cardTitle">Monster Trader</div>
              {state.traderStock && state.traderStock.length > 0 ? (
                <div className="entityList">
                  {state.traderStock.map((m, idx) => (
                    <div className="entityItem" key={`trade-${m.key}-${idx}`}>
                      <div className="entityName">{m.name}</div>
                      <div className="entityMeta">
                        {safeEntityLabel(m.race, "Monster")}
                        <span className="badge class">{safeEntityLabel(m.class, "Brute")}</span> | {formatStars(safeEntityStars(m))}
                      </div>
                      <div className="entityStats">
                        HP {m.hp}/{safeEntityMaxHp(m)} | ATK {m.atk} | DEF {m.def || 0}
                      </div>
                      <div className="row">
                        <button className="btn" onClick={() => buyFromTrader(idx)} disabled={!isBuildPhase}>
                          Buy ({traderPrice(m)} Soulshards)
                        </button>
                        <div className="muted">Daily stock</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="muted">Trader is out of stock.</div>
              )}
            </div>

            <div className="card">
              <div className="cardTitle">Shady Dealer</div>
              {state.shadyStock && state.shadyStock.length > 0 ? (
                <div className="entityList">
                  {state.shadyStock.map((a, idx) => (
                    <div className="entityItem" key={`artifact-${a.key}-${idx}`}>
                      <div className="entityName">{a.name}</div>
                      <div className="entityMeta">{a.desc}</div>
                      <div className="row">
                        <button className="btn" onClick={() => buyArtifact(idx)} disabled={!isBuildPhase}>
                          Buy ({scaleByDay(a.cost.amount, state.day, 0.04, 2.5)} {a.cost.currency})
                        </button>
                        <div className="muted">Daily stock</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="muted">Dealer is out of stock.</div>
              )}
            </div>

            <div className="card">
              <div className="cardTitle">Dungeon Upgrades</div>
              <div className="row">
                <button className="btn" onClick={upgradeDungeon} disabled={locked || state.movePayload || !isBuildPhase || state.raidActive}>
                  Upgrade Dungeon
                </button>
                <div className="muted">
                  Cost {scaleByDay(25 + dungeonLevel * 15, state.day, 0.03, 3.0)} Essence. +{ROOMS_PER_LEVEL} room cap.
                </div>
              </div>
            </div>

            <div className="card">
              <div className="cardTitle">Dominion Powers</div>
              <div className="row">
                <button
                  className="btn"
                  onClick={() => useDominionPower("pulse")}
                  disabled={locked || !isBattlePhase || state.currency.dominion < 2}
                >
                  Pulse (2 DP)
                </button>
                <div className="muted">Damages all heroes before they act.</div>
              </div>
              <div className="row">
                <button
                  className="btn"
                  onClick={() => useDominionPower("shield")}
                  disabled={locked || !isBattlePhase || state.currency.dominion < 2}
                >
                  Shield (2 DP)
                </button>
                <div className="muted">Adds +10 Core Shield.</div>
              </div>
              <div className="row">
                <button
                  className="btn"
                  onClick={() => useDominionPower("speed")}
                  disabled={locked || !isBattlePhase || state.currency.dominion < 1}
                >
                  Speed (1 DP)
                </button>
                <div className="muted">Monsters act first this turn.</div>
              </div>
              <div className="row">
                <button
                  className="btn"
                  onClick={() => useDominionPower("strength")}
                  disabled={locked || !isBattlePhase || state.currency.dominion < 1}
                >
                  Strength (1 DP)
                </button>
                <div className="muted">Monsters gain +1 ATK this turn.</div>
              </div>
            </div>

            <div className="card">
              <div className="cardTitle">Move Layout</div>
              <div className="row">
                <button className="btn" onClick={startMove} disabled={locked || !!state.movePayload || !isBuildPhase}>
                  Move Selected
                </button>
                <div className="muted">Pick up a room or the Core, then click a new tile.</div>
              </div>
              <div className="row">
                <button className="btn danger" onClick={cancelMove} disabled={!state.movePayload}>
                  Cancel Move
                </button>
                <div className="muted">Returns the piece to its original tile.</div>
              </div>
            </div>

            <div className="card">
              <div className="cardTitle">Recruit</div>
              <div className="row">
                <button className="btn" onClick={recruitMonster} disabled={locked || state.movePayload || !isBuildPhase}>Recruit Monster</button>
                <div className="muted">Cost scales with day and monster type.</div>
              </div>
              <div className="row">
                <div className="muted">Inventory: {state.invMonsters.length} monsters</div>
              </div>
              {invPreview.length > 0 && (
                <div className="muted small">
                  Next up: {invPreview.map((m) => `${m.name} (${formatStars(safeEntityStars(m))})`).join(", ")}
                </div>
              )}
            </div>
            <div className="card">
              <div className="cardTitle">Raid Controls</div>
              <div className="row">
                <button className="btn" onClick={beginBattle} disabled={locked || state.movePayload || isBattlePhase}>
                  Begin Battle
                </button>
                <div className="muted">Ends build phase and generates the next raid: {pendingRaidMeta.label}.</div>
              </div>
              <div className="row">
                <button className="btn primary" onClick={startRaid} disabled={!canStartRaid || state.movePayload}>
                  Start Raid
                </button>
                <div className="muted">
                  {locked
                    ? "Defeat - reset to continue."
                    : state.raidActive
                    ? `Raid active. Remaining to spawn: ${state.raidRemaining}`
                    : validation.ok
                    ? `Starts the raid for Day ${state.day}.`
                    : "Requires valid dungeon."}
                </div>
              </div>

              <div className="row">
                <button className="btn primary" onClick={endTurn} disabled={!canEndTurn || state.movePayload}>
                  End Turn
                </button>
                <div className="muted">Resolves movement/combat. If raid has heroes pending, one may spawn (cap applies).</div>
              </div>
            </div>

            <div className="card">
              <div className="cardTitle">Invading Party</div>
              {state.currentParty && state.currentParty.length > 0 ? (
                <div className="entityList">
                  {state.currentParty
                    .slice()
                    .sort((a, b) => (b.spd || 0) - (a.spd || 0))
                    .map((h) => (
                      <div className="entityItem" key={`party-${h.id}`}>
                        <div className="entityName">{h.name}</div>
                        <div className="entityMeta">
                          {safeEntityLabel(h.race, "Unknown")} {safeEntityLabel(h.class, "Hero")} | {formatStars(safeEntityStars(h))} | {h.archetypeLabel || "Zealot"}
                        </div>
                        <div className="entityStats">
                          HP {h.hp}/{safeEntityMaxHp(h)} | ATK {h.atk} | DEF {h.def || 0} | SHD {h.shd || 0} | SPD {h.spd || 0}
                        </div>
                        <div className="muted small">{invaderPassiveSummary(h)}</div>
                        <div className="muted small">{h.raidOriginLabel || "Hero Raid"}{h.factionName ? ` | ${h.factionName}` : ""}</div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="muted">No party generated yet.</div>
              )}
            </div>

            <div className="card">
              <div className="cardTitle">Last Raid</div>
              {state.lastRaidReport ? (
                <>
                  <div className="muted">Turns: {state.lastRaidReport.turns}</div>
                  <div className="muted">Kills: {state.lastRaidReport.kills}</div>
                  <div className="muted">Essence Gained: {state.lastRaidReport.essence}</div>
                  <div className="muted">Soulshards Gained: {state.lastRaidReport.soulshards}</div>
                  <div className="muted">Core Damage: {state.lastRaidReport.coreDamage}</div>
                </>
              ) : (
                <div className="muted">No raid report yet.</div>
              )}
            </div>

            <div className="card">
              <div className="cardTitle">Scout Report</div>
              {state.scoutQueue && state.scoutQueue.length > 0 ? (
                <div className="entityList">
                  {state.scoutQueue.slice(0, 2).map((h, idx) => (
                    <div className="entityItem" key={`scout-${h.id}-${idx}`}>
                      <div className="entityName">{h.name}</div>
                      <div className="entityMeta">
                        {safeEntityLabel(h.race, "Unknown")} {safeEntityLabel(h.class, "Hero")} | {formatStars(safeEntityStars(h))} | {h.archetypeLabel || "Zealot"}
                      </div>
                      <div className="entityStats">
                        HP {h.hp}/{safeEntityMaxHp(h)} | ATK {h.atk}
                      </div>
                      <div className="muted small">{invaderPassiveSummary(h)}</div>
                      <div className="muted small">{h.raidOriginLabel || "Hero Raid"}{h.factionName ? ` | ${h.factionName}` : ""}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="muted">No scout data.</div>
              )}
            </div>

            <div className="card">
              <div className="cardTitle">Run</div>
              <div className="row">
                <button className="btn" onClick={resetRun}>Reset Run</button>
                <div className="muted">Keeps layout. Clears monsters. Rearms traps.</div>
              </div>
              <div className="row">
                <button className="btn" onClick={newRun}>New Run</button>
                <div className="muted">Wipes everything and starts fresh.</div>
              </div>
              <div className="row">
                <button className="btn" onClick={loadRun}>Load Run</button>
                <div className="muted">Loads the last auto-saved run.</div>
              </div>
              <div className="row">
                <button className="btn" onClick={saveRun}>Save Now</button>
                <div className="muted">Manual save for testing.</div>
              </div>
            </div>
          </div>
        </section>

        <section className="panel panel--inventory">
          <div className="panelTitle">Monster Inventory</div>
          <div className="toolboxScroll">
            <div className="card">
              <div className="cardTitle">Stockpile</div>
              <div className="muted">Total: {state.invMonsters.length}</div>
            </div>
            <div className="card">
              <div className="cardTitle">Artifacts</div>
              {state.artifacts.length ? (
                <div className="entityList">
                  {state.artifacts.map((a, idx) => (
                    <div className="entityItem" key={`owned-${a.key}-${idx}`}>
                      <div className="entityName">{a.name}</div>
                      <div className="entityMeta">{a.desc}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="entityEmpty">No artifacts owned.</div>
              )}
            </div>
            <div className="card">
              <div className="cardTitle">Monsters</div>
              {state.invMonsters.length ? (
                <div className="entityList">
                  {state.invMonsters.map((m, idx) => (
                    <div className="entityItem" key={`${m.key}-${idx}`}>
                      <div className="entityName">{m.name}</div>
                      <div className="entityMeta">
                        {safeEntityLabel(m.race, "Monster")}
                        <span className="badge class">{safeEntityLabel(m.class, "Brute")}</span> | {formatStars(safeEntityStars(m))} |{" "}
                        {safeEntityLabel(m.passive, "None")}
                      </div>
                      <div className="entityStats">
                        HP {m.hp}/{safeEntityMaxHp(m)} | ATK {m.atk} | Evo {m.evoPoints || 0}
                      </div>
                      <div className="muted">
                        {evolutionStageLabel(m)}{m.branchClass ? ` | Branch ${m.branchClass}` : ""}
                      </div>
                      <div className="row">
                        <button
                          className="btn"
                          onClick={() => startEvolution({ type: "inv", index: idx })}
                          disabled={!isBuildPhase || !monsterCanEvolve(m, state.currency.evolution)}
                        >
                          {evolutionButtonLabel(m)}
                        </button>
                        <div className="muted">{evolutionStageLabel(m)}</div>
                      </div>
                      {state.evolutionOffer &&
                        state.evolutionOffer.source?.type === "inv" &&
                        state.evolutionOffer.source?.index === idx && (
                        <div className="evolveOptions">
                          {state.evolutionOffer.options.map((opt, optIdx) => (
                            <button
                              className="btn small"
                              key={`${m.key}-evo-${optIdx}`}
                              onClick={() => chooseEvolution({ type: "inv", index: idx }, opt)}
                            >
                              {opt.name} (+{opt.passive})
                            </button>
                          ))}
                          <button className="btn small danger" onClick={cancelEvolution}>
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="entityEmpty">No monsters in inventory.</div>
              )}
            </div>
          </div>
        </section>

        <section className="panel panel--evolution">
          <div className="panelTitle">Evolution</div>
          <div className="toolboxScroll">
            <div className="card">
              <div className="cardTitle">Evolution Points</div>
              <div className="muted">Global: {state.currency.evolution}</div>
            </div>
            <div className="card">
              <div className="cardTitle">Evolvable Monsters</div>
              {(() => {
                const items = [];
                state.invMonsters.forEach((m, idx) => {
                  if (monsterCanEvolve(m, state.currency.evolution)) {
                    items.push({ source: { type: "inv", index: idx }, monster: m, label: "Inventory" });
                  }
                });
                state.grid.forEach((row, y) => {
                  row.forEach((t, x) => {
                    if (t.room === "monster" && t.monsters.length) {
                      t.monsters.forEach((m, idx) => {
                        if (monsterCanEvolve(m, state.currency.evolution)) {
                          const roomName = MONSTER_ROOM_MAP[t.roomType]?.name || "Monster Room";
                          items.push({
                            source: { type: "room", x, y, index: idx },
                            monster: m,
                            label: `${roomName} (${x + 1},${y + 1})`,
                          });
                        }
                      });
                    }
                  });
                });
                if (!items.length) {
                  return <div className="entityEmpty">No monsters have enough Evolution to advance.</div>;
                }
                return (
                  <div className="entityList">
                    {items.map((item, idx) => (
                      <div className="entityItem" key={`evo-${idx}`}>
                        <div className="entityName">{item.monster.name}</div>
                        <div className="entityMeta">
                          {safeEntityLabel(item.monster.race, "Monster")}
                          <span className="badge class">{safeEntityLabel(item.monster.class, "Brute")}</span> |{" "}
                          {formatStars(safeEntityStars(item.monster))} | Evo {item.monster.evoPoints || 0} |{" "}
                          {safeEntityLabel(item.monster.passive, "None")}
                        </div>
                        <div className="entityStats">
                          HP {item.monster.hp}/{safeEntityMaxHp(item.monster)} | ATK {item.monster.atk}
                        </div>
                        <div className="muted">Location: {item.label}</div>
                        <div className="muted">
                          {evolutionStageLabel(item.monster)}{item.monster.branchClass ? ` | Branch ${item.monster.branchClass}` : ""}
                        </div>
                        <div className="row">
                          <button
                            className="btn"
                            onClick={() => startEvolution(item.source)}
                            disabled={!isBuildPhase || !monsterCanEvolve(item.monster, state.currency.evolution)}
                          >
                            {evolutionButtonLabel(item.monster)}
                          </button>
                          <div className="muted">{evolutionStageLabel(item.monster)}</div>
                        </div>
                        {state.evolutionOffer &&
                          evoSourceKey(state.evolutionOffer.source) === evoSourceKey(item.source) && (
                            <div className="evolveOptions">
                              {state.evolutionOffer.options.map((opt, optIdx) => (
                                <button
                                  className="btn small"
                                  key={`evo-choice-${idx}-${optIdx}`}
                                  onClick={() => chooseEvolution(item.source, opt)}
                                >
                                  {opt.name} (+{opt.passive})
                                </button>
                              ))}
                              <button className="btn small danger" onClick={cancelEvolution}>
                                Cancel
                              </button>
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </section>

        <section className="panel panel--council">
          <div className="panelTitle">Council of the Dungeonlords</div>
          <div className="toolboxScroll">
            {state.councilSession && state.councilSession.day === state.day ? (
              <>
                <div className="card">
                  <div className="cardTitle">Attending Lords</div>
                  <div className="entityList">
                    {(state.council?.roster || []).map((m) => (
                      <div className="entityItem" key={`council-${m.key}`}>
                        <div className="entityName">
                          {m.name} - {m.title}
                        </div>
                        <div className="entityMeta">{m.theme}</div>
                        <div className="muted">{m.role}</div>
                      </div>
                    ))}
                  </div>
                  {state.councilSession.status === "pending" && (
                    <div className="row">
                      <button className="btn" onClick={attendCouncil}>
                        Attend
                      </button>
                      <button className="btn danger" onClick={declineCouncil}>
                        Decline
                      </button>
                    </div>
                  )}
                  {state.councilSession.status === "attended" && <div className="muted">Status: Attended</div>}
                  {state.councilSession.status === "declined" && <div className="muted">Status: Declined</div>}
                </div>

                <div className="card">
                  <div className="cardTitle">Council Discourse</div>
                  <div className="entityList">
                    {state.councilSession.dialogue.map((line, idx) => (
                      <div className="entityItem" key={`council-line-${idx}`}>
                        <div className="entityMeta">{line}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div className="cardTitle">Rumors & Intelligence</div>
                  <div className="entityList">
                    {state.councilSession.rumors.map((line, idx) => (
                      <div className="entityItem" key={`council-rumor-${idx}`}>
                        <div className="entityMeta">{line}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div className="cardTitle">Boons</div>
                  {state.councilSession.status === "attended" ? (
                    state.councilSession.offers.length ? (
                      <div className="entityList">
                        {state.councilSession.offers.map((o) => (
                          <div className="entityItem" key={o.id}>
                            <div className="entityName">{o.title}</div>
                            <div className="entityMeta">{o.sponsorName}</div>
                            <div className="entityMeta">
                              {o.desc} ({o.type === "monster" ? "Recruit" : `+${o.amount}`})
                            </div>
                            <div className="muted small">{o.raidEffect?.desc || "No raid leverage."}</div>
                            <div className="row">
                              <button className="btn" onClick={() => acceptCouncilOffer(o.id)}>
                                Accept
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="entityEmpty">No boons remaining.</div>
                    )
                  ) : (
                    <div className="entityEmpty">Attend the Council to access boons.</div>
                  )}
                </div>

                <div className="card">
                  <div className="cardTitle">Council Quest</div>
                  {state.councilQuest?.active ? (
                    <>
                      <div className="entityName">{state.councilQuest.title}</div>
                      <div className="entityMeta">{state.councilQuest.desc}</div>
                      <div className="muted">
                        Progress: {state.councilQuest.progress}/{state.councilQuest.goal}
                      </div>
                    </>
                  ) : state.councilSession.status === "attended" && state.councilSession.quest ? (
                    <>
                      <div className="entityName">{state.councilSession.quest.title}</div>
                      <div className="entityMeta">{state.councilSession.quest.desc}</div>
                      <div className="muted">{state.councilSession.quest.sponsorName}</div>
                      <div className="muted">
                        Reward: +{state.councilSession.quest.reward.amount} {state.councilSession.quest.reward.type}
                      </div>
                      <div className="row">
                        <button className="btn" onClick={acceptCouncilQuest}>
                          Accept Quest
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="entityEmpty">No active quest.</div>
                  )}
                </div>
              </>
            ) : (
              <div className="card">
                <div className="muted">The Council is not in session.</div>
              </div>
            )}
            {contentWarnings.length ? (
              <div className="card">
                <div className="cardTitle">Content Validation</div>
                <div className="entityList">
                  {contentWarnings.map((warning, idx) => (
                    <div className="entityItem" key={`content-warning-${idx}`}>
                      <div className="entityMeta">{warning}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className="panel panel--glossary">
          <div className="panelTitle">Glossary</div>
          <div className="toolboxScroll">
            <div className="card">
              <div className="cardTitle">Monster Passives</div>
              <div className="entityList">
                {MONSTER_PASSIVE_RULES.map((p) => (
                  <div className="entityItem" key={p.key}>
                    <div className="entityName">{p.name}</div>
                    <div className="entityMeta">{p.desc}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="cardTitle">Hero Passives</div>
              <div className="entityList">
                {HERO_PASSIVE_RULES.map((p) => (
                  <div className="entityItem" key={p.key}>
                    <div className="entityName">{p.name}</div>
                    <div className="entityMeta">{p.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="panel panel--log">
          <div className="panelTitle">Log</div>
          <div className="logScroll">
            {state.log.map((l, idx) => (
              <div className="logLine" key={idx}>
                {l}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}



