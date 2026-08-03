import { isValidSaveText, serializeSave } from "./saveSchema";

export const SAVE_KEY = "dungeonlord.save.v1";
export const BACKUP_SAVE_KEY = "dungeonlord.save.backup.v1";

function requireStorage(storage) {
  const resolved = storage || globalThis.localStorage;
  if (!resolved?.getItem || !resolved?.setItem) {
    throw new Error("Browser storage is unavailable.");
  }
  return resolved;
}

export function readCurrentSave(storage) {
  return requireStorage(storage).getItem(SAVE_KEY);
}

export function readBackupSave(storage) {
  return requireStorage(storage).getItem(BACKUP_SAVE_KEY);
}

export function hasBackupSave(storage) {
  return !!readBackupSave(storage);
}

export function writeCurrentSave(raw, storage) {
  if (!isValidSaveText(raw)) throw new Error("Cannot store an invalid Dungeonlord save.");
  requireStorage(storage).setItem(SAVE_KEY, raw);
  return raw;
}

export function replaceCurrentSave(raw, options = {}) {
  if (!isValidSaveText(raw)) throw new Error("Cannot store an invalid Dungeonlord save.");
  const storage = requireStorage(options.storage);
  const previousRaw = storage.getItem(SAVE_KEY);
  if (
    options.backupCurrent !== false &&
    previousRaw &&
    previousRaw !== raw &&
    isValidSaveText(previousRaw)
  ) {
    storage.setItem(BACKUP_SAVE_KEY, previousRaw);
  }
  storage.setItem(SAVE_KEY, raw);
  return raw;
}

export function writeSaveWithBackup(state, storage) {
  return replaceCurrentSave(serializeSave(state), { storage });
}

export function writeSaveWithoutBackup(state, storage) {
  return writeCurrentSave(serializeSave(state), storage);
}

export function restoreBackupToCurrent(storage) {
  const resolved = requireStorage(storage);
  const raw = resolved.getItem(BACKUP_SAVE_KEY);
  if (!isValidSaveText(raw)) return null;
  resolved.setItem(SAVE_KEY, raw);
  return raw;
}
