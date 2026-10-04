import { BUILD_VERSION } from "../persistence/saveSchema";
import { getRunRandomState } from "../random";
import { resolveCombatTurn } from "../systems/combat";
import { beginBattleTransition, selectInvasionChoiceTransition, startRaidTransition } from "../systems/raidActions";
import { createDefaultState } from "../systems/runState";

const STRATEGY = "unchanged-starter-normal-no-purchases-or-powers-v1";

function defenders(state) {
  return state.grid.flatMap((row, y) => row.flatMap((tile, x) =>
    (tile.monsters || []).map((monster) => ({
      x: x + 1, y: y + 1, key: monster.key, name: monster.name, hp: monster.hp,
      baseMaxHp: monster.stats?.maxHp, personalEvolution: monster.evoPoints || 0,
      foughtThisRaid: !!monster.foughtThisRaid,
    }))
  ));
}

function snapshot(state) {
  return {
    day: state.day, phase: state.phase, coreHp: state.coreHp, coreShield: state.coreShield,
    currency: { ...state.currency }, defenders: defenders(state),
    heroes: state.heroes.map(({ id, hp, x, y }) => ({ id, hp, x: x + 1, y: y + 1 })),
    queuedInvaders: state.partyQueue.length, rngCursor: getRunRandomState().cursor,
  };
}

// A deliberately fixed mechanical reference, not an autonomous player or a
// balanced strategy. It uses the production transitions and records every turn.
export function runOpeningBaseline({ seed = "DL--1F0BD67D", days = 5, maxTurnsPerRaid = 300 } = {}) {
  if (!Number.isInteger(days) || days < 1 || days > 9) throw new Error("Baseline days must be an integer from 1 to 9 (before Council).");
  if (!Number.isInteger(maxTurnsPerRaid) || maxTurnsPerRaid < 1) throw new Error("maxTurnsPerRaid must be a positive integer.");
  let state = createDefaultState({ runSeed: seed, rngCursor: 0 });
  const initial = snapshot(state);
  const decisions = [];
  const raids = [];
  let stopReason = "requested-days-complete";
  while (state.day <= days && state.coreHp > 0) {
    if (state.invasionChoices.length) {
      decisions.push({ day: state.day, action: "select-normal", rngCursor: getRunRandomState().cursor });
      state = selectInvasionChoiceTransition(state, "normal");
    }
    const before = snapshot(state);
    decisions.push({ day: state.day, action: "begin-battle-and-start-raid", rngCursor: before.rngCursor });
    state = startRaidTransition(beginBattleTransition(state));
    if (!state.raidActive) throw new Error(`Baseline could not start Day ${before.day}: ${state.log[0]}`);
    const raidType = state.raidType;
    const partySize = state.currentParty.length;
    const escalationLevel = state.currentRaidEscalationLevel || 0;
    const turns = [];
    let defenderDeaths = 0;
    while (state.raidActive && state.coreHp > 0 && turns.length < maxTurnsPerRaid) {
      const prior = snapshot(state);
      const previousLog = state.log;
      state = resolveCombatTurn(state);
      const after = snapshot(state);
      let addedLines = 0;
      while (addedLines < state.log.length && !state.log.slice(addedLines).every((line, index) => line === previousLog[index])) addedLines += 1;
      const newLog = state.log.slice(0, addedLines).reverse();
      const deaths = Math.max(0, prior.defenders.length - after.defenders.length);
      defenderDeaths += deaths;
      turns.push({
        raidTurn: turns.length + 1, cumulativeTurn: state.turnsSurvived,
        before: prior, after, defenderDeaths: deaths, log: newLog,
        logMayBeTruncated: addedLines === 90,
      });
    }
    const after = snapshot(state);
    raids.push({
      day: before.day, raidType, escalationLevel, partySize, before, after, turns,
      kills: state.raidKills, defenderDeaths,
      coreDamage: Math.max(0, before.coreHp - after.coreHp),
      currencyDelta: Object.fromEntries(Object.keys(before.currency).map((key) => [key, after.currency[key] - before.currency[key]])),
      purchases: 0, replacementSpend: 0, dominionSpend: 0,
      cleared: !state.raidActive && state.coreHp > 0 && state.day > before.day,
    });
    if (state.coreHp <= 0) stopReason = "core-destroyed";
    else if (state.raidActive) { stopReason = "turn-limit"; break; }
  }
  return {
    schemaVersion: 1, build: BUILD_VERSION, seed: state.runSeed, strategy: STRATEGY,
    method: "developer mechanical baseline using production transitions; not the autonomous UI playthrough",
    requestedDays: days, maxTurnsPerRaid, decisions, initial, raids, final: snapshot(state), stopReason,
  };
}
