import { beforeEach, describe, expect, it } from "vitest";
import { BUILD_VERSION, buildDiagnosticBundle, buildSaveSnapshot, isValidSaveText, serializeSave } from "./playtestSupport";
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

  it("creates nonempty local diagnostics with a portable save and current RNG cursor", () => {
    const state = { grid: [[]], day: 31, phase: "build", runSeed: "DL-SAVE-TEST", coreHp: 115, log: ["Run saved."] };
    const bundle = buildDiagnosticBundle(state, { ok: true }, { includeSave: true });
    const parsed = JSON.parse(bundle);
    expect(bundle.length).toBeGreaterThan(100);
    expect(parsed.run).toMatchObject({ seed: "DL-SAVE-TEST", rngCursor: 4, day: 31, coreHp: 115 });
    expect(parsed.save).toMatchObject({ day: 31, rngCursor: 4, saveVersion: BUILD_VERSION });
    expect(isValidSaveText(JSON.stringify(parsed.save))).toBe(true);
    expect(JSON.parse(buildDiagnosticBundle(state, { ok: true }))).not.toHaveProperty("save");
    expect(state).not.toHaveProperty("saveVersion");
  });
});
