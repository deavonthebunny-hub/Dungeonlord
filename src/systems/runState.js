import { MONSTER_ROOMS, TRAP_TYPES, UTILITY_ROOMS } from "../gameContent";
import { createRunSeed, getRunRandomState, normalizeRunSeed, setRunRandomState } from "../random";
import {
  COUNCIL_QUEST_COUNTER_KEYS,
  buildCouncilRaidFromRoster,
  createEmptyCouncilQuestCounters,
  normalizeCouncilFavorMap,
  rebuildCouncilSessionWithFavor,
} from "./council";
import { createEmptyAshTrial, initStartingGrid, normalizeAshTrial, trapChargesForStar } from "./dungeon";
import { getCoreMaxHp, normalizeArtifactList } from "./economy";
import {
  generateArtifactStock,
  generateFleshMarketStock,
  generateTraderStock,
  normalizeArtifactStock,
  normalizeBoughtUniqueKeys,
} from "./markets";
import { initMonsterInventory, normalizeMonsterEntity } from "./monsters";
import {
  HERO_ORDER_MAP,
  buildDailyInvasionChoices,
  normalizeEscalationLevel,
  normalizeHeroEntity,
  normalizeInvasionChoice,
  normalizeRaidIntel,
  prepareRaidPlanForDay,
  resolveRaidDirectiveKey,
} from "./raids";
import {
  H,
  KNOW_MONSTER_ENTITY,
  W,
  clamp,
  clampDungeonLevel,
  clampMonsterStar,
  rollDailyEvent,
} from "./shared";

export function createDefaultState(options = {}) {
  const runSeed = normalizeRunSeed(options.runSeed || createRunSeed());
  setRunRandomState(runSeed, options.rngCursor || 0);
  const dailyEvent = rollDailyEvent();
  const traderStock = generateTraderStock(0, 1);
  const artifacts = [];
  const shadyStock = generateArtifactStock(1, artifacts);
  const grid = initStartingGrid();
  const invasionChoices = buildDailyInvasionChoices(1);
  let invMonsters = initMonsterInventory(0, 2, 2, 1);
  const starterRoom = grid[0]?.[1];
  if (starterRoom && starterRoom.room === "monster") {
    starterRoom.monsters = invMonsters.map((m) => ({ ...m }));
    invMonsters = [];
  }
  return {
    grid,
    selected: { x: 0, y: 0 },
    currency: {
      soulshards: 30,
      evolution: 0,
      dominion: 0,
      essence: 10,
      darkcrystals: 0,
    },
    doctrines: {
      trap: 0,
      monster: 0,
      utility: 0,
      core: 0,
    },
    artifacts,
    shadyStock,
    coreHp: getCoreMaxHp({ doctrines: { trap: 0, monster: 0, utility: 0, core: 0 } }),
    coreShield: 0,
    ashTrial: createEmptyAshTrial(),
    ashTributeUntilDay: 0,
    ashMonsterRoomCapUntilDay: 0,
    nihazaCurseUntilDay: 0,
    bonusRoomCapPermanent: 0,
    fleshMarketUntilDay: 0,
    heroes: [],
    nextHeroId: 1,
    invMonsters,
    log: ["Day 1 begins. Choose your first invasion."],
    raidActive: false,
    raidRemaining: 0, // heroes left to spawn in THIS raid
    raidStartTurn: 0,
    raidStartEssence: 0,
    raidStartShards: 30,
    raidStartCoreHp: getCoreMaxHp({ doctrines: { trap: 0, monster: 0, utility: 0, core: 0 } }),
    raidKills: 0,
    raidType: null,
    lastRaidReport: null,
    turnsSurvived: 0,
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
    dungeonLevel: 1,
    selectedTrapType: TRAP_TYPES[0].key,
    selectedMonsterRoomType: MONSTER_ROOMS[0].key,
    selectedUtilityRoomType: UTILITY_ROOMS[0].key,
    scoutQueue: [],
    evolutionOffer: null,
    movePayload: null,
    fleshMarketStock: [],
    boughtUniqueKeys: [],
    runSeed,
    rngCursor: getRunRandomState().cursor,
    onboardingDismissed: false,
  };
}

export function loadRunState(raw) {
  try {
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed) return null;
    const runSeed = normalizeRunSeed(parsed.runSeed || createRunSeed());
    const savedRngCursor = Number.isFinite(parsed.rngCursor) ? Math.max(0, parsed.rngCursor) : 0;
    const base = createDefaultState({ runSeed, rngCursor: savedRngCursor });
    setRunRandomState(runSeed, savedRngCursor);
    const normalizeGrid = (rawGrid) => {
      if (!Array.isArray(rawGrid) || rawGrid.length !== H) return base.grid;
      const next = base.grid.map((row, y) => {
        if (!Array.isArray(rawGrid[y]) || rawGrid[y].length !== W) return row;
        return row.map((cell, x) => {
          const rawCell = rawGrid[y][x] || {};
          const trapStar = clampMonsterStar(rawCell.trapStar ?? rawCell.trapStars ?? cell.trapStar);
          const trapRank = Math.max(1, rawCell.trapRank ?? rawCell.roomTier ?? cell.trapRank);
          const roomType = rawCell.roomType || cell.roomType;
          const roomTier = rawCell.roomTier ?? cell.roomTier ?? 1;
          const monsters = Array.isArray(rawCell.monsters)
            ? rawCell.monsters
                .filter((monster) => KNOW_MONSTER_ENTITY(monster))
                .map((monster) =>
                  normalizeMonsterEntity(monster, rawCell.room === "monster" ? roomType : null, roomTier)
                )
            : [];
          return {
            ...cell,
            ...rawCell,
            roomTier,
            trapStar,
            trapStars: trapStar,
            trapRank,
            trapChargesRemaining: Number.isFinite(rawCell.trapChargesRemaining)
              ? Math.max(0, rawCell.trapChargesRemaining)
              : rawCell.trap && !rawCell.trapBroken
              ? trapChargesForStar(trapStar)
              : 0,
            trapCooldownRemaining: Number.isFinite(rawCell.trapCooldownRemaining)
              ? Math.max(0, rawCell.trapCooldownRemaining)
              : 0,
            monsters,
          };
        });
      });
      return next;
    };
    const grid = normalizeGrid(parsed.grid);
    const selected =
      parsed.selected && Number.isFinite(parsed.selected.x) && Number.isFinite(parsed.selected.y)
        ? {
            x: clamp(parsed.selected.x, 0, W - 1),
            y: clamp(parsed.selected.y, 0, H - 1),
          }
        : base.selected;
    const currency = parsed.currency
      ? { ...base.currency, ...parsed.currency }
      : { ...base.currency, essence: parsed.essence ?? base.currency.essence };
    const dailyEvent = parsed.dailyEvent || base.dailyEvent;
    const savedDay = Math.max(1, parsed.day || base.day || 1);
    const artifacts = normalizeArtifactList(parsed.artifacts || base.artifacts);
    const traderStock = parsed.traderStock || base.traderStock;
    const shadyStock = normalizeArtifactStock(parsed.shadyStock, savedDay, artifacts);
    const doctrines = {
      trap: Math.max(0, parsed.doctrines?.trap || 0),
      monster: Math.max(0, parsed.doctrines?.monster || 0),
      utility: Math.max(0, parsed.doctrines?.utility || 0),
      core: Math.max(0, parsed.doctrines?.core || 0),
    };
    const dominionEffects = parsed.dominionEffects || base.dominionEffects;
    const evolutionOffer = parsed.evolutionOffer || base.evolutionOffer;
    const coreShield = Number.isFinite(parsed.coreShield) ? parsed.coreShield : base.coreShield;
    const dungeonLevel = clampDungeonLevel(parsed.dungeonLevel ?? base.dungeonLevel ?? 1);
    const councilRaw = parsed.council || base.council;
    const council = {
      active: !!councilRaw.active,
      day: councilRaw.day ?? null,
      roster: Array.isArray(councilRaw.roster) ? councilRaw.roster : [],
      lastRoster: Array.isArray(councilRaw.lastRoster) ? councilRaw.lastRoster : [],
      declinedStreak: Number.isFinite(councilRaw.declinedStreak) ? councilRaw.declinedStreak : 0,
    };
    const councilFavor = normalizeCouncilFavorMap(parsed.councilFavor && typeof parsed.councilFavor === "object" ? parsed.councilFavor : {});
    const ashTrial = normalizeAshTrial(parsed.ashTrial, savedDay);
    const ashTributeUntilDay = Number.isFinite(parsed.ashTributeUntilDay) ? parsed.ashTributeUntilDay : 0;
    const ashMonsterRoomCapUntilDay = Number.isFinite(parsed.ashMonsterRoomCapUntilDay) ? parsed.ashMonsterRoomCapUntilDay : 0;
    const nihazaCurseUntilDay = Number.isFinite(parsed.nihazaCurseUntilDay) ? parsed.nihazaCurseUntilDay : 0;
    const bonusRoomCapPermanent = Math.max(0, parsed.bonusRoomCapPermanent || 0);
    const coreHp = Math.min(
      Number.isFinite(parsed.coreHp) ? parsed.coreHp : base.coreHp,
      getCoreMaxHp({ doctrines, day: savedDay, nihazaCurseUntilDay })
    );
    const nextRaidType = parsed.nextRaidType || base.nextRaidType;
    const pendingRaidOrderKey =
      parsed.pendingRaidOrderKey ||
      parsed.currentParty?.[0]?.orderKey ||
      parsed.partyQueue?.[0]?.orderKey ||
      null;
    const pendingRaidLeaderTraitKey =
      parsed.pendingRaidLeaderTraitKey ||
      parsed.currentParty?.find((hero) => hero?.isRaidLeader)?.leaderTraitKey ||
      null;
    const pendingPunitiveRaid =
      !!parsed.pendingPunitiveRaid || (council.declinedStreak >= 2 && nextRaidType === "council");
    const pendingCouncilRaid =
      parsed.pendingCouncilRaid ||
      (pendingPunitiveRaid && council.roster?.length ? buildCouncilRaidFromRoster(council.roster, parsed.day || base.day, councilFavor) : null);
    const currentPartyRaidType = parsed.currentPartyRaidType || null;
    const escalationsCleared = normalizeEscalationLevel(parsed.escalationsCleared);
    const pendingEscalationLevel = normalizeEscalationLevel(parsed.pendingEscalationLevel);
    const currentRaidEscalationLevel = normalizeEscalationLevel(parsed.currentRaidEscalationLevel);
    const invasionChoices = Array.isArray(parsed.invasionChoices)
      ? parsed.invasionChoices.map((choice) => normalizeInvasionChoice(choice, savedDay)).filter(Boolean)
      : [];
    const selectedInvasionKey = typeof parsed.selectedInvasionKey === "string" ? parsed.selectedInvasionKey : null;
    const councilQuestCounters = createEmptyCouncilQuestCounters();
    for (const key of COUNCIL_QUEST_COUNTER_KEYS) {
      const value = parsed.councilQuestCounters?.[key];
      councilQuestCounters[key] = Number.isFinite(value) ? Math.max(0, value) : 0;
    }
    let councilSession = parsed.councilSession || base.councilSession;
    if (councilSession && Array.isArray(council.roster) && council.roster.length > 0) {
      councilSession = rebuildCouncilSessionWithFavor(councilSession, council.roster, councilSession.day || savedDay, councilFavor);
    } else if (!Array.isArray(councilSession?.sponsors)) {
      councilSession = null;
    }
    const councilQuest =
      parsed.councilQuest && (parsed.councilQuest.metricKey || parsed.councilQuest.questType === "ash-breach-trial")
        ? {
            ...parsed.councilQuest,
            progress:
              parsed.councilQuest.questType === "ash-breach-trial"
                ? Math.max(0, ashTrial.raidsCompleted || parsed.councilQuest.progress || 0)
                : Math.max(0, councilQuestCounters[parsed.councilQuest.metricKey] || parsed.councilQuest.progress || 0),
          }
        : base.councilQuest;
    const boughtUniqueKeys = normalizeBoughtUniqueKeys(parsed.boughtUniqueKeys);
    const nextRaidBoons = Array.isArray(parsed.nextRaidBoons) ? parsed.nextRaidBoons.filter(Boolean) : [];
    const activeRaidBoons = Array.isArray(parsed.activeRaidBoons) ? parsed.activeRaidBoons.filter(Boolean) : [];
    const normalizeHeroList = (list, raidType = null) =>
      Array.isArray(list)
        ? list.filter(Boolean).map((hero) => normalizeHeroEntity(hero, savedDay, raidType, currentRaidEscalationLevel))
        : [];
    const normalizedCurrentParty = normalizeHeroList(parsed.currentParty, currentPartyRaidType);
    const normalizedHeroes = normalizeHeroList(parsed.heroes, parsed.raidType || currentPartyRaidType);
    const normalizedPartyQueue = normalizeHeroList(parsed.partyQueue, currentPartyRaidType);
    const normalizedScoutQueue = normalizeHeroList(parsed.scoutQueue, currentPartyRaidType);
    const raidDirectiveFallback =
      normalizedCurrentParty[0]?.raidDirectiveKey ||
      normalizedHeroes[0]?.raidDirectiveKey ||
      resolveRaidDirectiveKey(parsed.raidType || currentPartyRaidType || nextRaidType, pendingCouncilRaid, savedDay);
    const raidLeaderFallback =
      normalizedCurrentParty.find((hero) => hero.isRaidLeader)?.id ||
      normalizedHeroes.find((hero) => hero.isRaidLeader)?.id ||
      null;
    const raidIntel = normalizeRaidIntel(parsed.raidIntel, raidDirectiveFallback, raidLeaderFallback);
    const fleshMarketUntilDay = parsed.fleshMarketUntilDay || base.fleshMarketUntilDay;
    const fleshMarketStock =
      fleshMarketUntilDay >= savedDay && fleshMarketUntilDay > 0
        ? Array.isArray(parsed.fleshMarketStock) && parsed.fleshMarketStock.length
          ? parsed.fleshMarketStock.filter(Boolean)
          : generateFleshMarketStock(savedDay, boughtUniqueKeys)
        : [];
    const loadedState = {
      ...base,
      ...parsed,
      grid,
      selected,
      currency,
      doctrines,
      dailyEvent,
      traderStock,
      shadyStock,
      artifacts,
      ashTrial,
      ashTributeUntilDay,
      ashMonsterRoomCapUntilDay,
      nihazaCurseUntilDay,
      bonusRoomCapPermanent,
      dominionEffects,
      evolutionOffer,
      coreHp,
      coreShield,
      dungeonLevel,
      council,
      councilFavor,
      councilSession,
      councilQuest,
      councilQuestCounters,
      fleshMarketUntilDay,
      fleshMarketStock,
      boughtUniqueKeys,
      nextRaidType,
      pendingRaidOrderKey,
      pendingRaidOrderName: pendingRaidOrderKey ? HERO_ORDER_MAP[pendingRaidOrderKey]?.name || parsed.pendingRaidOrderName || null : null,
      pendingRaidLeaderTraitKey,
      pendingPunitiveRaid,
      pendingCouncilRaid,
      invasionChoices,
      selectedInvasionKey,
      escalationsCleared,
      pendingEscalationLevel,
      currentRaidEscalationLevel,
      nextRaidBoons,
      activeRaidBoons,
      currentPartyRaidType,
      raidIntel,
      heroes: normalizedHeroes,
      currentParty: normalizedCurrentParty,
      partyQueue: normalizedPartyQueue,
      scoutQueue: normalizedScoutQueue,
      runSeed,
      rngCursor: getRunRandomState().cursor,
      onboardingDismissed: !!parsed.onboardingDismissed,
      invMonsters: Array.isArray(parsed.invMonsters)
        ? parsed.invMonsters
            .filter((monster) => KNOW_MONSTER_ENTITY(monster))
            .map((monster) => normalizeMonsterEntity(monster))
        : base.invMonsters,
    };
    return parsed.raidActive || parsed.phase === "battle" || normalizedHeroes.length > 0
      ? loadedState
      : prepareRaidPlanForDay(loadedState);
  } catch {
    return null;
  }
}
