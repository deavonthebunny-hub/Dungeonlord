import { useEffect, useRef, useState } from "react";
import { addLog } from "../systems/shared";
import { buildDiagnosticBundle, copyText, downloadTextFile } from "../playtestSupport";
import {
  readBackupSave,
  readCurrentSave,
  replaceCurrentSave,
  restoreBackupToCurrent,
  writeSaveWithBackup,
  writeSaveWithoutBackup,
} from "../persistence/browserStorage";
import { hydrateSaveText, migrateSaveText } from "../persistence/saveMigrations";
import { serializeSave } from "../persistence/saveSchema";

export function loadInitialRunState(storage) {
  try {
    return hydrateSaveText(readCurrentSave(storage));
  } catch {
    return null;
  }
}

export function usePersistence({ state, setState, validation }) {
  const [saveStatus, setSaveStatus] = useState("Saved");
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const preserveBackupOnNextAutosave = useRef(false);

  useEffect(() => {
    try {
      setSaveStatus("Saving");
      if (preserveBackupOnNextAutosave.current) {
        preserveBackupOnNextAutosave.current = false;
        writeSaveWithoutBackup(state);
      } else {
        writeSaveWithBackup(state);
      }
      setSaveStatus("Saved");
      setLastSavedAt(new Date());
    } catch {
      preserveBackupOnNextAutosave.current = false;
      setSaveStatus("Save Failed");
    }
  }, [state]);

  function loadRun() {
    try {
      const loaded = hydrateSaveText(readCurrentSave());
      if (!loaded) {
        setState((current) => addLog(current, "No saved run found."));
        return;
      }
      setState(() => loaded);
    } catch {
      setState((current) => addLog(current, "No saved run found."));
    }
  }

  function saveRun() {
    try {
      writeSaveWithBackup(state);
      setSaveStatus("Saved");
      setLastSavedAt(new Date());
      setState((current) => addLog(current, "Run saved."));
    } catch {
      setSaveStatus("Save Failed");
      setState((current) => addLog(current, "Save failed."));
    }
  }

  function exportRun() {
    try {
      const safeSeed = String(state.runSeed || "run").replace(/[^a-zA-Z0-9-]/g, "-");
      downloadTextFile(`dungeonlord-${safeSeed}-day-${state.day}.json`, serializeSave(state));
      setState((current) => addLog(current, "Run exported."));
    } catch {
      setState((current) => addLog(current, "Run export failed."));
    }
  }

  async function importRun(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const raw = await file.text();
      const loaded = hydrateSaveText(raw);
      if (!loaded) throw new Error("Invalid save file");
      replaceCurrentSave(raw);
      preserveBackupOnNextAutosave.current = true;
      setState(() => addLog(loaded, `Run imported from ${file.name}.`));
      setSaveStatus("Saved");
      setLastSavedAt(new Date());
    } catch {
      setState((current) => addLog(current, "Import failed. Choose a Dungeonlord JSON save file."));
    }
  }

  function restoreBackup() {
    try {
      const raw = readBackupSave();
      if (!migrateSaveText(raw)) {
        setState((current) => addLog(current, "No valid backup save found."));
        return;
      }
      if (
        !globalThis.confirm(
          "Restore the automatic backup? The current run will be replaced, but exported files are unaffected."
        )
      ) {
        return;
      }
      const loaded = hydrateSaveText(raw);
      if (!loaded) throw new Error("Backup could not be loaded");
      if (!restoreBackupToCurrent()) throw new Error("Backup could not be restored");
      preserveBackupOnNextAutosave.current = true;
      setState(() => addLog(loaded, "Automatic backup restored."));
      setSaveStatus("Saved");
      setLastSavedAt(new Date());
    } catch {
      setState((current) => addLog(current, "Backup could not be loaded."));
    }
  }

  async function copyDiagnosticsBundle(includeSave = false) {
    try {
      await copyText(buildDiagnosticBundle(state, validation, { includeSave }));
      setState((current) =>
        addLog(current, includeSave ? "Diagnostics and save copied." : "Diagnostics copied.")
      );
    } catch {
      setState((current) => addLog(current, "Could not copy diagnostics."));
    }
  }

  return {
    saveStatus,
    lastSavedAt,
    loadRun,
    saveRun,
    exportRun,
    importRun,
    restoreBackup,
    copyDiagnosticsBundle,
  };
}
