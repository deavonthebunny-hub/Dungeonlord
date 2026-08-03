import { describe, expect, it } from "vitest";
import { resolveCombatTurn } from "./combat";
import { makeGrid, resetArmedTrapsForRaid, roomLinkInfoAt } from "./dungeon";
import { startRaidTransition } from "./raidActions";
import { createDefaultState } from "./runState";

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

describe("raid and Core lifecycle", () => {
  it("resets armed traps at raid start with doctrine, artifact, Ash, and linked-room bonuses", () => {
    const fresh = createDefaultState({ runSeed: "DL-TRAP-RESET", rngCursor: 0 });
    const grid = structuredClone(fresh.grid);
    grid[3][3] = {
      ...grid[3][3],
      room: "trap",
      roomType: "trap",
      trap: true,
      trapType: "warding-sigil",
      trapStar: 1,
      trapStars: 1,
      trapChargesRemaining: 0,
      trapCooldownRemaining: 4,
    };
    grid[3][2] = {
      ...grid[3][2],
      room: "monster",
      roomType: "bulwark-hall",
      monsters: [],
    };
    grid[2][3] = {
      ...grid[2][3],
      room: "utility",
      roomType: "aegis-lantern",
    };
    grid[2][4] = {
      ...grid[2][4],
      room: "utility",
      roomType: "aegis-lantern",
    };
    const staged = {
      ...fresh,
      grid,
      phase: "battle",
      nextRaidType: "normal",
      doctrines: { ...fresh.doctrines, trap: 2 },
      artifacts: [{ key: "clockwork-magazine" }, { key: "lantern-chain" }, { key: "breach-chains" }],
      ashTrial: {
        active: true,
        difficulty: "standard",
        breaches: [{ x: 3, y: 0, openedDay: 1 }],
        raidsCompleted: 0,
        requiredRaids: 2,
        expiresDay: 10,
      },
    };

    const started = startRaidTransition(staged);

    expect(roomLinkInfoAt(grid, 3, 3)).toMatchObject({ tag: "Ward", linked: true });
    expect(staged.grid[3][3].trapChargesRemaining).toBe(0);
    expect(started.raidActive).toBe(true);
    expect(started.grid[3][3].trapChargesRemaining).toBe(6);
    expect(started.grid[3][3].trapCooldownRemaining).toBe(0);
  });

  it("keeps unarmed and broken traps empty during reset", () => {
    const grid = makeGrid();
    grid[1][1] = {
      ...grid[1][1],
      room: "trap",
      trap: false,
      trapType: "spike-pit",
      trapChargesRemaining: 9,
      trapCooldownRemaining: 3,
    };
    grid[1][2] = {
      ...grid[1][2],
      room: "trap",
      trap: true,
      trapType: "shatter-floor",
      trapBroken: true,
      trapChargesRemaining: 9,
      trapCooldownRemaining: 3,
    };

    resetArmedTrapsForRaid(grid, { doctrines: {}, artifacts: [], day: 1 });

    expect(grid[1][1]).toMatchObject({ trapChargesRemaining: 0, trapCooldownRemaining: 0 });
    expect(grid[1][2]).toMatchObject({ trapChargesRemaining: 0, trapCooldownRemaining: 0 });
  });

  it("finishes an exhausted raid, reports it, and advances to the next build day", () => {
    const fresh = createDefaultState({ runSeed: "DL-RAID-COMPLETE", rngCursor: 0 });
    const completed = resolveCombatTurn(completingRaid(fresh));

    expect(completed.raidActive).toBe(false);
    expect(completed.phase).toBe("build");
    expect(completed.day).toBe(2);
    expect(completed.lastRaidReport).toMatchObject({ raidType: "normal", coreDamage: 0 });
    expect(completed.councilQuestCounters.survivedRaidCount).toBe(1);
    expect(completed.councilQuestCounters.zeroCoreDamageRaidCount).toBe(1);
  });

  it("stops the raid immediately when a hero destroys the Core", () => {
    const fresh = createDefaultState({ runSeed: "DL-CORE-DEFEAT", rngCursor: 0 });
    const started = startRaidTransition({
      ...fresh,
      phase: "battle",
      nextRaidType: "normal",
    });
    const coreBreaker = {
      ...started.heroes[0],
      x: 2,
      y: 0,
      atk: 999,
      hp: 999,
      maxHp: 999,
      statuses: {},
    };
    const defeated = resolveCombatTurn({
      ...started,
      coreHp: 1,
      coreShield: 0,
      heroes: [coreBreaker],
      partyQueue: [],
      raidRemaining: 0,
    });

    expect(defeated.coreHp).toBeLessThanOrEqual(0);
    expect(defeated.raidActive).toBe(false);
    expect(defeated.day).toBe(1);
    expect(defeated.phase).toBe("battle");
    expect(defeated.log.some((line) => line.includes("CORE DESTROYED"))).toBe(true);
  });

  it("creates a clean new run after a defeated state", () => {
    const defeated = {
      ...createDefaultState({ runSeed: "DL-DEFEATED-RUN", rngCursor: 0 }),
      coreHp: 0,
      phase: "battle",
      raidActive: false,
      day: 27,
    };
    const reset = createDefaultState({ runSeed: "DL-RESET-RUN", rngCursor: 0 });

    expect(defeated.coreHp).toBe(0);
    expect(reset).toMatchObject({ coreHp: 250, phase: "build", raidActive: false, day: 1 });
    expect(reset.runSeed).toBe("DL-RESET-RUN");
    expect(reset.log).toEqual(["Day 1 begins. Choose your first invasion."]);
  });
});
