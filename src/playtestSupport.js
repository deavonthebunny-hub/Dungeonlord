import { getRunRandomState } from "./random";

export const BUILD_VERSION = "0.1.0-alpha.1";
export const SAVE_KEY = "dungeonlord.save.v1";
export const BACKUP_SAVE_KEY = "dungeonlord.save.backup.v1";

export function buildSaveSnapshot(state) {
  const rng = getRunRandomState();
  return {
    ...state,
    runSeed: state?.runSeed || rng.seed,
    rngCursor: rng.cursor,
    saveVersion: BUILD_VERSION,
  };
}

export function serializeSave(state) {
  return JSON.stringify(buildSaveSnapshot(state), null, 2);
}

export function isValidSaveText(raw) {
  if (!raw || typeof raw !== "string") return false;
  try {
    const parsed = JSON.parse(raw);
    return !!parsed && typeof parsed === "object" && Array.isArray(parsed.grid);
  } catch {
    return false;
  }
}

export function writeSaveWithBackup(state) {
  const nextRaw = serializeSave(state);
  const previousRaw = localStorage.getItem(SAVE_KEY);
  if (previousRaw && previousRaw !== nextRaw && isValidSaveText(previousRaw)) {
    localStorage.setItem(BACKUP_SAVE_KEY, previousRaw);
  }
  localStorage.setItem(SAVE_KEY, nextRaw);
  return nextRaw;
}

export function downloadTextFile(filename, contents, type = "application/json") {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function buildDiagnosticBundle(state, validation, options = {}) {
  const rng = getRunRandomState();
  const payload = {
    game: "Dungeonlord",
    version: BUILD_VERSION,
    generatedAt: new Date().toISOString(),
    userAgent: globalThis.navigator?.userAgent || "unknown",
    viewport: {
      width: globalThis.innerWidth || null,
      height: globalThis.innerHeight || null,
    },
    run: {
      seed: state?.runSeed || rng.seed,
      rngCursor: rng.cursor,
      day: state?.day ?? null,
      phase: state?.phase ?? null,
      dungeonLevel: state?.dungeonLevel ?? null,
      raidType: state?.raidType || state?.nextRaidType || null,
      raidActive: !!state?.raidActive,
      escalationLevel: state?.currentRaidEscalationLevel || state?.pendingEscalationLevel || 0,
      coreHp: state?.coreHp ?? null,
      validation: validation || null,
      councilSession: state?.councilSession
        ? { day: state.councilSession.day, status: state.councilSession.status }
        : null,
      ashTrial: state?.ashTrial
        ? {
            active: !!state.ashTrial.active,
            difficulty: state.ashTrial.difficulty || null,
            raidsCompleted: state.ashTrial.raidsCompleted || 0,
            requiredRaids: state.ashTrial.requiredRaids || 0,
            breachCount: state.ashTrial.breaches?.length || 0,
          }
        : null,
    },
    recentLog: Array.isArray(state?.log) ? state.log.slice(0, 90) : [],
  };
  if (options.includeSave) payload.save = buildSaveSnapshot(state);
  return JSON.stringify(payload, null, 2);
}

export async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through to the selection-based copy path for restricted browsers.
    }
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  const copied = document.execCommand("copy");
  area.remove();
  if (!copied) throw new Error("Clipboard copy was rejected by this browser.");
}
