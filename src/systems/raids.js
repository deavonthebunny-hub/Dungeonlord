import { COUNCIL_RAID_FACTIONS, HERO_ARCHETYPE_RULES, HERO_LEADER_TRAITS, HERO_ORDERS, RAID_DIRECTIVES, RAID_TYPE_META, STANDARD_HERO_PROFILES } from "../gameContent";
import { isCouncilDay, isEscalationDay } from "../gameRules";
import { randomFloat } from "../random";
import { huntScoutRevealBonus, keyOf, maxUtilityTier, neighbors } from "./dungeon";
import { calcArtifactMods, getDoctrineEffects } from "./economy";
import { MONSTER_ARCHETYPES, MONSTER_PASSIVES, MONSTER_PASSIVE_MAP, buildMonsterStats, getMonsterBaseData } from "./monsters";
import { DAY_START_PARTY_MAX, DAY_START_PARTY_MIN, H, HERO_BASE, MONSTERS, W, clamp, clampMonsterStar, monsterStarCapForDay, monsterStarMultiplier, pick, rollAuthoritativeStar } from "./shared";

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
const HERO_ORDER_MAP = HERO_ORDERS;
const HERO_ORDER_LIST = Object.values(HERO_ORDERS);
const HERO_PROFILE_MAP = Object.fromEntries(STANDARD_HERO_PROFILES.map((profile) => [profile.key, profile]));
const HERO_LEADER_TRAIT_MAP = HERO_LEADER_TRAITS;
const EXPEDITION_ART_BASE = `${import.meta.env.BASE_URL}assets/expeditions/`;
const EXPEDITION_ORDER_CRESTS = {
  "iron-crusade": `${EXPEDITION_ART_BASE}iron-crusade-crest.png`,
  "veiled-rangers": `${EXPEDITION_ART_BASE}veiled-rangers-crest.png`,
  "rift-collegium": `${EXPEDITION_ART_BASE}rift-collegium-crest.png`,
  "grave-wardens": `${EXPEDITION_ART_BASE}grave-wardens-crest.png`,
};
const MARKET_ART_BASE = `${import.meta.env.BASE_URL}assets/markets/`;
const MARKET_ART = {
  trader: `${MARKET_ART_BASE}monster-trader.png`,
  dealer: `${MARKET_ART_BASE}shady-dealer.png`,
  flesh: `${MARKET_ART_BASE}flesh-market.png`,
  crucible: `${MARKET_ART_BASE}fusion-crucible.png`,
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
function availableHeroProfiles(day = 1, orderKey = null) {
  const unlocked = STANDARD_HERO_PROFILES.filter((profile) => (profile.unlockDay || 1) <= day);
  const pool = unlocked.length ? unlocked : STANDARD_HERO_PROFILES;
  const filtered = orderKey ? pool.filter((profile) => profile.orderKey === orderKey) : pool;
  return filtered.length ? filtered : pool;
}
function weightedPickHeroProfile(day = 1, orderKey = null) {
  const profiles = availableHeroProfiles(day, orderKey);
  if (!profiles.length) return STANDARD_HERO_PROFILES[0] || null;
  const totalWeight = profiles.reduce((sum, profile) => sum + Math.max(1, profile.weight || 1), 0);
  let roll = randomFloat() * totalWeight;
  for (const profile of profiles) {
    roll -= Math.max(1, profile.weight || 1);
    if (roll <= 0) return profile;
  }
  return profiles[profiles.length - 1];
}
function availableHeroOrders(day = 1) {
  const unlockedProfiles = availableHeroProfiles(day);
  const orderKeys = [...new Set(unlockedProfiles.map((profile) => profile.orderKey).filter(Boolean))];
  const orders = orderKeys.map((key) => HERO_ORDER_MAP[key]).filter(Boolean);
  return orders.length ? orders : HERO_ORDER_LIST;
}
function pickHeroOrder(day = 1, preferredKey = null) {
  if (preferredKey && HERO_ORDER_MAP[preferredKey]) return HERO_ORDER_MAP[preferredKey];
  const orders = availableHeroOrders(day);
  return pick(orders);
}
function pickLeaderTraitKey(orderKey = null) {
  const all = Object.keys(HERO_LEADER_TRAIT_MAP);
  if (!all.length) return null;
  if (orderKey === "iron-crusade") return pick(["bulwark", "fanatic", "trailmaster"]);
  if (orderKey === "veiled-rangers") return pick(["trailmaster", "purger", "bulwark"]);
  if (orderKey === "rift-collegium") return pick(["scryer", "purger", "fanatic"]);
  if (orderKey === "grave-wardens") return pick(["bulwark", "scryer", "purger"]);
  return pick(all);
}
function normalizeEscalationLevel(level = 0) {
  return Math.max(0, Math.round(Number.isFinite(level) ? level : 0));
}
function raidDifficultyConfig(raidType = null, escalationLevel = 0) {
  const level = normalizeEscalationLevel(escalationLevel);
  if (raidType === "council") {
    return {
      statMult: 1.35,
      partySizeDelta: 1,
      starBias: 0.6,
      rewardMult: 1.6,
      clearEvolutionBonus: 0,
      guaranteedLeader: false,
    };
  }
  if (raidType === "escalation") {
    const safeLevel = Math.max(1, level || 1);
    return {
      statMult: Math.min(1.55, 1.18 + 0.04 * (safeLevel - 1)),
      partySizeDelta: Math.min(4, safeLevel),
      starBias: 0.45,
      rewardMult: Math.min(2.0, 1.45 + 0.1 * (safeLevel - 1)),
      clearEvolutionBonus: Math.ceil(safeLevel / 2),
      guaranteedLeader: true,
    };
  }
  if (raidType === "elite") {
    return {
      statMult: 1.2,
      partySizeDelta: -1,
      starBias: 0.9,
      rewardMult: 1.3,
      clearEvolutionBonus: 1,
      guaranteedLeader: true,
    };
  }
  return {
    statMult: 1,
    partySizeDelta: 0,
    starBias: 0,
    rewardMult: 1,
    clearEvolutionBonus: 0,
    guaranteedLeader: false,
  };
}
function raidRewardMultiplier(raidType = null, escalationLevel = 0) {
  return raidDifficultyConfig(raidType, escalationLevel).rewardMult || 1;
}
function raidClearEvolutionBonus(raidType = null, escalationLevel = 0) {
  return raidDifficultyConfig(raidType, escalationLevel).clearEvolutionBonus || 0;
}
function planRaidEncounter(raidType = null, day = 1, options = {}) {
  if (raidType === "council") {
    return {
      orderKey: null,
      orderName: null,
      leaderTraitKey: null,
      leaderTraitName: null,
      directiveKey: resolveRaidDirectiveKey(raidType, options.councilRaid, day),
    };
  }
  const order = pickHeroOrder(day, options.orderKey);
  const difficulty = raidDifficultyConfig(raidType, options.escalationLevel || 0);
  const leaderTraitKey = difficulty.guaranteedLeader ? options.leaderTraitKey || pickLeaderTraitKey(order?.key) : null;
  return {
    orderKey: order?.key || null,
    orderName: order?.name || null,
    leaderTraitKey,
    leaderTraitName: leaderTraitKey ? HERO_LEADER_TRAIT_MAP[leaderTraitKey]?.name || null : null,
    directiveKey: options.directiveKey || order?.directiveKey || resolveRaidDirectiveKey(raidType, options.councilRaid, day),
  };
}
function raidPlanningState(plannedRaid = null) {
  return {
    pendingRaidOrderKey: plannedRaid?.orderKey || null,
    pendingRaidOrderName: plannedRaid?.orderName || null,
    pendingRaidLeaderTraitKey: plannedRaid?.leaderTraitKey || null,
  };
}
function buildInvasionChoice(raidType, day = 1, options = {}) {
  const escalationLevel = raidType === "escalation" ? Math.max(1, normalizeEscalationLevel(options.escalationLevel) || 1) : 0;
  const plannedRaid = planRaidEncounter(raidType, day, { ...options, escalationLevel });
  const difficulty = raidDifficultyConfig(raidType, escalationLevel);
  return {
    key: options.key || raidType,
    raidType,
    label: raidTypeMeta(raidType).label,
    day,
    escalationLevel,
    orderKey: plannedRaid.orderKey,
    orderName: plannedRaid.orderName,
    leaderTraitKey: plannedRaid.leaderTraitKey,
    leaderTraitName: plannedRaid.leaderTraitName,
    directiveKey: plannedRaid.directiveKey,
    rewardMult: difficulty.rewardMult,
    clearEvolutionBonus: difficulty.clearEvolutionBonus,
    partySizeDelta: difficulty.partySizeDelta,
    statMult: difficulty.statMult,
  };
}
function buildDailyInvasionChoices(day = 1) {
  return [buildInvasionChoice("normal", day), buildInvasionChoice("elite", day)];
}
function normalizeInvasionChoice(raw, day = 1) {
  if (!raw || !["normal", "elite", "escalation"].includes(raw.raidType)) return null;
  const fallback = buildInvasionChoice(raw.raidType, raw.day || day, {
    key: raw.key || raw.raidType,
    orderKey: raw.orderKey || undefined,
    leaderTraitKey: raw.leaderTraitKey || undefined,
    escalationLevel: raw.escalationLevel || 0,
  });
  return {
    ...fallback,
    ...raw,
    key: raw.key || fallback.key,
    day: raw.day || day,
    escalationLevel: raw.raidType === "escalation" ? Math.max(1, normalizeEscalationLevel(raw.escalationLevel || fallback.escalationLevel) || 1) : 0,
  };
}
function applyInvasionChoiceToState(stateLike, choice) {
  if (!choice) return stateLike;
  const escalationLevel = choice.raidType === "escalation" ? Math.max(1, normalizeEscalationLevel(choice.escalationLevel) || 1) : 0;
  const plannedRaid = planRaidEncounter(choice.raidType, stateLike.day || choice.day || 1, {
    orderKey: choice.orderKey || undefined,
    leaderTraitKey: choice.leaderTraitKey || undefined,
    directiveKey: choice.directiveKey || undefined,
    escalationLevel,
  });
  return {
    ...stateLike,
    selectedInvasionKey: choice.key,
    nextRaidType: choice.raidType,
    ...raidPlanningState(plannedRaid),
    pendingPunitiveRaid: false,
    pendingCouncilRaid: null,
    pendingEscalationLevel: escalationLevel,
  };
}
function prepareRaidPlanForDay(stateLike, options = {}) {
  const day = Math.max(1, stateLike?.day || 1);
  const rerollChoices = !!options.rerollChoices;
  const base = {
    ...stateLike,
    pendingCouncilRaid: stateLike?.pendingPunitiveRaid ? stateLike.pendingCouncilRaid : null,
  };
  if (isCouncilDay(day)) {
    return {
      ...base,
      invasionChoices: [],
      selectedInvasionKey: null,
      nextRaidType: null,
      ...raidPlanningState(null),
      pendingPunitiveRaid: false,
      pendingCouncilRaid: null,
      pendingEscalationLevel: 0,
    };
  }
  if (base.pendingPunitiveRaid) {
    const plannedRaid = planRaidEncounter("council", day, { councilRaid: base.pendingCouncilRaid });
    return {
      ...base,
      invasionChoices: [],
      selectedInvasionKey: "council",
      nextRaidType: "council",
      ...raidPlanningState(plannedRaid),
      pendingEscalationLevel: 0,
    };
  }
  if (isEscalationDay(day)) {
    const escalationLevel = Math.max(1, normalizeEscalationLevel(base.escalationsCleared) + 1);
    const choice = buildInvasionChoice("escalation", day, { escalationLevel });
    return applyInvasionChoiceToState(
      {
        ...base,
        invasionChoices: [],
      },
      choice
    );
  }
  const choices = rerollChoices || !Array.isArray(base.invasionChoices) || base.invasionChoices.length === 0
    ? buildDailyInvasionChoices(day)
    : base.invasionChoices.map((choice) => normalizeInvasionChoice(choice, day)).filter(Boolean);
  const selectedChoice = choices.find((choice) => choice.key === base.selectedInvasionKey) || null;
  const next = {
    ...base,
    invasionChoices: choices,
    pendingPunitiveRaid: false,
    pendingCouncilRaid: null,
    pendingEscalationLevel: 0,
  };
  if (selectedChoice) return applyInvasionChoiceToState(next, selectedChoice);
  return {
    ...next,
    selectedInvasionKey: null,
    nextRaidType: null,
    ...raidPlanningState(null),
  };
}
function plannedRaidFromState(stateLike, raidType = null, councilRaid = null, day = null) {
  const safeDay = Math.max(1, day || stateLike?.day || 1);
  if (raidType === "council") {
    return planRaidEncounter(raidType, safeDay, { councilRaid });
  }
  const pendingOrderKey = stateLike?.pendingRaidOrderKey || null;
  const pendingLeaderTraitKey = stateLike?.pendingRaidLeaderTraitKey || null;
  return planRaidEncounter(raidType, safeDay, {
    councilRaid,
    orderKey: pendingOrderKey || undefined,
    leaderTraitKey: pendingLeaderTraitKey || undefined,
    directiveKey: pendingOrderKey ? HERO_ORDER_MAP[pendingOrderKey]?.directiveKey : undefined,
    escalationLevel: raidType === "escalation" ? stateLike?.pendingEscalationLevel || stateLike?.currentRaidEscalationLevel || 1 : 0,
  });
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
function getLeaderTraitRule(key) {
  return (key && HERO_LEADER_TRAIT_MAP[key]) || null;
}
function partyLeaderTraitKey(party = []) {
  return party.find((member) => member?.isRaidLeader && member?.leaderTraitKey)?.leaderTraitKey || null;
}
function isSupportInfluencedTile(grid, x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  const tile = grid?.[y]?.[x];
  if (tile?.room === "utility") return true;
  return neighbors(x, y).some((pos) => grid?.[pos.y]?.[pos.x]?.room === "utility");
}
function purgerBonusAt(grid, x, y, leaderTraitKey = null) {
  if (leaderTraitKey !== "purger") return 0;
  const tile = grid?.[y]?.[x];
  return tile?.room === "trap" || isSupportInfluencedTile(grid, x, y) ? 1 : 0;
}
function seedRaidIntelFromGrid(grid, directiveKey = "rush-core", leaderId = null, leaderTraitKey = null) {
  const raidIntel = createEmptyRaidIntel(directiveKey, leaderId);
  if (leaderTraitKey !== "scryer" || !Array.isArray(grid)) return raidIntel;
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const tile = grid?.[y]?.[x];
      if (!tile?.room) continue;
      const tileKey = keyOf(x, y);
      if (tile.room === "trap") {
        raidIntel.trapHubs.push(tileKey);
      } else if (tile.room === "utility") {
        raidIntel.utilityHubs.push(tileKey);
      }
    }
  }
  return raidIntel;
}
function buildScoutRevealQueue(party = [], grid, doctrines = {}, raidBoons = [], artifacts = [], day = 1) {
  if (!Array.isArray(party) || !party.length) return [];
  const doctrineEffects = getDoctrineEffects(doctrines);
  const raidMods = buildRaidModifiers(raidBoons);
  const artifactMods = calcArtifactMods(artifacts, day);
  const baseMirrorTier = maxUtilityTier(grid, "scout-mirror");
  const mirrorTier =
    baseMirrorTier > 0
      ? baseMirrorTier +
        doctrineEffects.utilityPotencyBonus +
        doctrineEffects.utilityPotencyBonusExtra +
        doctrineEffects.utilityScoutBonus +
        (artifactMods.utilityPotencyBonus || 0)
      : 0;
  const leaderRevealBonus = partyLeaderTraitKey(party) === "trailmaster" ? 1 : 0;
  const revealBase =
    (artifactMods.scoutRevealBonus || 0) +
    huntScoutRevealBonus(grid, artifactMods) +
    leaderRevealBonus -
    (artifactMods.scoutRevealPenalty || 0);
  if (mirrorTier <= 0 && revealBase <= 0) return [];
  const revealCount = Math.max(
    0,
    Math.min(party.length, revealBase + (mirrorTier > 0 ? 2 + (mirrorTier - 1) + raidMods.scoutRevealBonus : 0))
  );
  if (revealCount <= 0) return [];
  return party.slice(0, revealCount).map((hero) => ({ ...hero }));
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
  if (raidType === "escalation") {
    return day % 2 === 0 ? "break-frontline" : "purge-support";
  }
  return day % 2 === 0 ? "probe-flanks" : "rush-core";
}
function weightedPick(weightMap = {}, fallbackKey = "zealot") {
  const entries = Object.entries(weightMap).filter(([, weight]) => Number.isFinite(weight) && weight > 0);
  if (!entries.length) return fallbackKey;
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = randomFloat() * total;
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
function pickHeroArchetypeFromWeights(weightMap = {}, fallbackKey = "zealot") {
  const choice = weightedPick(weightMap, fallbackKey);
  return HERO_ARCHETYPE_RULES[choice] ? choice : fallbackKey;
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
function applyRaidStarBias(stars, day = 1, raidType = null, bias = 0, escalationLevel = 0) {
  const cap = monsterStarCapForDay(day);
  let next = clampMonsterStar(stars);
  const totalBias = bias + (raidDifficultyConfig(raidType, escalationLevel).starBias || 0);
  if (totalBias > 0 && randomFloat() < totalBias) {
    next = Math.min(cap, next + 1);
  }
  if (totalBias < 0 && randomFloat() < Math.abs(totalBias)) {
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
function raidTypeMeta(raidType, councilRaid = null) {
  if (raidType === "council" && councilRaid) {
    return {
      label: councilRaid.label,
      desc: `${RAID_TYPE_META.council.desc} ${councilRaid.desc}. ${councilRaid.modifierText}`,
    };
  }
  return RAID_TYPE_META[raidType || "normal"] || RAID_TYPE_META.normal;
}
function scaleStat(base, stars) {
  return Math.max(1, Math.round(base * monsterStarMultiplier(stars)));
}
function heroRaidStatMultiplier(raidType, escalationLevel = 0) {
  return raidDifficultyConfig(raidType, escalationLevel).statMult || 1;
}
function buildHeroStats(stars, raidType, heroClass = null, escalationLevel = 0) {
  const safeStars = clampMonsterStar(stars);
  const raidMult = heroRaidStatMultiplier(raidType, escalationLevel);
  const classMods = CLASS_STAT_MODS[heroClass] || {};
  return {
    maxHp: Math.max(1, Math.round(scaleStat(HERO_BASE.hp, safeStars) * raidMult) + (classMods.hp || 0)),
    atk: Math.max(1, Math.round(scaleStat(HERO_BASE.atk, safeStars) * raidMult) + (classMods.atk || 0)),
    def: Math.max(0, Math.floor(safeStars / 2) + (classMods.def || 0)),
    shd: Math.max(0, safeStars - 2),
    spd: Math.max(1, 2 + safeStars + (heroClass === "Rogue" || heroClass === "Ranger" || heroClass === "Monk" ? 1 : 0)),
  };
}
function normalizeHeroEntity(hero, day = 1, raidType = null, fallbackEscalationLevel = 0) {
  const safeDay = Math.max(1, day || 1);
  const stars = Math.min(clampMonsterStar(hero?.stars || 1), monsterStarCapForDay(safeDay));
  const profile = hero?.profileKey ? HERO_PROFILE_MAP[hero.profileKey] : null;
  const heroClass = hero?.class || profile?.className || "Warrior";
  const raidEscalationLevel = normalizeEscalationLevel(hero?.raidEscalationLevel || fallbackEscalationLevel);
  const stats = buildHeroStats(stars, raidType, heroClass, raidEscalationLevel);
  const previousMaxHp = Math.max(1, hero?.stats?.maxHp ?? hero?.hp ?? stats.maxHp);
  const hpRatio = clamp((hero?.hp ?? previousMaxHp) / previousMaxHp, 0, 1);
  const heroPassiveKey = normalizeHeroPassiveKey(hero?.heroPassiveKey || hero?.passive);
  const archetypeKey = HERO_ARCHETYPE_RULES[hero?.archetypeKey]
    ? hero.archetypeKey
    : pickHeroArchetypeKey(heroClass, heroPassiveKey, raidType);
  const order = hero?.orderKey ? HERO_ORDER_MAP[hero.orderKey] : profile?.orderKey ? HERO_ORDER_MAP[profile.orderKey] : null;
  const leaderTraitKey = hero?.leaderTraitKey && HERO_LEADER_TRAIT_MAP[hero.leaderTraitKey] ? hero.leaderTraitKey : null;
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
    race: hero?.race || profile?.racePool?.[0] || "Human",
    class: heroClass,
    stars,
    passive: hero?.passive || HERO_PASSIVE_MAP[heroPassiveKey]?.name || HERO_PASSIVES[0],
    heroPassiveKey,
    archetypeKey,
    archetypeLabel: getHeroArchetypeRule(archetypeKey).name,
    unitKind: hero?.unitKind || "hero",
    factionKey: hero?.factionKey || null,
    factionName: hero?.factionName || null,
    raidOriginLabel: hero?.raidOriginLabel || (raidType ? raidTypeMeta(raidType).label : null),
    raidEscalationLevel,
    raidDirectiveKey:
      hero?.raidDirectiveKey ||
      (hero?.factionKey ? COUNCIL_RAID_FACTIONS[hero.factionKey]?.defaultDirective : null) ||
      order?.directiveKey ||
      resolveRaidDirectiveKey(raidType, null, safeDay),
    traitPassiveKey: hero?.traitPassiveKey || null,
    traitPassiveName: hero?.traitPassiveName || null,
    isRaidLeader: !!hero?.isRaidLeader,
    stats,
    profileKey: hero?.profileKey || profile?.key || null,
    profileName: hero?.profileName || profile?.name || heroClass,
    orderKey: hero?.orderKey || order?.key || null,
    orderName: hero?.orderName || order?.name || null,
    leaderTraitKey,
    leaderTraitName: leaderTraitKey ? HERO_LEADER_TRAIT_MAP[leaderTraitKey]?.name || null : null,
    name: hero?.name || `${HERO_NAMES[0]} the ${hero?.profileName || profile?.name || heroClass}`,
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
  const order = HERO_ORDER_MAP[options.orderKey] || null;
  const profile =
    HERO_PROFILE_MAP[options.profileKey] ||
    options.profile ||
    weightedPickHeroProfile(day, order?.key || options.orderKey || null);
  const passivePool = profile?.passivePool || options.passivePool || HERO_PASSIVE_RULES;
  const racePool = profile?.racePool || options.racePool || ["Human", "Elf", "Dwarf", "Orc", "Tiefling", "Halfling"];
  const passiveRule = pickHeroPassiveRule(passivePool);
  const heroClass = profile?.className || options.className || "Warrior";
  const directiveKey = options.directiveKey || order?.directiveKey || resolveRaidDirectiveKey(raidType, options.councilRaid, day);
  const escalationLevel = raidType === "escalation" ? Math.max(1, normalizeEscalationLevel(options.escalationLevel) || 1) : 0;
  const archetypeKey =
    options.archetypeKey ||
    pickHeroArchetypeFromWeights(
      profile?.archetypeWeights || order?.archetypeWeights || getRaidDirectiveRule(directiveKey).archetypeWeights || {},
      pickRaidArchetypeKey(heroClass, passiveRule.key, raidType, directiveKey)
    );
  const stars = applyRaidStarBias(rollAuthoritativeStar(day), day, raidType, options.starBias || 0, escalationLevel);
  const race = pick(racePool);
  const profileName = profile?.name || heroClass;
  const name = `${pick(HERO_NAMES)} the ${profileName}`;
  const stats = buildHeroStats(stars, raidType, heroClass, escalationLevel);

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
    raidEscalationLevel: escalationLevel,
    profileKey: profile?.key || null,
    profileName,
    orderKey: order?.key || profile?.orderKey || null,
    orderName: order?.name || (profile?.orderKey ? HERO_ORDER_MAP[profile.orderKey]?.name || null : null),
    leaderTraitKey: null,
    leaderTraitName: null,
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
function generateHeroParty(turnsSurvived, raidType, day = 1, options = {}) {
  const raidMods = buildRaidModifiers(options.raidBoons || []);
  const escalationLevel = raidType === "escalation" ? Math.max(1, normalizeEscalationLevel(options.escalationLevel) || 1) : 0;
  const difficulty = raidDifficultyConfig(raidType, escalationLevel);
  const baseSize = DAY_START_PARTY_MIN + Math.floor(randomFloat() * (DAY_START_PARTY_MAX - DAY_START_PARTY_MIN + 1));
  const size = Math.max(1, baseSize + (difficulty.partySizeDelta || 0) + (raidMods.partySizeDelta || 0));
  const basePos = { x: 0, y: 0 };
  const party = [];
  let nextId = 1;
  const plannedRaid = options.plannedRaid || planRaidEncounter(raidType, day, options);
  const directiveKey = plannedRaid.directiveKey || options.directiveKey || resolveRaidDirectiveKey(raidType, options.councilRaid, day);
  const eliteOptions =
    difficulty.guaranteedLeader
      ? {
          starBias: raidMods.starBias || 0,
          directiveKey,
          orderKey: plannedRaid.orderKey,
          escalationLevel,
        }
      : {
          starBias: raidMods.starBias || 0,
          directiveKey,
          orderKey: plannedRaid.orderKey,
          escalationLevel,
        };
  for (let i = 0; i < size; i++) {
    const profile = weightedPickHeroProfile(day, plannedRaid.orderKey);
    const hero = generateHero(nextId, basePos, turnsSurvived, raidType, day, {
      ...eliteOptions,
      profile,
      profileKey: profile?.key,
      orderKey: plannedRaid.orderKey,
      directiveKey,
    });
    party.push(hero);
    nextId += 1;
  }
  return applyRaidPartyModifiers(party, options.raidBoons || [], plannedRaid);
}
function applyRaidPartyModifiers(party, raidBoons = [], plannedRaid = null) {
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
      orderKey: member.orderKey || plannedRaid?.orderKey || null,
      orderName: member.orderName || plannedRaid?.orderName || null,
    };
    if (idx === leaderIdx && raidMods.leaderHpMult !== 1) {
      const baseMaxHp = next.stats.maxHp || next.hp || 1;
      const hpRatio = Math.max(0, Math.min(1, (next.hp || baseMaxHp) / Math.max(1, baseMaxHp)));
      const scaledMaxHp = Math.max(1, Math.round(baseMaxHp * raidMods.leaderHpMult));
      next.stats.maxHp = scaledMaxHp;
      next.hp = Math.max(1, Math.round(scaledMaxHp * hpRatio));
    }
    if (idx === leaderIdx && plannedRaid?.leaderTraitKey) {
      const trait = getLeaderTraitRule(plannedRaid.leaderTraitKey);
      next.leaderTraitKey = plannedRaid.leaderTraitKey;
      next.leaderTraitName = trait?.name || plannedRaid.leaderTraitName || null;
      if (plannedRaid.leaderTraitKey === "bulwark") {
        next.def = (next.def || 0) + 2;
        next.stats.def = (next.stats.def || 0) + 2;
      } else if (plannedRaid.leaderTraitKey === "fanatic") {
        next.atk = (next.atk || 0) + 2;
        next.stats.atk = (next.stats.atk || 0) + 2;
      }
    }
    return next;
  });
}
function generateRaidParty(turnsSurvived, raidType, day = 1, options = {}) {
  if (raidType === "council") {
    const raidMods = buildRaidModifiers(options.raidBoons || []);
    const difficulty = raidDifficultyConfig("council");
    const baseSize = DAY_START_PARTY_MIN + Math.floor(randomFloat() * (DAY_START_PARTY_MAX - DAY_START_PARTY_MIN + 1));
    const size = Math.max(1, baseSize + (difficulty.partySizeDelta || 0) + (raidMods.partySizeDelta || 0));
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
  const plannedRaid = options.plannedRaid || planRaidEncounter(raidType, day, options);
  const directiveKey = plannedRaid.directiveKey || options.directiveKey || resolveRaidDirectiveKey(raidType, options.councilRaid, day);
  const party = generateRaidParty(turnsSurvived, raidType, day, {
    ...options,
    directiveKey,
    plannedRaid,
  });
  const leader = party.find((member) => member.isRaidLeader) || null;
  return {
    directiveKey,
    plannedRaid,
    party,
    raidIntel: seedRaidIntelFromGrid(options.grid, directiveKey, leader?.id || null, leader?.leaderTraitKey || plannedRaid?.leaderTraitKey || null),
  };
}

export { HERO_NAMES, HERO_PASSIVE_RULES, HERO_PASSIVES, HERO_PASSIVE_MAP, HERO_ORDER_MAP, HERO_ORDER_LIST, HERO_PROFILE_MAP, HERO_LEADER_TRAIT_MAP, EXPEDITION_ART_BASE, EXPEDITION_ORDER_CRESTS, MARKET_ART_BASE, MARKET_ART, CLASS_STAT_MODS, AFFINITY_STAT_MODS, availableHeroProfiles, weightedPickHeroProfile, availableHeroOrders, pickHeroOrder, pickLeaderTraitKey, normalizeEscalationLevel, raidDifficultyConfig, raidRewardMultiplier, raidClearEvolutionBonus, planRaidEncounter, raidPlanningState, buildInvasionChoice, buildDailyInvasionChoices, normalizeInvasionChoice, applyInvasionChoiceToState, prepareRaidPlanForDay, plannedRaidFromState, normalizeHeroPassiveKey, getHeroArchetypeRule, getRaidDirectiveRule, createHeroMemory, createEmptyRaidIntel, normalizeRaidIntel, getLeaderTraitRule, partyLeaderTraitKey, isSupportInfluencedTile, purgerBonusAt, seedRaidIntelFromGrid, buildScoutRevealQueue, mergeRaidIntelKey, resolveRaidDirectiveKey, weightedPick, topArchetypesFromWeights, raidDirectiveArchetypeSummary, partyArchetypeSummary, pickHeroPassiveRule, pickHeroArchetypeKey, pickHeroArchetypeFromWeights, pickRaidArchetypeKey, pickFactionArchetypeKey, applyRaidStarBias, buildRaidModifiers, raidTypeMeta, scaleStat, heroRaidStatMultiplier, buildHeroStats, normalizeHeroEntity, generateHero, generateCouncilRaider, generateHeroParty, applyRaidPartyModifiers, generateRaidParty, buildRaidPartyWithIntel };
