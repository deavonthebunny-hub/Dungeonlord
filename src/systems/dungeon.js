import { MONSTER_ROOMS, TRAP_TYPES, UTILITY_ROOMS } from "../gameContent";
import { calcArtifactMods, getDoctrineEffects } from "./economy";
import { H, W, clamp, clampMonsterStar, nextCouncilDayAfter } from "./shared";

const UTILITY_MAP = Object.fromEntries(UTILITY_ROOMS.map((r) => [r.key, r]));
const MONSTER_ROOM_MAP = Object.fromEntries(MONSTER_ROOMS.map((r) => [r.key, r]));
const TRAP_MAP = Object.fromEntries(TRAP_TYPES.map((r) => [r.key, r]));
const SYNERGY_TAGS = new Set(["Blood", "Ward", "Hunt"]);
function roomDefinitionForTile(tile) {
  if (!tile?.room) return null;
  if (tile.room === "trap") return TRAP_MAP[tile.trapType] || null;
  if (tile.room === "monster") return MONSTER_ROOM_MAP[tile.roomType] || null;
  if (tile.room === "utility") return UTILITY_MAP[tile.roomType] || null;
  return null;
}
function radarNoise(seed) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}
function roomSynergyTag(tile) {
  const tag = roomDefinitionForTile(tile)?.synergyTag || null;
  return SYNERGY_TAGS.has(tag) ? tag : null;
}
function isLinkedRoom(grid, x, y) {
  const tile = grid?.[y]?.[x];
  const tag = roomSynergyTag(tile);
  if (!tag) return false;
  return neighbors(x, y).some((pos) => roomSynergyTag(grid?.[pos.y]?.[pos.x]) === tag);
}
function roomLinkInfoAt(grid, x, y) {
  const tile = grid?.[y]?.[x];
  const def = roomDefinitionForTile(tile);
  const tag = roomSynergyTag(tile);
  return {
    tag,
    linked: tag ? isLinkedRoom(grid, x, y) : false,
    baseDesc: def?.baseDesc || "",
    linkDesc: def?.linkDesc || "",
  };
}
function createEmptyAshTrial() {
  return {
    active: false,
    difficulty: null,
    breaches: [],
    raidsCompleted: 0,
    requiredRaids: 0,
    expiresDay: 0,
  };
}
function normalizeAshTrial(raw, day = 1) {
  if (!raw || !raw.active || !Array.isArray(raw.breaches)) return createEmptyAshTrial();
  const breaches = raw.breaches
    .filter((breach) => Number.isFinite(breach?.x) && Number.isFinite(breach?.y))
    .map((breach) => ({
      x: clamp(breach.x, 0, W - 1),
      y: clamp(breach.y, 0, H - 1),
      openedDay: Number.isFinite(breach.openedDay) ? breach.openedDay : day,
    }));
  const expiresDay = Number.isFinite(raw.expiresDay) ? raw.expiresDay : nextCouncilDayAfter(day);
  const requiredRaids = Math.max(1, raw.requiredRaids || 2);
  if (!breaches.length || expiresDay <= day) return createEmptyAshTrial();
  return {
    active: true,
    difficulty: raw.difficulty || "standard",
    breaches,
    raidsCompleted: clamp(raw.raidsCompleted || 0, 0, requiredRaids),
    requiredRaids,
    expiresDay,
  };
}
function isAshTrialActive(ashTrial) {
  return !!(ashTrial?.active && Array.isArray(ashTrial.breaches) && ashTrial.breaches.length > 0);
}
function isAshBreachAt(ashTrial, x, y) {
  if (!isAshTrialActive(ashTrial)) return false;
  return ashTrial.breaches.some((breach) => breach.x === x && breach.y === y);
}
function trapChargesForStar(star, doctrineEffects = null) {
  return 1 + Math.floor((clampMonsterStar(star) - 1) / 2) + (doctrineEffects?.trapChargeBonus || 0);
}
function trapCooldownAfterTrigger(trapType, star, doctrineEffects = null) {
  const baseCooldown = TRAP_MAP[trapType]?.baseCooldown ?? 1;
  return Math.max(0, baseCooldown - Math.floor((clampMonsterStar(star) - 1) / 2) - (doctrineEffects?.trapCooldownReduction || 0));
}
function trapChargesForTile(grid, tile, x, y, doctrineEffects = null, artifactMods = null, ashTrial = null) {
  const star = clampMonsterStar(tile?.trapStar ?? tile?.trapStars ?? 1);
  const bonus =
    (doctrineEffects?.trapChargeBonus || 0) +
    (artifactMods?.trapChargeBonus || 0) +
    (isAshTrialActive(ashTrial) ? artifactMods?.ashTrialTrapChargeBonus || 0 : 0) +
    (Number.isFinite(x) && Number.isFinite(y) ? wardTrapChargeBonusAt(grid, x, y, artifactMods || {}) : 0);
  return trapChargesForStar(star, {
    ...(doctrineEffects || {}),
    trapChargeBonus: bonus,
  });
}
function resetArmedTrapsForRaid(grid, stateLike) {
  const doctrineEffects = getDoctrineEffects(stateLike?.doctrines || {});
  const artifactMods = calcArtifactMods(stateLike?.artifacts || [], stateLike?.day || 1);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const t = grid?.[y]?.[x];
      if (!t || t.room !== "trap") continue;
      const trapStar = t.trapStar ?? t.trapStars ?? 1;
      t.trapStar = trapStar;
      t.trapStars = trapStar;
      t.trapRank = Math.max(1, t.trapRank ?? t.roomTier ?? 1);
      if (t.trap && !t.trapBroken) {
        t.trapChargesRemaining = trapChargesForTile(grid, t, x, y, doctrineEffects, artifactMods, stateLike?.ashTrial);
        t.trapCooldownRemaining = 0;
      } else {
        t.trapChargesRemaining = 0;
        t.trapCooldownRemaining = 0;
      }
    }
  }
  return grid;
}
function initStartingGrid() {
  const grid = makeGrid();
  grid[0][0].entrance = true;
  const room = grid[0][1];
  room.room = "monster";
  room.roomType = MONSTER_ROOMS[0].key;
  room.roomTier = 1;
  room.monsters = [];
  grid[0][2].core = true;
  return grid;
}
function makeTile() {
  return {
    entrance: false,
    core: false,
    room: null, // "trap" | "monster" | null
    roomType: null,
    roomTier: 1,
    trap: false,
    trapType: null,
    trapStar: 1,
    trapStars: 1,
    trapRank: 1,
    trapChargesRemaining: 0,
    trapCooldownRemaining: 0,
    trapBroken: false,
    ambushUsed: false,
    monsters: [], // {key,name,icon,hp,atk}
  };
}
function makeGrid() {
  return Array.from({ length: H }, () => Array.from({ length: W }, () => makeTile()));
}
function cloneGrid(grid) {
  return grid.map((row) =>
    row.map((t) => ({
      entrance: t.entrance,
      core: t.core,
      room: t.room,
      roomType: t.roomType,
      roomTier: t.roomTier ?? 1,
      trap: t.trap,
      trapType: t.trapType,
      trapStar: t.trapStar ?? t.trapStars ?? 1,
      trapStars: t.trapStars,
      trapRank: t.trapRank ?? t.roomTier ?? 1,
      trapChargesRemaining: t.trapChargesRemaining ?? (t.trap ? trapChargesForStar(t.trapStar ?? t.trapStars ?? 1) : 0),
      trapCooldownRemaining: t.trapCooldownRemaining ?? 0,
      trapBroken: t.trapBroken,
      ambushUsed: t.ambushUsed,
      monsters: t.monsters.map((m) => ({ ...m })),
    }))
  );
}
function keyOf(x, y) {
  return `${x},${y}`;
}
function neighbors(x, y) {
  const pts = [];
  if (x > 0) pts.push({ x: x - 1, y });
  if (x < W - 1) pts.push({ x: x + 1, y });
  if (y > 0) pts.push({ x, y: y - 1 });
  if (y < H - 1) pts.push({ x, y: y + 1 });
  return pts;
}
function inAuraRange(ax, ay, bx, by) {
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by)) <= 1;
}
function ashBreachRequirementText(count) {
  if (count <= 1) return "Requires 1 valid edge tile within 2 steps of a trap or monster room.";
  return `Requires ${count} valid edge tiles within 2 steps of trap/monster rooms.`;
}
function hasAshBreachAnchorNearby(grid, x, y) {
  for (let ny = 0; ny < H; ny += 1) {
    for (let nx = 0; nx < W; nx += 1) {
      const tile = grid[ny][nx];
      if (tile.room !== "trap" && tile.room !== "monster") continue;
      if (Math.abs(nx - x) + Math.abs(ny - y) <= 2) return true;
    }
  }
  return false;
}
function getAshBreachCandidates(grid) {
  const activeEntrances = getActiveEntrances(grid, null);
  const edgeCells = [];
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      if (x !== 0 && x !== W - 1 && y !== 0 && y !== H - 1) continue;
      edgeCells.push({ x, y });
    }
  }
  return edgeCells.filter((pos) => {
    const tile = grid[pos.y][pos.x];
    if (tile.core || tile.entrance || tile.room) return false;
    if (activeEntrances.some((entry) => inAuraRange(entry.x, entry.y, pos.x, pos.y))) return false;
    if (!hasAshBreachAnchorNearby(grid, pos.x, pos.y)) return false;
    return true;
  });
}
function canPlaceAshBreaches(grid, count) {
  const needed = Math.max(1, count || 1);
  const candidates = getAshBreachCandidates(grid);
  if (candidates.length < needed) return false;
  if (needed === 1) return true;
  const chosen = [];
  function search(start) {
    if (chosen.length >= needed) return true;
    for (let i = start; i < candidates.length; i += 1) {
      const candidate = candidates[i];
      if (chosen.some((entry) => inAuraRange(entry.x, entry.y, candidate.x, candidate.y))) continue;
      chosen.push(candidate);
      if (search(i + 1)) return true;
      chosen.pop();
    }
    return false;
  }
  return search(0);
}
function utilityTier(grid, x, y, key) {
  let tier = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
      const t = grid[ny][nx];
      if (t.room === "utility" && t.roomType === key) {
        tier = Math.max(tier, t.roomTier || 1);
      }
    }
  }
  return tier;
}
function linkedUtilityTier(grid, x, y, key) {
  let tier = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
      const tile = grid[ny]?.[nx];
      if (tile?.room === "utility" && tile.roomType === key && isLinkedRoom(grid, nx, ny)) {
        tier = Math.max(tier, tile.roomTier || 1);
      }
    }
  }
  return tier;
}
function orthogonalUtilityTier(grid, x, y, key, linkedOnly = false) {
  let tier = 0;
  for (const pos of neighbors(x, y)) {
    const tile = grid[pos.y]?.[pos.x];
    if (tile?.room !== "utility" || tile.roomType !== key) continue;
    if (linkedOnly && !isLinkedRoom(grid, pos.x, pos.y)) continue;
    tier = Math.max(tier, tile.roomTier || 1);
  }
  return tier;
}
function anyLinkedUtilityRoom(grid, key) {
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const tile = grid[y]?.[x];
      if (tile?.room === "utility" && tile.roomType === key && isLinkedRoom(grid, x, y)) {
        return true;
      }
    }
  }
  return false;
}
function roomLureBonusAt(grid, x, y, artifactMods = {}) {
  const tile = grid?.[y]?.[x];
  let bonus = utilityTier(grid, x, y, "scent-beacon") > 0 ? 1 : 0;
  if (tile?.room && roomSynergyTag(tile) === "Hunt" && isLinkedRoom(grid, x, y)) {
    bonus += artifactMods.huntLinkedLureBonus || 0;
  }
  return bonus;
}
function huntScoutRevealBonus(grid, artifactMods = {}) {
  return anyLinkedUtilityRoom(grid, "scent-beacon") ? 1 + (artifactMods.huntLinkedScoutRevealBonus || 0) : 0;
}
function bloodDeathBonuses(grid, x, y, why, artifactMods = {}) {
  const tile = grid?.[y]?.[x];
  const trapKill = why === "trap" || why === "arrows";
  const linkInfo = roomLinkInfoAt(grid, x, y);
  let extraEssence = utilityTier(grid, x, y, "butchers-shrine") > 0 ? 1 : 0;
  let extraSoulshards = trapKill && linkedUtilityTier(grid, x, y, "butchers-shrine") > 0 ? 1 : 0;
  if (linkInfo.linked && linkInfo.tag === "Blood") {
    extraEssence += artifactMods.bloodLinkedEssenceBonus || 0;
    extraSoulshards += artifactMods.bloodLinkedSoulshardOnKill || 0;
    if (trapKill) {
      extraSoulshards += artifactMods.bloodLinkedTrapKillSoulshard || 0;
      if (tile?.room === "trap" && tile.trapType === "gore-channel") {
        extraEssence += 10;
      }
    }
  }
  return { extraEssence, extraSoulshards };
}
function wardMonsterDefBonus(grid, x, y, artifactMods = {}) {
  const tile = grid?.[y]?.[x];
  if (tile?.room !== "monster") return 0;
  let bonus = 0;
  if (tile.roomType === "bulwark-hall" && isLinkedRoom(grid, x, y)) {
    bonus += 1;
  }
  if (roomSynergyTag(tile) === "Ward" && isLinkedRoom(grid, x, y)) {
    bonus += artifactMods.wardLinkedMonsterDef || 0;
  }
  return bonus;
}
function wardTrapChargeBonusAt(grid, x, y, artifactMods = {}) {
  const tile = grid?.[y]?.[x];
  let bonus = linkedUtilityTier(grid, x, y, "aegis-lantern") > 0 ? 1 : 0;
  if (tile?.room === "trap" && roomSynergyTag(tile) === "Ward" && isLinkedRoom(grid, x, y)) {
    bonus += artifactMods.wardLinkedTrapChargeBonus || 0;
  }
  return bonus;
}
function huntTrapFlatDamageBonus(grid, x, y, artifactMods = {}) {
  const tile = grid?.[y]?.[x];
  if (tile?.room === "trap" && roomSynergyTag(tile) === "Hunt" && isLinkedRoom(grid, x, y)) {
    return artifactMods.huntLinkedTrapFlatDamage || 0;
  }
  return 0;
}
function bloodMonsterAtkBonus(grid, x, y, artifactMods = {}) {
  const tile = grid?.[y]?.[x];
  if (tile?.room === "monster" && roomSynergyTag(tile) === "Blood" && isLinkedRoom(grid, x, y)) {
    return artifactMods.bloodLinkedMonsterAtk || 0;
  }
  return 0;
}
function huntMonsterSpdBonus(grid, x, y, artifactMods = {}) {
  const tile = grid?.[y]?.[x];
  if (tile?.room === "monster" && roomSynergyTag(tile) === "Hunt" && isLinkedRoom(grid, x, y)) {
    return artifactMods.huntLinkedMonsterSpd || 0;
  }
  return 0;
}
function hasUtilityAura(grid, x, y, key) {
  return utilityTier(grid, x, y, key) > 0;
}
function tileWalkable(t) {
  return t.entrance || t.core || t.room === "trap" || t.room === "monster";
}
function findEntranceAndCore(grid) {
  let entrance = null;
  let core = null;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (grid[y][x].entrance) entrance = { x, y };
      if (grid[y][x].core) core = { x, y };
    }
  }
  return { entrance, core };
}
function getActiveEntrances(grid, ashTrial) {
  const { entrance } = findEntranceAndCore(grid);
  const entries = [];
  if (entrance) entries.push({ ...entrance, kind: "main" });
  if (isAshTrialActive(ashTrial)) {
    for (const breach of ashTrial.breaches) {
      entries.push({ x: breach.x, y: breach.y, kind: "ash-breach" });
    }
  }
  return entries;
}
function anyUtilityRoom(grid, key) {
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const t = grid[y][x];
      if (t.room === "utility" && t.roomType === key) return true;
    }
  }
  return false;
}
function maxUtilityTier(grid, key) {
  let tier = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const t = grid[y][x];
      if (t.room === "utility" && t.roomType === key) {
        tier = Math.max(tier, t.roomTier || 1);
      }
    }
  }
  return tier;
}
function resetLayoutKeepStructure(grid) {
  const g = cloneGrid(grid);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const t = g[y][x];
      t.roomTier = t.roomTier || 1;
      if (t.room === "trap") {
        t.trap = true;
        t.trapStar = t.trapStar || t.trapStars || 1;
        t.trapStars = t.trapStar;
        t.trapRank = t.trapRank || t.roomTier || 1;
        t.trapChargesRemaining = trapChargesForStar(t.trapStar);
        t.trapCooldownRemaining = 0;
        t.trapBroken = false;
        t.monsters = [];
      } else if (t.room === "monster") {
        t.trap = false;
        t.trapStar = 1;
        t.trapStars = 1;
        t.trapRank = 1;
        t.trapChargesRemaining = 0;
        t.trapCooldownRemaining = 0;
        t.ambushUsed = false;
        t.monsters = [];
      } else {
        t.trap = false;
        t.trapStar = 1;
        t.trapStars = 1;
        t.trapRank = 1;
        t.trapChargesRemaining = 0;
        t.trapCooldownRemaining = 0;
        t.trapBroken = false;
        t.ambushUsed = false;
        t.monsters = [];
      }
    }
  }
  return g;
}

export { UTILITY_MAP, MONSTER_ROOM_MAP, TRAP_MAP, SYNERGY_TAGS, roomDefinitionForTile, radarNoise, roomSynergyTag, isLinkedRoom, roomLinkInfoAt, createEmptyAshTrial, normalizeAshTrial, isAshTrialActive, isAshBreachAt, trapChargesForStar, trapCooldownAfterTrigger, trapChargesForTile, resetArmedTrapsForRaid, initStartingGrid, makeTile, makeGrid, cloneGrid, keyOf, neighbors, inAuraRange, ashBreachRequirementText, hasAshBreachAnchorNearby, getAshBreachCandidates, canPlaceAshBreaches, utilityTier, linkedUtilityTier, orthogonalUtilityTier, anyLinkedUtilityRoom, roomLureBonusAt, huntScoutRevealBonus, bloodDeathBonuses, wardMonsterDefBonus, wardTrapChargeBonusAt, huntTrapFlatDamageBonus, bloodMonsterAtkBonus, huntMonsterSpdBonus, hasUtilityAura, tileWalkable, findEntranceAndCore, getActiveEntrances, anyUtilityRoom, maxUtilityTier, resetLayoutKeepStructure };
