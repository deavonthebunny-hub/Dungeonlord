import { describe, expect, it } from "vitest";
import { OPENING_SEEDS } from "./openingPolicy";
import { runMixedOpening, runOpeningSuite } from "./openingBalance";

describe("B2 fixed-seed opening pilot", () => {
  it("replays the documented mixed policy exactly and bounds combat", () => {
    const report = runMixedOpening({ seed: OPENING_SEEDS[0] });
    expect(runMixedOpening({ seed: OPENING_SEEDS[0] })).toEqual(report);
    expect(report.raids).toHaveLength(9);
    expect(report.raids.find(raid => raid.day === 5).raidType).toBe("escalation");
    expect(report.raids.every(raid => raid.observations.length === raid.turns)).toBe(true);
    expect(report.decisions.flatMap(day => day.actions).every(action => action.spend.dominion === 0)).toBe(true);
    expect(() => runMixedOpening({ maxTurnsPerRaid: 1 })).toThrow(/exceeded 1 turns/);
    expect(() => runMixedOpening({ maxTurnsPerRaid: 0 })).toThrow(/positive integer/);
  });

  it("meets the provisional 8-of-10 targets without guaranteeing casualty-free runs", () => {
    expect(new Set(OPENING_SEEDS).size).toBe(10);
    const { summary, reports } = runOpeningSuite();
    expect(summary.dayOneRetained).toBeGreaterThanOrEqual(8);
    expect(summary.reachedCouncilWithoutRepeatedWipes).toBeGreaterThanOrEqual(8);
    expect(reports.some(report => report.raids.some(raid => raid.deaths > 0))).toBe(true);
    expect(reports.some(report => report.raids.some(raid => raid.coreDamage > 0))).toBe(true);
    expect(reports.every(report => report.raids.find(raid => raid.day === 3).after.coreHp > 0)).toBe(true);
    // Core attrition is persistent: no baseline policy spends on Core Doctrine.
    for (const report of reports) {
      expect(report.raids.reduce((sum, raid) => sum + raid.coreDamage, 0)).toBe(report.initial.coreHp - report.final.coreHp);
    }
  });

  it("recovers affordable Day 2 defense after the deliberate Day 1 casualty stress", () => {
    const { reports, summary } = runOpeningSuite({ poorFirstRaid: true });
    expect(summary.dayOneWipes).toBeGreaterThan(0);
    expect(summary.dayOneWipesRecoveredDayTwo).toBe(summary.dayOneWipes);
    for (const report of reports.filter(r => r.raids[0].completeWipe)) {
      const dayTwo = report.raids[1];
      expect(dayTwo.before.defenders.some(m => m.key === "ogre" && m.stars === 2)).toBe(true);
      expect(dayTwo.before.currency.soulshards).toBeGreaterThanOrEqual(10);
      expect(report.decisions[1].actions.find(action => action.action.startsWith("Buy ogre")).spend.soulshards).toBe(20);
      // Essence remains a development choice, not a compulsory revival fee.
      expect(dayTwo.before.dungeonLevel > 1 || dayTwo.before.doctrines.trap > 0).toBe(true);
    }
  });
});
