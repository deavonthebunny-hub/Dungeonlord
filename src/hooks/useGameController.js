import {
  createNewRunTransition,
  dismissOnboardingTransition,
  resetRunKeepingLayoutTransition,
} from "../systems/runActions";
import { resolveCombatTurn } from "../systems/combat";
import {
  armTrapTransition,
  buildMonsterRoomTransition,
  buildTrapRoomTransition,
  buildUtilityRoomTransition,
  cancelMoveTransition,
  clearTileTransition,
  selectMonsterRoomTypeTransition,
  selectTrapTypeTransition,
  selectUtilityRoomTypeTransition,
  setSelectedTransition,
  startMoveTransition,
  upgradeDoctrineTransition,
  upgradeDungeonTransition,
  upgradeRoomTransition,
} from "../systems/dungeonActions";
import {
  cancelEvolutionTransition,
  chooseEvolutionTransition,
  placeInventoryMonsterInSelectedRoomTransition,
  recruitMonsterTransition,
  returnAllMonstersFromSelectedRoomTransition,
  returnMonsterFromSelectedRoomTransition,
  startEvolutionTransition,
} from "../systems/monsterActions";
import {
  buyArtifactTransition,
  buyFromFleshMarketTransition,
  buyFromTraderTransition,
  fuseMonstersTransition,
  sacrificeMonsterTransition,
} from "../systems/marketActions";
import {
  activateDominionPowerTransition,
  beginBattleTransition,
  selectInvasionChoiceTransition,
  startRaidTransition,
} from "../systems/raidActions";
import {
  acceptCouncilBoonTransition,
  acceptCouncilQuestTransition,
  attendCouncilTransition,
  concludeCouncilTransition,
  declineCouncilTransition,
} from "../systems/councilActions";

export function useGameController({ state, setState, ui }) {
  function setSelected(x, y) {
    setState((current) => setSelectedTransition(current, x, y));
  }

  function clearTile() {
    setState((current) => clearTileTransition(current));
  }

  function buildTrapRoom() {
    setState((current) => buildTrapRoomTransition(current));
  }

  function buildMonsterRoom() {
    setState((current) => buildMonsterRoomTransition(current));
  }

  function buildUtilityRoom() {
    setState((current) => buildUtilityRoomTransition(current));
  }

  function armTrap() {
    setState((current) => armTrapTransition(current));
  }

  function startMove() {
    setState((current) => startMoveTransition(current));
  }

  function cancelMove() {
    setState((current) => cancelMoveTransition(current));
  }

  function upgradeDungeon() {
    setState((current) => upgradeDungeonTransition(current));
  }

  function upgradeDoctrine(kind) {
    setState((current) => upgradeDoctrineTransition(current, kind));
  }

  function upgradeRoom() {
    setState((current) => upgradeRoomTransition(current));
  }

  function selectTrapType(value) {
    setState((current) => selectTrapTypeTransition(current, value));
  }

  function selectMonsterRoomType(value) {
    setState((current) => selectMonsterRoomTypeTransition(current, value));
  }

  function selectUtilityRoomType(value) {
    setState((current) => selectUtilityRoomTypeTransition(current, value));
  }

  function recruitMonster() {
    setState((current) => recruitMonsterTransition(current));
  }

  function startEvolution(source) {
    setState((current) => startEvolutionTransition(current, source));
  }

  function chooseEvolution(source, option) {
    setState((current) => chooseEvolutionTransition(current, source, option));
  }

  function cancelEvolution() {
    setState((current) => cancelEvolutionTransition(current));
  }

  function placeInventoryMonsterInSelectedRoom(index) {
    setState((current) => placeInventoryMonsterInSelectedRoomTransition(current, index));
  }

  function addMonsterToRoom() {
    const index = ui.selectedInventoryMonsterIndex;
    placeInventoryMonsterInSelectedRoom(index === "" ? Number.NaN : Number(index));
  }

  function returnMonsterFromSelectedRoom(index) {
    setState((current) => returnMonsterFromSelectedRoomTransition(current, index));
  }

  function returnAllMonstersFromSelectedRoom() {
    setState((current) => returnAllMonstersFromSelectedRoomTransition(current));
  }

  function buyArtifact(index) {
    setState((current) => buyArtifactTransition(current, index));
  }

  function buyFromFleshMarket(index) {
    setState((current) => buyFromFleshMarketTransition(current, index));
  }

  function buyFromTrader(index) {
    setState((current) => buyFromTraderTransition(current, index));
  }

  function sacrificeMonster(index) {
    setState((current) => sacrificeMonsterTransition(current, index));
  }

  function fuseMonsters(firstIndex, secondIndex) {
    setState((current) => fuseMonstersTransition(current, firstIndex, secondIndex));
  }

  function triggerFusion() {
    if (ui.fuseA === "" || ui.fuseB === "") return;
    fuseMonsters(Number(ui.fuseA), Number(ui.fuseB));
    ui.setFuseA("");
    ui.setFuseB("");
  }

  function activateDominionPower(kind) {
    setState((current) => activateDominionPowerTransition(current, kind));
  }

  function selectInvasionChoice(choiceKey) {
    setState((current) => selectInvasionChoiceTransition(current, choiceKey));
  }

  function beginBattle() {
    setState((current) => beginBattleTransition(current));
  }

  function startRaid() {
    setState((current) => startRaidTransition(current));
  }

  function endTurn() {
    setState((current) => resolveCombatTurn(current));
  }

  function attendCouncil() {
    if (!state.council?.active) return;
    ui.setSidePanel("council");
    ui.setCouncilScreenOpen(true);
    setState((current) => attendCouncilTransition(current));
  }

  function declineCouncil() {
    if (!state.council?.active) return;
    ui.setSidePanel("council");
    ui.setCouncilScreenOpen(false);
    setState((current) => declineCouncilTransition(current));
  }

  function concludeCouncil() {
    if (state.coreHp <= 0 || !state.councilSession || state.councilSession.day !== state.day) return;
    if (state.councilSession.status !== "pending") ui.setCouncilScreenOpen(false);
    setState((current) => concludeCouncilTransition(current));
  }

  function acceptCouncilBoon(sponsorKey) {
    setState((current) => acceptCouncilBoonTransition(current, sponsorKey));
  }

  function acceptCouncilQuest(sponsorKey, difficulty) {
    setState((current) => acceptCouncilQuestTransition(current, sponsorKey, difficulty));
  }

  function resetRun() {
    if (
      !globalThis.confirm(
        "Reset this run while keeping the current dungeon layout? Monsters, progression, and resources will be cleared."
      )
    ) {
      return;
    }
    setState((current) => resetRunKeepingLayoutTransition(current));
  }

  function newRun() {
    if (
      !globalThis.confirm(
        "Start a completely new run? The current run will remain available only in the automatic backup."
      )
    ) {
      return;
    }
    setState(() => createNewRunTransition());
  }

  function dismissOnboarding() {
    setState((current) => dismissOnboardingTransition(current));
  }

  return {
    run: { resetRun, newRun, dismissOnboarding },
    dungeon: {
      setSelected,
      clearTile,
      buildTrapRoom,
      buildMonsterRoom,
      buildUtilityRoom,
      armTrap,
      startMove,
      cancelMove,
      upgradeDungeon,
      upgradeDoctrine,
      upgradeRoom,
      selectTrapType,
      selectMonsterRoomType,
      selectUtilityRoomType,
    },
    monsters: {
      recruitMonster,
      startEvolution,
      chooseEvolution,
      cancelEvolution,
      placeInventoryMonsterInSelectedRoom,
      addMonsterToRoom,
      returnMonsterFromSelectedRoom,
      returnAllMonstersFromSelectedRoom,
    },
    markets: {
      buyArtifact,
      buyFromFleshMarket,
      buyFromTrader,
      sacrificeMonster,
      triggerFusion,
    },
    raid: {
      activateDominionPower,
      selectInvasionChoice,
      beginBattle,
      startRaid,
      endTurn,
    },
    council: {
      attendCouncil,
      declineCouncil,
      concludeCouncil,
      acceptCouncilBoon,
      acceptCouncilQuest,
    },
  };
}
