import { beforeEach, describe, expect, it } from "vitest";
import { BUILD_VERSION, buildSaveSnapshot, isValidSaveText, serializeSave } from "./playtestSupport";
import { setRunRandomState } from "./random";

describe("playtest save support", () => {
  beforeEach(() => setRunRandomState("DL-SAVE-TEST", 4));

  it("adds versioned seed metadata without mutating the source", () => {
    const state = { grid: [[], []], day: 3, runSeed: "DL-SAVE-TEST" };
    const snapshot = buildSaveSnapshot(state);
    expect(snapshot.rngCursor).toBe(4);
    expect(BUILD_VERSION).toBe("0.1.0-alpha.2");
    expect(snapshot.saveVersion).toBe(BUILD_VERSION);
    expect(state).not.toHaveProperty("saveVersion");
  });

  it("accepts exported saves and rejects unrelated JSON", () => {
    expect(isValidSaveText(serializeSave({ grid: [[]], day: 1, runSeed: "DL-SAVE-TEST" }))).toBe(true);
    expect(isValidSaveText('{"hello":"world"}')).toBe(false);
    expect(isValidSaveText("not json")).toBe(false);
  });
});
