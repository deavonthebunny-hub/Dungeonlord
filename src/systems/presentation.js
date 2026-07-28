import { RAID_TYPE_META } from "../gameContent";
import { isAshBreachAt } from "./dungeon";
import { H, W } from "./shared";

const UTILITY_ICONS = {
  "soul-altar": "SA",
  "siphon-pylon": "SP",
  "reinforced-keystone": "RK",
  "blood-sigil": "BS",
  "war-drum": "WD",
  "haste-glyph": "HG",
  "fear-idol": "FI",
  "ward-lantern": "WL",
  "seal-silence": "SS",
  "scout-mirror": "SM",
  "butchers-shrine": "BT",
  "aegis-lantern": "AL",
  "scent-beacon": "SB",
};
const MONSTER_ROOM_ICONS = {
  "training-den": "TD",
  "thick-hide": "TH",
  "rally-banner": "RB",
  "ambush-alcove": "AA",
  "savage-kennels": "SK",
  "hex-circle": "HC",
  "pack-tactics": "PT",
  "brawlers-ring": "BR",
  "carnage-pit": "CP",
  "bulwark-hall": "BH",
  "pack-blind": "PB",
};
const TRAP_ICONS = {
  "spike-pit": "SP",
  "poison-vent": "PV",
  "frost-rune": "FR",
  "shock-coil": "SC",
  "snare-net": "SN",
  "flame-jet": "FJ",
  "cursed-brand": "CB",
  "blink-trap": "BT",
  "shatter-floor": "SF",
  "arrow-gallery": "AG",
  "gore-channel": "GC",
  "warding-sigil": "WS",
  "murder-holes": "MH",
};
const TRAP_GLYPHS = {
  "flame-jet": { unarmed: "\u2668", armed: "\u2668" },
  "poison-vent": { unarmed: "\u2623", armed: "\u2623" },
  "frost-rune": { unarmed: "\u2744", armed: "\u2744" },
  "shock-coil": { unarmed: "\u26A1", armed: "\u26A1" },
  "spike-pit": { unarmed: "\u25BC", armed: "\u25BC" },
  "snare-net": { unarmed: "\u25A6", armed: "\u25A6" },
  "cursed-brand": { unarmed: "\u2297", armed: "\u2297" },
  "blink-trap": { unarmed: "\u25C9", armed: "\u25C9" },
  "shatter-floor": { unarmed: "\u25A7", armed: "\u25A7" },
  "arrow-gallery": { unarmed: "\u27B5", armed: "\u27B5" },
  "gore-channel": { unarmed: "GC", armed: "GC" },
  "warding-sigil": { unarmed: "WS", armed: "WS" },
  "murder-holes": { unarmed: "MH", armed: "MH" },
};
const UTILITY_GLYPHS = {
  "soul-altar": "\u2727",
  "siphon-pylon": "\u03A8",
  "reinforced-keystone": "\u2302",
  "blood-sigil": "\u271A",
  "war-drum": "\u266B",
  "haste-glyph": "\u00BB",
  "fear-idol": "\u2620",
  "ward-lantern": "\u263C",
  "seal-silence": "\u26D4",
  "scout-mirror": "\u25C8",
  "butchers-shrine": "BT",
  "aegis-lantern": "AL",
  "scent-beacon": "SB",
};
const TILE_ART_BASE = `${import.meta.env.BASE_URL}assets/tiles/path/`;
const TILE_ART_SOURCES = {
  isolated: `${TILE_ART_BASE}isolated.png`,
  "dead-end": `${TILE_ART_BASE}dead-end.png`,
  straight: `${TILE_ART_BASE}straight.png`,
  corner: `${TILE_ART_BASE}corner.png`,
  tee: `${TILE_ART_BASE}tee.png`,
  cross: `${TILE_ART_BASE}cross.png`,
};
const SUPPORT_TILE_ART_BASE = `${import.meta.env.BASE_URL}assets/tiles/support/`;
const SUPPORT_TILE_ART_SOURCES = {
  base: `${SUPPORT_TILE_ART_BASE}sanctum-base.png`,
  centerpiece: {
    "soul-altar": `${SUPPORT_TILE_ART_BASE}soul-altar.png`,
    "siphon-pylon": `${SUPPORT_TILE_ART_BASE}siphon-pylon.png`,
    "reinforced-keystone": `${SUPPORT_TILE_ART_BASE}reinforced-keystone.png`,
    "blood-sigil": `${SUPPORT_TILE_ART_BASE}blood-sigil.png`,
    "war-drum": `${SUPPORT_TILE_ART_BASE}war-drum.png`,
    "haste-glyph": `${SUPPORT_TILE_ART_BASE}haste-glyph.png`,
    "fear-idol": `${SUPPORT_TILE_ART_BASE}fear-idol.png`,
    "ward-lantern": `${SUPPORT_TILE_ART_BASE}ward-lantern.png`,
    "seal-silence": `${SUPPORT_TILE_ART_BASE}seal-silence.png`,
    "scout-mirror": `${SUPPORT_TILE_ART_BASE}scout-mirror.png`,
    "butchers-shrine": `${SUPPORT_TILE_ART_BASE}butchers-shrine.png`,
    "aegis-lantern": `${SUPPORT_TILE_ART_BASE}aegis-lantern.png`,
    "scent-beacon": `${SUPPORT_TILE_ART_BASE}scent-beacon.png`,
  },
};
const TILE_MARKER_BASE = `${import.meta.env.BASE_URL}assets/tiles/markers/`;
const TILE_CENTER_MARKERS = {
  entrance: `${TILE_MARKER_BASE}entrance-door.png`,
  core: `${TILE_MARKER_BASE}core-crystal.png`,
  ash: `${TILE_MARKER_BASE}ash-breach-rift.png`,
};
const EMPTY_TILE_ART_SRC = `${import.meta.env.BASE_URL}assets/tiles/empty/unexcavated-stone.png`;
const TILE_RADAR_MAX_DOTS = 4;
const TILE_RADAR_SLOTS = {
  monster: [
    { x: 26, y: 28 },
    { x: 20, y: 46 },
    { x: 40, y: 56 },
    { x: 58, y: 34 },
  ],
  hero: [
    { x: 72, y: 30 },
    { x: 78, y: 46 },
    { x: 60, y: 54 },
    { x: 68, y: 66 },
  ],
};
function isArtPathTile(grid, ashTrial, x, y) {
  const tile = grid?.[y]?.[x];
  if (!tile) return false;
  return isAshBreachAt(ashTrial, x, y) || tile.entrance || tile.core || tile.room === "trap" || tile.room === "monster";
}
function getTraversableExitMask(grid, ashTrial, x, y) {
  return {
    up: y > 0 && isArtPathTile(grid, ashTrial, x, y - 1),
    right: x < W - 1 && isArtPathTile(grid, ashTrial, x + 1, y),
    down: y < H - 1 && isArtPathTile(grid, ashTrial, x, y + 1),
    left: x > 0 && isArtPathTile(grid, ashTrial, x - 1, y),
  };
}
function exitCount(mask) {
  return (mask.up ? 1 : 0) + (mask.right ? 1 : 0) + (mask.down ? 1 : 0) + (mask.left ? 1 : 0);
}
function topologyFromExitMask(mask) {
  const count = exitCount(mask);
  if (count <= 0) return "isolated";
  if (count === 1) return "dead-end";
  if (count === 2) {
    if ((mask.up && mask.down) || (mask.left && mask.right)) return "straight";
    return "corner";
  }
  if (count === 3) return "tee";
  return "cross";
}
function rotationFromExitMask(mask, topology) {
  if (topology === "isolated" || topology === "cross") return 0;
  if (topology === "dead-end") {
    if (mask.up) return 0;
    if (mask.right) return 90;
    if (mask.down) return 180;
    return 270;
  }
  if (topology === "straight") {
    return mask.up && mask.down ? 0 : 90;
  }
  if (topology === "corner") {
    if (mask.up && mask.right) return 0;
    if (mask.right && mask.down) return 90;
    if (mask.down && mask.left) return 180;
    return 270;
  }
  if (topology === "tee") {
    if (!mask.down) return 0;
    if (!mask.left) return 90;
    if (!mask.up) return 180;
    return 270;
  }
  return 0;
}
function getTileArtSpec(tile, x, y, grid, ashTrial, brokenSources = null) {
  if (!isArtPathTile(grid, ashTrial, x, y)) {
    return { enabled: false, topology: null, rotationDeg: 0, src: null, fallbackToGlyph: true };
  }
  const mask = getTraversableExitMask(grid, ashTrial, x, y);
  const topology = topologyFromExitMask(mask);
  const src = TILE_ART_SOURCES[topology] || null;
  const fallbackToGlyph = !src || !!brokenSources?.[src];
  return {
    enabled: !!src,
    topology,
    rotationDeg: rotationFromExitMask(mask, topology),
    src,
    fallbackToGlyph,
  };
}
function getUtilityArtSpec(tile, brokenSources = null) {
  if (tile?.room !== "utility") {
    return { enabled: false, baseSrc: null, centerpieceSrc: null, fallbackToGlyph: true };
  }
  const baseSrc = SUPPORT_TILE_ART_SOURCES.base || null;
  const centerpieceSrc = SUPPORT_TILE_ART_SOURCES.centerpiece?.[tile.roomType] || null;
  const fallbackToGlyph =
    !baseSrc ||
    !centerpieceSrc ||
    !!brokenSources?.[baseSrc] ||
    !!brokenSources?.[centerpieceSrc];
  return {
    enabled: !!baseSrc && !!centerpieceSrc,
    baseSrc,
    centerpieceSrc,
    fallbackToGlyph,
  };
}
function getEmptyTileArtSpec(tile, x, y, ashTrial, brokenSources = null) {
  if (tile?.room || tile?.entrance || tile?.core || isAshBreachAt(ashTrial, x, y)) {
    return { enabled: false, src: null, fallbackToGlyph: true };
  }
  return {
    enabled: !!EMPTY_TILE_ART_SRC,
    src: EMPTY_TILE_ART_SRC,
    fallbackToGlyph: !EMPTY_TILE_ART_SRC || !!brokenSources?.[EMPTY_TILE_ART_SRC],
  };
}
function getTileCenterMarkerSpec(tile, x, y, ashTrial, brokenSources = null) {
  const src = isAshBreachAt(ashTrial, x, y)
    ? TILE_CENTER_MARKERS.ash
    : tile?.entrance
    ? TILE_CENTER_MARKERS.entrance
    : tile?.core
    ? TILE_CENTER_MARKERS.core
    : null;
  return {
    enabled: !!src && !brokenSources?.[src],
    src,
  };
}
function invaderLabel(entity) {
  if (!entity) return "Invader";
  if (entity.unitKind === "council-raider") {
    const prefix = entity.factionName ? entity.factionName.split(" ")[0] : "Raider";
    return `${prefix}#${entity.id}`;
  }
  if (entity.raidOriginLabel === RAID_TYPE_META.elite.label) return `Elite#${entity.id}`;
  return `Hero#${entity.id}`;
}
function invaderPassiveSummary(entity) {
  if (!entity) return "None";
  if (entity.unitKind === "council-raider" && entity.traitPassiveName) {
    return String(entity.passive || "").includes(entity.traitPassiveName)
      ? entity.passive
      : `${entity.passive || "None"} | Faction Trait ${entity.traitPassiveName}`;
  }
  return entity.passive || "None";
}

export { UTILITY_ICONS, MONSTER_ROOM_ICONS, TRAP_ICONS, TRAP_GLYPHS, UTILITY_GLYPHS, TILE_ART_BASE, TILE_ART_SOURCES, SUPPORT_TILE_ART_BASE, SUPPORT_TILE_ART_SOURCES, TILE_MARKER_BASE, TILE_CENTER_MARKERS, EMPTY_TILE_ART_SRC, TILE_RADAR_MAX_DOTS, TILE_RADAR_SLOTS, isArtPathTile, getTraversableExitMask, exitCount, topologyFromExitMask, rotationFromExitMask, getTileArtSpec, getUtilityArtSpec, getEmptyTileArtSpec, getTileCenterMarkerSpec, invaderLabel, invaderPassiveSummary };
