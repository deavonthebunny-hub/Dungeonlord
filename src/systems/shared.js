import { FLESH_MARKET_UNIQUE_ARTIFACTS, FLESH_MARKET_UNIQUE_MONSTERS, STANDARD_ARTIFACTS, STANDARD_MONSTERS, STATUS_RULES } from "../gameContent";
import { COUNCIL_INTERVAL } from "../gameRules";
import { randomFloat } from "../random";

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
const DOMINION_CAP = 4;
const BASE_MONSTER_ROOM_CAP = 3;
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
  const r = randomFloat();
  if (r < 0.35) return pick(DAILY_EVENTS.filter((e) => e.key !== "none"));
  return DAILY_EVENTS[0];
}
function pick(arr) {
  return arr[Math.floor(randomFloat() * arr.length)];
}
function pickUnique(arr, count) {
  const copy = arr.slice();
  const out = [];
  while (copy.length && out.length < count) {
    const idx = Math.floor(randomFloat() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}
function nextCouncilDay(day) {
  const d = Math.max(1, day || 1);
  return Math.ceil(d / COUNCIL_INTERVAL) * COUNCIL_INTERVAL;
}
function nextCouncilDayAfter(day) {
  return nextCouncilDay(Math.max(1, day || 1) + 1);
}
function isTimedBlessingActive(untilDay, day) {
  return Number.isFinite(untilDay) && untilDay > day;
}
function formatGridPos(pos) {
  return `(${pos.x + 1},${pos.y + 1})`;
}
function councilEraIndex(day = 1) {
  if (day <= 20) return 0;
  if (day <= 50) return 1;
  return 2;
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
  const r = randomFloat();
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
function addLog(state, msg) {
  const log = [msg, ...state.log].slice(0, 90);
  return { ...state, log };
}

function formatStars(stars) {
  return stars === 6 ? "6-Star (Unique)" : `${stars}-Star`;
}
function safeEntityStars(entity) {
  return typeof entity?.stars === "number" ? entity.stars : 1;
}
function safeEntityMaxHp(entity) {
  return entity?.stats && typeof entity.stats.maxHp === "number" ? entity.stats.maxHp : entity?.hp || 0;
}
function safeEntityLabel(entity, fallback) {
  return entity || fallback;
}

export { W, H, MAX_ROOMS_BASE, ROOMS_PER_LEVEL, MAX_DUNGEON_LEVEL, CORE_MAX_HP, DAY_START_PARTY_MIN, DAY_START_PARTY_MAX, ROOM_TIER_MAX, HERO_BASE, TRAP, HERO_KILL_ESSENCE, HERO_KILL_SOULSHARDS, HERO_CAP, DUNGEON_LORD_ATK, DOMINION_CAP, BASE_MONSTER_ROOM_CAP, clamp, ECONOMY_ROLES, STAR_MULTIPLIERS, MAX_MONSTER_STAR, MAX_EVOLUTION_STAGE, EVOLUTION_COSTS, clampDungeonLevel, MONSTERS, MONSTER_KEYS, UNIQUE_MONSTER_MAP, UNIQUE_ARTIFACT_MAP, STANDARD_ARTIFACT_MAP, KNOW_MONSTER_KEY, KNOW_MONSTER_ENTITY, STATUS_RULE_LIST, NEW_RECRUIT_MONSTER_KEYS, DAILY_EVENTS, rollDailyEvent, pick, pickUnique, nextCouncilDay, nextCouncilDayAfter, isTimedBlessingActive, formatGridPos, councilEraIndex, dayMultiplier, scaleByDay, monsterStarCapForDay, clampMonsterStar, monsterStarMultiplier, rollAuthoritativeStar, addLog, formatStars, safeEntityStars, safeEntityMaxHp, safeEntityLabel };
