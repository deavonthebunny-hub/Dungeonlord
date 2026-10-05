import { describe, expect, it } from "vitest";
import { getRunRandomState, setRunRandomState } from "../random";
import { resolveCombatTurn } from "./combat";
import { generateTraderStock, isOpeningRecoveryOffer } from "./markets";
import { buyFromTraderTransition, traderPrice } from "./marketActions";
import { applyMonsterRoomPlacementStatic, buildMonsterStats, generateMonster } from "./monsters";
import { resetRunKeepingLayoutTransition } from "./runActions";
import { createDefaultState, loadRunState } from "./runState";

function finishDay(state, day = 1) {
  return resolveCombatTurn({ ...state, day, phase: "battle", raidActive: true, raidRemaining: 0, raidType: "normal", heroes: [], currentParty: [], partyQueue: [], scoutQueue: [], raidStartCoreHp: state.coreHp });
}
function emptyRoster(state) {
  return { ...state, invMonsters: [], grid: state.grid.map(row => row.map(tile => ({ ...tile, monsters: [] }))) };
}

describe("authored new-run defense and limited opening recovery", () => {
  it("starts with ordinary two-star Ogre/Boar stats and one Training Den bonus", () => {
    const state = createDefaultState({ runSeed: "DL-B2-STARTERS" });
    const monsters = state.grid[0][1].monsters;
    expect(monsters.map(m => [m.key, m.stars])).toEqual([["ogre", 2], ["boar", 2]]);
    expect(state.currency).toEqual({ essence: 10, soulshards: 30, evolution: 0, dominion: 0, darkcrystals: 0 });
    for (const monster of monsters) {
      const base = buildMonsterStats(monster.key, 2);
      expect(monster.stats).toEqual({ ...base, atk: base.atk + 1 });
      expect(monster.hp).toBe(base.maxHp);
      expect(monster.evoPoints).toBe(0);
      expect(monster.passiveKeys).toHaveLength(1);
      expect(applyMonsterRoomPlacementStatic(monster, "training-den", 1)).toEqual(monster);
      expect(monster.isUnique || monster.isFused).toBeFalsy();
    }
  });

  it("gives layout-preserving resets the same pair in inventory without changing rooms", () => {
    const prior = createDefaultState({ runSeed: "DL-B2-RESET" });
    const reset = resetRunKeepingLayoutTransition(prior);
    expect(reset.invMonsters.map(m => [m.key, m.stars])).toEqual([["ogre", 2], ["boar", 2]]);
    expect(reset.grid[0][1].roomType).toBe("training-den");
    expect(reset.grid.flat().every(tile => tile.monsters.length === 0)).toBe(true);
    expect(reset.invMonsters.every(m => Object.keys(m.permanentRoomBonuses).length === 0)).toBe(true);
  });

  it("preserves saved legacy monsters, wounds, resources, and an empty room", () => {
    const fresh = createDefaultState({ runSeed: "DL-B2-OLD-SAVE" });
    const legacy = generateMonster("imp", 0, 1, 1, { stars: 1 });
    const grid = structuredClone(fresh.grid);
    grid[0][1].monsters = [{ ...legacy, hp: 2 }];
    const cursor = getRunRandomState().cursor;
    const save = { ...fresh, grid, phase: "battle", raidActive: true, rngCursor: cursor, coreHp: 137, currency: { ...fresh.currency, soulshards: 11 } };
    const loaded = loadRunState(JSON.stringify(save));
    expect(loaded.grid[0][1].monsters.map(m => [m.key, m.hp])).toEqual([["imp", 2]]);
    expect(loaded.coreHp).toBe(137);
    expect(loaded.currency.soulshards).toBe(11);
    expect(getRunRandomState().cursor).toBe(cursor);
    save.grid[0][1].monsters = [];
    expect(loadRunState(JSON.stringify(save)).grid[0][1].monsters).toEqual([]);
  });

  it("offers one ordinary Ogre for 20 Shards only on reaching Day 2 with no owned monsters", () => {
    const fresh = createDefaultState({ runSeed: "DL-B2-RECOVERY" });
    const recovered = finishDay({ ...emptyRoster(fresh), coreHp: 185 });
    expect(recovered.day).toBe(2);
    expect(recovered.coreHp).toBe(185);
    expect(recovered.currency.soulshards).toBe(fresh.currency.soulshards);
    expect(recovered.traderStock).toHaveLength(3);
    const offers = recovered.traderStock.filter(m => isOpeningRecoveryOffer(m, 2));
    expect(offers).toHaveLength(1);
    expect(offers[0]).toMatchObject({ key: "ogre", stars: 2, hp: 32 });
    expect(traderPrice(offers[0], 2)).toBe(20);
    expect(traderPrice(offers[0], 3)).toBe(45);
    expect(traderPrice({ ...offers[0], key: "imp" }, 2)).not.toBe(20);
    expect(finishDay(fresh).traderStock.some(m => m.openingRecoveryOffer)).toBe(false);
    expect(finishDay({ ...emptyRoster(fresh), invMonsters: [fresh.grid[0][1].monsters[0]] }).traderStock.some(m => m.openingRecoveryOffer)).toBe(false);
    expect(finishDay(emptyRoster(fresh), 2).traderStock.some(m => m.openingRecoveryOffer)).toBe(false);
  });

  it("round-trips the unbought offer, charges once, removes its price marker, and rejects unavailable purchases", () => {
    const recovered = finishDay(emptyRoster(createDefaultState({ runSeed: "DL-B2-OFFER-SAVE" })));
    const loaded = loadRunState(JSON.stringify({ ...recovered, rngCursor: getRunRandomState().cursor }));
    expect(traderPrice(loaded.traderStock[0], 2)).toBe(20);
    const short = buyFromTraderTransition({ ...loaded, currency: { ...loaded.currency, soulshards: 19 } }, 0);
    expect(short.traderStock).toEqual(loaded.traderStock);
    expect(short.invMonsters).toHaveLength(0);
    const battle = buyFromTraderTransition({ ...loaded, phase: "battle" }, 0);
    expect(battle.currency).toEqual(loaded.currency);
    const bought = buyFromTraderTransition(loaded, 0);
    expect(bought.currency.soulshards).toBe(loaded.currency.soulshards - 20);
    expect(bought.invMonsters).toHaveLength(1);
    expect(bought.traderStock).toHaveLength(2);
    expect(isOpeningRecoveryOffer(bought.invMonsters[0], 2)).toBe(false);
    expect(traderPrice(bought.invMonsters[0], 2)).toBe(43);
    expect(bought.traderStock.some(m => isOpeningRecoveryOffer(m, 2))).toBe(false);
  });

  it("does not alter ordinary seeded trader stock outside the explicit recovery case", () => {
    setRunRandomState("DL-B2-MARKET-CONTROL", 0);
    const ordinary = generateTraderStock(20, 3);
    const cursor = getRunRandomState().cursor;
    setRunRandomState("DL-B2-MARKET-CONTROL", 0);
    expect(generateTraderStock(20, 3, { openingRecovery: true })).toEqual(ordinary);
    expect(getRunRandomState().cursor).toBe(cursor);
  });
});
