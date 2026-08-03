import { describe, expect, it } from "vitest";
import { resolveCombatTurn } from "./combat";
import { COUNCIL_MEMBER_MAP, buildCouncilSession } from "./council";
import {
  acceptCouncilQuestTransition,
  attendCouncilTransition,
  concludeCouncilTransition,
  declineCouncilTransition,
} from "./councilActions";
import { getCoreMaxHp } from "./economy";
import { createDefaultState } from "./runState";

function councilState(seed, declinedStreak = 0) {
  const fresh = createDefaultState({ runSeed: seed, rngCursor: 0 });
  const roster = [COUNCIL_MEMBER_MAP.nihaza];
  return {
    ...fresh,
    day: 10,
    council: {
      ...fresh.council,
      active: true,
      day: 10,
      roster,
      lastRoster: roster,
      declinedStreak,
    },
    councilSession: buildCouncilSession(roster, 10, fresh.councilFavor),
    invasionChoices: [],
    selectedInvasionKey: null,
    nextRaidType: null,
  };
}

function acceptedNihazaTrial(seed) {
  const attended = attendCouncilTransition(councilState(seed));
  return acceptCouncilQuestTransition(attended, "nihaza", "standard");
}

function completingRaid(state, overrides = {}) {
  return {
    ...state,
    phase: "battle",
    raidActive: true,
    raidRemaining: 0,
    raidType: "normal",
    heroes: [],
    currentParty: [],
    partyQueue: [],
    scoutQueue: [],
    raidStartTurn: state.turnsSurvived,
    raidStartEssence: state.currency.essence,
    raidStartShards: state.currency.soulshards,
    raidStartCoreHp: state.coreHp,
    ...overrides,
  };
}

describe("Council and Nihaza lifecycle", () => {
  it("requires an attend or decline decision before Council conclusion", () => {
    const pending = councilState("DL-COUNCIL-PENDING");
    const blocked = concludeCouncilTransition(pending);

    expect(blocked.day).toBe(10);
    expect(blocked.councilSession.status).toBe("pending");
    expect(blocked.log.some((line) => line.includes("Attend or decline"))).toBe(true);
  });

  it("attends and concludes a Council into the next build day", () => {
    const pending = councilState("DL-COUNCIL-CONCLUDE");
    const attended = attendCouncilTransition(pending);
    const concluded = concludeCouncilTransition(attended);

    expect(attended.councilSession.status).toBe("attended");
    expect(concluded).toMatchObject({ day: 11, phase: "build", councilSession: null });
    expect(concluded.council.active).toBe(false);
    expect(concluded.invasionChoices.length).toBeGreaterThan(0);
  });

  it("stages a punitive raid after the second consecutive decline", () => {
    const pending = councilState("DL-COUNCIL-PUNITIVE", 1);
    const declined = declineCouncilTransition(pending);
    const concluded = concludeCouncilTransition(declined);

    expect(declined.council.declinedStreak).toBe(2);
    expect(concluded).toMatchObject({
      day: 11,
      nextRaidType: "council",
      pendingPunitiveRaid: true,
      selectedInvasionKey: "council",
    });
    expect(concluded.pendingCouncilRaid?.attackers).toHaveLength(1);
  });

  it("accepts Nihaza's standard quest and opens a valid Ash Breach", () => {
    const accepted = acceptedNihazaTrial("DL-NIHAZA-PLACEMENT");

    expect(accepted.councilQuest).toMatchObject({
      active: true,
      sponsorKey: "nihaza",
      questType: "ash-breach-trial",
      difficulty: "standard",
      goal: 2,
    });
    expect(accepted.ashTrial).toMatchObject({ active: true, requiredRaids: 2, raidsCompleted: 0 });
    expect(accepted.ashTrial.breaches).toHaveLength(1);
  });

  it("rejects Nihaza's quest when the dungeon has no valid breach anchor", () => {
    const attended = attendCouncilTransition(councilState("DL-NIHAZA-NO-ANCHOR"));
    const grid = structuredClone(attended.grid);
    grid[0][1] = {
      ...grid[0][1],
      room: null,
      roomType: null,
      monsters: [],
    };
    const rejected = acceptCouncilQuestTransition({ ...attended, grid }, "nihaza", "standard");

    expect(rejected.councilQuest).toBeNull();
    expect(rejected.ashTrial.active).toBe(false);
    expect(rejected.log.some((line) => line.includes("trial is unavailable"))).toBe(true);
  });

  it("completes Nihaza's trial on the required connected raid and collapses the breach", () => {
    const accepted = acceptedNihazaTrial("DL-NIHAZA-SUCCESS");
    const buildDay = concludeCouncilTransition(accepted);
    const beforeCapUntilDay = buildDay.ashMonsterRoomCapUntilDay;
    const completed = resolveCombatTurn(
      completingRaid({
        ...buildDay,
        ashTrial: { ...buildDay.ashTrial, raidsCompleted: 1 },
      })
    );

    expect(completed.ashTrial.active).toBe(false);
    expect(completed.ashTrial.breaches).toEqual([]);
    expect(completed.councilQuest).toMatchObject({ active: false, progress: 2 });
    expect(completed.ashMonsterRoomCapUntilDay).toBeGreaterThan(beforeCapUntilDay);
    expect(completed.councilFavor.nihaza).toBeGreaterThan(0);
  });

  it("expires an incomplete Nihaza trial at Council and applies the Core curse", () => {
    const accepted = acceptedNihazaTrial("DL-NIHAZA-FAILURE");
    const buildDay = concludeCouncilTransition(accepted);
    const expiring = {
      ...buildDay,
      day: 19,
      ashTrial: {
        ...buildDay.ashTrial,
        raidsCompleted: 0,
        requiredRaids: 2,
        expiresDay: 20,
      },
    };
    const failed = resolveCombatTurn(completingRaid(expiring));

    expect(failed.day).toBe(20);
    expect(failed.council.active).toBe(true);
    expect(failed.councilQuest).toBeNull();
    expect(failed.ashTrial.active).toBe(false);
    expect(failed.nihazaCurseUntilDay).toBe(30);
    expect(getCoreMaxHp(failed)).toBe(225);
    expect(failed.log.some((line) => line.includes("Nihaza's judgment stands"))).toBe(true);
  });

  it("completes a counter-based Council quest and grants its reward", () => {
    const fresh = createDefaultState({ runSeed: "DL-COUNCIL-QUEST-SUCCESS", rngCursor: 0 });
    const questState = {
      ...fresh,
      day: 11,
      councilQuest: {
        id: "survive-one",
        title: "Survive One Raid",
        sponsorKey: "nihaza",
        sponsorName: "Matriarch Nihaza",
        active: true,
        metricKey: "survivedRaidCount",
        goal: 1,
        progress: 0,
        reward: { type: "essence", amount: 7 },
      },
    };
    const completed = resolveCombatTurn(completingRaid(questState));

    expect(completed.councilQuest).toMatchObject({ active: false, progress: 1 });
    expect(completed.currency.essence).toBe(fresh.currency.essence + 7);
    expect(completed.log.some((line) => line.includes("Council quest completed"))).toBe(true);
  });

  it("expires an incomplete counter-based quest when the next Council convenes", () => {
    const fresh = createDefaultState({ runSeed: "DL-COUNCIL-QUEST-FAILURE", rngCursor: 0 });
    const questState = {
      ...fresh,
      day: 19,
      councilQuest: {
        id: "survive-five",
        title: "Survive Five Raids",
        sponsorKey: "nihaza",
        sponsorName: "Matriarch Nihaza",
        active: true,
        metricKey: "survivedRaidCount",
        goal: 5,
        progress: 0,
        reward: { type: "essence", amount: 50 },
      },
    };
    const expired = resolveCombatTurn(completingRaid(questState));

    expect(expired.day).toBe(20);
    expect(expired.council.active).toBe(true);
    expect(expired.councilQuest).toBeNull();
    expect(expired.councilFavor.nihaza).toBeLessThan(0);
    expect(expired.log.some((line) => line.includes("Council quest expired"))).toBe(true);
  });
});
