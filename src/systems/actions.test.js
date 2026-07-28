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
});
