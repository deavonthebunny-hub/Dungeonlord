import { useEffect, useState } from "react";
import { useGameController } from "./hooks/useGameController";
import { useGameViewModel } from "./hooks/useGameViewModel";
import { loadInitialRunState, usePersistence } from "./hooks/usePersistence";
import { createDefaultState } from "./systems/runState";
import GameView from "./components/GameView";
import "./App.css";

export default function App() {
  const [activeTab, setActiveTab] = useState("dungeon");
  const [sidePanel, setSidePanel] = useState("log");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [councilScreenOpen, setCouncilScreenOpen] = useState(false);
  const [focusedCouncilKey, setFocusedCouncilKey] = useState(null);
  const [fuseA, setFuseA] = useState("");
  const [fuseB, setFuseB] = useState("");
  const [sacrificeIdx, setSacrificeIdx] = useState("");
  const [selectedInventoryMonsterIndex, setSelectedInventoryMonsterIndex] = useState("");
  const [brokenTileArt, setBrokenTileArt] = useState({});
  const [brokenCouncilArt, setBrokenCouncilArt] = useState({});
  const [advancedToolboxOpen, setAdvancedToolboxOpen] = useState(false);
  const [state, setState] = useState(() => loadInitialRunState() || createDefaultState());

  const viewModel = useGameViewModel({
    state,
    ui: {
      activeTab,
      focusedCouncilKey,
      brokenCouncilArt,
      fuseA,
      fuseB,
    },
  });
  const persistence = usePersistence({
    state,
    setState,
    validation: viewModel.dungeon.validation,
  });
  const gameActions = useGameController({
    state,
    setState,
    ui: {
      selectedInventoryMonsterIndex,
      fuseA,
      fuseB,
      setFuseA,
      setFuseB,
      setSidePanel,
      setCouncilScreenOpen,
    },
  });

  function noteBrokenTileArt(src) {
    if (!src) return;
    setBrokenTileArt((previous) =>
      previous[src] ? previous : { ...previous, [src]: true }
    );
  }

  function noteBrokenCouncilArt(src) {
    if (!src) return;
    setBrokenCouncilArt((previous) =>
      previous[src] ? previous : { ...previous, [src]: true }
    );
  }

  function selectMobileTab(tab) {
    setActiveTab(tab);
    if (["log", "inventory", "evolution", "glossary", "council"].includes(tab)) {
      setSidePanel(tab);
    }
    setMobileMenuOpen(false);
  }

  function closeShellDrawer() {
    selectMobileTab("dungeon");
  }

  useEffect(() => {
    // The toolbox permanently unlocks once a run reaches day two.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (state.day > 1) setAdvancedToolboxOpen(true);
  }, [state.day]);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") gameActions.dungeon.cancelMove();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [gameActions.dungeon]);

  useEffect(() => {
    if (
      state.councilSession &&
      state.councilSession.day === state.day &&
      state.councilSession.status === "pending"
    ) {
      // A newly pending Council session owns the side panel until the player responds.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSidePanel("council");
      setCouncilScreenOpen(false);
      setFocusedCouncilKey(null);
    }
  }, [state.councilSession, state.day]);

  useEffect(() => {
    const roster = viewModel.council.councilRoster;
    if (!roster.length) return;
    if (!focusedCouncilKey || !roster.some((member) => member.key === focusedCouncilKey)) {
      // Keep transient focus aligned with the current session roster.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFocusedCouncilKey(roster[0].key);
    }
  }, [viewModel.council.councilRoster, focusedCouncilKey]);

  useEffect(() => {
    if (!viewModel.dungeon.canManageSelectedMonsterRoom) {
      // An inventory selection is only valid while a monster room can receive it.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (selectedInventoryMonsterIndex !== "") setSelectedInventoryMonsterIndex("");
      return;
    }
    if (
      selectedInventoryMonsterIndex !== "" &&
      !state.invMonsters[Number(selectedInventoryMonsterIndex)]
    ) {
      // Clear a stale index after the selected inventory monster leaves the inventory.
      setSelectedInventoryMonsterIndex("");
    }
  }, [
    viewModel.dungeon.canManageSelectedMonsterRoom,
    selectedInventoryMonsterIndex,
    state.invMonsters,
  ]);

  const shell = {
    ...viewModel.shell,
    activeTab,
    sidePanel,
    mobileMenuOpen,
    councilScreenOpen,
    fuseA,
    fuseB,
    sacrificeIdx,
    selectedInventoryMonsterIndex,
    brokenTileArt,
    brokenCouncilArt,
    saveStatus: persistence.saveStatus,
    lastSavedAt: persistence.lastSavedAt,
    advancedToolboxOpen,
  };

  const actions = {
    ...gameActions,
    persistence: {
      loadRun: persistence.loadRun,
      saveRun: persistence.saveRun,
      exportRun: persistence.exportRun,
      importRun: persistence.importRun,
      restoreBackup: persistence.restoreBackup,
      copyDiagnosticsBundle: persistence.copyDiagnosticsBundle,
    },
    shell: {
      setActiveTab,
      setMobileMenuOpen,
      setCouncilScreenOpen,
      setFocusedCouncilKey,
      setFuseA,
      setFuseB,
      setSacrificeIdx,
      setSelectedInventoryMonsterIndex,
      setAdvancedToolboxOpen,
      noteBrokenTileArt,
      noteBrokenCouncilArt,
      selectMobileTab,
      closeShellDrawer,
    },
  };

  return (
    <GameView
      run={viewModel.run}
      dungeon={viewModel.dungeon}
      raid={viewModel.raid}
      council={viewModel.council}
      inventory={viewModel.inventory}
      shell={shell}
      actions={actions}
    />
  );
}
