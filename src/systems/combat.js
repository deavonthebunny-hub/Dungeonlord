import { isCouncilDay } from "../gameRules";
import { randomFloat } from "../random";
import {
  addCouncilQuestCounter,
  addLogLines,
  applyCouncilFavorShiftDetailed,
  applyCouncilRewardToState,
  buildCouncilRoster,
  buildCouncilSession,
  councilQuestProgressValue,
  createEmptyCouncilQuestCounters,
  decayCouncilFavorTowardNeutral,
  normalizeCouncilFavorMap,
} from "./council";
import {
  TRAP_MAP,
  bloodDeathBonuses,
  bloodMonsterAtkBonus,
  cloneGrid,
  createEmptyAshTrial,
  findEntranceAndCore,
  getActiveEntrances,
  hasUtilityAura,
  huntMonsterSpdBonus,
  huntTrapFlatDamageBonus,
  isAshTrialActive,
  isLinkedRoom,
  keyOf,
  orthogonalUtilityTier,
  resetArmedTrapsForRaid,
  trapCooldownAfterTrigger,
  utilityTier,
  wardMonsterDefBonus,
} from "./dungeon";
import { calcArtifactMods, getCoreMaxHp, getDoctrineEffects } from "./economy";
import { generateArtifactStock, generateFleshMarketStock, generateTraderStock } from "./markets";
import {
  monsterHasPassive,
  monsterPassiveRank,
  monsterSpeedValue,
  normalizePassiveKeysForMonster,
  roomHasPassive,
  roomPassiveRank,
} from "./monsters";
import { chooseInvaderMove, pickSpawnEntrance, validateDungeon } from "./pathing";
import { invaderLabel } from "./presentation";
import {
  buildRaidModifiers,
  createHeroMemory,
  generateHero,
  mergeRaidIntelKey,
  normalizeEscalationLevel,
  normalizeHeroPassiveKey,
  normalizeRaidIntel,
  partyLeaderTraitKey,
  prepareRaidPlanForDay,
  purgerBonusAt,
  raidClearEvolutionBonus,
  raidPlanningState,
  raidRewardMultiplier,
  raidTypeMeta,
  resolveRaidDirectiveKey,
} from "./raids";
import {
  DOMINION_CAP,
  DUNGEON_LORD_ATK,
  H,
  HERO_CAP,
  HERO_KILL_ESSENCE,
  HERO_KILL_SOULSHARDS,
  W,
  addLog,
  clampMonsterStar,
  dayMultiplier,
  formatGridPos,
  formatStars,
  isTimedBlessingActive,
  nextCouncilDayAfter,
  rollDailyEvent,
  safeEntityMaxHp,
} from "./shared";

export function spawnOneHero(heroes, nextId, entranceOptions, turnsSurvived, queueIn, grid, raidType, day = 1, escalationLevel = 0) {
  let queue = queueIn ? [...queueIn] : [];
  const spawnFrom = Array.isArray(entranceOptions) ? pickSpawnEntrance(grid, { active: true, breaches: entranceOptions.filter((entry) => entry.kind === "ash-breach") }) : entranceOptions;
  if (!spawnFrom) return { nextHeroId: nextId, scoutQueue: queue, spawned: null, entrance: null };
  let hero;
  if (queue.length > 0) {
    hero = { ...queue.shift() };
    hero.x = spawnFrom.x;
    hero.y = spawnFrom.y;
  } else {
    hero = generateHero(nextId, spawnFrom, turnsSurvived, raidType, day, { escalationLevel });
  }
  if (grid && hasUtilityAura(grid, hero.x, hero.y, "fear-idol")) {
    hero.statuses = hero.statuses || {};
    hero.statuses.fear = { turns: 2, value: 1 };
  }
  heroes.push(hero);
  const nextHeroId = Math.max(nextId, hero.id + 1);
  return { nextHeroId, scoutQueue: queue, spawned: hero, entrance: spawnFrom };
}

export function resolveCombatTurn(s) {
  if (s.coreHp <= 0) return s;
  if (!s.raidActive) return addLog(s, "No active raid. Press Start Raid to begin.");
  const validation = validateDungeon(s.grid, s.ashTrial);
  if (!validation.ok) return addLog(s, `Dungeon not valid: ${validation.reason}`);

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
const raidMult = raidRewardMultiplier(s.raidType, s.currentRaidEscalationLevel || 0);

let turnsSurvived = s.turnsSurvived;
let heroesIn = s.heroes;

const { core: corePos } = findEntranceAndCore(grid);
const activeEntrancesLocal = getActiveEntrances(grid, s.ashTrial);

const logLines = [];
const push = (msg) => logLines.push(msg);

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
const leaderTraitAuraKey = partyLeaderTraitKey(s.currentParty || []);
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
  if (heroHasPassive(h, "Focused") && randomFloat() < 0.5) return false;
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
  spd += artifactMods.monsterSpd || 0;
  spd += huntMonsterSpdBonus(grid, x, y, artifactMods);
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
    purgerBonusAt(grid, h.x, h.y, leaderTraitAuraKey) +
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
  bonus += bloodMonsterAtkBonus(grid, x, y, artifactMods);
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
  if (isAshTrialActive(s.ashTrial)) {
    bonus += artifactMods.ashTrialMonsterDef || 0;
  }
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
      if ((getStatus(h, "marked").turns > 0 ? getStatus(h, "marked").value || 0 : h.counters?.cursedMark || 0) > 0) {
        bonus += artifactMods.monsterBonusVsMarked || 0;
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
          const weakenTurns = 2 + (isLinkedRoom(grid, h.x, h.y) ? artifactMods.wardLinkedWeakenDuration || 0 : 0);
          if (tryApplyDebuff(h, "weaken", weakenTurns, 1)) {
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
  const spawnResult = spawnOneHero(
    heroesOut,
    nextHeroId,
    activeEntrancesLocal,
    turnsSurvived,
    partyQueue,
    grid,
    s.raidType,
    s.day,
    s.currentRaidEscalationLevel || 0
  );
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
  const clearEvolutionBonus = raidClearEvolutionBonus(s.raidType, s.currentRaidEscalationLevel || 0);
  if (clearEvolutionBonus > 0) {
    nextState.currency = {
      ...nextState.currency,
      evolution: nextState.currency.evolution + clearEvolutionBonus,
    };
    nextState = addLog(
      nextState,
      `${raidTypeMeta(s.raidType, s.pendingCouncilRaid).label} clear bonus: +${clearEvolutionBonus} Evolution.`
    );
  }
  if (s.raidType === "escalation") {
    nextState.escalationsCleared = Math.max(normalizeEscalationLevel(nextState.escalationsCleared), s.currentRaidEscalationLevel || 1);
    nextState = addLog(nextState, `Escalation Level ${s.currentRaidEscalationLevel || 1} cleared.`);
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
  const councilDue = isCouncilDay(nextState.day);
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
    nextState.nextRaidType = null;
    Object.assign(nextState, raidPlanningState(null));
    nextState.pendingPunitiveRaid = false;
    nextState.pendingCouncilRaid = null;
    nextState.invasionChoices = [];
    nextState.selectedInvasionKey = null;
    nextState.pendingEscalationLevel = 0;
    nextState.councilSession = buildCouncilSession(roster, nextState.day, councilFavor);
    nextState = addLog(nextState, "Council of the Dungeonlords convenes. Attend or decline.");
  }
  if (nextState.councilSession && nextState.councilSession.day !== nextState.day) {
    nextState.councilSession = null;
  }
  if (!councilDue) {
    nextState = prepareRaidPlanForDay(
      {
        ...nextState,
        invasionChoices: [],
        selectedInvasionKey: null,
      },
      { rerollChoices: true }
    );
  }
  resetArmedTrapsForRaid(nextState.grid, nextState);
  nextState.raidType = null;
  nextState.currentRaidEscalationLevel = 0;
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
    raidType: s.raidType || null,
    escalationLevel: s.currentRaidEscalationLevel || 0,
    rewardMultiplier: raidRewardMultiplier(s.raidType, s.currentRaidEscalationLevel || 0),
    clearEvolutionBonus: raidClearEvolutionBonus(s.raidType, s.currentRaidEscalationLevel || 0),
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

}
