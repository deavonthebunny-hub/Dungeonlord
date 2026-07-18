import { describe, expect, it } from "vitest";
import { getRunRandomState, randomFloat, setRunRandomState } from "./random";

describe("seeded run randomness", () => {
  it("replays the same sequence from a seed and cursor", () => {
    setRunRandomState("DL-TEST-SEED", 0);
    const first = [randomFloat(), randomFloat(), randomFloat()];
    setRunRandomState("DL-TEST-SEED", 0);
    expect([randomFloat(), randomFloat(), randomFloat()]).toEqual(first);
  });

  it("preserves cursor position for save migration", () => {
    setRunRandomState("DL-CURSOR", 7);
    randomFloat();
    expect(getRunRandomState()).toEqual({ seed: "DL-CURSOR", cursor: 8 });
  });
});
