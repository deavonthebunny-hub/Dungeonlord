import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import {
  COUNCIL_FAVOR_BANDS,
  COUNCIL_RAID_FACTIONS,
  COUNCIL_SPONSOR_CONTENT,
  DOCTRINE_RULES,
  FLESH_MARKET_UNIQUE_ARTIFACTS,
  FLESH_MARKET_UNIQUE_MONSTERS,
  FUSION_ARCHETYPE_RULES,
  HERO_ARCHETYPE_RULES,
  RAID_DIRECTIVES,
  RAID_TYPE_META,
  MONSTER_ROOMS,
  STANDARD_ARTIFACTS,
  STANDARD_MONSTERS,
  STATUS_RULES,
  TRAP_TYPES,
  UTILITY_ROOMS,
  validateGameContent,
} from "./gameContent";

const W = 8;
const H = 8;

const MAX_ROOMS_BASE = 4;
const ROOMS_PER_LEVEL = 2;
const MAX_DUNGEON_LEVEL = 10;

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

function clampDungeonLevel(level = 1) {
  return clamp(Math.round(level || 1), 1, MAX_DUNGEON_LEVEL);
}

const MONSTERS = Object.fromEntries(STANDARD_MONSTERS.map((monster) => [monster.key, { ...monster }]));
const MONSTER_KEYS = STANDARD_MONSTERS.map((monster) => monster.key);
const UNIQUE_MONSTER_MAP = Object.fromEntries(FLESH_MARKET_UNIQUE_MONSTERS.map((monster) => [monster.key, monster]));
const UNIQUE_ARTIFACT_MAP = Object.fromEntries(FLESH_MARKET_UNIQUE_ARTIFACTS.map((artifact) => [artifact.key, artifact]));
const STANDARD_ARTIFACT_MAP = Object.fromEntries(STANDARD_ARTIFACTS.map((artifact) => [artifact.key, artifact]));
const KNOW_MONSTER_KEY = (key) => !!(MONSTERS[key] || UNIQUE_MONSTER_MAP[key]);
const KNOW_MONSTER_ENTITY = (monster) => !!monster && (!!monster.isFused || KNOW_MONSTER_KEY(monster.key));
const STATUS_RULE_LIST = Object.values(STATUS_RULES);
const NEW_RECRUIT_MONSTER_KEYS = new Set([
  "quasit",
  "darkling",
  "carrionCrawler",
  "ghast",
  "hookHorror",
  "owlbear",
  "medusa",
  "fleshGolem",
  "lamia",
  "hydra",
  "deathKnight",
  "abolethSpawn",
]);

function cloneArtifactEntry(artifact) {
  if (!artifact) return artifact;
  return {
    ...artifact,
    cost: artifact.cost ? { ...artifact.cost } : artifact.cost,
    tags: Array.isArray(artifact.tags) ? [...artifact.tags] : artifact.tags,
    mods: artifact.mods ? { ...artifact.mods } : artifact.mods,
  };
}

function hydrateArtifactDefinition(artifact) {
  if (!artifact?.key) return cloneArtifactEntry(artifact);
  const standard = STANDARD_ARTIFACT_MAP[artifact.key];
  if (standard) {
    return {
      ...cloneArtifactEntry(standard),
      ...cloneArtifactEntry(artifact),
      cost: { ...(standard.cost || {}), ...(artifact.cost || {}) },
      tags: Array.isArray(artifact.tags) && artifact.tags.length ? [...artifact.tags] : [...(standard.tags || [])],
      maxCopies: Number.isFinite(artifact.maxCopies) ? artifact.maxCopies : standard.maxCopies,
      unlockDay: Number.isFinite(artifact.unlockDay) ? artifact.unlockDay : standard.unlockDay,
      mods: { ...(standard.mods || {}), ...(artifact.mods || {}) },
    };
  }
  const unique = UNIQUE_ARTIFACT_MAP[artifact.key];
  if (unique) {
    return {
      ...cloneArtifactEntry(unique),
      ...cloneArtifactEntry(artifact),
      isUnique: artifact.isUnique ?? true,
      cost: artifact.cost ? { ...artifact.cost } : { currency: "darkcrystals", amount: unique.costByEra?.[0] || 0 },
      tags: Array.isArray(artifact.tags) && artifact.tags.length ? [...artifact.tags] : ["unique", "flesh-market"],
      maxCopies: Number.isFinite(artifact.maxCopies) ? artifact.maxCopies : 1,
      unlockDay: Number.isFinite(artifact.unlockDay) ? artifact.unlockDay : 0,
      mods: { ...(unique.mods || {}), ...(artifact.mods || {}) },
    };
  }
  return cloneArtifactEntry(artifact);
}

function artifactCopyCap(artifact) {
  return Math.max(1, hydrateArtifactDefinition(artifact)?.maxCopies || 1);
}

function artifactTagsForDisplay(artifact) {
  const hydrated = hydrateArtifactDefinition(artifact);
  return Array.isArray(hydrated?.tags) ? hydrated.tags : [];
}

function countOwnedArtifacts(artifacts = []) {
  return (artifacts || []).reduce((acc, artifact) => {
    if (!artifact?.key) return acc;
    acc[artifact.key] = (acc[artifact.key] || 0) + 1;
    return acc;
  }, {});
}

function normalizeArtifactList(artifacts = []) {
  return Array.isArray(artifacts) ? artifacts.filter(Boolean).map((artifact) => hydrateArtifactDefinition(artifact)) : [];
}

function normalizeArtifactStock(stock = [], day = 1, ownedArtifacts = []) {
  if (Array.isArray(stock)) {
    return stock
      .filter((artifact) => STANDARD_ARTIFACT_MAP[artifact?.key])
      .map((artifact) => hydrateArtifactDefinition(artifact));
  }
  return generateArtifactStock(day, ownedArtifacts);
}

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

const COUNCIL_ART_BASE = `${import.meta.env.BASE_URL}assets/council/`;
const COUNCIL_CHAMBER_ART = {
  backdrop: `${COUNCIL_ART_BASE}council-hall-bg.png`,
  sigil: `${COUNCIL_ART_BASE}council-center-sigil.png`,
  absentSilhouette: `${COUNCIL_ART_BASE}absent-silhouette.png`,
  scrollTexture: `${COUNCIL_ART_BASE}dark-decree-scroll.png`,
};
const COUNCIL_MEMBER_CRESTS = {
  malachar: `${COUNCIL_ART_BASE}malachar-crest.png`,
  "crimson-twins": `${COUNCIL_ART_BASE}crimson-twins-crest.png`,
  zephyra: `${COUNCIL_ART_BASE}zephyra-crest.png`,
  grimjaw: `${COUNCIL_ART_BASE}grimjaw-crest.png`,
  blackthorn: `${COUNCIL_ART_BASE}blackthorn-crest.png`,
  lyralei: `${COUNCIL_ART_BASE}lyralei-crest.png`,
  maltheron: `${COUNCIL_ART_BASE}maltheron-crest.png`,
  vexira: `${COUNCIL_ART_BASE}vexira-crest.png`,
  tharos: `${COUNCIL_ART_BASE}tharos-crest.png`,
  xaldros: `${COUNCIL_ART_BASE}xaldros-crest.png`,
  zurkhan: `${COUNCIL_ART_BASE}zurkhan-crest.png`,
  nihaza: `${COUNCIL_ART_BASE}nihaza-crest.png`,
};
const COUNCIL_MEMBER_MAP = Object.fromEntries(COUNCIL_MEMBERS.map((member) => [member.key, member]));
const COUNCIL_FAVOR_RULES = [
  "Attend Council: +1 with each attendee.",
  "Decline Council: -1 with each attendee.",
  "Accept a boon: +2 with that sponsor.",
  "Accept a quest: +1 with that sponsor.",
  "Complete a Council quest: +2 with that sponsor.",
  "Fail or let a Council quest expire: -2 with that sponsor.",
  "Each Council drifts all favor 1 step toward neutral.",
  "Rivalries pull enemies 1 point in the opposite direction.",
];

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
  "butchers-shrine": "BT",
  "aegis-lantern": "AL",
  "scent-beacon": "SB",
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
  "carnage-pit": "CP",
  "bulwark-hall": "BH",
  "pack-blind": "PB",
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
  "gore-channel": "GC",
  "warding-sigil": "WS",
  "murder-holes": "MH",
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
  "gore-channel": { unarmed: "GC", armed: "GC" },
  "warding-sigil": { unarmed: "WS", armed: "WS" },
  "murder-holes": { unarmed: "MH", armed: "MH" },
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
  "butchers-shrine": "BT",
  "aegis-lantern": "AL",
  "scent-beacon": "SB",
};

const TILE_ART_BASE = `${import.meta.env.BASE_URL}assets/tiles/path/`;
const TILE_ART_SOURCES = {
  isolated: `${TILE_ART_BASE}isolated.png`,
  "dead-end": `${TILE_ART_BASE}dead-end.png`,
  straight: `${TILE_ART_BASE}straight.png`,
  corner: `${TILE_ART_BASE}corner.png`,
  tee: `${TILE_ART_BASE}tee.png`,
  cross: `${TILE_ART_BASE}cross.png`,
};
const SUPPORT_TILE_ART_BASE = `${import.meta.env.BASE_URL}assets/tiles/support/`;
const SUPPORT_TILE_ART_SOURCES = {
  base: `${SUPPORT_TILE_ART_BASE}sanctum-base.png`,
  centerpiece: {
    "soul-altar": `${SUPPORT_TILE_ART_BASE}soul-altar.png`,
    "siphon-pylon": `${SUPPORT_TILE_ART_BASE}siphon-pylon.png`,
    "reinforced-keystone": `${SUPPORT_TILE_ART_BASE}reinforced-keystone.png`,
    "blood-sigil": `${SUPPORT_TILE_ART_BASE}blood-sigil.png`,
    "war-drum": `${SUPPORT_TILE_ART_BASE}war-drum.png`,
    "haste-glyph": `${SUPPORT_TILE_ART_BASE}haste-glyph.png`,
    "fear-idol": `${SUPPORT_TILE_ART_BASE}fear-idol.png`,
    "ward-lantern": `${SUPPORT_TILE_ART_BASE}ward-lantern.png`,
    "seal-silence": `${SUPPORT_TILE_ART_BASE}seal-silence.png`,
    "scout-mirror": `${SUPPORT_TILE_ART_BASE}scout-mirror.png`,
    "butchers-shrine": `${SUPPORT_TILE_ART_BASE}butchers-shrine.png`,
    "aegis-lantern": `${SUPPORT_TILE_ART_BASE}aegis-lantern.png`,
    "scent-beacon": `${SUPPORT_TILE_ART_BASE}scent-beacon.png`,
  },
};
const TILE_MARKER_BASE = `${import.meta.env.BASE_URL}assets/tiles/markers/`;
const TILE_CENTER_MARKERS = {
  entrance: `${TILE_MARKER_BASE}entrance-door.png`,
  core: `${TILE_MARKER_BASE}core-crystal.png`,
  ash: `${TILE_MARKER_BASE}ash-breach-rift.png`,
};
const EMPTY_TILE_ART_SRC = `${import.meta.env.BASE_URL}assets/tiles/empty/unexcavated-stone.png`;
const TILE_RADAR_MAX_DOTS = 4;
const TILE_RADAR_SLOTS = {
  monster: [
    { x: 26, y: 28 },
    { x: 20, y: 46 },
    { x: 40, y: 56 },
    { x: 58, y: 34 },
  ],
  hero: [
    { x: 72, y: 30 },
    { x: 78, y: 46 },
    { x: 60, y: 54 },
    { x: 68, y: 66 },
  ],
};

const UTILITY_MAP = Object.fromEntries(UTILITY_ROOMS.map((r) => [r.key, r]));
const MONSTER_ROOM_MAP = Object.fromEntries(MONSTER_ROOMS.map((r) => [r.key, r]));
const TRAP_MAP = Object.fromEntries(TRAP_TYPES.map((r) => [r.key, r]));
const SYNERGY_TAGS = new Set(["Blood", "Ward", "Hunt"]);

function roomDefinitionForTile(tile) {
  if (!tile?.room) return null;
  if (tile.room === "trap") return TRAP_MAP[tile.trapType] || null;
  if (tile.room === "monster") return MONSTER_ROOM_MAP[tile.roomType] || null;
  if (tile.room === "utility") return UTILITY_MAP[tile.roomType] || null;
  return null;
}

function radarNoise(seed) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function roomSynergyTag(tile) {
  const tag = roomDefinitionForTile(tile)?.synergyTag || null;
  return SYNERGY_TAGS.has(tag) ? tag : null;
}

function isLinkedRoom(grid, x, y) {
  const tile = grid?.[y]?.[x];
  const tag = roomSynergyTag(tile);
  if (!tag) return false;
  return neighbors(x, y).some((pos) => roomSynergyTag(grid?.[pos.y]?.[pos.x]) === tag);
}

function roomLinkInfoAt(grid, x, y) {
  const tile = grid?.[y]?.[x];
  const def = roomDefinitionForTile(tile);
  const tag = roomSynergyTag(tile);
  return {
    tag,
    linked: tag ? isLinkedRoom(grid, x, y) : false,
    baseDesc: def?.baseDesc || "",
    linkDesc: def?.linkDesc || "",
  };
}

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

function availableStandardMonsterDefs(day = 1, poolKeys = null) {
  const keys = Array.isArray(poolKeys) && poolKeys.length ? poolKeys : MONSTER_KEYS;
  const defs = keys.map((key) => MONSTERS[key]).filter(Boolean);
  const unlocked = defs.filter((monster) => (monster.unlockDay || 1) <= day);
  return unlocked.length ? unlocked : defs;
}

function pickWeightedMonsterDef(day = 1, poolKeys = null) {
  const defs = availableStandardMonsterDefs(day, poolKeys);
  if (!defs.length) return null;
  const totalWeight = defs.reduce((sum, monster) => sum + Math.max(1, monster.recruitWeight || 1), 0);
  let roll = Math.random() * totalWeight;
  for (const monster of defs) {
    roll -= Math.max(1, monster.recruitWeight || 1);
    if (roll <= 0) return monster;
  }
  return defs[defs.length - 1];
}

function pickRewardMonsterEntry(day = 1, poolKeys = null) {
  const uniqueEntries = (Array.isArray(poolKeys) ? poolKeys : [])
    .map((key) => UNIQUE_MONSTER_MAP[key])
    .filter(Boolean)
    .map((monster) => ({ type: "unique", weight: 1, monster }));
  const strictStandardDefs = (Array.isArray(poolKeys) && poolKeys.length ? poolKeys : MONSTER_KEYS)
    .map((key) => MONSTERS[key])
    .filter((monster) => monster && (monster.unlockDay || 1) <= day);
  const standardEntries = (strictStandardDefs.length ? strictStandardDefs : availableStandardMonsterDefs(day)).map((monster) => ({
    type: "standard",
    weight: Math.max(1, monster.recruitWeight || 1),
    monster,
  }));
  const entries = [...standardEntries, ...uniqueEntries];
  if (!entries.length) {
    const fallback = pickWeightedMonsterDef(day);
    return fallback ? { type: "standard", monster: fallback } : null;
  }
  const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) return entry;
  }
  return entries[entries.length - 1];
}

function nextCouncilDay(day) {
  const d = Math.max(1, day || 1);
  return Math.ceil(d / COUNCIL_INTERVAL) * COUNCIL_INTERVAL;
}

function nextCouncilDayAfter(day) {
  return nextCouncilDay(Math.max(1, day || 1) + 1);
}

function createEmptyAshTrial() {
  return {
    active: false,
    difficulty: null,
    breaches: [],
    raidsCompleted: 0,
    requiredRaids: 0,
    expiresDay: 0,
  };
}

function normalizeAshTrial(raw, day = 1) {
  if (!raw || !raw.active || !Array.isArray(raw.breaches)) return createEmptyAshTrial();
  const breaches = raw.breaches
    .filter((breach) => Number.isFinite(breach?.x) && Number.isFinite(breach?.y))
    .map((breach) => ({
      x: clamp(breach.x, 0, W - 1),
      y: clamp(breach.y, 0, H - 1),
      openedDay: Number.isFinite(breach.openedDay) ? breach.openedDay : day,
    }));
  const expiresDay = Number.isFinite(raw.expiresDay) ? raw.expiresDay : nextCouncilDayAfter(day);
  const requiredRaids = Math.max(1, raw.requiredRaids || 2);
  if (!breaches.length || expiresDay <= day) return createEmptyAshTrial();
  return {
    active: true,
    difficulty: raw.difficulty || "standard",
    breaches,
    raidsCompleted: clamp(raw.raidsCompleted || 0, 0, requiredRaids),
    requiredRaids,
    expiresDay,
  };
}

function isTimedBlessingActive(untilDay, day) {
  return Number.isFinite(untilDay) && untilDay > day;
}

function isAshTrialActive(ashTrial) {
  return !!(ashTrial?.active && Array.isArray(ashTrial.breaches) && ashTrial.breaches.length > 0);
}

function isAshBreachAt(ashTrial, x, y) {
  if (!isAshTrialActive(ashTrial)) return false;
  return ashTrial.breaches.some((breach) => breach.x === x && breach.y === y);
}

function formatGridPos(pos) {
  return `(${pos.x + 1},${pos.y + 1})`;
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

const COUNCIL_QUEST_COUNTER_KEYS = [
  "zeroCoreDamageRaidCount",
  "survivedRaidCount",
  "highCoreRaidCount",
  "trapKillCount",
  "trapOrPoisonKillCount",
  "monsterRoomKillCount",
  "detourCount",
  "revealedInvaderCount",
  "highestStarLeaderKillCount",
  "soulshardsEarnedSinceCouncil",
  "evolutionSpentSinceCouncil",
  "monsterEvolutionCount",
  "monsterSacrificeCount",
  "darkcrystalsEarnedSinceCouncil",
];

function createEmptyCouncilQuestCounters() {
  return Object.fromEntries(COUNCIL_QUEST_COUNTER_KEYS.map((key) => [key, 0]));
}

function councilEraIndex(day = 1) {
  if (day <= 20) return 0;
  if (day <= 50) return 1;
  return 2;
}

function councilBandValue(bands, day, fallback = 0) {
  if (!Array.isArray(bands) || bands.length === 0) return fallback;
  const idx = Math.max(0, Math.min(councilEraIndex(day), bands.length - 1));
  return bands[idx] ?? fallback;
}

function clampCouncilFavor(score = 0) {
  return clamp(Math.round(score || 0), -6, 6);
}

function normalizeCouncilFavorMap(favorMap = {}) {
  const next = {};
  for (const member of COUNCIL_MEMBERS) {
    const value = favorMap?.[member.key];
    if (!Number.isFinite(value)) continue;
    const clamped = clampCouncilFavor(value);
    if (clamped !== 0) next[member.key] = clamped;
  }
  return next;
}

function decayCouncilFavorTowardNeutral(favorMap = {}) {
  const next = {};
  let changed = false;
  for (const member of COUNCIL_MEMBERS) {
    const current = clampCouncilFavor(favorMap?.[member.key] || 0);
    const decayed = current > 0 ? current - 1 : current < 0 ? current + 1 : 0;
    if (decayed !== current) changed = true;
    if (decayed !== 0) next[member.key] = decayed;
  }
  return { favorMap: next, changed };
}

function getCouncilFavorInfo(score = 0) {
  const clamped = clampCouncilFavor(score);
  const band =
    COUNCIL_FAVOR_BANDS.find((entry) => clamped >= entry.min && clamped <= entry.max) ||
    COUNCIL_FAVOR_BANDS.find((entry) => entry.key === "neutral") ||
    COUNCIL_FAVOR_BANDS[0];
  return {
    ...band,
    score: clamped,
  };
}

function councilFavorBadgeTone(favorInfo) {
  switch (favorInfo?.key) {
    case "hostile":
      return "favorHostile";
    case "wary":
      return "favorWary";
    case "favored":
      return "favorFavored";
    case "allied":
      return "favorAllied";
    default:
      return "favorNeutral";
  }
}

function formatCouncilFavorLabel(scoreOrInfo) {
  const info = typeof scoreOrInfo === "object" && scoreOrInfo ? scoreOrInfo : getCouncilFavorInfo(scoreOrInfo);
  return `Favor ${info.score >= 0 ? `+${info.score}` : info.score} • ${info.name}`;
}

function resolveCouncilSponsorAccess(memberKey, score, day, baseContent = {}) {
  const favorInfo = getCouncilFavorInfo(score);
  const baseLocked = !!baseContent?.locked;
  const baseLockedReason = baseContent?.lockedReason || "";
  const hostileReason = "Hostile toward your rule.";
  const waryReason = "Wary. Earn more favor to receive contracts.";
  const hardQuestReason = "Favored standing required for hard contracts.";
  if (baseLocked) {
    return {
      favorInfo,
      rewardBandShift: 0,
      available: false,
      lockedReason: baseLockedReason,
      boon: { available: false, lockedReason: baseLockedReason },
      quests: {
        standard: { available: false, lockedReason: baseLockedReason },
        hard: { available: false, lockedReason: baseLockedReason },
      },
    };
  }
  if (favorInfo.key === "hostile") {
    return {
      favorInfo,
      rewardBandShift: 0,
      available: false,
      lockedReason: hostileReason,
      boon: { available: false, lockedReason: hostileReason },
      quests: {
        standard: { available: false, lockedReason: hostileReason },
        hard: { available: false, lockedReason: hostileReason },
      },
    };
  }
  if (favorInfo.key === "wary") {
    return {
      favorInfo,
      rewardBandShift: 0,
      available: true,
      lockedReason: "",
      boon: { available: true, lockedReason: "" },
      quests: {
        standard: { available: false, lockedReason: waryReason },
        hard: { available: false, lockedReason: waryReason },
      },
    };
  }
  if (favorInfo.key === "neutral") {
    return {
      favorInfo,
      rewardBandShift: 0,
      available: true,
      lockedReason: "",
      boon: { available: true, lockedReason: "" },
      quests: {
        standard: { available: true, lockedReason: "" },
        hard: { available: false, lockedReason: hardQuestReason },
      },
    };
  }
  const allied = favorInfo.key === "allied";
  return {
    favorInfo,
    rewardBandShift: allied ? 1 : 0,
    available: true,
    lockedReason: "",
    boon: { available: true, lockedReason: "" },
    quests: {
      standard: { available: true, lockedReason: "" },
      hard: { available: true, lockedReason: "" },
    },
  };
}

function buildCouncilReward(reward, day, rewardBandShift = 0) {
  if (!reward) return null;
  if (Number.isFinite(reward.amount)) return { ...reward };
  if (Array.isArray(reward.bands) && reward.bands.length > 0) {
    const baseIdx = Math.max(0, Math.min(councilEraIndex(day), reward.bands.length - 1));
    const shiftedIdx = Math.max(0, Math.min(baseIdx + rewardBandShift, reward.bands.length - 1));
    return {
      ...reward,
      amount: reward.bands[shiftedIdx] ?? reward.bands[baseIdx] ?? 0,
    };
  }
  return {
    ...reward,
    amount: councilBandValue(reward.bands, day, 0),
  };
}

function councilRewardLabel(reward) {
  if (!reward) return "No direct reward";
  if (reward.type === "monster") return `${reward.count || 1} themed monster`;
  if (reward.type === "ash-tribute") return `+${reward.amount || 3} Essence on hero death until next Council`;
  if (reward.type === "monster-room-cap-bonus") return `Monster rooms +${reward.amount || 1} capacity until next Council`;
  if (reward.type === "room-cap-bonus") return `+${reward.amount || 1} permanent room cap`;
  return `+${reward.amount} ${reward.type}`;
}

function buildCouncilBoon(member, day, sponsorAccess) {
  const content = COUNCIL_SPONSOR_CONTENT[member.key] || null;
  const boon = content?.boon || null;
  if (!boon) return null;
  return {
    ...boon,
    sponsorKey: member.key,
    sponsorName: member.name,
    reward: buildCouncilReward(boon.reward, day, sponsorAccess?.rewardBandShift || 0),
    available: !!sponsorAccess?.boon?.available,
    lockedReason: sponsorAccess?.boon?.lockedReason || "",
  };
}

function buildCouncilQuestVariant(member, day, difficulty, sponsorAccess) {
  const content = COUNCIL_SPONSOR_CONTENT[member.key] || null;
  const quest = content?.quests?.[difficulty] || null;
  if (!quest) return null;
  return {
    ...quest,
    sponsorKey: member.key,
    sponsorName: member.name,
    difficulty,
    goal: councilBandValue(quest.goalBands, day, 0),
    progress: 0,
    reward: buildCouncilReward(quest.reward, day, sponsorAccess?.rewardBandShift || 0),
    available: !!sponsorAccess?.quests?.[difficulty]?.available,
    lockedReason: sponsorAccess?.quests?.[difficulty]?.lockedReason || "",
  };
}

function buildCouncilSponsorEntry(member, day, favorMap = {}) {
  const content = COUNCIL_SPONSOR_CONTENT[member.key] || {};
  const sponsorAccess = resolveCouncilSponsorAccess(member.key, favorMap?.[member.key] || 0, day, content);
  return {
    key: member.key,
    available: sponsorAccess.available,
    lockedReason: sponsorAccess.lockedReason,
    favorInfo: sponsorAccess.favorInfo,
    boon: buildCouncilBoon(member, day, sponsorAccess),
    quests: {
      standard: buildCouncilQuestVariant(member, day, "standard", sponsorAccess),
      hard: buildCouncilQuestVariant(member, day, "hard", sponsorAccess),
    },
  };
}

function buildCouncilSession(roster, day, favorMap = {}) {
  const speakers = pickUnique(roster, Math.min(4, roster.length));
  const dialogue = speakers.map((s) => pick(COUNCIL_DIALOGUE).replace("{name}", s.name));
  if (roster.length >= 2) {
    const a = roster[0];
    const b = roster[1];
    dialogue.push(`${a.name} and ${b.name} clash over strategy, but no blood is spilled... this time.`);
  }
  const rumors = pickUnique(COUNCIL_RUMORS, 2);
  const sponsors = roster.map((member) => buildCouncilSponsorEntry(member, day, favorMap));
  return {
    day,
    status: "pending",
    dialogue,
    rumors,
    sponsors,
    courtedSponsorKey: null,
    acceptedCouncilBoonKey: null,
    acceptedCouncilQuestId: null,
    acceptedCouncilQuestDifficulty: null,
  };
}

function rebuildCouncilSessionWithFavor(session, roster, day, favorMap = {}) {
  if (!session || !Array.isArray(roster) || roster.length === 0) return session;
  const rebuilt = buildCouncilSession(roster, day, favorMap);
  return {
    ...rebuilt,
    dialogue: Array.isArray(session.dialogue) && session.dialogue.length ? session.dialogue : rebuilt.dialogue,
    rumors: Array.isArray(session.rumors) && session.rumors.length ? session.rumors : rebuilt.rumors,
    status: session.status || rebuilt.status,
    courtedSponsorKey: session.courtedSponsorKey || null,
    acceptedCouncilBoonKey: session.acceptedCouncilBoonKey || null,
    acceptedCouncilQuestId: session.acceptedCouncilQuestId || null,
    acceptedCouncilQuestDifficulty: session.acceptedCouncilQuestDifficulty || null,
  };
}

function councilQuestProgressValue(stateLike, quest) {
  if (!quest) return 0;
  if (quest.questType === "ash-breach-trial") {
    return Math.max(0, stateLike?.ashTrial?.raidsCompleted || 0);
  }
  return Math.max(0, stateLike?.councilQuestCounters?.[quest.metricKey] || 0);
}

function councilQuestGoalLabel(quest) {
  if (!quest) return "";
  if (quest.questType === "ash-breach-trial") {
    const breaches = Math.max(1, quest.breachCount || 1);
    return `${breaches} Ash Breach${breaches > 1 ? "es" : ""}; survive ${quest.goal || 2} connected raids.`;
  }
  return `Goal: ${quest.goal}`;
}

function councilQuestProgressLabel(stateLike, quest) {
  if (!quest) return "";
  const progress = councilQuestProgressValue(stateLike, quest);
  if (quest.questType === "ash-breach-trial") {
    return `${progress}/${quest.goal || 2} connected raids`;
  }
  return `${progress}/${quest.goal || 0}`;
}

function canAcceptCouncilSponsorAction(session, sponsorKey) {
  if (!session || session.status !== "attended" || !sponsorKey) return false;
  return !session.courtedSponsorKey || session.courtedSponsorKey === sponsorKey;
}

function applyCouncilRewardToState(stateLike, reward, sponsorName = "", day = 1) {
  if (!reward) {
    return { nextState: stateLike, rewardText: sponsorName ? `${sponsorName} offers influence only.` : "No direct reward." };
  }
  let nextState = { ...stateLike };
  const currency = { ...(stateLike.currency || {}) };
  if (reward.type === "essence") {
    currency.essence += reward.amount || 0;
    nextState.currency = currency;
    return { nextState, rewardText: `+${reward.amount || 0} Essence` };
  }
  if (reward.type === "soulshards") {
    currency.soulshards += reward.amount || 0;
    nextState.currency = currency;
    return { nextState, rewardText: `+${reward.amount || 0} Soulshards` };
  }
  if (reward.type === "evolution") {
    currency.evolution += reward.amount || 0;
    nextState.currency = currency;
    return { nextState, rewardText: `+${reward.amount || 0} Evolution` };
  }
  if (reward.type === "dominion") {
    const gain = Math.max(0, reward.amount || 0);
    const nextDominion = Math.min(DOMINION_CAP, currency.dominion + gain);
    const applied = Math.max(0, nextDominion - currency.dominion);
    currency.dominion = nextDominion;
    nextState.currency = currency;
    return { nextState, rewardText: applied > 0 ? `+${applied} Dominion` : "Dominion already at cap" };
  }
  if (reward.type === "darkcrystals") {
    currency.darkcrystals = (currency.darkcrystals || 0) + (reward.amount || 0);
    const counters = {
      ...createEmptyCouncilQuestCounters(),
      ...(stateLike.councilQuestCounters || {}),
    };
    counters.darkcrystalsEarnedSinceCouncil += reward.amount || 0;
    nextState.currency = currency;
    nextState.councilQuestCounters = counters;
    return { nextState, rewardText: `+${reward.amount || 0} Darkcrystals` };
  }
  if (reward.type === "ash-tribute") {
    const untilDay = nextCouncilDayAfter(day);
    nextState.ashTributeUntilDay = untilDay;
    return { nextState, rewardText: `+${reward.amount || 3} Essence on hero death until Day ${untilDay}` };
  }
  if (reward.type === "monster-room-cap-bonus") {
    const untilDay = stateLike?.ashTrial?.expiresDay || nextCouncilDayAfter(day);
    nextState.ashMonsterRoomCapUntilDay = Math.max(stateLike?.ashMonsterRoomCapUntilDay || 0, untilDay);
    return { nextState, rewardText: `Monster rooms gain +${reward.amount || 1} capacity until Day ${untilDay}` };
  }
  if (reward.type === "room-cap-bonus") {
    const gain = Math.max(1, reward.amount || 1);
    nextState.bonusRoomCapPermanent = Math.max(0, stateLike?.bonusRoomCapPermanent || 0) + gain;
    return { nextState, rewardText: `+${gain} permanent room cap` };
  }
  if (reward.type === "monster") {
    const count = Math.max(1, reward.count || 1);
    const pool = Array.isArray(reward.monsterPool) && reward.monsterPool.length ? reward.monsterPool : MONSTER_KEYS;
    const invMonsters = [...(stateLike.invMonsters || [])];
    const addedNames = [];
    const artifactMods = calcArtifactMods(stateLike.artifacts || [], day);
    for (let i = 0; i < count; i += 1) {
      const picked = pickRewardMonsterEntry(day, pool);
      const monster =
        picked?.type === "unique"
          ? buildUniqueMonsterEntity(picked.monster, day, artifactMods)
          : picked?.monster
            ? generateMonster(picked.monster.key, stateLike.turnsSurvived || 0, monsterStarCapForDay(day), day)
            : null;
      if (!monster) continue;
      invMonsters.push(monster);
      addedNames.push(monster.name);
    }
    nextState.invMonsters = invMonsters;
    return {
      nextState,
      rewardText: count === 1 ? `${addedNames[0]} joins your inventory` : `${count} themed monsters join your inventory`,
    };
  }
  return { nextState, rewardText: "Reward granted." };
}

function addLogLines(stateLike, lines = []) {
  let nextState = stateLike;
  for (let idx = lines.length - 1; idx >= 0; idx -= 1) {
    nextState = addLog(nextState, lines[idx]);
  }
  return nextState;
}

function applyCouncilFavorShiftDetailed(favorMap, memberKey, delta, reason = "Council politics") {
  const next = normalizeCouncilFavorMap(favorMap || {});
  const logLines = [];
  if (!memberKey || !delta) return { favorMap: next, logLines };
  const member = COUNCIL_MEMBER_MAP[memberKey];
  const applySingleShift = (targetKey, shift, why) => {
    if (!targetKey || !shift) return;
    const before = clampCouncilFavor(next[targetKey] || 0);
    const after = clampCouncilFavor(before + shift);
    if (after === before) return;
    if (after === 0) delete next[targetKey];
    else next[targetKey] = after;
    const appliedDelta = after - before;
    const targetMember = COUNCIL_MEMBER_MAP[targetKey];
    logLines.push(`Favor: ${targetMember?.name || targetKey} ${appliedDelta >= 0 ? `+${appliedDelta}` : appliedDelta} (${why}).`);
  };
  applySingleShift(memberKey, delta, reason);
  for (const rivalKey of member?.rivalries || []) {
    applySingleShift(rivalKey, -Math.sign(delta), `Rivalry with ${member?.name || memberKey}`);
  }
  return { favorMap: next, logLines };
}

function buildCouncilRaidFromRoster(roster = [], day = 1, favorMap = {}) {
  const sorted = [...roster].sort((a, b) => {
    const aFavor = getCouncilFavorInfo(favorMap[a.key] || 0);
    const bFavor = getCouncilFavorInfo(favorMap[b.key] || 0);
    if (aFavor.score !== bFavor.score) return aFavor.score - bFavor.score;
    const aBandIdx = COUNCIL_FAVOR_BANDS.findIndex((band) => band.key === aFavor.key);
    const bBandIdx = COUNCIL_FAVOR_BANDS.findIndex((band) => band.key === bFavor.key);
    if (aBandIdx !== bBandIdx) return aBandIdx - bBandIdx;
    return a.key.localeCompare(b.key);
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
      directiveKey: faction.defaultDirective || "rush-core",
      archetypeWeights: faction.archetypeWeights || {},
    };
  });
  const primaryDirectiveKey = attackers[0]?.directiveKey || "rush-core";
  const directive = getRaidDirectiveRule(primaryDirectiveKey);
  return {
    day,
    attackers,
    label: `Council Retaliation: ${attackers.map((a) => a.memberName).join(" & ")}`,
    desc: attackers.map((a) => a.raidName).join(" / "),
    modifierText: attackers.map((a) => a.raidModifier).join(" "),
    directiveKey: primaryDirectiveKey,
    directiveLabel: directive.name,
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

function getRaidDirectiveRule(key) {
  return RAID_DIRECTIVES[key] || RAID_DIRECTIVES["rush-core"];
}

function createHeroMemory(memory = {}) {
  const targetTile =
    memory?.targetTile && Number.isFinite(memory.targetTile.x) && Number.isFinite(memory.targetTile.y)
      ? {
          x: memory.targetTile.x,
          y: memory.targetTile.y,
          kind: memory.targetTile.kind || null,
          label: memory.targetTile.label || null,
        }
      : null;
  return {
    danger: memory?.danger || {},
    lastIntent: memory?.lastIntent || null,
    recentTiles: Array.isArray(memory?.recentTiles) ? memory.recentTiles.slice(-6) : [],
    currentObjective: memory?.currentObjective || null,
    objectiveTurnsLeft: Number.isFinite(memory?.objectiveTurnsLeft) ? memory.objectiveTurnsLeft : 0,
    targetTile,
    lastLoopBreak: memory?.lastLoopBreak || null,
  };
}

function createEmptyRaidIntel(directive = "rush-core", leaderId = null) {
  return {
    dangerTiles: {},
    trapHubs: [],
    utilityHubs: [],
    monsterHubs: [],
    directive,
    leaderId: Number.isFinite(leaderId) ? leaderId : null,
  };
}

function normalizeRaidIntel(raidIntel, fallbackDirective = "rush-core", fallbackLeaderId = null) {
  return {
    dangerTiles: raidIntel?.dangerTiles || {},
    trapHubs: Array.isArray(raidIntel?.trapHubs) ? [...new Set(raidIntel.trapHubs.filter(Boolean))] : [],
    utilityHubs: Array.isArray(raidIntel?.utilityHubs) ? [...new Set(raidIntel.utilityHubs.filter(Boolean))] : [],
    monsterHubs: Array.isArray(raidIntel?.monsterHubs) ? [...new Set(raidIntel.monsterHubs.filter(Boolean))] : [],
    directive: raidIntel?.directive || fallbackDirective,
    leaderId: Number.isFinite(raidIntel?.leaderId) ? raidIntel.leaderId : fallbackLeaderId,
  };
}

function mergeRaidIntelKey(list = [], key) {
  if (!key) return list || [];
  if ((list || []).includes(key)) return list || [];
  return [...(list || []), key];
}

function resolveRaidDirectiveKey(raidType = null, councilRaid = null, day = 1) {
  if (raidType === "council") {
    const primaryAttacker = councilRaid?.attackers?.[0];
    if (primaryAttacker?.directiveKey) return primaryAttacker.directiveKey;
    if (primaryAttacker?.key && COUNCIL_RAID_FACTIONS[primaryAttacker.key]?.defaultDirective) {
      return COUNCIL_RAID_FACTIONS[primaryAttacker.key].defaultDirective;
    }
    return "rush-core";
  }
  if (raidType === "elite") {
    return day % 2 === 0 ? "purge-support" : "break-frontline";
  }
  return day % 2 === 0 ? "probe-flanks" : "rush-core";
}

function weightedPick(weightMap = {}, fallbackKey = "zealot") {
  const entries = Object.entries(weightMap).filter(([, weight]) => Number.isFinite(weight) && weight > 0);
  if (!entries.length) return fallbackKey;
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;
  for (const [key, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return key;
  }
  return entries[0][0];
}

function topArchetypesFromWeights(weightMap = {}, count = 2) {
  return Object.entries(weightMap)
    .filter(([, weight]) => Number.isFinite(weight) && weight > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([key]) => getHeroArchetypeRule(key).name);
}

function raidDirectiveArchetypeSummary(raidType = null, councilRaid = null, day = 1) {
  if (raidType === "council" && councilRaid?.attackers?.length) {
    const mergedWeights = {};
    for (const attacker of councilRaid.attackers) {
      const faction = COUNCIL_RAID_FACTIONS[attacker.key] || {};
      for (const [key, weight] of Object.entries(faction.archetypeWeights || {})) {
        mergedWeights[key] = (mergedWeights[key] || 0) + weight;
      }
    }
    const names = topArchetypesFromWeights(mergedWeights, 2);
    return names.length ? names.join(" / ") : "Mixed pressure";
  }
  const directive = getRaidDirectiveRule(resolveRaidDirectiveKey(raidType, councilRaid, day));
  const names = topArchetypesFromWeights(directive.archetypeWeights || {}, 2);
  return names.length ? names.join(" / ") : "Mixed pressure";
}

function partyArchetypeSummary(party = []) {
  const counts = {};
  for (const member of party || []) {
    const key = member?.archetypeKey;
    if (!key) continue;
    counts[key] = (counts[key] || 0) + 1;
  }
  const names = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([key]) => getHeroArchetypeRule(key).name);
  return names.length ? names.join(" / ") : "Mixed pressure";
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

function pickRaidArchetypeKey(heroClass, passiveKey, raidType = null, directiveKey = null) {
  const baseKey = pickHeroArchetypeKey(heroClass, passiveKey, raidType);
  const directiveWeights = getRaidDirectiveRule(directiveKey).archetypeWeights || {};
  const weights = { ...directiveWeights };
  weights[baseKey] = (weights[baseKey] || 0) + 2;
  return weightedPick(weights, baseKey);
}

function pickFactionArchetypeKey(faction, fallbackKey = "zealot") {
  if (faction?.archetypeWeights && Object.keys(faction.archetypeWeights).length) {
    return weightedPick(faction.archetypeWeights, fallbackKey);
  }
  if (Array.isArray(faction?.archetypes) && faction.archetypes.length) {
    return pick(faction.archetypes);
  }
  return fallbackKey;
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
      acc.coreShieldBonus += boon.coreShieldBonus || 0;
      acc.coreRetaliationBonus += boon.coreRetaliationBonus || 0;
      acc.trapDamageMult += boon.trapDamageMult || 0;
      acc.leaderHpMult *= boon.leaderHpMult || 1;
      return acc;
    },
    {
      partySizeDelta: 0,
      scoutRevealBonus: 0,
      starBias: 0,
      atkMult: 1,
      lureBoost: 0,
      coreShieldBonus: 0,
      coreRetaliationBonus: 0,
      trapDamageMult: 0,
      leaderHpMult: 1,
    }
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
  const cursePenalty = isTimedBlessingActive(stateLike?.nihazaCurseUntilDay, stateLike?.day || 1) ? 25 : 0;
  return Math.max(1, CORE_MAX_HP + doctrineEffects.coreMaxHpBonus - cursePenalty);
}

function getDungeonRoomCap(stateLike) {
  const level = clampDungeonLevel(Number.isFinite(stateLike?.dungeonLevel) ? stateLike.dungeonLevel : 1);
  const bonus = Math.max(0, stateLike?.bonusRoomCapPermanent || 0);
  return MAX_ROOMS_BASE + (level - 1) * ROOMS_PER_LEVEL + bonus;
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

function monsterRoleBucket(monster) {
  if (monster?.fusionHint && FUSION_ARCHETYPE_RULES[monster.fusionHint]) {
    return monster.fusionHint;
  }
  const baseHint = MONSTERS[monster?.key]?.fusionHint;
  if (baseHint && FUSION_ARCHETYPE_RULES[baseHint]) {
    return baseHint;
  }
  const label = String(monster?.branchClass || monster?.class || "").toLowerCase();
  const passiveKeys = normalizePassiveKeysForMonster(monster);
  for (const rule of Object.values(FUSION_ARCHETYPE_RULES)) {
    if (rule.classTags.some((tag) => label.includes(String(tag).toLowerCase()))) {
      return rule.key;
    }
    if ((rule.passiveBias || []).some((key) => passiveKeys.includes(key))) {
      return rule.key;
    }
  }
  return "predator";
}

function fusionRecipeForMonster(monster) {
  return FUSION_ARCHETYPE_RULES[monsterRoleBucket(monster)] || Object.values(FUSION_ARCHETYPE_RULES)[0];
}

function entityStarsValue(entity) {
  return typeof entity?.stars === "number" ? entity.stars : 1;
}

function fusionCost(first, second) {
  if (!first || !second) return 0;
  const recipe = fusionRecipeForMonster(second);
  const maxStar = Math.max(entityStarsValue(first), entityStarsValue(second));
  const maxStage = Math.max(monsterEvolutionStageValue(first), monsterEvolutionStageValue(second));
  return Math.max(6, (recipe?.baseCost || 8) + maxStar * 2 + maxStage * 4);
}

function fusionPassiveSelection(first, second) {
  const chosen = [];
  const ranks = {};
  const firstKeys = normalizePassiveKeysForMonster(first);
  const secondKeys = normalizePassiveKeysForMonster(second);
  if (firstKeys[0]) {
    chosen.push(firstKeys[0]);
    ranks[firstKeys[0]] = Math.max(1, first?.passiveRanks?.[firstKeys[0]] || 1);
  }
  const fallbackSecond = secondKeys.find((key) => !chosen.includes(key));
  if (fallbackSecond) {
    chosen.push(fallbackSecond);
    ranks[fallbackSecond] = Math.max(1, second?.passiveRanks?.[fallbackSecond] || 1);
  }
  return { passiveKeys: chosen.slice(0, 2), passiveRanks: ranks };
}

function monsterSpeedValue(monster) {
  const label = String(monster?.branchClass || monster?.class || "").toLowerCase();
  const passiveKeys = normalizePassiveKeysForMonster(monster);
  let spd = 3;
  if (["rogue", "skirmisher", "ranger", "stalker", "reaper", "alpha"].some((tag) => label.includes(tag))) spd = 5;
  else if (["tank", "warden", "knight"].some((tag) => label.includes(tag))) spd = 2;
  else if (["hexer", "mage", "warlock", "seer", "cleric"].some((tag) => label.includes(tag))) spd = 3;
  else if (["brute", "warrior", "marauder", "tyrant", "packlord"].some((tag) => label.includes(tag))) spd = 4;
  if (passiveKeys.includes("swift")) spd += 1;
  if (monster?.isFused) spd += fusionRecipeForMonster(monster).secondaryWeights?.spd || 0;
  return Math.max(1, spd);
}

function entityStatusSummary(entity) {
  if (!entity) return "none";
  const statuses = [];
  for (const rule of STATUS_RULE_LIST) {
    const state = entity.statuses?.[rule.key];
    if (!state || state.turns <= 0) continue;
    if (rule.key === "marked") {
      statuses.push(`${rule.name}${state.value ? ` +${state.value}` : ""}`);
      continue;
    }
    if (rule.key === "guard") {
      statuses.push(`${rule.name} ${state.value || 1}`);
      continue;
    }
    if (rule.key === "arrow") {
      statuses.push(`${rule.name} ${state.value || 0}`);
      continue;
    }
    statuses.push(`${rule.name} ${state.turns}t${state.value && ["poison", "burn"].includes(rule.key) ? `(${state.value})` : ""}`);
  }
  return statuses.length ? statuses.join(", ") : "none";
}

function monsterEvolutionStageValue(monster) {
  const raw = Number.isFinite(monster?.evolutionStage) ? monster.evolutionStage : monster?.evolution || 0;
  return clamp(raw, 0, MAX_EVOLUTION_STAGE);
}

function monsterEvolutionCost(monster) {
  if (!monster || !KNOW_MONSTER_KEY(monster.key)) return null;
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

function getMonsterBaseData(kind) {
  if (MONSTERS[kind]) return MONSTERS[kind];
  const unique = UNIQUE_MONSTER_MAP[kind];
  if (!unique) return null;
  return {
    key: unique.key,
    name: unique.race,
    icon: unique.icon,
    hp: unique.baseStats?.hp || 1,
    atk: unique.baseStats?.atk || 1,
    def: unique.baseStats?.def || 0,
  };
}

function buildMonsterPassiveLoadout(base, stars) {
  const passiveCount = rollPassiveCount(stars);
  if (passiveCount <= 0) return { passiveKeys: [], passiveRanks: {} };
  const chosen = [];
  if (Array.isArray(base?.passiveBias) && base.passiveBias.length > 0) {
    const preferred = base.passiveBias.filter((key) => MONSTER_PASSIVE_MAP[key]);
    if (preferred.length > 0) {
      chosen.push(pick(preferred));
    }
  }
  const remainingPool = MONSTER_PASSIVES.filter((key) => !chosen.includes(key));
  const extra = pickUnique(remainingPool, Math.max(0, passiveCount - chosen.length));
  const passiveKeys = [...chosen, ...extra].slice(0, passiveCount);
  return {
    passiveKeys,
    passiveRanks: createPassiveRanks(passiveKeys),
  };
}

function buildMonsterStats(kind, stars, evolutionStage = 0) {
  const base = getMonsterBaseData(kind);
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

function trapChargesForTile(grid, tile, x, y, doctrineEffects = null, artifactMods = null) {
  const star = clampMonsterStar(tile?.trapStar ?? tile?.trapStars ?? 1);
  const bonus =
    (doctrineEffects?.trapChargeBonus || 0) +
    (artifactMods?.trapChargeBonus || 0) +
    (Number.isFinite(x) && Number.isFinite(y) ? wardTrapChargeBonusAt(grid, x, y, artifactMods || {}) : 0);
  return trapChargesForStar(star, {
    ...(doctrineEffects || {}),
    trapChargeBonus: bonus,
  });
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
    raidDirectiveKey:
      hero?.raidDirectiveKey ||
      (hero?.factionKey ? COUNCIL_RAID_FACTIONS[hero.factionKey]?.defaultDirective : null) ||
      resolveRaidDirectiveKey(raidType, null, safeDay),
    traitPassiveKey: hero?.traitPassiveKey || null,
    traitPassiveName: hero?.traitPassiveName || null,
    isRaidLeader: !!hero?.isRaidLeader,
    stats,
    name: hero?.name || `${HERO_NAMES[0]} the ${hero?.class || HERO_CLASSES[0]}`,
    statuses: hero?.statuses || {},
    memory: createHeroMemory(hero?.memory),
    counters: {
      stunnedOnce: false,
      siphonGained: 0,
      tookDamageThisRaid: false,
      cursedMark: 0,
      wardedUsed: false,
      resoluteUsed: false,
      stoicUsed: false,
      trapDamaged: false,
      poisonedThisRaid: false,
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
  const directiveKey = options.directiveKey || resolveRaidDirectiveKey(raidType, options.councilRaid, day);
  const archetypeKey = options.archetypeKey || pickRaidArchetypeKey(heroClass, passiveRule.key, raidType, directiveKey);
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
    raidDirectiveKey: directiveKey,
    traitPassiveKey: null,
    traitPassiveName: null,
    isRaidLeader: false,
    stats,
    name,
    statuses: {},
    memory: createHeroMemory(),
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
  const monsterBase = getMonsterBaseData(monsterKey) || getMonsterBaseData("goblin");
  const className = pick(
    faction.classPool.filter(Boolean).length ? faction.classPool : MONSTERS[monsterKey]?.classPool || MONSTER_ARCHETYPES
  );
  const traitPassiveKey = pick(faction.passiveBias.filter(Boolean).length ? faction.passiveBias : MONSTER_PASSIVES);
  const passiveRule = pickHeroPassiveRule(HERO_PASSIVE_RULES);
  const directiveKey = attacker.directiveKey || faction.defaultDirective || resolveRaidDirectiveKey("council", councilRaid, day);
  const archetypeKey = pickFactionArchetypeKey(faction, pickHeroArchetypeKey(className, passiveRule.key, "council"));
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
    raidDirectiveKey: directiveKey,
    traitPassiveKey,
    traitPassiveName: MONSTER_PASSIVE_MAP[traitPassiveKey]?.name || "Faction Trait",
    isRaidLeader: false,
    stats,
    name: `${attacker.memberName.split(" ")[0]} ${monsterBase.name}`,
    statuses: {},
    memory: createHeroMemory(),
    counters: {
      stunnedOnce: false,
      siphonGained: 0,
      tookDamageThisRaid: false,
      cursedMark: 0,
      wardedUsed: false,
      resoluteUsed: false,
      stoicUsed: false,
      trapDamaged: false,
      poisonedThisRaid: false,
    },
  };
}

function generateMonster(kind, turnsSurvived, starCap, day = 1) {
  const base = getMonsterBaseData(kind);
  const stars = rollAuthoritativeStar(day, starCap);
  const { passiveKeys, passiveRanks } = buildMonsterPassiveLoadout(base, stars);
  let archetype = pick(MONSTER_ARCHETYPES);
  let affinity = null;
  if (Array.isArray(base?.affinityPool) && base.affinityPool.length > 0) {
    affinity = pick(base.affinityPool);
    archetype = `${affinity} Affinity`;
  } else if (Array.isArray(base?.classPool) && base.classPool.length > 0) {
    archetype = pick(base.classPool);
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
    permanentRoomBonuses: {},
    fusionHint: base?.fusionHint || null,
    statuses: {},
  };
}

function initMonsterInventory(turnsSurvived, count = 4, starCap, day = 1) {
  return Array.from({ length: count }, () => {
    const picked = pickWeightedMonsterDef(day);
    return generateMonster(picked?.key || MONSTER_KEYS[0], turnsSurvived, starCap, day);
  });
}

function generateHeroParty(turnsSurvived, raidType, day = 1, options = {}) {
  const raidMods = buildRaidModifiers(options.raidBoons || []);
  const baseSize = DAY_START_PARTY_MIN + Math.floor(Math.random() * (DAY_START_PARTY_MAX - DAY_START_PARTY_MIN + 1));
  const eliteDelta = raidType === "elite" ? -1 : 0;
  const size = Math.max(1, baseSize + eliteDelta + (raidMods.partySizeDelta || 0));
  const basePos = { x: 0, y: 0 };
  const party = [];
  let nextId = 1;
  const directiveKey = options.directiveKey || resolveRaidDirectiveKey(raidType, options.councilRaid, day);
  const eliteOptions =
    raidType === "elite"
      ? {
          classPool: ["Warrior", "Ranger", "Cleric", "Monk", "Warrior", "Ranger"],
          passivePool: ["Brave", "Stoic", "Focused", "Warded", "Quick", "Unyielding", "Resolute"],
          starBias: 0.45 + (raidMods.starBias || 0),
          directiveKey,
        }
      : {
        starBias: raidMods.starBias || 0,
        directiveKey,
      };
  for (let i = 0; i < size; i++) {
    const hero = generateHero(nextId, basePos, turnsSurvived, raidType, day, eliteOptions);
    party.push(hero);
    nextId += 1;
  }
  return applyRaidPartyModifiers(party, options.raidBoons || []);
}

function applyRaidPartyModifiers(party, raidBoons = []) {
  if (!Array.isArray(party) || party.length === 0) return [];
  const raidMods = buildRaidModifiers(raidBoons);
  const starsOf = (entity) => clampMonsterStar(entity?.stars || 1);
  let leaderIdx = 0;
  for (let i = 1; i < party.length; i += 1) {
    const current = party[i];
    const leader = party[leaderIdx];
    const currentHp = current?.stats?.maxHp ?? current?.hp ?? 1;
    const leaderHp = leader?.stats?.maxHp ?? leader?.hp ?? 1;
    if (
      starsOf(current) > starsOf(leader) ||
      (starsOf(current) === starsOf(leader) &&
        (currentHp > leaderHp || (currentHp === leaderHp && (current?.atk || 0) > (leader?.atk || 0))))
    ) {
      leaderIdx = i;
    }
  }
  return party.map((member, idx) => {
    const next = {
      ...member,
      stats: { ...(member.stats || {}) },
      isRaidLeader: idx === leaderIdx,
    };
    if (idx === leaderIdx && raidMods.leaderHpMult !== 1) {
      const baseMaxHp = next.stats.maxHp || next.hp || 1;
      const hpRatio = Math.max(0, Math.min(1, (next.hp || baseMaxHp) / Math.max(1, baseMaxHp)));
      const scaledMaxHp = Math.max(1, Math.round(baseMaxHp * raidMods.leaderHpMult));
      next.stats.maxHp = scaledMaxHp;
      next.hp = Math.max(1, Math.round(scaledMaxHp * hpRatio));
    }
    return next;
  });
}

function generateRaidParty(turnsSurvived, raidType, day = 1, options = {}) {
  if (raidType === "council") {
    const raidMods = buildRaidModifiers(options.raidBoons || []);
    const baseSize = DAY_START_PARTY_MIN + Math.floor(Math.random() * (DAY_START_PARTY_MAX - DAY_START_PARTY_MIN + 1));
    const size = Math.max(1, baseSize + 1 + (raidMods.partySizeDelta || 0));
    const basePos = { x: 0, y: 0 };
    return applyRaidPartyModifiers(
      Array.from({ length: size }, (_, idx) =>
      generateCouncilRaider(idx + 1, basePos, turnsSurvived, day, options.councilRaid, options.raidBoons || [])
      ),
      options.raidBoons || []
    );
  }
  return generateHeroParty(turnsSurvived, raidType, day, options);
}

function buildRaidPartyWithIntel(turnsSurvived, raidType, day = 1, options = {}) {
  const directiveKey = options.directiveKey || resolveRaidDirectiveKey(raidType, options.councilRaid, day);
  const party = generateRaidParty(turnsSurvived, raidType, day, {
    ...options,
    directiveKey,
  });
  const leader = party.find((member) => member.isRaidLeader) || null;
  return {
    directiveKey,
    party,
    raidIntel: createEmptyRaidIntel(directiveKey, leader?.id || null),
  };
}

function generateTraderStock(turnsSurvived, day = 1) {
  const count = 3;
  return Array.from({ length: count }, () => {
    const picked = pickWeightedMonsterDef(day);
    return generateMonster(picked?.key || MONSTER_KEYS[0], turnsSurvived, undefined, day);
  });
}

function generateArtifactStock(day = 1, ownedArtifacts = []) {
  const ownedCounts = countOwnedArtifacts(ownedArtifacts);
  const stockSize = 4 + Math.max(0, calcArtifactMods(ownedArtifacts, day).shadyStockBonus || 0);
  const pool = STANDARD_ARTIFACTS.filter((artifact) => {
    if ((artifact.unlockDay || 1) > day) return false;
    return (ownedCounts[artifact.key] || 0) < artifactCopyCap(artifact);
  });
  if (!pool.length) return [];
  const stock = [];
  const workingCounts = { ...ownedCounts };
  while (stock.length < stockSize) {
    const candidates = pool.filter((artifact) => (workingCounts[artifact.key] || 0) < artifactCopyCap(artifact));
    if (!candidates.length) break;
    const chosen = pick(candidates);
    stock.push(hydrateArtifactDefinition(chosen));
    workingCounts[chosen.key] = (workingCounts[chosen.key] || 0) + 1;
  }
  return stock;
}

function fleshMarketEraIndex(day = 1) {
  return councilEraIndex(day);
}

function buildUniqueMonsterEntity(def, day = 1, artifactMods = {}) {
  const eraIdx = Math.max(0, Math.min(fleshMarketEraIndex(day), 2));
  const stars = clampMonsterStar(def.starByEra?.[eraIdx] || 3);
  const passiveKeys = [...(def.passiveKeys || [])];
  const passiveRanks = createPassiveRanks(passiveKeys, def.passiveRanks || {});
  let entity = rebuildMonsterEntity(
    {
      key: def.key,
      name: def.name,
      icon: def.icon,
      hp: 1,
      atk: 1,
      def: def.baseStats?.def || 0,
      race: def.race,
      class: def.class,
      stars,
      passiveKey: passiveKeys[0] || null,
      passiveKeys,
      passiveRanks,
      passive: formatMonsterPassiveList(passiveKeys, passiveRanks),
      affinity: null,
      evoPoints: 0,
      evolutionStage: 0,
      evolution: 0,
      branchClass: null,
      foughtThisRaid: false,
      shieldedThisTurn: false,
      isUnique: true,
      permanentRoomBonuses: {},
      statuses: {},
    },
    {},
    { healToFull: true }
  );
  const bonusHp = artifactMods.uniqueMonsterHpOnBuy || 0;
  if (bonusHp > 0) {
    entity = {
      ...entity,
      hp: entity.hp + bonusHp,
      stats: {
        ...entity.stats,
        maxHp: entity.stats.maxHp + bonusHp,
      },
    };
  }
  return entity;
}

function buildFusedMonsterEntity(first, second, day = 1) {
  const primaryStats = first?.stats || { maxHp: first?.hp || 1, atk: first?.atk || 1, def: first?.def || 0 };
  const secondaryStats = second?.stats || { maxHp: second?.hp || 1, atk: second?.atk || 1, def: second?.def || 0 };
  const recipe = fusionRecipeForMonster(second);
  const weights = recipe?.secondaryWeights || { hp: 0.3, atk: 0.3, def: 0.2, spd: 0 };
  const stars = Math.min(monsterStarCapForDay(day), Math.max(entityStarsValue(first), entityStarsValue(second)));
  const evolutionStage = Math.max(monsterEvolutionStageValue(first), monsterEvolutionStageValue(second));
  const { passiveKeys, passiveRanks } = fusionPassiveSelection(first, second);
  const primaryRace = first?.race || "Monster";
  const secondaryRace = second?.race || "Monster";
  const stats = {
    maxHp: Math.max(1, Math.round(primaryStats.maxHp + secondaryStats.maxHp * weights.hp)),
    atk: Math.max(1, Math.round(primaryStats.atk + secondaryStats.atk * weights.atk)),
    def: Math.max(0, Math.round(primaryStats.def + secondaryStats.def * weights.def)),
  };
  return {
    key: "abomination",
    name: `${primaryRace} ${recipe?.name || "Abomination"}`,
    icon: recipe?.icon || "Ab",
    hp: stats.maxHp,
    atk: stats.atk,
    def: stats.def,
    race: "Abomination",
    class: recipe?.name || "Abomination",
    stars,
    passiveKey: passiveKeys[0] || null,
    passiveKeys,
    passiveRanks,
    passive: formatMonsterPassiveList(passiveKeys, passiveRanks),
    stats,
    affinity: null,
    evoPoints: 0,
    evolutionStage,
    evolution: evolutionStage,
    branchClass: null,
    foughtThisRaid: false,
    shieldedThisTurn: false,
    isFused: true,
    permanentRoomBonuses: {},
    fusionRecipeKey: recipe?.key || null,
    fusionRecipeName: recipe?.name || "Abomination",
    fusionParents: [primaryRace, secondaryRace],
    statuses: {},
  };
}

function normalizeBoughtUniqueKeys(raw) {
  return Array.isArray(raw) ? Array.from(new Set(raw.filter(Boolean))) : [];
}

function generateFleshMarketStock(day = 1, boughtUniqueKeys = []) {
  const owned = new Set(normalizeBoughtUniqueKeys(boughtUniqueKeys));
  const eraIdx = Math.max(0, Math.min(fleshMarketEraIndex(day), 2));
  const monsterOffers = pickUnique(
    FLESH_MARKET_UNIQUE_MONSTERS.filter((monster) => !owned.has(monster.key)),
    2
  ).map((monster) => ({
    type: "monster",
    key: monster.key,
    name: monster.name,
    desc: monster.desc,
    cost: monster.costByEra?.[eraIdx] || monster.costByEra?.[0] || 0,
    stars: clampMonsterStar(monster.starByEra?.[eraIdx] || 3),
    passiveKeys: [...(monster.passiveKeys || [])],
  }));
  const artifactOffers = pickUnique(
    FLESH_MARKET_UNIQUE_ARTIFACTS.filter((artifact) => !owned.has(artifact.key)),
    1
  ).map((artifact) => ({
    type: "artifact",
    key: artifact.key,
    name: artifact.name,
    desc: artifact.desc,
    cost: artifact.costByEra?.[eraIdx] || artifact.costByEra?.[0] || 0,
  }));
  return [...monsterOffers, ...artifactOffers];
}

function monsterRoomCap(tier) {
  return BASE_MONSTER_ROOM_CAP + Math.max(0, (tier || 1) - 1);
}

function effectiveMonsterRoomCapValue(stateLike, tier) {
  const doctrineEffects = getDoctrineEffects(stateLike?.doctrines || {});
  const artifactMods = calcArtifactMods(stateLike?.artifacts || [], stateLike?.day || 1);
  const ashBonus = isTimedBlessingActive(stateLike?.ashMonsterRoomCapUntilDay, stateLike?.day || 1) ? 1 : 0;
  return monsterRoomCap(tier) + doctrineEffects.monsterRoomCapBonus + (artifactMods.monsterRoomCapBonus || 0) + ashBonus;
}

function roomPermanentBonusTotal(roomType, roomTier = 1) {
  const tierBonus = Math.max(0, (roomTier || 1) - 1);
  if (roomType === "training-den") return 1 + tierBonus;
  if (roomType === "thick-hide") return 3 + tierBonus * 2;
  return 0;
}

function inferPermanentRoomBonuses(monster) {
  const existing = monster?.permanentRoomBonuses && typeof monster.permanentRoomBonuses === "object"
    ? { ...monster.permanentRoomBonuses }
    : {};
  if (!monster || monster.isFused || !KNOW_MONSTER_KEY(monster.key)) return existing;
  const baseStats = buildMonsterStats(monster.key, clampMonsterStar(monster.stars), monsterEvolutionStageValue(monster));
  const rawAtk = Number.isFinite(monster.atk) ? monster.atk : baseStats.atk;
  const rawMaxHp = Number.isFinite(monster?.stats?.maxHp) ? monster.stats.maxHp : monster.hp || baseStats.maxHp;
  const trainingBonus = Math.max(0, rawAtk - baseStats.atk);
  const thickHideBonus = Math.max(0, rawMaxHp - baseStats.maxHp);
  if (trainingBonus > 0) {
    existing["training-den"] = Math.max(existing["training-den"] || 0, trainingBonus);
  }
  if (thickHideBonus > 0) {
    existing["thick-hide"] = Math.max(existing["thick-hide"] || 0, thickHideBonus);
  }
  return existing;
}

function applyStoredPermanentRoomBonuses(monster, sourceMonster = monster) {
  const marks = inferPermanentRoomBonuses(sourceMonster);
  const next = {
    ...monster,
    stats: {
      ...(monster.stats || {
        maxHp: monster.hp || 1,
        atk: monster.atk || 1,
        def: monster.def || 0,
      }),
    },
    permanentRoomBonuses: { ...marks },
  };
  const sourceMaxHp = Math.max(1, sourceMonster?.stats?.maxHp || sourceMonster?.hp || next.stats.maxHp || 1);
  const sourceHp = Math.max(1, sourceMonster?.hp || sourceMaxHp);
  const hpRatio = Math.max(0, Math.min(1, sourceHp / sourceMaxHp));
  const atkBonus = Math.max(0, marks["training-den"] || 0);
  const hpBonus = Math.max(0, marks["thick-hide"] || 0);
  if (atkBonus > 0) {
    next.atk += atkBonus;
    next.stats.atk = next.atk;
  }
  if (hpBonus > 0) {
    next.stats.maxHp += hpBonus;
    next.hp = Math.max(1, Math.min(next.stats.maxHp, Math.round(next.stats.maxHp * hpRatio)));
  }
  return next;
}

function prepareMonsterForInventory(monster, artifactMods = {}) {
  if (!monster) return monster;
  const next = {
    ...monster,
    stats: {
      ...(monster.stats || {
        maxHp: monster.hp || 1,
        atk: monster.atk || 1,
        def: monster.def || 0,
      }),
    },
  };
  if (artifactMods.roomWithdrawHealFull) {
    next.hp = Math.max(1, next.stats.maxHp || next.hp || 1);
  }
  return next;
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
    permanentRoomBonuses: inferPermanentRoomBonuses(monster),
  };
  if (!roomType) return m;
  const targetBonus = roomPermanentBonusTotal(roomType, roomTier);
  const currentBonus = m.permanentRoomBonuses?.[roomType] || 0;
  const delta = Math.max(0, targetBonus - currentBonus);
  if (delta <= 0) return m;
  if (roomType === "training-den") {
    m.atk += delta;
    m.stats.atk = m.atk;
  } else if (roomType === "thick-hide") {
    m.stats.maxHp = (m.stats.maxHp || m.hp || 1) + delta;
    m.hp = Math.min(m.stats.maxHp, (m.hp || m.stats.maxHp) + delta);
  }
  m.permanentRoomBonuses = {
    ...(m.permanentRoomBonuses || {}),
    [roomType]: targetBonus,
  };
  return m;
}

function normalizeMonsterEntity(monster, roomType, roomTier = 1) {
  if (!monster || !KNOW_MONSTER_ENTITY(monster)) return monster;
  if (monster.isFused) {
    const passiveKeys = normalizePassiveKeysForMonster(monster);
    const passiveRanks = createPassiveRanks(passiveKeys, monster.passiveRanks || {});
    return {
      ...monster,
      hp: Math.max(1, monster.hp || monster.stats?.maxHp || 1),
      atk: Math.max(1, monster.atk || monster.stats?.atk || 1),
      def: Math.max(0, monster.def || monster.stats?.def || 0),
      stats: {
        maxHp: Math.max(1, monster.stats?.maxHp || monster.hp || 1),
        atk: Math.max(1, monster.atk || monster.stats?.atk || 1),
        def: Math.max(0, monster.def || monster.stats?.def || 0),
      },
      passiveKey: passiveKeys[0] || null,
      passiveKeys,
      passiveRanks,
      passive: formatMonsterPassiveList(passiveKeys, passiveRanks),
      permanentRoomBonuses: inferPermanentRoomBonuses(monster),
      statuses: monster.statuses || {},
    };
  }
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
  normalized = applyStoredPermanentRoomBonuses(normalized, monster);
  if (roomType) {
    normalized = applyMonsterRoomPlacementStatic(normalized, roomType, roomTier);
  }
  normalized.hp = Math.max(1, Math.min(normalized.stats.maxHp, monster.hp || normalized.stats.maxHp));
  normalized.foughtThisRaid = !!monster.foughtThisRaid;
  normalized.shieldedThisTurn = !!monster.shieldedThisTurn;
  normalized.evoPoints = Math.max(0, monster.evoPoints || 0);
  normalized.isUnique = !!monster.isUnique || !!UNIQUE_MONSTER_MAP[monster.key];
  normalized.isFused = !!monster.isFused;
  normalized.fusionRecipeKey = monster.fusionRecipeKey || null;
  normalized.fusionRecipeName = monster.fusionRecipeName || null;
  normalized.fusionParents = Array.isArray(monster.fusionParents) ? monster.fusionParents : [];
  normalized.permanentRoomBonuses = normalized.permanentRoomBonuses || inferPermanentRoomBonuses(monster);
  normalized.statuses = monster.statuses || {};
  return normalized;
}

function calcArtifactMods(artifacts, day = 1) {
  const mods = {
    essenceOnKill: 0,
    soulshardOnKill: 0,
    monsterAtk: 0,
    trapMult: 0,
    coreDamageReduction: 0,
    sacrificeBonusDarkcrystals: 0,
    multiPassiveAtkBonus: 0,
    coreStartShield: 0,
    trapDamageVulnerability: 0,
    uniqueMonsterHpOnBuy: 0,
    trapFlatDamage: 0,
    coreRetaliationBonus: 0,
    monsterDef: 0,
    scoutRevealBonus: 0,
    trapChargeBonus: 0,
    monsterRoomCapBonus: 0,
    trapKillEssence: 0,
    utilityPotencyBonus: 0,
    roomWithdrawHealFull: 0,
    shadyStockBonus: 0,
    bloodLinkedEssenceBonus: 0,
    bloodLinkedTrapKillSoulshard: 0,
    huntLinkedTrapFlatDamage: 0,
    huntLinkedLureBonus: 0,
    huntLinkedScoutRevealBonus: 0,
    wardLinkedMonsterDef: 0,
    wardLinkedTrapChargeBonus: 0,
  };
  for (const artifact of artifacts || []) {
    const art = hydrateArtifactDefinition(artifact);
    if (!art || !art.mods) continue;
    for (const [key, val] of Object.entries(art.mods || {})) {
      if (typeof val === "number") {
        mods[key] = (mods[key] || 0) + val;
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

function ashBreachRequirementText(count) {
  if (count <= 1) return "Requires 1 valid edge tile within 2 steps of a trap or monster room.";
  return `Requires ${count} valid edge tiles within 2 steps of trap/monster rooms.`;
}

function hasAshBreachAnchorNearby(grid, x, y) {
  for (let ny = 0; ny < H; ny += 1) {
    for (let nx = 0; nx < W; nx += 1) {
      const tile = grid[ny][nx];
      if (tile.room !== "trap" && tile.room !== "monster") continue;
      if (Math.abs(nx - x) + Math.abs(ny - y) <= 2) return true;
    }
  }
  return false;
}

function getAshBreachCandidates(grid) {
  const activeEntrances = getActiveEntrances(grid, null);
  const edgeCells = [];
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      if (x !== 0 && x !== W - 1 && y !== 0 && y !== H - 1) continue;
      edgeCells.push({ x, y });
    }
  }
  return edgeCells.filter((pos) => {
    const tile = grid[pos.y][pos.x];
    if (tile.core || tile.entrance || tile.room) return false;
    if (activeEntrances.some((entry) => inAuraRange(entry.x, entry.y, pos.x, pos.y))) return false;
    if (!hasAshBreachAnchorNearby(grid, pos.x, pos.y)) return false;
    return true;
  });
}

function canPlaceAshBreaches(grid, count) {
  const needed = Math.max(1, count || 1);
  const candidates = getAshBreachCandidates(grid);
  if (candidates.length < needed) return false;
  if (needed === 1) return true;
  const chosen = [];
  function search(start) {
    if (chosen.length >= needed) return true;
    for (let i = start; i < candidates.length; i += 1) {
      const candidate = candidates[i];
      if (chosen.some((entry) => inAuraRange(entry.x, entry.y, candidate.x, candidate.y))) continue;
      chosen.push(candidate);
      if (search(i + 1)) return true;
      chosen.pop();
    }
    return false;
  }
  return search(0);
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

function linkedUtilityTier(grid, x, y, key) {
  let tier = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
      const tile = grid[ny]?.[nx];
      if (tile?.room === "utility" && tile.roomType === key && isLinkedRoom(grid, nx, ny)) {
        tier = Math.max(tier, tile.roomTier || 1);
      }
    }
  }
  return tier;
}

function orthogonalUtilityTier(grid, x, y, key, linkedOnly = false) {
  let tier = 0;
  for (const pos of neighbors(x, y)) {
    const tile = grid[pos.y]?.[pos.x];
    if (tile?.room !== "utility" || tile.roomType !== key) continue;
    if (linkedOnly && !isLinkedRoom(grid, pos.x, pos.y)) continue;
    tier = Math.max(tier, tile.roomTier || 1);
  }
  return tier;
}

function anyLinkedUtilityRoom(grid, key) {
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const tile = grid[y]?.[x];
      if (tile?.room === "utility" && tile.roomType === key && isLinkedRoom(grid, x, y)) {
        return true;
      }
    }
  }
  return false;
}

function roomLureBonusAt(grid, x, y, artifactMods = {}) {
  const tile = grid?.[y]?.[x];
  let bonus = utilityTier(grid, x, y, "scent-beacon") > 0 ? 1 : 0;
  if (tile?.room && roomSynergyTag(tile) === "Hunt" && isLinkedRoom(grid, x, y)) {
    bonus += artifactMods.huntLinkedLureBonus || 0;
  }
  return bonus;
}

function huntScoutRevealBonus(grid, artifactMods = {}) {
  return anyLinkedUtilityRoom(grid, "scent-beacon") ? 1 + (artifactMods.huntLinkedScoutRevealBonus || 0) : 0;
}

function bloodDeathBonuses(grid, x, y, why, artifactMods = {}) {
  const tile = grid?.[y]?.[x];
  const trapKill = why === "trap" || why === "arrows";
  const linkInfo = roomLinkInfoAt(grid, x, y);
  let extraEssence = utilityTier(grid, x, y, "butchers-shrine") > 0 ? 1 : 0;
  let extraSoulshards = trapKill && linkedUtilityTier(grid, x, y, "butchers-shrine") > 0 ? 1 : 0;
  if (linkInfo.linked && linkInfo.tag === "Blood") {
    extraEssence += artifactMods.bloodLinkedEssenceBonus || 0;
    if (trapKill) {
      extraSoulshards += artifactMods.bloodLinkedTrapKillSoulshard || 0;
      if (tile?.room === "trap" && tile.trapType === "gore-channel") {
        extraEssence += 10;
      }
    }
  }
  return { extraEssence, extraSoulshards };
}

function wardMonsterDefBonus(grid, x, y, artifactMods = {}) {
  const tile = grid?.[y]?.[x];
  if (tile?.room !== "monster") return 0;
  let bonus = 0;
  if (tile.roomType === "bulwark-hall" && isLinkedRoom(grid, x, y)) {
    bonus += 1;
  }
  if (roomSynergyTag(tile) === "Ward" && isLinkedRoom(grid, x, y)) {
    bonus += artifactMods.wardLinkedMonsterDef || 0;
  }
  return bonus;
}

function wardTrapChargeBonusAt(grid, x, y, artifactMods = {}) {
  const tile = grid?.[y]?.[x];
  let bonus = linkedUtilityTier(grid, x, y, "aegis-lantern") > 0 ? 1 : 0;
  if (tile?.room === "trap" && roomSynergyTag(tile) === "Ward" && isLinkedRoom(grid, x, y)) {
    bonus += artifactMods.wardLinkedTrapChargeBonus || 0;
  }
  return bonus;
}

function huntTrapFlatDamageBonus(grid, x, y, artifactMods = {}) {
  const tile = grid?.[y]?.[x];
  if (tile?.room === "trap" && roomSynergyTag(tile) === "Hunt" && isLinkedRoom(grid, x, y)) {
    return artifactMods.huntLinkedTrapFlatDamage || 0;
  }
  return 0;
}

function hasUtilityAura(grid, x, y, key) {
  return utilityTier(grid, x, y, key) > 0;
}

function tileWalkable(t) {
  return t.entrance || t.core || t.room === "trap" || t.room === "monster";
}

function isArtPathTile(grid, ashTrial, x, y) {
  const tile = grid?.[y]?.[x];
  if (!tile) return false;
  return isAshBreachAt(ashTrial, x, y) || tile.entrance || tile.core || tile.room === "trap" || tile.room === "monster";
}

function getTraversableExitMask(grid, ashTrial, x, y) {
  return {
    up: y > 0 && isArtPathTile(grid, ashTrial, x, y - 1),
    right: x < W - 1 && isArtPathTile(grid, ashTrial, x + 1, y),
    down: y < H - 1 && isArtPathTile(grid, ashTrial, x, y + 1),
    left: x > 0 && isArtPathTile(grid, ashTrial, x - 1, y),
  };
}

function exitCount(mask) {
  return (mask.up ? 1 : 0) + (mask.right ? 1 : 0) + (mask.down ? 1 : 0) + (mask.left ? 1 : 0);
}

function topologyFromExitMask(mask) {
  const count = exitCount(mask);
  if (count <= 0) return "isolated";
  if (count === 1) return "dead-end";
  if (count === 2) {
    if ((mask.up && mask.down) || (mask.left && mask.right)) return "straight";
    return "corner";
  }
  if (count === 3) return "tee";
  return "cross";
}

function rotationFromExitMask(mask, topology) {
  if (topology === "isolated" || topology === "cross") return 0;
  if (topology === "dead-end") {
    if (mask.up) return 0;
    if (mask.right) return 90;
    if (mask.down) return 180;
    return 270;
  }
  if (topology === "straight") {
    return mask.up && mask.down ? 0 : 90;
  }
  if (topology === "corner") {
    if (mask.up && mask.right) return 0;
    if (mask.right && mask.down) return 90;
    if (mask.down && mask.left) return 180;
    return 270;
  }
  if (topology === "tee") {
    if (!mask.down) return 0;
    if (!mask.left) return 90;
    if (!mask.up) return 180;
    return 270;
  }
  return 0;
}

function getTileArtSpec(tile, x, y, grid, ashTrial, brokenSources = null) {
  if (!isArtPathTile(grid, ashTrial, x, y)) {
    return { enabled: false, topology: null, rotationDeg: 0, src: null, fallbackToGlyph: true };
  }
  const mask = getTraversableExitMask(grid, ashTrial, x, y);
  const topology = topologyFromExitMask(mask);
  const src = TILE_ART_SOURCES[topology] || null;
  const fallbackToGlyph = !src || !!brokenSources?.[src];
  return {
    enabled: !!src,
    topology,
    rotationDeg: rotationFromExitMask(mask, topology),
    src,
    fallbackToGlyph,
  };
}

function getUtilityArtSpec(tile, brokenSources = null) {
  if (tile?.room !== "utility") {
    return { enabled: false, baseSrc: null, centerpieceSrc: null, fallbackToGlyph: true };
  }
  const baseSrc = SUPPORT_TILE_ART_SOURCES.base || null;
  const centerpieceSrc = SUPPORT_TILE_ART_SOURCES.centerpiece?.[tile.roomType] || null;
  const fallbackToGlyph =
    !baseSrc ||
    !centerpieceSrc ||
    !!brokenSources?.[baseSrc] ||
    !!brokenSources?.[centerpieceSrc];
  return {
    enabled: !!baseSrc && !!centerpieceSrc,
    baseSrc,
    centerpieceSrc,
    fallbackToGlyph,
  };
}

function getEmptyTileArtSpec(tile, x, y, ashTrial, brokenSources = null) {
  if (tile?.room || tile?.entrance || tile?.core || isAshBreachAt(ashTrial, x, y)) {
    return { enabled: false, src: null, fallbackToGlyph: true };
  }
  return {
    enabled: !!EMPTY_TILE_ART_SRC,
    src: EMPTY_TILE_ART_SRC,
    fallbackToGlyph: !EMPTY_TILE_ART_SRC || !!brokenSources?.[EMPTY_TILE_ART_SRC],
  };
}

function getTileCenterMarkerSpec(tile, x, y, ashTrial, brokenSources = null) {
  const src = isAshBreachAt(ashTrial, x, y)
    ? TILE_CENTER_MARKERS.ash
    : tile?.entrance
    ? TILE_CENTER_MARKERS.entrance
    : tile?.core
    ? TILE_CENTER_MARKERS.core
    : null;
  return {
    enabled: !!src && !brokenSources?.[src],
    src,
  };
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

function getActiveEntrances(grid, ashTrial) {
  const { entrance } = findEntranceAndCore(grid);
  const entries = [];
  if (entrance) entries.push({ ...entrance, kind: "main" });
  if (isAshTrialActive(ashTrial)) {
    for (const breach of ashTrial.breaches) {
      entries.push({ x: breach.x, y: breach.y, kind: "ash-breach" });
    }
  }
  return entries;
}

function hasPathToCore(grid, start, core) {
  const q = [start];
  const seen = new Set([keyOf(start.x, start.y)]);
  while (q.length) {
    const cur = q.shift();
    if (cur.x === core.x && cur.y === core.y) return true;
    for (const p of neighbors(cur.x, cur.y)) {
      if (seen.has(keyOf(p.x, p.y))) continue;
      if (!tileWalkable(grid[p.y][p.x])) continue;
      seen.add(keyOf(p.x, p.y));
      q.push(p);
    }
  }
  return false;
}

function rollAshBreachPositions(grid, count, day) {
  const needed = Math.max(1, count || 1);
  const candidates = getAshBreachCandidates(grid);
  const picks = [];
  function search(remaining, pool) {
    if (picks.length >= needed) return true;
    if (!pool.length || pool.length < remaining) return false;
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    for (const candidate of shuffled) {
      if (picks.some((entry) => inAuraRange(entry.x, entry.y, candidate.x, candidate.y))) continue;
      picks.push(candidate);
      const nextPool = pool.filter(
        (entry) =>
          !(entry.x === candidate.x && entry.y === candidate.y) &&
          !inAuraRange(entry.x, entry.y, candidate.x, candidate.y)
      );
      if (search(remaining - 1, nextPool)) return true;
      picks.pop();
    }
    return false;
  }
  if (!search(needed, candidates)) return [];
  return picks.map((pickPos) => ({ x: pickPos.x, y: pickPos.y, openedDay: day }));
}

function pickSpawnEntrance(grid, ashTrial) {
  const entries = getActiveEntrances(grid, ashTrial);
  if (!entries.length) return null;
  const totalWeight = entries.reduce((sum, entry) => sum + (entry.kind === "ash-breach" ? 3 : 2), 0);
  let roll = Math.random() * totalWeight;
  for (const entry of entries) {
    roll -= entry.kind === "ash-breach" ? 3 : 2;
    if (roll <= 0) return entry;
  }
  return entries[entries.length - 1];
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

function validateDungeon(grid, ashTrial = null) {
  const { entrance, core } = findEntranceAndCore(grid);
  const entrances = getActiveEntrances(grid, ashTrial);
  if (!entrance) return { ok: false, reason: "Entrance not placed." };
  if (!core) return { ok: false, reason: "Core not placed." };
  for (const entry of entrances) {
    if (!hasPathToCore(grid, entry, core)) {
      if (entry.kind === "ash-breach") {
        return { ok: false, reason: `Ash Breach ${formatGridPos(entry)} is disconnected from the Core.` };
      }
      return { ok: false, reason: "No valid path from Entrance to Core." };
    }
  }
  return { ok: true, reason: "" };
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

function objectiveTargetLabel(target) {
  return target ? `${target.label || target.kind || "Target"} ${formatGridPos(target)}` : "No target";
}

function isObjectiveTargetValid(target, grid, corePos) {
  if (!target || !Number.isFinite(target.x) || !Number.isFinite(target.y)) return false;
  if (target.kind === "core" || target.kind === "safe-core") {
    return !!corePos && corePos.x === target.x && corePos.y === target.y;
  }
  const tile = grid[target.y]?.[target.x];
  if (!tile) return false;
  if (target.kind === "monster") return tile.room === "monster" && (tile.monsters || []).length > 0;
  if (target.kind === "support") return tile.room === "trap" || tile.room === "utility";
  if (target.kind === "flank") return tileWalkable(tile) && !tile.core;
  return tileWalkable(tile);
}

function objectiveCandidates(grid, current, corePos, selector) {
  const candidates = [];
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const tile = grid[y]?.[x];
      if (!tile) continue;
      if (!selector(tile, x, y)) continue;
      const dist = pathDistance(grid, current, { x, y });
      if (!Number.isFinite(dist)) continue;
      const coreDist = corePos ? pathDistance(grid, { x, y }, corePos) : Number.POSITIVE_INFINITY;
      candidates.push({
        x,
        y,
        tile,
        dist,
        coreDist,
        threat: tileThreatScore(grid, x, y),
        lure: corePos ? branchLureScore(grid, { x, y }, corePos) : 0,
      });
    }
  }
  return candidates;
}

function chooseObjectiveTarget(entity, grid, corePos, raidIntel = null) {
  const archetype = getHeroArchetypeRule(entity.archetypeKey);
  const current = { x: entity.x, y: entity.y };
  const sharedIntel = normalizeRaidIntel(raidIntel, entity.raidDirectiveKey || "rush-core");
  for (const kind of archetype.objectiveKinds || ["core"]) {
    if ((kind === "core" || kind === "safe-core") && corePos) {
      return {
        kind,
        label: kind === "safe-core" ? "Safest Core lane" : "Press the Core",
        x: corePos.x,
        y: corePos.y,
      };
    }
    if (kind === "monster") {
      const target = objectiveCandidates(grid, current, corePos, (tile) => tile.room === "monster" && (tile.monsters || []).length > 0)
        .sort((a, b) => b.tile.monsters.length - a.tile.monsters.length || a.dist - b.dist || b.threat - a.threat)[0];
      if (target) {
        return {
          kind,
          label: "Break monster room",
          x: target.x,
          y: target.y,
        };
      }
    }
    if (kind === "support") {
      const approachSupportTarget = (x, y, sourceTile) =>
        neighbors(x, y)
          .filter((pos) => tileWalkable(grid[pos.y]?.[pos.x]))
          .map((pos) => ({
            x: pos.x,
            y: pos.y,
            tile: grid[pos.y]?.[pos.x],
            dist: pathDistance(grid, current, pos),
            threat: tileThreatScore(grid, pos.x, pos.y),
            sourceTile,
          }))
          .filter((entry) => Number.isFinite(entry.dist));
      const keyedSupport = [...(sharedIntel.trapHubs || []), ...(sharedIntel.utilityHubs || [])]
        .flatMap((key) => {
          const [x, y] = String(key)
            .split(",")
            .map((part) => Number(part));
          const sourceTile = Number.isFinite(x) && Number.isFinite(y) ? grid[y]?.[x] : null;
          if (!sourceTile || (sourceTile.room !== "trap" && sourceTile.room !== "utility")) return [];
          if (sourceTile.room === "utility") return approachSupportTarget(x, y, sourceTile);
          return [
            {
              x,
              y,
              tile: sourceTile,
              dist: pathDistance(grid, current, { x, y }),
              threat: tileThreatScore(grid, x, y),
              sourceTile,
            },
          ].filter((entry) => Number.isFinite(entry.dist));
        });
      const scannedSupport = objectiveCandidates(grid, current, corePos, (tile) => tile.room === "trap")
        .map((entry) => ({ ...entry, sourceTile: entry.tile }))
        .concat(
          Array.from({ length: H * W }, (_, idx) => {
            const x = idx % W;
            const y = Math.floor(idx / W);
            const tile = grid[y]?.[x];
            return tile?.room === "utility" ? approachSupportTarget(x, y, tile) : [];
          }).flat()
        );
      const supportTarget =
        keyedSupport.sort((a, b) => a.dist - b.dist || b.threat - a.threat)[0] ||
        scannedSupport.sort(
          (a, b) =>
            (b.threat + (b.sourceTile?.room === "utility" ? 4 : 2)) -
              (a.threat + (a.sourceTile?.room === "utility" ? 4 : 2)) || a.dist - b.dist
        )[0];
      if (supportTarget) {
        return {
          kind,
          label: supportTarget.sourceTile?.room === "utility" ? "Purge support hub" : "Break trap line",
          x: supportTarget.x,
          y: supportTarget.y,
        };
      }
    }
    if (kind === "flank") {
      const flankTarget = objectiveCandidates(grid, current, corePos, (tile, x, y) => tileWalkable(tile) && !tile.core && !(x === current.x && y === current.y))
        .map((candidate) => ({
          ...candidate,
          score:
            candidate.lure * 1.4 +
            (candidate.coreDist > 1 ? 1 : 0) +
            ((sharedIntel.dangerTiles || {})[keyOf(candidate.x, candidate.y)] ? -2 : 0) -
            candidate.dist * 0.6,
        }))
        .filter((candidate) => candidate.score >= 2.5)
        .sort((a, b) => b.score - a.score || a.dist - b.dist)[0];
      if (flankTarget) {
        return {
          kind,
          label: "Probe flank route",
          x: flankTarget.x,
          y: flankTarget.y,
        };
      }
    }
  }
  return corePos
    ? {
        kind: "core",
        label: "Press the Core",
        x: corePos.x,
        y: corePos.y,
      }
    : null;
}

function chooseInvaderMove(entity, grid, corePos, raidBoons = [], doctrineEffects = {}, raidIntel = null, artifactMods = {}) {
  if (!entity || !corePos) return { next: null, options: [], intent: "No path" };
  const archetype = getHeroArchetypeRule(entity.archetypeKey);
  const directiveKey = entity.raidDirectiveKey || raidIntel?.directive || "rush-core";
  const directive = getRaidDirectiveRule(directiveKey);
  const factionRetargetBias = entity.factionKey ? COUNCIL_RAID_FACTIONS[entity.factionKey]?.retargetBias || 0 : 0;
  const objectiveCommitTurns =
    archetype.objectiveCommitTurns < 0
      ? -1
      : Math.max(1, archetype.objectiveCommitTurns + (entity.raidOriginLabel === RAID_TYPE_META.elite.label ? 1 : 0) - factionRetargetBias);
  const current = { x: entity.x, y: entity.y };
  const currentCoreDist = pathDistance(grid, current, corePos);
  const raidMods = buildRaidModifiers(raidBoons);
  const recentTiles = Array.isArray(entity.memory?.recentTiles) ? entity.memory.recentTiles : [];
  const currentMemory = createHeroMemory(entity.memory);
  const retainedTarget = currentMemory.targetTile;
  const retainedObjectiveActive =
    retainedTarget &&
    isObjectiveTargetValid(retainedTarget, grid, corePos) &&
    (currentMemory.objectiveTurnsLeft < 0 || currentMemory.objectiveTurnsLeft > 0);
  const currentDanger = (currentMemory.danger?.[keyOf(current.x, current.y)] || 0) + ((raidIntel?.dangerTiles || {})[keyOf(current.x, current.y)] || 0);
  const forceRetarget = archetype.retargetOnDamage && currentDanger >= (archetype.dangerThreshold || 8);
  const objectiveTarget =
    retainedObjectiveActive && !forceRetarget
      ? retainedTarget
      : chooseObjectiveTarget(entity, grid, corePos, raidIntel);
  const objectiveChanged =
    !retainedTarget ||
    forceRetarget ||
    retainedTarget?.x !== objectiveTarget?.x ||
    retainedTarget?.y !== objectiveTarget?.y ||
    retainedTarget?.kind !== objectiveTarget?.kind;
  const currentObjectiveDist = objectiveTarget ? pathDistance(grid, current, objectiveTarget) : Number.POSITIVE_INFINITY;
  const isBacktrack = (option) =>
    !!(entity.prev && option && entity.prev.x === option.next.x && entity.prev.y === option.next.y);
  const options = neighbors(entity.x, entity.y)
    .filter((next) => tileWalkable(grid[next.y][next.x]))
    .map((next) => {
      const tile = grid[next.y][next.x];
      const coreDist = pathDistance(grid, next, corePos);
      if (!Number.isFinite(coreDist)) return null;
      const nextKey = keyOf(next.x, next.y);
      const localDanger = currentMemory.danger?.[nextKey] || 0;
      const sharedDanger = raidIntel?.dangerTiles?.[nextKey] || 0;
      const threat = tileThreatScore(grid, next.x, next.y) + localDanger + (["cautious", "purifier", "scout"].includes(archetype.key) ? sharedDanger : sharedDanger * 0.35);
      const lure =
        branchLureScore(grid, next, corePos) +
        roomLureBonusAt(grid, next.x, next.y, artifactMods) +
        (raidMods.lureBoost || 0) +
        (doctrineEffects.utilityScoutBonus || 0);
      const roomBias =
        (tile.room === "trap" ? archetype.weights.trap + (directive.weights?.trap || 0) : 0) +
        (tile.room === "monster" ? archetype.weights.monster + (directive.weights?.monster || 0) : 0) +
        (tile.room === "utility" ? archetype.weights.utility + (directive.weights?.utility || 0) : 0);
      const progress = Number.isFinite(currentCoreDist) ? currentCoreDist - coreDist : 0;
      const objectiveDist = objectiveTarget ? pathDistance(grid, next, objectiveTarget) : Number.POSITIVE_INFINITY;
      const objectiveProgress = Number.isFinite(currentObjectiveDist) && Number.isFinite(objectiveDist) ? currentObjectiveDist - objectiveDist : 0;
      const objectiveBonus =
        objectiveProgress * 2.2 * (directive.weights?.objective || 1) +
        (objectiveTarget && objectiveTarget.x === next.x && objectiveTarget.y === next.y ? 4 : 0);
      const backtrackPenalty = entity.prev && entity.prev.x === next.x && entity.prev.y === next.y ? archetype.weights.backtrack : 0;
      const revisitPenalty = recentTiles.filter((key) => key === nextKey).length * (1.25 + archetype.weights.backtrack * 0.2);
      const directLoopPenalty = recentTiles.length >= 2 && nextKey === recentTiles[recentTiles.length - 2] ? 12 : 0;
      const longLoopPenalty = recentTiles.length >= 4 && nextKey === recentTiles[recentTiles.length - 4] ? 8 : 0;
      const thresholdPenalty =
        threat > (archetype.dangerThreshold || 99) ? (threat - archetype.dangerThreshold) * 2.5 : 0;
      const score =
        progress * archetype.weights.core * (directive.weights?.core || 1) +
        lure * archetype.weights.lure * (directive.weights?.lure || 1) +
        roomBias +
        objectiveBonus -
        threat * archetype.weights.danger * (directive.weights?.danger || 1) -
        backtrackPenalty -
        revisitPenalty -
        directLoopPenalty -
        longLoopPenalty -
        thresholdPenalty;
      const intent =
        tile.core
          ? "Press Core"
          : tile.room === "monster"
          ? "Pressure monster room"
          : tile.room === "trap"
          ? "Force the trap line"
          : tile.room === "utility"
          ? "Disrupt support"
          : objectiveTarget?.kind === "flank"
          ? "Probe the flank"
          : "Advance";
      return {
        next,
        tile,
        score,
        threat,
        lure,
        coreDist,
        objectiveDist,
        intent,
        revisitPenalty,
        isLoopRisk: directLoopPenalty > 0 || longLoopPenalty > 0,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.coreDist - b.coreDist || a.objectiveDist - b.objectiveDist);
  let best = options[0] || null;
  let loopBreakReason = null;
  if (best && (isBacktrack(best) || best.isLoopRisk)) {
    const forwardAlternatives = options.filter(
      (option) =>
        !isBacktrack(option) &&
        !option.isLoopRisk &&
        (option.coreDist < currentCoreDist || option.objectiveDist < currentObjectiveDist || option.score >= (best.score - 3))
    );
    if (forwardAlternatives.length > 0) {
      best = forwardAlternatives[0];
      loopBreakReason = "Loop avoided";
    }
  }
  const reachedTarget = !!(best && objectiveTarget && best.next.x === objectiveTarget.x && best.next.y === objectiveTarget.y);
  let objectiveTurnsLeft = currentMemory.objectiveTurnsLeft;
  if (objectiveChanged) {
    objectiveTurnsLeft = objectiveCommitTurns;
  } else if (objectiveTurnsLeft > 0) {
    objectiveTurnsLeft -= 1;
  }
  if (reachedTarget) {
    objectiveTurnsLeft = 0;
  }
  let decisionLog = null;
  if (objectiveChanged && objectiveTarget) {
    if (archetype.key === "scout" && objectiveTarget.kind === "flank") {
      decisionLog = `Scout diverts toward flank route ${formatGridPos(objectiveTarget)}.`;
    } else if (archetype.key === "breaker" && objectiveTarget.kind === "monster") {
      decisionLog = `Breaker commits to monster room at ${formatGridPos(objectiveTarget)}.`;
    } else if (archetype.key === "purifier" && objectiveTarget.kind === "support") {
      decisionLog = `Purifier marks support hub at ${formatGridPos(objectiveTarget)}.`;
    } else if (archetype.key === "cautious" && forceRetarget) {
      decisionLog = "Cautious reroutes after trap losses.";
    }
  } else if (archetype.key === "cautious" && forceRetarget) {
    decisionLog = "Cautious reroutes after trap losses.";
  }
  return {
    next: best?.next || null,
    options,
    intent: best ? best.intent : "Hold position",
    lure: best?.lure || 0,
    wasDetour: !!(best && !best.tile.core && best.lure >= 4),
    directiveKey,
    directiveLabel: directive.name,
    currentObjective: objectiveTarget?.label || "Press the Core",
    targetTile: objectiveTarget || null,
    targetTileLabel: objectiveTargetLabel(objectiveTarget),
    objectiveTurnsLeft,
    objectiveChanged,
    loopBreakReason,
    decisionLog,
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
  const [selectedInventoryMonsterIndex, setSelectedInventoryMonsterIndex] = useState("");
  const [brokenTileArt, setBrokenTileArt] = useState({});
  const [brokenCouncilArt, setBrokenCouncilArt] = useState({});
function defaultState() {
    const startingRaid = buildRaidPartyWithIntel(0, null, 1);
    const startingParty = startingRaid.party;
    const dailyEvent = rollDailyEvent();
    const traderStock = generateTraderStock(0, 1);
    const artifacts = [];
    const shadyStock = generateArtifactStock(1, artifacts);
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
      artifacts,
      shadyStock,
      coreHp: getCoreMaxHp({ doctrines: { trap: 0, monster: 0, utility: 0, core: 0 } }),
      coreShield: 0,
      ashTrial: createEmptyAshTrial(),
      ashTributeUntilDay: 0,
      ashMonsterRoomCapUntilDay: 0,
      nihazaCurseUntilDay: 0,
      bonusRoomCapPermanent: 0,
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
      raidIntel: startingRaid.raidIntel,
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
      councilQuestCounters: createEmptyCouncilQuestCounters(),
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
      fleshMarketStock: [],
      boughtUniqueKeys: [],
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
                  .filter((monster) => KNOW_MONSTER_ENTITY(monster))
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
      const savedDay = Math.max(1, parsed.day || base.day || 1);
      const artifacts = normalizeArtifactList(parsed.artifacts || base.artifacts);
      const traderStock = parsed.traderStock || base.traderStock;
      const shadyStock = normalizeArtifactStock(parsed.shadyStock, savedDay, artifacts);
      const doctrines = {
        trap: Math.max(0, parsed.doctrines?.trap || 0),
        monster: Math.max(0, parsed.doctrines?.monster || 0),
        utility: Math.max(0, parsed.doctrines?.utility || 0),
        core: Math.max(0, parsed.doctrines?.core || 0),
      };
      const dominionEffects = parsed.dominionEffects || base.dominionEffects;
      const evolutionOffer = parsed.evolutionOffer || base.evolutionOffer;
      const coreShield = Number.isFinite(parsed.coreShield) ? parsed.coreShield : base.coreShield;
      const dungeonLevel = clampDungeonLevel(parsed.dungeonLevel ?? base.dungeonLevel ?? 1);
      const councilRaw = parsed.council || base.council;
      const council = {
        active: !!councilRaw.active,
        day: councilRaw.day ?? null,
        roster: Array.isArray(councilRaw.roster) ? councilRaw.roster : [],
        lastRoster: Array.isArray(councilRaw.lastRoster) ? councilRaw.lastRoster : [],
        declinedStreak: Number.isFinite(councilRaw.declinedStreak) ? councilRaw.declinedStreak : 0,
      };
      const councilFavor = normalizeCouncilFavorMap(parsed.councilFavor && typeof parsed.councilFavor === "object" ? parsed.councilFavor : {});
      const ashTrial = normalizeAshTrial(parsed.ashTrial, savedDay);
      const ashTributeUntilDay = Number.isFinite(parsed.ashTributeUntilDay) ? parsed.ashTributeUntilDay : 0;
      const ashMonsterRoomCapUntilDay = Number.isFinite(parsed.ashMonsterRoomCapUntilDay) ? parsed.ashMonsterRoomCapUntilDay : 0;
      const nihazaCurseUntilDay = Number.isFinite(parsed.nihazaCurseUntilDay) ? parsed.nihazaCurseUntilDay : 0;
      const bonusRoomCapPermanent = Math.max(0, parsed.bonusRoomCapPermanent || 0);
      const coreHp = Math.min(
        Number.isFinite(parsed.coreHp) ? parsed.coreHp : base.coreHp,
        getCoreMaxHp({ doctrines, day: savedDay, nihazaCurseUntilDay })
      );
      const nextRaidType = parsed.nextRaidType || base.nextRaidType;
      const pendingPunitiveRaid =
        !!parsed.pendingPunitiveRaid || (council.declinedStreak >= 2 && nextRaidType === "council");
      const pendingCouncilRaid =
        parsed.pendingCouncilRaid ||
        (pendingPunitiveRaid && council.roster?.length ? buildCouncilRaidFromRoster(council.roster, parsed.day || base.day, councilFavor) : null);
      const currentPartyRaidType = parsed.currentPartyRaidType || null;
      const councilQuestCounters = createEmptyCouncilQuestCounters();
      for (const key of COUNCIL_QUEST_COUNTER_KEYS) {
        const value = parsed.councilQuestCounters?.[key];
        councilQuestCounters[key] = Number.isFinite(value) ? Math.max(0, value) : 0;
      }
      let councilSession = parsed.councilSession || base.councilSession;
      if (councilSession && Array.isArray(council.roster) && council.roster.length > 0) {
        councilSession = rebuildCouncilSessionWithFavor(councilSession, council.roster, councilSession.day || savedDay, councilFavor);
      } else if (!Array.isArray(councilSession?.sponsors)) {
        councilSession = null;
      }
      const councilQuest =
        parsed.councilQuest && (parsed.councilQuest.metricKey || parsed.councilQuest.questType === "ash-breach-trial")
          ? {
              ...parsed.councilQuest,
              progress:
                parsed.councilQuest.questType === "ash-breach-trial"
                  ? Math.max(0, ashTrial.raidsCompleted || parsed.councilQuest.progress || 0)
                  : Math.max(0, councilQuestCounters[parsed.councilQuest.metricKey] || parsed.councilQuest.progress || 0),
            }
          : base.councilQuest;
      const boughtUniqueKeys = normalizeBoughtUniqueKeys(parsed.boughtUniqueKeys);
      const nextRaidBoons = Array.isArray(parsed.nextRaidBoons) ? parsed.nextRaidBoons.filter(Boolean) : [];
      const activeRaidBoons = Array.isArray(parsed.activeRaidBoons) ? parsed.activeRaidBoons.filter(Boolean) : [];
      const normalizeHeroList = (list, raidType = null) =>
        Array.isArray(list) ? list.filter(Boolean).map((hero) => normalizeHeroEntity(hero, savedDay, raidType)) : [];
      const normalizedCurrentParty = normalizeHeroList(parsed.currentParty, currentPartyRaidType);
      const normalizedHeroes = normalizeHeroList(parsed.heroes, parsed.raidType || currentPartyRaidType);
      const normalizedPartyQueue = normalizeHeroList(parsed.partyQueue, currentPartyRaidType);
      const normalizedScoutQueue = normalizeHeroList(parsed.scoutQueue, currentPartyRaidType);
      const raidDirectiveFallback =
        normalizedCurrentParty[0]?.raidDirectiveKey ||
        normalizedHeroes[0]?.raidDirectiveKey ||
        resolveRaidDirectiveKey(parsed.raidType || currentPartyRaidType || nextRaidType, pendingCouncilRaid, savedDay);
      const raidLeaderFallback =
        normalizedCurrentParty.find((hero) => hero.isRaidLeader)?.id ||
        normalizedHeroes.find((hero) => hero.isRaidLeader)?.id ||
        null;
      const raidIntel = normalizeRaidIntel(parsed.raidIntel, raidDirectiveFallback, raidLeaderFallback);
      const fleshMarketUntilDay = parsed.fleshMarketUntilDay || base.fleshMarketUntilDay;
      const fleshMarketStock =
        fleshMarketUntilDay >= savedDay && fleshMarketUntilDay > 0
          ? Array.isArray(parsed.fleshMarketStock) && parsed.fleshMarketStock.length
            ? parsed.fleshMarketStock.filter(Boolean)
            : generateFleshMarketStock(savedDay, boughtUniqueKeys)
          : [];
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
        ashTrial,
        ashTributeUntilDay,
        ashMonsterRoomCapUntilDay,
        nihazaCurseUntilDay,
        bonusRoomCapPermanent,
        dominionEffects,
        evolutionOffer,
        coreHp,
        coreShield,
        dungeonLevel,
        council,
        councilFavor,
        councilSession,
        councilQuest,
        councilQuestCounters,
        fleshMarketUntilDay,
        fleshMarketStock,
        boughtUniqueKeys,
        nextRaidType,
        pendingPunitiveRaid,
        pendingCouncilRaid,
        nextRaidBoons,
        activeRaidBoons,
        currentPartyRaidType,
        raidIntel,
        heroes: normalizedHeroes,
        currentParty: normalizedCurrentParty,
        partyQueue: normalizedPartyQueue,
        scoutQueue: normalizedScoutQueue,
        invMonsters: Array.isArray(parsed.invMonsters)
          ? parsed.invMonsters
              .filter((monster) => KNOW_MONSTER_ENTITY(monster))
              .map((monster) => normalizeMonsterEntity(monster))
          : base.invMonsters,
      };
    } catch {
      return null;
    }
  }

  const [state, setState] = useState(() => loadSavedState() || defaultState());

  function noteBrokenTileArt(src) {
    if (!src) return;
    setBrokenTileArt((prev) => (prev[src] ? prev : { ...prev, [src]: true }));
  }

  function noteBrokenCouncilArt(src) {
    if (!src) return;
    setBrokenCouncilArt((prev) => (prev[src] ? prev : { ...prev, [src]: true }));
  }

  function addCouncilQuestCounter(stateLike, metricKey, amount = 1) {
    if (!metricKey || !Number.isFinite(amount) || amount === 0) return stateLike;
    const counters = {
      ...createEmptyCouncilQuestCounters(),
      ...(stateLike.councilQuestCounters || {}),
    };
    counters[metricKey] = Math.max(0, (counters[metricKey] || 0) + amount);
    const nextState = { ...stateLike, councilQuestCounters: counters };
    if (nextState.councilQuest?.active && nextState.councilQuest.metricKey === metricKey) {
      nextState.councilQuest = {
        ...nextState.councilQuest,
        progress: councilQuestProgressValue(nextState, nextState.councilQuest),
      };
    }
    return nextState;
  }

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
  const absentCouncilMembers = councilSessionActive
    ? COUNCIL_MEMBERS.filter((member) => !councilRoster.some((attendee) => attendee.key === member.key))
    : [];

  useEffect(() => {
    if (!councilRoster.length) return;
    if (!focusedCouncilKey || !councilRoster.some((member) => member.key === focusedCouncilKey)) {
      setFocusedCouncilKey(councilRoster[0].key);
    }
  }, [councilRoster, focusedCouncilKey]);

  const { entrance, core } = useMemo(() => findEntranceAndCore(state.grid), [state.grid]);
  const activeEntrances = useMemo(() => getActiveEntrances(state.grid, state.ashTrial), [state.grid, state.ashTrial]);
  const validation = useMemo(() => validateDungeon(state.grid, state.ashTrial), [state.grid, state.ashTrial]);
  const roomsPlaced = useMemo(() => countRooms(state.grid), [state.grid]);
  const doctrineEffects = useMemo(() => getDoctrineEffects(state.doctrines || {}), [state.doctrines]);
  const artifactMods = useMemo(() => calcArtifactMods(state.artifacts, state.day), [state.artifacts, state.day]);
  const ownedArtifactCounts = useMemo(() => countOwnedArtifacts(state.artifacts), [state.artifacts]);
  const contentWarnings = useMemo(() => validateGameContent(), []);
  const coreMaxHp = useMemo(() => getCoreMaxHp(state), [state.doctrines, state.nihazaCurseUntilDay, state.day]);
  const dungeonLevel = clampDungeonLevel(state.dungeonLevel);
  const maxRooms = getDungeonRoomCap(state);

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
  const selectedMonsterRoomCapValue = selectedTile.room === "monster" ? effectiveMonsterRoomCapValue(state, selectedTile.roomTier || 1) : 0;
  const canManageSelectedMonsterRoom = isBuildPhase && !state.movePayload && selectedTile.room === "monster";
  const selectedMonsterRoomHasSpace = canManageSelectedMonsterRoom && selectedTile.monsters.length < selectedMonsterRoomCapValue;
  const fusionFirst = fuseA === "" ? null : state.invMonsters[Number(fuseA)] || null;
  const fusionSecond = fuseB === "" ? null : state.invMonsters[Number(fuseB)] || null;
  const fusionPreview =
    fusionFirst && fusionSecond && fusionFirst !== fusionSecond
      ? {
          recipe: fusionRecipeForMonster(fusionSecond),
          cost: fusionCost(fusionFirst, fusionSecond),
          result: buildFusedMonsterEntity(fusionFirst, fusionSecond, state.day),
        }
      : null;

  useEffect(() => {
    if (!canManageSelectedMonsterRoom) {
      if (selectedInventoryMonsterIndex !== "") setSelectedInventoryMonsterIndex("");
      return;
    }
    if (selectedInventoryMonsterIndex !== "" && !state.invMonsters[Number(selectedInventoryMonsterIndex)]) {
      setSelectedInventoryMonsterIndex("");
    }
  }, [canManageSelectedMonsterRoom, selectedInventoryMonsterIndex, state.invMonsters]);

  const ownedArtifactGroups = useMemo(() => {
    const groups = new Map();
    for (const rawArtifact of state.artifacts || []) {
      const artifact = hydrateArtifactDefinition(rawArtifact);
      if (!artifact?.key) continue;
      const existing = groups.get(artifact.key);
      if (existing) {
        existing.count += 1;
      } else {
        groups.set(artifact.key, { artifact, count: 1 });
      }
    }
    return Array.from(groups.values()).sort((a, b) => a.artifact.name.localeCompare(b.artifact.name));
  }, [state.artifacts]);

  function setSelected(x, y) {
    if (locked) return;
    setState((s) => {
      if (s.movePayload) {
        const grid = cloneGrid(s.grid);
        const t = grid[y][x];
        if (t.entrance) return addLog(s, "Cannot move onto the Entrance.");
        if (isAshBreachAt(s.ashTrial, x, y)) return addLog(s, "Cannot move onto an Ash Breach.");
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
          t.trapChargesRemaining = payload.trap
            ? trapChargesForTile(grid, t, x, y, getDoctrineEffects(s.doctrines), calcArtifactMods(s.artifacts, s.day))
            : 0;
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
      if (isAshBreachAt(s.ashTrial, s.selected.x, s.selected.y)) return addLog(s, "Ash Breaches cannot be cleared while the trial is active.");

      const artifactMods = calcArtifactMods(s.artifacts, s.day);
      const invMonsters = [...s.invMonsters, ...t.monsters.map((m) => prepareMonsterForInventory({ ...m }, artifactMods))];

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
      if (isAshBreachAt(s.ashTrial, s.selected.x, s.selected.y)) return addLog(s, "Cannot place the Entrance on an Ash Breach.");
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
      if (isAshBreachAt(s.ashTrial, s.selected.x, s.selected.y)) return addLog(s, "Cannot place the Core on an Ash Breach.");
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

      if (isAshBreachAt(s.ashTrial, s.selected.x, s.selected.y)) return addLog(s, "Ash Breach tiles cannot hold rooms.");
      if (t.entrance || t.core) return addLog(s, "Cannot build on Entrance/Core.");
      if (t.room) return addLog(s, "That tile already has a room.");
      const cap = getDungeonRoomCap(s);
      if (countRooms(grid) >= cap) return addLog(s, `Room limit reached (${cap}).`);

      const trapStar = rollAuthoritativeStar(s.day);
      t.room = "trap";
      t.roomTier = 1;
      t.trap = true;
      t.trapType = s.selectedTrapType;
      t.trapStar = trapStar;
      t.trapStars = trapStar;
      t.trapRank = 1;
      t.trapChargesRemaining = trapChargesForTile(grid, t, s.selected.x, s.selected.y, getDoctrineEffects(s.doctrines), calcArtifactMods(s.artifacts, s.day));
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

      if (isAshBreachAt(s.ashTrial, s.selected.x, s.selected.y)) return addLog(s, "Ash Breach tiles cannot hold rooms.");
      if (t.entrance || t.core) return addLog(s, "Cannot build on Entrance/Core.");
      if (t.room) return addLog(s, "That tile already has a room.");
      const cap = getDungeonRoomCap(s);
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

      if (isAshBreachAt(s.ashTrial, s.selected.x, s.selected.y)) return addLog(s, "Ash Breach tiles cannot hold rooms.");
      if (t.entrance || t.core) return addLog(s, "Cannot build on Entrance/Core.");
      if (t.room) return addLog(s, "That tile already has a room.");
      const cap = getDungeonRoomCap(s);
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
        t.trapChargesRemaining = trapChargesForTile(grid, t, s.selected.x, s.selected.y, getDoctrineEffects(s.doctrines), calcArtifactMods(s.artifacts, s.day));
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
      const picked = pickWeightedMonsterDef(s.day);
      const previewMonster = generateMonster(picked?.key || MONSTER_KEYS[0], s.turnsSurvived, undefined, s.day);
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
    const baseRace = monster.race || getMonsterBaseData(monster.key)?.name || "Monster";
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
      let ns = { ...s, grid, invMonsters, currency, evolutionOffer: null };
      ns = addCouncilQuestCounter(ns, "evolutionSpentSinceCouncil", cost);
      ns = addCouncilQuestCounter(ns, "monsterEvolutionCount", 1);
      return addLog(
        ns,
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

  function placeInventoryMonsterInSelectedRoom(index) {
    if (locked) return;
    if (!isBuildPhase) {
      setState((s) => addLog(s, "You can only staff rooms during the build phase."));
      return;
    }
    if (state.movePayload) {
      setState((s) => addLog(s, "Finish moving before changing room staff."));
      return;
    }
    setState((s) => {
      if (!Number.isFinite(index)) return addLog(s, "Choose a monster from inventory first.");
      const grid = cloneGrid(s.grid);
      const t = grid[s.selected.y][s.selected.x];
      if (t.room !== "monster") return addLog(s, "Select a monster room first.");
      const cap = effectiveMonsterRoomCapValue(s, t.roomTier || 1);
      if (t.monsters.length >= cap) return addLog(s, `Monster room is full (max ${cap}).`);
      if (s.invMonsters.length <= 0) return addLog(s, "No monsters in inventory.");
      const invMonsters = [...s.invMonsters];
      const target = invMonsters[index];
      if (!target) return addLog(s, "That inventory monster is no longer available.");

      const monster = applyMonsterRoomPlacement(target, t.roomType, t.roomTier);
      t.monsters.push(monster);
      invMonsters.splice(index, 1);
      return addLog({ ...s, grid, invMonsters }, `Placed ${monster.name} in room.`);
    });
  }

  function addMonsterToRoom() {
    placeInventoryMonsterInSelectedRoom(selectedInventoryMonsterIndex === "" ? Number.NaN : Number(selectedInventoryMonsterIndex));
  }

  function returnMonsterFromSelectedRoom(index) {
    if (locked) return;
    if (!isBuildPhase) {
      setState((s) => addLog(s, "You can only withdraw room staff during the build phase."));
      return;
    }
    if (state.movePayload) {
      setState((s) => addLog(s, "Finish moving before changing room staff."));
      return;
    }
    setState((s) => {
      if (!Number.isFinite(index)) return s;
      const grid = cloneGrid(s.grid);
      const t = grid[s.selected.y][s.selected.x];
      if (t.room !== "monster") return addLog(s, "Select a monster room first.");
      const target = t.monsters[index];
      if (!target) return addLog(s, "That monster is no longer in the room.");
      const artifactMods = calcArtifactMods(s.artifacts, s.day);
      const invMonsters = [...s.invMonsters, prepareMonsterForInventory({ ...target }, artifactMods)];
      t.monsters.splice(index, 1);
      return addLog({ ...s, grid, invMonsters }, `Returned ${target.name} to inventory.`);
    });
  }

  function returnAllMonstersFromSelectedRoom() {
    if (locked) return;
    if (!isBuildPhase) {
      setState((s) => addLog(s, "You can only withdraw room staff during the build phase."));
      return;
    }
    if (state.movePayload) {
      setState((s) => addLog(s, "Finish moving before changing room staff."));
      return;
    }
    setState((s) => {
      const grid = cloneGrid(s.grid);
      const t = grid[s.selected.y][s.selected.x];
      if (t.room !== "monster") return addLog(s, "Select a monster room first.");
      if (!t.monsters.length) return addLog(s, "That room has no monsters to withdraw.");
      const artifactMods = calcArtifactMods(s.artifacts, s.day);
      const returned = t.monsters.map((monster) => prepareMonsterForInventory({ ...monster }, artifactMods));
      const count = returned.length;
      const invMonsters = [...s.invMonsters, ...returned];
      t.monsters = [];
      return addLog({ ...s, grid, invMonsters }, `Returned ${count} monster${count === 1 ? "" : "s"} to inventory.`);
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
      const currentLevel = clampDungeonLevel(s.dungeonLevel);
      if (currentLevel >= MAX_DUNGEON_LEVEL) {
        return addLog(s, `Dungeon already at maximum level (${MAX_DUNGEON_LEVEL}).`);
      }
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
        const nextMax = getCoreMaxHp({ ...s, doctrines });
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
          t.trapChargesRemaining = trapChargesForTile(grid, t, s.selected.x, s.selected.y, getDoctrineEffects(s.doctrines), calcArtifactMods(s.artifacts, s.day));
          t.trapCooldownRemaining = 0;
        }
      }
      if (t.room === "monster") {
        t.monsters = t.monsters.map((monster) => applyMonsterRoomPlacement(monster, t.roomType, nextTier));
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
      const target = hydrateArtifactDefinition(stock[idx]);
      if (!target) return s;
      const rawCost = target.cost || { currency: "soulshards", amount: 0 };
      const cost = { ...rawCost };
      const currency = { ...s.currency };
      if (currency[cost.currency] < cost.amount) {
        return addLog(s, `Not enough ${cost.currency}.`);
      }
      const ownedCount = countOwnedArtifacts(s.artifacts)[target.key] || 0;
      const copyCap = artifactCopyCap(target);
      if (ownedCount >= copyCap) {
        return addLog(s, `${target.name} is already at its copy limit.`);
      }
      currency[cost.currency] -= cost.amount;
      stock.splice(idx, 1);
      const artifacts = [...s.artifacts, target];
      const nextOwnedCount = ownedCount + 1;
      const shadyStock = stock.filter((offer) => offer?.key !== target.key || nextOwnedCount < artifactCopyCap(offer));
      return addLog({ ...s, currency, shadyStock, artifacts }, `Bought ${target.name} for ${cost.amount} ${cost.currency}.`);
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
      const stagedRaid = buildRaidPartyWithIntel(s.turnsSurvived, raidType, s.day, {
        councilRaid: s.pendingCouncilRaid,
        raidBoons: s.nextRaidBoons,
      });
      const party = stagedRaid.party;
      let scoutQueue = [];
      const doctrineEffects = getDoctrineEffects(s.doctrines);
      const raidMods = buildRaidModifiers(s.nextRaidBoons);
      const artifactMods = calcArtifactMods(s.artifacts, s.day);
      const baseMirrorTier = maxUtilityTier(s.grid, "scout-mirror");
      const mirrorTier =
        baseMirrorTier > 0
          ? baseMirrorTier +
            doctrineEffects.utilityPotencyBonus +
            doctrineEffects.utilityPotencyBonusExtra +
            doctrineEffects.utilityScoutBonus +
            (artifactMods.utilityPotencyBonus || 0)
          : 0;
      const revealBase = (artifactMods.scoutRevealBonus || 0) + huntScoutRevealBonus(s.grid, artifactMods);
      if (mirrorTier > 0 || revealBase > 0) {
        const revealCount = Math.min(party.length, revealBase + (mirrorTier > 0 ? 2 + (mirrorTier - 1) + raidMods.scoutRevealBonus : 0));
        scoutQueue = party.slice(0, revealCount).map((h) => ({ ...h }));
      }
      let ns = {
        ...s,
        phase: "battle",
        currentParty: party,
        currentPartyRaidType: raidType || null,
        partyQueue: party.map((h) => ({ ...h })),
        scoutQueue,
        raidIntel: stagedRaid.raidIntel,
      };
      if (scoutQueue.length > 0) {
        ns = addCouncilQuestCounter(ns, "revealedInvaderCount", scoutQueue.length);
      }
      const meta = raidTypeMeta(raidType, s.pendingCouncilRaid);
      ns = addLog(ns, `Day ${s.day} battle begins. ${meta.label}. Party size ${party.length}.`);
      ns = addLog(ns, meta.desc);
      ns = addLog(ns, `Raid directive: ${getRaidDirectiveRule(stagedRaid.directiveKey).name}.`);
        if (scoutQueue.length > 0) {
          const previews = scoutQueue
          .map((h) => `${h.name}${h.isRaidLeader ? " [Leader]" : ""} (${formatStars(safeEntityStars(h))}, ATK ${h.atk}, HP ${h.hp})`)
          .join(" | ");
        ns = addLog(ns, `Scout report: ${previews}`);
      }
      return ns;
    });
  }

  function spawnOneHero(heroes, nextId, entranceOptions, turnsSurvived, queueIn, grid, raidType, day = 1) {
    let queue = queueIn ? [...queueIn] : [];
    const spawnFrom = Array.isArray(entranceOptions) ? pickSpawnEntrance(grid, { active: true, breaches: entranceOptions.filter((entry) => entry.kind === "ash-breach") }) : entranceOptions;
    if (!spawnFrom) return { nextHeroId: nextId, scoutQueue: queue, spawned: null, entrance: null };
    let hero;
    if (queue.length > 0) {
      hero = { ...queue.shift() };
      hero.x = spawnFrom.x;
      hero.y = spawnFrom.y;
    } else {
      hero = generateHero(nextId, spawnFrom, turnsSurvived, raidType, day);
    }
    if (grid && hasUtilityAura(grid, hero.x, hero.y, "fear-idol")) {
      hero.statuses = hero.statuses || {};
      hero.statuses.fear = { turns: 2, value: 1 };
    }
    heroes.push(hero);
    const nextHeroId = Math.max(nextId, hero.id + 1);
    return { nextHeroId, scoutQueue: queue, spawned: hero, entrance: spawnFrom };
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

      const entrances = getActiveEntrances(s.grid, s.ashTrial);
      if (!entrances.length) return addLog(s, "Place an Entrance first.");

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
              t.trapChargesRemaining = trapChargesForTile(grid, t, x, y, getDoctrineEffects(s.doctrines), calcArtifactMods(s.artifacts, s.day));
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
      const stagedRaid = reuseParty
        ? {
            directiveKey:
              s.raidIntel?.directive || s.currentParty?.[0]?.raidDirectiveKey || resolveRaidDirectiveKey(raidType, s.pendingCouncilRaid, s.day),
            party: s.currentParty,
            raidIntel: normalizeRaidIntel(
              s.raidIntel,
              s.currentParty?.[0]?.raidDirectiveKey || resolveRaidDirectiveKey(raidType, s.pendingCouncilRaid, s.day),
              s.currentParty?.find((hero) => hero.isRaidLeader)?.id || null
            ),
          }
        : buildRaidPartyWithIntel(s.turnsSurvived, raidType, s.day, {
            councilRaid: s.pendingCouncilRaid,
            raidBoons: s.nextRaidBoons,
          });
      const party = stagedRaid.party;
      let partyQueue = [...party];
      let raidRemaining = partyQueue.length;
      let raidKills = 0;
      let scoutQueue = [];

      const doctrineEffects = getDoctrineEffects(s.doctrines);
      const artifactModsStart = calcArtifactMods(s.artifacts, s.day);
      const raidMods = buildRaidModifiers(s.nextRaidBoons);
      const baseMirrorTier = maxUtilityTier(s.grid, "scout-mirror");
      const mirrorTier =
        baseMirrorTier > 0
          ? baseMirrorTier +
            doctrineEffects.utilityPotencyBonus +
            doctrineEffects.utilityPotencyBonusExtra +
            doctrineEffects.utilityScoutBonus +
            (artifactModsStart.utilityPotencyBonus || 0)
          : 0;
      const doctrineShield = doctrineEffects.coreShieldBonus || 0;
      const fortifiedCoreShield = (s.coreShield || 0) + doctrineShield + (raidMods.coreShieldBonus || 0) + (artifactModsStart.coreStartShield || 0);
      const revealBase = (artifactModsStart.scoutRevealBonus || 0) + huntScoutRevealBonus(s.grid, artifactModsStart);
      if (mirrorTier > 0 || revealBase > 0) {
        const revealCount = Math.min(
          partyQueue.length,
          revealBase + (mirrorTier > 0 ? 2 + (mirrorTier - 1) + raidMods.scoutRevealBonus : 0)
        );
        scoutQueue = partyQueue.slice(0, revealCount).map((h) => ({ ...h }));
      }

      if (heroes.length < HERO_CAP && partyQueue.length > 0) {
        const spawnResult = spawnOneHero(heroes, nextId, entrances, s.turnsSurvived, partyQueue, grid, raidType, s.day);
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
          raidIntel: stagedRaid.raidIntel,
          raidType: raidType || null,
          nextRaidType: null,
          pendingPunitiveRaid: false,
          pendingCouncilRaid: null,
          nextRaidBoons: [],
          activeRaidBoons: [...(s.nextRaidBoons || [])],
        };
        if (scoutQueue.length > 0 && !reuseParty) {
          ns = addCouncilQuestCounter(ns, "revealedInvaderCount", scoutQueue.length);
        }
        const meta = raidTypeMeta(raidType, s.pendingCouncilRaid);
        ns = addLog(ns, `Raid directive: ${getRaidDirectiveRule(stagedRaid.directiveKey).name}.`);
        if (doctrineShield > 0) {
          ns = addLog(ns, `Core Doctrine fortifies the Core with +${doctrineShield} Shield.`);
        }
        if (artifactModsStart.coreStartShield > 0) {
          ns = addLog(ns, `${UNIQUE_ARTIFACT_MAP["preserved-heart"]?.name || "Preserved Heart"} adds +${artifactModsStart.coreStartShield} Shield.`);
        }
        if (raidMods.coreShieldBonus > 0) {
          ns = addLog(ns, `Council leverage fortifies the Core with +${raidMods.coreShieldBonus} Shield.`);
        }
        const originLabel = spawnResult.entrance?.kind === "ash-breach" ? `Ash Breach ${formatGridPos(spawnResult.entrance)}` : "the Entrance";
        ns = addLog(ns, `Raid started. ${meta.label}. Party size ${party.length}. ${invaderLabel(spawnResult.spawned)} enters from ${originLabel}.`);
        if (scoutQueue.length > 0) {
          const previews = scoutQueue
            .map((h) => `${h.name}${h.isRaidLeader ? " [Leader]" : ""} (${formatStars(safeEntityStars(h))}, ATK ${h.atk}, HP ${h.hp})`)
            .join(" | ");
          ns = addLog(ns, `Scout report: ${previews}`);
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
        raidIntel: stagedRaid.raidIntel,
        raidType: raidType || null,
        nextRaidType: null,
        pendingPunitiveRaid: false,
        pendingCouncilRaid: null,
        nextRaidBoons: [],
        activeRaidBoons: [...(s.nextRaidBoons || [])],
      };
      if (scoutQueue.length > 0 && !reuseParty) {
        ns = addCouncilQuestCounter(ns, "revealedInvaderCount", scoutQueue.length);
      }
      const meta = raidTypeMeta(raidType, s.pendingCouncilRaid);
      ns = addLog(ns, `Raid directive: ${getRaidDirectiveRule(stagedRaid.directiveKey).name}.`);
      if (doctrineShield > 0) {
        ns = addLog(ns, `Core Doctrine fortifies the Core with +${doctrineShield} Shield.`);
      }
      if (artifactModsStart.coreStartShield > 0) {
        ns = addLog(ns, `${UNIQUE_ARTIFACT_MAP["preserved-heart"]?.name || "Preserved Heart"} adds +${artifactModsStart.coreStartShield} Shield.`);
      }
      if (raidMods.coreShieldBonus > 0) {
        ns = addLog(ns, `Council leverage fortifies the Core with +${raidMods.coreShieldBonus} Shield.`);
      }
      ns = addLog(ns, `Raid started. ${meta.label}. Party size ${party.length}. (Cap reached; no spawn yet.)`);
      if (scoutQueue.length > 0) {
        const previews = scoutQueue
          .slice(0, 2)
          .map((h) => `${h.name}${h.isRaidLeader ? " [Leader]" : ""} (${formatStars(safeEntityStars(h))}, ATK ${h.atk}, HP ${h.hp})`)
          .join(" | ");
        ns = addLog(ns, `Scout report: ${previews}`);
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

    const v = validateDungeon(state.grid, state.ashTrial);
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
      const raidMods = buildRaidModifiers(raidBoons);
      let raidIntel = normalizeRaidIntel(
        s.raidIntel,
        s.currentParty?.[0]?.raidDirectiveKey || resolveRaidDirectiveKey(s.raidType, s.pendingCouncilRaid, s.day),
        s.currentParty?.find((hero) => hero.isRaidLeader)?.id || null
      );
      let councilQuestCounters = {
        ...createEmptyCouncilQuestCounters(),
        ...(s.councilQuestCounters || {}),
      };
      const raidMult = s.raidType === "council" ? 1.6 : s.raidType === "elite" ? 1.3 : 1;

      let turnsSurvived = s.turnsSurvived;
      let heroesIn = s.heroes;

      const { core: corePos } = findEntranceAndCore(grid);
      const activeEntrancesLocal = getActiveEntrances(grid, s.ashTrial);

      const logLines = [];
      const push = (msg) => logLines.push(msg);

      const dist = (ax, ay, bx, by) => Math.abs(ax - bx) + Math.abs(ay - by);
      const effectiveUtilityTier = (x, y, key) => {
        const baseTier = utilityTier(grid, x, y, key);
        if (baseTier <= 0) return 0;
        return (
          baseTier +
          doctrineEffectsLocal.utilityPotencyBonus +
          doctrineEffectsLocal.utilityPotencyBonusExtra +
          (artifactMods.utilityPotencyBonus || 0)
        );
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
      const shareRaidDanger = (x, y, amount = 1) => {
        const key = keyOf(x, y);
        const sharedAmount = Math.max(1, Math.round(amount)) + (s.raidType === "elite" ? 1 : 0);
        raidIntel = {
          ...raidIntel,
          dangerTiles: {
            ...(raidIntel.dangerTiles || {}),
            [key]: Math.min(16, (raidIntel.dangerTiles?.[key] || 0) + sharedAmount),
          },
        };
      };
      const rememberDanger = (h, x, y, amount = 1, share = false) => {
        h.memory = createHeroMemory(h.memory);
        const key = keyOf(x, y);
        h.memory.danger[key] = Math.min(12, (h.memory.danger[key] || 0) + Math.max(1, Math.round(amount)));
        if (share) shareRaidDanger(x, y, amount);
      };
      const markRaidHub = (x, y, kind) => {
        const key = keyOf(x, y);
        if (kind === "trap") {
          raidIntel = { ...raidIntel, trapHubs: mergeRaidIntelKey(raidIntel.trapHubs, key) };
        } else if (kind === "utility") {
          raidIntel = { ...raidIntel, utilityHubs: mergeRaidIntelKey(raidIntel.utilityHubs, key) };
        } else if (kind === "monster") {
          raidIntel = { ...raidIntel, monsterHubs: mergeRaidIntelKey(raidIntel.monsterHubs, key) };
        }
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
        if (key === "poison") {
          h.counters = h.counters || {};
          h.counters.poisonedThisRaid = true;
        }
        if (label) push(label);
        return true;
      };

      const effectiveHeroSpd = (h) => {
        let spd = Math.max(1, h.spd || 1);
        if (getStatus(h, "slow").turns > 0 && !heroHasPassive(h, "Quick")) spd -= 1;
        if (heroHasPassive(h, "Quick")) spd += 1;
        return Math.max(1, spd);
      };

      const effectiveMonsterSpd = (monster, x, y) => {
        let spd = monsterSpeedValue(monster);
        const room = grid[y]?.[x];
        const hasteTier = effectiveUtilityTier(x, y, "haste-glyph");
        if (hasteTier > 0) spd += hasteTier;
        if (room?.room === "monster" && room.roomType === "pack-blind") spd += 1;
        if (dominionEffects.monsterFirstStrike) spd += 2;
        return Math.max(1, spd);
      };

      const ensureMonsterGuard = (monster, room, x, y) => {
        monster.statuses = monster.statuses || {};
        if (monster.shieldedThisTurn) return;
        let guardValue = 0;
        const classLabel = String(monster.branchClass || monster.class || "").toLowerCase();
        if (["tank", "warden", "knight"].some((tag) => classLabel.includes(tag))) guardValue += 1;
        if (monsterHasPassive(monster, "bulwark")) guardValue += monsterPassiveRank(monster, "bulwark");
        if (room.roomType === "brawlers-ring") guardValue += 2;
        if (room.roomType === "bulwark-hall") guardValue += 1;
        if (orthogonalUtilityTier(grid, x, y, "aegis-lantern") > 0) guardValue += 1;
        if (guardValue > 0) {
          monster.statuses.guard = {
            turns: 1,
            value: Math.max(getStatus(monster, "guard").value || 0, guardValue),
          };
        }
      };

      let kills = 0;
      function heroDies(h, why) {
        const essenceGain = Math.round(HERO_KILL_ESSENCE * (eventMods.essenceMult || 1) * raidMult);
        const shardGain = Math.round(HERO_KILL_SOULSHARDS * (eventMods.soulshardMult || 1) * raidMult);
        const extraEssence = artifactMods.essenceOnKill || 0;
        const extraShards = artifactMods.soulshardOnKill || 0;
        const ashTributeGain = isTimedBlessingActive(s.ashTributeUntilDay, s.day) ? 3 : 0;
        const trapKillEssence = why === "trap" || why === "arrows" ? artifactMods.trapKillEssence || 0 : 0;
        const linkedBlood = bloodDeathBonuses(grid, h.x, h.y, why, artifactMods);
        essence += essenceGain + extraEssence + trapKillEssence + linkedBlood.extraEssence;
        soulshards += shardGain + extraShards + linkedBlood.extraSoulshards;
        kills += 1;
        const markedValue = getStatus(h, "marked").turns > 0 ? getStatus(h, "marked").value || 0 : h.counters?.cursedMark || 0;
        if (markedValue) {
          const curseGain = Math.round(markedValue * (eventMods.essenceMult || 1));
          essence += curseGain;
          push(`Cursed Brand triggers on ${invaderLabel(h)}. +${curseGain} Essence`);
        }
        const altarTier = effectiveUtilityTier(h.x, h.y, "soul-altar");
        if (altarTier > 0) {
          const altarGain = 15 + (altarTier - 1) * 5;
          essence += Math.round(altarGain * (eventMods.essenceMult || 1));
          push(`Soul Altar feeds on ${invaderLabel(h)}. +${altarGain} Essence`);
        }
        if (ashTributeGain > 0) {
          essence += ashTributeGain;
          push(`Ash Tribute consumes ${invaderLabel(h)}. +${ashTributeGain} Essence`);
        }
        const totalEssence = essenceGain + extraEssence + trapKillEssence + linkedBlood.extraEssence;
        const totalShards = shardGain + extraShards + linkedBlood.extraSoulshards;
        const deathTile = grid[h.y]?.[h.x];
        if (why === "trap" || why === "arrows") {
          councilQuestCounters.trapKillCount += 1;
        }
        if (h.counters?.trapDamaged || h.counters?.poisonedThisRaid) {
          councilQuestCounters.trapOrPoisonKillCount += 1;
        }
        if (deathTile?.room === "monster" && why !== "trap" && why !== "arrows") {
          councilQuestCounters.monsterRoomKillCount += 1;
        }
        if (h.isRaidLeader) {
          councilQuestCounters.highestStarLeaderKillCount += 1;
        }
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
              m.statuses = m.statuses || {};
              if (m.statuses.guard) {
                m.statuses.guard = { turns: 0, value: 0 };
              }
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
        h.counters =
          h.counters || {
            stunnedOnce: false,
            siphonGained: 0,
            tookDamageThisRaid: false,
            cursedMark: 0,
            trapDamaged: false,
            poisonedThisRaid: false,
          };
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
          h.counters =
            h.counters || {
              stunnedOnce: false,
              siphonGained: 0,
              tookDamageThisRaid: false,
              cursedMark: 0,
              trapDamaged: false,
              poisonedThisRaid: false,
            };
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
        bonus += artifactMods.monsterDef || 0;
        bonus += wardMonsterDefBonus(grid, x, y, artifactMods);
        return bonus;
      }

      function trapDamage(tile, base, x, y, extraFlat = 0) {
        if (!base && !extraFlat) return 0;
        const trapStar = clampMonsterStar(tile.trapStar ?? tile.trapStars ?? 1);
        const trapRank = Math.max(1, tile.trapRank ?? tile.roomTier ?? 1);
        let dmg =
          base * (1 + 0.25 * (trapStar - 1)) +
          (trapRank - 1) * 2 +
          extraFlat +
          (doctrineEffectsLocal.trapFlatDamage || 0) +
          (artifactMods.trapFlatDamage || 0) +
          huntTrapFlatDamageBonus(grid, x, y, artifactMods);
        let mult = 1;
        const wardTier = effectiveUtilityTier(x, y, "ward-lantern");
        if (wardTier > 0) mult += 0.25 + 0.05 * (wardTier - 1);
        if (artifactMods.trapMult) mult += artifactMods.trapMult;
        if (raidMods.trapDamageMult) mult += raidMods.trapDamageMult;
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
          trapDamaged: false,
          poisonedThisRaid: false,
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
          const coreCounter =
            DUNGEON_LORD_ATK +
            (doctrineEffectsLocal.dungeonlordAtkBonus || 0) +
            (raidMods.coreRetaliationBonus || 0) +
            (artifactMods.coreRetaliationBonus || 0);
          const coreDmg = applyHeroDamage(h, coreCounter, h.x, h.y, true);
          push(
            `${invaderLabel(h)} hits Core for ${heroAtk}. Core HP ${Math.max(0, coreHp)}. Core retaliates for ${coreDmg} (${DUNGEON_LORD_ATK}${doctrineEffectsLocal.dungeonlordAtkBonus ? `+${doctrineEffectsLocal.dungeonlordAtkBonus}` : ""}${raidMods.coreRetaliationBonus ? `+${raidMods.coreRetaliationBonus}` : ""}${artifactMods.coreRetaliationBonus ? `+${artifactMods.coreRetaliationBonus}` : ""}). ${invaderLabel(h)} HP ${Math.max(0, h.hp)}`
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
          ensureMonsterGuard(m, t, h.x, h.y);
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
          const monsterSpd = effectiveMonsterSpd(m, h.x, h.y);
          const heroSpd = effectiveHeroSpd(h);
          const monsterActsFirst =
            effectiveUtilityTier(h.x, h.y, "haste-glyph") > 0 ||
            dominionEffects.monsterFirstStrike ||
            roomHasPassive(t, "swift") ||
            monsterSpd >= heroSpd;

          const heroStrike = () => {
            const def = (m.def || 0) + monsterDefBonus(h.x, h.y) + tempDefBonus;
            let dmg = Math.max(1, heroAtk - def);
            let mitigation = heroAtk - dmg;
            const guard = getStatus(m, "guard");
            if (guard.turns > 0 && !m.shieldedThisTurn) {
              mitigation += guard.value || 1;
              dmg = Math.max(0, dmg - (guard.value || 1));
              m.shieldedThisTurn = true;
              m.statuses.guard = { turns: 0, value: 0 };
            }
            if (monsterHasPassive(m, "thorns")) {
              applyHeroDamage(h, monsterPassiveRank(m, "thorns"), h.x, h.y, false);
            }
            m.hp -= dmg;
            return { dmg, base: heroAtk, defense: def, mitigation };
          };

          const monsterStrike = () => {
            let bonus = 0;
            if (monsterHasPassive(m, "savage")) bonus += 2 * monsterPassiveRank(m, "savage");
            if ((normalizePassiveKeysForMonster(m).length || 0) >= 2) {
              bonus += artifactMods.multiPassiveAtkBonus || 0;
            }
            if (h.counters?.trapDamaged) {
              bonus += artifactMods.trapDamageVulnerability || 0;
            }
            if (t.roomType === "pack-blind" && isLinkedRoom(grid, h.x, h.y) && h.hp < safeEntityMaxHp(h)) {
              bonus += 1;
            }
            if (getStatus(m, "bloodlust").turns > 0) {
              bonus += getStatus(m, "bloodlust").value || 1;
            }
            const totalBase = monsterAtk + bonus;
            const defense = heroDefValue(h);
            const dmg = applyHeroDamage(h, totalBase, h.x, h.y, true);
            if (dmg >= 4) {
              rememberDanger(h, h.x, h.y, Math.max(2, Math.round(dmg / 3)), true);
            }
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
          markRaidHub(h.x, h.y, "monster");

          if (t.roomType === "ambush-alcove" && !t.ambushUsed) {
            const ambush = monsterStrike();
            t.ambushUsed = true;
            push(`Ambush! ${m.name} -> ${invaderLabel(h)}: base ${ambush.base}, DEF ${ambush.defense}, final ${ambush.dmg}. HP ${Math.max(0, h.hp)}`);
            if (h.hp <= 0) {
              if (t.roomType === "carnage-pit") setStatus(m, "bloodlust", 1, 1);
              heroDies(h, "ambushed");
              continue;
            }
          }

          if (monsterActsFirst) {
            const hitOnInvader = monsterStrike();
            if (hitOnInvader.dmg > 0) {
              push(`${m.name} -> ${invaderLabel(h)}: base ${hitOnInvader.base}, DEF ${hitOnInvader.defense}, final ${hitOnInvader.dmg}. HP ${Math.max(0, h.hp)} | SPD ${monsterSpd} vs ${heroSpd}`);
            }
            if (h.hp <= 0) {
              if (t.roomType === "carnage-pit") setStatus(m, "bloodlust", 1, 1);
              heroDies(h, "killed in battle");
              continue;
            }
            const hitOnMonster = heroStrike();
            push(`${invaderLabel(h)} -> ${m.name}: base ${hitOnMonster.base}, DEF ${hitOnMonster.defense}, mitigation ${hitOnMonster.mitigation}, final ${hitOnMonster.dmg}. ${m.name} HP ${Math.max(0, m.hp)}`);
          } else {
            const hitOnMonster = heroStrike();
            push(`${invaderLabel(h)} -> ${m.name}: base ${hitOnMonster.base}, DEF ${hitOnMonster.defense}, mitigation ${hitOnMonster.mitigation}, final ${hitOnMonster.dmg}. ${m.name} HP ${Math.max(0, m.hp)} | SPD ${heroSpd} vs ${monsterSpd}`);
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
            if (h.hp < safeEntityMaxHp(h)) {
              shareRaidDanger(h.x, h.y, 2);
            }
          }

          if (h.hp <= 0) {
            if (t.roomType === "carnage-pit") setStatus(m, "bloodlust", 1, 1);
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
          const moveChoice = chooseInvaderMove(h, grid, corePos, raidBoons, doctrineEffectsLocal, raidIntel, artifactMods);
          if (moveChoice.decisionLog) {
            push(moveChoice.decisionLog);
          }
          if (moveChoice.next) {
            const next = moveChoice.next;
            h.prev = { x: h.x, y: h.y };
            h.x = next.x;
            h.y = next.y;
            h.memory = createHeroMemory(h.memory);
            h.memory.lastIntent = moveChoice.intent;
            h.memory.currentObjective = moveChoice.currentObjective;
            h.memory.objectiveTurnsLeft = moveChoice.objectiveTurnsLeft;
            h.memory.targetTile = moveChoice.targetTile
              ? {
                  x: moveChoice.targetTile.x,
                  y: moveChoice.targetTile.y,
                  kind: moveChoice.targetTile.kind || null,
                  label: moveChoice.targetTile.label || null,
                }
              : null;
            h.memory.lastLoopBreak = moveChoice.loopBreakReason || null;
            h.memory.recentTiles = [...(h.memory.recentTiles || []), keyOf(h.x, h.y)].slice(-6);
            moved = true;
            if (moveChoice.wasDetour) {
              councilQuestCounters.detourCount += 1;
            }
            push(`${invaderLabel(h)} moves to (${h.x + 1},${h.y + 1}) - ${moveChoice.intent}${moveChoice.loopBreakReason ? ` | ${moveChoice.loopBreakReason}` : ""}`);
          } else {
            push(`${invaderLabel(h)} waits (no path).`);
          }
        }

        if (moved) {
          applyFearAura();
        }

        // TRAP TRIGGER
        const t2 = grid[h.y][h.x];
        if (moved && t2.room === "trap") markRaidHub(h.x, h.y, "trap");
        if (moved && t2.room === "utility") markRaidHub(h.x, h.y, "utility");
        if (moved && t2.room === "monster" && t2.monsters.length > 0) markRaidHub(h.x, h.y, "monster");
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
              const extraFlat =
                trapKey === "flame-jet" && h.counters.tookDamageThisRaid
                  ? 4
                  : trapKey === "gore-channel" && h.hp < safeEntityMaxHp(h)
                  ? 4
                  : 0;
              let trapDmg = trapDamage(t2, trapBase, h.x, h.y, extraFlat);

              if (heroHasPassive(h, "Keen")) {
                trapDmg = Math.max(0, trapDmg - 1);
              }

              let dealt = 0;
              if (trapDmg > 0) {
                dealt = applyHeroDamage(h, trapDmg, h.x, h.y, false);
                if (dealt > 0) {
                  h.counters.trapDamaged = true;
                  shareRaidDanger(h.x, h.y, Math.max(2, Math.round(dealt / 2)));
                }
              }

              if (trapKey === "poison-vent") {
                const poisonTurns = 3 + Math.floor((trapStar - 1) / 2);
                const poisonValue = 2 + Math.floor((trapStar - 1) / 2);
                if (tryApplyDebuff(h, "poison", poisonTurns, poisonValue)) {
                  shareRaidDanger(h.x, h.y, poisonValue);
                  push(`${invaderLabel(h)} is poisoned.`);
                }
              } else if (trapKey === "warding-sigil") {
                if (tryApplyDebuff(h, "weaken", 2, 1)) {
                  shareRaidDanger(h.x, h.y, 2);
                  push(`${invaderLabel(h)} is weakened.`);
                }
                if (isLinkedRoom(grid, h.x, h.y) && tryApplyDebuff(h, "slow", 1, 1)) {
                  shareRaidDanger(h.x, h.y, 1);
                  push(`${invaderLabel(h)} is slowed by the linked sigil.`);
                }
              } else if (trapKey === "flame-jet") {
                const burnTurns = 2 + Math.floor((trapStar - 1) / 2);
                const burnValue = 2 + Math.floor((trapStar - 1) / 2);
                setStatus(h, "burn", burnTurns, burnValue);
                shareRaidDanger(h.x, h.y, burnValue);
                push(`${invaderLabel(h)} is burning.`);
              } else if (trapKey === "frost-rune") {
                const slowTurns = 2 + Math.floor((trapStar - 1) / 2);
                if (tryApplyDebuff(h, "slow", slowTurns, 1)) {
                  shareRaidDanger(h.x, h.y, 2);
                  push(`${invaderLabel(h)} is slowed.`);
                }
              } else if (trapKey === "shock-coil") {
                if (!h.counters.stunnedOnce) {
                  if (tryApplyDebuff(h, "stun", 1, 1)) {
                    h.counters.stunnedOnce = true;
                    shareRaidDanger(h.x, h.y, 2);
                    push(`${invaderLabel(h)} is stunned.`);
                  }
                }
              } else if (trapKey === "snare-net") {
                const rootTurns = 1 + Math.floor((trapStar - 1) / 2);
                if (tryApplyDebuff(h, "root", rootTurns, 1)) {
                  shareRaidDanger(h.x, h.y, 2);
                  push(`${invaderLabel(h)} is rooted.`);
                }
              } else if (trapKey === "cursed-brand") {
                const markedValue = 10 + (trapRank - 1) * 2 + (trapStar - 1) * 2;
                h.counters.cursedMark = markedValue;
                setStatus(h, "marked", 99, markedValue);
                shareRaidDanger(h.x, h.y, 2);
                push(`${invaderLabel(h)} is marked for death (+${markedValue} Essence).`);
              } else if (trapKey === "blink-trap") {
                const back = h.prev ? { ...h.prev } : null;
                if (back) {
                  const from = { x: h.x, y: h.y };
                  h.x = back.x;
                  h.y = back.y;
                  h.prev = from;
                  shareRaidDanger(from.x, from.y, 2);
                  push(`${invaderLabel(h)} blinks back to (${h.x + 1},${h.y + 1}).`);
                  applyFearAura();
                }
              } else if (trapKey === "arrow-gallery") {
                const arrowDamage = trapDamage(t2, trapBase, h.x, h.y, 0);
                setStatus(h, "arrow", 1, arrowDamage);
                shareRaidDanger(h.x, h.y, Math.max(1, Math.round(arrowDamage / 2)));
                push(`${invaderLabel(h)} is targeted by arrows.`);
              } else if (trapKey === "murder-holes") {
                const arrowDamage = trapDamage({ ...t2, trapType: "arrow-gallery" }, 3, h.x, h.y, 0);
                setStatus(h, "arrow", 1, arrowDamage);
                shareRaidDanger(h.x, h.y, Math.max(1, Math.round(arrowDamage / 2)));
                push(`${invaderLabel(h)} is pinned for follow-up fire.`);
                if (isLinkedRoom(grid, h.x, h.y)) {
                  setStatus(h, "marked", 2, 1);
                  push(`${invaderLabel(h)} is marked by the linked murder holes.`);
                }
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
          shareRaidDanger(h.x, h.y, poisonVal);
          push(`${invaderLabel(h)} takes ${poisonDmg} poison damage. HP ${Math.max(0, h.hp)}`);
          if (h.hp <= 0) {
            heroDies(h, "poison");
            continue;
          }
        }

        if (getStatus(h, "burn").turns > 0) {
          const burnVal = getStatus(h, "burn").value || 2;
          const burnDmg = applyHeroDamage(h, burnVal, h.x, h.y, false);
          consumeStatus(h, "burn");
          shareRaidDanger(h.x, h.y, burnVal);
          push(`${invaderLabel(h)} takes ${burnDmg} burn damage. HP ${Math.max(0, h.hp)}`);
          if (h.hp <= 0) {
            heroDies(h, "burn");
            continue;
          }
        }

        if (getStatus(h, "arrow").turns > 0) {
          const arrowDmg = applyHeroDamage(h, getStatus(h, "arrow").value || 3, h.x, h.y, false);
          consumeStatus(h, "arrow");
          shareRaidDanger(h.x, h.y, Math.max(1, Math.round(arrowDmg / 2)));
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
            if (t.roomType === "carnage-pit" && isLinkedRoom(grid, x, y)) {
              const woundedHeroHere = heroesOut.some((hero) => hero.x === x && hero.y === y && hero.hp < safeEntityMaxHp(hero));
              if (woundedHeroHere) {
                for (const m of t.monsters) {
                  m.hp = Math.min(monsterMaxHp(m), m.hp + 2);
                }
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
            for (const m of t.monsters) {
              tickStatus(m, "bloodlust");
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
          raidIntel: null,
          activeRaidBoons: [],
        };
        nextState = addLog(nextState, "CORE DESTROYED - Defeat.");
        for (let i = logLines.length - 1; i >= 0; i--) nextState = addLog(nextState, logLines[i]);
        return nextState;
      }

      // DRIP SPAWN (finite)
      let nextHeroId = s.nextHeroId;
      let partyQueue = s.partyQueue ? [...s.partyQueue] : [];
      if (raidActive && partyQueue.length > 0 && activeEntrancesLocal.length > 0 && heroesOut.length < HERO_CAP) {
        const spawnResult = spawnOneHero(heroesOut, nextHeroId, activeEntrancesLocal, turnsSurvived, partyQueue, grid, s.raidType, s.day);
        nextHeroId = spawnResult.nextHeroId;
        partyQueue = spawnResult.scoutQueue;
        raidRemaining = partyQueue.length;
        if (spawnResult.spawned) {
          const originLabel = spawnResult.entrance?.kind === "ash-breach" ? ` from Ash Breach ${formatGridPos(spawnResult.entrance)}` : "";
          push(`${invaderLabel(spawnResult.spawned)} enters${originLabel}. (${raidRemaining} left in this raid)`);
        }
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
        raidIntel,
        dpRegenCounter,
        councilQuestCounters,
        activeRaidBoons: raidActive ? raidBoons : [],
      };
      nextState.dominionEffects = { monsterAtk: 0, monsterFirstStrike: false, pulsePending: false };

      if (advanceDay) {
        nextState.day = (s.day || 1) + 1;
        nextState.phase = "build";
        nextState.currentParty = [];
        nextState.partyQueue = [];
        nextState.raidIntel = null;
        nextState.dailyEvent = rollDailyEvent();
        nextState.traderStock = generateTraderStock(nextState.turnsSurvived, nextState.day);
        nextState.shadyStock = generateArtifactStock(nextState.day, nextState.artifacts);
        nextState.fleshMarketStock =
          nextState.fleshMarketUntilDay >= nextState.day && nextState.fleshMarketUntilDay > 0
            ? generateFleshMarketStock(nextState.day, nextState.boughtUniqueKeys || [])
            : [];
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
        const completedRaidCoreDamage = Math.max(0, (s.raidStartCoreHp || getCoreMaxHp(s)) - coreHp);
        nextState = addCouncilQuestCounter(nextState, "survivedRaidCount", 1);
        if (completedRaidCoreDamage === 0) {
          nextState = addCouncilQuestCounter(nextState, "zeroCoreDamageRaidCount", 1);
        }
        if (coreHp >= Math.ceil(getCoreMaxHp(nextState) * 0.8)) {
          nextState = addCouncilQuestCounter(nextState, "highCoreRaidCount", 1);
        }
        const raidSoulshardsGained = Math.max(0, soulshards - (s.raidStartShards || 0));
        if (raidSoulshardsGained > 0) {
          nextState = addCouncilQuestCounter(nextState, "soulshardsEarnedSinceCouncil", raidSoulshardsGained);
        }
        if (nextState.ashTrial?.active) {
          const progressedTrial = {
            ...nextState.ashTrial,
            raidsCompleted: Math.min(nextState.ashTrial.requiredRaids || 2, (nextState.ashTrial.raidsCompleted || 0) + 1),
          };
          nextState.ashTrial = progressedTrial;
          nextState = addLog(
            nextState,
            `Ash Trial progress: ${progressedTrial.raidsCompleted}/${progressedTrial.requiredRaids} connected raid${progressedTrial.requiredRaids === 1 ? "" : "s"}.`
          );
          if (nextState.councilQuest?.active && nextState.councilQuest.questType === "ash-breach-trial") {
            nextState.councilQuest = {
              ...nextState.councilQuest,
              progress: progressedTrial.raidsCompleted,
            };
          }
          if (progressedTrial.raidsCompleted >= (progressedTrial.requiredRaids || 2) && nextState.councilQuest?.questType === "ash-breach-trial") {
            const rewardResult = applyCouncilRewardToState(nextState, nextState.councilQuest.reward, nextState.councilQuest.sponsorName, nextState.day);
            nextState = rewardResult.nextState;
            const favorShift = applyCouncilFavorShiftDetailed(nextState.councilFavor || {}, nextState.councilQuest.sponsorKey, 2, "Council quest completed");
            nextState.councilFavor = favorShift.favorMap;
            nextState = addLogLines(nextState, favorShift.logLines);
            nextState = addLog(nextState, `Council quest completed: ${nextState.councilQuest.title}. ${rewardResult.rewardText || "Reward claimed."}`);
            nextState.ashTrial = createEmptyAshTrial();
            nextState = addLog(nextState, `Ash Breach${progressedTrial.breaches?.length > 1 ? "es" : ""} collapse${progressedTrial.breaches?.length > 1 ? "" : "s"} into cinders.`);
            nextState.councilQuest = {
              ...nextState.councilQuest,
              active: false,
              progress: progressedTrial.requiredRaids || 2,
            };
          }
        } else if (nextState.councilQuest?.active) {
          const progress = councilQuestProgressValue(nextState, nextState.councilQuest);
          const goal = nextState.councilQuest.goal || 0;
          if (progress >= goal) {
            const rewardResult = applyCouncilRewardToState(nextState, nextState.councilQuest.reward, nextState.councilQuest.sponsorName, nextState.day);
            nextState = rewardResult.nextState;
            const favorShift = applyCouncilFavorShiftDetailed(nextState.councilFavor || {}, nextState.councilQuest.sponsorKey, 2, "Council quest completed");
            nextState.councilFavor = favorShift.favorMap;
            nextState = addLogLines(nextState, favorShift.logLines);
            nextState = addLog(nextState, `Council quest completed: ${nextState.councilQuest.title}. ${rewardResult.rewardText || "Reward claimed."}`);
            nextState.councilQuest = { ...nextState.councilQuest, active: false, progress: goal };
          } else {
            nextState.councilQuest = { ...nextState.councilQuest, progress };
          }
        }
        const councilDue = nextState.day % COUNCIL_INTERVAL === 0;
        if (councilDue) {
          const council = nextState.council || { active: false, day: null, roster: [], lastRoster: [], declinedStreak: 0 };
          const roster = buildCouncilRoster(council.lastRoster || []);
          let councilFavor = normalizeCouncilFavorMap(nextState.councilFavor || {});
          councilFavor = decayCouncilFavorTowardNeutral(councilFavor).favorMap;
          nextState.councilFavor = councilFavor;
          nextState.council = {
            ...council,
            active: true,
            day: nextState.day,
            roster,
            lastRoster: roster,
          };
          if (nextState.ashTrial?.active) {
            nextState.ashTrial = createEmptyAshTrial();
            nextState.nihazaCurseUntilDay = nextCouncilDayAfter(nextState.day);
            nextState.coreHp = Math.min(nextState.coreHp, getCoreMaxHp(nextState));
            nextState = addLog(nextState, `Ash spreads. Nihaza's judgment stands. Core max HP -25 until Day ${nextState.nihazaCurseUntilDay}.`);
          }
          if (nextState.councilQuest?.active) {
            const favorPenalty = applyCouncilFavorShiftDetailed(
              councilFavor,
              nextState.councilQuest.sponsorKey,
              -2,
              nextState.councilQuest.questType === "ash-breach-trial" ? "Council quest failed" : "Council quest expired"
            );
            councilFavor = favorPenalty.favorMap;
            nextState.councilFavor = councilFavor;
            nextState = addLogLines(nextState, favorPenalty.logLines);
            if (nextState.councilQuest.questType === "ash-breach-trial") {
              nextState = addLog(nextState, `Council quest failed: ${nextState.councilQuest.title}.`);
            } else {
              nextState = addLog(nextState, `Council quest expired: ${nextState.councilQuest.title}.`);
            }
          }
          nextState.councilQuest = null;
          nextState.councilQuestCounters = createEmptyCouncilQuestCounters();
          const punitive = council.declinedStreak >= 2;
          nextState.nextRaidType = punitive ? "council" : "elite";
          nextState.pendingPunitiveRaid = punitive;
          nextState.pendingCouncilRaid = punitive ? buildCouncilRaidFromRoster(roster, nextState.day, councilFavor) : null;
          nextState.councilSession = buildCouncilSession(roster, nextState.day, councilFavor);
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
      const startingRaid = buildRaidPartyWithIntel(0, null, 1);
      const startingParty = startingRaid.party;
      const dailyEvent = rollDailyEvent();
      const traderStock = generateTraderStock(0, 1);
      const shadyStock = generateArtifactStock(1, []);
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
        ashTrial: createEmptyAshTrial(),
        ashTributeUntilDay: 0,
        ashMonsterRoomCapUntilDay: 0,
        nihazaCurseUntilDay: 0,
        bonusRoomCapPermanent: 0,
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
        raidIntel: startingRaid.raidIntel,
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
        councilQuestCounters: createEmptyCouncilQuestCounters(),
        nextRaidType: null,
        pendingPunitiveRaid: false,
        pendingCouncilRaid: null,
        nextRaidBoons: [],
        activeRaidBoons: [],
        fleshMarketUntilDay: 0,
        fleshMarketStock: [],
        boughtUniqueKeys: [],
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
      let councilSession = s.councilSession ? { ...s.councilSession, status: "attended" } : s.councilSession;
      let councilFavor = normalizeCouncilFavorMap(s.councilFavor || {});
      const favorLogLines = [];
      for (const member of council.roster || []) {
        const favorShift = applyCouncilFavorShiftDetailed(councilFavor, member.key, 1, "Council attended");
        councilFavor = favorShift.favorMap;
        favorLogLines.push(...favorShift.logLines);
      }
      councilSession = rebuildCouncilSessionWithFavor(councilSession, council.roster || [], s.day, councilFavor);
      let ns = {
        ...s,
        council,
        councilFavor,
        nextRaidType,
        pendingPunitiveRaid: false,
        pendingCouncilRaid: null,
        councilSession,
      };
      ns = addLogLines(ns, favorLogLines);
      ns = addLog(ns, "You attended the Council.");
      if (council.roster?.length) {
        const names = council.roster.map((m) => m.name).join(", ");
        ns = addLog(ns, `Council attendees: ${names}.`);
      }
      if (s.phase === "battle") {
        const stagedRaid = buildRaidPartyWithIntel(s.turnsSurvived, nextRaidType, s.day, {
          councilRaid: null,
          raidBoons: s.nextRaidBoons,
        });
        const party = stagedRaid.party;
        let scoutQueue = [];
        const doctrineEffects = getDoctrineEffects(s.doctrines);
        const raidMods = buildRaidModifiers(s.nextRaidBoons);
        const artifactMods = calcArtifactMods(s.artifacts, s.day);
        const baseMirrorTier = maxUtilityTier(s.grid, "scout-mirror");
        const mirrorTier =
          baseMirrorTier > 0
            ? baseMirrorTier +
              doctrineEffects.utilityPotencyBonus +
              doctrineEffects.utilityPotencyBonusExtra +
              doctrineEffects.utilityScoutBonus +
              (artifactMods.utilityPotencyBonus || 0)
            : 0;
        const revealBase = (artifactMods.scoutRevealBonus || 0) + huntScoutRevealBonus(s.grid, artifactMods);
        if (mirrorTier > 0 || revealBase > 0) {
          const revealCount = Math.min(party.length, revealBase + (mirrorTier > 0 ? 2 + (mirrorTier - 1) + raidMods.scoutRevealBonus : 0));
          scoutQueue = party.slice(0, revealCount).map((h) => ({ ...h }));
        }
        ns = {
          ...ns,
          currentParty: party,
          currentPartyRaidType: nextRaidType || null,
          partyQueue: party.map((h) => ({ ...h })),
          scoutQueue,
          raidIntel: stagedRaid.raidIntel,
        };
        if (scoutQueue.length > 0) {
          ns = addCouncilQuestCounter(ns, "revealedInvaderCount", scoutQueue.length);
        }
        ns = addLog(ns, "Council choice updated today's raid.");
        ns = addLog(ns, `Raid directive: ${getRaidDirectiveRule(stagedRaid.directiveKey).name}.`);
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
      let councilSession = s.councilSession ? { ...s.councilSession, status: "declined" } : s.councilSession;
      let councilFavor = normalizeCouncilFavorMap(s.councilFavor || {});
      const favorLogLines = [];
      for (const member of council.roster || []) {
        const favorShift = applyCouncilFavorShiftDetailed(councilFavor, member.key, -1, "Council declined");
        councilFavor = favorShift.favorMap;
        favorLogLines.push(...favorShift.logLines);
      }
      councilSession = rebuildCouncilSessionWithFavor(councilSession, council.roster || [], s.day, councilFavor);
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
      ns = addLogLines(ns, favorLogLines);
      ns = addLog(ns, "You declined the Council.");
      if (declinedStreak >= 2) {
        ns = addLog(ns, `The Council prepares a punitive raid. ${pendingCouncilRaid?.label || ""}`.trim());
      }
      if (s.phase === "battle") {
        const stagedRaid = buildRaidPartyWithIntel(s.turnsSurvived, nextRaidType, s.day, {
          councilRaid: pendingCouncilRaid,
          raidBoons: s.nextRaidBoons,
        });
        const party = stagedRaid.party;
        let scoutQueue = [];
        const doctrineEffects = getDoctrineEffects(s.doctrines);
        const raidMods = buildRaidModifiers(s.nextRaidBoons);
        const artifactMods = calcArtifactMods(s.artifacts, s.day);
        const baseMirrorTier = maxUtilityTier(s.grid, "scout-mirror");
        const mirrorTier =
          baseMirrorTier > 0
            ? baseMirrorTier +
              doctrineEffects.utilityPotencyBonus +
              doctrineEffects.utilityPotencyBonusExtra +
              doctrineEffects.utilityScoutBonus +
              (artifactMods.utilityPotencyBonus || 0)
            : 0;
        const revealBase = (artifactMods.scoutRevealBonus || 0) + huntScoutRevealBonus(s.grid, artifactMods);
        if (mirrorTier > 0 || revealBase > 0) {
          const revealCount = Math.min(party.length, revealBase + (mirrorTier > 0 ? 2 + (mirrorTier - 1) + raidMods.scoutRevealBonus : 0));
          scoutQueue = party.slice(0, revealCount).map((h) => ({ ...h }));
        }
        ns = {
          ...ns,
          currentParty: party,
          currentPartyRaidType: nextRaidType || null,
          partyQueue: party.map((h) => ({ ...h })),
          scoutQueue,
          raidIntel: stagedRaid.raidIntel,
        };
        if (scoutQueue.length > 0) {
          ns = addCouncilQuestCounter(ns, "revealedInvaderCount", scoutQueue.length);
        }
        ns = addLog(ns, "Council choice updated today's raid.");
        ns = addLog(ns, `Raid directive: ${getRaidDirectiveRule(stagedRaid.directiveKey).name}.`);
      }
      return ns;
    });
  }

  function acceptCouncilBoon(sponsorKey) {
    setState((s) => {
      if (!s.councilSession || s.councilSession.status !== "attended") return s;
      if (s.councilSession.acceptedCouncilBoonKey) return addLog(s, "You already accepted a Council boon.");
      if (!canAcceptCouncilSponsorAction(s.councilSession, sponsorKey)) return addLog(s, "You have already courted another sponsor this Council.");
      const sponsor = (s.councilSession.sponsors || []).find((entry) => entry.key === sponsorKey);
      const boon = sponsor?.boon;
      if (!sponsor || !boon) return s;
      if (!sponsor.available || boon.available === false) {
        return addLog(s, boon.lockedReason || sponsor.lockedReason || "That sponsor's boon is not available yet.");
      }
      let ns = { ...s };
      const rewardResult = applyCouncilRewardToState(ns, boon.reward, boon.sponsorName, s.day);
      ns = rewardResult.nextState;
      let rewardText = rewardResult.rewardText ? ` ${rewardResult.rewardText}.` : "";
      if (boon.marketAccess) {
        const untilDay = nextCouncilDayAfter(s.day);
        ns.fleshMarketUntilDay = untilDay;
        ns.fleshMarketStock = generateFleshMarketStock(s.day, ns.boughtUniqueKeys || []);
        rewardText += ` Flesh Market open until Day ${untilDay}.`;
      }
      const favorShift = applyCouncilFavorShiftDetailed(s.councilFavor || {}, sponsorKey, 2, "Council boon accepted");
      ns.councilFavor = favorShift.favorMap;
      if (boon.raidEffect) {
        ns.nextRaidBoons = [
          ...(s.nextRaidBoons || []),
          { ...boon.raidEffect, sponsorKey: boon.sponsorKey, sponsorName: boon.sponsorName },
        ].filter(Boolean);
      }
      ns.councilSession = rebuildCouncilSessionWithFavor(
        {
          ...s.councilSession,
          courtedSponsorKey: s.councilSession.courtedSponsorKey || sponsorKey,
          acceptedCouncilBoonKey: sponsorKey,
        },
        s.council?.roster || [],
        s.day,
        ns.councilFavor
      );
      const leverageText = boon.raidEffect?.desc ? ` ${boon.raidEffect.desc}` : "";
      ns = addLogLines(ns, favorShift.logLines);
      return addLog(ns, `Council boon received: ${boon.title} from ${boon.sponsorName}.${rewardText}${leverageText}`.trim());
    });
  }

  function acceptCouncilQuest(sponsorKey, difficulty) {
    setState((s) => {
      if (!s.councilSession || s.councilSession.status !== "attended") return s;
      if (s.councilQuest?.active) return addLog(s, "You already have an active Council quest.");
      if (!canAcceptCouncilSponsorAction(s.councilSession, sponsorKey)) return addLog(s, "You have already courted another sponsor this Council.");
      const sponsor = (s.councilSession.sponsors || []).find((entry) => entry.key === sponsorKey);
      const quest = sponsor?.quests?.[difficulty];
      if (!quest) return s;
      if (!sponsor?.available || quest.available === false) {
        return addLog(s, quest.lockedReason || sponsor?.lockedReason || "That sponsor's quest is not available yet.");
      }
      let nextState = { ...s };
      if (quest.questType === "ash-breach-trial") {
        const breachCount = Math.max(1, quest.breachCount || (difficulty === "hard" ? 2 : 1));
        if (!canPlaceAshBreaches(s.grid, breachCount)) {
          return addLog(s, `Nihaza's trial is unavailable. ${ashBreachRequirementText(breachCount)}`);
        }
        const breaches = rollAshBreachPositions(s.grid, breachCount, s.day);
        if (breaches.length < breachCount) {
          return addLog(s, `Nihaza finds no valid frontline breach. ${ashBreachRequirementText(breachCount)}`);
        }
        nextState.ashTrial = {
          active: true,
          difficulty,
          breaches,
          raidsCompleted: 0,
          requiredRaids: Math.max(1, quest.goal || 2),
          expiresDay: nextCouncilDayAfter(s.day),
        };
        for (const breach of breaches) {
          nextState = addLog(nextState, `Nihaza opens an Ash Breach at ${formatGridPos(breach)}. The dungeon trembles.`);
        }
      }
      const councilQuest = {
        ...quest,
        active: true,
        progress: councilQuestProgressValue(nextState, quest),
      };
      const favorShift = applyCouncilFavorShiftDetailed(nextState.councilFavor || {}, sponsorKey, 1, "Council quest accepted");
      const councilFavor = favorShift.favorMap;
      const councilSession = rebuildCouncilSessionWithFavor(
        {
          ...nextState.councilSession,
          courtedSponsorKey: nextState.councilSession.courtedSponsorKey || sponsorKey,
          acceptedCouncilQuestId: quest.id,
          acceptedCouncilQuestDifficulty: difficulty,
        },
        nextState.council?.roster || [],
        nextState.day,
        councilFavor
      );
      return addLog(
        addLogLines({ ...nextState, councilQuest, councilSession, councilFavor }, favorShift.logLines),
        `Council quest accepted: ${quest.title} (${quest.sponsorName}, ${difficulty}).`
      );
    });
  }

  function buyFromFleshMarket(index) {
    setState((s) => {
      if (!(s.fleshMarketUntilDay >= s.day && s.fleshMarketUntilDay > 0)) {
        return addLog(s, "The Flesh Market is closed.");
      }
      const stock = Array.isArray(s.fleshMarketStock) ? [...s.fleshMarketStock] : [];
      const offer = stock[index];
      if (!offer || offer.soldOut) return addLog(s, "That Flesh Market offer is no longer available.");
      if (s.currency.darkcrystals < offer.cost) return addLog(s, "Not enough Darkcrystals.");
      const boughtUniqueKeys = Array.from(new Set([...(s.boughtUniqueKeys || []), offer.key]));
      const currency = { ...s.currency, darkcrystals: s.currency.darkcrystals - offer.cost };
      let ns = { ...s, currency, boughtUniqueKeys };
      if (offer.type === "monster") {
        const uniqueDef = UNIQUE_MONSTER_MAP[offer.key];
        if (!uniqueDef) return addLog(s, "That unique monster could not be found.");
        const artifactMods = calcArtifactMods(s.artifacts, s.day);
        const monster = buildUniqueMonsterEntity(uniqueDef, s.day, artifactMods);
        ns.invMonsters = [...s.invMonsters, monster];
        ns = addLog(ns, `${monster.name} joins your inventory for ${offer.cost} Darkcrystals.`);
      } else if (offer.type === "artifact") {
        const artifactDef = UNIQUE_ARTIFACT_MAP[offer.key];
        if (!artifactDef) return addLog(s, "That unique artifact could not be found.");
        ns.artifacts = [
          ...s.artifacts,
          hydrateArtifactDefinition({
            ...artifactDef,
            isUnique: true,
            cost: { currency: "darkcrystals", amount: offer.cost },
            tags: ["unique", "flesh-market"],
            maxCopies: 1,
            unlockDay: 0,
          }),
        ];
        ns = addLog(ns, `Bought ${artifactDef.name} for ${offer.cost} Darkcrystals.`);
      }
      stock[index] = { ...offer, soldOut: true };
      ns.fleshMarketStock = stock;
      return ns;
    });
  }

  function fuseMonsters(aIdx, bIdx) {
    setState((s) => {
      if (!(s.fleshMarketUntilDay >= s.day && s.fleshMarketUntilDay > 0)) return addLog(s, "The Flesh Market is closed.");
      if (s.phase !== "build") return addLog(s, "Fusion is only available during the build phase.");
      if (aIdx === bIdx) return addLog(s, "Choose two different monsters to fuse.");
      if (aIdx < 0 || bIdx < 0) return s;
      const inv = [...s.invMonsters];
      const first = inv[aIdx];
      const second = inv[bIdx];
      if (!first || !second) return s;
      if (first.isUnique || second.isUnique) return addLog(s, "Unique monsters cannot be used as fusion stock.");
      if (first.isFused || second.isFused) return addLog(s, "Fused monsters cannot be used as fusion stock.");
      const cost = fusionCost(first, second);
      if ((s.currency.darkcrystals || 0) < cost) return addLog(s, `Not enough Darkcrystals for fusion (${cost}).`);
      const hybrid = buildFusedMonsterEntity(first, second, s.day);
      const a = Math.max(aIdx, bIdx);
      const b = Math.min(aIdx, bIdx);
      inv.splice(a, 1);
      inv.splice(b, 1);
      inv.push(hybrid);
      const currency = { ...s.currency, darkcrystals: (s.currency.darkcrystals || 0) - cost };
      return addLog(
        { ...s, invMonsters: inv, currency },
        `Flesh Market fuses ${first.name} and ${second.name} into ${hybrid.name} (${formatStars(hybrid.stars)}, ${hybrid.class}) for ${cost} Darkcrystals.`
      );
    });
  }

  function sacrificeMonster(idx) {
    setState((s) => {
      const inv = [...s.invMonsters];
      const target = inv[idx];
      if (!target) return s;
      if (target.isUnique) return addLog(s, `${target.name} is too valuable to sacrifice in the Flesh Market.`);
      if (target.isFused) return addLog(s, `${target.name} is too unstable to sacrifice safely.`);
      inv.splice(idx, 1);
      const artifactMods = calcArtifactMods(s.artifacts, s.day);
      const gain =
        4 +
        safeEntityStars(target) * 3 +
        monsterEvolutionStageValue(target) * 4 +
        (artifactMods.sacrificeBonusDarkcrystals || 0);
      const currency = { ...s.currency, darkcrystals: (s.currency.darkcrystals || 0) + gain };
      let ns = { ...s, invMonsters: inv, currency };
      ns = addCouncilQuestCounter(ns, "monsterSacrificeCount", 1);
      ns = addCouncilQuestCounter(ns, "darkcrystalsEarnedSinceCouncil", gain);
      return addLog(ns, `Sacrificed ${target.name}. +${gain} Darkcrystals.`);
    });
  }

  function triggerFusion() {
    if (fuseA === "" || fuseB === "") return;
    fuseMonsters(Number(fuseA), Number(fuseB));
    setFuseA("");
    setFuseB("");
  }

  function traderPrice(monster, dayOverride = state.day) {
    const stars = safeEntityStars(monster);
    const uniqueCost = UNIQUE_MONSTER_MAP[monster.key]?.costByEra?.[Math.max(0, Math.min(fleshMarketEraIndex(dayOverride), 2))];
    const baseCost = UNIQUE_MONSTER_MAP[monster.key] ? uniqueCost || 20 : MONSTERS[monster.key]?.cost || 20;
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
    if (t.entrance) return "E";
    if (t.core) return "C";
    if (t.room === "trap") return TRAP_ICONS[t.trapType] || "TR";
    if (t.room === "monster") return MONSTER_ROOM_ICONS[t.roomType] || "MR";
    if (t.room === "utility") return UTILITY_ICONS[t.roomType] || "UR";
    return "";
  }

  function getTileGlyph(tile, x, y, heroesOnTileCount, monstersOnTileCount) {
    if (isAshBreachAt(state.ashTrial, x, y)) {
      return { text: "AE", tone: "ash-breach" };
    }
    if (tile.entrance) return { text: "E", tone: "entrance" };
    if (tile.core) return { text: "C", tone: "core" };
    if (tile.room === "trap") {
      const glyph = TRAP_GLYPHS[tile.trapType] || { unarmed: "?", armed: "!" };
      return { text: tile.trap ? glyph.armed : glyph.unarmed, tone: tile.trap ? "trap-armed" : "trap-unarmed" };
    }
    if (tile.room === "monster") {
      const icon = MONSTER_ROOM_ICONS[tile.roomType] || "MR";
      return { text: icon, tone: "monster" };
    }
    if (tile.room === "utility") {
      return { text: UTILITY_GLYPHS[tile.roomType] || "+", tone: "utility" };
    }
    return { text: "" };
  }

  function getTileRadarSpec(tile, x, y, heroesHere = [], monstersHere = 0, turnsSurvived = 0, raidActive = false) {
    if (tile?.room !== "monster") {
      return { enabled: false, dots: [], engaged: false };
    }
    const heroCount = Math.min(TILE_RADAR_MAX_DOTS, Array.isArray(heroesHere) ? heroesHere.length : 0);
    const monsterCount = Math.min(TILE_RADAR_MAX_DOTS, Number.isFinite(monstersHere) ? monstersHere : 0);
    if (heroCount <= 0 && monsterCount <= 0) {
      return { enabled: false, dots: [], engaged: false };
    }
    const engaged = heroCount > 0 && monsterCount > 0;
    const baseDuration = engaged ? 2.75 : raidActive ? 3.15 : 3.8;
    const motionBoost = engaged ? 1.2 : raidActive ? 0.8 : 0.45;
    const buildDots = (side, count) => {
      const slots = TILE_RADAR_SLOTS[side];
      const sideBias = side === "hero" ? 71 : 29;
      return Array.from({ length: count }, (_, idx) => {
        const slot = slots[idx % slots.length];
        const seedBase = x * 101 + y * 59 + idx * 23 + sideBias;
        const phaseSeed = seedBase + (raidActive ? turnsSurvived * 7 : 0);
        const jitterX = (radarNoise(seedBase + 0.1) - 0.5) * 5.4;
        const jitterY = (radarNoise(seedBase + 0.7) - 0.5) * 4.8;
        const driftX = (radarNoise(seedBase + 1.3) - 0.5) * (2.4 + motionBoost);
        const driftY = (radarNoise(seedBase + 2.1) - 0.5) * (2.1 + motionBoost);
        const duration = `${(baseDuration + radarNoise(seedBase + 2.7) * 0.85).toFixed(2)}s`;
        const delay = `-${(radarNoise(phaseSeed + 3.5) * 4.2).toFixed(2)}s`;
        const scaleA = (0.92 + radarNoise(seedBase + 4.1) * 0.08).toFixed(2);
        const scaleB = (1.02 + radarNoise(seedBase + 5.3) * 0.16).toFixed(2);
        return {
          key: `${side}-${x}-${y}-${idx}`,
          side,
          style: {
            left: `${slot.x + jitterX}%`,
            top: `${slot.y + jitterY}%`,
            "--radar-dx": `${driftX.toFixed(2)}px`,
            "--radar-dy": `${driftY.toFixed(2)}px`,
            "--radar-duration": duration,
            "--radar-delay": delay,
            "--radar-scale-a": scaleA,
            "--radar-scale-b": scaleB,
          },
        };
      });
    };
    return {
      enabled: true,
      engaged,
      dots: [...buildDots("monster", monsterCount), ...buildDots("hero", heroCount)],
    };
  }

  function tileClass(t, x, y) {
    const sel = state.selected.x === x && state.selected.y === y ? " selected" : "";
    const tier = t.room ? " tier-" + (t.roomTier || 1) : "";
    const path = previewPathKeys.has(keyOf(x, y)) ? " path-preview" : "";
    const lure = lureCandidateKeys.has(keyOf(x, y)) ? " lure-candidate" : "";
    const aura = tileHasAura(x, y) ? " aura-affected" : "";
    if (isAshBreachAt(state.ashTrial, x, y)) return "tile ash-breach" + sel + path + lure + aura;
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

  function roomTypeDesc(tile, x = state.selected.x, y = state.selected.y) {
    if (!tile.room) return "";
    const linkInfo = roomLinkInfoAt(state.grid, x, y);
    if (tile.room === "trap") {
      const tier = tile.roomTier || 1;
      const trap = TRAP_MAP[tile.trapType];
      if (!trap) return "";
      const base = trap.baseDmg || 0;
      const star = clampMonsterStar(tile.trapStar ?? tile.trapStars ?? 1);
      const rank = Math.max(1, tile.trapRank ?? tier);
      const scaled = Math.max(
        0,
        Math.round(
          base * (1 + 0.25 * (star - 1)) +
            (rank - 1) * 2 +
            doctrineEffects.trapFlatDamage +
            (artifactMods.trapFlatDamage || 0) +
            huntTrapFlatDamageBonus(state.grid, x, y, artifactMods)
        )
      );
      const charges = trapChargesForTile(state.grid, tile, x, y, doctrineEffects, artifactMods);
      const cooldown = trapCooldownAfterTrigger(tile.trapType, star, doctrineEffects);
      return `${trap.baseDesc || trap.desc} Tier ${tier}. ${formatStars(star)} / Rank ${rank}. Trigger ${scaled} dmg, ${charges} charge(s), cooldown ${cooldown}.${linkInfo.linked && trap.linkDesc ? ` Linked: ${trap.linkDesc}` : ""}`;
    }
    if (tile.room === "monster") {
      const tier = tile.roomTier || 1;
      const cap = effectiveMonsterRoomCapValue(state, tier);
      if (tile.roomType === "training-den") {
        return `Tier ${tier}: Monsters placed here gain +${1 + (tier - 1)} ATK permanently. Cap ${cap}.`;
      }
      if (tile.roomType === "thick-hide") {
        return `Tier ${tier}: Monsters placed here gain +${3 + (tier - 1) * 2} Max HP permanently. Cap ${cap}.`;
      }
      const roomDef = MONSTER_ROOM_MAP[tile.roomType];
      return `${roomDef?.baseDesc || roomDef?.desc || "Monster Room"} Cap ${cap}.${linkInfo.linked && roomDef?.linkDesc ? ` Linked: ${roomDef.linkDesc}` : ""}`;
    }
    if (tile.room === "utility") {
      const roomDef = UTILITY_MAP[tile.roomType];
      if (roomDef?.baseDesc) {
        return `${roomDef.baseDesc}${linkInfo.linked && roomDef.linkDesc ? ` Linked: ${roomDef.linkDesc}` : ""}`;
      }
      const tier =
        (tile.roomTier || 1) +
        doctrineEffects.utilityPotencyBonus +
        doctrineEffects.utilityPotencyBonusExtra +
        (artifactMods.utilityPotencyBonus || 0);
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
      return roomDef?.desc || "";
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
    return effectiveMonsterRoomCapValue(state, tile.roomTier || 1);
  }

  function effectiveUtilityTierAt(x, y, key) {
    const baseTier = utilityTier(state.grid, x, y, key);
    if (baseTier <= 0) return 0;
    return baseTier + doctrineEffects.utilityPotencyBonus + doctrineEffects.utilityPotencyBonusExtra + (artifactMods.utilityPotencyBonus || 0);
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
    if (artifactMods.trapMult) mult += artifactMods.trapMult;
    return Math.max(
      0,
      Math.round(
        (trap.baseDmg * (1 + 0.25 * (star - 1)) +
          (rank - 1) * 2 +
          doctrineEffects.trapFlatDamage +
          (artifactMods.trapFlatDamage || 0) +
          huntTrapFlatDamageBonus(state.grid, x, y, artifactMods)) *
          mult
      )
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
    }
    return "";
  }

  function tileHasAura(x, y) {
    return describeTileAuras(x, y).length > 0;
  }

  const selectedTileAuras = describeTileAuras(state.selected.x, state.selected.y);
  const selectedHeroIntent =
    selectedHeroes[0] && core
      ? chooseInvaderMove(selectedHeroes[0], state.grid, core, state.activeRaidBoons, doctrineEffects, state.raidIntel, artifactMods)
      : null;
  const focusedCouncilFavor = focusedCouncilMember ? state.councilFavor?.[focusedCouncilMember.key] || 0 : 0;
  const focusedCouncilFavorInfo = focusedCouncilMember ? getCouncilFavorInfo(focusedCouncilFavor) : getCouncilFavorInfo(0);
  const focusedCouncilSponsor =
    focusedCouncilMember && state.councilSession?.sponsors
      ? state.councilSession.sponsors.find((sponsor) => sponsor.key === focusedCouncilMember.key) || null
      : null;
  const focusedCouncilStanding = focusedCouncilSponsor?.favorInfo || focusedCouncilFavorInfo;
  const focusedCouncilCrestSrc = focusedCouncilMember ? COUNCIL_MEMBER_CRESTS[focusedCouncilMember.key] || null : null;
  const useFocusedCouncilCrest = !!focusedCouncilCrestSrc && !brokenCouncilArt[focusedCouncilCrestSrc];
  const useCouncilBackdrop = !!COUNCIL_CHAMBER_ART.backdrop && !brokenCouncilArt[COUNCIL_CHAMBER_ART.backdrop];
  const useCouncilSigil = !!COUNCIL_CHAMBER_ART.sigil && !brokenCouncilArt[COUNCIL_CHAMBER_ART.sigil];
  const useCouncilAbsentSilhouette =
    !!COUNCIL_CHAMBER_ART.absentSilhouette && !brokenCouncilArt[COUNCIL_CHAMBER_ART.absentSilhouette];
  const focusedCouncilBoons = focusedCouncilMember
    ? (state.nextRaidBoons || []).filter((boon) => boon.sponsorKey === focusedCouncilMember.key)
    : [];
  const activeCouncilQuestProgress = state.councilQuest?.active ? councilQuestProgressValue(state, state.councilQuest) : 0;
  const councilQuestPlacementBlock = (quest) => {
    if (!quest || quest.questType !== "ash-breach-trial") return "";
    const breachCount = Math.max(1, quest.breachCount || 1);
    return canPlaceAshBreaches(state.grid, breachCount) ? "" : ashBreachRequirementText(breachCount);
  };
  const focusedCouncilSponsorStatus = focusedCouncilSponsor
    ? !focusedCouncilSponsor.available
      ? focusedCouncilSponsor.lockedReason || "Unavailable"
      : state.councilSession?.courtedSponsorKey === focusedCouncilSponsor.key
        ? "Courted"
        : `${focusedCouncilStanding.name} standing`
    : "Unavailable";

  const previewPathKeys = useMemo(() => {
    if (selectedHeroes[0] && core) {
      const choice = chooseInvaderMove(selectedHeroes[0], state.grid, core, state.activeRaidBoons, doctrineEffects, state.raidIntel, artifactMods);
      const current = keyOf(selectedHeroes[0].x, selectedHeroes[0].y);
      const previewKeys = new Set([current]);
      const objectiveTarget = choice?.targetTile || core;
      const firstLegStart = choice?.next || { x: selectedHeroes[0].x, y: selectedHeroes[0].y };
      const toObjective =
        objectiveTarget && aStarPath(state.grid, firstLegStart, { x: objectiveTarget.x, y: objectiveTarget.y });
      for (const pos of toObjective || (choice?.next ? [choice.next] : [])) {
        previewKeys.add(keyOf(pos.x, pos.y));
      }
      if (objectiveTarget && !objectiveTarget.core && !(objectiveTarget.x === core.x && objectiveTarget.y === core.y)) {
        const toCore = aStarPath(state.grid, { x: objectiveTarget.x, y: objectiveTarget.y }, core) || [];
        for (const pos of toCore) previewKeys.add(keyOf(pos.x, pos.y));
      }
      return previewKeys;
    }
    if (activeEntrances.length > 0 && core) {
      const paths = new Set();
      for (const source of activeEntrances) {
        paths.add(keyOf(source.x, source.y));
        const path = aStarPath(state.grid, source, core) || [];
        for (const pos of path) paths.add(keyOf(pos.x, pos.y));
      }
      return paths;
    }
    return new Set();
  }, [selectedHeroes, state.grid, core, activeEntrances, state.activeRaidBoons, doctrineEffects, state.raidIntel]);

  const lureCandidateKeys = useMemo(() => {
    if (!selectedHeroes[0] || !core) return new Set();
    const choice = chooseInvaderMove(selectedHeroes[0], state.grid, core, state.activeRaidBoons, doctrineEffects, state.raidIntel, artifactMods);
    return new Set(
      (choice.options || [])
        .filter((option) => option.lure >= 4 && !option.tile.core)
        .map((option) => keyOf(option.next.x, option.next.y))
    );
  }, [selectedHeroes, state.grid, core, state.activeRaidBoons, doctrineEffects, state.raidIntel]);

  const pendingRaidMeta = raidTypeMeta(state.pendingPunitiveRaid ? "council" : state.nextRaidType, state.pendingCouncilRaid);
  const pendingDirectiveKey = resolveRaidDirectiveKey(state.pendingPunitiveRaid ? "council" : state.nextRaidType, state.pendingCouncilRaid, state.day);
  const pendingDirective = getRaidDirectiveRule(state.raidIntel?.directive || pendingDirectiveKey);
  const raidForecastMix =
    isBattlePhase && state.currentParty?.length
      ? partyArchetypeSummary(state.currentParty)
      : raidDirectiveArchetypeSummary(state.pendingPunitiveRaid ? "council" : state.nextRaidType, state.pendingCouncilRaid, state.day);

  const invPreview = state.invMonsters.slice(0, 3);

  const checklist = {
    entrancePlaced: !!entrance,
    corePlaced: !!core,
    validPath: validation.ok,
  };

  const canStartRaid = !locked && isBattlePhase && !state.raidActive && validation.ok;
  const canEndTurn = !locked && isBattlePhase && (state.raidActive || state.heroes.length > 0);
  const atDungeonLevelCap = dungeonLevel >= MAX_DUNGEON_LEVEL;
  const nextUpgradeCost = atDungeonLevelCap ? null : scaleByDay(25 + dungeonLevel * 15, state.day, 0.03, 3.0);
  const selectedIsAshBreach = isAshBreachAt(state.ashTrial, state.selected.x, state.selected.y);
  const selectedLinkInfo = roomLinkInfoAt(state.grid, state.selected.x, state.selected.y);
  const selectedReadiness = tileStateChip(selectedTile, state.selected.x, state.selected.y) || "n/a";
  const selectedTileEffect = roomTypeDesc(selectedTile, state.selected.x, state.selected.y) || "n/a";
  const selectedLinkLabel = selectedLinkInfo.tag ? `${selectedLinkInfo.tag} | ${selectedLinkInfo.linked ? "Linked" : "Unlinked"}` : "none";
  const selectedLinkBonus = selectedLinkInfo.linked ? selectedLinkInfo.linkDesc || "Active link bonus." : "n/a";
  const selectedTileFlags = [
    selectedTile.entrance ? "Entrance" : null,
    selectedTile.core ? "Core" : null,
    selectedIsAshBreach ? "Ash Breach" : null,
  ].filter(Boolean);
  const selectedTrapSummary =
    selectedTile.room === "trap"
      ? `${selectedTile.trap ? "Armed" : "Disarmed"} | ${formatStars(selectedTile.trapStar ?? selectedTile.trapStars ?? 1)} | R${Math.max(1, selectedTile.trapRank ?? selectedTile.roomTier ?? 1)} | ${Math.max(0, selectedTile.trapChargesRemaining ?? 0)} ch | CD ${Math.max(0, selectedTile.trapCooldownRemaining ?? 0)} | ${projectedTrapDamage(selectedTile, state.selected.x, state.selected.y)} dmg`
      : "n/a";
  const dungeonRailStatus = locked
    ? "Core destroyed. Reset or load to continue."
    : state.movePayload
    ? "Move mode active. Click a destination tile or cancel the move."
    : state.raidActive
    ? `Raid active. ${state.raidRemaining} invader${state.raidRemaining === 1 ? "" : "s"} left to spawn.`
    : isBattlePhase
    ? validation.ok
      ? `Battle staged. ${pendingRaidMeta.label} is ready to begin.`
      : validation.reason
    : `Build phase. Next raid: ${pendingRaidMeta.label}.`;
  const dungeonRailSupport = state.movePayload
    ? "Moving a room or the Core does not consume a turn."
    : atDungeonLevelCap
    ? `Dungeon level capped at ${MAX_DUNGEON_LEVEL}. ${validation.ok ? "Dungeon route is ready." : "Connect every entrance to the Core."}`
    : `Upgrade cost: ${nextUpgradeCost} Essence. ${validation.ok ? "Dungeon route is ready." : "Connect every entrance to the Core."}`;

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
    { key: "toolbox", label: "Toolbox", desc: "Build and management" },
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
        <div className="title">Dungeonlord</div>
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
              {useCouncilBackdrop ? (
                <img
                  className="councilHallBackdrop"
                  src={COUNCIL_CHAMBER_ART.backdrop}
                  alt=""
                  draggable="false"
                  onError={() => noteBrokenCouncilArt(COUNCIL_CHAMBER_ART.backdrop)}
                />
              ) : null}
              <div className="councilRingShade" />
              {absentCouncilMembers.map((m, idx) => {
                const count = Math.max(1, absentCouncilMembers.length);
                const angle = (idx / count) * Math.PI * 2 - Math.PI / 2;
                const radiusX = 330;
                const radiusY = 212;
                const x = Math.cos(angle) * radiusX;
                const y = Math.sin(angle) * radiusY + 4;
                const crestSrc = COUNCIL_MEMBER_CRESTS[m.key] || null;
                const useCrest = !!crestSrc && !brokenCouncilArt[crestSrc];
                return (
                  <div
                    className="councilAbsentPresence"
                    key={`council-absent-${m.key}`}
                    style={{ transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` }}
                  >
                    {useCouncilAbsentSilhouette ? (
                      <img
                        className="councilAbsentSilhouette"
                        src={COUNCIL_CHAMBER_ART.absentSilhouette}
                        alt=""
                        draggable="false"
                        onError={() => noteBrokenCouncilArt(COUNCIL_CHAMBER_ART.absentSilhouette)}
                      />
                    ) : null}
                    {useCrest ? (
                      <img
                        className="councilAbsentCrest"
                        src={crestSrc}
                        alt=""
                        draggable="false"
                        onError={() => noteBrokenCouncilArt(crestSrc)}
                      />
                    ) : null}
                  </div>
                );
              })}
              <div className="councilCenter">
                {useCouncilSigil ? (
                  <img
                    className="councilCenterSigil"
                    src={COUNCIL_CHAMBER_ART.sigil}
                    alt=""
                    draggable="false"
                    onError={() => noteBrokenCouncilArt(COUNCIL_CHAMBER_ART.sigil)}
                  />
                ) : null}
                <div className="councilCenterTitle">The Council Hall</div>
                <div className="muted">A chamber of oaths, bargains, and measured threats.</div>
              </div>
              {councilRoster.map((m, idx) => {
                const count = Math.max(1, councilRoster.length);
                const angle = (idx / count) * Math.PI * 2 - Math.PI / 2;
                const baseRadiusX = count > 5 ? 240 : 220;
                const baseRadiusY = count > 5 ? 168 : 156;
                const radialOffset = idx % 2 === 0 ? 12 : -8;
                const x = Math.cos(angle) * Math.max(150, baseRadiusX + radialOffset);
                const y = Math.sin(angle) * Math.max(116, baseRadiusY + radialOffset * 0.55);
                const crestSrc = COUNCIL_MEMBER_CRESTS[m.key] || null;
                const useCrest = !!crestSrc && !brokenCouncilArt[crestSrc];
                return (
                  <div
                    className={`councilNode ${focusedCouncilMember?.key === m.key ? "active" : ""} ${useCrest ? "hasCrest" : "fallback"}`}
                    key={`council-node-${m.key}`}
                    style={{ transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` }}
                    onClick={() => setFocusedCouncilKey(m.key)}
                  >
                    {useCrest ? (
                      <img
                        className="councilNodeCrest"
                        src={crestSrc}
                        alt=""
                        draggable="false"
                        onError={() => noteBrokenCouncilArt(crestSrc)}
                      />
                    ) : null}
                    <div className="councilNodeName">{m.name}</div>
                    <div className="councilNodeMeta">{m.title}</div>
                  </div>
                );
              })}
            </div>

            <div className="councilDetails" style={{ "--council-scroll-url": `url(${COUNCIL_CHAMBER_ART.scrollTexture})` }}>
              <div className="card councilCard councilFocusedCard">
                <div className="cardTitle">Focused Dungeonlord</div>
                {focusedCouncilMember ? (
                  <>
                    <div className="councilFocusedHeader">
                      {useFocusedCouncilCrest ? (
                        <img
                          className="councilFocusedCrest"
                          src={focusedCouncilCrestSrc}
                          alt=""
                          draggable="false"
                          onError={() => noteBrokenCouncilArt(focusedCouncilCrestSrc)}
                        />
                      ) : null}
                      <div className="councilFocusedText">
                        <div className="entityName">{focusedCouncilMember.name}</div>
                        <div className="entityMeta">
                          {focusedCouncilMember.title} - {focusedCouncilMember.theme}
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <span className={`badge ${councilFavorBadgeTone(focusedCouncilStanding)}`}>
                        {formatCouncilFavorLabel(focusedCouncilStanding)}
                      </span>
                      <div className="muted">{focusedCouncilMember.role}</div>
                    </div>
                    <div className="muted">Standing Effect: {focusedCouncilStanding.summary}</div>
                    <div className="muted">Personality: {focusedCouncilMember.personality}</div>
                    <div className="muted">Current Deal: {focusedCouncilMember.deal}</div>
                    <div className="muted">Sponsor Status: {focusedCouncilSponsorStatus}</div>
                    <div className="muted">
                      Rivalries:{" "}
                      {(focusedCouncilMember.rivalries || []).map((r) => COUNCIL_MEMBER_MAP[r]?.name || r).join(", ")}
                    </div>
                    <div className="muted">
                      Leverage in next raid: {focusedCouncilBoons.length ? focusedCouncilBoons.map((boon) => boon.label).join(", ") : "none"}
                    </div>
                  </>
                ) : (
                  <div className="entityEmpty">Select a Dungeonlord.</div>
                )}
              </div>
              <div className="card councilCard">
                <div className="cardTitle">Favor Rules</div>
                <div className="entityList">
                  {COUNCIL_FAVOR_RULES.map((line) => (
                    <div className="entityItem" key={`favor-rule-full-${line}`}>
                      <div className="entityMeta">{line}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card councilCard">
                <div className="cardTitle">Council Discourse</div>
                <div className="entityList">
                  {state.councilSession.dialogue.map((line, idx) => (
                    <div className="entityItem" key={`council-line-${idx}`}>
                      <div className="entityMeta">{line}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card councilCard">
                <div className="cardTitle">Rumors & Intelligence</div>
                <div className="entityList">
                  {state.councilSession.rumors.map((line, idx) => (
                    <div className="entityItem" key={`council-rumor-${idx}`}>
                      <div className="entityMeta">{line}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card councilCard">
                <div className="cardTitle">Sponsor Boon</div>
                {focusedCouncilSponsor?.boon ? (
                  <>
                    <div className="entityName">{focusedCouncilSponsor.boon.title}</div>
                    <div className="entityMeta">{focusedCouncilSponsor.boon.desc}</div>
                    <div className="muted">{councilRewardLabel(focusedCouncilSponsor.boon.reward)}</div>
                    <div className="muted small">{focusedCouncilSponsor.boon.raidEffect?.desc || "No next-raid leverage."}</div>
                    <div className="muted small">{formatCouncilFavorLabel(focusedCouncilSponsor.favorInfo || focusedCouncilStanding)}</div>
                    {!focusedCouncilSponsor.available ? <div className="muted small">{focusedCouncilSponsor.lockedReason}</div> : null}
                    <div className="row">
                      {state.councilSession.status !== "attended" ? (
                        <button className="btn" disabled>
                          Attend First
                        </button>
                      ) : !focusedCouncilSponsor.available ? (
                        <button className="btn" disabled>
                          Unavailable
                        </button>
                      ) : state.councilSession.acceptedCouncilBoonKey === focusedCouncilSponsor.key ? (
                        <button className="btn" disabled>
                          Accepted
                        </button>
                      ) : state.councilSession.acceptedCouncilBoonKey ? (
                        <button className="btn" disabled>
                          Boon Taken
                        </button>
                      ) : state.councilSession.courtedSponsorKey && state.councilSession.courtedSponsorKey !== focusedCouncilSponsor.key ? (
                        <button className="btn" disabled>
                          Courting Another Sponsor
                        </button>
                      ) : (
                        <button className="btn" onClick={() => acceptCouncilBoon(focusedCouncilSponsor.key)}>
                          Accept Boon
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="entityEmpty">Select a Dungeonlord.</div>
                )}
              </div>
              <div className="card councilCard">
                <div className="cardTitle">Active Council Quest</div>
                {state.councilQuest?.active ? (
                  <>
                    <div className="entityName">{state.councilQuest.title}</div>
                    <div className="entityMeta">{state.councilQuest.desc}</div>
                    <div className="muted">{state.councilQuest.sponsorName}</div>
                    <div className="muted">Progress: {councilQuestProgressLabel(state, state.councilQuest)}</div>
                    <div className="muted">Reward: {councilRewardLabel(state.councilQuest.reward)}</div>
                    {state.councilQuest.failurePenalty ? <div className="muted small">Failure: {state.councilQuest.failurePenalty}</div> : null}
                  </>
                ) : (
                  <div className="entityEmpty">No active quest.</div>
                )}
              </div>
              <div className="card councilCard">
                <div className="cardTitle">Sponsor Quests</div>
                {focusedCouncilSponsor ? (
                  <div className="entityList">
                    {["standard", "hard"].map((difficulty) => {
                      const quest = focusedCouncilSponsor.quests?.[difficulty];
                      if (!quest) return null;
                      const taken = state.councilSession.acceptedCouncilQuestId === quest.id;
                      const blockedBySponsor =
                        !!state.councilSession.courtedSponsorKey && state.councilSession.courtedSponsorKey !== focusedCouncilSponsor.key;
                      const placementBlockedReason = councilQuestPlacementBlock(quest);
                      return (
                        <div className="entityItem" key={quest.id}>
                          <div className="entityName">
                            {quest.title} ({difficulty})
                          </div>
                          <div className="entityMeta">{quest.desc}</div>
                          <div className="muted">{councilQuestGoalLabel(quest)}</div>
                          <div className="muted">Current Progress: {councilQuestProgressLabel(state, quest)}</div>
                          <div className="muted">Reward: {councilRewardLabel(quest.reward)}</div>
                          <div className="muted small">{formatCouncilFavorLabel(focusedCouncilSponsor.favorInfo || focusedCouncilStanding)}</div>
                          {quest.failurePenalty ? <div className="muted small">Failure: {quest.failurePenalty}</div> : null}
                          {!quest.available ? <div className="muted small">{quest.lockedReason}</div> : null}
                          {placementBlockedReason ? <div className="muted small">{placementBlockedReason}</div> : null}
                          <div className="row">
                            {state.councilSession.status !== "attended" ? (
                              <button className="btn" disabled>
                                Attend First
                              </button>
                            ) : !quest.available ? (
                              <button className="btn" disabled>
                                Unavailable
                              </button>
                            ) : placementBlockedReason ? (
                              <button className="btn" disabled>
                                Frontline Needed
                              </button>
                            ) : taken ? (
                              <button className="btn" disabled>
                                Accepted
                              </button>
                            ) : state.councilSession.acceptedCouncilQuestId || state.councilQuest?.active ? (
                              <button className="btn" disabled>
                                Quest Taken
                              </button>
                            ) : blockedBySponsor ? (
                              <button className="btn" disabled>
                                Courting Another Sponsor
                              </button>
                            ) : (
                              <button className="btn" onClick={() => acceptCouncilQuest(focusedCouncilSponsor.key, difficulty)}>
                                Accept {difficulty}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="entityEmpty">Select a Dungeonlord.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="layout" data-tab={activeTab} data-side={sidePanel}>
        <section className="panel panel--dungeon">
          <div className="dungeonHud">
            <div className="dungeonHudHeader">
              <div>
                <div className="dungeonFrameTitle">Dungeon Layout</div>
                <div className="dungeonFrameSubtitle">Place up to {maxRooms} rooms</div>
              </div>
              <div className="capMeta dungeonCapMeta">
                Remaining: {Math.max(0, maxRooms - roomsPlaced)} | Next cap: {atDungeonLevelCap ? "MAX" : maxRooms + ROOMS_PER_LEVEL}
              </div>
            </div>
            <div className="dungeonHudRail">
              <span className="pill">Essence: {state.currency.essence}</span>
              <span className="pill">Soulshards: {state.currency.soulshards}</span>
              <span className="pill">Dominion: {state.currency.dominion}</span>
              <span className="pill">
                Core HP: {Math.max(0, state.coreHp)} / {coreMaxHp}
              </span>
              <span className="pill">Core Shield: {state.coreShield}</span>
              <span className="pill">Mode: {state.phase === "build" ? "BUILD" : "BATTLE"}</span>
              <span className={"pill " + (validation.ok ? "ok" : "bad")}>
                {validation.ok ? "Dungeon Valid" : "Invalid"}
              </span>
            </div>
          </div>

          <div className="gridWrap">
            <div className="dungeonBody">
              <div className="dungeonGutter">
                <div className="dungeonTileFloat">
                  <div className="dungeonTileDockHeader">
                    <div className="dungeonTileDockTitle">Selected Tile</div>
                    <div className="muted">({state.selected.x + 1}, {state.selected.y + 1})</div>
                  </div>
                  <div className="dungeonTileDockGrid">
                    <div className="dockFact">
                      <span className="dockLabel">Type</span>
                      <div className="dockValue">
                        <span className="iconBadge">{roomTypeIcon(selectedTile) || "--"}</span>
                        {roomTypeName(selectedTile)}
                      </div>
                    </div>
                    <div className="dockFact">
                      <span className="dockLabel">Flags</span>
                      <div className="dockBadgeRow">
                        {selectedTileFlags.length ? (
                          selectedTileFlags.map((flag) => (
                            <span className="badge favorNeutral" key={flag}>
                              {flag}
                            </span>
                          ))
                        ) : (
                          <span className="muted small">None</span>
                        )}
                      </div>
                    </div>
                    <div className="dockFact">
                      <span className="dockLabel">Readiness</span>
                      <div className="dockValue">{selectedReadiness}</div>
                    </div>
                    <div className="dockFact">
                      <span className="dockLabel">Occupants</span>
                      <div className="dockValue">
                        Heroes {selectedHeroes.length} | Monsters {selectedTile.monsters.length}
                      </div>
                    </div>
                    <div className="dockFact">
                      <span className="dockLabel">Link</span>
                      <div className="dockValue">{selectedLinkLabel}</div>
                    </div>
                    <div className="dockFact dockFactWide">
                      <span className="dockLabel">Trap</span>
                      <div className="dockValue">{selectedTrapSummary}</div>
                    </div>
                    <div className="dockFact dockFactWide">
                      <span className="dockLabel">Link Bonus</span>
                      <div className="dockValue">{selectedLinkBonus}</div>
                    </div>
                    <div className="dockFact dockFactWide">
                      <span className="dockLabel">Effect</span>
                      <div className="dockValue">{selectedTileEffect}</div>
                    </div>
                    <div className="dockFact dockFactWide">
                      <span className="dockLabel">Auras</span>
                      <div className="dockValue">{selectedTileAuras.length ? selectedTileAuras.join(", ") : "none"}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="dungeonStage">
                <div className="grid">
                  {state.grid.map((row, y) =>
                    row.map((t, x) => (
                      (() => {
                        const heroesHere = heroesByTile.get(keyOf(x, y)) || [];
                        const monstersHere = t.room === "monster" ? t.monsters.length : 0;
                        const glyph = getTileGlyph(t, x, y, heroesHere.length, monstersHere);
                        const stateChip = tileStateChip(t, x, y);
                        const artSpec = getTileArtSpec(t, x, y, state.grid, state.ashTrial, brokenTileArt);
                        const utilityArtSpec = getUtilityArtSpec(t, brokenTileArt);
                        const emptyArtSpec = getEmptyTileArtSpec(t, x, y, state.ashTrial, brokenTileArt);
                        const centerMarkerSpec = getTileCenterMarkerSpec(t, x, y, state.ashTrial, brokenTileArt);
                        const radarSpec = getTileRadarSpec(t, x, y, heroesHere, monstersHere, state.turnsSurvived, state.raidActive);
                        const usePathArt = artSpec.enabled && !artSpec.fallbackToGlyph;
                        const useUtilityArt = utilityArtSpec.enabled && !utilityArtSpec.fallbackToGlyph;
                        const useEmptyArt = emptyArtSpec.enabled && !emptyArtSpec.fallbackToGlyph;
                        const useArt = usePathArt || useUtilityArt || useEmptyArt;
                        const typeBadge = isAshBreachAt(state.ashTrial, x, y)
                          ? "AE"
                          : t.entrance
                          ? "E"
                          : t.core
                          ? "C"
                          : t.room === "trap"
                          ? TRAP_ICONS[t.trapType] || "TR"
                          : t.room === "monster"
                          ? MONSTER_ROOM_ICONS[t.roomType] || "MR"
                          : t.room === "utility"
                          ? UTILITY_ICONS[t.roomType] || "UR"
                          : "";
                        const typeTone = isAshBreachAt(state.ashTrial, x, y)
                          ? "ash"
                          : t.entrance
                          ? "entrance"
                          : t.core
                          ? "core"
                          : t.room === "trap"
                          ? "trap"
                          : t.room === "monster"
                          ? "monster"
                          : t.room === "utility"
                          ? "utility"
                          : "neutral";
                        const linkedUtilityTone =
                          useUtilityArt && t.room === "utility" && roomSynergyTag(t) && isLinkedRoom(state.grid, x, y)
                            ? roomSynergyTag(t).toLowerCase()
                            : "";
                        return (
                          <button
                            key={keyOf(x, y)}
                            className={tileClass(t, x, y) + (useArt ? " art-backed" : "") + (useEmptyArt ? " empty-art" : "")}
                            onClick={() => setSelected(x, y)}
                            title={`(${x + 1},${y + 1})`}
                            disabled={locked}
                          >
                            {useArt ? (
                              <>
                                {useEmptyArt ? (
                                  <img
                                    className="tileArt tileArtEmpty"
                                    src={emptyArtSpec.src}
                                    alt=""
                                    draggable="false"
                                    onError={() => noteBrokenTileArt(emptyArtSpec.src)}
                                  />
                                ) : null}
                                {usePathArt ? (
                                  <img
                                    className="tileArt"
                                    src={artSpec.src}
                                    alt=""
                                    draggable="false"
                                    style={{ transform: `rotate(${artSpec.rotationDeg}deg)` }}
                                    onError={() => noteBrokenTileArt(artSpec.src)}
                                  />
                                ) : null}
                                {centerMarkerSpec.enabled ? (
                                  <img
                                    className="tileCenterMarker"
                                    src={centerMarkerSpec.src}
                                    alt=""
                                    draggable="false"
                                    onError={() => noteBrokenTileArt(centerMarkerSpec.src)}
                                  />
                                ) : null}
                                {useUtilityArt ? (
                                  <>
                                    <img
                                      className="tileArt tileArtSupportBase"
                                      src={utilityArtSpec.baseSrc}
                                      alt=""
                                      draggable="false"
                                      onError={() => noteBrokenTileArt(utilityArtSpec.baseSrc)}
                                    />
                                    <img
                                      className="tileArt tileArtSupportFeature"
                                      src={utilityArtSpec.centerpieceSrc}
                                      alt=""
                                      draggable="false"
                                      onError={() => noteBrokenTileArt(utilityArtSpec.centerpieceSrc)}
                                    />
                                  </>
                                ) : null}
                                {tileHasAura(x, y) ? <span className="tileArtAura" /> : null}
                                {radarSpec.enabled ? (
                                  <span className={`tileRadar ${radarSpec.engaged ? "engaged" : ""}`}>
                                    {radarSpec.dots.map((dot) => (
                                      <span
                                        key={dot.key}
                                        className={`tileRadarDot ${dot.side}`}
                                        style={dot.style}
                                      />
                                    ))}
                                  </span>
                                ) : null}
                                {stateChip ? <span className="tileChip tileChipState">{stateChip}</span> : null}
                                {typeBadge ? <span className={`tileChip tileChipType ${typeTone}`}>{typeBadge}</span> : null}
                                {linkedUtilityTone ? <span className={`tileChipLink ${linkedUtilityTone}`} /> : null}
                              </>
                            ) : (
                              <>
                                {radarSpec.enabled ? (
                                  <span className={`tileRadar ${radarSpec.engaged ? "engaged" : ""}`}>
                                    {radarSpec.dots.map((dot) => (
                                      <span
                                        key={dot.key}
                                        className={`tileRadarDot ${dot.side}`}
                                        style={dot.style}
                                      />
                                    ))}
                                  </span>
                                ) : null}
                                {stateChip ? <span className="tileChip tileChipState">{stateChip}</span> : null}
                                {glyph.text ? <span className={`tileGlyph ${glyph.tone || ""}`}>{glyph.text}</span> : null}
                                {glyph.subtext ? <span className="tileGlyphSub">{glyph.subtext}</span> : null}
                              </>
                            )}
                          </button>
                        );
                      })()
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {state.movePayload && (
            <div className="moveBanner">
              Moving {state.movePayload.type === "core" ? "Core" : "Room"} - click a new tile to place it. Press Esc or Cancel to abort.
            </div>
          )}

          <div className="dungeonActionRail">
            <div className="dungeonActionMeta">
              <div className="dungeonActionStats">
                <span className="pill">Day: {state.day}</span>
                <span className="pill">Turns: {state.turnsSurvived}</span>
                <span className="pill">Dungeon Lvl: {dungeonLevel}</span>
              </div>
              <div className="dungeonActionHint">{dungeonRailStatus}</div>
              <div className="muted small">{dungeonRailSupport}</div>
            </div>
            <div className="dungeonActionButtons">
              <button className="btn" onClick={beginBattle} disabled={locked || state.movePayload || isBattlePhase}>
                Begin Battle
              </button>
              <button className="btn primary" onClick={startRaid} disabled={!canStartRaid || state.movePayload}>
                Start Raid
              </button>
              <button className="btn primary" onClick={endTurn} disabled={!canEndTurn || state.movePayload}>
                End Turn
              </button>
              <button
                className="btn"
                onClick={upgradeDungeon}
                disabled={locked || state.movePayload || !isBuildPhase || state.raidActive || atDungeonLevelCap}
              >
                {atDungeonLevelCap ? "Dungeon Maxed" : "Upgrade Dungeon"}
              </button>
              <button className="btn" onClick={startMove} disabled={locked || !!state.movePayload || !isBuildPhase}>
                Move Selected
              </button>
              {state.movePayload ? (
                <button className="btn danger" onClick={cancelMove}>
                  Cancel Move
                </button>
              ) : null}
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
                {isAshTrialActive(state.ashTrial) ? "All entrances connected" : "Valid path E to C"}
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
              <div className="muted">Directive: {pendingDirective.name}</div>
              <div className="muted small">Expected mix: {raidForecastMix}</div>
              {state.pendingCouncilRaid?.attackers?.length ? (
                <div className="entityList">
                  {state.pendingCouncilRaid.attackers.map((attacker) => (
                    <div className="entityItem" key={`raid-attacker-${attacker.key}`}>
                      <div className="entityName">{attacker.memberName}</div>
                      <div className="entityMeta">{attacker.raidName}</div>
                      <div className="muted">{attacker.raidModifier}</div>
                      <div className="muted small">
                        Directive {getRaidDirectiveRule(attacker.directiveKey || COUNCIL_RAID_FACTIONS[attacker.key]?.defaultDirective || state.pendingCouncilRaid?.directiveKey || "rush-core").name} |{" "}
                        {topArchetypesFromWeights(attacker.archetypeWeights || {}, 2).join(" / ") || "Mixed pressure"}
                      </div>
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
              <div className="cardTitle">Tile Details</div>
              <div className="kv">
                <div>Pos</div>
                <div>({state.selected.x + 1}, {state.selected.y + 1})</div>
                <div>Entrance</div>
                <div>{selectedTile.entrance ? "YES" : "no"}</div>
                <div>Ash Breach</div>
                <div>{selectedIsAshBreach ? "YES" : "no"}</div>
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
                <div>Synergy Tag</div>
                <div>{selectedLinkInfo.tag || "none"}</div>
                <div>Link State</div>
                <div>{selectedLinkInfo.tag ? (selectedLinkInfo.linked ? "Linked" : "Unlinked") : "n/a"}</div>
                <div>Linked Bonus</div>
                <div>{selectedLinkBonus}</div>
                <div>Room Effect</div>
                <div>{roomTypeDesc(selectedTile, state.selected.x, state.selected.y) || "n/a"}</div>
                <div>Readiness</div>
                <div>{selectedReadiness}</div>
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
                            Origin {h.raidOriginLabel || "Hero Raid"}{h.factionName ? ` | ${h.factionName}` : ""}{h.isRaidLeader ? " | Leader" : ""} | Behavior {h.archetypeLabel || "Zealot"}{h.raidDirectiveKey ? ` | Directive ${getRaidDirectiveRule(h.raidDirectiveKey).name}` : ""}{h.memory?.lastIntent ? ` | Intent ${h.memory.lastIntent}` : ""}
                          </div>
                          <div className="muted">
                            Objective {h.memory?.currentObjective || "Press the Core"}{h.memory?.targetTile ? ` | Target ${objectiveTargetLabel(h.memory.targetTile)}` : ""}
                          </div>
                          <div className="muted">Status: {entityStatusSummary(h)}</div>
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
                            <span className="badge class">{safeEntityLabel(m.class, "Brute")}</span>
                            {m.isFused ? <span className="badge unique">Fused</span> : null} | {formatStars(safeEntityStars(m))} |{" "}
                            {safeEntityLabel(m.passive, "None")}
                          </div>
                          <div className="entityStats">
                            HP {m.hp}/{safeEntityMaxHp(m)} | ATK {m.atk} | DEF {m.def || 0} | SPD {monsterSpeedValue(m)} | Evo {m.evoPoints || 0}
                          </div>
                          <div className="muted">
                            {evolutionStageLabel(m)}{m.branchClass ? ` | Branch ${m.branchClass}` : ""}{m.fusionParents?.length ? ` | ${m.fusionParents.join(" + ")}` : ""}
                          </div>
                          <div className="muted">Status: {entityStatusSummary(m)}</div>
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
                      (() => {
                        const favorInfo = getCouncilFavorInfo(state.councilFavor?.[m.key] || 0);
                        return (
                          <div className="entityItem" key={m.key}>
                            <div className="entityName">
                              {m.name} - {m.title}
                            </div>
                            <div className="entityMeta">{m.theme}</div>
                            <div className="row">
                              <span className={`badge ${councilFavorBadgeTone(favorInfo)}`}>{formatCouncilFavorLabel(favorInfo)}</span>
                              <div className="muted">{m.role}</div>
                            </div>
                          </div>
                        );
                      })()
                    ))}
                  </div>
                  <div className="entityList">
                    {COUNCIL_FAVOR_RULES.map((line) => (
                      <div className="entityItem" key={`toolbox-favor-rule-${line}`}>
                        <div className="entityMeta">{line}</div>
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

            <div className="card">
              <div className="cardTitle">Flesh Market (Maltheron)</div>
              {state.fleshMarketUntilDay >= state.day && state.fleshMarketUntilDay > 0 ? (
                <>
                  <div className="muted">Open until Day {state.fleshMarketUntilDay}. Darkcrystals compete with Core Doctrine.</div>
                  <div className="row">
                    <select className="select" value={sacrificeIdx} onChange={(e) => setSacrificeIdx(e.target.value)}>
                      <option value="">Sacrifice: pick monster</option>
                      {state.invMonsters.map((m, idx) => (
                        <option key={`sac-${idx}`} value={idx} disabled={!!m.isUnique || !!m.isFused}>
                          {m.name}{m.isUnique ? " (Unique)" : m.isFused ? " (Fused)" : ""} ({formatStars(safeEntityStars(m))})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="row">
                    <button className="btn danger" onClick={() => sacrificeMonster(Number(sacrificeIdx))} disabled={sacrificeIdx === ""}>
                      Sacrifice
                    </button>
                    <div className="muted">Inventory only. Unique monsters cannot be sacrificed.</div>
                  </div>
                  <div className="entityList">
                    {state.fleshMarketStock?.length ? (
                      state.fleshMarketStock.map((offer, idx) => (
                        <div className="entityItem" key={`flesh-offer-${offer.key}-${idx}`}>
                          <div className="entityName">{offer.name}</div>
                          <div className="entityMeta">
                            {offer.type === "monster" ? "Unique Monster" : "Unique Artifact"}
                            {offer.type === "monster" ? ` | ${formatStars(offer.stars)}` : ""}
                          </div>
                          <div className="entityMeta">{offer.desc}</div>
                          {offer.type === "monster" ? (
                            <div className="muted small">
                              Passives: {(offer.passiveKeys || []).map((key) => MONSTER_PASSIVE_MAP[key]?.name || key).join(", ")}
                            </div>
                          ) : null}
                          <div className="muted">Cost: {offer.cost} Darkcrystals</div>
                          <div className="row">
                            <button className="btn" onClick={() => buyFromFleshMarket(idx)} disabled={!!offer.soldOut || state.currency.darkcrystals < offer.cost}>
                              {offer.soldOut ? "Owned" : "Buy"}
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="entityEmpty">No stock remains in the market today.</div>
                    )}
                  </div>
                  <div className="card">
                    <div className="cardTitle">Fusion Crucible</div>
                    <div className="row">
                      <select className="select" value={fuseA} onChange={(e) => setFuseA(e.target.value)}>
                        <option value="">Primary body</option>
                        {state.invMonsters.map((m, idx) => (
                          <option key={`fuse-a-${idx}`} value={idx} disabled={!!m.isUnique || !!m.isFused}>
                            {m.name}{m.isUnique ? " (Unique)" : m.isFused ? " (Fused)" : ""} ({formatStars(safeEntityStars(m))})
                          </option>
                        ))}
                      </select>
                      <select className="select" value={fuseB} onChange={(e) => setFuseB(e.target.value)}>
                        <option value="">Secondary trait</option>
                        {state.invMonsters.map((m, idx) => (
                          <option key={`fuse-b-${idx}`} value={idx} disabled={!!m.isUnique || !!m.isFused || `${idx}` === `${fuseA}`}>
                            {m.name}{m.isUnique ? " (Unique)" : m.isFused ? " (Fused)" : ""} ({formatStars(safeEntityStars(m))})
                          </option>
                        ))}
                      </select>
                    </div>
                    {fusionPreview ? (
                      <>
                        <div className="entityMeta">
                          Output: <span className="iconBadge">{fusionPreview.recipe?.icon || fusionPreview.result.icon}</span> {fusionPreview.result.name} | {formatStars(fusionPreview.result.stars)} | Stage {monsterEvolutionStageValue(fusionPreview.result)}
                        </div>
                        <div className="muted small">
                          Archetype: {fusionPreview.recipe?.name || "Abomination"} | Inherited Passives: {formatMonsterPassiveList(fusionPreview.result.passiveKeys, fusionPreview.result.passiveRanks)}
                        </div>
                        <div className="muted small">
                          Stats: HP {fusionPreview.result.stats.maxHp} | ATK {fusionPreview.result.stats.atk} | DEF {fusionPreview.result.stats.def}
                        </div>
                        <div className="muted small">Cost: {fusionPreview.cost} Darkcrystals | Secondary recipe shapes the fusion result.</div>
                      </>
                    ) : (
                      <div className="muted small">Choose a primary monster and a secondary trait donor. Unique and fused monsters cannot be used in v1.</div>
                    )}
                    <div className="row">
                      <button
                        className="btn"
                        onClick={triggerFusion}
                        disabled={!fusionPreview || state.currency.darkcrystals < fusionPreview.cost || state.phase !== "build"}
                      >
                        Fuse Monsters
                      </button>
                      <div className="muted small">Primary sets the body. Secondary sets the recipe and one inherited trait.</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="muted">Closed. Gain access by accepting Maltheron's Council boon.</div>
              )}
            </div>

            <div className="card">
              <div className="cardTitle">Path Preview</div>
              {selectedHeroes[0] && selectedHeroIntent ? (
                <>
                  <div className="entityName">{invaderLabel(selectedHeroes[0])}</div>
                  <div className="entityMeta">
                    {selectedHeroes[0].archetypeLabel || "Zealot"} | {selectedHeroIntent.directiveLabel}
                  </div>
                  <div className="muted">Objective: {selectedHeroIntent.currentObjective}</div>
                  <div className="muted">Target Tile: {selectedHeroIntent.targetTileLabel}</div>
                  <div className="muted small">Intent: {selectedHeroIntent.intent}</div>
                  <div className="muted">
                    Path tiles glow cyan. Likely lure candidates glow amber.
                  </div>
                </>
              ) : activeEntrances.length > 0 && core ? (
                <div className="muted">
                  {activeEntrances.length > 1
                    ? "All active entrance routes are highlighted while no invader is selected."
                    : "Default entrance-to-core route is highlighted while no invader is selected."}
                </div>
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

                <div className="muted">Up to {effectiveMonsterRoomCapValue(state, 1)} monsters inside.</div>
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
                <button className="btn danger" onClick={clearTile} disabled={locked || state.movePayload || !isBuildPhase || selectedTile.entrance || isAshBreachAt(state.ashTrial, state.selected.x, state.selected.y)}>Clear Tile</button>
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
              <div className="cardTitle">Room Staffing</div>
              {selectedTile.room === "monster" ? (
                <>
                  <div className="row">
                    <select
                      className="select"
                      value={selectedInventoryMonsterIndex}
                      onChange={(e) => setSelectedInventoryMonsterIndex(e.target.value)}
                      disabled={!canManageSelectedMonsterRoom || !state.invMonsters.length || !selectedMonsterRoomHasSpace}
                    >
                      <option value="">Choose inventory monster</option>
                      {state.invMonsters.map((monster, idx) => (
                        <option key={`room-staff-${idx}`} value={idx}>
                          {monster.name} ({formatStars(safeEntityStars(monster))})
                        </option>
                      ))}
                    </select>
                    <div className="muted">
                      Room {selectedTile.monsters.length}/{selectedMonsterRoomCapValue}
                    </div>
                  </div>
                  <div className="row">
                    <button
                      className="btn"
                      onClick={addMonsterToRoom}
                      disabled={!canManageSelectedMonsterRoom || !selectedMonsterRoomHasSpace || selectedInventoryMonsterIndex === ""}
                    >
                      Place Selected Monster
                    </button>
                    <div className="muted">
                      {artifactMods.roomWithdrawHealFull
                        ? "Stable Hooks heals withdrawn monsters to full."
                        : "Build phase only. Transfer uses return -> place."}
                    </div>
                  </div>
                  {selectedTile.monsters.length ? (
                    <div className="entityList">
                      {selectedTile.monsters.map((monster, idx) => (
                        <div className="entityItem" key={`room-monster-${idx}`}>
                          <div className="entityName">{monster.name}</div>
                          <div className="entityMeta">
                            {safeEntityLabel(monster.race, "Monster")}
                            <span className="badge class">{safeEntityLabel(monster.class, "Brute")}</span>
                            {monster.isFused ? <span className="badge unique">Fused</span> : null} | {formatStars(safeEntityStars(monster))}
                          </div>
                          <div className="entityStats">
                            HP {monster.hp}/{safeEntityMaxHp(monster)} | ATK {monster.atk} | DEF {monster.def || 0} | SPD {monsterSpeedValue(monster)}
                          </div>
                          <div className="muted">Status: {entityStatusSummary(monster)}</div>
                          <div className="row">
                            <button className="btn small" onClick={() => returnMonsterFromSelectedRoom(idx)} disabled={!canManageSelectedMonsterRoom}>
                              Return to Inventory
                            </button>
                            <div className="muted small">{evolutionStageLabel(monster)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="entityEmpty">No monsters stationed here.</div>
                  )}
                  <div className="row">
                    <button className="btn danger" onClick={returnAllMonstersFromSelectedRoom} disabled={!canManageSelectedMonsterRoom || !selectedTile.monsters.length}>
                      Withdraw All
                    </button>
                    <div className="muted">Return the room roster to inventory.</div>
                  </div>
                </>
              ) : (
                <div className="muted">Select a monster room to place or withdraw monsters.</div>
              )}
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
                  {state.shadyStock.map((rawArtifact, idx) => {
                    const artifact = hydrateArtifactDefinition(rawArtifact);
                    const ownedCount = ownedArtifactCounts[artifact.key] || 0;
                    const copyCap = artifactCopyCap(artifact);
                    const atCap = ownedCount >= copyCap;
                    return (
                      <div className="entityItem" key={`artifact-${artifact.key}-${idx}`}>
                        <div className="entityName">{artifact.name}</div>
                        <div className="entityMeta">{artifact.desc}</div>
                        <div className="dockBadgeRow">
                          {artifactTagsForDisplay(artifact).map((tag) => (
                            <span className="badge favorNeutral" key={`${artifact.key}-tag-${tag}`}>
                              {tag}
                            </span>
                          ))}
                          <span className="muted small">Owned {ownedCount}/{copyCap}</span>
                        </div>
                        <div className="row">
                          <button className="btn" onClick={() => buyArtifact(idx)} disabled={!isBuildPhase || atCap}>
                            Buy ({artifact.cost.amount} {artifact.cost.currency})
                          </button>
                          <div className="muted">{atCap ? "Copy cap reached" : "Daily stock"}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="muted">Dealer is out of stock.</div>
              )}
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
                        <div className="muted small">
                          {h.raidOriginLabel || "Hero Raid"}{h.factionName ? ` | ${h.factionName}` : ""}{h.isRaidLeader ? " | Leader" : ""}
                          {h.raidDirectiveKey ? ` | ${getRaidDirectiveRule(h.raidDirectiveKey).name}` : ""}
                        </div>
                        <div className="muted small">
                          Objective {h.memory?.currentObjective || "Press the Core"}{h.memory?.targetTile ? ` | ${objectiveTargetLabel(h.memory.targetTile)}` : ""}
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
                        {safeEntityLabel(h.race, "Unknown")} {safeEntityLabel(h.class, "Hero")} | {formatStars(safeEntityStars(h))} | {h.archetypeLabel || "Zealot"}
                      </div>
                      <div className="entityStats">
                        HP {h.hp}/{safeEntityMaxHp(h)} | ATK {h.atk}
                      </div>
                      <div className="muted small">{invaderPassiveSummary(h)}</div>
                      <div className="muted small">
                        {h.raidOriginLabel || "Hero Raid"}{h.factionName ? ` | ${h.factionName}` : ""}{h.isRaidLeader ? " | Leader" : ""}
                        {h.raidDirectiveKey ? ` | ${getRaidDirectiveRule(h.raidDirectiveKey).name}` : ""}
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
              {ownedArtifactGroups.length ? (
                <div className="entityList">
                  {ownedArtifactGroups.map(({ artifact, count }) => (
                    <div className="entityItem" key={`owned-${artifact.key}`}>
                      <div className="entityName">{artifact.name}</div>
                      <div className="entityMeta">{artifact.desc}</div>
                      <div className="dockBadgeRow">
                        {artifactTagsForDisplay(artifact).map((tag) => (
                          <span className="badge favorNeutral" key={`${artifact.key}-owned-tag-${tag}`}>
                            {tag}
                          </span>
                        ))}
                        <span className="muted small">Owned {count}/{artifactCopyCap(artifact)}</span>
                      </div>
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
                        <span className="badge class">{safeEntityLabel(m.class, "Brute")}</span>
                        {m.isFused ? <span className="badge unique">Fused</span> : null} | {formatStars(safeEntityStars(m))} |{" "}
                        {safeEntityLabel(m.passive, "None")}
                      </div>
                      <div className="entityStats">
                        HP {m.hp}/{safeEntityMaxHp(m)} | ATK {m.atk} | DEF {m.def || 0} | SPD {monsterSpeedValue(m)} | Evo {m.evoPoints || 0}
                      </div>
                      <div className="muted">
                        {evolutionStageLabel(m)}{m.branchClass ? ` | Branch ${m.branchClass}` : ""}{m.fusionParents?.length ? ` | ${m.fusionParents.join(" + ")}` : ""}
                      </div>
                      <div className="muted">Status: {entityStatusSummary(m)}</div>
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
                      {selectedTile.room === "monster" ? (
                        <div className="row">
                          <button
                            className="btn small"
                            onClick={() => placeInventoryMonsterInSelectedRoom(idx)}
                            disabled={!canManageSelectedMonsterRoom || !selectedMonsterRoomHasSpace}
                          >
                            Assign to Selected Room
                          </button>
                          <div className="muted small">
                            {selectedMonsterRoomHasSpace
                              ? `Room ${selectedTile.monsters.length}/${selectedMonsterRoomCapValue}`
                              : "Selected room is full."}
                          </div>
                        </div>
                      ) : null}
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
                          {item.monster.isFused ? <span className="badge unique">Fused</span> : null}{" "}
                          {formatStars(safeEntityStars(item.monster))} | Evo {item.monster.evoPoints || 0} |{" "}
                          {safeEntityLabel(item.monster.passive, "None")}
                        </div>
                        <div className="entityStats">
                          HP {item.monster.hp}/{safeEntityMaxHp(item.monster)} | ATK {item.monster.atk} | DEF {item.monster.def || 0} | SPD {monsterSpeedValue(item.monster)}
                        </div>
                        <div className="muted">Location: {item.label}</div>
                        <div className="muted">
                          {evolutionStageLabel(item.monster)}{item.monster.branchClass ? ` | Branch ${item.monster.branchClass}` : ""}{item.monster.fusionParents?.length ? ` | ${item.monster.fusionParents.join(" + ")}` : ""}
                        </div>
                        <div className="muted">Status: {entityStatusSummary(item.monster)}</div>
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

        <section className="panel panel--council" style={{ "--council-scroll-url": `url(${COUNCIL_CHAMBER_ART.scrollTexture})` }}>
          <div className="panelTitle">Council of the Dungeonlords</div>
          <div className="toolboxScroll">
            {state.councilSession && state.councilSession.day === state.day ? (
              <>
                <div className="card">
                  <div className="cardTitle">Attending Lords</div>
                  <div className="entityList">
                    {(state.council?.roster || []).map((m) => (
                      (() => {
                        const favorInfo = getCouncilFavorInfo(state.councilFavor?.[m.key] || 0);
                        return (
                          <button
                            className={`entityItem ${focusedCouncilMember?.key === m.key ? "active" : ""}`}
                            key={`council-${m.key}`}
                            onClick={() => setFocusedCouncilKey(m.key)}
                            type="button"
                          >
                            <div className="entityName">
                              {m.name} - {m.title}
                            </div>
                            <div className="entityMeta">{m.theme}</div>
                            <div className="row">
                              <span className={`badge ${councilFavorBadgeTone(favorInfo)}`}>{formatCouncilFavorLabel(favorInfo)}</span>
                              <div className="muted">{m.role}</div>
                            </div>
                          </button>
                        );
                      })()
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
                  <div className="cardTitle">Favor Rules</div>
                  <div className="entityList">
                    {COUNCIL_FAVOR_RULES.map((line) => (
                      <div className="entityItem" key={`favor-rule-side-${line}`}>
                        <div className="entityMeta">{line}</div>
                      </div>
                    ))}
                  </div>
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
                  <div className="cardTitle">Sponsor Boon</div>
                  {focusedCouncilSponsor?.boon ? (
                    <>
                      <div className="entityName">{focusedCouncilSponsor.boon.title}</div>
                      <div className="entityMeta">{focusedCouncilSponsor.boon.desc}</div>
                      <div className="muted">{councilRewardLabel(focusedCouncilSponsor.boon.reward)}</div>
                      <div className="muted small">{focusedCouncilSponsor.boon.raidEffect?.desc || "No next-raid leverage."}</div>
                      <div className="muted small">{formatCouncilFavorLabel(focusedCouncilSponsor.favorInfo || focusedCouncilStanding)}</div>
                      {!focusedCouncilSponsor.available ? <div className="muted small">{focusedCouncilSponsor.lockedReason}</div> : null}
                      <div className="row">
                        {state.councilSession.status !== "attended" ? (
                          <button className="btn" disabled>
                            Attend First
                          </button>
                        ) : !focusedCouncilSponsor.available ? (
                          <button className="btn" disabled>
                            Unavailable
                          </button>
                        ) : state.councilSession.acceptedCouncilBoonKey === focusedCouncilSponsor.key ? (
                          <button className="btn" disabled>
                            Accepted
                          </button>
                        ) : state.councilSession.acceptedCouncilBoonKey ? (
                          <button className="btn" disabled>
                            Boon Taken
                          </button>
                        ) : state.councilSession.courtedSponsorKey && state.councilSession.courtedSponsorKey !== focusedCouncilSponsor.key ? (
                          <button className="btn" disabled>
                            Courting Another Sponsor
                          </button>
                        ) : (
                          <button className="btn" onClick={() => acceptCouncilBoon(focusedCouncilSponsor.key)}>
                            Accept Boon
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="entityEmpty">
                      {state.councilSession.status === "attended" ? "Select a Dungeonlord to review their boon." : "Attend the Council to access boons."}
                    </div>
                  )}
                </div>

                <div className="card">
                  <div className="cardTitle">Active Council Quest</div>
                  {state.councilQuest?.active ? (
                    <>
                      <div className="entityName">{state.councilQuest.title}</div>
                      <div className="entityMeta">{state.councilQuest.desc}</div>
                      <div className="muted">{state.councilQuest.sponsorName}</div>
                      <div className="muted">Progress: {councilQuestProgressLabel(state, state.councilQuest)}</div>
                      <div className="muted">Reward: {councilRewardLabel(state.councilQuest.reward)}</div>
                      {state.councilQuest.failurePenalty ? <div className="muted small">Failure: {state.councilQuest.failurePenalty}</div> : null}
                    </>
                  ) : (
                    <div className="entityEmpty">No active quest.</div>
                  )}
                </div>

                <div className="card">
                  <div className="cardTitle">Sponsor Quests</div>
                  {focusedCouncilSponsor ? (
                    <div className="entityList">
                    {["standard", "hard"].map((difficulty) => {
                      const quest = focusedCouncilSponsor.quests?.[difficulty];
                      if (!quest) return null;
                      const taken = state.councilSession.acceptedCouncilQuestId === quest.id;
                      const blockedBySponsor =
                        !!state.councilSession.courtedSponsorKey && state.councilSession.courtedSponsorKey !== focusedCouncilSponsor.key;
                      const placementBlockedReason = councilQuestPlacementBlock(quest);
                      return (
                        <div className="entityItem" key={quest.id}>
                          <div className="entityName">
                            {quest.title} ({difficulty})
                          </div>
                            <div className="entityMeta">{quest.desc}</div>
                          <div className="muted">{councilQuestGoalLabel(quest)}</div>
                          <div className="muted">Progress: {councilQuestProgressLabel(state, quest)}</div>
                          <div className="muted">Reward: {councilRewardLabel(quest.reward)}</div>
                          <div className="muted small">{formatCouncilFavorLabel(focusedCouncilSponsor.favorInfo || focusedCouncilStanding)}</div>
                          {quest.failurePenalty ? <div className="muted small">Failure: {quest.failurePenalty}</div> : null}
                          {!quest.available ? <div className="muted small">{quest.lockedReason}</div> : null}
                          {placementBlockedReason ? <div className="muted small">{placementBlockedReason}</div> : null}
                          <div className="row">
                            {state.councilSession.status !== "attended" ? (
                              <button className="btn" disabled>
                                Attend First
                              </button>
                            ) : !quest.available ? (
                              <button className="btn" disabled>
                                Unavailable
                              </button>
                            ) : placementBlockedReason ? (
                              <button className="btn" disabled>
                                Frontline Needed
                              </button>
                            ) : taken ? (
                              <button className="btn" disabled>
                                Accepted
                              </button>
                            ) : state.councilSession.acceptedCouncilQuestId || state.councilQuest?.active ? (
                                <button className="btn" disabled>
                                  Quest Taken
                                </button>
                              ) : blockedBySponsor ? (
                                <button className="btn" disabled>
                                  Courting Another Sponsor
                                </button>
                              ) : (
                                <button className="btn" onClick={() => acceptCouncilQuest(focusedCouncilSponsor.key, difficulty)}>
                                  Accept {difficulty}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="entityEmpty">Select a Dungeonlord to review their quests.</div>
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
              <div className="cardTitle">Room Rules</div>
              <div className="entityList">
                <div className="entityItem">
                  <div className="entityName">Utility Rooms</div>
                  <div className="entityMeta">Support-only tiles. They affect adjacent tiles within 1 square and are not meant to be traversed.</div>
                </div>
                <div className="entityItem">
                  <div className="entityName">Monster Rooms</div>
                  <div className="entityMeta">House your monsters and add a room passive. Base cap is 3 monsters, increased by room tier and doctrine.</div>
                </div>
                <div className="entityItem">
                  <div className="entityName">Trap Rooms</div>
                  <div className="entityMeta">Trigger when invaders enter. Trap stars and ranks increase damage, charges, and cooldown efficiency.</div>
                </div>
                <div className="entityItem">
                  <div className="entityName">Room Upgrades</div>
                  <div className="entityMeta">Most room effects scale with tier. Check the Selected Tile panel for the current exact values.</div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="cardTitle">Room Links</div>
              <div className="entityList">
                <div className="entityItem">
                  <div className="entityName">Link Rule</div>
                  <div className="entityMeta">New Blood, Ward, and Hunt rooms become Linked when at least one orthogonally adjacent room shares the same tag.</div>
                </div>
                <div className="entityItem">
                  <div className="entityName">No Stacking</div>
                  <div className="entityMeta">A linked bonus only needs one matching neighbor and does not stack from multiple matching neighbors.</div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="cardTitle">Utility Rooms</div>
              <div className="entityList">
                {UTILITY_ROOMS.map((room) => (
                  <div className="entityItem" key={room.key}>
                    <div className="entityName">
                      <span className="iconBadge">{UTILITY_ICONS[room.key] || "UR"}</span>
                      {room.name}
                    </div>
                    <div className="entityMeta">{room.desc}</div>
                    {room.synergyTag ? <div className="muted small">Tag {room.synergyTag} | Linked: {room.linkDesc}</div> : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="cardTitle">Monster Rooms</div>
              <div className="entityList">
                {MONSTER_ROOMS.map((room) => (
                  <div className="entityItem" key={room.key}>
                    <div className="entityName">
                      <span className="iconBadge">{MONSTER_ROOM_ICONS[room.key] || "MR"}</span>
                      {room.name}
                    </div>
                    <div className="entityMeta">{room.desc}</div>
                    {room.synergyTag ? <div className="muted small">Tag {room.synergyTag} | Linked: {room.linkDesc}</div> : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="cardTitle">Trap Rooms</div>
              <div className="entityList">
                {TRAP_TYPES.map((trap) => (
                  <div className="entityItem" key={trap.key}>
                    <div className="entityName">
                      <span className="iconBadge">{TRAP_ICONS[trap.key] || "TR"}</span>
                      {trap.name}
                    </div>
                    <div className="entityMeta">{trap.desc}</div>
                    <div className="muted small">Base damage {trap.baseDmg} | Base cooldown {trap.baseCooldown}</div>
                    {trap.synergyTag ? <div className="muted small">Tag {trap.synergyTag} | Linked: {trap.linkDesc}</div> : null}
                  </div>
                ))}
              </div>
            </div>

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

            <div className="card">
              <div className="cardTitle">Statuses</div>
              <div className="entityList">
                {STATUS_RULE_LIST.map((status) => (
                  <div className="entityItem" key={status.key}>
                    <div className="entityName">
                      {status.name} <span className="muted small">({status.short})</span>
                    </div>
                    <div className="entityMeta">{status.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="cardTitle">New Recruits</div>
              <div className="entityList">
                {STANDARD_MONSTERS.filter((monster) => NEW_RECRUIT_MONSTER_KEYS.has(monster.key)).map((monster) => (
                  <div className="entityItem" key={monster.key}>
                    <div className="entityName">
                      <span className="iconBadge">{monster.icon}</span>
                      {monster.name}
                    </div>
                    <div className="entityMeta">
                      HP {monster.hp} | ATK {monster.atk} | Cost {monster.cost}
                    </div>
                    <div className="muted small">
                      Unlock Day {monster.unlockDay} | Classes {(monster.classPool || []).join(", ") || (monster.affinityPool || []).join(", ")}
                    </div>
                    <div className="muted small">
                      Passive Bias {(monster.passiveBias || []).join(", ") || "None"} | Fusion {monster.fusionHint || "auto"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="cardTitle">Flesh Market Fusion</div>
              <div className="entityList">
                {Object.values(FUSION_ARCHETYPE_RULES).map((rule) => (
                  <div className="entityItem" key={rule.key}>
                    <div className="entityName">
                      <span className="iconBadge">{rule.icon}</span>
                      {rule.name}
                    </div>
                    <div className="entityMeta">Secondary role recipe for {rule.classTags.join(", ")}.</div>
                    <div className="muted small">Base cost {rule.baseCost} Darkcrystals. Primary body + secondary archetype shaping.</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="cardTitle">Artifacts</div>
              <div className="entityList">
                {STANDARD_ARTIFACTS.map((artifact) => (
                  <div className="entityItem" key={artifact.key}>
                    <div className="entityName">{artifact.name}</div>
                    <div className="entityMeta">{artifact.desc}</div>
                    <div className="dockBadgeRow">
                      {artifactTagsForDisplay(artifact).map((tag) => (
                        <span className="badge favorNeutral" key={`${artifact.key}-glossary-tag-${tag}`}>
                          {tag}
                        </span>
                      ))}
                      <span className="muted small">Unlock Day {artifact.unlockDay}</span>
                      <span className="muted small">Max {artifact.maxCopies}</span>
                    </div>
                    <div className="muted small">Cost: {artifact.cost.amount} {artifact.cost.currency}</div>
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



