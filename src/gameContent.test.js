import { describe, expect, it } from "vitest";
import {
  FLESH_MARKET_UNIQUE_MONSTERS,
  FUSION_ARCHETYPE_RULES,
  MONSTER_ROOMS,
  STANDARD_ARTIFACTS,
  STANDARD_MONSTERS,
  TRAP_TYPES,
  UTILITY_ROOMS,
  validateGameContent,
} from "./gameContent";

describe("authored game content", () => {
  it("passes content validation", () => {
    expect(validateGameContent()).toEqual([]);
  });

  it("keeps the private-alpha catalog populated", () => {
    expect(STANDARD_MONSTERS.length).toBeGreaterThanOrEqual(62);
    expect(FLESH_MARKET_UNIQUE_MONSTERS.length).toBeGreaterThanOrEqual(6);
    expect(STANDARD_ARTIFACTS.length).toBeGreaterThanOrEqual(33);
    expect(TRAP_TYPES.length + MONSTER_ROOMS.length + UTILITY_ROOMS.length).toBeGreaterThanOrEqual(37);
    expect(Object.keys(FUSION_ARCHETYPE_RULES).length).toBeGreaterThanOrEqual(7);
  });
});
