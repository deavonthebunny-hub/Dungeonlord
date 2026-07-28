import { FLESH_MARKET_UNIQUE_ARTIFACTS, FLESH_MARKET_UNIQUE_MONSTERS, STANDARD_ARTIFACTS } from "../gameContent";
import { artifactCopyCap, calcArtifactMods, countOwnedArtifacts, hydrateArtifactDefinition } from "./economy";
import { createPassiveRanks, entityStarsValue, formatMonsterPassiveList, fusionPassiveSelection, fusionRecipeForMonster, generateMonster, monsterEvolutionStageValue, pickWeightedMonsterDef, rebuildMonsterEntity } from "./monsters";
import { MONSTER_KEYS, STANDARD_ARTIFACT_MAP, clampMonsterStar, councilEraIndex, monsterStarCapForDay, pick, pickUnique } from "./shared";

function normalizeArtifactStock(stock = [], day = 1, ownedArtifacts = []) {
  if (Array.isArray(stock)) {
    return stock
      .filter((artifact) => STANDARD_ARTIFACT_MAP[artifact?.key])
      .map((artifact) => hydrateArtifactDefinition(artifact));
  }
  return generateArtifactStock(day, ownedArtifacts);
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

export { normalizeArtifactStock, generateTraderStock, generateArtifactStock, fleshMarketEraIndex, buildUniqueMonsterEntity, buildFusedMonsterEntity, normalizeBoughtUniqueKeys, generateFleshMarketStock };
