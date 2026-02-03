import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

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
  { key: "spike-pit", name: "Spike Pit", desc: "On entry: 10 damage.", baseDmg: 10 },
  { key: "poison-vent", name: "Poison Vent", desc: "On entry: 4 damage + Poison (2 dmg, 3 turns).", baseDmg: 4 },
  { key: "frost-rune", name: "Frost Rune", desc: "On entry: 5 damage + Slow (2 turns).", baseDmg: 5 },
  { key: "shock-coil", name: "Shock Coil", desc: "On entry: 6 damage + Stun (skip next move).", baseDmg: 6 },
  { key: "snare-net", name: "Snare Net", desc: "On entry: Rooted (skip next move).", baseDmg: 0 },
  { key: "flame-jet", name: "Flame Jet", desc: "On entry: 8 damage (+4 if already damaged).", baseDmg: 8 },
  { key: "cursed-brand", name: "Cursed Brand", desc: "On entry: Mark hero; on death +10 Essence.", baseDmg: 0 },
  { key: "blink-trap", name: "Blink Trap", desc: "On entry: Teleport hero back 1 tile.", baseDmg: 0 },
  { key: "shatter-floor", name: "Shatter Floor", desc: "First entry: 12 damage, then breaks.", baseDmg: 12 },
  { key: "arrow-gallery", name: "Arrow Gallery", desc: "On entry: 3 damage + 3 damage next turn.", baseDmg: 3 },
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
  const offers = pickUnique(COUNCIL_OFFER_TEMPLATES, 2).map((o, idx) => {
    const amount = Math.max(1, Math.round(scaleByDay(20 + idx * 10, day, 0.06, 4)));
    return { id: `${o.type}-${day}-${idx}`, ...o, amount };
  });
  const questTemplate = pick(COUNCIL_QUESTS);
  const goal = Math.max(6, Math.round(scaleByDay(8, day, 0.04, 3.5)));
  const quest = {
    id: `${questTemplate.key}-${day}`,
    title: questTemplate.title,
    goal,
    progress: 0,
    reward: { type: questTemplate.reward.type, amount: Math.max(2, Math.round(scaleByDay(12, day, 0.05, 4))) },
    desc: questTemplate.desc.replace("{goal}", goal),
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

function scaleStat(base, stars) {
  const bonus = stars === 6 ? 0.35 : 0;
  const mult = 1 + (stars - 1) * 0.3 + bonus;
  return Math.max(1, Math.round(base * mult));
}

function generateHero(id, entrancePos, turnsSurvived, raidType) {
  let stars = rollStars(turnsSurvived, 6);
  let eliteMult = 1;
  if (raidType === "elite") {
    stars = Math.min(6, stars + 1);
    eliteMult = 1.2;
  } else if (raidType === "council") {
    stars = Math.min(6, stars + 2);
    eliteMult = 1.35;
  }
  const race = pick(HERO_RACES);
  const heroClass = pick(HERO_CLASSES);
  const passive = pick(HERO_PASSIVES);
  const name = `${pick(HERO_NAMES)} the ${heroClass}`;
  const stats = {
    maxHp: Math.round(scaleStat(HERO_BASE.hp, stars) * eliteMult),
    atk: Math.round(scaleStat(HERO_BASE.atk, stars) * eliteMult),
    def: Math.max(0, Math.floor(stars / 2)),
    shd: Math.max(0, stars - 2),
    spd: Math.max(1, 2 + stars),
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
    race,
    class: heroClass,
    stars,
    passive,
    stats,
    name,
    statuses: {},
    counters: {
      stunnedOnce: false,
      siphonGained: 0,
      tookDamageThisRaid: false,
      cursedMark: false,
      wardedUsed: false,
      resoluteUsed: false,
      stoicUsed: false,
    },
  };
}

function generateMonster(kind, turnsSurvived, starCap, day = 1) {
  const base = MONSTERS[kind];
  let stars = rollStars(turnsSurvived, 8);
  if (starCap) stars = Math.min(stars, starCap);
  const passiveKey = pick(MONSTER_PASSIVES);
  const passive = MONSTER_PASSIVE_MAP[passiveKey]?.name || "Savage";
  let archetype = pick(MONSTER_ARCHETYPES);
  let affinity = null;
  if (MONSTER_AFFINITY_RULES[kind]) {
    affinity = pick(MONSTER_AFFINITY_RULES[kind]);
    archetype = `${affinity} Affinity`;
  } else if (MONSTER_CLASS_RULES[kind]) {
    archetype = pick(MONSTER_CLASS_RULES[kind]);
  }
  const stats = {
    maxHp: scaleStat(base.hp, stars),
    atk: scaleStat(base.atk, stars),
    def: Math.max(0, Math.floor(stars / 2)),
  };
  const modSource = affinity ? AFFINITY_STAT_MODS[affinity] : CLASS_STAT_MODS[archetype];
  if (modSource) {
    stats.maxHp = Math.max(1, stats.maxHp + (modSource.hp || 0));
    stats.atk = Math.max(1, stats.atk + (modSource.atk || 0));
    stats.def = Math.max(0, stats.def + (modSource.def || 0));
  }
  const dayMult = dayMultiplier(day, 0.04, 2.5);
  stats.maxHp = Math.max(1, Math.round(stats.maxHp * dayMult));
  stats.atk = Math.max(1, Math.round(stats.atk * dayMult));
  stats.def = Math.max(0, Math.round(stats.def * dayMult));
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
    passive,
    passiveKey,
    passiveKeys: [passiveKey],
    stats,
    affinity,
    evoPoints: 0,
    foughtThisRaid: false,
    shieldedThisTurn: false,
  };
}

function initMonsterInventory(turnsSurvived, count = 4, starCap, day = 1) {
  return Array.from({ length: count }, () => generateMonster(pick(MONSTER_KEYS), turnsSurvived, starCap, day));
}

function generateHeroParty(turnsSurvived, raidType) {
  const size = DAY_START_PARTY_MIN + Math.floor(Math.random() * (DAY_START_PARTY_MAX - DAY_START_PARTY_MIN + 1));
  const basePos = { x: 0, y: 0 };
  const party = [];
  let nextId = 1;
  for (let i = 0; i < size; i++) {
    const hero = generateHero(nextId, basePos, turnsSurvived, raidType);
    party.push(hero);
    nextId += 1;
  }
  return party;
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
    trapStars: 1,
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
      trapStars: t.trapStars,
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
  return t.entrance || t.core || t.room === "trap" || t.room === "monster" || t.room === "utility";
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
        t.trapStars = t.trapStars || 1;
        t.trapBroken = false;
        t.monsters = [];
      } else if (t.room === "monster") {
        t.trap = false;
        t.trapStars = t.trapStars || 1;
        t.ambushUsed = false;
        t.monsters = [];
      } else {
        t.trap = false;
        t.trapStars = t.trapStars || 1;
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
  const [councilScreenOpen, setCouncilScreenOpen] = useState(false);
  const [focusedCouncilKey, setFocusedCouncilKey] = useState(null);
  const [fuseA, setFuseA] = useState("");
  const [fuseB, setFuseB] = useState("");
  const [sacrificeIdx, setSacrificeIdx] = useState("");
  function defaultState() {
    const startingParty = generateHeroParty(0);
    const dailyEvent = rollDailyEvent();
    const traderStock = generateTraderStock(0, 1);
    const shadyStock = generateArtifactStock();
    const grid = initStartingGrid();
    let invMonsters = initMonsterInventory(0, 2, 3, 1);
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
      artifacts: [],
      shadyStock,
      coreHp: CORE_MAX_HP,
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
      raidStartCoreHp: CORE_MAX_HP,
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
      councilSession: null,
      councilQuest: null,
      nextRaidType: null,
      pendingPunitiveRaid: false,
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
            return {
              ...cell,
              ...rawCell,
              monsters: Array.isArray(rawCell.monsters) ? rawCell.monsters : [],
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
      const fleshMarketUntilDay = parsed.fleshMarketUntilDay || base.fleshMarketUntilDay;
      const nextRaidType = parsed.nextRaidType || base.nextRaidType;
      const pendingPunitiveRaid =
        !!parsed.pendingPunitiveRaid || (council.declinedStreak >= 2 && nextRaidType === "council");
      const currentPartyRaidType = parsed.currentPartyRaidType || null;
      const councilSession = parsed.councilSession || base.councilSession;
      const councilQuest = parsed.councilQuest || base.councilQuest;
      return {
        ...base,
        ...parsed,
        grid,
        selected,
        currency,
        dailyEvent,
        traderStock,
        shadyStock,
        artifacts,
        dominionEffects,
        evolutionOffer,
        coreShield,
        council,
        councilSession,
        councilQuest,
        fleshMarketUntilDay,
        nextRaidType,
        pendingPunitiveRaid,
        currentPartyRaidType,
        invMonsters: Array.isArray(parsed.invMonsters) ? parsed.invMonsters : base.invMonsters,
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

  const { entrance, core } = useMemo(() => findEntranceAndCore(state.grid), [state.grid]);
  const validation = useMemo(() => validateDungeon(state.grid), [state.grid]);
  const roomsPlaced = useMemo(() => countRooms(state.grid), [state.grid]);
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
          t.trapStars = payload.trapStars;
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
      t.trapStars = 1;
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
      t.trapStars = 1;
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
      t.trapStars = 1;
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
      if (anyUtilityRoom(grid, s.selectedUtilityRoomType)) {
        const name = UTILITY_MAP[s.selectedUtilityRoomType]?.name || "Utility Room";
        return addLog(s, `${name} is unique. You can only build one.`);
      }
      const level = Number.isFinite(s.dungeonLevel) ? s.dungeonLevel : 1;
      const cap = MAX_ROOMS_BASE + (level - 1) * ROOMS_PER_LEVEL;
      if (countRooms(grid) >= cap) return addLog(s, `Room limit reached (${cap}).`);

      t.room = "trap";
      t.roomTier = 1;
      t.trap = true;
      t.trapType = s.selectedTrapType;
      t.trapStars = rollStars(s.turnsSurvived, 8);
      t.trapBroken = false;
      t.monsters = [];

      const trapName = TRAP_MAP[t.trapType]?.name || "Trap Room";
      return addLog({ ...s, grid }, `Built ${trapName} at (${s.selected.x + 1},${s.selected.y + 1}).`);
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
      t.trapStars = 1;
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
      t.trapStars = 1;
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
      if (t.trapBroken) return addLog(s, "This trap is broken.");

      t.trap = !t.trap;
      return addLog({ ...s, grid }, t.trap ? "Trap armed." : "Trap removed.");
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
      const base = MONSTERS[kind];
      const scaledCost = scaleByDay(base.cost, s.day, 0.05, 3.0);
      if (s.currency.essence < scaledCost) return addLog(s, "Not enough Essence.");

      const monster = generateMonster(kind, s.turnsSurvived, undefined, s.day);
      const invMonsters = [...s.invMonsters, monster];
      return addLog(
        { ...s, currency: { ...s.currency, essence: s.currency.essence - scaledCost }, invMonsters },
        `Recruited ${monster.name} for ${scaledCost} Essence.`
      );
    });
  }

  function buildEvolutionOptions(monster) {
    const baseRace = monster.race || MONSTERS[monster.key]?.name || "Monster";
    return pickUnique(MONSTER_EVOLUTION_BRANCHES, 3).map((branch) => {
      const key = pick(MONSTER_PASSIVES);
      return {
        name: `${baseRace} ${branch}`,
        class: branch,
        passive: MONSTER_PASSIVE_MAP[key]?.name || "Savage",
        passiveKey: key,
      };
    });
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
      const personalPoints = target.evoPoints || 0;
      if (personalPoints < 1 && s.currency.evolution < 1) {
        return addLog(s, "Not enough Evolution.");
      }
      const options = buildEvolutionOptions(target);
      return { ...s, evolutionOffer: { source, options } };
    });
  }

  function chooseEvolution(source, option) {
    if (locked) return;
    setState((s) => {
      if (!s.evolutionOffer || evoSourceKey(s.evolutionOffer.source) !== evoSourceKey(source)) return s;
      const target = getMonsterFromSource(s, source);
      if (!target) return s;
      const personalPoints = target.evoPoints || 0;
      if (personalPoints < 1 && s.currency.evolution < 1) {
        return addLog(s, "Not enough Evolution.");
      }
      const base = MONSTERS[target.key];
      const stars = Math.min(6, safeEntityStars(target) + 1);
      const stats = {
        maxHp: scaleStat(base.hp, stars),
        atk: scaleStat(base.atk, stars),
        def: Math.max(0, Math.floor(stars / 2)),
      };
      const evoLevel = (target.evolution || 0) + 1;
      stats.maxHp += evoLevel * 2;
      stats.atk += evoLevel;
      stats.def += Math.floor(evoLevel / 2);
      const evolved = {
        ...target,
        name: option.name,
        class: option.class,
        passive: option.passive || target.passive,
        passiveKey: option.passiveKey || target.passiveKey,
        passiveKeys: option.passiveKey ? [option.passiveKey] : target.passiveKeys || [target.passiveKey],
        stars,
        stats,
        hp: stats.maxHp,
        atk: stats.atk,
        def: stats.def,
        evolution: (target.evolution || 0) + 1,
        evoPoints: Math.max(0, personalPoints - 1),
      };
      let currency = s.currency;
      let spendNote = "personal";
      if (personalPoints < 1) {
        currency = { ...s.currency, evolution: s.currency.evolution - 1 };
        spendNote = "global";
      }
      let invMonsters = s.invMonsters;
      let grid = s.grid;
      if (source.type === "inv") {
        invMonsters = s.invMonsters.map((m, i) => (i === source.index ? evolved : m));
      } else if (source.type === "room") {
        grid = cloneGrid(s.grid);
        const tile = grid[source.y][source.x];
        if (tile && tile.room === "monster") {
          const buffed = applyMonsterRoomPlacement(evolved, tile.roomType, tile.roomTier);
          buffed.evoPoints = evolved.evoPoints;
          buffed.evolution = evolved.evolution;
          buffed.foughtThisRaid = evolved.foughtThisRaid;
          tile.monsters = tile.monsters.map((m, i) => (i === source.index ? buffed : m));
        }
      }
      return addLog(
        { ...s, grid, invMonsters, currency, evolutionOffer: null },
        `${target.name} evolves into ${evolved.name} (${spendNote} evolution).`
      );
    });
  }

  function cancelEvolution() {
    setState((s) => ({ ...s, evolutionOffer: null }));
  }

  function applyMonsterRoomPlacement(monster, roomType, roomTier = 1) {
    const m = { ...monster, stats: { ...monster.stats } };
    if (!roomType) return m;
    const tierBonus = Math.max(0, roomTier - 1);
    if (roomType === "training-den") {
      m.atk += 1 + tierBonus;
      m.stats.atk = m.atk;
    } else if (roomType === "thick-hide") {
      const delta = 3 + tierBonus * 2;
      m.stats.maxHp = (m.stats.maxHp || m.hp) + delta;
      m.hp += delta;
    }
    return m;
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
      const cap = monsterRoomCap(t.roomTier || 1);
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
          trapStars: t.trapStars,
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
        t.trapStars = 1;
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
        t.trapStars = s.movePayload.trapStars;
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
        t.trapStars = Math.min(5, (t.trapStars || 1) + 1);
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
      const party = generateHeroParty(s.turnsSurvived, raidType);
      let scoutQueue = [];
      const mirrorTier = maxUtilityTier(s.grid, "scout-mirror");
      if (mirrorTier > 0) {
        const revealCount = Math.min(party.length, 2 + (mirrorTier - 1));
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
      const raidLabel = raidType ? ` (${raidType.toUpperCase()} RAID)` : "";
      ns = addLog(ns, `Day ${s.day} battle begins. Party size ${party.length}.${raidLabel}`);
      if (scoutQueue.length > 0) {
        const previews = scoutQueue
          .map((h) => `${h.name} (${formatStars(safeEntityStars(h))}, ATK ${h.atk}, HP ${h.hp})`)
          .join(" | ");
        ns = addLog(ns, `Scout's Mirror reveals: ${previews}`);
      }
      return ns;
    });
  }

  function spawnOneHero(heroes, nextId, entrancePos, turnsSurvived, queueIn, grid, raidType) {
    let queue = queueIn ? [...queueIn] : [];
    let hero;
    if (queue.length > 0) {
      hero = { ...queue.shift() };
      hero.x = entrancePos.x;
      hero.y = entrancePos.y;
    } else {
      hero = generateHero(nextId, entrancePos, turnsSurvived, raidType);
    }
    if (grid && hasUtilityAura(grid, hero.x, hero.y, "fear-idol")) {
      hero.statuses = hero.statuses || {};
      hero.statuses.fear = { turns: 2, value: 1 };
    }
    heroes.push(hero);
    const nextHeroId = Math.max(nextId, hero.id + 1);
    return { nextHeroId, scoutQueue: queue };
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
      const party = reuseParty ? s.currentParty : generateHeroParty(s.turnsSurvived, raidType);
      let partyQueue = [...party];
      let raidRemaining = partyQueue.length;
      let raidKills = 0;
      let scoutQueue = [];

      const mirrorTier = maxUtilityTier(s.grid, "scout-mirror");
      if (mirrorTier > 0) {
        const revealCount = Math.min(partyQueue.length, 2 + (mirrorTier - 1));
        scoutQueue = partyQueue.slice(0, revealCount).map((h) => ({ ...h }));
      }

      if (heroes.length < HERO_CAP && partyQueue.length > 0) {
        const spawnResult = spawnOneHero(heroes, nextId, ent, s.turnsSurvived, partyQueue, grid, raidType);
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
          raidKills,
          scoutQueue,
          currentParty: party,
          currentPartyRaidType: raidType || null,
          partyQueue,
          raidType: raidType || null,
          nextRaidType: null,
          pendingPunitiveRaid: false,
        };
        const raidLabel = raidType ? ` (${raidType.toUpperCase()} RAID)` : "";
        ns = addLog(ns, `Raid started. Party size ${party.length}. A hero enters.${raidLabel}`);
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
        raidKills,
        scoutQueue,
        currentParty: party,
        currentPartyRaidType: raidType || null,
        partyQueue,
        raidType: raidType || null,
        nextRaidType: null,
        pendingPunitiveRaid: false,
      };
      const raidLabel = raidType ? ` (${raidType.toUpperCase()} RAID)` : "";
      ns = addLog(ns, `Raid started. Party size ${party.length}. (Hero cap reached; no spawn yet.)${raidLabel}`);
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
      const raidMult = s.raidType === "council" ? 1.6 : s.raidType === "elite" ? 1.3 : 1;

      let turnsSurvived = s.turnsSurvived;
      let heroesIn = s.heroes;

      const { entrance: ent, core: corePos } = findEntranceAndCore(grid);

      const logLines = [];
      const push = (msg) => logLines.push(msg);

      const dist = (ax, ay, bx, by) => Math.abs(ax - bx) + Math.abs(ay - by);

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

      const heroHasPassive = (h, name) => h.passive === name;

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
          essence += Math.round(10 * (eventMods.essenceMult || 1));
          push(`Cursed Brand triggers on Hero#${h.id}. +10 Essence`);
        }
        const altarTier = utilityTier(grid, h.x, h.y, "soul-altar");
        if (altarTier > 0) {
          const altarGain = 15 + (altarTier - 1) * 5;
          essence += Math.round(altarGain * (eventMods.essenceMult || 1));
          push(`Soul Altar feeds on Hero#${h.id}. +${altarGain} Essence`);
        }
        const totalEssence = essenceGain + extraEssence;
        const totalShards = shardGain + extraShards;
        push(`Hero#${h.id} dies (${why}). +${totalEssence} Essence, +${totalShards} Soulshards`);
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
        const tier = utilityTier(grid, x, y, "siphon-pylon");
        if (tier <= 0) return;
        h.counters = h.counters || { stunnedOnce: false, siphonGained: 0, tookDamageThisRaid: false, cursedMark: false };
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
          h.counters = h.counters || { stunnedOnce: false, siphonGained: 0, tookDamageThisRaid: false, cursedMark: false };
          h.counters.tookDamageThisRaid = true;
          applySiphon(h, x, y);
        }
        return final;
      }

      function monsterAtkBonus(room, x, y) {
        let bonus = 0;
        const warTier = utilityTier(grid, x, y, "war-drum");
        if (warTier > 0) bonus += warTier;
        const roomTierBonus = Math.max(0, (room.roomTier || 1) - 1);
        bonus += roomTierBonus;
        if (room.roomType === "rally-banner" && room.monsters.length >= 2) bonus += 1;
        if (room.roomType === "pack-tactics") bonus += Math.min(2, room.monsters.length - 1);
        if (roomHasPassive(room, "warbanner")) bonus += 1;
        if (roomHasPassive(room, "packleader") && room.monsters.length >= 2) bonus += 1;
        bonus += eventMods.monsterAtk || 0;
        bonus += artifactMods.monsterAtk || 0;
        bonus += dominionEffects.monsterAtk || 0;
        return bonus;
      }

      function monsterMaxHp(m) {
        return m.stats && Number.isFinite(m.stats.maxHp) ? m.stats.maxHp : m.hp;
      }

      function monsterDefBonus(x, y) {
        const tier = utilityTier(grid, x, y, "reinforced-keystone");
        const base = tier > 0 ? 2 + (tier - 1) : 0;
        let bonus = base + (eventMods.monsterDef || 0);
        const room = grid[y][x];
        if (room && room.room === "monster" && roomHasPassive(room, "warding")) {
          bonus += 1;
        }
        return bonus;
      }

      function trapDamage(base, stars, x, y, roomTier = 1) {
        if (!base) return 0;
        let dmg = scaleStat(base, stars + Math.max(0, roomTier - 1));
        let mult = 1;
        const wardTier = utilityTier(grid, x, y, "ward-lantern");
        if (wardTier > 0) mult += 0.25 + 0.05 * (wardTier - 1);
        if (artifactMods.trapMult) mult += artifactMods.trapMult;
        return Math.round(dmg * mult);
      }

      if (dominionEffects.pulsePending && heroesIn.length > 0) {
        const afterPulse = [];
        for (const h0 of heroesIn) {
          let h = { ...h0 };
          h.statuses = h.statuses || {};
          h.counters = h.counters || { stunnedOnce: false, siphonGained: 0, tookDamageThisRaid: false, cursedMark: false };
          const dmg = applyHeroDamage(h, 5, h.x, h.y, false);
          push(`Dominion Pulse hits Hero#${h.id} for ${dmg}. Hero HP ${Math.max(0, h.hp)}`);
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
          cursedMark: false,
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
          const coreDmg = applyHeroDamage(h, DUNGEON_LORD_ATK, h.x, h.y, true);
          push(
            `Hero#${h.id} hits Core for ${heroAtk}. Core HP ${Math.max(0, coreHp)}. Core hits Hero for ${coreDmg}. Hero HP ${Math.max(0, h.hp)}`
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
            hasUtilityAura(grid, h.x, h.y, "haste-glyph") ||
            dominionEffects.monsterFirstStrike ||
            roomHasPassive(t, "swift");
          let tempDefBonus = 0;
          if (monsterHasPassive(m, "ironhide")) {
            const maxHp = monsterMaxHp(m);
            if (m.hp / Math.max(1, maxHp) > 0.5) {
              tempDefBonus = 1;
            }
          }
          if (monsterHasPassive(m, "cruelty") && h.hp < safeEntityMaxHp(h) * 0.5) {
            monsterAtk += 1;
          }

          const heroStrike = () => {
            const def = (m.def || 0) + monsterDefBonus(h.x, h.y) + tempDefBonus;
            let dmg = Math.max(1, heroAtk - def);
            if (t.roomType === "brawlers-ring" && !m.shieldedThisTurn) {
              dmg = Math.max(0, dmg - 2);
              m.shieldedThisTurn = true;
            }
            if (monsterHasPassive(m, "thorns")) {
              applyHeroDamage(h, 1, h.x, h.y, false);
            }
            if (monsterHasPassive(m, "bulwark") && !m.shieldedThisTurn) {
              dmg = Math.max(0, dmg - 1);
              m.shieldedThisTurn = true;
            }
            m.hp -= dmg;
            return dmg;
          };

          const monsterStrike = () => {
            let bonus = 0;
            if (monsterHasPassive(m, "savage")) bonus += 2;
            const dmg = applyHeroDamage(h, monsterAtk + bonus, h.x, h.y, true);
            if (dmg > 0 && t.roomType === "savage-kennels") {
              m.hp = Math.min(monsterMaxHp(m), m.hp + 2);
            }
            if (dmg > 0 && t.roomType === "hex-circle") {
              tryApplyDebuff(h, "weaken", 2, 1);
            }
            if (dmg > 0 && monsterHasPassive(m, "hex")) {
              tryApplyDebuff(h, "weaken", 2, 1);
            }
            if (dmg > 0 && monsterHasPassive(m, "leech")) {
              m.hp = Math.min(monsterMaxHp(m), m.hp + 2);
            }
            return dmg;
          };

          for (const roomMonster of t.monsters) {
            roomMonster.foughtThisRaid = true;
          }

          if (t.roomType === "ambush-alcove" && !t.ambushUsed) {
            const ambushDmg = monsterStrike();
            t.ambushUsed = true;
            push(`Ambush! ${m.name} strikes for ${ambushDmg}. Hero HP ${Math.max(0, h.hp)}`);
            if (h.hp <= 0) {
              heroDies(h, "ambushed");
              continue;
            }
          }

          if (hasteFirst) {
            const dmgToHero = monsterStrike();
            if (dmgToHero > 0) {
              push(`Hero#${h.id} takes ${dmgToHero} from ${m.name}. Hero HP ${Math.max(0, h.hp)}`);
            }
            if (h.hp <= 0) {
              heroDies(h, "killed in battle");
              continue;
            }
            const dmgToMonster = heroStrike();
            push(`Hero#${h.id} hits ${m.name} for ${dmgToMonster}. ${m.name} HP ${Math.max(0, m.hp)}`);
          } else {
            const dmgToMonster = heroStrike();
            push(`Hero#${h.id} hits ${m.name} for ${dmgToMonster}. ${m.name} HP ${Math.max(0, m.hp)}`);
            if (m.hp > 0) {
              const dmgToHero = monsterStrike();
              if (dmgToHero > 0) {
                push(`Hero#${h.id} takes ${dmgToHero} from ${m.name}. Hero HP ${Math.max(0, h.hp)}`);
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
          const fearTier = utilityTier(grid, h.x, h.y, "fear-idol");
          if (fearTier > 0) tryApplyDebuff(h, "fear", 2 + (fearTier - 1), 1);
        };

        // MOVE
        let moved = false;
        let skipped = false;
        if (consumeStatus(h, "stun")) {
          skipped = true;
          push(`Hero#${h.id} is stunned.`);
        }
        if (consumeStatus(h, "root")) {
          skipped = true;
          push(`Hero#${h.id} is rooted.`);
        }
        if (consumeStatus(h, "slow")) {
          if (!heroHasPassive(h, "Quick")) {
            skipped = true;
            push(`Hero#${h.id} is slowed.`);
          }
        }

        if (!skipped) {
          const walkableNeighbors = neighbors(h.x, h.y).filter((p) => tileWalkable(grid[p.y][p.x]));
          let candidates = walkableNeighbors
            .slice()
            .sort((a, b) => dist(a.x, a.y, corePos.x, corePos.y) - dist(b.x, b.y, corePos.x, corePos.y));

          if (h.prev) {
            const filtered = candidates.filter((p) => !(p.x === h.prev.x && p.y === h.prev.y));
            if (filtered.length > 0) candidates = filtered;
          }

          if (candidates.length > 0) {
            const bestDist = dist(candidates[0].x, candidates[0].y, corePos.x, corePos.y);
          const detourCandidates = candidates.filter((p) => {
            const t = grid[p.y][p.x];
            const d = dist(p.x, p.y, corePos.x, corePos.y);
            if (d > bestDist + 3) return false;
            if (t.room === "monster") return true;
            if (t.room === "trap") return true;
            return false;
          });
          let detourPickPool = detourCandidates;
          if (heroHasPassive(h, "Cunning")) {
            const trapOnly = detourCandidates.filter((p) => grid[p.y][p.x].room === "trap");
            if (trapOnly.length > 0) detourPickPool = trapOnly;
          }
          const detourChance = Math.min(0.9, 0.65 + (heroHasPassive(h, "Cunning") ? 0.15 : 0));
          const next =
              detourPickPool.length > 0 && Math.random() < detourChance
                ? pick(detourPickPool)
                : candidates[0];
            h.prev = { x: h.x, y: h.y };
            h.x = next.x;
            h.y = next.y;
            moved = true;
            push(`Hero#${h.id} moves to (${h.x + 1},${h.y + 1})`);
          } else {
            push(`Hero#${h.id} waits (no path).`);
          }
        }

        if (moved) {
          applyFearAura();
        }

        // TRAP TRIGGER
        const t2 = grid[h.y][h.x];
        if (moved && t2.room === "monster" && t2.monsters.length > 0) {
          if (roomHasPassive(t2, "venom-aura")) {
            if (tryApplyDebuff(h, "poison", 2, 2)) {
              push(`Hero#${h.id} is poisoned by Venom Aura.`);
            }
          }
          if (roomHasPassive(t2, "dread-howl")) {
            if (tryApplyDebuff(h, "fear", 2, 1)) {
              push(`Hero#${h.id} is terrified by Dread Howl.`);
            }
          }
          if (roomHasPassive(t2, "rot-cloud")) {
            const rotDmg = applyHeroDamage(h, 1, h.x, h.y, false);
            if (rotDmg > 0) {
              push(`Hero#${h.id} is seared by Rot Cloud for ${rotDmg}.`);
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
      const trapStars = t2.trapStars || 1;
      const trapKey = t2.trapType || "spike-pit";
      const trapBase = TRAP_MAP[trapKey]?.baseDmg || 0;
      const dayBoost = Math.min(3, Math.floor((s.day || 1) / 6));
      let trapDmg = trapDamage(trapBase, trapStars + dayBoost, h.x, h.y, t2.roomTier || 1);

      if (trapKey === "flame-jet" && h.counters.tookDamageThisRaid) {
        trapDmg = trapDamage(trapBase + 4, trapStars + dayBoost, h.x, h.y, t2.roomTier || 1);
      }

            if (heroHasPassive(h, "Keen")) {
              trapDmg = Math.max(0, trapDmg - 1);
            }

            if (trapDmg > 0) {
              const dealt = applyHeroDamage(h, trapDmg, h.x, h.y, false);
              push(`Hero#${h.id} triggers ${TRAP_MAP[trapKey]?.name || "trap"} for ${dealt}. Hero HP ${Math.max(0, h.hp)}`);
            }

            if (trapKey === "poison-vent") {
              if (tryApplyDebuff(h, "poison", 3, 2)) {
                push(`Hero#${h.id} is poisoned.`);
              }
            } else if (trapKey === "frost-rune") {
              if (tryApplyDebuff(h, "slow", 2, 1)) {
                push(`Hero#${h.id} is slowed.`);
              }
            } else if (trapKey === "shock-coil") {
              if (!h.counters.stunnedOnce) {
                if (tryApplyDebuff(h, "stun", 1, 1)) {
                  h.counters.stunnedOnce = true;
                  push(`Hero#${h.id} is stunned.`);
                }
              }
            } else if (trapKey === "snare-net") {
              if (tryApplyDebuff(h, "root", 1, 1)) {
                push(`Hero#${h.id} is rooted.`);
              }
            } else if (trapKey === "cursed-brand") {
              h.counters.cursedMark = true;
              push(`Hero#${h.id} is cursed.`);
            } else if (trapKey === "blink-trap") {
              const back = h.prev ? { ...h.prev } : ent;
              if (back) {
                const from = { x: h.x, y: h.y };
                h.x = back.x;
                h.y = back.y;
                h.prev = from;
                push(`Hero#${h.id} blinks back to (${h.x + 1},${h.y + 1}).`);
                applyFearAura();
              }
            } else if (trapKey === "arrow-gallery") {
              setStatus(h, "arrow", 1, 3);
              push(`Hero#${h.id} is targeted by arrows.`);
            }

            if (trapKey === "shatter-floor") {
              t2.trapBroken = true;
            }

            t2.trap = false;
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
          push(`Hero#${h.id} takes ${poisonDmg} poison damage. Hero HP ${Math.max(0, h.hp)}`);
          if (h.hp <= 0) {
            heroDies(h, "poison");
            continue;
          }
        }

        if (getStatus(h, "arrow").turns > 0) {
          const arrowDmg = applyHeroDamage(h, 3, h.x, h.y, false);
          consumeStatus(h, "arrow");
          push(`Hero#${h.id} is hit by arrows for ${arrowDmg}. Hero HP ${Math.max(0, h.hp)}`);
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
          const sigilTier = utilityTier(grid, x, y, "blood-sigil");
          if (t.room === "monster" && t.monsters.length > 0) {
            if (sigilTier > 0) {
              const heal = 2 + (sigilTier - 1);
              for (const m of t.monsters) {
                m.hp = Math.min(monsterMaxHp(m), m.hp + heal);
              }
            }
            if (roomHasPassive(t, "bloodcall")) {
              for (const m of t.monsters) {
                m.hp = Math.min(monsterMaxHp(m), m.hp + 1);
              }
            }
            if (roomHasPassive(t, "mender")) {
              let lowest = null;
              for (const m of t.monsters) {
                if (!lowest || m.hp < lowest.hp) lowest = m;
              }
              if (lowest) {
                lowest.hp = Math.min(monsterMaxHp(lowest), lowest.hp + 1);
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
        };
        nextState = addLog(nextState, "CORE DESTROYED - Defeat.");
        for (let i = logLines.length - 1; i >= 0; i--) nextState = addLog(nextState, logLines[i]);
        return nextState;
      }

      // DRIP SPAWN (finite)
      let nextHeroId = s.nextHeroId;
      let partyQueue = s.partyQueue ? [...s.partyQueue] : [];
      if (raidActive && partyQueue.length > 0 && ent && heroesOut.length < HERO_CAP) {
        const spawnResult = spawnOneHero(heroesOut, nextHeroId, ent, turnsSurvived, partyQueue, grid, s.raidType);
        nextHeroId = spawnResult.nextHeroId;
        partyQueue = spawnResult.scoutQueue;
        raidRemaining = partyQueue.length;
        push(`A hero enters. (${raidRemaining} left in this raid)`);
      } else if (raidActive && partyQueue.length > 0 && heroesOut.length >= HERO_CAP) {
        raidRemaining = partyQueue.length;
        push(`Hero cap reached (${HERO_CAP}). (${raidRemaining} still pending)`);
      }

      // AUTO-STOP (finite raid ends only when none left to spawn AND none alive)
      if (raidActive && raidRemaining === 0 && heroesOut.length === 0) {
        raidActive = false;
        const turnsSpent = Math.max(0, turnsSurvived - (s.raidStartTurn || 0));
        const essenceGained = Math.max(0, essence - (s.raidStartEssence || 0));
        const soulshardsGained = Math.max(0, soulshards - (s.raidStartShards || 0));
        const coreDamage = Math.max(0, (s.raidStartCoreHp || CORE_MAX_HP) - coreHp);
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
          nextState.councilSession = buildCouncilSession(roster, nextState.day);
          nextState = addLog(nextState, "Council of the Dungeonlords convenes. Attend or decline.");
        }
        if (nextState.councilSession && nextState.councilSession.day !== nextState.day) {
          nextState.councilSession = null;
        }
        nextState.raidType = null;
        nextState = addLog(nextState, `Day ${nextState.day} begins. Build phase.`);
        if (nextState.dailyEvent?.key && nextState.dailyEvent.key !== "none") {
          nextState = addLog(nextState, `Daily Event: ${nextState.dailyEvent.name} - ${nextState.dailyEvent.desc}`);
        }
      }

      if (!raidActive && raidRemaining === 0 && heroesOut.length === 0) {
        const turnsSpent = Math.max(0, turnsSurvived - (s.raidStartTurn || 0));
        const essenceGained = Math.max(0, essence - (s.raidStartEssence || 0));
        const soulshardsGained = Math.max(0, soulshards - (s.raidStartShards || 0));
        const coreDamage = Math.max(0, (s.raidStartCoreHp || CORE_MAX_HP) - coreHp);
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
      const startingParty = generateHeroParty(0);
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
        artifacts: [],
        shadyStock,
        coreHp: CORE_MAX_HP,
        coreShield: 0,
        heroes: [],
        nextHeroId: 1,
        invMonsters: initMonsterInventory(0, 2, 3, 1),
        raidActive: false,
        raidRemaining: 0,
        turnsSurvived: 0,
        raidStartTurn: 0,
        raidStartEssence: 0,
        raidStartShards: 30,
        raidStartCoreHp: CORE_MAX_HP,
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
        councilSession: null,
        councilQuest: null,
        nextRaidType: null,
        pendingPunitiveRaid: false,
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
      let ns = { ...s, council, nextRaidType, pendingPunitiveRaid: false, councilSession };
      ns = addLog(ns, "You attended the Council.");
      if (council.roster?.length) {
        const names = council.roster.map((m) => m.name).join(", ");
        ns = addLog(ns, `Council attendees: ${names}.`);
      }
      if (s.phase === "battle") {
        const party = generateHeroParty(s.turnsSurvived, nextRaidType);
        let scoutQueue = [];
        const mirrorTier = maxUtilityTier(s.grid, "scout-mirror");
        if (mirrorTier > 0) {
          const revealCount = Math.min(party.length, 2 + (mirrorTier - 1));
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
      let ns = { ...s, council, nextRaidType, pendingPunitiveRaid: declinedStreak >= 2, councilSession };
      ns = addLog(ns, "You declined the Council.");
      if (declinedStreak >= 2) {
        ns = addLog(ns, "The Council prepares a punitive raid.");
      }
      if (s.phase === "battle") {
        const party = generateHeroParty(s.turnsSurvived, nextRaidType);
        let scoutQueue = [];
        const mirrorTier = maxUtilityTier(s.grid, "scout-mirror");
        if (mirrorTier > 0) {
          const revealCount = Math.min(party.length, 2 + (mirrorTier - 1));
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
      ns.currency = currency;
      ns.councilSession = {
        ...s.councilSession,
        offers: (s.councilSession.offers || []).filter((o) => o.id !== offerId),
      };
      return addLog(ns, `Council boon received: ${offer.title}.`);
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
      return addLog({ ...s, councilQuest, councilSession }, `Council quest accepted: ${quest.title}.`);
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
      const stars = Math.min(6, Math.max(safeEntityStars(first), safeEntityStars(second)) + 1);
      const passiveKeys = Array.from(new Set([first.passiveKey, second.passiveKey])).filter(Boolean);
      const passiveNames = passiveKeys.map((k) => MONSTER_PASSIVE_MAP[k]?.name || "Savage");
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
        passive: passiveNames.join(" + "),
        stats: { maxHp, atk, def },
        affinity: null,
        evoPoints: 0,
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
  function traderPrice(monster) {
    const stars = safeEntityStars(monster);
    const baseCost = MONSTERS[monster.key]?.cost || 20;
    const dayCost = scaleByDay(baseCost, state.day, 0.05, 3.0);
    return Math.round(dayCost * (1 + (stars - 1) * 0.25));
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
      const price = traderPrice(target);
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

  function tileClass(t, x, y) {
    const sel = state.selected.x === x && state.selected.y === y ? " selected" : "";
    if (t.entrance) return "tile entrance" + sel;
    if (t.core) return "tile core" + sel;
    if (t.room === "trap") return "tile trap" + sel;
    if (t.room === "monster") return "tile monster" + sel;
    if (t.room === "utility") return "tile utility" + sel;
    return "tile" + sel;
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
      const stars = Math.max(1, tile.trapStars || 1);
      const scaled = scaleStat(base, stars + Math.max(0, tier - 1));
      return `${trap.desc} Tier ${tier} (stars ${stars}). Current dmg ${scaled} (base ${base}).`;
    }
    if (tile.room === "monster") {
      const tier = tile.roomTier || 1;
      const cap = monsterRoomCap(tier);
      if (tile.roomType === "training-den") {
        return `Tier ${tier}: Monsters placed here gain +${1 + (tier - 1)} ATK permanently. Cap ${cap}.`;
      }
      if (tile.roomType === "thick-hide") {
        return `Tier ${tier}: Monsters placed here gain +${3 + (tier - 1) * 2} Max HP permanently. Cap ${cap}.`;
      }
      return `${MONSTER_ROOM_MAP[tile.roomType]?.desc || "Monster Room"} Cap ${cap}.`;
    }
    if (tile.room === "utility") {
      const tier = tile.roomTier || 1;
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
    if (!monster) return [];
    if (Array.isArray(monster.passiveKeys) && monster.passiveKeys.length > 0) return monster.passiveKeys;
    if (monster.passiveKey) return [monster.passiveKey];
    const byName = MONSTER_PASSIVE_RULES.find((p) => p.name === monster.passive);
    return byName ? [byName.key] : [];
  }

  function monsterHasPassive(monster, key) {
    return monsterPassiveKeys(monster).includes(key);
  }

  function roomHasPassive(room, key) {
    return room.monsters.some((m) => monsterHasPassive(m, key));
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

  const invPreview = state.invMonsters.slice(0, 3);

  const checklist = {
    entrancePlaced: !!entrance,
    corePlaced: !!core,
    validPath: validation.ok,
  };

  const canStartRaid = !locked && isBattlePhase && !state.raidActive && validation.ok;
  const canEndTurn = !locked && isBattlePhase && (state.raidActive || state.heroes.length > 0);

  return (
    <div className="app">
      <header className="topbar">
{/* Mobile Tabs */}
<div className="tabBar">
  <button
    className={`tabBtn ${activeTab === "dungeon" ? "active" : ""}`}
    onClick={() => setActiveTab("dungeon")}
  >
    Dungeon
  </button>
  <button
    className={`tabBtn ${activeTab === "toolbox" ? "active" : ""}`}
    onClick={() => setActiveTab("toolbox")}
  >
    Toolbox
  </button>
          <button
            className={`tabBtn ${activeTab === "inventory" ? "active" : ""}`}
            onClick={() => setActiveTab("inventory")}
          >
            Inventory
          </button>
  <button
    className={`tabBtn ${activeTab === "evolution" ? "active" : ""}`}
    onClick={() => setActiveTab("evolution")}
  >
    Evolution
  </button>
  <button
    className={`tabBtn ${activeTab === "glossary" ? "active" : ""}`}
    onClick={() => setActiveTab("glossary")}
  >
    Glossary
  </button>
  <button
            className={`tabBtn ${activeTab === "log" ? "active" : ""}`}
            onClick={() => setActiveTab("log")}
          >
            Log
  </button>
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
            Core HP: {Math.max(0, state.coreHp)} / {CORE_MAX_HP}
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
            onClick={() => setSidePanel("log")}
          >
            Log
          </button>
          <button
            className={`btn toggle ${sidePanel === "inventory" ? "active" : ""}`}
            onClick={() => setSidePanel("inventory")}
          >
            Inventory
          </button>
          <button
            className={`btn toggle ${sidePanel === "evolution" ? "active" : ""}`}
            onClick={() => setSidePanel("evolution")}
          >
            Evolution
          </button>
          <button
            className={`btn toggle ${sidePanel === "glossary" ? "active" : ""}`}
            onClick={() => setSidePanel("glossary")}
          >
            Glossary
          </button>
          {state.councilSession && state.councilSession.day === state.day && (
            <button
              className={`btn toggle ${sidePanel === "council" ? "active" : ""}`}
              onClick={() => setSidePanel("council")}
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
                    <div className="muted">Personality: {focusedCouncilMember.personality}</div>
                    <div className="muted">Current Deal: {focusedCouncilMember.deal}</div>
                    <div className="muted">
                      Rivalries:{" "}
                      {focusedCouncilMember.rivalries
                        .map((r) => COUNCIL_MEMBERS.find((m) => m.key === r)?.name || r)
                        .join(", ")}
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
                        <div className="entityMeta">
                          {o.desc} ({o.type === "monster" ? "Recruit" : `+${o.amount}`})
                        </div>
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
                    {tileLabel(x, y, t)}
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
                        <div className="muted">{m.role}</div>
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
                <div>{selectedTile.room === "monster" ? monsterRoomCap(selectedTile.roomTier || 1) : "n/a"}</div>
                <div>Room Effect</div>
                <div>{roomTypeDesc(selectedTile) || "n/a"}</div>
                <div>Trap Armed</div>
                <div>{selectedTile.room === "trap" ? (selectedTile.trap ? "YES" : "no") : "n/a"}</div>
                <div>Trap Grade</div>
                <div>{selectedTile.room === "trap" ? formatStars(selectedTile.trapStars || 1) : "n/a"}</div>
                <div>Trap Broken</div>
                <div>{selectedTile.room === "trap" ? (selectedTile.trapBroken ? "YES" : "no") : "n/a"}</div>
                <div>Heroes Here</div>
                <div>
                  {selectedHeroes.length ? (
                    <div className="entityList">
                      {selectedHeroes.map((h) => (
                        <div className="entityItem" key={h.id}>
                          <div className="entityName">
                            {h.name} (#{h.id})
                          </div>
                          <div className="entityMeta">
                            {safeEntityLabel(h.race, "Unknown")} {safeEntityLabel(h.class, "Hero")} | {formatStars(safeEntityStars(h))} | {safeEntityLabel(h.passive, "None")}
                          </div>
                          <div className="entityStats">
                            HP {h.hp}/{safeEntityMaxHp(h)} | ATK {h.atk} | DEF {h.def || 0} | SHD {h.shd || 0} | SPD {h.spd || 0}
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

                <div className="muted">Up to {monsterRoomCap(1)} monsters inside.</div>
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
                  disabled={locked || state.movePayload || !isBuildPhase || selectedTile.room !== "trap" || selectedTile.trapBroken}
                >
                  {selectedTile.room === "trap" && selectedTile.trap ? "Disarm Trap" : "Arm Trap"}
                </button>
                <div className="muted">Trap triggers once on hero entry.</div>
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
                <div className="muted">Ends build phase and generates the invading party.</div>
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
                          {safeEntityLabel(h.race, "Unknown")} {safeEntityLabel(h.class, "Hero")} | {formatStars(safeEntityStars(h))}
                        </div>
                        <div className="entityStats">
                          HP {h.hp}/{safeEntityMaxHp(h)} | ATK {h.atk} | DEF {h.def || 0} | SHD {h.shd || 0} | SPD {h.spd || 0}
                        </div>
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
                        {safeEntityLabel(h.race, "Unknown")} {safeEntityLabel(h.class, "Hero")} | {formatStars(safeEntityStars(h))}
                      </div>
                      <div className="entityStats">
                        HP {h.hp}/{safeEntityMaxHp(h)} | ATK {h.atk}
                      </div>
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
                      <div className="row">
                        <button
                          className="btn"
                          onClick={() => startEvolution({ type: "inv", index: idx })}
                          disabled={!isBuildPhase || ((m.evoPoints || 0) < 1 && state.currency.evolution < 1)}
                        >
                          Evolve (1 Evolution)
                        </button>
                        <div className="muted">Tier {m.evolution || 0}</div>
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
                              {opt.name} ({opt.passive})
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
                const allowGlobal = state.currency.evolution > 0;
                state.invMonsters.forEach((m, idx) => {
                  if ((m.evoPoints || 0) > 0 || allowGlobal) {
                    items.push({ source: { type: "inv", index: idx }, monster: m, label: "Inventory" });
                  }
                });
                state.grid.forEach((row, y) => {
                  row.forEach((t, x) => {
                    if (t.room === "monster" && t.monsters.length) {
                      t.monsters.forEach((m, idx) => {
                        if ((m.evoPoints || 0) > 0 || allowGlobal) {
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
                  return <div className="entityEmpty">No monsters with Evolution points yet.</div>;
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
                        <div className="row">
                          <button
                            className="btn"
                            onClick={() => startEvolution(item.source)}
                            disabled={!isBuildPhase || ((item.monster.evoPoints || 0) < 1 && state.currency.evolution < 1)}
                          >
                            Evolve (1 Evolution)
                          </button>
                          <div className="muted">Tier {item.monster.evolution || 0}</div>
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
                                  {opt.name} ({opt.passive})
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
                            <div className="entityMeta">
                              {o.desc} ({o.type === "monster" ? "Recruit" : `+${o.amount}`})
                            </div>
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
