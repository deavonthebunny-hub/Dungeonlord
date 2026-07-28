import ToolboxPanel from "./ToolboxPanel";
import LogPanel from "./LogPanel";
import GlossaryPanel from "./GlossaryPanel";
import CouncilPanel from "./CouncilPanel";
import EvolutionPanel from "./EvolutionPanel";
import InventoryPanel from "./InventoryPanel";













export default function ManagementPanels(props) {
  const {
    acceptCouncilBoon,
    acceptCouncilQuest,
    activateDominionPower,
    activeEntrances,
    addMonsterToRoom,
    advancedToolboxOpen,
    armTrap,
    artifactMods,
    attendCouncil,
    buildMonsterRoom,
    buildTrapRoom,
    buildUtilityRoom,
    buyArtifact,
    buyFromFleshMarket,
    buyFromTrader,
    cancelEvolution,
    canManageSelectedMonsterRoom,
    checklist,
    chooseEvolution,
    clearTile,
    concludeCouncil,
    contentWarnings,
    copyDiagnosticsBundle,
    core,
    councilAwaitingConclusion,
    councilQuestPlacementBlock,
    councilSessionActive,
    dealerCatalogExhausted,
    declineCouncil,
    drawerPanelTitle,
    effectiveMonsterRoomCap,
    evolutionButtonLabel,
    evolutionStageLabel,
    exportRun,
    focusedCouncilMember,
    focusedCouncilSponsor,
    focusedCouncilStanding,
    fuseA,
    fuseB,
    fusionPreview,
    importRun,
    invPreview,
    isBattlePhase,
    isBuildPhase,
    loadRun,
    locked,
    maxRooms,
    newRun,
    ownedArtifactCounts,
    ownedArtifactGroups,
    pendingDirective,
    pendingEscalationLevel,
    pendingRaidCrestSrc,
    pendingRaidDifficulty,
    pendingRaidLeaderTrait,
    pendingRaidMeta,
    pendingRaidOrder,
    pendingRaidType,
    placeInventoryMonsterInSelectedRoom,
    projectedTrapDamage,
    raidForecastMix,
    recruitMonster,
    resetRun,
    restoreBackup,
    returnAllMonstersFromSelectedRoom,
    returnMonsterFromSelectedRoom,
    roomsPlaced,
    roomTypeDesc,
    roomTypeIcon,
    roomTypeName,
    roomUpgradePrice,
    sacrificeIdx,
    sacrificeMonster,
    saveRun,
    saveStatus,
    selectedHeroes,
    selectedHeroIntent,
    selectedInventoryMonsterIndex,
    selectedIsAshBreach,
    selectedLinkBonus,
    selectedLinkInfo,
    selectedMonsterRoomCapValue,
    selectedMonsterRoomHasSpace,
    selectedReadiness,
    selectedTile,
    selectedTileAuras,
    selectInvasionChoice,
    setActiveTab,
    setAdvancedToolboxOpen,
    setFocusedCouncilKey,
    setFuseA,
    setFuseB,
    setSacrificeIdx,
    setSelectedInventoryMonsterIndex,
    setState,
    showInvasionChoiceCards,
    standardArtifactAtCapCount,
    standardArtifactCollectedCount,
    startEvolution,
    state,
    triggerFusion,
    upgradeDoctrine,
    upgradeRoom,
    usePendingRaidCrest,
    validation,
  } = props;

  return (
    <div className="shellSidePanel">
                <ToolboxPanel {...{ activateDominionPower, activeEntrances, addMonsterToRoom, advancedToolboxOpen, armTrap, artifactMods, attendCouncil, buildMonsterRoom, buildTrapRoom, buildUtilityRoom, buyArtifact, buyFromFleshMarket, buyFromTrader, canManageSelectedMonsterRoom, checklist, clearTile, concludeCouncil, copyDiagnosticsBundle, core, councilAwaitingConclusion, councilSessionActive, dealerCatalogExhausted, declineCouncil, drawerPanelTitle, effectiveMonsterRoomCap, evolutionStageLabel, exportRun, fuseA, fuseB, fusionPreview, importRun, invPreview, isBattlePhase, isBuildPhase, loadRun, locked, maxRooms, newRun, ownedArtifactCounts, pendingDirective, pendingEscalationLevel, pendingRaidCrestSrc, pendingRaidDifficulty, pendingRaidLeaderTrait, pendingRaidMeta, pendingRaidOrder, pendingRaidType, projectedTrapDamage, raidForecastMix, recruitMonster, resetRun, restoreBackup, returnAllMonstersFromSelectedRoom, returnMonsterFromSelectedRoom, roomsPlaced, roomTypeDesc, roomTypeIcon, roomTypeName, roomUpgradePrice, sacrificeIdx, sacrificeMonster, saveRun, saveStatus, selectedHeroes, selectedHeroIntent, selectedInventoryMonsterIndex, selectedIsAshBreach, selectedLinkBonus, selectedLinkInfo, selectedMonsterRoomCapValue, selectedMonsterRoomHasSpace, selectedReadiness, selectedTile, selectedTileAuras, selectInvasionChoice, setActiveTab, setAdvancedToolboxOpen, setFuseA, setFuseB, setSacrificeIdx, setSelectedInventoryMonsterIndex, setState, showInvasionChoiceCards, standardArtifactAtCapCount, standardArtifactCollectedCount, state, triggerFusion, upgradeDoctrine, upgradeRoom, usePendingRaidCrest, validation }} />

              <InventoryPanel {...{ cancelEvolution, canManageSelectedMonsterRoom, chooseEvolution, drawerPanelTitle, evolutionButtonLabel, evolutionStageLabel, isBuildPhase, ownedArtifactGroups, placeInventoryMonsterInSelectedRoom, selectedMonsterRoomCapValue, selectedMonsterRoomHasSpace, selectedTile, standardArtifactCollectedCount, startEvolution, state }} />

              <EvolutionPanel {...{ cancelEvolution, chooseEvolution, drawerPanelTitle, evolutionButtonLabel, evolutionStageLabel, isBuildPhase, startEvolution, state }} />

              <CouncilPanel {...{ acceptCouncilBoon, acceptCouncilQuest, attendCouncil, concludeCouncil, contentWarnings, councilQuestPlacementBlock, declineCouncil, drawerPanelTitle, focusedCouncilMember, focusedCouncilSponsor, focusedCouncilStanding, setFocusedCouncilKey, state }} />

              <GlossaryPanel {...{ drawerPanelTitle }} />

                <LogPanel {...{ drawerPanelTitle, state }} />
              </div>
  );
}
