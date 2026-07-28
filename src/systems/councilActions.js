import {
  addLogLines,
  applyCouncilFavorShiftDetailed,
  applyCouncilRewardToState,
  buildCouncilRaidFromRoster,
  canAcceptCouncilSponsorAction,
  councilQuestProgressValue,
  normalizeCouncilFavorMap,
  rebuildCouncilSessionWithFavor,
} from "./council";
import { ashBreachRequirementText, canPlaceAshBreaches } from "./dungeon";
import { generateArtifactStock, generateFleshMarketStock, generateTraderStock } from "./markets";
import { rollAshBreachPositions } from "./pathing";
import { planRaidEncounter, prepareRaidPlanForDay, raidPlanningState } from "./raids";
import { addLog, formatGridPos, nextCouncilDayAfter, rollDailyEvent } from "./shared";

function attendCouncilTransition(state) {
  let nextState = state;
  const setState = updater => {
    nextState = typeof updater === "function" ? updater(nextState) : updater;
  };
  if (!state.council?.active) return nextState;
  setState(s => {
    const council = {
      ...s.council,
      active: false,
      declinedStreak: 0
    };
    let councilSession = s.councilSession ? {
      ...s.councilSession,
      status: "attended"
    } : s.councilSession;
    let councilFavor = normalizeCouncilFavorMap(s.councilFavor || {});
    const favorLogLines = [];
    for (const member of council.roster || []) {
      const favorShift = applyCouncilFavorShiftDetailed(councilFavor, member.key, 1, "Council attended");
      councilFavor = favorShift.favorMap;
      favorLogLines.push(...favorShift.logLines);
    }
    councilSession = rebuildCouncilSessionWithFavor(councilSession, council.roster || [], s.day, councilFavor);
    let ns = {
      ...s,
      council,
      councilFavor,
      nextRaidType: null,
      ...raidPlanningState(null),
      pendingPunitiveRaid: false,
      pendingCouncilRaid: null,
      invasionChoices: [],
      selectedInvasionKey: null,
      pendingEscalationLevel: 0,
      councilSession
    };
    ns = addLogLines(ns, favorLogLines);
    ns = addLog(ns, "You attended the Council.");
    if (council.roster?.length) {
      const names = council.roster.map(m => m.name).join(", ");
      ns = addLog(ns, `Council attendees: ${names}.`);
    }
    ns = addLog(ns, "Choose any Council boon or quest, then conclude the Council to advance.");
    return ns;
  });
  return nextState;
}

function declineCouncilTransition(state) {
  let nextState = state;
  const setState = updater => {
    nextState = typeof updater === "function" ? updater(nextState) : updater;
  };
  if (!state.council?.active) return nextState;
  setState(s => {
    const declinedStreak = (s.council?.declinedStreak || 0) + 1;
    const council = {
      ...s.council,
      active: false,
      declinedStreak
    };
    let councilSession = s.councilSession ? {
      ...s.councilSession,
      status: "declined"
    } : s.councilSession;
    let councilFavor = normalizeCouncilFavorMap(s.councilFavor || {});
    const favorLogLines = [];
    for (const member of council.roster || []) {
      const favorShift = applyCouncilFavorShiftDetailed(councilFavor, member.key, -1, "Council declined");
      councilFavor = favorShift.favorMap;
      favorLogLines.push(...favorShift.logLines);
    }
    councilSession = rebuildCouncilSessionWithFavor(councilSession, council.roster || [], s.day, councilFavor);
    let ns = {
      ...s,
      council,
      councilFavor,
      nextRaidType: null,
      ...raidPlanningState(null),
      pendingPunitiveRaid: false,
      pendingCouncilRaid: null,
      invasionChoices: [],
      selectedInvasionKey: null,
      pendingEscalationLevel: 0,
      councilSession
    };
    ns = addLogLines(ns, favorLogLines);
    ns = addLog(ns, "You declined the Council.");
    if (declinedStreak >= 2) {
      ns = addLog(ns, "The Council will prepare a punitive raid after this session concludes.");
    }
    ns = addLog(ns, "Conclude the Council to advance.");
    return ns;
  });
  return nextState;
}

function concludeCouncilTransition(state) {
  let nextState = state;
  const setState = updater => {
    nextState = typeof updater === "function" ? updater(nextState) : updater;
  };
  const locked = state.coreHp <= 0;
  if (locked) return nextState;
  if (!state.councilSession || state.councilSession.day !== state.day) return nextState;
  if (state.councilSession.status === "pending") {
    setState(s => addLog(s, "Attend or decline the Council before concluding it."));
    return nextState;
  }
  setState(s => {
    if (!s.councilSession || s.councilSession.day !== s.day) return s;
    if (s.councilSession.status === "pending") return addLog(s, "Attend or decline the Council before concluding it.");
    const nextDay = (s.day || 1) + 1;
    const dailyEvent = rollDailyEvent();
    let ns = {
      ...s,
      day: nextDay,
      phase: "build",
      council: {
        ...(s.council || {}),
        active: false,
        day: null
      },
      councilSession: null,
      heroes: [],
      raidActive: false,
      raidRemaining: 0,
      raidKills: 0,
      raidType: null,
      currentParty: [],
      currentPartyRaidType: null,
      currentRaidEscalationLevel: 0,
      partyQueue: [],
      scoutQueue: [],
      raidIntel: null,
      activeRaidBoons: [],
      dailyEvent,
      traderStock: generateTraderStock(s.turnsSurvived, nextDay),
      shadyStock: generateArtifactStock(nextDay, s.artifacts),
      fleshMarketStock: s.fleshMarketUntilDay >= nextDay && s.fleshMarketUntilDay > 0 ? generateFleshMarketStock(nextDay, s.boughtUniqueKeys || []) : [],
      dpRegenCounter: 0,
      invasionChoices: [],
      selectedInvasionKey: null,
      pendingEscalationLevel: 0
    };
    const punitive = (s.council?.declinedStreak || 0) >= 2;
    if (punitive) {
      const pendingCouncilRaid = buildCouncilRaidFromRoster(s.council?.roster || [], nextDay, s.councilFavor || {});
      const plannedRaid = planRaidEncounter("council", nextDay, {
        councilRaid: pendingCouncilRaid
      });
      ns = {
        ...ns,
        nextRaidType: "council",
        ...raidPlanningState(plannedRaid),
        pendingPunitiveRaid: true,
        pendingCouncilRaid,
        selectedInvasionKey: "council"
      };
      ns = addLog(ns, `The Council prepares a punitive raid. ${pendingCouncilRaid?.label || ""}`.trim());
    } else {
      ns = prepareRaidPlanForDay(ns, {
        rerollChoices: true
      });
    }
    ns = addLog(ns, `Council concludes. Day ${nextDay} begins. Build phase.`);
    if (ns.dailyEvent?.key && ns.dailyEvent.key !== "none") {
      ns = addLog(ns, `Daily Event: ${ns.dailyEvent.name} - ${ns.dailyEvent.desc}`);
    }
    return ns;
  });
  return nextState;
}

function acceptCouncilBoonTransition(state, sponsorKey) {
  let nextState = state;
  const setState = updater => {
    nextState = typeof updater === "function" ? updater(nextState) : updater;
  };
  setState(s => {
    if (!s.councilSession || s.councilSession.status !== "attended") return s;
    if (s.councilSession.acceptedCouncilBoonKey) return addLog(s, "You already accepted a Council boon.");
    if (!canAcceptCouncilSponsorAction(s.councilSession, sponsorKey)) return addLog(s, "You have already courted another sponsor this Council.");
    const sponsor = (s.councilSession.sponsors || []).find(entry => entry.key === sponsorKey);
    const boon = sponsor?.boon;
    if (!sponsor || !boon) return s;
    if (!sponsor.available || boon.available === false) {
      return addLog(s, boon.lockedReason || sponsor.lockedReason || "That sponsor's boon is not available yet.");
    }
    let ns = {
      ...s
    };
    const rewardResult = applyCouncilRewardToState(ns, boon.reward, boon.sponsorName, s.day);
    ns = rewardResult.nextState;
    let rewardText = rewardResult.rewardText ? ` ${rewardResult.rewardText}.` : "";
    if (boon.marketAccess) {
      const untilDay = nextCouncilDayAfter(s.day);
      ns.fleshMarketUntilDay = untilDay;
      ns.fleshMarketStock = generateFleshMarketStock(s.day, ns.boughtUniqueKeys || []);
      rewardText += ` Flesh Market open until Day ${untilDay}.`;
    }
    const favorShift = applyCouncilFavorShiftDetailed(s.councilFavor || {}, sponsorKey, 2, "Council boon accepted");
    ns.councilFavor = favorShift.favorMap;
    if (boon.raidEffect) {
      ns.nextRaidBoons = [...(s.nextRaidBoons || []), {
        ...boon.raidEffect,
        sponsorKey: boon.sponsorKey,
        sponsorName: boon.sponsorName
      }].filter(Boolean);
    }
    ns.councilSession = rebuildCouncilSessionWithFavor({
      ...s.councilSession,
      courtedSponsorKey: s.councilSession.courtedSponsorKey || sponsorKey,
      acceptedCouncilBoonKey: sponsorKey
    }, s.council?.roster || [], s.day, ns.councilFavor);
    const leverageText = boon.raidEffect?.desc ? ` ${boon.raidEffect.desc}` : "";
    ns = addLogLines(ns, favorShift.logLines);
    return addLog(ns, `Council boon received: ${boon.title} from ${boon.sponsorName}.${rewardText}${leverageText}`.trim());
  });
  return nextState;
}

function acceptCouncilQuestTransition(state, sponsorKey, difficulty) {
  let nextState = state;
  const setState = updater => {
    nextState = typeof updater === "function" ? updater(nextState) : updater;
  };
  setState(s => {
    if (!s.councilSession || s.councilSession.status !== "attended") return s;
    if (s.councilQuest?.active) return addLog(s, "You already have an active Council quest.");
    if (!canAcceptCouncilSponsorAction(s.councilSession, sponsorKey)) return addLog(s, "You have already courted another sponsor this Council.");
    const sponsor = (s.councilSession.sponsors || []).find(entry => entry.key === sponsorKey);
    const quest = sponsor?.quests?.[difficulty];
    if (!quest) return s;
    if (!sponsor?.available || quest.available === false) {
      return addLog(s, quest.lockedReason || sponsor?.lockedReason || "That sponsor's quest is not available yet.");
    }
    let nextState = {
      ...s
    };
    if (quest.questType === "ash-breach-trial") {
      const breachCount = Math.max(1, quest.breachCount || (difficulty === "hard" ? 2 : 1));
      if (!canPlaceAshBreaches(s.grid, breachCount)) {
        return addLog(s, `Nihaza's trial is unavailable. ${ashBreachRequirementText(breachCount)}`);
      }
      const breaches = rollAshBreachPositions(s.grid, breachCount, s.day);
      if (breaches.length < breachCount) {
        return addLog(s, `Nihaza finds no valid frontline breach. ${ashBreachRequirementText(breachCount)}`);
      }
      nextState.ashTrial = {
        active: true,
        difficulty,
        breaches,
        raidsCompleted: 0,
        requiredRaids: Math.max(1, quest.goal || 2),
        expiresDay: nextCouncilDayAfter(s.day)
      };
      for (const breach of breaches) {
        nextState = addLog(nextState, `Nihaza opens an Ash Breach at ${formatGridPos(breach)}. The dungeon trembles.`);
      }
    }
    const councilQuest = {
      ...quest,
      active: true,
      progress: councilQuestProgressValue(nextState, quest)
    };
    const favorShift = applyCouncilFavorShiftDetailed(nextState.councilFavor || {}, sponsorKey, 1, "Council quest accepted");
    const councilFavor = favorShift.favorMap;
    const councilSession = rebuildCouncilSessionWithFavor({
      ...nextState.councilSession,
      courtedSponsorKey: nextState.councilSession.courtedSponsorKey || sponsorKey,
      acceptedCouncilQuestId: quest.id,
      acceptedCouncilQuestDifficulty: difficulty
    }, nextState.council?.roster || [], nextState.day, councilFavor);
    return addLog(addLogLines({
      ...nextState,
      councilQuest,
      councilSession,
      councilFavor
    }, favorShift.logLines), `Council quest accepted: ${quest.title} (${quest.sponsorName}, ${difficulty}).`);
  });
  return nextState;
}

export { attendCouncilTransition, declineCouncilTransition, concludeCouncilTransition, acceptCouncilBoonTransition, acceptCouncilQuestTransition };
