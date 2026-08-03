import { describe, expect, it } from "vitest";
import { clearTileTransition } from "./dungeonActions";
import { fuseMonstersTransition } from "./marketActions";
import {
  placeInventoryMonsterInSelectedRoomTransition,
  returnAllMonstersFromSelectedRoomTransition,
  returnMonsterFromSelectedRoomTransition,
} from "./monsterActions";
import { discountedFusionCost } from "./monsters";
import { createDefaultState } from "./runState";

function inventoryState(seed) {
  const fresh = createDefaultState({ runSeed: seed, rngCursor: 0 });
  const grid = structuredClone(fresh.grid);
  const invMonsters = grid[0][1].monsters.map((monster) => structuredClone(monster));
  grid[0][1].monsters = [];
  return {
    ...fresh,
    grid,
    selected: { x: 1, y: 0 },
    invMonsters,
  };
}

describe("monster staffing, withdrawal, and fusion", () => {
  it("staffs a selected monster room without mutating the source state", () => {
    const source = inventoryState("DL-STAFF-SUCCESS");
    const targetName = source.invMonsters[0].name;
    const staffed = placeInventoryMonsterInSelectedRoomTransition(source, 0);

    expect(source.grid[0][1].monsters).toEqual([]);
    expect(source.invMonsters).toHaveLength(2);
    expect(staffed.invMonsters).toHaveLength(1);
    expect(staffed.grid[0][1].monsters).toHaveLength(1);
    expect(staffed.grid[0][1].monsters[0].name).toBe(targetName);
  });

  it("blocks staffing outside the build phase", () => {
    const source = { ...inventoryState("DL-STAFF-BLOCKED"), phase: "battle" };
    const blocked = placeInventoryMonsterInSelectedRoomTransition(source, 0);

    expect(blocked.invMonsters).toHaveLength(2);
    expect(blocked.grid[0][1].monsters).toEqual([]);
    expect(blocked.log.some((line) => line.includes("only staff rooms during the build phase"))).toBe(true);
  });

  it("withdraws an injured monster and applies Stable Hooks only when owned", () => {
    const source = inventoryState("DL-WITHDRAW-HEAL");
    const staffed = placeInventoryMonsterInSelectedRoomTransition(source, 0);
    const injuredGrid = structuredClone(staffed.grid);
    injuredGrid[0][1].monsters[0].hp = 1;
    const injured = { ...staffed, grid: injuredGrid };

    const ordinary = returnMonsterFromSelectedRoomTransition(injured, 0);
    const healed = returnMonsterFromSelectedRoomTransition(
      { ...injured, artifacts: [{ key: "stable-hooks" }] },
      0
    );

    expect(ordinary.invMonsters.at(-1).hp).toBe(1);
    expect(healed.invMonsters.at(-1).hp).toBe(healed.invMonsters.at(-1).stats.maxHp);
    expect(healed.grid[0][1].monsters).toEqual([]);
  });

  it("returns all room staff to inventory before clearing the room", () => {
    const source = inventoryState("DL-RETURN-ALL");
    const first = placeInventoryMonsterInSelectedRoomTransition(source, 0);
    const second = placeInventoryMonsterInSelectedRoomTransition(first, 0);
    const returned = returnAllMonstersFromSelectedRoomTransition(second);
    const cleared = clearTileTransition(second);

    expect(second.grid[0][1].monsters).toHaveLength(2);
    expect(returned.grid[0][1].monsters).toEqual([]);
    expect(returned.invMonsters).toHaveLength(2);
    expect(cleared.grid[0][1]).toMatchObject({ room: null, roomType: null, monsters: [] });
    expect(cleared.invMonsters).toHaveLength(2);
  });

  it("fuses two inventory monsters and applies the Crucible Tongs discount", () => {
    const source = inventoryState("DL-FUSION-SUCCESS");
    const artifacts = [{ key: "crucible-tongs" }];
    const cost = discountedFusionCost(source.invMonsters[0], source.invMonsters[1], {
      fusionCostReduction: 2,
    });
    const funded = {
      ...source,
      artifacts,
      fleshMarketUntilDay: 10,
      currency: { ...source.currency, darkcrystals: 100 },
    };
    const fused = fuseMonstersTransition(funded, 0, 1);

    expect(funded.invMonsters).toHaveLength(2);
    expect(fused.invMonsters).toHaveLength(1);
    expect(fused.invMonsters[0]).toMatchObject({ isFused: true, key: "abomination" });
    expect(fused.invMonsters[0].fusionParents).toHaveLength(2);
    expect(fused.currency.darkcrystals).toBe(100 - cost);
  });

  it("rejects fusion when funds are insufficient", () => {
    const source = {
      ...inventoryState("DL-FUSION-NO-FUNDS"),
      fleshMarketUntilDay: 10,
      currency: {
        ...inventoryState("DL-FUSION-NO-FUNDS-CURRENCY").currency,
        darkcrystals: 0,
      },
    };
    const blocked = fuseMonstersTransition(source, 0, 1);

    expect(blocked.invMonsters).toHaveLength(2);
    expect(blocked.invMonsters.some((monster) => monster.isFused)).toBe(false);
    expect(blocked.log.some((line) => line.includes("Not enough Darkcrystals"))).toBe(true);
  });

  it("rejects identical or unique fusion stock", () => {
    const source = {
      ...inventoryState("DL-FUSION-INVALID"),
      fleshMarketUntilDay: 10,
      currency: { ...inventoryState("DL-FUSION-INVALID-CURRENCY").currency, darkcrystals: 100 },
    };
    const sameMonster = fuseMonstersTransition(source, 0, 0);
    const uniqueSource = {
      ...source,
      invMonsters: [{ ...source.invMonsters[0], isUnique: true }, source.invMonsters[1]],
    };
    const uniqueMonster = fuseMonstersTransition(uniqueSource, 0, 1);

    expect(sameMonster.invMonsters).toHaveLength(2);
    expect(sameMonster.log.some((line) => line.includes("two different monsters"))).toBe(true);
    expect(uniqueMonster.invMonsters).toHaveLength(2);
    expect(uniqueMonster.log.some((line) => line.includes("Unique monsters cannot"))).toBe(true);
  });
});
