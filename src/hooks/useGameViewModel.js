import { useMemo } from "react";
import { STANDARD_ARTIFACTS, UTILITY_ROOMS, validateGameContent } from "../gameContent";
import { isEscalationDay } from "../gameRules";
import {
  COUNCIL_CHAMBER_ART,
  COUNCIL_MEMBERS,
  COUNCIL_MEMBER_CRESTS,
  getCouncilFavorInfo,
} from "../systems/council";
import {
  MONSTER_ROOM_MAP,
  TRAP_MAP,
  UTILITY_MAP,
  ashBreachRequirementText,
  canPlaceAshBreaches,
  findEntranceAndCore,
  getActiveEntrances,
  huntTrapFlatDamageBonus,
  isAshBreachAt,
  keyOf,
  radarNoise,
  roomLinkInfoAt,
  trapChargesForTile,
  trapCooldownAfterTrigger,
  utilityTier,
} from "../systems/dungeon";
import {
  artifactCopyCap,
  calcArtifactMods,
  countOwnedArtifacts,
  getCoreMaxHp,
  getDoctrineEffects,
  getDungeonRoomCap,
  hydrateArtifactDefinition,
} from "../systems/economy";
import { buildFusedMonsterEntity } from "../systems/markets";
import {
  discountedFusionCost,
  dungeonUpgradeCost,
  effectiveMonsterRoomCapValue,
  fusionRecipeForMonster,
  monsterEvolutionCost,
  monsterEvolutionStageValue,
} from "../systems/monsters";
import { aStarPath, chooseInvaderMove, countRooms, validateDungeon } from "../systems/pathing";
import {
  MONSTER_ROOM_ICONS,
  TILE_RADAR_MAX_DOTS,
  TILE_RADAR_SLOTS,
  TRAP_GLYPHS,
  TRAP_ICONS,
  UTILITY_GLYPHS,
  UTILITY_ICONS,
} from "../systems/presentation";
import {
  EXPEDITION_ORDER_CRESTS,
  HERO_LEADER_TRAIT_MAP,
  HERO_ORDER_MAP,
  displayedRaidType,
  getRaidDirectiveRule,
  partyArchetypeSummary,
  raidDifficultyConfig,
  raidDirectiveArchetypeSummary,
  raidTypeMeta,
  resolveRaidDirectiveKey,
  topArchetypesFromWeights,
} from "../systems/raids";
import {
  MAX_DUNGEON_LEVEL,
  MAX_EVOLUTION_STAGE,
  clampDungeonLevel,
  clampMonsterStar,
  formatStars,
  safeEntityMaxHp,
} from "../systems/shared";
import { roomUpgradeCost } from "../systems/dungeonActions";
import { dominionPowerAvailability } from "../systems/raidActions";

export function useGameViewModel({ state, ui }) {
  const locked = state.coreHp <= 0;
  const isBuildPhase = state.phase === "build";
  const isBattlePhase = state.phase === "battle";
  const dominionPowers = Object.fromEntries(
    ["pulse", "shield", "speed", "strength"].map((kind) => [kind, dominionPowerAvailability(state, kind)])
  );
  const councilSessionActive = state.councilSession && state.councilSession.day === state.day;
  const showCouncilPrompt = councilSessionActive && state.councilSession.status === "pending";
  const councilAwaitingConclusion = councilSessionActive && state.councilSession.status !== "pending";
  const councilRoster = useMemo(
    () => (councilSessionActive ? state.council?.roster || [] : []),
    [councilSessionActive, state.council?.roster]
  );
  const focusedCouncilMember =
    councilRoster.find((member) => member.key === ui.focusedCouncilKey) || councilRoster[0] || null;
  const absentCouncilMembers = councilSessionActive
    ? COUNCIL_MEMBERS.filter(
        (member) => !councilRoster.some((attendee) => attendee.key === member.key)
      )
    : [];

  const { entrance, core } = useMemo(() => findEntranceAndCore(state.grid), [state.grid]);
  const activeEntrances = useMemo(
    () => getActiveEntrances(state.grid, state.ashTrial),
    [state.grid, state.ashTrial]
  );
  const validation = useMemo(
    () => validateDungeon(state.grid, state.ashTrial),
    [state.grid, state.ashTrial]
  );
  const roomsPlaced = useMemo(() => countRooms(state.grid), [state.grid]);
  const doctrineEffects = useMemo(
    () => getDoctrineEffects(state.doctrines || {}),
    [state.doctrines]
  );
  const artifactMods = useMemo(
    () => calcArtifactMods(state.artifacts, state.day),
    [state.artifacts, state.day]
  );
  const ownedArtifactCounts = useMemo(
    () => countOwnedArtifacts(state.artifacts),
    [state.artifacts]
  );
  const standardArtifactCollectedCount = useMemo(
    () =>
      STANDARD_ARTIFACTS.filter((artifact) => (ownedArtifactCounts[artifact.key] || 0) > 0)
        .length,
    [ownedArtifactCounts]
  );
  const unlockedStandardArtifactCount = useMemo(
    () => STANDARD_ARTIFACTS.filter((artifact) => (artifact.unlockDay || 1) <= state.day).length,
    [state.day]
  );
  const standardArtifactAtCapCount = useMemo(
    () =>
      STANDARD_ARTIFACTS.filter(
        (artifact) =>
          (ownedArtifactCounts[artifact.key] || 0) >= artifactCopyCap(artifact)
      ).length,
    [ownedArtifactCounts]
  );
  const dealerCatalogExhausted = useMemo(
    () =>
      unlockedStandardArtifactCount > 0 &&
      STANDARD_ARTIFACTS.filter((artifact) => (artifact.unlockDay || 1) <= state.day).every(
        (artifact) =>
          (ownedArtifactCounts[artifact.key] || 0) >= artifactCopyCap(artifact)
      ),
    [ownedArtifactCounts, state.day, unlockedStandardArtifactCount]
  );
  const contentWarnings = useMemo(() => validateGameContent(), []);
  const coreMaxHp = getCoreMaxHp(state);
  const dungeonLevel = clampDungeonLevel(state.dungeonLevel);
  const maxRooms = getDungeonRoomCap(state);

  const heroesByTile = useMemo(() => {
    const map = new Map();
    for (const hero of state.heroes) {
      const key = keyOf(hero.x, hero.y);
      const heroes = map.get(key) || [];
      heroes.push(hero);
      map.set(key, heroes);
    }
    return map;
  }, [state.heroes]);

  const selectedTile = state.grid[state.selected.y][state.selected.x];
  const selectedHeroes = useMemo(
    () => heroesByTile.get(keyOf(state.selected.x, state.selected.y)) || [],
    [heroesByTile, state.selected.x, state.selected.y]
  );
  const roomUpgradePrice = selectedTile.room
    ? roomUpgradeCost(selectedTile.roomTier || 1)
    : null;
  const selectedMonsterRoomCapValue =
    selectedTile.room === "monster"
      ? effectiveMonsterRoomCapValue(state, selectedTile.roomTier || 1)
      : 0;
  const canManageSelectedMonsterRoom =
    isBuildPhase && !state.movePayload && selectedTile.room === "monster";
  const selectedMonsterRoomHasSpace =
    canManageSelectedMonsterRoom &&
    selectedTile.monsters.length < selectedMonsterRoomCapValue;
  const fusionFirst = ui.fuseA === "" ? null : state.invMonsters[Number(ui.fuseA)] || null;
  const fusionSecond = ui.fuseB === "" ? null : state.invMonsters[Number(ui.fuseB)] || null;
  const fusionPreview =
    fusionFirst && fusionSecond && fusionFirst !== fusionSecond
      ? {
          recipe: fusionRecipeForMonster(fusionSecond),
          cost: discountedFusionCost(fusionFirst, fusionSecond, artifactMods),
          result: buildFusedMonsterEntity(fusionFirst, fusionSecond, state.day),
        }
      : null;

  const ownedArtifactGroups = useMemo(() => {
    const groups = new Map();
    for (const rawArtifact of state.artifacts || []) {
      const artifact = hydrateArtifactDefinition(rawArtifact);
      if (!artifact?.key) continue;
      const existing = groups.get(artifact.key);
      if (existing) existing.count += 1;
      else groups.set(artifact.key, { artifact, count: 1 });
    }
    return Array.from(groups.values()).sort((a, b) =>
      a.artifact.name.localeCompare(b.artifact.name)
    );
  }, [state.artifacts]);

  function getTileGlyph(tile, x, y) {
    if (isAshBreachAt(state.ashTrial, x, y)) return { text: "AE", tone: "ash-breach" };
    if (tile.entrance) return { text: "E", tone: "entrance" };
    if (tile.core) return { text: "C", tone: "core" };
    if (tile.room === "trap") {
      const glyph = TRAP_GLYPHS[tile.trapType] || { unarmed: "?", armed: "!" };
      return {
        text: tile.trap ? glyph.armed : glyph.unarmed,
        tone: tile.trap ? "trap-armed" : "trap-unarmed",
      };
    }
    if (tile.room === "monster") {
      return { text: MONSTER_ROOM_ICONS[tile.roomType] || "MR", tone: "monster" };
    }
    if (tile.room === "utility") {
      return { text: UTILITY_GLYPHS[tile.roomType] || "+", tone: "utility" };
    }
    return { text: "" };
  }

  function getTileRadarSpec(
    tile,
    x,
    y,
    heroesHere = [],
    monstersHere = 0,
    turnsSurvived = 0,
    raidActive = false
  ) {
    if (tile?.room !== "monster") return { enabled: false, dots: [], engaged: false };
    const heroCount = Math.min(
      TILE_RADAR_MAX_DOTS,
      Array.isArray(heroesHere) ? heroesHere.length : 0
    );
    const monsterCount = Math.min(
      TILE_RADAR_MAX_DOTS,
      Number.isFinite(monstersHere) ? monstersHere : 0
    );
    if (heroCount <= 0 && monsterCount <= 0) {
      return { enabled: false, dots: [], engaged: false };
    }
    const engaged = heroCount > 0 && monsterCount > 0;
    const baseDuration = engaged ? 2.75 : raidActive ? 3.15 : 3.8;
    const motionBoost = engaged ? 1.2 : raidActive ? 0.8 : 0.45;
    const buildDots = (side, count) => {
      const slots = TILE_RADAR_SLOTS[side];
      const sideBias = side === "hero" ? 71 : 29;
      return Array.from({ length: count }, (_, index) => {
        const slot = slots[index % slots.length];
        const seedBase = x * 101 + y * 59 + index * 23 + sideBias;
        const phaseSeed = seedBase + (raidActive ? turnsSurvived * 7 : 0);
        const jitterX = (radarNoise(seedBase + 0.1) - 0.5) * 5.4;
        const jitterY = (radarNoise(seedBase + 0.7) - 0.5) * 4.8;
        const driftX = (radarNoise(seedBase + 1.3) - 0.5) * (2.4 + motionBoost);
        const driftY = (radarNoise(seedBase + 2.1) - 0.5) * (2.1 + motionBoost);
        return {
          key: `${side}-${x}-${y}-${index}`,
          side,
          style: {
            left: `${slot.x + jitterX}%`,
            top: `${slot.y + jitterY}%`,
            "--radar-dx": `${driftX.toFixed(2)}px`,
            "--radar-dy": `${driftY.toFixed(2)}px`,
            "--radar-duration": `${(baseDuration + radarNoise(seedBase + 2.7) * 0.85).toFixed(2)}s`,
            "--radar-delay": `-${(radarNoise(phaseSeed + 3.5) * 4.2).toFixed(2)}s`,
            "--radar-scale-a": (0.92 + radarNoise(seedBase + 4.1) * 0.08).toFixed(2),
            "--radar-scale-b": (1.02 + radarNoise(seedBase + 5.3) * 0.16).toFixed(2),
          },
        };
      });
    };
    return {
      enabled: true,
      engaged,
      dots: [...buildDots("monster", monsterCount), ...buildDots("hero", heroCount)],
    };
  }

  function roomTypeName(tile) {
    if (!tile.room) return "none";
    if (tile.room === "trap") return TRAP_MAP[tile.trapType]?.name || "Trap Room";
    if (tile.room === "monster")
      return MONSTER_ROOM_MAP[tile.roomType]?.name || "Monster Room";
    if (tile.room === "utility")
      return UTILITY_MAP[tile.roomType]?.name || "Utility Room";
    return tile.room;
  }

  function roomTypeDesc(tile, x = state.selected.x, y = state.selected.y) {
    if (!tile.room) return "";
    const linkInfo = roomLinkInfoAt(state.grid, x, y);
    if (tile.room === "trap") {
      const tier = tile.roomTier || 1;
      const trap = TRAP_MAP[tile.trapType];
      if (!trap) return "";
      const star = clampMonsterStar(tile.trapStar ?? tile.trapStars ?? 1);
      const rank = Math.max(1, tile.trapRank ?? tier);
      const scaled = Math.max(
        0,
        Math.round(
          (trap.baseDmg || 0) * (1 + 0.25 * (star - 1)) +
            (rank - 1) * 2 +
            doctrineEffects.trapFlatDamage +
            (artifactMods.trapFlatDamage || 0) +
            huntTrapFlatDamageBonus(state.grid, x, y, artifactMods)
        )
      );
      const charges = trapChargesForTile(
        state.grid,
        tile,
        x,
        y,
        doctrineEffects,
        artifactMods,
        state.ashTrial
      );
      const cooldown = trapCooldownAfterTrigger(tile.trapType, star, doctrineEffects);
      return `${trap.baseDesc || trap.desc} Tier ${tier}. ${formatStars(star)} / Rank ${rank}. Trigger ${scaled} dmg, ${charges} charge(s), cooldown ${cooldown}.${linkInfo.linked && trap.linkDesc ? ` Linked: ${trap.linkDesc}` : ""}`;
    }
    if (tile.room === "monster") {
      const tier = tile.roomTier || 1;
      const cap = effectiveMonsterRoomCapValue(state, tier);
      if (tile.roomType === "training-den") {
        return `Tier ${tier}: Monsters placed here gain +${1 + (tier - 1)} ATK permanently. Cap ${cap}.`;
      }
      if (tile.roomType === "thick-hide") {
        return `Tier ${tier}: Monsters placed here gain +${3 + (tier - 1) * 2} Max HP permanently. Cap ${cap}.`;
      }
      const roomDef = MONSTER_ROOM_MAP[tile.roomType];
      return `${roomDef?.baseDesc || roomDef?.desc || "Monster Room"} Cap ${cap}.${linkInfo.linked && roomDef?.linkDesc ? ` Linked: ${roomDef.linkDesc}` : ""}`;
    }
    if (tile.room === "utility") {
      const roomDef = UTILITY_MAP[tile.roomType];
      if (roomDef?.baseDesc) {
        return `${roomDef.baseDesc}${linkInfo.linked && roomDef.linkDesc ? ` Linked: ${roomDef.linkDesc}` : ""}`;
      }
      const tier =
        (tile.roomTier || 1) +
        doctrineEffects.utilityPotencyBonus +
        doctrineEffects.utilityPotencyBonusExtra +
        (artifactMods.utilityPotencyBonus || 0);
      if (tile.roomType === "soul-altar")
        return `Tier ${tier}: Hero dies within 1 tile: +${15 + (tier - 1) * 5} Essence.`;
      if (tile.roomType === "siphon-pylon")
        return `Tier ${tier}: Hero takes damage within 1 tile: +1 Essence (cap ${10 + (tier - 1) * 5} per hero).`;
      if (tile.roomType === "reinforced-keystone")
        return `Tier ${tier}: Monsters within 1 tile gain +${2 + (tier - 1)} DEF.`;
      if (tile.roomType === "blood-sigil")
        return `Tier ${tier}: Monsters within 1 tile heal +${2 + (tier - 1)} HP at end of turn.`;
      if (tile.roomType === "war-drum")
        return `Tier ${tier}: Monsters within 1 tile gain +${1 + (tier - 1)} ATK.`;
      if (tile.roomType === "fear-idol")
        return `Tier ${tier}: Heroes entering adjacent tiles get -1 ATK for ${2 + (tier - 1)} turns.`;
      if (tile.roomType === "ward-lantern")
        return `Tier ${tier}: Traps within 1 tile deal +${25 + (tier - 1) * 5}% damage.`;
      if (tile.roomType === "scout-mirror")
        return `Tier ${tier}: Raid start reveals next ${2 + (tier - 1)} hero spawns.`;
      return roomDef?.desc || "";
    }
    return "";
  }

  function roomTypeIcon(tile) {
    if (!tile.room) return "";
    if (tile.room === "trap") return TRAP_ICONS[tile.trapType] || "TR";
    if (tile.room === "monster") return MONSTER_ROOM_ICONS[tile.roomType] || "MR";
    if (tile.room === "utility") return UTILITY_ICONS[tile.roomType] || "UR";
    return "";
  }

  function effectiveMonsterRoomCap(tile) {
    if (!tile || tile.room !== "monster") return "n/a";
    return effectiveMonsterRoomCapValue(state, tile.roomTier || 1);
  }

  function effectiveUtilityTierAt(x, y, key) {
    const baseTier = utilityTier(state.grid, x, y, key);
    if (baseTier <= 0) return 0;
    return (
      baseTier +
      doctrineEffects.utilityPotencyBonus +
      doctrineEffects.utilityPotencyBonusExtra +
      (artifactMods.utilityPotencyBonus || 0)
    );
  }

  function describeTileAuras(x, y) {
    return UTILITY_ROOMS.map((room) => ({ room, tier: effectiveUtilityTierAt(x, y, room.key) }))
      .filter((entry) => entry.tier > 0)
      .map((entry) => `${entry.room.name} T${entry.tier}`);
  }

  function projectedTrapDamage(tile, x, y) {
    if (!tile || tile.room !== "trap") return 0;
    const trap = TRAP_MAP[tile.trapType];
    if (!trap) return 0;
    const star = clampMonsterStar(tile.trapStar ?? tile.trapStars ?? 1);
    const rank = Math.max(1, tile.trapRank ?? tile.roomTier ?? 1);
    const wardTier = effectiveUtilityTierAt(x, y, "ward-lantern");
    let multiplier = 1 + (wardTier > 0 ? 0.25 + 0.05 * (wardTier - 1) : 0);
    if (artifactMods.trapMult) multiplier += artifactMods.trapMult;
    return Math.max(
      0,
      Math.round(
        (trap.baseDmg * (1 + 0.25 * (star - 1)) +
          (rank - 1) * 2 +
          doctrineEffects.trapFlatDamage +
          (artifactMods.trapFlatDamage || 0) +
          huntTrapFlatDamageBonus(state.grid, x, y, artifactMods)) *
          multiplier
      )
    );
  }

  function tileStateChip(tile) {
    if (tile.room === "trap") {
      if (tile.trapBroken) return "BRK";
      if (!tile.trap) return "OFF";
      const cooldown = Math.max(0, tile.trapCooldownRemaining ?? 0);
      if (cooldown > 0) return `CD${cooldown}`;
      return `R${Math.max(0, tile.trapChargesRemaining ?? 0)}`;
    }
    if (
      tile.room === "monster" &&
      (tile.monsters || []).some((monster) => monster.hp < safeEntityMaxHp(monster))
    ) {
      return "W";
    }
    return "";
  }

  function tileHasAura(x, y) {
    return describeTileAuras(x, y).length > 0;
  }

  const selectedTileAuras = describeTileAuras(state.selected.x, state.selected.y);
  const selectedHeroIntent =
    selectedHeroes[0] && core
      ? chooseInvaderMove(
          selectedHeroes[0],
          state.grid,
          core,
          state.activeRaidBoons,
          doctrineEffects,
          state.raidIntel,
          artifactMods
        )
      : null;
  const focusedCouncilFavor = focusedCouncilMember
    ? state.councilFavor?.[focusedCouncilMember.key] || 0
    : 0;
  const focusedCouncilFavorInfo = getCouncilFavorInfo(focusedCouncilFavor);
  const focusedCouncilSponsor =
    focusedCouncilMember && state.councilSession?.sponsors
      ? state.councilSession.sponsors.find(
          (sponsor) => sponsor.key === focusedCouncilMember.key
        ) || null
      : null;
  const focusedCouncilStanding = focusedCouncilSponsor?.favorInfo || focusedCouncilFavorInfo;
  const focusedCouncilCrestSrc = focusedCouncilMember
    ? COUNCIL_MEMBER_CRESTS[focusedCouncilMember.key] || null
    : null;
  const useFocusedCouncilCrest =
    !!focusedCouncilCrestSrc && !ui.brokenCouncilArt[focusedCouncilCrestSrc];
  const useCouncilBackdrop =
    !!COUNCIL_CHAMBER_ART.backdrop && !ui.brokenCouncilArt[COUNCIL_CHAMBER_ART.backdrop];
  const useCouncilSigil =
    !!COUNCIL_CHAMBER_ART.sigil && !ui.brokenCouncilArt[COUNCIL_CHAMBER_ART.sigil];
  const useCouncilAbsentSilhouette =
    !!COUNCIL_CHAMBER_ART.absentSilhouette &&
    !ui.brokenCouncilArt[COUNCIL_CHAMBER_ART.absentSilhouette];
  const focusedCouncilBoons = focusedCouncilMember
    ? (state.nextRaidBoons || []).filter(
        (boon) => boon.sponsorKey === focusedCouncilMember.key
      )
    : [];
  const councilQuestPlacementBlock = (quest) => {
    if (!quest || quest.questType !== "ash-breach-trial") return "";
    const breachCount = Math.max(1, quest.breachCount || 1);
    return canPlaceAshBreaches(state.grid, breachCount)
      ? ""
      : ashBreachRequirementText(breachCount);
  };
  const focusedCouncilSponsorStatus = focusedCouncilSponsor
    ? !focusedCouncilSponsor.available
      ? focusedCouncilSponsor.lockedReason || "Unavailable"
      : state.councilSession?.courtedSponsorKey === focusedCouncilSponsor.key
        ? "Courted"
        : `${focusedCouncilStanding.name} standing`
    : "Unavailable";

  const previewPathKeys = useMemo(() => {
    if (selectedHeroes[0] && core) {
      const choice = chooseInvaderMove(
        selectedHeroes[0],
        state.grid,
        core,
        state.activeRaidBoons,
        doctrineEffects,
        state.raidIntel,
        artifactMods
      );
      const current = keyOf(selectedHeroes[0].x, selectedHeroes[0].y);
      const previewKeys = new Set([current]);
      const objectiveTarget = choice?.targetTile || core;
      const firstLegStart = choice?.next || {
        x: selectedHeroes[0].x,
        y: selectedHeroes[0].y,
      };
      const toObjective =
        objectiveTarget &&
        aStarPath(state.grid, firstLegStart, {
          x: objectiveTarget.x,
          y: objectiveTarget.y,
        });
      for (const position of toObjective || (choice?.next ? [choice.next] : [])) {
        previewKeys.add(keyOf(position.x, position.y));
      }
      if (
        objectiveTarget &&
        !objectiveTarget.core &&
        !(objectiveTarget.x === core.x && objectiveTarget.y === core.y)
      ) {
        const toCore =
          aStarPath(state.grid, { x: objectiveTarget.x, y: objectiveTarget.y }, core) || [];
        for (const position of toCore) previewKeys.add(keyOf(position.x, position.y));
      }
      return previewKeys;
    }
    if (activeEntrances.length > 0 && core) {
      const paths = new Set();
      for (const source of activeEntrances) {
        paths.add(keyOf(source.x, source.y));
        const path = aStarPath(state.grid, source, core) || [];
        for (const position of path) paths.add(keyOf(position.x, position.y));
      }
      return paths;
    }
    return new Set();
  }, [
    selectedHeroes,
    state.grid,
    core,
    activeEntrances,
    state.activeRaidBoons,
    doctrineEffects,
    state.raidIntel,
    artifactMods,
  ]);

  const lureCandidateKeys = useMemo(() => {
    if (!selectedHeroes[0] || !core) return new Set();
    const choice = chooseInvaderMove(
      selectedHeroes[0],
      state.grid,
      core,
      state.activeRaidBoons,
      doctrineEffects,
      state.raidIntel,
      artifactMods
    );
    return new Set(
      (choice.options || [])
        .filter((option) => option.lure >= 4 && !option.tile.core)
        .map((option) => keyOf(option.next.x, option.next.y))
    );
  }, [
    selectedHeroes,
    state.grid,
    core,
    state.activeRaidBoons,
    doctrineEffects,
    state.raidIntel,
    artifactMods,
  ]);

  function tileClass(tile, x, y) {
    const selected = state.selected.x === x && state.selected.y === y ? " selected" : "";
    const tier = tile.room ? ` tier-${tile.roomTier || 1}` : "";
    const path = previewPathKeys.has(keyOf(x, y)) ? " path-preview" : "";
    const lure = lureCandidateKeys.has(keyOf(x, y)) ? " lure-candidate" : "";
    const aura = tileHasAura(x, y) ? " aura-affected" : "";
    if (isAshBreachAt(state.ashTrial, x, y))
      return `tile ash-breach${selected}${path}${lure}${aura}`;
    if (tile.entrance) return `tile entrance${selected}${path}${lure}${aura}`;
    if (tile.core) return `tile core${selected}${path}${lure}${aura}`;
    if (tile.room === "trap") return `tile trap${tier}${selected}${path}${lure}${aura}`;
    if (tile.room === "monster")
      return `tile monster${tier}${selected}${path}${lure}${aura}`;
    if (tile.room === "utility")
      return `tile utility${tier}${selected}${path}${lure}${aura}`;
    return `tile${selected}${path}${lure}${aura}`;
  }

  const pendingRaidType = displayedRaidType(state);
  const pendingEscalationLevel =
    pendingRaidType === "escalation"
      ? Math.max(
          1,
          state.currentRaidEscalationLevel || state.pendingEscalationLevel || 1
        )
      : 0;
  const activeRaidOrderKey = state.currentParty?.[0]?.orderKey || null;
  const pendingRaidOrderKey = activeRaidOrderKey || state.pendingRaidOrderKey || null;
  const pendingRaidOrder = pendingRaidOrderKey
    ? HERO_ORDER_MAP[pendingRaidOrderKey] || null
    : null;
  const pendingRaidLeaderTraitKey =
    state.currentParty?.find((hero) => hero.isRaidLeader)?.leaderTraitKey ||
    state.pendingRaidLeaderTraitKey ||
    null;
  const pendingRaidLeaderTrait = pendingRaidLeaderTraitKey
    ? HERO_LEADER_TRAIT_MAP[pendingRaidLeaderTraitKey] || null
    : null;
  const pendingRaidCrestSrc = pendingRaidOrder
    ? EXPEDITION_ORDER_CRESTS[pendingRaidOrder.key] || null
    : null;
  const usePendingRaidCrest = !!pendingRaidCrestSrc;
  const pendingRaidMeta = raidTypeMeta(pendingRaidType, state.pendingCouncilRaid);
  const pendingRaidDifficulty = raidDifficultyConfig(
    pendingRaidType,
    pendingEscalationLevel
  );
  const pendingDirectiveKey =
    pendingRaidOrder?.directiveKey ||
    resolveRaidDirectiveKey(pendingRaidType, state.pendingCouncilRaid, state.day);
  const pendingDirective = getRaidDirectiveRule(
    state.raidIntel?.directive || pendingDirectiveKey
  );
  const raidForecastMix =
    isBattlePhase && state.currentParty?.length
      ? partyArchetypeSummary(state.currentParty)
      : pendingRaidOrder && pendingRaidType !== "council"
        ? topArchetypesFromWeights(pendingRaidOrder.archetypeWeights || {}, 2).join(" / ") ||
          "Mixed pressure"
        : raidDirectiveArchetypeSummary(
            pendingRaidType,
            state.pendingCouncilRaid,
            state.day
          );
  const invPreview = state.invMonsters.slice(0, 3);
  const checklist = {
    entrancePlaced: !!entrance,
    corePlaced: !!core,
    validPath: validation.ok,
  };
  const raidPlanReady = !!pendingRaidType;
  const needsInvasionChoice =
    isBuildPhase && !councilSessionActive && !state.council?.active && !raidPlanReady;
  const showInvasionChoiceCards =
    isBuildPhase &&
    !councilSessionActive &&
    !state.council?.active &&
    !state.pendingPunitiveRaid &&
    !isEscalationDay(state.day) &&
    Array.isArray(state.invasionChoices) &&
    state.invasionChoices.length > 0;
  const canStartRaid =
    !locked && isBattlePhase && !state.raidActive && validation.ok && raidPlanReady;
  const canEndTurn =
    !locked && isBattlePhase && (state.raidActive || state.heroes.length > 0);
  const atDungeonLevelCap = dungeonLevel >= MAX_DUNGEON_LEVEL;
  const nextUpgradeCost = atDungeonLevelCap
    ? null
    : dungeonUpgradeCost(dungeonLevel, state.day, artifactMods);
  const selectedIsAshBreach = isAshBreachAt(
    state.ashTrial,
    state.selected.x,
    state.selected.y
  );
  const selectedLinkInfo = roomLinkInfoAt(
    state.grid,
    state.selected.x,
    state.selected.y
  );
  const selectedReadiness = tileStateChip(selectedTile) || "n/a";
  const selectedTileEffect =
    roomTypeDesc(selectedTile, state.selected.x, state.selected.y) || "n/a";
  const selectedLinkLabel = selectedLinkInfo.tag
    ? `${selectedLinkInfo.tag} | ${selectedLinkInfo.linked ? "Linked" : "Unlinked"}`
    : "none";
  const selectedLinkBonus = selectedLinkInfo.linked
    ? selectedLinkInfo.linkDesc || "Active link bonus."
    : "n/a";
  const selectedTileFlags = [
    selectedTile.entrance ? "Entrance" : null,
    selectedTile.core ? "Core" : null,
    selectedIsAshBreach ? "Ash Breach" : null,
  ].filter(Boolean);
  const selectedTrapSummary =
    selectedTile.room === "trap"
      ? `${selectedTile.trap ? "Armed" : "Disarmed"} | ${formatStars(selectedTile.trapStar ?? selectedTile.trapStars ?? 1)} | R${Math.max(1, selectedTile.trapRank ?? selectedTile.roomTier ?? 1)} | ${Math.max(0, selectedTile.trapChargesRemaining ?? 0)} ch | CD ${Math.max(0, selectedTile.trapCooldownRemaining ?? 0)} | ${projectedTrapDamage(selectedTile, state.selected.x, state.selected.y)} dmg`
      : "n/a";
  const dungeonRailStatus = locked
    ? "Core destroyed. Reset or load to continue."
    : state.movePayload
      ? "Move mode active. Click a destination tile or cancel the move."
      : state.council?.active
        ? "Council in session. Attend or decline before advancing."
        : councilAwaitingConclusion
          ? "Council resolved. Conclude the Council to advance to the next day."
          : state.raidActive
            ? `Raid active. ${state.raidRemaining} invader${state.raidRemaining === 1 ? "" : "s"} left to spawn.`
            : isBattlePhase
              ? !raidPlanReady
                ? "Choose an invasion in Raid Forecast."
                : validation.ok
                  ? `Battle staged. ${pendingRaidMeta.label} is ready to begin.`
                  : validation.reason
              : needsInvasionChoice
                ? "Build phase. Choose an invasion in Raid Forecast."
                : `Build phase. Next raid: ${pendingRaidMeta.label}${pendingEscalationLevel ? ` Level ${pendingEscalationLevel}` : ""}.`;
  const dungeonRailSupport = state.movePayload
    ? "Moving a room or the Core does not consume a turn."
    : atDungeonLevelCap
      ? `Dungeon level capped at ${MAX_DUNGEON_LEVEL}. ${validation.ok ? "Dungeon route is ready." : "Connect every entrance to the Core."}`
      : `Upgrade cost: ${nextUpgradeCost} Essence. ${validation.ok ? "Dungeon route is ready." : "Connect every entrance to the Core."}`;
  const onboardingComplete = state.day > 1 || !!state.lastRaidReport;
  const onboardingStep = onboardingComplete
    ? {
        number: 7,
        title: "Review and expand",
        desc: "Review the raid report, then build toward your next invasion.",
      }
    : state.raidActive
      ? {
          number: 6,
          title: "Advance the raid",
          desc: "Use End Turn while invaders move and rooms resolve combat.",
        }
      : isBattlePhase
        ? {
            number: 5,
            title: "Release the expedition",
            desc: "Select Start Raid to let the prepared party enter.",
          }
        : state.selectedInvasionKey
          ? {
              number: 4,
              title: "Commit to battle",
              desc: "Select Begin Battle. Your invasion choice locks when battle begins.",
            }
          : ui.activeTab === "toolbox"
            ? {
                number: 3,
                title: "Choose an invasion",
                desc: "In Raid Forecast, choose Normal Hero Raid or Elite Expedition.",
              }
            : selectedTile.roomType === "training-den"
              ? {
                  number: 2,
                  title: "Open Raid Forecast",
                  desc: "Open Toolbox from the menu to find today’s invasion choices.",
                }
              : {
                  number: 1,
                  title: "Inspect your defenders",
                  desc: "Select the starter Training Den beside the Entrance.",
                };

  function evolutionButtonLabel(monster) {
    const cost = monsterEvolutionCost(monster);
    if (cost === null) return "Max Stage";
    return `${monsterEvolutionStageValue(monster) === 0 ? "Evolve" : "Ascend"} (${cost} EP)`;
  }

  function evolutionStageLabel(monster) {
    return `Stage ${monsterEvolutionStageValue(monster)}/${MAX_EVOLUTION_STAGE}`;
  }

  const mobileTabs = [
    { key: "dungeon", label: "Dungeon", desc: "Grid only" },
    { key: "toolbox", label: "Toolbox", desc: "Build and management" },
    { key: "inventory", label: "Inventory", desc: "View monsters and items" },
    { key: "evolution", label: "Evolution", desc: "Spend evolution points" },
    { key: "glossary", label: "Glossary", desc: "Read passives and terms" },
    { key: "log", label: "Log", desc: "Recent events" },
  ];
  if (councilSessionActive) {
    mobileTabs.push({ key: "council", label: "Council", desc: "Council session details" });
  }
  const activeMobileTab =
    mobileTabs.find((tab) => tab.key === ui.activeTab) || mobileTabs[0];

  return {
    run: {
      state,
      locked,
      isBuildPhase,
      isBattlePhase,
      contentWarnings,
    },
    dungeon: {
      core,
      activeEntrances,
      validation,
      roomsPlaced,
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
      checklist,
    },
    raid: {
      dominionPowers,
      selectedHeroIntent,
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
      raidPlanReady,
      showInvasionChoiceCards,
      canStartRaid,
      canEndTurn,
    },
    council: {
      councilSessionActive,
      showCouncilPrompt,
      councilAwaitingConclusion,
      councilRoster,
      focusedCouncilMember,
      absentCouncilMembers,
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
    },
    inventory: {
      artifactMods,
      ownedArtifactCounts,
      standardArtifactCollectedCount,
      standardArtifactAtCapCount,
      dealerCatalogExhausted,
      fusionPreview,
      ownedArtifactGroups,
      invPreview,
      evolutionButtonLabel,
      evolutionStageLabel,
    },
    shell: {
      onboardingComplete,
      onboardingStep,
      mobileTabs,
      activeMobileTab,
    },
  };
}
