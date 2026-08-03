import { loadRunState } from "../systems/runState";
import {
  CURRENT_SAVE_VERSION,
  hasMinimumSaveShape,
  parseSaveText,
} from "./saveSchema";

function migrateLegacyCurrency(save) {
  if (save.currency && typeof save.currency === "object" && !Array.isArray(save.currency)) {
    return save;
  }
  if (!Number.isFinite(save.essence)) return save;
  return {
    ...save,
    currency: { essence: save.essence },
  };
}

function migrateLegacyTrapStars(save) {
  let changed = false;
  const grid = save.grid.map((row) => {
    if (!Array.isArray(row)) return row;
    return row.map((cell) => {
      if (
        !cell ||
        typeof cell !== "object" ||
        Number.isFinite(cell.trapStar) ||
        !Number.isFinite(cell.trapStars)
      ) {
        return cell;
      }
      changed = true;
      return { ...cell, trapStar: cell.trapStars };
    });
  });
  return changed ? { ...save, grid } : save;
}

export const SAVE_MIGRATIONS = Object.freeze([
  Object.freeze({ id: "legacy-currency-object", migrate: migrateLegacyCurrency }),
  Object.freeze({ id: "legacy-trap-star-field", migrate: migrateLegacyTrapStars }),
]);

export function migrateSaveData(source) {
  if (!hasMinimumSaveShape(source)) return null;
  const migrated = SAVE_MIGRATIONS.reduce((save, migration) => migration.migrate(save), source);
  return {
    ...migrated,
    saveVersion: CURRENT_SAVE_VERSION,
  };
}

export function migrateSaveText(raw) {
  const parsed = parseSaveText(raw);
  return parsed ? migrateSaveData(parsed) : null;
}

export function hydrateSaveText(raw) {
  const migrated = migrateSaveText(raw);
  return migrated ? loadRunState(JSON.stringify(migrated)) : null;
}
