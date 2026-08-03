import { getRunRandomState } from "../random";

export const BUILD_VERSION = "0.1.0-alpha.2";
export const CURRENT_SAVE_VERSION = BUILD_VERSION;

// These fields cross the save compatibility boundary. Renaming or removing one
// requires a migration or a defensive fallback in systems/runState.js.
export const COMPATIBILITY_SENSITIVE_SAVE_FIELDS = Object.freeze([
  "grid",
  "runSeed",
  "rngCursor",
  "day",
  "phase",
  "raidActive",
  "coreHp",
  "currency",
  "artifacts",
  "doctrines",
  "council",
  "councilSession",
  "councilQuest",
  "ashTrial",
]);

export function hasMinimumSaveShape(value) {
  return !!value && typeof value === "object" && !Array.isArray(value) && Array.isArray(value.grid);
}

export function parseSaveText(raw) {
  if (!raw || typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(raw);
    return hasMinimumSaveShape(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function isValidSaveText(raw) {
  return parseSaveText(raw) !== null;
}

export function buildSaveSnapshot(state) {
  const rng = getRunRandomState();
  return {
    ...state,
    runSeed: state?.runSeed || rng.seed,
    rngCursor: rng.cursor,
    saveVersion: CURRENT_SAVE_VERSION,
  };
}

export function serializeSave(state) {
  return JSON.stringify(buildSaveSnapshot(state), null, 2);
}
