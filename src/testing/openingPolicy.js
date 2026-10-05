import { buildTrapRoomTransition, buildUtilityRoomTransition, setSelectedTransition, startMoveTransition, upgradeDoctrineTransition, upgradeDungeonTransition, upgradeRoomTransition } from "../systems/dungeonActions";
import { buyFromTraderTransition, traderPrice } from "../systems/marketActions";
import { placeInventoryMonsterInSelectedRoomTransition } from "../systems/monsterActions";
import { dungeonUpgradeCost } from "../systems/monsters";
import { isOpeningRecoveryOffer } from "../systems/markets";

// Declared before tuning. No seed-specific branches, stock refreshes, rebuilds,
// free room-bonus cycling, blind Recruit attempts, or Dominion timing oracle.
export const OPENING_SEEDS = Object.freeze([
  "DL--1F0BD67D", "DL-B2-02", "DL-B2-03", "DL-B2-04", "DL-B2-05",
  "DL-B2-06", "DL-B2-07", "DL-B2-08", "DL-B2-09", "DL-B2-10",
]);
export const OPENING_POLICY = "mixed-keystone-reserve-normal-no-powers-v2";

function move(state, fromX, fromY, toX, toY) {
  return setSelectedTransition(startMoveTransition(setSelectedTransition(state, fromX, fromY)), toX, toY);
}
function build(state, x, y, kind, type) {
  state = setSelectedTransition(state, x, y);
  if (kind === "trap") return buildTrapRoomTransition({ ...state, selectedTrapType: type });
  return buildUtilityRoomTransition({ ...state, selectedUtilityRoomType: type });
}

export function prepareMixedOpening(state) {
  const actions = [];
  const act = (description, transition) => {
    const before = { ...state.currency };
    state = transition(state);
    actions.push({ action: description, spend: Object.fromEntries(Object.keys(before).map(key => [key, before[key] - state.currency[key]])) });
  };
  if (state.day === 1) {
    act("Move Core to (5,1) and staffed Training Den to (4,1)", s => move(move(s, 2, 0, 4, 0), 1, 0, 3, 0));
    act("Build Spike Pit (2,1), Poison Vent (3,1), Keystone (4,2), accept first quality rolls", s => build(build(build(s, 1, 0, "trap", "spike-pit"), 2, 0, "trap", "poison-vent"), 3, 1, "utility", "reinforced-keystone"));
  }
  // Buy ordinary visible stock only, recovery offer first then cheapest, up to three staff. Keep
  // ten Shards for a future decision; no rare unit or particular species needed.
  while (state.grid[0][3].monsters.length < 3) {
    const affordable = state.traderStock.map((monster, index) => ({ monster, index, price: traderPrice(monster, state.day) }))
      .filter(({ monster, price }) => !monster.isUnique && !monster.isFused && monster.stars <= 2 && price <= state.currency.soulshards - 10)
      .sort((a, b) => Number(isOpeningRecoveryOffer(b.monster, state.day)) - Number(isOpeningRecoveryOffer(a.monster, state.day)) || a.price - b.price || a.index - b.index);
    if (!affordable.length) break;
    const offer = affordable[0];
    act(`Buy ${offer.monster.key} (${offer.monster.stars} star) and staff Training Den`, s => placeInventoryMonsterInSelectedRoomTransition(setSelectedTransition(buyFromTraderTransition(s, offer.index), 3, 0), s.invMonsters.length));
  }
  if (state.day > 1 && state.dungeonLevel < 3 && state.currency.essence >= dungeonUpgradeCost(state.dungeonLevel, state.day)) {
    const oldLevel = state.dungeonLevel;
    act("Buy one dungeon capacity upgrade", upgradeDungeonTransition);
    if (state.dungeonLevel > oldLevel) {
      if (state.dungeonLevel === 2) {
        act("Extend route with Flame Jet (5,1), move Core (6,1), add Soul Altar (2,2)", s => build(build(move(s, 4, 0, 5, 0), 4, 0, "trap", "flame-jet"), 1, 1, "utility", "soul-altar"));
      } else {
        act("Extend route with Flame Jet (6,1), move Core (7,1), add Ward Lantern (3,2)", s => build(build(move(s, 5, 0, 6, 0), 5, 0, "trap", "flame-jet"), 2, 1, "utility", "ward-lantern"));
      }
    }
  } else if (state.day > 1 && (state.doctrines.trap || 0) < 2) {
    act("Attempt next Trap Doctrine once; no Recruit rerolls", s => upgradeDoctrineTransition(s, "trap"));
  } else if (state.day > 1 && state.grid[1][3].roomTier < 3) {
    act("Attempt one paid Keystone upgrade", s => upgradeRoomTransition(setSelectedTransition(s, 3, 1)));
  }
  return { state, actions };
}
