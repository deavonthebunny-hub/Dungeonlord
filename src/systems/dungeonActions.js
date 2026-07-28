import { DOCTRINE_RULES } from "../gameContent";
import { MONSTER_ROOM_MAP, TRAP_MAP, UTILITY_MAP, cloneGrid, findEntranceAndCore, isAshBreachAt, trapChargesForTile } from "./dungeon";
import { calcArtifactMods, getCoreMaxHp, getDoctrineEffects, getDungeonRoomCap } from "./economy";
import { doctrineUpgradeCost, dungeonUpgradeCost, prepareMonsterForInventory } from "./monsters";
import { countRooms } from "./pathing";
import { H, MAX_DUNGEON_LEVEL, ROOM_TIER_MAX, W, addLog, clampDungeonLevel, formatStars, rollAuthoritativeStar, scaleByDay } from "./shared";
import { applyMonsterRoomPlacement } from "./monsterActions";

function roomUpgradeCost(tier) {
  return 20 + tier * 10;
}
function setSelectedTransition(state, x, y) {
  let nextState = state;
  const setState = updater => {
    nextState = typeof updater === "function" ? updater(nextState) : updater;
  };
  const locked = state.coreHp <= 0;
  if (locked) return nextState;
  setState(s => {
    if (s.movePayload) {
      const grid = cloneGrid(s.grid);
      const t = grid[y][x];
      if (t.entrance) return addLog(s, "Cannot move onto the Entrance.");
      if (isAshBreachAt(s.ashTrial, x, y)) return addLog(s, "Cannot move onto an Ash Breach.");
      if (t.core || t.room) return addLog(s, "That tile is already occupied.");
      const payload = s.movePayload;
      if (payload.type === "core") {
        t.core = true;
      } else if (payload.type === "room") {
        t.room = payload.room;
        t.roomType = payload.roomType;
        t.roomTier = payload.roomTier || 1;
        t.trap = payload.trap;
        t.trapType = payload.trapType;
        t.trapStar = payload.trapStar ?? payload.trapStars ?? 1;
        t.trapStars = payload.trapStar ?? payload.trapStars ?? 1;
        t.trapRank = payload.trapRank ?? payload.roomTier ?? 1;
        t.trapChargesRemaining = payload.trap ? trapChargesForTile(grid, t, x, y, getDoctrineEffects(s.doctrines), calcArtifactMods(s.artifacts, s.day), s.ashTrial) : 0;
        t.trapCooldownRemaining = payload.trapCooldownRemaining ?? 0;
        t.trapBroken = payload.trapBroken;
        t.ambushUsed = payload.ambushUsed;
        t.monsters = payload.monsters.map(m => ({
          ...m
        }));
      }
      const nextState = {
        ...s,
        grid,
        selected: {
          x,
          y
        },
        movePayload: null
      };
      return addLog(nextState, "Room moved.");
    }
    return {
      ...s,
      selected: {
        x,
        y
      }
    };
  });
  return nextState;
}
function clearTileTransition(state) {
  let nextState = state;
  const setState = updater => {
    nextState = typeof updater === "function" ? updater(nextState) : updater;
  };
  const locked = state.coreHp <= 0;
  const isBuildPhase = state.phase === "build";
  if (locked) return nextState;
  if (!isBuildPhase) {
    setState(s => addLog(s, "You can only clear tiles during the build phase."));
    return nextState;
  }
  if (state.movePayload) {
    setState(s => addLog(s, "Finish moving before clearing tiles."));
    return nextState;
  }
  setState(s => {
    const grid = cloneGrid(s.grid);
    const t = grid[s.selected.y][s.selected.x];
    if (t.entrance) return addLog(s, "Entrance cannot be cleared once placed.");
    if (isAshBreachAt(s.ashTrial, s.selected.x, s.selected.y)) return addLog(s, "Ash Breaches cannot be cleared while the trial is active.");
    const artifactMods = calcArtifactMods(s.artifacts, s.day);
    const invMonsters = [...s.invMonsters, ...t.monsters.map(m => prepareMonsterForInventory({
      ...m
    }, artifactMods))];
    t.entrance = false;
    t.core = false;
    t.room = null;
    t.roomType = null;
    t.roomTier = 1;
    t.trap = false;
    t.trapType = null;
    t.trapStar = 1;
    t.trapStars = 1;
    t.trapRank = 1;
    t.trapChargesRemaining = 0;
    t.trapCooldownRemaining = 0;
    t.trapBroken = false;
    t.ambushUsed = false;
    t.monsters = [];
    return addLog({
      ...s,
      grid,
      invMonsters
    }, `Cleared tile at (${s.selected.x + 1},${s.selected.y + 1}).`);
  });
  return nextState;
}
function _placeEntranceTransition(state) {
  let nextState = state;
  const setState = updater => {
    nextState = typeof updater === "function" ? updater(nextState) : updater;
  };
  const locked = state.coreHp <= 0;
  const isBuildPhase = state.phase === "build";
  if (locked) return nextState;
  if (!isBuildPhase) {
    setState(s => addLog(s, "You can only place rooms during the build phase."));
    return nextState;
  }
  if (state.movePayload) {
    setState(s => addLog(s, "Finish moving before placing rooms."));
    return nextState;
  }
  setState(s => {
    const {
      entrance: ent
    } = findEntranceAndCore(s.grid);
    if (ent) return addLog(s, "Entrance is fixed and cannot be moved.");
    if (isAshBreachAt(s.ashTrial, s.selected.x, s.selected.y)) return addLog(s, "Cannot place the Entrance on an Ash Breach.");
    const grid = cloneGrid(s.grid);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) grid[y][x].entrance = false;
    const t = grid[s.selected.y][s.selected.x];
    t.entrance = true;
    t.room = null;
    t.roomType = null;
    t.trap = false;
    t.trapType = null;
    t.trapStar = 1;
    t.trapStars = 1;
    t.trapRank = 1;
    t.trapChargesRemaining = 0;
    t.trapCooldownRemaining = 0;
    t.trapBroken = false;
    t.ambushUsed = false;
    const invMonsters = [...s.invMonsters, ...t.monsters.map(m => ({
      ...m
    }))];
    t.monsters = [];
    return addLog({
      ...s,
      grid,
      invMonsters
    }, `Entrance placed at (${s.selected.x + 1},${s.selected.y + 1}).`);
  });
  return nextState;
}
function _placeCoreTransition(state) {
  let nextState = state;
  const setState = updater => {
    nextState = typeof updater === "function" ? updater(nextState) : updater;
  };
  const locked = state.coreHp <= 0;
  const isBuildPhase = state.phase === "build";
  if (locked) return nextState;
  if (!isBuildPhase) {
    setState(s => addLog(s, "You can only place rooms during the build phase."));
    return nextState;
  }
  if (state.movePayload) {
    setState(s => addLog(s, "Finish moving before placing rooms."));
    return nextState;
  }
  setState(s => {
    const grid = cloneGrid(s.grid);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) grid[y][x].core = false;
    const t = grid[s.selected.y][s.selected.x];
    if (isAshBreachAt(s.ashTrial, s.selected.x, s.selected.y)) return addLog(s, "Cannot place the Core on an Ash Breach.");
    t.core = true;
    t.room = null;
    t.roomType = null;
    t.trap = false;
    t.trapType = null;
    t.trapStar = 1;
    t.trapStars = 1;
    t.trapRank = 1;
    t.trapChargesRemaining = 0;
    t.trapCooldownRemaining = 0;
    t.trapBroken = false;
    t.ambushUsed = false;
    const invMonsters = [...s.invMonsters, ...t.monsters.map(m => ({
      ...m
    }))];
    t.monsters = [];
    return addLog({
      ...s,
      grid,
      invMonsters
    }, `Core placed at (${s.selected.x + 1},${s.selected.y + 1}).`);
  });
  return nextState;
}
function buildTrapRoomTransition(state) {
  let nextState = state;
  const setState = updater => {
    nextState = typeof updater === "function" ? updater(nextState) : updater;
  };
  const locked = state.coreHp <= 0;
  const isBuildPhase = state.phase === "build";
  if (locked) return nextState;
  if (!isBuildPhase) {
    setState(s => addLog(s, "You can only build during the build phase."));
    return nextState;
  }
  if (state.movePayload) {
    setState(s => addLog(s, "Finish moving before building rooms."));
    return nextState;
  }
  setState(s => {
    const grid = cloneGrid(s.grid);
    const t = grid[s.selected.y][s.selected.x];
    if (isAshBreachAt(s.ashTrial, s.selected.x, s.selected.y)) return addLog(s, "Ash Breach tiles cannot hold rooms.");
    if (t.entrance || t.core) return addLog(s, "Cannot build on Entrance/Core.");
    if (t.room) return addLog(s, "That tile already has a room.");
    const cap = getDungeonRoomCap(s);
    if (countRooms(grid) >= cap) return addLog(s, `Room limit reached (${cap}).`);
    const trapStar = rollAuthoritativeStar(s.day);
    t.room = "trap";
    t.roomTier = 1;
    t.trap = true;
    t.trapType = s.selectedTrapType;
    t.trapStar = trapStar;
    t.trapStars = trapStar;
    t.trapRank = 1;
    t.trapChargesRemaining = trapChargesForTile(grid, t, s.selected.x, s.selected.y, getDoctrineEffects(s.doctrines), calcArtifactMods(s.artifacts, s.day), s.ashTrial);
    t.trapCooldownRemaining = 0;
    t.trapBroken = false;
    t.monsters = [];
    const trapName = TRAP_MAP[t.trapType]?.name || "Trap Room";
    return addLog({
      ...s,
      grid
    }, `Built ${trapName} at (${s.selected.x + 1},${s.selected.y + 1}) as ${formatStars(trapStar)} with ${t.trapChargesRemaining} charge(s).`);
  });
  return nextState;
}
function buildMonsterRoomTransition(state) {
  let nextState = state;
  const setState = updater => {
    nextState = typeof updater === "function" ? updater(nextState) : updater;
  };
  const locked = state.coreHp <= 0;
  const isBuildPhase = state.phase === "build";
  if (locked) return nextState;
  if (!isBuildPhase) {
    setState(s => addLog(s, "You can only build during the build phase."));
    return nextState;
  }
  if (state.movePayload) {
    setState(s => addLog(s, "Finish moving before building rooms."));
    return nextState;
  }
  setState(s => {
    const grid = cloneGrid(s.grid);
    const t = grid[s.selected.y][s.selected.x];
    if (isAshBreachAt(s.ashTrial, s.selected.x, s.selected.y)) return addLog(s, "Ash Breach tiles cannot hold rooms.");
    if (t.entrance || t.core) return addLog(s, "Cannot build on Entrance/Core.");
    if (t.room) return addLog(s, "That tile already has a room.");
    const cap = getDungeonRoomCap(s);
    if (countRooms(grid) >= cap) return addLog(s, `Room limit reached (${cap}).`);
    t.room = "monster";
    t.roomTier = 1;
    t.trap = false;
    t.roomType = s.selectedMonsterRoomType;
    t.ambushUsed = false;
    t.trapStar = 1;
    t.trapStars = 1;
    t.trapRank = 1;
    t.trapChargesRemaining = 0;
    t.trapCooldownRemaining = 0;
    t.monsters = [];
    const roomName = MONSTER_ROOM_MAP[t.roomType]?.name || "Monster Room";
    return addLog({
      ...s,
      grid
    }, `Built ${roomName} at (${s.selected.x + 1},${s.selected.y + 1}).`);
  });
  return nextState;
}
function buildUtilityRoomTransition(state) {
  let nextState = state;
  const setState = updater => {
    nextState = typeof updater === "function" ? updater(nextState) : updater;
  };
  const locked = state.coreHp <= 0;
  const isBuildPhase = state.phase === "build";
  if (locked) return nextState;
  if (!isBuildPhase) {
    setState(s => addLog(s, "You can only build during the build phase."));
    return nextState;
  }
  if (state.movePayload) {
    setState(s => addLog(s, "Finish moving before building rooms."));
    return nextState;
  }
  setState(s => {
    const grid = cloneGrid(s.grid);
    const t = grid[s.selected.y][s.selected.x];
    if (isAshBreachAt(s.ashTrial, s.selected.x, s.selected.y)) return addLog(s, "Ash Breach tiles cannot hold rooms.");
    if (t.entrance || t.core) return addLog(s, "Cannot build on Entrance/Core.");
    if (t.room) return addLog(s, "That tile already has a room.");
    const cap = getDungeonRoomCap(s);
    if (countRooms(grid) >= cap) return addLog(s, `Room limit reached (${cap}).`);
    t.room = "utility";
    t.roomTier = 1;
    t.roomType = s.selectedUtilityRoomType;
    t.trap = false;
    t.trapType = null;
    t.trapStar = 1;
    t.trapStars = 1;
    t.trapRank = 1;
    t.trapChargesRemaining = 0;
    t.trapCooldownRemaining = 0;
    t.trapBroken = false;
    t.monsters = [];
    const roomName = UTILITY_MAP[t.roomType]?.name || "Utility Room";
    return addLog({
      ...s,
      grid
    }, `Built ${roomName} at (${s.selected.x + 1},${s.selected.y + 1}).`);
  });
  return nextState;
}
function armTrapTransition(state) {
  let nextState = state;
  const setState = updater => {
    nextState = typeof updater === "function" ? updater(nextState) : updater;
  };
  const locked = state.coreHp <= 0;
  const isBuildPhase = state.phase === "build";
  if (locked) return nextState;
  if (!isBuildPhase) {
    setState(s => addLog(s, "You can only arm traps during the build phase."));
    return nextState;
  }
  if (state.movePayload) {
    setState(s => addLog(s, "Finish moving before arming traps."));
    return nextState;
  }
  setState(s => {
    const grid = cloneGrid(s.grid);
    const t = grid[s.selected.y][s.selected.x];
    if (t.room !== "trap") return addLog(s, "Select a trap room first.");
    t.trap = !t.trap;
    if (t.trap) {
      if (t.trapBroken) {
        t.trapBroken = false;
      }
      t.trapChargesRemaining = trapChargesForTile(grid, t, s.selected.x, s.selected.y, getDoctrineEffects(s.doctrines), calcArtifactMods(s.artifacts, s.day), s.ashTrial);
      t.trapCooldownRemaining = 0;
      return addLog({
        ...s,
        grid
      }, `Trap armed. ${t.trapChargesRemaining} charge(s) ready.`);
    }
    t.trapChargesRemaining = 0;
    t.trapCooldownRemaining = 0;
    return addLog({
      ...s,
      grid
    }, "Trap disarmed.");
  });
  return nextState;
}
function startMoveTransition(state) {
  let nextState = state;
  const setState = updater => {
    nextState = typeof updater === "function" ? updater(nextState) : updater;
  };
  const locked = state.coreHp <= 0;
  const isBuildPhase = state.phase === "build";
  if (locked) return nextState;
  if (!isBuildPhase) {
    setState(s => addLog(s, "You can only move rooms during the build phase."));
    return nextState;
  }
  setState(s => {
    const grid = cloneGrid(s.grid);
    const t = grid[s.selected.y][s.selected.x];
    if (t.entrance) return addLog(s, "Entrance cannot be moved.");
    if (t.core) {
      t.core = false;
      return addLog({
        ...s,
        grid,
        movePayload: {
          type: "core",
          origin: {
            ...s.selected
          }
        }
      }, "Core picked up. Select a new tile to place it.");
    }
    if (t.room) {
      const payload = {
        type: "room",
        room: t.room,
        roomType: t.roomType,
        roomTier: t.roomTier || 1,
        trap: t.trap,
        trapType: t.trapType,
        trapStar: t.trapStar ?? t.trapStars ?? 1,
        trapStars: t.trapStars,
        trapRank: t.trapRank ?? t.roomTier ?? 1,
        trapChargesRemaining: t.trapChargesRemaining ?? 0,
        trapCooldownRemaining: t.trapCooldownRemaining ?? 0,
        trapBroken: t.trapBroken,
        ambushUsed: t.ambushUsed,
        monsters: t.monsters.map(m => ({
          ...m
        })),
        origin: {
          ...s.selected
        }
      };
      t.room = null;
      t.roomType = null;
      t.roomTier = 1;
      t.trap = false;
      t.trapType = null;
      t.trapStar = 1;
      t.trapStars = 1;
      t.trapRank = 1;
      t.trapChargesRemaining = 0;
      t.trapCooldownRemaining = 0;
      t.trapBroken = false;
      t.ambushUsed = false;
      t.monsters = [];
      return addLog({
        ...s,
        grid,
        movePayload: payload
      }, "Room picked up. Select a new tile to place it.");
    }
    return addLog(s, "Select a room or the Core to move it.");
  });
  return nextState;
}
function cancelMoveTransition(state) {
  let nextState = state;
  const setState = updater => {
    nextState = typeof updater === "function" ? updater(nextState) : updater;
  };
  setState(s => {
    if (!s.movePayload) return s;
    const grid = cloneGrid(s.grid);
    const {
      origin
    } = s.movePayload;
    if (!origin) return {
      ...s,
      movePayload: null
    };
    const t = grid[origin.y][origin.x];
    if (t.entrance || t.core || t.room) {
      return addLog(s, "Cannot cancel move - original tile is occupied.");
    }
    if (s.movePayload.type === "core") {
      t.core = true;
    } else {
      t.room = s.movePayload.room;
      t.roomType = s.movePayload.roomType;
      t.roomTier = s.movePayload.roomTier || 1;
      t.trap = s.movePayload.trap;
      t.trapType = s.movePayload.trapType;
      t.trapStar = s.movePayload.trapStar ?? s.movePayload.trapStars ?? 1;
      t.trapStars = s.movePayload.trapStar ?? s.movePayload.trapStars ?? 1;
      t.trapRank = s.movePayload.trapRank ?? s.movePayload.roomTier ?? 1;
      t.trapChargesRemaining = s.movePayload.trapChargesRemaining ?? 0;
      t.trapCooldownRemaining = s.movePayload.trapCooldownRemaining ?? 0;
      t.trapBroken = s.movePayload.trapBroken;
      t.ambushUsed = s.movePayload.ambushUsed;
      t.monsters = s.movePayload.monsters.map(m => ({
        ...m
      }));
    }
    return addLog({
      ...s,
      grid,
      movePayload: null
    }, "Move canceled.");
  });
  return nextState;
}
function upgradeDungeonTransition(state) {
  let nextState = state;
  const setState = updater => {
    nextState = typeof updater === "function" ? updater(nextState) : updater;
  };
  const locked = state.coreHp <= 0;
  const isBuildPhase = state.phase === "build";
  if (locked) return nextState;
  if (!isBuildPhase) {
    setState(s => addLog(s, "You can only upgrade during the build phase."));
    return nextState;
  }
  setState(s => {
    if (s.raidActive) return addLog(s, "Cannot upgrade during a raid.");
    const currentLevel = clampDungeonLevel(s.dungeonLevel);
    if (currentLevel >= MAX_DUNGEON_LEVEL) {
      return addLog(s, `Dungeon already at maximum level (${MAX_DUNGEON_LEVEL}).`);
    }
    const cost = dungeonUpgradeCost(currentLevel, s.day, calcArtifactMods(s.artifacts, s.day));
    if (s.currency.essence < cost) return addLog(s, `Not enough Essence to upgrade (${cost}).`);
    const dungeonLevel = currentLevel + 1;
    return addLog({
      ...s,
      currency: {
        ...s.currency,
        essence: s.currency.essence - cost
      },
      dungeonLevel
    }, `Dungeon upgraded to Level ${dungeonLevel}.`);
  });
  return nextState;
}
function upgradeDoctrineTransition(state, kind) {
  let nextState = state;
  const setState = updater => {
    nextState = typeof updater === "function" ? updater(nextState) : updater;
  };
  const locked = state.coreHp <= 0;
  const isBuildPhase = state.phase === "build";
  if (locked) return nextState;
  if (!isBuildPhase) {
    setState(s => addLog(s, "Doctrines can only be advanced during the build phase."));
    return nextState;
  }
  setState(s => {
    const rule = DOCTRINE_RULES[kind];
    if (!rule) return s;
    const currentLevel = s.doctrines?.[kind] || 0;
    const nextLevelDef = rule.levels[currentLevel];
    if (!nextLevelDef) return addLog(s, `${rule.name} is already mastered.`);
    const currencyKey = rule.currency;
    const cost = doctrineUpgradeCost(rule, currentLevel, calcArtifactMods(s.artifacts, s.day));
    if ((s.currency?.[currencyKey] || 0) < cost) {
      return addLog(s, `Not enough ${currencyKey} for ${rule.name} (${cost}).`);
    }
    const doctrines = {
      ...(s.doctrines || {}),
      [kind]: currentLevel + 1
    };
    const currency = {
      ...s.currency,
      [currencyKey]: (s.currency?.[currencyKey] || 0) - cost
    };
    let coreHp = s.coreHp;
    if (kind === "core") {
      const previousMax = getCoreMaxHp(s);
      const nextMax = getCoreMaxHp({
        ...s,
        doctrines
      });
      coreHp = Math.min(nextMax, Math.max(1, coreHp + (nextMax - previousMax)));
    }
    return addLog({
      ...s,
      doctrines,
      currency,
      coreHp
    }, `${rule.name} advanced to ${currentLevel + 1}/${rule.levels.length}. ${nextLevelDef.desc}`);
  });
  return nextState;
}
function upgradeRoomTransition(state) {
  let nextState = state;
  const setState = updater => {
    nextState = typeof updater === "function" ? updater(nextState) : updater;
  };
  const locked = state.coreHp <= 0;
  const isBuildPhase = state.phase === "build";
  if (locked) return nextState;
  if (!isBuildPhase) {
    setState(s => addLog(s, "You can only upgrade rooms during the build phase."));
    return nextState;
  }
  if (state.movePayload) {
    setState(s => addLog(s, "Finish moving before upgrading rooms."));
    return nextState;
  }
  setState(s => {
    const grid = cloneGrid(s.grid);
    const t = grid[s.selected.y][s.selected.x];
    if (!t.room) return addLog(s, "Select a room to upgrade.");
    const tier = t.roomTier || 1;
    if (tier >= ROOM_TIER_MAX) return addLog(s, "Room is already at max tier.");
    const cost = scaleByDay(roomUpgradeCost(tier), s.day, 0.03, 3.0);
    if (s.currency.essence < cost) return addLog(s, `Not enough Essence (${cost}).`);
    const nextTier = tier + 1;
    t.roomTier = nextTier;
    if (t.room === "trap") {
      t.trapRank = nextTier;
      if (t.trap) {
        t.trapChargesRemaining = trapChargesForTile(grid, t, s.selected.x, s.selected.y, getDoctrineEffects(s.doctrines), calcArtifactMods(s.artifacts, s.day), s.ashTrial);
        t.trapCooldownRemaining = 0;
      }
    }
    if (t.room === "monster") {
      t.monsters = t.monsters.map(monster => applyMonsterRoomPlacement(monster, t.roomType, nextTier));
    }
    const currency = {
      ...s.currency,
      essence: s.currency.essence - cost
    };
    if (t.room === "trap") {
      return addLog({
        ...s,
        grid,
        currency
      }, `Upgraded trap room to Tier ${nextTier}. Rank ${t.trapRank} increases trigger damage and recovery.`);
    }
    return addLog({
      ...s,
      grid,
      currency
    }, `Upgraded room to Tier ${nextTier}.`);
  });
  return nextState;
}

export { roomUpgradeCost, setSelectedTransition, clearTileTransition, _placeEntranceTransition, _placeCoreTransition, buildTrapRoomTransition, buildMonsterRoomTransition, buildUtilityRoomTransition, armTrapTransition, startMoveTransition, cancelMoveTransition, upgradeDungeonTransition, upgradeDoctrineTransition, upgradeRoomTransition };
