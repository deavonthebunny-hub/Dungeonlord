import { FUSION_ARCHETYPE_RULES } from "../gameContent";
import { randomFloat } from "../random";
import { calcArtifactMods, getDoctrineEffects } from "./economy";
import { BASE_MONSTER_ROOM_CAP, EVOLUTION_COSTS, KNOW_MONSTER_ENTITY, KNOW_MONSTER_KEY, MAX_EVOLUTION_STAGE, MONSTERS, MONSTER_KEYS, STATUS_RULE_LIST, UNIQUE_MONSTER_MAP, clamp, clampMonsterStar, isTimedBlessingActive, monsterStarMultiplier, pick, pickUnique, rollAuthoritativeStar, scaleByDay } from "./shared";

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
  let roll = randomFloat() * totalWeight;
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
  let roll = randomFloat() * totalWeight;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) return entry;
  }
  return entries[entries.length - 1];
}
function rollPassiveCount(stars) {
  switch (clampMonsterStar(stars)) {
    case 1:
      return randomFloat() < 0.55 ? 0 : 1;
    case 2:
      return 1;
    case 3:
      return randomFloat() < 0.5 ? 1 : 2;
    case 4:
      return 2;
    default:
      return randomFloat() < 0.55 ? 2 : 3;
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
function monsterPassiveKeys(monster) {
  return normalizePassiveKeysForMonster(monster);
}
function monsterHasPassive(monster, key) {
  return monsterPassiveKeys(monster).includes(key);
}
function monsterPassiveRank(monster, key) {
  if (!monsterHasPassive(monster, key)) return 0;
  return Math.max(1, monster?.passiveRanks?.[key] || 1);
}
function roomPassiveRank(room, key) {
  let rank = 0;
  for (const monster of room?.monsters || []) {
    rank = Math.max(rank, monsterPassiveRank(monster, key));
  }
  return rank;
}
function roomHasPassive(room, key) {
  return roomPassiveRank(room, key) > 0;
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
function discountedFusionCost(first, second, artifactMods = {}) {
  return Math.max(1, fusionCost(first, second) - (artifactMods?.fusionCostReduction || 0));
}
function dungeonUpgradeCost(currentLevel, day = 1, artifactMods = {}) {
  return Math.max(1, scaleByDay(25 + currentLevel * 15, day, 0.03, 3.0) - (artifactMods?.dungeonUpgradeDiscount || 0));
}
function doctrineUpgradeCost(rule, currentLevel = 0, artifactMods = {}) {
  const nextLevelDef = rule?.levels?.[currentLevel];
  if (!nextLevelDef) return null;
  return Math.max(1, nextLevelDef.cost - (artifactMods?.doctrineCostReduction || 0));
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

export { MONSTER_ARCHETYPES, MONSTER_PASSIVE_RULES, MONSTER_PASSIVE_MAP, MONSTER_PASSIVES, MONSTER_TITLES, MONSTER_EVOLUTION_BRANCHES, BRANCH_PASSIVE_BY_CLASS, availableStandardMonsterDefs, pickWeightedMonsterDef, pickRewardMonsterEntry, rollPassiveCount, createPassiveRanks, passiveRankLabel, formatMonsterPassiveList, normalizePassiveKeysForMonster, monsterPassiveKeys, monsterHasPassive, monsterPassiveRank, roomPassiveRank, roomHasPassive, monsterRoleBucket, fusionRecipeForMonster, entityStarsValue, fusionCost, discountedFusionCost, dungeonUpgradeCost, doctrineUpgradeCost, fusionPassiveSelection, monsterSpeedValue, entityStatusSummary, monsterEvolutionStageValue, monsterEvolutionCost, monsterCanEvolve, defaultBranchClass, monsterBaseDef, getMonsterBaseData, buildMonsterPassiveLoadout, buildMonsterStats, rebuildMonsterEntity, spendEvolutionPoints, generateMonster, initMonsterInventory, monsterRoomCap, effectiveMonsterRoomCapValue, roomPermanentBonusTotal, inferPermanentRoomBonuses, applyStoredPermanentRoomBonuses, prepareMonsterForInventory, applyMonsterRoomPlacementStatic, normalizeMonsterEntity };
