import { CORE_MAX_HP, MAX_ROOMS_BASE, ROOMS_PER_LEVEL, STANDARD_ARTIFACT_MAP, UNIQUE_ARTIFACT_MAP, clampDungeonLevel, isTimedBlessingActive } from "./shared";

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
function calcArtifactMods(artifacts) {
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
    monsterSpd: 0,
    scoutRevealBonus: 0,
    scoutRevealPenalty: 0,
    trapChargeBonus: 0,
    monsterRoomCapBonus: 0,
    trapKillEssence: 0,
    utilityPotencyBonus: 0,
    roomWithdrawHealFull: 0,
    shadyStockBonus: 0,
    bloodLinkedEssenceBonus: 0,
    bloodLinkedSoulshardOnKill: 0,
    bloodLinkedMonsterAtk: 0,
    bloodLinkedTrapKillSoulshard: 0,
    wardLinkedWeakenDuration: 0,
    huntLinkedTrapFlatDamage: 0,
    huntLinkedLureBonus: 0,
    huntLinkedScoutRevealBonus: 0,
    huntLinkedMonsterSpd: 0,
    wardLinkedMonsterDef: 0,
    wardLinkedTrapChargeBonus: 0,
    dungeonUpgradeDiscount: 0,
    ashTrialMonsterDef: 0,
    ashTrialTrapChargeBonus: 0,
    monsterBonusVsMarked: 0,
    doctrineCostReduction: 0,
    fusionCostReduction: 0,
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

export { cloneArtifactEntry, hydrateArtifactDefinition, artifactCopyCap, artifactTagsForDisplay, countOwnedArtifacts, normalizeArtifactList, getDoctrineEffects, getCoreMaxHp, getDungeonRoomCap, calcArtifactMods };
