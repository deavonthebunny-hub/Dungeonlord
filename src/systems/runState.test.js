import { describe, expect, it } from "vitest";
import { getRunRandomState } from "../random";
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

  it("rejects malformed save text without throwing", () => {
    expect(loadRunState("not-json")).toBeNull();
    expect(loadRunState("")).toBeNull();
  });
});
