import { BUILD_VERSION } from "../persistence/saveSchema";
import { getRunRandomState } from "../random";
import { resolveCombatTurn } from "../systems/combat";
import { beginBattleTransition, selectInvasionChoiceTransition, startRaidTransition } from "../systems/raidActions";
import { createDefaultState } from "../systems/runState";
import { effectiveMonsterMaxHp } from "../systems/monsters";
import { OPENING_POLICY, OPENING_SEEDS, prepareMixedOpening } from "./openingPolicy";

const countDefenders = state => state.grid.flat().reduce((sum, tile) => sum + tile.monsters.length, 0);
function snapshot(state) {
  return {
    day: state.day, phase: state.phase, coreHp: state.coreHp,
    currency: { ...state.currency }, dungeonLevel: state.dungeonLevel, doctrines: { ...state.doctrines },
    defenders: state.grid.flatMap((row, y) => row.flatMap((tile, x) => tile.monsters.map(m => ({ x: x + 1, y: y + 1, key: m.key, hp: m.hp, baseMaxHp: m.stats.maxHp, maxHp: effectiveMonsterMaxHp(m, state.doctrines), atk: m.atk, def: m.def, stars: m.stars, class: m.class, passiveKeys: [...(m.passiveKeys || [])] })))),
    inventory: state.invMonsters.map(m => ({ key: m.key, hp: m.hp, stars: m.stars })),
    heroes: state.heroes.map(({ id, hp, x, y }) => ({ id, hp, x: x + 1, y: y + 1 })),
    queuedInvaders: state.partyQueue.length, dailyEvent: state.dailyEvent,
    rngCursor: getRunRandomState().cursor,
  };
}

// The normal run uses only production transitions. Stress mode explicitly
// damages defenders once on Day 1; it never grants money, units, or Core HP.
export function runMixedOpening({ seed = OPENING_SEEDS[0], poorFirstRaid = false, maxTurnsPerRaid = 300 } = {}) {
  if (!Number.isInteger(maxTurnsPerRaid) || maxTurnsPerRaid < 1) throw new Error("maxTurnsPerRaid must be a positive integer.");
  let state = createDefaultState({ runSeed: seed, rngCursor: 0 });
  const initial = snapshot(state);
  const raids = [];
  const decisions = [];
  while (state.day < 10 && state.coreHp > 0) {
    const beforeBuild = snapshot(state);
    const prepared = prepareMixedOpening(state);
    state = prepared.state;
    decisions.push({ day: state.day, actions: prepared.actions });
    if (state.invasionChoices.length) state = selectInvasionChoiceTransition(state, "normal");
    const before = snapshot(state);
    state = beginBattleTransition(state);
    if (state.phase !== "battle") throw new Error(`Opening policy could not begin: ${state.log[0]}`);
    if (poorFirstRaid && state.day === 1) {
      // Deliberate casualty stress test, not a natural raid outcome. Do not
      // grant currency; keep the purchased defense and make it fragile.
      state = { ...state, grid: state.grid.map(row => row.map(tile => ({ ...tile, monsters: tile.monsters.map(m => ({ ...m, hp: 1 })) }))) };
    }
    state = startRaidTransition(state);
    if (!state.raidActive) throw new Error(`Opening policy could not start: ${state.log[0]}`);
    const party = state.currentParty.map(({ profileKey, stars, stats, heroPassiveKey, isRaidLeader }) => ({ profileKey, stars, stats: { ...stats }, heroPassiveKey, isRaidLeader }));
    const raidStart = snapshot(state);
    const raidType = state.raidType;
    let deaths = 0;
    let turns = 0;
    const observations = [];
    while (state.raidActive && state.coreHp > 0 && turns < maxTurnsPerRaid) {
      const priorCount = countDefenders(state);
      const priorLog = state.log;
      state = resolveCombatTurn(state);
      deaths += Math.max(0, priorCount - countDefenders(state));
      let added = 0;
      while (added < state.log.length && !state.log.slice(added).every((line, index) => line === priorLog[index])) added++;
      observations.push({ turn: ++turns, ...snapshot(state), log: state.log.slice(0, added).reverse(), logMayBeTruncated: added === 90 });
    }
    if (state.raidActive && state.coreHp > 0) throw new Error(`Opening simulation exceeded ${maxTurnsPerRaid} turns.`);
    raids.push({ day: before.day, raidType, beforeBuild, before, raidStart, after: snapshot(state), party, deaths, turns, kills: state.raidKills,
      completeWipe: before.defenders.length > 0 && countDefenders(state) === 0,
      coreDamage: Math.max(0, before.coreHp - state.coreHp), observations });
  }
  return { schemaVersion: 1, build: BUILD_VERSION, seed: state.runSeed, policy: OPENING_POLICY, poorFirstRaid,
    method: "developer mechanical mixed opening; production transitions, no Dominion powers; not a human usability result",
    initial, decisions, raids, final: snapshot(state), reachedCouncil: state.day === 10 && state.coreHp > 0,
    completeWipes: raids.filter(r => r.completeWipe).length };
}

export function summarizeOpening(reports) {
  return {
    runs: reports.length,
    dayOneRetained: reports.filter(r => r.raids[0].after.defenders.length > 0).length,
    reachedCouncil: reports.filter(r => r.reachedCouncil).length,
    reachedCouncilWithoutRepeatedWipes: reports.filter(r => r.reachedCouncil && r.completeWipes < 2).length,
    totalWipes: reports.reduce((sum, r) => sum + r.completeWipes, 0),
    dayOneWipes: reports.filter(r => r.raids[0].completeWipe).length,
    dayOneWipesRecoveredDayTwo: reports.filter(r => r.raids[0].completeWipe && r.raids[1]?.after.defenders.length > 0).length,
    seeds: reports.map(r => ({ seed: r.seed, dayOneSurvivors: r.raids[0].after.defenders.length, coreDay3: r.raids.find(d => d.day === 3)?.after.coreHp ?? null,
      coreDay5: r.raids.find(d => d.day === 5)?.after.coreHp ?? null, coreAtCouncil: r.reachedCouncil ? r.final.coreHp : null,
      completeWipes: r.completeWipes, reachedCouncil: r.reachedCouncil, dayTwoBuild: r.raids.find(d => d.day === 2)?.before ?? null })),
  };
}
export function runOpeningSuite({ poorFirstRaid = false } = {}) {
  const reports = OPENING_SEEDS.map(seed => runMixedOpening({ seed, poorFirstRaid }));
  return { poorFirstRaid, summary: summarizeOpening(reports), reports };
}
