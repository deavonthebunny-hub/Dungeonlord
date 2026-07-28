import { addCouncilQuestCounter } from "./council";
import { artifactCopyCap, calcArtifactMods, countOwnedArtifacts, hydrateArtifactDefinition } from "./economy";
import { buildFusedMonsterEntity, buildUniqueMonsterEntity, fleshMarketEraIndex } from "./markets";
import { discountedFusionCost, monsterEvolutionStageValue } from "./monsters";
import { MONSTERS, UNIQUE_ARTIFACT_MAP, UNIQUE_MONSTER_MAP, addLog, formatStars, monsterStarMultiplier, safeEntityStars, scaleByDay } from "./shared";

function traderPrice(monster, dayOverride = 1) {
  const stars = safeEntityStars(monster);
  const uniqueCost = UNIQUE_MONSTER_MAP[monster.key]?.costByEra?.[Math.max(0, Math.min(fleshMarketEraIndex(dayOverride), 2))];
  const baseCost = UNIQUE_MONSTER_MAP[monster.key] ? uniqueCost || 20 : MONSTERS[monster.key]?.cost || 20;
  const dayCost = scaleByDay(baseCost, dayOverride, 0.05, 3.0);
  return Math.round(dayCost * monsterStarMultiplier(stars));
}
function buyArtifactTransition(state, idx) {
  let nextState = state;
  const setState = updater => {
    nextState = typeof updater === "function" ? updater(nextState) : updater;
  };
  const locked = state.coreHp <= 0;
  const isBuildPhase = state.phase === "build";
  if (locked) return nextState;
  if (!isBuildPhase) {
    setState(s => addLog(s, "You can only trade during the build phase."));
    return nextState;
  }
  setState(s => {
    const stock = s.shadyStock ? [...s.shadyStock] : [];
    const target = hydrateArtifactDefinition(stock[idx]);
    if (!target) return s;
    const rawCost = target.cost || {
      currency: "soulshards",
      amount: 0
    };
    const cost = {
      ...rawCost
    };
    const currency = {
      ...s.currency
    };
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
    const shadyStock = stock.filter(offer => offer?.key !== target.key || nextOwnedCount < artifactCopyCap(offer));
    return addLog({
      ...s,
      currency,
      shadyStock,
      artifacts
    }, `Bought ${target.name} for ${cost.amount} ${cost.currency}.`);
  });
  return nextState;
}
function buyFromFleshMarketTransition(state, index) {
  let nextState = state;
  const setState = updater => {
    nextState = typeof updater === "function" ? updater(nextState) : updater;
  };
  setState(s => {
    if (!(s.fleshMarketUntilDay >= s.day && s.fleshMarketUntilDay > 0)) {
      return addLog(s, "The Flesh Market is closed.");
    }
    const stock = Array.isArray(s.fleshMarketStock) ? [...s.fleshMarketStock] : [];
    const offer = stock[index];
    if (!offer || offer.soldOut) return addLog(s, "That Flesh Market offer is no longer available.");
    if (s.currency.darkcrystals < offer.cost) return addLog(s, "Not enough Darkcrystals.");
    const boughtUniqueKeys = Array.from(new Set([...(s.boughtUniqueKeys || []), offer.key]));
    const currency = {
      ...s.currency,
      darkcrystals: s.currency.darkcrystals - offer.cost
    };
    let ns = {
      ...s,
      currency,
      boughtUniqueKeys
    };
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
      ns.artifacts = [...s.artifacts, hydrateArtifactDefinition({
        ...artifactDef,
        isUnique: true,
        cost: {
          currency: "darkcrystals",
          amount: offer.cost
        },
        tags: ["unique", "flesh-market"],
        maxCopies: 1,
        unlockDay: 0
      })];
      ns = addLog(ns, `Bought ${artifactDef.name} for ${offer.cost} Darkcrystals.`);
    }
    stock[index] = {
      ...offer,
      soldOut: true
    };
    ns.fleshMarketStock = stock;
    return ns;
  });
  return nextState;
}
function fuseMonstersTransition(state, aIdx, bIdx) {
  let nextState = state;
  const setState = updater => {
    nextState = typeof updater === "function" ? updater(nextState) : updater;
  };
  setState(s => {
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
    const cost = discountedFusionCost(first, second, calcArtifactMods(s.artifacts, s.day));
    if ((s.currency.darkcrystals || 0) < cost) return addLog(s, `Not enough Darkcrystals for fusion (${cost}).`);
    const hybrid = buildFusedMonsterEntity(first, second, s.day);
    const a = Math.max(aIdx, bIdx);
    const b = Math.min(aIdx, bIdx);
    inv.splice(a, 1);
    inv.splice(b, 1);
    inv.push(hybrid);
    const currency = {
      ...s.currency,
      darkcrystals: (s.currency.darkcrystals || 0) - cost
    };
    return addLog({
      ...s,
      invMonsters: inv,
      currency
    }, `Flesh Market fuses ${first.name} and ${second.name} into ${hybrid.name} (${formatStars(hybrid.stars)}, ${hybrid.class}) for ${cost} Darkcrystals.`);
  });
  return nextState;
}
function sacrificeMonsterTransition(state, idx) {
  let nextState = state;
  const setState = updater => {
    nextState = typeof updater === "function" ? updater(nextState) : updater;
  };
  setState(s => {
    const inv = [...s.invMonsters];
    const target = inv[idx];
    if (!target) return s;
    if (target.isUnique) return addLog(s, `${target.name} is too valuable to sacrifice in the Flesh Market.`);
    if (target.isFused) return addLog(s, `${target.name} is too unstable to sacrifice safely.`);
    inv.splice(idx, 1);
    const artifactMods = calcArtifactMods(s.artifacts, s.day);
    const gain = 4 + safeEntityStars(target) * 3 + monsterEvolutionStageValue(target) * 4 + (artifactMods.sacrificeBonusDarkcrystals || 0);
    const currency = {
      ...s.currency,
      darkcrystals: (s.currency.darkcrystals || 0) + gain
    };
    let ns = {
      ...s,
      invMonsters: inv,
      currency
    };
    ns = addCouncilQuestCounter(ns, "monsterSacrificeCount", 1);
    ns = addCouncilQuestCounter(ns, "darkcrystalsEarnedSinceCouncil", gain);
    return addLog(ns, `Sacrificed ${target.name}. +${gain} Darkcrystals.`);
  });
  return nextState;
}
function buyFromTraderTransition(state, index) {
  let nextState = state;
  const setState = updater => {
    nextState = typeof updater === "function" ? updater(nextState) : updater;
  };
  const locked = state.coreHp <= 0;
  const isBuildPhase = state.phase === "build";
  if (locked) return nextState;
  if (!isBuildPhase) {
    setState(s => addLog(s, "You can only trade during the build phase."));
    return nextState;
  }
  setState(s => {
    const stock = s.traderStock ? [...s.traderStock] : [];
    const target = stock[index];
    if (!target) return addLog(s, "That stock item is no longer available.");
    const price = traderPrice(target, s.day);
    if (s.currency.soulshards < price) return addLog(s, "Not enough Soulshards.");
    stock.splice(index, 1);
    const invMonsters = [...s.invMonsters, target];
    const currency = {
      ...s.currency,
      soulshards: s.currency.soulshards - price
    };
    return addLog({
      ...s,
      traderStock: stock,
      invMonsters,
      currency
    }, `Bought ${target.name} for ${price} Soulshards.`);
  });
  return nextState;
}

export { traderPrice, buyArtifactTransition, buyFromFleshMarketTransition, fuseMonstersTransition, sacrificeMonsterTransition, buyFromTraderTransition };
