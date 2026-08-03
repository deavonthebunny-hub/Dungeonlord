import { beforeEach, describe, expect, it } from "vitest";
import { setRunRandomState } from "../random";
import {
  BACKUP_SAVE_KEY,
  SAVE_KEY,
  hasBackupSave,
  readBackupSave,
  readCurrentSave,
  replaceCurrentSave,
  restoreBackupToCurrent,
  writeSaveWithBackup,
} from "./browserStorage";
import { serializeSave } from "./saveSchema";

class MemoryStorage {
  constructor(entries = {}) {
    this.entries = new Map(Object.entries(entries));
  }

  getItem(key) {
    return this.entries.has(key) ? this.entries.get(key) : null;
  }

  setItem(key, value) {
    this.entries.set(key, String(value));
  }
}

describe("browser save storage", () => {
  beforeEach(() => setRunRandomState("DL-STORAGE-TEST", 2));

  it("keeps the existing public storage keys", () => {
    expect(SAVE_KEY).toBe("dungeonlord.save.v1");
    expect(BACKUP_SAVE_KEY).toBe("dungeonlord.save.backup.v1");
  });

  it("rotates the previous valid current save into the backup slot", () => {
    const storage = new MemoryStorage();
    const firstRaw = writeSaveWithBackup({ grid: [[]], day: 1, runSeed: "DL-FIRST" }, storage);
    const secondRaw = writeSaveWithBackup({ grid: [[]], day: 2, runSeed: "DL-SECOND" }, storage);

    expect(readCurrentSave(storage)).toBe(secondRaw);
    expect(readBackupSave(storage)).toBe(firstRaw);
    expect(hasBackupSave(storage)).toBe(true);
  });

  it("does not rotate the backup when the current serialized save is unchanged", () => {
    const currentRaw = serializeSave({ grid: [[]], day: 4, runSeed: "DL-CURRENT" });
    const priorBackup = serializeSave({ grid: [[]], day: 3, runSeed: "DL-BACKUP" });
    const storage = new MemoryStorage({
      [SAVE_KEY]: currentRaw,
      [BACKUP_SAVE_KEY]: priorBackup,
    });

    replaceCurrentSave(currentRaw, { storage });

    expect(readCurrentSave(storage)).toBe(currentRaw);
    expect(readBackupSave(storage)).toBe(priorBackup);
  });

  it("replaces and restores current saves while rejecting invalid text safely", () => {
    const originalRaw = serializeSave({ grid: [[]], day: 8, runSeed: "DL-ORIGINAL" });
    const importedRaw = serializeSave({ grid: [[]], day: 12, runSeed: "DL-IMPORTED" });
    const storage = new MemoryStorage({ [SAVE_KEY]: originalRaw });

    replaceCurrentSave(importedRaw, { storage });
    expect(readCurrentSave(storage)).toBe(importedRaw);
    expect(readBackupSave(storage)).toBe(originalRaw);

    expect(restoreBackupToCurrent(storage)).toBe(originalRaw);
    expect(readCurrentSave(storage)).toBe(originalRaw);
    expect(() => replaceCurrentSave("not-json", { storage })).toThrow(/invalid Dungeonlord save/i);
    expect(readCurrentSave(storage)).toBe(originalRaw);
  });
});
