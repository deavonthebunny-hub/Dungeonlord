import { describe, expect, it } from "vitest";
import { resolveCombatTurn } from "./combat";
import { makeGrid } from "./dungeon";
import { effectiveMonsterMaxHp } from "./monsters";
import { activateDominionPowerTransition, dominionPowerAvailability, startRaidTransition } from "./raidActions";
import { displayedRaidType } from "./raids";
import { createDefaultState } from "./runState";

function activeRaid() {
  const fresh = createDefaultState({ runSeed: "DL-B1-POWERS", rngCursor: 0 });
  const started = startRaidTransition({ ...fresh, phase: "battle", nextRaidType: "normal" });
  const grid = makeGrid();
  grid[0][0].entrance = true;
  grid[0][7].core = true;
  for (let x = 1; x < 7; x += 1) grid[0][x].room = "monster";
  grid[0][6].monsters = [structuredClone(fresh.grid[0][1].monsters[0])];
  const hero = {
    ...started.heroes[0], x: 0, y: 0, hp: 19, def: 0, shd: 0, spd: 1,
    heroPassiveKey: null, passive: "None", statuses: {}, counters: {},
    stats: { ...started.heroes[0].stats, maxHp: 19 },
  };
  return {
    ...started, grid, heroes: [hero], currentParty: [hero], partyQueue: [], raidRemaining: 0,
    dailyEvent: { key: "none", mods: {} }, currency: { ...started.currency, dominion: 4 },
  };
}

describe("B1 tactical spending and display correctness", () => {
  it("charges for one queued Pulse and rejects a duplicate without mutating its source", () => {
    const original = activeRaid();
    const snapshot = structuredClone(original);
    const queued = activateDominionPowerTransition(original, "pulse");
    const duplicate = activateDominionPowerTransition(queued, "pulse");
    expect(original).toEqual(snapshot);
    expect(queued.currency.dominion).toBe(2);
    expect(duplicate.currency.dominion).toBe(2);
    expect(duplicate.dominionEffects.pulsePending).toBe(true);
    expect(duplicate.log[0]).toMatch(/already queued/);
    expect(dominionPowerAvailability(duplicate, "pulse").disabled).toBe(true);

    const resolved = resolveCombatTurn(duplicate);
    expect(resolved.heroes[0].hp).toBe(14);
    expect(resolved.log.filter((line) => line.includes("Dominion Pulse hits"))).toHaveLength(1);
    expect(resolved.dominionEffects.pulsePending).toBe(false);
    expect(dominionPowerAvailability(resolved, "pulse").disabled).toBe(false);
    const nextTurn = resolveCombatTurn(resolved);
    expect(nextTurn.log.filter((line) => line.includes("Dominion Pulse hits"))).toHaveLength(1);
  });

  it.each(["speed", "strength"])("does not charge for a repeated %s buff and permits it after resolution", (kind) => {
    const activated = activateDominionPowerTransition(activeRaid(), kind);
    const duplicate = activateDominionPowerTransition(activated, kind);
    expect(activated.currency.dominion).toBe(3);
    expect(duplicate.currency.dominion).toBe(3);
    expect(duplicate.log[0]).toMatch(/already active/);
    const resolved = resolveCombatTurn(duplicate);
    expect(dominionPowerAvailability(resolved, kind).disabled).toBe(false);
    expect(activateDominionPowerTransition(resolved, kind).currency.dominion).toBe(2);
  });

  it("keeps Shield purchases useful below the cap and refuses spending at or above it", () => {
    const state = activeRaid();
    const fullGain = activateDominionPowerTransition({ ...state, coreShield: 10 }, "shield");
    expect(fullGain).toMatchObject({ coreShield: 20, currency: { dominion: 2 } });
    const partialGain = activateDominionPowerTransition({ ...state, coreShield: 25 }, "shield");
    expect(partialGain).toMatchObject({ coreShield: 30, currency: { dominion: 2 } });
    const capped = activateDominionPowerTransition(partialGain, "shield");
    expect(capped).toMatchObject({ coreShield: 30, currency: { dominion: 2 } });
    expect(capped.log[0]).toMatch(/cap/);
    expect(activateDominionPowerTransition({ ...state, coreShield: 35 }, "shield")).toMatchObject({ coreShield: 35, currency: { dominion: 4 } });
  });

  it("refuses a Pulse with no present target rather than losing it before drip spawn", () => {
    const state = { ...activeRaid(), heroes: [] };
    const rejected = activateDominionPowerTransition(state, "pulse");
    expect(rejected.currency.dominion).toBe(4);
    expect(rejected.dominionEffects.pulsePending).toBe(false);
    expect(rejected.log[0]).toMatch(/No heroes/);
  });

  it.each(["speed", "strength"])("refuses %s when no defending monsters can receive it", (kind) => {
    const state = activeRaid();
    state.grid[0][6].monsters = [];
    const rejected = activateDominionPowerTransition(state, kind);
    expect(rejected.currency.dominion).toBe(4);
    expect(rejected.log[0]).toMatch(/No defending monsters/);
  });

  it.each([
    [{ phase: "build" }, "pulse"],
    [{ raidActive: false, heroes: [] }, "shield"],
    [{ currency: { dominion: 0 } }, "strength"],
    [{}, "unknown"],
    [{}, "toString"],
  ])("never spends on an unavailable power", (overrides, kind) => {
    const state = { ...activeRaid(), ...overrides };
    const result = activateDominionPowerTransition(state, kind);
    expect(result.currency).toEqual(state.currency);
    expect(result.dominionEffects).toEqual(state.dominionEffects);
    expect(dominionPowerAvailability(state, kind).disabled).toBe(true);
  });

  it("uses the active encounter identity instead of the cleared next-raid field", () => {
    expect(displayedRaidType({ raidActive: true, raidType: "escalation", nextRaidType: null })).toBe("escalation");
    expect(displayedRaidType({ raidActive: true, raidType: "elite", nextRaidType: "normal" })).toBe("elite");
    expect(displayedRaidType({ raidActive: true, currentPartyRaidType: "council" })).toBe("council");
    expect(displayedRaidType({ raidActive: false, raidType: "elite", nextRaidType: "normal" })).toBe("normal");
    expect(displayedRaidType({ raidActive: false, pendingPunitiveRaid: true, nextRaidType: "normal" })).toBe("council");
  });

  it("includes doctrine HP once, preserving permanent and fused base HP without mutation", () => {
    const monster = { hp: 38, stats: { maxHp: 35 }, isFused: true };
    expect(effectiveMonsterMaxHp(monster, { monster: 1 })).toBe(35);
    expect(effectiveMonsterMaxHp(monster, { monster: 2 })).toBe(38);
    expect(effectiveMonsterMaxHp(monster, { monster: 3 })).toBe(38);
    expect(monster.stats.maxHp).toBe(35);
    expect(effectiveMonsterMaxHp({ hp: 10 }, { monster: 2 })).toBe(13);
  });
});
