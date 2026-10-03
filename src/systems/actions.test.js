import { describe, expect, it } from "vitest";
import { resolveCombatTurn } from "./combat";
import { attendCouncilTransition } from "./councilActions";
import { buildTrapRoomTransition, setSelectedTransition } from "./dungeonActions";
import { buyArtifactTransition } from "./marketActions";
import {
  beginBattleTransition,
  selectInvasionChoiceTransition,
  startRaidTransition,
} from "./raidActions";
import { resetRunKeepingLayoutTransition } from "./runActions";
import { createDefaultState } from "./runState";

describe("subsystem state transitions", () => {
  it("builds through the dungeon subsystem without mutating the source state", () => {
    const fresh = createDefaultState({ runSeed: "DL-DUNGEON-ACTION", rngCursor: 0 });
    const selected = setSelectedTransition(fresh, 3, 0);
    const built = buildTrapRoomTransition(selected);

    expect(fresh.grid[0][3].room).toBeNull();
    expect(built.grid[0][3].room).toBe("trap");
    expect(built.grid[0][3].trap).toBe(true);
    expect(built.grid[0][3].trapChargesRemaining).toBeGreaterThan(0);
  });

  it("performs an artifact purchase atomically through the market subsystem", () => {
    const fresh = createDefaultState({ runSeed: "DL-MARKET-ACTION", rngCursor: 0 });
    const offer = fresh.shadyStock[0];
    const funded = {
      ...fresh,
      currency: {
        ...fresh.currency,
        [offer.cost.currency]: 999,
      },
    };
    const bought = buyArtifactTransition(funded, 0);

    expect(bought.artifacts.some((artifact) => artifact.key === offer.key)).toBe(true);
    expect(bought.currency[offer.cost.currency]).toBe(999 - offer.cost.amount);
    expect(bought.shadyStock).toHaveLength(fresh.shadyStock.length - 1);
  });

  it("stages and resolves the opening raid through raid and combat subsystems", () => {
    let state = createDefaultState({ runSeed: "DL-RAID-ACTION", rngCursor: 0 });
    state = selectInvasionChoiceTransition(state, state.invasionChoices[0].key);
    state = beginBattleTransition(state);
    state = startRaidTransition(state);

    expect(state.phase).toBe("battle");
    expect(state.raidActive).toBe(true);

    for (let turn = 0; turn < 24 && state.raidActive; turn += 1) {
      state = resolveCombatTurn(state);
    }

    expect(state.raidActive).toBe(false);
    expect(state.phase).toBe("build");
    expect(state.day).toBe(2);
  });

  it("updates Council attendance without React state setters", () => {
    const fresh = createDefaultState({ runSeed: "DL-COUNCIL-ACTION", rngCursor: 0 });
    const pending = {
      ...fresh,
      day: 10,
      council: {
        ...fresh.council,
        active: true,
        day: 10,
        roster: [],
      },
      councilSession: {
        day: 10,
        status: "pending",
        sponsors: [],
      },
    };
    const attended = attendCouncilTransition(pending);

    expect(attended.council.active).toBe(false);
    expect(attended.councilSession.status).toBe("attended");
    expect(attended.invasionChoices).toEqual([]);
  });

  it("resets run progress while preserving the dungeon layout", () => {
    let state = createDefaultState({ runSeed: "DL-RESET-ACTION", rngCursor: 0 });
    state = buildTrapRoomTransition(setSelectedTransition(state, 3, 0));
    const progressed = {
      ...state,
      day: 9,
      phase: "battle",
      raidActive: true,
      heroes: [{ id: 99, hp: 1 }],
      doctrines: { trap: 2, monster: 1, utility: 3, core: 4 },
      currency: {
        ...state.currency,
        soulshards: 999,
        essence: 888,
        evolution: 7,
        dominion: 6,
        darkcrystals: 5,
      },
      councilSession: { day: 9, status: "attended" },
      onboardingDismissed: true,
    };
    const layout = progressed.grid.map((row) =>
      row.map(({ entrance, core, room, roomType }) => ({ entrance, core, room, roomType }))
    );

    const reset = resetRunKeepingLayoutTransition(progressed);

    expect(progressed.day).toBe(9);
    expect(reset.grid.map((row) =>
      row.map(({ entrance, core, room, roomType }) => ({ entrance, core, room, roomType }))
    )).toEqual(layout);
    expect(reset.grid.flat().every((tile) => tile.monsters.length === 0)).toBe(true);
    expect(reset).toMatchObject({
      day: 1,
      phase: "build",
      raidActive: false,
      heroes: [],
      doctrines: { trap: 0, monster: 0, utility: 0, core: 0 },
      currency: {
        soulshards: 30,
        essence: 10,
        evolution: 0,
        dominion: 0,
        darkcrystals: 0,
      },
      councilSession: null,
      onboardingDismissed: false,
    });
    expect(reset.invMonsters).toHaveLength(2);
    expect(reset.invasionChoices.length).toBeGreaterThan(0);
    expect(reset.runSeed).not.toBe(progressed.runSeed);
    expect(reset.log[0]).toBe("Run reset (layout kept). Choose your first invasion.");
  });
});
