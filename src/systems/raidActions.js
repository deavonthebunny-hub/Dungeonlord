import { isEscalationDay } from "../gameRules";
import { spawnOneHero } from "./combat";
import { addCouncilQuestCounter } from "./council";
import { cloneGrid, getActiveEntrances, resetArmedTrapsForRaid } from "./dungeon";
import { calcArtifactMods, getDoctrineEffects } from "./economy";
import { validateDungeon } from "./pathing";
import { invaderLabel } from "./presentation";
import { applyInvasionChoiceToState, buildDailyInvasionChoices, buildRaidModifiers, buildRaidPartyWithIntel, buildScoutRevealQueue, getRaidDirectiveRule, normalizeInvasionChoice, normalizeRaidIntel, plannedRaidFromState, raidPlanningState, raidTypeMeta, resolveRaidDirectiveKey } from "./raids";
import { H, HERO_CAP, UNIQUE_ARTIFACT_MAP, W, addLog, formatGridPos, formatStars, safeEntityStars } from "./shared";

function activateDominionPowerTransition(state, kind) {
  let nextState = state;
  const setState = updater => {
    nextState = typeof updater === "function" ? updater(nextState) : updater;
  };
  const locked = state.coreHp <= 0;
  const isBattlePhase = state.phase === "battle";
  if (locked) return nextState;
  if (!isBattlePhase) {
    setState(s => addLog(s, "Dominion powers can only be used in battle."));
    return nextState;
  }
  if (!state.raidActive && state.heroes.length === 0) {
    setState(s => addLog(s, "No active raid to target."));
    return nextState;
  }
  const costByKind = {
    pulse: 2,
    shield: 2,
    speed: 1,
    strength: 1
  };
  const cost = costByKind[kind] || 1;
  setState(s => {
    if (s.currency.dominion < cost) return addLog(s, "Not enough Dominion.");
    let dominionEffects = {
      ...s.dominionEffects
    };
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
    const currency = {
      ...s.currency,
      dominion: s.currency.dominion - cost
    };
    return addLog({
      ...s,
      currency,
      dominionEffects,
      coreShield
    }, msg);
  });
  return nextState;
}
function selectInvasionChoiceTransition(state, choiceKey) {
  let nextState = state;
  const setState = updater => {
    nextState = typeof updater === "function" ? updater(nextState) : updater;
  };
  const locked = state.coreHp <= 0;
  if (locked) return nextState;
  setState(s => {
    if (s.phase !== "build") return addLog(s, "Invasion choices can only be changed during build phase.");
    if (s.council?.active || s.councilSession && s.councilSession.day === s.day) {
      return addLog(s, "The Council must conclude before choosing the next invasion.");
    }
    if (s.pendingPunitiveRaid || isEscalationDay(s.day)) {
      return addLog(s, "Today's raid is forced.");
    }
    const choices = Array.isArray(s.invasionChoices) && s.invasionChoices.length ? s.invasionChoices.map(choice => normalizeInvasionChoice(choice, s.day)).filter(Boolean) : buildDailyInvasionChoices(s.day);
    const choice = choices.find(entry => entry.key === choiceKey);
    if (!choice) return addLog({
      ...s,
      invasionChoices: choices
    }, "That invasion option is no longer available.");
    const ns = applyInvasionChoiceToState({
      ...s,
      invasionChoices: choices
    }, choice);
    return addLog(ns, `Invasion selected: ${choice.label}${choice.orderName ? ` - ${choice.orderName}` : ""}.`);
  });
  return nextState;
}
function beginBattleTransition(state) {
  let nextState = state;
  const setState = updater => {
    nextState = typeof updater === "function" ? updater(nextState) : updater;
  };
  const locked = state.coreHp <= 0;
  const isBuildPhase = state.phase === "build";
  if (locked) return nextState;
  if (!isBuildPhase) {
    setState(s => addLog(s, "Battle already active."));
    return nextState;
  }
  if (state.council?.active) {
    setState(s => addLog(s, "Council is in session. Attend or decline first."));
    return nextState;
  }
  if (state.councilSession && state.councilSession.day === state.day) {
    setState(s => addLog(s, "Conclude the Council before beginning another battle."));
    return nextState;
  }
  if (!state.nextRaidType) {
    setState(s => addLog(s, "Choose an invasion in Raid Forecast first."));
    return nextState;
  }
  setState(s => {
    const raidType = s.pendingPunitiveRaid ? "council" : s.nextRaidType;
    if (!raidType) return addLog(s, "Choose an invasion in Raid Forecast first.");
    const escalationLevel = raidType === "escalation" ? Math.max(1, s.pendingEscalationLevel || 1) : 0;
    const plannedRaid = plannedRaidFromState(s, raidType, s.pendingCouncilRaid, s.day);
    const stagedRaid = buildRaidPartyWithIntel(s.turnsSurvived, raidType, s.day, {
      councilRaid: s.pendingCouncilRaid,
      raidBoons: s.nextRaidBoons,
      grid: s.grid,
      plannedRaid,
      escalationLevel
    });
    const party = stagedRaid.party;
    const scoutQueue = buildScoutRevealQueue(party, s.grid, s.doctrines, s.nextRaidBoons, s.artifacts, s.day);
    let ns = {
      ...s,
      phase: "battle",
      currentRaidEscalationLevel: escalationLevel,
      currentParty: party,
      currentPartyRaidType: raidType || null,
      partyQueue: party.map(h => ({
        ...h
      })),
      scoutQueue,
      raidIntel: stagedRaid.raidIntel,
      ...raidPlanningState(stagedRaid.plannedRaid)
    };
    if (scoutQueue.length > 0) {
      ns = addCouncilQuestCounter(ns, "revealedInvaderCount", scoutQueue.length);
    }
    const meta = raidTypeMeta(raidType, s.pendingCouncilRaid);
    ns = addLog(ns, `Day ${s.day} battle begins. ${meta.label}${escalationLevel ? ` Level ${escalationLevel}` : ""}. Party size ${party.length}.`);
    ns = addLog(ns, meta.desc);
    ns = addLog(ns, `Raid directive: ${getRaidDirectiveRule(stagedRaid.directiveKey).name}.`);
    if (stagedRaid.plannedRaid?.orderName) {
      ns = addLog(ns, `Expedition order: ${stagedRaid.plannedRaid.orderName}${stagedRaid.plannedRaid.leaderTraitName ? ` | Leader trait ${stagedRaid.plannedRaid.leaderTraitName}` : ""}.`);
    }
    if (scoutQueue.length > 0) {
      const previews = scoutQueue.map(h => `${h.name}${h.isRaidLeader ? " [Leader]" : ""} (${formatStars(safeEntityStars(h))}, ATK ${h.atk}, HP ${h.hp})`).join(" | ");
      ns = addLog(ns, `Scout report: ${previews}`);
    }
    return ns;
  });
  return nextState;
}
function startRaidTransition(state) {
  let nextState = state;
  const setState = updater => {
    nextState = typeof updater === "function" ? updater(nextState) : updater;
  };
  const locked = state.coreHp <= 0;
  const validation = validateDungeon(state.grid, state.ashTrial);
  if (locked) return nextState;
  if (state.council?.active) {
    setState(s => addLog(s, "Council is in session. Attend or decline first."));
    return nextState;
  }
  if (state.councilSession && state.councilSession.day === state.day) {
    setState(s => addLog(s, "Conclude the Council before starting another raid."));
    return nextState;
  }
  if (!state.nextRaidType) {
    setState(s => addLog(s, "Choose an invasion in Raid Forecast first."));
    return nextState;
  }
  if (state.movePayload) {
    setState(s => addLog(s, "Finish moving before starting a raid."));
    return nextState;
  }
  if (!validation.ok) {
    setState(s => addLog(s, `Cannot start raid: ${validation.reason}`));
    return nextState;
  }
  setState(s => {
    if (s.raidActive) return addLog(s, "Raid is already active.");
    if (s.phase !== "battle") return addLog(s, "You can only start raids during battle.");
    const entrances = getActiveEntrances(s.grid, s.ashTrial);
    if (!entrances.length) return addLog(s, "Place an Entrance first.");
    const grid = resetArmedTrapsForRaid(cloneGrid(s.grid), s);
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
    if (!raidType) return addLog(s, "Choose an invasion in Raid Forecast first.");
    const escalationLevel = raidType === "escalation" ? Math.max(1, s.currentRaidEscalationLevel || s.pendingEscalationLevel || 1) : 0;
    const plannedRaid = plannedRaidFromState(s, raidType, s.pendingCouncilRaid, s.day);
    const reuseParty = s.currentParty && s.currentParty.length && (s.currentPartyRaidType || null) === (raidType || null) && (raidType !== "escalation" || (s.currentRaidEscalationLevel || 0) === escalationLevel);
    const stagedRaid = reuseParty ? {
      directiveKey: s.raidIntel?.directive || s.currentParty?.[0]?.raidDirectiveKey || resolveRaidDirectiveKey(raidType, s.pendingCouncilRaid, s.day),
      party: s.currentParty,
      plannedRaid,
      raidIntel: normalizeRaidIntel(s.raidIntel, s.currentParty?.[0]?.raidDirectiveKey || resolveRaidDirectiveKey(raidType, s.pendingCouncilRaid, s.day), s.currentParty?.find(hero => hero.isRaidLeader)?.id || null)
    } : buildRaidPartyWithIntel(s.turnsSurvived, raidType, s.day, {
      councilRaid: s.pendingCouncilRaid,
      raidBoons: s.nextRaidBoons,
      grid: s.grid,
      plannedRaid,
      escalationLevel
    });
    const party = stagedRaid.party;
    let partyQueue = [...party];
    let raidRemaining = partyQueue.length;
    let raidKills = 0;
    let scoutQueue = buildScoutRevealQueue(partyQueue, s.grid, s.doctrines, s.nextRaidBoons, s.artifacts, s.day);
    const artifactModsStart = calcArtifactMods(s.artifacts, s.day);
    const raidMods = buildRaidModifiers(s.nextRaidBoons);
    const doctrineEffects = getDoctrineEffects(s.doctrines);
    const doctrineShield = doctrineEffects.coreShieldBonus || 0;
    const fortifiedCoreShield = (s.coreShield || 0) + doctrineShield + (raidMods.coreShieldBonus || 0) + (artifactModsStart.coreStartShield || 0);
    if (heroes.length < HERO_CAP && partyQueue.length > 0) {
      const spawnResult = spawnOneHero(heroes, nextId, entrances, s.turnsSurvived, partyQueue, grid, raidType, s.day, escalationLevel);
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
        currentRaidEscalationLevel: escalationLevel,
        partyQueue,
        raidIntel: stagedRaid.raidIntel,
        ...raidPlanningState(stagedRaid.plannedRaid),
        raidType: raidType || null,
        nextRaidType: null,
        pendingPunitiveRaid: false,
        pendingCouncilRaid: null,
        nextRaidBoons: [],
        activeRaidBoons: [...(s.nextRaidBoons || [])]
      };
      if (scoutQueue.length > 0 && !reuseParty) {
        ns = addCouncilQuestCounter(ns, "revealedInvaderCount", scoutQueue.length);
      }
      const meta = raidTypeMeta(raidType, s.pendingCouncilRaid);
      ns = addLog(ns, `Raid directive: ${getRaidDirectiveRule(stagedRaid.directiveKey).name}.`);
      if (stagedRaid.plannedRaid?.orderName) {
        ns = addLog(ns, `Expedition order: ${stagedRaid.plannedRaid.orderName}${stagedRaid.plannedRaid.leaderTraitName ? ` | Leader trait ${stagedRaid.plannedRaid.leaderTraitName}` : ""}.`);
      }
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
      ns = addLog(ns, `Raid started. ${meta.label}${escalationLevel ? ` Level ${escalationLevel}` : ""}. Party size ${party.length}. ${invaderLabel(spawnResult.spawned)} enters from ${originLabel}.`);
      if (scoutQueue.length > 0) {
        const previews = scoutQueue.map(h => `${h.name}${h.isRaidLeader ? " [Leader]" : ""} (${formatStars(safeEntityStars(h))}, ATK ${h.atk}, HP ${h.hp})`).join(" | ");
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
      currentRaidEscalationLevel: escalationLevel,
      partyQueue,
      raidIntel: stagedRaid.raidIntel,
      raidType: raidType || null,
      nextRaidType: null,
      pendingPunitiveRaid: false,
      pendingCouncilRaid: null,
      nextRaidBoons: [],
      activeRaidBoons: [...(s.nextRaidBoons || [])]
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
    ns = addLog(ns, `Raid started. ${meta.label}${escalationLevel ? ` Level ${escalationLevel}` : ""}. Party size ${party.length}. (Cap reached; no spawn yet.)`);
    if (scoutQueue.length > 0) {
      const previews = scoutQueue.slice(0, 2).map(h => `${h.name}${h.isRaidLeader ? " [Leader]" : ""} (${formatStars(safeEntityStars(h))}, ATK ${h.atk}, HP ${h.hp})`).join(" | ");
      ns = addLog(ns, `Scout report: ${previews}`);
    }
    return ns;
  });
  return nextState;
}

export { activateDominionPowerTransition, selectInvasionChoiceTransition, beginBattleTransition, startRaidTransition };
