import { describe, expect, it } from "vitest";
import { runOpeningBaseline } from "./balanceBaseline";

describe("local opening balance reference", () => {
  it("replays a seed and strategy deterministically with complete opening turn records", () => {
    const first = runOpeningBaseline({ seed: "DL--1F0BD67D", days: 5 });
    expect(runOpeningBaseline({ seed: "DL--1F0BD67D", days: 5 })).toEqual(first);
    expect(first.raids[0].day).toBe(1);
    expect(first.raids[0].turns[0].raidTurn).toBe(1);
    expect(first.raids[0].turns[0].before.rngCursor).toBeGreaterThan(0);
    expect(first.raids.every((raid) => raid.turns.length > 0)).toBe(true);
    expect(first.raids.reduce((sum, raid) => sum + raid.defenderDeaths, 0)).toBe(first.initial.defenders.length - first.final.defenders.length);
    expect(first.raids.reduce((sum, raid) => sum + raid.coreDamage, 0)).toBe(first.initial.coreHp - first.final.coreHp);
  });

  it("records defeat or a bounded unfinished raid without claiming success", () => {
    const limited = runOpeningBaseline({ days: 1, maxTurnsPerRaid: 1 });
    expect(limited.stopReason).toBe("turn-limit");
    expect(limited.raids[0].cleared).toBe(false);
    expect(limited.raids[0].turns).toHaveLength(1);
    expect(() => runOpeningBaseline({ days: 10 })).toThrow(/before Council/);
    expect(() => runOpeningBaseline({ maxTurnsPerRaid: 0 })).toThrow(/positive/);
  });
});
