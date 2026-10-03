import { createRunSeed, getRunRandomState, setRunRandomState } from "../random";
import { createEmptyCouncilQuestCounters } from "./council";
import { createEmptyAshTrial, resetLayoutKeepStructure } from "./dungeon";
import { getCoreMaxHp } from "./economy";
import { generateArtifactStock, generateTraderStock } from "./markets";
import { initMonsterInventory } from "./monsters";
import { buildDailyInvasionChoices } from "./raids";
import { createDefaultState } from "./runState";
import { addLog, rollDailyEvent } from "./shared";

export function dismissOnboardingTransition(state) {
  return { ...state, onboardingDismissed: true };
}

export function createNewRunTransition() {
  return {
    ...createDefaultState(),
    log: ["Day 1 begins. Choose your first invasion."],
  };
}

export function resetRunKeepingLayoutTransition(state) {
  const runSeed = createRunSeed();
  setRunRandomState(runSeed, 0);
  const grid = resetLayoutKeepStructure(state.grid);
  const dailyEvent = rollDailyEvent();
  const traderStock = generateTraderStock(0, 1);
  const shadyStock = generateArtifactStock(1, []);
  const invasionChoices = buildDailyInvasionChoices(1);
  const emptyDoctrines = { trap: 0, monster: 0, utility: 0, core: 0 };
  const coreHp = getCoreMaxHp({ doctrines: emptyDoctrines });
  const reset = {
    ...state,
    grid,
    currency: {
      ...state.currency,
      soulshards: 30,
      essence: 10,
      evolution: 0,
      dominion: 0,
      darkcrystals: 0,
    },
    doctrines: emptyDoctrines,
    artifacts: [],
    shadyStock,
    coreHp,
    coreShield: 0,
    ashTrial: createEmptyAshTrial(),
    ashTributeUntilDay: 0,
    ashMonsterRoomCapUntilDay: 0,
    nihazaCurseUntilDay: 0,
    bonusRoomCapPermanent: 0,
    heroes: [],
    nextHeroId: 1,
    invMonsters: initMonsterInventory(0, 2, 2, 1),
    raidActive: false,
    raidRemaining: 0,
    turnsSurvived: 0,
    raidStartTurn: 0,
    raidStartEssence: 0,
    raidStartShards: 30,
    raidStartCoreHp: coreHp,
    raidKills: 0,
    raidType: null,
    lastRaidReport: null,
    movePayload: null,
    scoutQueue: [],
    day: 1,
    phase: "build",
    currentParty: [],
    currentPartyRaidType: null,
    partyQueue: [],
    raidIntel: null,
    dailyEvent,
    traderStock,
    dpRegenCounter: 0,
    dominionEffects: {
      monsterAtk: 0,
      monsterFirstStrike: false,
      pulsePending: false,
    },
    council: {
      active: false,
      day: null,
      roster: [],
      lastRoster: [],
      declinedStreak: 0,
    },
    councilFavor: {},
    councilSession: null,
    councilQuest: null,
    councilQuestCounters: createEmptyCouncilQuestCounters(),
    nextRaidType: null,
    pendingRaidOrderKey: null,
    pendingRaidOrderName: null,
    pendingRaidLeaderTraitKey: null,
    pendingPunitiveRaid: false,
    pendingCouncilRaid: null,
    invasionChoices,
    selectedInvasionKey: null,
    escalationsCleared: 0,
    pendingEscalationLevel: 0,
    currentRaidEscalationLevel: 0,
    nextRaidBoons: [],
    activeRaidBoons: [],
    fleshMarketUntilDay: 0,
    fleshMarketStock: [],
    boughtUniqueKeys: [],
    evolutionOffer: null,
    runSeed,
    rngCursor: getRunRandomState().cursor,
    onboardingDismissed: false,
  };
  return addLog(reset, "Run reset (layout kept). Choose your first invasion.");
}
