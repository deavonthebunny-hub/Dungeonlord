import { addCouncilQuestCounter } from "./council";
import { cloneGrid } from "./dungeon";
import { calcArtifactMods } from "./economy";
import { BRANCH_PASSIVE_BY_CLASS, MONSTER_EVOLUTION_BRANCHES, MONSTER_PASSIVE_MAP, applyMonsterRoomPlacementStatic, createPassiveRanks, defaultBranchClass, effectiveMonsterRoomCapValue, generateMonster, getMonsterBaseData, monsterCanEvolve, monsterEvolutionCost, monsterEvolutionStageValue, normalizePassiveKeysForMonster, pickWeightedMonsterDef, prepareMonsterForInventory, rebuildMonsterEntity, spendEvolutionPoints } from "./monsters";
import { MAX_EVOLUTION_STAGE, MONSTER_KEYS, addLog, pickUnique } from "./shared";
import { traderPrice } from "./marketActions";

function buildEvolutionOptions(monster) {
  const stage = monsterEvolutionStageValue(monster);
  const baseRace = monster.race || getMonsterBaseData(monster.key)?.name || "Monster";
  if (stage >= MAX_EVOLUTION_STAGE) return [];
  if (stage === 0) {
    return pickUnique(MONSTER_EVOLUTION_BRANCHES, 3).map(branch => {
      const passiveKey = BRANCH_PASSIVE_BY_CLASS[branch];
      return {
        name: `${baseRace} ${branch}`,
        class: branch,
        passive: MONSTER_PASSIVE_MAP[passiveKey]?.name || "None",
        passiveKey
      };
    });
  }
  const branchClass = defaultBranchClass(monster);
  const passiveKey = BRANCH_PASSIVE_BY_CLASS[branchClass];
  return [{
    name: `Ascended ${monster.name}`,
    class: branchClass,
    passive: MONSTER_PASSIVE_MAP[passiveKey]?.name || "None",
    passiveKey
  }];
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
function applyMonsterRoomPlacement(monster, roomType, roomTier = 1) {
  return applyMonsterRoomPlacementStatic(monster, roomType, roomTier);
}
function recruitMonsterTransition(state) {
  let nextState = state;
  const setState = updater => {
    nextState = typeof updater === "function" ? updater(nextState) : updater;
  };
  const locked = state.coreHp <= 0;
  const isBuildPhase = state.phase === "build";
  if (locked) return nextState;
  if (!isBuildPhase) {
    setState(s => addLog(s, "You can only recruit during the build phase."));
    return nextState;
  }
  if (state.movePayload) {
    setState(s => addLog(s, "Finish moving before recruiting."));
    return nextState;
  }
  setState(s => {
    const picked = pickWeightedMonsterDef(s.day);
    const previewMonster = generateMonster(picked?.key || MONSTER_KEYS[0], s.turnsSurvived, undefined, s.day);
    const scaledCost = traderPrice(previewMonster, s.day);
    if (s.currency.essence < scaledCost) return addLog(s, "Not enough Essence.");
    const invMonsters = [...s.invMonsters, previewMonster];
    return addLog({
      ...s,
      currency: {
        ...s.currency,
        essence: s.currency.essence - scaledCost
      },
      invMonsters
    }, `Recruited ${previewMonster.name} for ${scaledCost} Essence.`);
  });
  return nextState;
}
function startEvolutionTransition(state, source) {
  let nextState = state;
  const setState = updater => {
    nextState = typeof updater === "function" ? updater(nextState) : updater;
  };
  const locked = state.coreHp <= 0;
  const isBuildPhase = state.phase === "build";
  if (locked) return nextState;
  if (!isBuildPhase) {
    setState(s => addLog(s, "You can only evolve during the build phase."));
    return nextState;
  }
  setState(s => {
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
    return {
      ...s,
      evolutionOffer: {
        source,
        options,
        cost,
        stage: monsterEvolutionStageValue(target)
      }
    };
  });
  return nextState;
}
function chooseEvolutionTransition(state, source, option) {
  let nextState = state;
  const setState = updater => {
    nextState = typeof updater === "function" ? updater(nextState) : updater;
  };
  const locked = state.coreHp <= 0;
  if (locked) return nextState;
  setState(s => {
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
    const evolvedBase = rebuildMonsterEntity({
      ...target,
      name: currentStage === 0 ? option.name : `Ascended ${target.name.replace(/^Ascended\s+/, "")}`,
      class: branchClass,
      branchClass,
      passiveKeys,
      passiveRanks,
      evolutionStage: nextStage,
      evolution: nextStage,
      evoPoints: spend.personalLeft
    }, {}, {
      healToFull: true
    });
    const currency = {
      ...s.currency,
      evolution: spend.globalLeft
    };
    let invMonsters = s.invMonsters;
    let grid = s.grid;
    if (source.type === "inv") {
      invMonsters = s.invMonsters.map((m, i) => i === source.index ? evolvedBase : m);
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
        tile.monsters = tile.monsters.map((m, i) => i === source.index ? buffed : m);
      }
    }
    let ns = {
      ...s,
      grid,
      invMonsters,
      currency,
      evolutionOffer: null
    };
    ns = addCouncilQuestCounter(ns, "evolutionSpentSinceCouncil", cost);
    ns = addCouncilQuestCounter(ns, "monsterEvolutionCount", 1);
    return addLog(ns, `${target.name} reaches Stage ${nextStage}/${MAX_EVOLUTION_STAGE} as ${currentStage === 0 ? branchClass : evolvedBase.class}. ${passiveNote} (${cost} ${spend.source} EP).`);
  });
  return nextState;
}
function cancelEvolutionTransition(state) {
  let nextState = state;
  const setState = updater => {
    nextState = typeof updater === "function" ? updater(nextState) : updater;
  };
  setState(s => ({
    ...s,
    evolutionOffer: null
  }));
  return nextState;
}
function placeInventoryMonsterInSelectedRoomTransition(state, index) {
  let nextState = state;
  const setState = updater => {
    nextState = typeof updater === "function" ? updater(nextState) : updater;
  };
  const locked = state.coreHp <= 0;
  const isBuildPhase = state.phase === "build";
  if (locked) return nextState;
  if (!isBuildPhase) {
    setState(s => addLog(s, "You can only staff rooms during the build phase."));
    return nextState;
  }
  if (state.movePayload) {
    setState(s => addLog(s, "Finish moving before changing room staff."));
    return nextState;
  }
  setState(s => {
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
    return addLog({
      ...s,
      grid,
      invMonsters
    }, `Placed ${monster.name} in room.`);
  });
  return nextState;
}
function returnMonsterFromSelectedRoomTransition(state, index) {
  let nextState = state;
  const setState = updater => {
    nextState = typeof updater === "function" ? updater(nextState) : updater;
  };
  const locked = state.coreHp <= 0;
  const isBuildPhase = state.phase === "build";
  if (locked) return nextState;
  if (!isBuildPhase) {
    setState(s => addLog(s, "You can only withdraw room staff during the build phase."));
    return nextState;
  }
  if (state.movePayload) {
    setState(s => addLog(s, "Finish moving before changing room staff."));
    return nextState;
  }
  setState(s => {
    if (!Number.isFinite(index)) return s;
    const grid = cloneGrid(s.grid);
    const t = grid[s.selected.y][s.selected.x];
    if (t.room !== "monster") return addLog(s, "Select a monster room first.");
    const target = t.monsters[index];
    if (!target) return addLog(s, "That monster is no longer in the room.");
    const artifactMods = calcArtifactMods(s.artifacts, s.day);
    const invMonsters = [...s.invMonsters, prepareMonsterForInventory({
      ...target
    }, artifactMods)];
    t.monsters.splice(index, 1);
    return addLog({
      ...s,
      grid,
      invMonsters
    }, `Returned ${target.name} to inventory.`);
  });
  return nextState;
}
function returnAllMonstersFromSelectedRoomTransition(state) {
  let nextState = state;
  const setState = updater => {
    nextState = typeof updater === "function" ? updater(nextState) : updater;
  };
  const locked = state.coreHp <= 0;
  const isBuildPhase = state.phase === "build";
  if (locked) return nextState;
  if (!isBuildPhase) {
    setState(s => addLog(s, "You can only withdraw room staff during the build phase."));
    return nextState;
  }
  if (state.movePayload) {
    setState(s => addLog(s, "Finish moving before changing room staff."));
    return nextState;
  }
  setState(s => {
    const grid = cloneGrid(s.grid);
    const t = grid[s.selected.y][s.selected.x];
    if (t.room !== "monster") return addLog(s, "Select a monster room first.");
    if (!t.monsters.length) return addLog(s, "That room has no monsters to withdraw.");
    const artifactMods = calcArtifactMods(s.artifacts, s.day);
    const returned = t.monsters.map(monster => prepareMonsterForInventory({
      ...monster
    }, artifactMods));
    const count = returned.length;
    const invMonsters = [...s.invMonsters, ...returned];
    t.monsters = [];
    return addLog({
      ...s,
      grid,
      invMonsters
    }, `Returned ${count} monster${count === 1 ? "" : "s"} to inventory.`);
  });
  return nextState;
}

export { buildEvolutionOptions, evoSourceKey, getMonsterFromSource, applyMonsterRoomPlacement, recruitMonsterTransition, startEvolutionTransition, chooseEvolutionTransition, cancelEvolutionTransition, placeInventoryMonsterInSelectedRoomTransition, returnMonsterFromSelectedRoomTransition, returnAllMonstersFromSelectedRoomTransition };
