import CouncilPrompt from "./CouncilPrompt";
import TopBar from "./TopBar";
import ManagementPanels from "./ManagementPanels";
import DungeonPanel from "./DungeonPanel";
import CouncilScreen from "./CouncilScreen";













export default function GameView(props) {
  const {
    activeTab,
    setActiveTab,
    sidePanel,
    mobileMenuOpen,
    setMobileMenuOpen,
    councilScreenOpen,
    setCouncilScreenOpen,
    setFocusedCouncilKey,
    fuseA,
    setFuseA,
    fuseB,
    setFuseB,
    sacrificeIdx,
    setSacrificeIdx,
    selectedInventoryMonsterIndex,
    setSelectedInventoryMonsterIndex,
    brokenTileArt,
    brokenCouncilArt,
    saveStatus,
    lastSavedAt,
    advancedToolboxOpen,
    setAdvancedToolboxOpen,
    setState,
    state,
    noteBrokenTileArt,
    noteBrokenCouncilArt,
    locked,
    isBuildPhase,
    isBattlePhase,
    councilSessionActive,
    showCouncilPrompt,
    councilAwaitingConclusion,
    councilRoster,
    focusedCouncilMember,
    absentCouncilMembers,
    core,
    activeEntrances,
    validation,
    roomsPlaced,
    artifactMods,
    ownedArtifactCounts,
    standardArtifactCollectedCount,
    standardArtifactAtCapCount,
    dealerCatalogExhausted,
    contentWarnings,
    coreMaxHp,
    dungeonLevel,
    maxRooms,
    heroesByTile,
    selectedTile,
    selectedHeroes,
    roomUpgradePrice,
    selectedMonsterRoomCapValue,
    canManageSelectedMonsterRoom,
    selectedMonsterRoomHasSpace,
    fusionPreview,
    ownedArtifactGroups,
    setSelected,
    clearTile,
    buildTrapRoom,
    buildMonsterRoom,
    buildUtilityRoom,
    armTrap,
    recruitMonster,
    startEvolution,
    chooseEvolution,
    cancelEvolution,
    placeInventoryMonsterInSelectedRoom,
    addMonsterToRoom,
    returnMonsterFromSelectedRoom,
    returnAllMonstersFromSelectedRoom,
    startMove,
    cancelMove,
    upgradeDungeon,
    upgradeDoctrine,
    upgradeRoom,
    buyArtifact,
    activateDominionPower,
    selectInvasionChoice,
    beginBattle,
    startRaid,
    endTurn,
    resetRun,
    newRun,
    loadRun,
    saveRun,
    exportRun,
    importRun,
    restoreBackup,
    copyDiagnosticsBundle,
    attendCouncil,
    declineCouncil,
    concludeCouncil,
    acceptCouncilBoon,
    acceptCouncilQuest,
    buyFromFleshMarket,
    sacrificeMonster,
    triggerFusion,
    buyFromTrader,
    getTileGlyph,
    getTileRadarSpec,
    tileClass,
    roomTypeName,
    roomTypeDesc,
    roomTypeIcon,
    effectiveMonsterRoomCap,
    projectedTrapDamage,
    tileStateChip,
    tileHasAura,
    selectedTileAuras,
    selectedHeroIntent,
    focusedCouncilSponsor,
    focusedCouncilStanding,
    focusedCouncilCrestSrc,
    useFocusedCouncilCrest,
    useCouncilBackdrop,
    useCouncilSigil,
    useCouncilAbsentSilhouette,
    focusedCouncilBoons,
    councilQuestPlacementBlock,
    focusedCouncilSponsorStatus,
    pendingRaidType,
    pendingEscalationLevel,
    pendingRaidOrder,
    pendingRaidLeaderTrait,
    pendingRaidCrestSrc,
    usePendingRaidCrest,
    pendingRaidMeta,
    pendingRaidDifficulty,
    pendingDirective,
    raidForecastMix,
    invPreview,
    checklist,
    raidPlanReady,
    showInvasionChoiceCards,
    canStartRaid,
    canEndTurn,
    atDungeonLevelCap,
    selectedIsAshBreach,
    selectedLinkInfo,
    selectedReadiness,
    selectedTileEffect,
    selectedLinkLabel,
    selectedLinkBonus,
    selectedTileFlags,
    selectedTrapSummary,
    dungeonRailStatus,
    dungeonRailSupport,
    onboardingComplete,
    onboardingStep,
    evolutionButtonLabel,
    evolutionStageLabel,
    mobileTabs,
    activeMobileTab,
    selectMobileTab,
    drawerPanelTitle,
  } = props;

  return (
  <div className="app">
        <TopBar {...{ activeMobileTab, activeTab, lastSavedAt, mobileMenuOpen, mobileTabs, saveStatus, selectMobileTab, setMobileMenuOpen, state }} />

        {showCouncilPrompt && (
          <CouncilPrompt {...{ attendCouncil, declineCouncil }} />
        )}

        {councilScreenOpen && councilSessionActive && (
          <CouncilScreen {...{ absentCouncilMembers, acceptCouncilBoon, acceptCouncilQuest, brokenCouncilArt, concludeCouncil, councilAwaitingConclusion, councilQuestPlacementBlock, councilRoster, focusedCouncilBoons, focusedCouncilCrestSrc, focusedCouncilMember, focusedCouncilSponsor, focusedCouncilSponsorStatus, focusedCouncilStanding, noteBrokenCouncilArt, setCouncilScreenOpen, setFocusedCouncilKey, state, useCouncilAbsentSilhouette, useCouncilBackdrop, useCouncilSigil, useFocusedCouncilCrest }} />
        )}

        <div className="layout" data-tab={activeTab} data-side={sidePanel}>
          <DungeonPanel {...{ atDungeonLevelCap, beginBattle, brokenTileArt, cancelMove, canEndTurn, canStartRaid, coreMaxHp, councilSessionActive, dungeonLevel, dungeonRailStatus, dungeonRailSupport, endTurn, getTileGlyph, getTileRadarSpec, heroesByTile, isBattlePhase, isBuildPhase, locked, maxRooms, noteBrokenTileArt, onboardingComplete, onboardingStep, raidPlanReady, roomsPlaced, roomTypeIcon, roomTypeName, selectedHeroes, selectedLinkBonus, selectedLinkLabel, selectedReadiness, selectedTile, selectedTileAuras, selectedTileEffect, selectedTileFlags, selectedTrapSummary, selectMobileTab, setSelected, setState, startMove, startRaid, state, tileClass, tileHasAura, tileStateChip, upgradeDungeon, validation }} />

          <ManagementPanels {...{ acceptCouncilBoon, acceptCouncilQuest, activateDominionPower, activeEntrances, addMonsterToRoom, advancedToolboxOpen, armTrap, artifactMods, attendCouncil, buildMonsterRoom, buildTrapRoom, buildUtilityRoom, buyArtifact, buyFromFleshMarket, buyFromTrader, cancelEvolution, canManageSelectedMonsterRoom, checklist, chooseEvolution, clearTile, concludeCouncil, contentWarnings, copyDiagnosticsBundle, core, councilAwaitingConclusion, councilQuestPlacementBlock, councilSessionActive, dealerCatalogExhausted, declineCouncil, drawerPanelTitle, effectiveMonsterRoomCap, evolutionButtonLabel, evolutionStageLabel, exportRun, focusedCouncilMember, focusedCouncilSponsor, focusedCouncilStanding, fuseA, fuseB, fusionPreview, importRun, invPreview, isBattlePhase, isBuildPhase, loadRun, locked, maxRooms, newRun, ownedArtifactCounts, ownedArtifactGroups, pendingDirective, pendingEscalationLevel, pendingRaidCrestSrc, pendingRaidDifficulty, pendingRaidLeaderTrait, pendingRaidMeta, pendingRaidOrder, pendingRaidType, placeInventoryMonsterInSelectedRoom, projectedTrapDamage, raidForecastMix, recruitMonster, resetRun, restoreBackup, returnAllMonstersFromSelectedRoom, returnMonsterFromSelectedRoom, roomsPlaced, roomTypeDesc, roomTypeIcon, roomTypeName, roomUpgradePrice, sacrificeIdx, sacrificeMonster, saveRun, saveStatus, selectedHeroes, selectedHeroIntent, selectedInventoryMonsterIndex, selectedIsAshBreach, selectedLinkBonus, selectedLinkInfo, selectedMonsterRoomCapValue, selectedMonsterRoomHasSpace, selectedReadiness, selectedTile, selectedTileAuras, selectInvasionChoice, setActiveTab, setAdvancedToolboxOpen, setFocusedCouncilKey, setFuseA, setFuseB, setSacrificeIdx, setSelectedInventoryMonsterIndex, setState, showInvasionChoiceCards, standardArtifactAtCapCount, standardArtifactCollectedCount, startEvolution, state, triggerFusion, upgradeDoctrine, upgradeRoom, usePendingRaidCrest, validation }} />
        </div>
      </div>
  );
}
