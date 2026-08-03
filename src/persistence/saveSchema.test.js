import { beforeEach, describe, expect, it } from "vitest";
import { setRunRandomState } from "../random";
import {
  BUILD_VERSION,
  COMPATIBILITY_SENSITIVE_SAVE_FIELDS,
  CURRENT_SAVE_VERSION,
  buildSaveSnapshot,
  hasMinimumSaveShape,
  isValidSaveText,
  parseSaveText,
  serializeSave,
} from "./saveSchema";

describe("save schema", () => {
  beforeEach(() => setRunRandomState("DL-SCHEMA-TEST", 9));

  it("declares the current version and compatibility-sensitive fields", () => {
    expect(CURRENT_SAVE_VERSION).toBe(BUILD_VERSION);
    expect(COMPATIBILITY_SENSITIVE_SAVE_FIELDS).toEqual(
      expect.arrayContaining(["grid", "runSeed", "rngCursor", "councilSession", "ashTrial"])
    );
    expect(Object.isFrozen(COMPATIBILITY_SENSITIVE_SAVE_FIELDS)).toBe(true);
  });

  it("validates only the minimum compatible save shape", () => {
    expect(hasMinimumSaveShape({ grid: [[]] })).toBe(true);
    expect(hasMinimumSaveShape({ grid: "invalid" })).toBe(false);
    expect(isValidSaveText('{"grid":[[]]}')).toBe(true);
    expect(isValidSaveText('{"hello":"world"}')).toBe(false);
    expect(parseSaveText("not-json")).toBeNull();
  });

  it("serializes versioned RNG metadata without mutating the run state", () => {
    const state = { grid: [[]], day: 4, runSeed: "DL-SCHEMA-TEST" };
    const snapshot = buildSaveSnapshot(state);
    const serialized = JSON.parse(serializeSave(state));

    expect(snapshot).toMatchObject({
      saveVersion: CURRENT_SAVE_VERSION,
      runSeed: "DL-SCHEMA-TEST",
      rngCursor: 9,
    });
    expect(serialized).toEqual(snapshot);
    expect(state).not.toHaveProperty("saveVersion");
    expect(state).not.toHaveProperty("rngCursor");
  });
});
