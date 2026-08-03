import { describe, expect, it } from "vitest";
import { getRunRandomState } from "../random";
import { COUNCIL_MEMBER_MAP, buildCouncilSession } from "./council";
import { createDefaultState, loadRunState } from "./runState";

describe("run state", () => {
  it("creates the same opening state from the same seed and cursor", () => {
    const first = createDefaultState({ runSeed: "DL-STATE-TEST", rngCursor: 0 });
    const firstCursor = getRunRandomState().cursor;
    const second = createDefaultState({ runSeed: "DL-STATE-TEST", rngCursor: 0 });

    expect(second).toEqual(first);
    expect(getRunRandomState()).toEqual({ seed: "DL-STATE-TEST", cursor: firstCursor });
    expect(first.grid).toHaveLength(8);
    expect(first.grid.every((row) => row.length === 8)).toBe(true);
    expect(first.grid[0][0].entrance).toBe(true);
    expect(first.grid[0][1].room).toBe("monster");
    expect(first.grid[0][1].monsters).toHaveLength(2);
    expect(first.grid[0][2].core).toBe(true);
  });

  it("softly hydrates an older partial save", () => {
    const fresh = createDefaultState({ runSeed: "DL-LEGACY", rngCursor: 0 });
    const loaded = loadRunState(
      JSON.stringify({
        grid: fresh.grid,
        day: 3,
        runSeed: "DL-LEGACY",
        rngCursor: 12,
        currency: { essence: 42 },
      })
    );

    expect(loaded.day).toBe(3);
    expect(loaded.currency).toMatchObject({
      essence: 42,
      soulshards: 30,
      evolution: 0,
      dominion: 0,
      darkcrystals: 0,
    });
    expect(loaded.doctrines).toEqual({ trap: 0, monster: 0, utility: 0, core: 0 });
    expect(loaded.ashTrial).toMatchObject({ active: false, breaches: [] });
    expect(loaded.runSeed).toBe("DL-LEGACY");
    expect(getRunRandomState()).toEqual({ seed: "DL-LEGACY", cursor: 15 });
  });

  it("preserves an active battle instead of replanning the day", () => {
    const fresh = createDefaultState({ runSeed: "DL-BATTLE", rngCursor: 0 });
    const loaded = loadRunState(
      JSON.stringify({
        ...fresh,
        phase: "battle",
        raidActive: true,
        raidType: "elite",
        turnsSurvived: 7,
        rngCursor: getRunRandomState().cursor,
      })
    );

    expect(loaded.phase).toBe("battle");
    expect(loaded.raidActive).toBe(true);
    expect(loaded.raidType).toBe("elite");
    expect(loaded.turnsSurvived).toBe(7);
  });

  it("restores an active raid at the persisted RNG cursor", () => {
    const fresh = createDefaultState({ runSeed: "DL-ACTIVE-RAID-MIGRATION", rngCursor: 0 });
    const loaded = loadRunState(
      JSON.stringify({
        ...fresh,
        phase: "battle",
        raidActive: true,
        raidType: "normal",
        rngCursor: 37,
      })
    );

    expect(loaded.phase).toBe("battle");
    expect(loaded.raidActive).toBe(true);
    expect(loaded.raidType).toBe("normal");
    expect(getRunRandomState()).toEqual({ seed: "DL-ACTIVE-RAID-MIGRATION", cursor: 37 });
  });

  it("restores an attended Council session with rebuilt sponsor access", () => {
    const fresh = createDefaultState({ runSeed: "DL-COUNCIL-MIGRATION", rngCursor: 0 });
    const roster = [COUNCIL_MEMBER_MAP.nihaza, COUNCIL_MEMBER_MAP.malachar];
    const councilFavor = { nihaza: 2, malachar: -1 };
    const councilSession = {
      ...buildCouncilSession(roster, 10, councilFavor),
      status: "attended",
      courtedSponsorKey: "nihaza",
    };
    const loaded = loadRunState(
      JSON.stringify({
        ...fresh,
        day: 10,
        council: {
          ...fresh.council,
          active: false,
          day: 10,
          roster,
          lastRoster: roster,
        },
        councilFavor,
        councilSession,
      })
    );

    expect(loaded.councilSession).toMatchObject({
      day: 10,
      status: "attended",
      courtedSponsorKey: "nihaza",
    });
    expect(loaded.councilSession.sponsors.map((sponsor) => sponsor.key)).toEqual(["nihaza", "malachar"]);
    expect(loaded.councilSession.sponsors[0].quests.standard.questType).toBe("ash-breach-trial");
  });

  it("clamps malformed optional fields and expires invalid Ash Trial data", () => {
    const fresh = createDefaultState({ runSeed: "DL-MALFORMED-OPTIONALS", rngCursor: 0 });
    const loaded = loadRunState(
      JSON.stringify({
        ...fresh,
        day: 10,
        phase: "battle",
        raidActive: true,
        grid: [[{ entrance: true }]],
        selected: { x: 99, y: -9 },
        currency: { essence: 7 },
        doctrines: { trap: -2, monster: -1, utility: -4, core: -3 },
        artifacts: "not-an-array",
        coreHp: 9999,
        council: { active: true, roster: "not-an-array", declinedStreak: "bad" },
        ashTrial: {
          active: true,
          breaches: [{ x: 99, y: -5 }],
          requiredRaids: 2,
          expiresDay: 10,
        },
        nextRaidBoons: "not-an-array",
        activeRaidBoons: [null, { type: "monster-atk", amount: 1 }],
        invMonsters: [null, { key: "unknown-monster" }],
      })
    );

    expect(loaded.grid).toHaveLength(8);
    expect(loaded.grid.every((row) => row.length === 8)).toBe(true);
    expect(loaded.selected).toEqual({ x: 7, y: 0 });
    expect(loaded.currency).toMatchObject({ essence: 7, soulshards: 30 });
    expect(loaded.doctrines).toEqual({ trap: 0, monster: 0, utility: 0, core: 0 });
    expect(loaded.artifacts).toEqual([]);
    expect(loaded.coreHp).toBe(250);
    expect(loaded.council.roster).toEqual([]);
    expect(loaded.council.declinedStreak).toBe(0);
    expect(loaded.ashTrial).toMatchObject({ active: false, breaches: [], requiredRaids: 0 });
    expect(loaded.nextRaidBoons).toEqual([]);
    expect(loaded.activeRaidBoons).toEqual([{ type: "monster-atk", amount: 1 }]);
    expect(loaded.invMonsters).toEqual([]);
  });

  it("rejects malformed save text without throwing", () => {
    expect(loadRunState("not-json")).toBeNull();
    expect(loadRunState("")).toBeNull();
  });
});
