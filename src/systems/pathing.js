import { COUNCIL_RAID_FACTIONS, RAID_TYPE_META } from "../gameContent";
import { randomFloat } from "../random";
import { TRAP_MAP, findEntranceAndCore, getActiveEntrances, getAshBreachCandidates, inAuraRange, keyOf, neighbors, roomLureBonusAt, tileWalkable } from "./dungeon";
import { buildRaidModifiers, createHeroMemory, getHeroArchetypeRule, getRaidDirectiveRule, normalizeRaidIntel } from "./raids";
import { H, W, clampMonsterStar, formatGridPos } from "./shared";

function hasPathToCore(grid, start, core) {
  const q = [start];
  const seen = new Set([keyOf(start.x, start.y)]);
  while (q.length) {
    const cur = q.shift();
    if (cur.x === core.x && cur.y === core.y) return true;
    for (const p of neighbors(cur.x, cur.y)) {
      if (seen.has(keyOf(p.x, p.y))) continue;
      if (!tileWalkable(grid[p.y][p.x])) continue;
      seen.add(keyOf(p.x, p.y));
      q.push(p);
    }
  }
  return false;
}
function rollAshBreachPositions(grid, count, day) {
  const needed = Math.max(1, count || 1);
  const candidates = getAshBreachCandidates(grid);
  const picks = [];
  function search(remaining, pool) {
    if (picks.length >= needed) return true;
    if (!pool.length || pool.length < remaining) return false;
    const shuffled = [...pool].sort(() => randomFloat() - 0.5);
    for (const candidate of shuffled) {
      if (picks.some((entry) => inAuraRange(entry.x, entry.y, candidate.x, candidate.y))) continue;
      picks.push(candidate);
      const nextPool = pool.filter(
        (entry) =>
          !(entry.x === candidate.x && entry.y === candidate.y) &&
          !inAuraRange(entry.x, entry.y, candidate.x, candidate.y)
      );
      if (search(remaining - 1, nextPool)) return true;
      picks.pop();
    }
    return false;
  }
  if (!search(needed, candidates)) return [];
  return picks.map((pickPos) => ({ x: pickPos.x, y: pickPos.y, openedDay: day }));
}
function pickSpawnEntrance(grid, ashTrial) {
  const entries = getActiveEntrances(grid, ashTrial);
  if (!entries.length) return null;
  const totalWeight = entries.reduce((sum, entry) => sum + (entry.kind === "ash-breach" ? 3 : 2), 0);
  let roll = randomFloat() * totalWeight;
  for (const entry of entries) {
    roll -= entry.kind === "ash-breach" ? 3 : 2;
    if (roll <= 0) return entry;
  }
  return entries[entries.length - 1];
}
function countRooms(grid) {
  let n = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (grid[y][x].room) n++;
    }
  }
  return n;
}
function validateDungeon(grid, ashTrial = null) {
  const { entrance, core } = findEntranceAndCore(grid);
  const entrances = getActiveEntrances(grid, ashTrial);
  if (!entrance) return { ok: false, reason: "Entrance not placed." };
  if (!core) return { ok: false, reason: "Core not placed." };
  for (const entry of entrances) {
    if (!hasPathToCore(grid, entry, core)) {
      if (entry.kind === "ash-breach") {
        return { ok: false, reason: `Ash Breach ${formatGridPos(entry)} is disconnected from the Core.` };
      }
      return { ok: false, reason: "No valid path from Entrance to Core." };
    }
  }
  return { ok: true, reason: "" };
}
function aStarPath(grid, start, goal) {
  const heuristic = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  const openSet = [{ pos: start, f: heuristic(start, goal), g: 0, parent: null }];
  const closedSet = new Set();
  const openMap = new Map();
  openMap.set(keyOf(start.x, start.y), openSet[0]);

  while (openSet.length > 0) {
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift();
    openMap.delete(keyOf(current.pos.x, current.pos.y));

    if (current.pos.x === goal.x && current.pos.y === goal.y) {
      const path = [];
      let node = current;
      while (node) {
        path.unshift(node.pos);
        node = node.parent;
      }
      return path;
    }

    closedSet.add(keyOf(current.pos.x, current.pos.y));

    for (const neighbor of neighbors(current.pos.x, current.pos.y)) {
      if (!tileWalkable(grid[neighbor.y][neighbor.x])) continue;
      const key = keyOf(neighbor.x, neighbor.y);
      if (closedSet.has(key)) continue;

      const g = current.g + 1;
      const h = heuristic(neighbor, goal);
      const f = g + h;

      const existing = openMap.get(key);
      if (!existing || g < existing.g) {
        const node = { pos: neighbor, f, g, parent: current };
        if (existing) {
          existing.g = g;
          existing.f = f;
          existing.parent = current;
        } else {
          openSet.push(node);
          openMap.set(key, node);
        }
      }
    }
  }
  return null;
}
function pathDistance(grid, start, goal) {
  const path = aStarPath(grid, start, goal);
  return path ? Math.max(0, path.length - 1) : Number.POSITIVE_INFINITY;
}
function trapThreatScore(tile) {
  if (!tile || tile.room !== "trap" || !tile.trap || tile.trapBroken) return 0;
  const trap = TRAP_MAP[tile.trapType];
  const star = clampMonsterStar(tile.trapStar ?? tile.trapStars ?? 1);
  const rank = Math.max(1, tile.trapRank ?? tile.roomTier ?? 1);
  const base = trap?.baseDmg || 0;
  return Math.max(1, Math.round(base * (1 + 0.25 * (star - 1)) + (rank - 1) * 2));
}
function tileThreatScore(grid, x, y) {
  const tile = grid[y]?.[x];
  if (!tile) return 0;
  let threat = 0;
  if (tile.room === "trap") {
    threat += trapThreatScore(tile);
    if ((tile.trapCooldownRemaining || 0) > 0) threat *= 0.5;
  }
  if (tile.room === "monster") {
    const monsters = tile.monsters || [];
    threat += monsters.reduce((sum, monster) => sum + Math.max(1, monster.atk || 0), 0);
    threat += monsters.length * 2;
  }
  if (tile.room === "utility") {
    if (tile.roomType === "fear-idol") threat += 2;
    if (tile.roomType === "ward-lantern") threat += 1;
  }
  return threat;
}
function branchLureScore(grid, start, corePos, maxDepth = 4) {
  const seen = new Set([keyOf(start.x, start.y)]);
  const queue = [{ ...start, depth: 0 }];
  let value = 0;
  const directDist = pathDistance(grid, start, corePos);
  while (queue.length > 0) {
    const cur = queue.shift();
    const tile = grid[cur.y]?.[cur.x];
    if (!tile) continue;
    if (tile.room === "trap") value += 3;
    else if (tile.room === "monster") value += 4 + Math.min(3, tile.monsters?.length || 0);
    else if (tile.room === "utility") value += 2;
    if (cur.depth >= maxDepth) continue;
    for (const next of neighbors(cur.x, cur.y)) {
      if (!tileWalkable(grid[next.y][next.x])) continue;
      const nextKey = keyOf(next.x, next.y);
      if (seen.has(nextKey)) continue;
      const coreDist = pathDistance(grid, next, corePos);
      if (coreDist > directDist + 3) continue;
      seen.add(nextKey);
      queue.push({ ...next, depth: cur.depth + 1 });
    }
  }
  return value;
}
function objectiveTargetLabel(target) {
  return target ? `${target.label || target.kind || "Target"} ${formatGridPos(target)}` : "No target";
}
function isObjectiveTargetValid(target, grid, corePos) {
  if (!target || !Number.isFinite(target.x) || !Number.isFinite(target.y)) return false;
  if (target.kind === "core" || target.kind === "safe-core") {
    return !!corePos && corePos.x === target.x && corePos.y === target.y;
  }
  const tile = grid[target.y]?.[target.x];
  if (!tile) return false;
  if (target.kind === "monster") return tile.room === "monster" && (tile.monsters || []).length > 0;
  if (target.kind === "support") return tile.room === "trap" || tile.room === "utility";
  if (target.kind === "flank") return tileWalkable(tile) && !tile.core;
  return tileWalkable(tile);
}
function objectiveCandidates(grid, current, corePos, selector) {
  const candidates = [];
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const tile = grid[y]?.[x];
      if (!tile) continue;
      if (!selector(tile, x, y)) continue;
      const dist = pathDistance(grid, current, { x, y });
      if (!Number.isFinite(dist)) continue;
      const coreDist = corePos ? pathDistance(grid, { x, y }, corePos) : Number.POSITIVE_INFINITY;
      candidates.push({
        x,
        y,
        tile,
        dist,
        coreDist,
        threat: tileThreatScore(grid, x, y),
        lure: corePos ? branchLureScore(grid, { x, y }, corePos) : 0,
      });
    }
  }
  return candidates;
}
function chooseObjectiveTarget(entity, grid, corePos, raidIntel = null) {
  const archetype = getHeroArchetypeRule(entity.archetypeKey);
  const current = { x: entity.x, y: entity.y };
  const sharedIntel = normalizeRaidIntel(raidIntel, entity.raidDirectiveKey || "rush-core");
  for (const kind of archetype.objectiveKinds || ["core"]) {
    if ((kind === "core" || kind === "safe-core") && corePos) {
      return {
        kind,
        label: kind === "safe-core" ? "Safest Core lane" : "Press the Core",
        x: corePos.x,
        y: corePos.y,
      };
    }
    if (kind === "monster") {
      const target = objectiveCandidates(grid, current, corePos, (tile) => tile.room === "monster" && (tile.monsters || []).length > 0)
        .sort((a, b) => b.tile.monsters.length - a.tile.monsters.length || a.dist - b.dist || b.threat - a.threat)[0];
      if (target) {
        return {
          kind,
          label: "Break monster room",
          x: target.x,
          y: target.y,
        };
      }
    }
    if (kind === "support") {
      const approachSupportTarget = (x, y, sourceTile) =>
        neighbors(x, y)
          .filter((pos) => tileWalkable(grid[pos.y]?.[pos.x]))
          .map((pos) => ({
            x: pos.x,
            y: pos.y,
            tile: grid[pos.y]?.[pos.x],
            dist: pathDistance(grid, current, pos),
            threat: tileThreatScore(grid, pos.x, pos.y),
            sourceTile,
          }))
          .filter((entry) => Number.isFinite(entry.dist));
      const keyedSupport = [...(sharedIntel.trapHubs || []), ...(sharedIntel.utilityHubs || [])]
        .flatMap((key) => {
          const [x, y] = String(key)
            .split(",")
            .map((part) => Number(part));
          const sourceTile = Number.isFinite(x) && Number.isFinite(y) ? grid[y]?.[x] : null;
          if (!sourceTile || (sourceTile.room !== "trap" && sourceTile.room !== "utility")) return [];
          if (sourceTile.room === "utility") return approachSupportTarget(x, y, sourceTile);
          return [
            {
              x,
              y,
              tile: sourceTile,
              dist: pathDistance(grid, current, { x, y }),
              threat: tileThreatScore(grid, x, y),
              sourceTile,
            },
          ].filter((entry) => Number.isFinite(entry.dist));
        });
      const scannedSupport = objectiveCandidates(grid, current, corePos, (tile) => tile.room === "trap")
        .map((entry) => ({ ...entry, sourceTile: entry.tile }))
        .concat(
          Array.from({ length: H * W }, (_, idx) => {
            const x = idx % W;
            const y = Math.floor(idx / W);
            const tile = grid[y]?.[x];
            return tile?.room === "utility" ? approachSupportTarget(x, y, tile) : [];
          }).flat()
        );
      const supportTarget =
        keyedSupport.sort((a, b) => a.dist - b.dist || b.threat - a.threat)[0] ||
        scannedSupport.sort(
          (a, b) =>
            (b.threat + (b.sourceTile?.room === "utility" ? 4 : 2)) -
              (a.threat + (a.sourceTile?.room === "utility" ? 4 : 2)) || a.dist - b.dist
        )[0];
      if (supportTarget) {
        return {
          kind,
          label: supportTarget.sourceTile?.room === "utility" ? "Purge support hub" : "Break trap line",
          x: supportTarget.x,
          y: supportTarget.y,
        };
      }
    }
    if (kind === "flank") {
      const flankTarget = objectiveCandidates(grid, current, corePos, (tile, x, y) => tileWalkable(tile) && !tile.core && !(x === current.x && y === current.y))
        .map((candidate) => ({
          ...candidate,
          score:
            candidate.lure * 1.4 +
            (candidate.coreDist > 1 ? 1 : 0) +
            ((sharedIntel.dangerTiles || {})[keyOf(candidate.x, candidate.y)] ? -2 : 0) -
            candidate.dist * 0.6,
        }))
        .filter((candidate) => candidate.score >= 2.5)
        .sort((a, b) => b.score - a.score || a.dist - b.dist)[0];
      if (flankTarget) {
        return {
          kind,
          label: "Probe flank route",
          x: flankTarget.x,
          y: flankTarget.y,
        };
      }
    }
  }
  return corePos
    ? {
        kind: "core",
        label: "Press the Core",
        x: corePos.x,
        y: corePos.y,
      }
    : null;
}
function chooseInvaderMove(entity, grid, corePos, raidBoons = [], doctrineEffects = {}, raidIntel = null, artifactMods = {}) {
  if (!entity || !corePos) return { next: null, options: [], intent: "No path" };
  const archetype = getHeroArchetypeRule(entity.archetypeKey);
  const directiveKey = entity.raidDirectiveKey || raidIntel?.directive || "rush-core";
  const directive = getRaidDirectiveRule(directiveKey);
  const factionRetargetBias = entity.factionKey ? COUNCIL_RAID_FACTIONS[entity.factionKey]?.retargetBias || 0 : 0;
  const objectiveCommitTurns =
    archetype.objectiveCommitTurns < 0
      ? -1
      : Math.max(1, archetype.objectiveCommitTurns + (entity.raidOriginLabel === RAID_TYPE_META.elite.label ? 1 : 0) - factionRetargetBias);
  const current = { x: entity.x, y: entity.y };
  const currentCoreDist = pathDistance(grid, current, corePos);
  const raidMods = buildRaidModifiers(raidBoons);
  const recentTiles = Array.isArray(entity.memory?.recentTiles) ? entity.memory.recentTiles : [];
  const currentMemory = createHeroMemory(entity.memory);
  const retainedTarget = currentMemory.targetTile;
  const retainedObjectiveActive =
    retainedTarget &&
    isObjectiveTargetValid(retainedTarget, grid, corePos) &&
    (currentMemory.objectiveTurnsLeft < 0 || currentMemory.objectiveTurnsLeft > 0);
  const currentDanger = (currentMemory.danger?.[keyOf(current.x, current.y)] || 0) + ((raidIntel?.dangerTiles || {})[keyOf(current.x, current.y)] || 0);
  const forceRetarget = archetype.retargetOnDamage && currentDanger >= (archetype.dangerThreshold || 8);
  const objectiveTarget =
    retainedObjectiveActive && !forceRetarget
      ? retainedTarget
      : chooseObjectiveTarget(entity, grid, corePos, raidIntel);
  const objectiveChanged =
    !retainedTarget ||
    forceRetarget ||
    retainedTarget?.x !== objectiveTarget?.x ||
    retainedTarget?.y !== objectiveTarget?.y ||
    retainedTarget?.kind !== objectiveTarget?.kind;
  const currentObjectiveDist = objectiveTarget ? pathDistance(grid, current, objectiveTarget) : Number.POSITIVE_INFINITY;
  const isBacktrack = (option) =>
    !!(entity.prev && option && entity.prev.x === option.next.x && entity.prev.y === option.next.y);
  const options = neighbors(entity.x, entity.y)
    .filter((next) => tileWalkable(grid[next.y][next.x]))
    .map((next) => {
      const tile = grid[next.y][next.x];
      const coreDist = pathDistance(grid, next, corePos);
      if (!Number.isFinite(coreDist)) return null;
      const nextKey = keyOf(next.x, next.y);
      const localDanger = currentMemory.danger?.[nextKey] || 0;
      const sharedDanger = raidIntel?.dangerTiles?.[nextKey] || 0;
      const threat = tileThreatScore(grid, next.x, next.y) + localDanger + (["cautious", "purifier", "scout"].includes(archetype.key) ? sharedDanger : sharedDanger * 0.35);
      const lure =
        branchLureScore(grid, next, corePos) +
        roomLureBonusAt(grid, next.x, next.y, artifactMods) +
        (raidMods.lureBoost || 0) +
        (doctrineEffects.utilityScoutBonus || 0);
      const roomBias =
        (tile.room === "trap" ? archetype.weights.trap + (directive.weights?.trap || 0) : 0) +
        (tile.room === "monster" ? archetype.weights.monster + (directive.weights?.monster || 0) : 0) +
        (tile.room === "utility" ? archetype.weights.utility + (directive.weights?.utility || 0) : 0);
      const progress = Number.isFinite(currentCoreDist) ? currentCoreDist - coreDist : 0;
      const objectiveDist = objectiveTarget ? pathDistance(grid, next, objectiveTarget) : Number.POSITIVE_INFINITY;
      const objectiveProgress = Number.isFinite(currentObjectiveDist) && Number.isFinite(objectiveDist) ? currentObjectiveDist - objectiveDist : 0;
      const objectiveBonus =
        objectiveProgress * 2.2 * (directive.weights?.objective || 1) +
        (objectiveTarget && objectiveTarget.x === next.x && objectiveTarget.y === next.y ? 4 : 0);
      const backtrackPenalty = entity.prev && entity.prev.x === next.x && entity.prev.y === next.y ? archetype.weights.backtrack : 0;
      const revisitPenalty = recentTiles.filter((key) => key === nextKey).length * (1.25 + archetype.weights.backtrack * 0.2);
      const directLoopPenalty = recentTiles.length >= 2 && nextKey === recentTiles[recentTiles.length - 2] ? 12 : 0;
      const longLoopPenalty = recentTiles.length >= 4 && nextKey === recentTiles[recentTiles.length - 4] ? 8 : 0;
      const thresholdPenalty =
        threat > (archetype.dangerThreshold || 99) ? (threat - archetype.dangerThreshold) * 2.5 : 0;
      const score =
        progress * archetype.weights.core * (directive.weights?.core || 1) +
        lure * archetype.weights.lure * (directive.weights?.lure || 1) +
        roomBias +
        objectiveBonus -
        threat * archetype.weights.danger * (directive.weights?.danger || 1) -
        backtrackPenalty -
        revisitPenalty -
        directLoopPenalty -
        longLoopPenalty -
        thresholdPenalty;
      const intent =
        tile.core
          ? "Press Core"
          : tile.room === "monster"
          ? "Pressure monster room"
          : tile.room === "trap"
          ? "Force the trap line"
          : tile.room === "utility"
          ? "Disrupt support"
          : objectiveTarget?.kind === "flank"
          ? "Probe the flank"
          : "Advance";
      return {
        next,
        tile,
        score,
        threat,
        lure,
        coreDist,
        objectiveDist,
        intent,
        revisitPenalty,
        isLoopRisk: directLoopPenalty > 0 || longLoopPenalty > 0,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.coreDist - b.coreDist || a.objectiveDist - b.objectiveDist);
  let best = options[0] || null;
  let loopBreakReason = null;
  if (best && (isBacktrack(best) || best.isLoopRisk)) {
    const forwardAlternatives = options.filter(
      (option) =>
        !isBacktrack(option) &&
        !option.isLoopRisk &&
        (option.coreDist < currentCoreDist || option.objectiveDist < currentObjectiveDist || option.score >= (best.score - 3))
    );
    if (forwardAlternatives.length > 0) {
      best = forwardAlternatives[0];
      loopBreakReason = "Loop avoided";
    }
  }
  const reachedTarget = !!(best && objectiveTarget && best.next.x === objectiveTarget.x && best.next.y === objectiveTarget.y);
  let objectiveTurnsLeft = currentMemory.objectiveTurnsLeft;
  if (objectiveChanged) {
    objectiveTurnsLeft = objectiveCommitTurns;
  } else if (objectiveTurnsLeft > 0) {
    objectiveTurnsLeft -= 1;
  }
  if (reachedTarget) {
    objectiveTurnsLeft = 0;
  }
  let decisionLog = null;
  if (objectiveChanged && objectiveTarget) {
    if (archetype.key === "scout" && objectiveTarget.kind === "flank") {
      decisionLog = `Scout diverts toward flank route ${formatGridPos(objectiveTarget)}.`;
    } else if (archetype.key === "breaker" && objectiveTarget.kind === "monster") {
      decisionLog = `Breaker commits to monster room at ${formatGridPos(objectiveTarget)}.`;
    } else if (archetype.key === "purifier" && objectiveTarget.kind === "support") {
      decisionLog = `Purifier marks support hub at ${formatGridPos(objectiveTarget)}.`;
    } else if (archetype.key === "cautious" && forceRetarget) {
      decisionLog = "Cautious reroutes after trap losses.";
    }
  } else if (archetype.key === "cautious" && forceRetarget) {
    decisionLog = "Cautious reroutes after trap losses.";
  }
  return {
    next: best?.next || null,
    options,
    intent: best ? best.intent : "Hold position",
    lure: best?.lure || 0,
    wasDetour: !!(best && !best.tile.core && best.lure >= 4),
    directiveKey,
    directiveLabel: directive.name,
    currentObjective: objectiveTarget?.label || "Press the Core",
    targetTile: objectiveTarget || null,
    targetTileLabel: objectiveTargetLabel(objectiveTarget),
    objectiveTurnsLeft,
    objectiveChanged,
    loopBreakReason,
    decisionLog,
  };
}

export { hasPathToCore, rollAshBreachPositions, pickSpawnEntrance, countRooms, validateDungeon, aStarPath, pathDistance, trapThreatScore, tileThreatScore, branchLureScore, objectiveTargetLabel, isObjectiveTargetValid, objectiveCandidates, chooseObjectiveTarget, chooseInvaderMove };
