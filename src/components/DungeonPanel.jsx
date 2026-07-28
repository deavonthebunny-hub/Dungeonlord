import { isAshBreachAt, isLinkedRoom, keyOf, roomSynergyTag } from "../systems/dungeon";
import { MONSTER_ROOM_ICONS, TRAP_ICONS, UTILITY_ICONS, getEmptyTileArtSpec, getTileArtSpec, getTileCenterMarkerSpec, getUtilityArtSpec } from "../systems/presentation";
import { ROOMS_PER_LEVEL } from "../systems/shared";

export default function DungeonPanel(props) {
  const {
    atDungeonLevelCap,
    beginBattle,
    brokenTileArt,
    cancelMove,
    canEndTurn,
    canStartRaid,
    coreMaxHp,
    councilSessionActive,
    dungeonLevel,
    dungeonRailStatus,
    dungeonRailSupport,
    endTurn,
    getTileGlyph,
    getTileRadarSpec,
    heroesByTile,
    isBattlePhase,
    isBuildPhase,
    locked,
    maxRooms,
    noteBrokenTileArt,
    onboardingComplete,
    onboardingStep,
    raidPlanReady,
    roomsPlaced,
    roomTypeIcon,
    roomTypeName,
    selectedHeroes,
    selectedLinkBonus,
    selectedLinkLabel,
    selectedReadiness,
    selectedTile,
    selectedTileAuras,
    selectedTileEffect,
    selectedTileFlags,
    selectedTrapSummary,
    selectMobileTab,
    setSelected,
    setState,
    startMove,
    startRaid,
    state,
    tileClass,
    tileHasAura,
    tileStateChip,
    upgradeDungeon,
    validation,
  } = props;

  return (
    <section className="panel panel--dungeon">
                <div className="dungeonHud">
                  <div className="dungeonHudHeader">
                    <div>
                      <div className="dungeonFrameTitle">Dungeon Layout</div>
                      <div className="dungeonFrameSubtitle">Place up to {maxRooms} rooms</div>
                    </div>
                    <div className="capMeta dungeonCapMeta">
                      Remaining: {Math.max(0, maxRooms - roomsPlaced)} | Next cap: {atDungeonLevelCap ? "MAX" : maxRooms + ROOMS_PER_LEVEL}
                    </div>
                  </div>
                  <div className="dungeonHudRail">
                    <span className="pill">Essence: {state.currency.essence}</span>
                    <span className="pill">Soulshards: {state.currency.soulshards}</span>
                    <span className="pill">Dominion: {state.currency.dominion}</span>
                    <span className="pill">
                      Core HP: {Math.max(0, state.coreHp)} / {coreMaxHp}
                    </span>
                    <span className="pill">Core Shield: {state.coreShield}</span>
                    <span className="pill">Mode: {state.phase === "build" ? "BUILD" : "BATTLE"}</span>
                    <span className={"pill " + (validation.ok ? "ok" : "bad")}>
                      {validation.ok ? "Dungeon Valid" : "Invalid"}
                    </span>
                  </div>
                </div>

                <div className="gridWrap">
                  <div className="dungeonBody">
                    <div className="dungeonControlRail">
                      <div className="dungeonGutter">
                        <div className="dungeonTileFloat">
                          <div className="dungeonTileDockHeader">
                            <div className="dungeonTileDockTitle">Selected Tile</div>
                            <div className="muted">({state.selected.x + 1}, {state.selected.y + 1})</div>
                          </div>
                          <div className="dungeonTileDockGrid">
                            <div className="dockFact">
                              <span className="dockLabel">Type</span>
                              <div className="dockValue">
                                <span className="iconBadge">{roomTypeIcon(selectedTile) || "--"}</span>
                                {roomTypeName(selectedTile)}
                              </div>
                            </div>
                            <div className="dockFact">
                              <span className="dockLabel">Flags</span>
                              <div className="dockBadgeRow">
                                {selectedTileFlags.length ? (
                                  selectedTileFlags.map((flag) => (
                                    <span className="badge favorNeutral" key={flag}>
                                      {flag}
                                    </span>
                                  ))
                                ) : (
                                  <span className="muted small">None</span>
                                )}
                              </div>
                            </div>
                            <div className="dockFact">
                              <span className="dockLabel">Readiness</span>
                              <div className="dockValue">{selectedReadiness}</div>
                            </div>
                            <div className="dockFact">
                              <span className="dockLabel">Occupants</span>
                              <div className="dockValue">
                                Heroes {selectedHeroes.length} | Monsters {selectedTile.monsters.length}
                              </div>
                            </div>
                            <div className="dockFact">
                              <span className="dockLabel">Link</span>
                              <div className="dockValue">{selectedLinkLabel}</div>
                            </div>
                            <div className="dockFact dockFactWide">
                              <span className="dockLabel">Trap</span>
                              <div className="dockValue">{selectedTrapSummary}</div>
                            </div>
                            <div className="dockFact dockFactWide">
                              <span className="dockLabel">Link Bonus</span>
                              <div className="dockValue">{selectedLinkBonus}</div>
                            </div>
                            <div className="dockFact dockFactWide">
                              <span className="dockLabel">Effect</span>
                              <div className="dockValue">{selectedTileEffect}</div>
                            </div>
                            <div className="dockFact dockFactWide">
                              <span className="dockLabel">Auras</span>
                              <div className="dockValue">{selectedTileAuras.length ? selectedTileAuras.join(", ") : "none"}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="dungeonActionZone">
                        {state.movePayload && (
                          <div className="moveBanner">
                            Moving {state.movePayload.type === "core" ? "Core" : "Room"} - click a new tile to place it. Press Esc or Cancel to abort.
                          </div>
                        )}
                        {!state.onboardingDismissed ? (
                          <div className={`firstRunGuide ${onboardingComplete ? "complete" : ""}`}>
                            <div className="firstRunGuideHeader">
                              <span>First Run {onboardingStep.number}/7</span>
                              <button
                                className="textButton"
                                type="button"
                                onClick={() => setState((s) => ({ ...s, onboardingDismissed: true }))}
                              >
                                Dismiss
                              </button>
                            </div>
                            <div className="firstRunGuideTitle">{onboardingStep.title}</div>
                            <div className="muted small">{onboardingStep.desc}</div>
                            <div className="firstRunGuideActions">
                              {onboardingStep.number === 2 || onboardingStep.number === 3 ? (
                                <button className="btn small" type="button" onClick={() => selectMobileTab("toolbox")}>
                                  Open Raid Forecast
                                </button>
                              ) : null}
                              <button className="btn small" type="button" onClick={() => selectMobileTab("glossary")}>
                                ? Rules
                              </button>
                            </div>
                          </div>
                        ) : null}
                        <div className="dungeonActionRail">
                          <div className="dungeonActionMeta">
                            <div className="dungeonActionStats">
                              <span className="pill">Day: {state.day}</span>
                              <span className="pill">Turns: {state.turnsSurvived}</span>
                              <span className="pill">Dungeon Lvl: {dungeonLevel}</span>
                            </div>
                            <div className="dungeonActionHint">{dungeonRailStatus}</div>
                            <div className="muted small">{dungeonRailSupport}</div>
                          </div>
                          <div className="dungeonActionButtons">
                            <button className="btn" onClick={beginBattle} disabled={locked || state.movePayload || isBattlePhase || councilSessionActive || !raidPlanReady}>
                              Begin Battle
                            </button>
                            <button className="btn primary" onClick={startRaid} disabled={!canStartRaid || state.movePayload}>
                              Start Raid
                            </button>
                            <button className="btn primary" onClick={endTurn} disabled={!canEndTurn || state.movePayload}>
                              End Turn
                            </button>
                            <button
                              className="btn"
                              onClick={upgradeDungeon}
                              disabled={locked || state.movePayload || !isBuildPhase || state.raidActive || atDungeonLevelCap}
                            >
                              {atDungeonLevelCap ? "Dungeon Maxed" : "Upgrade Dungeon"}
                            </button>
                            <button className="btn" onClick={startMove} disabled={locked || !!state.movePayload || !isBuildPhase}>
                              Move Selected
                            </button>
                            {state.movePayload ? (
                              <button className="btn danger" onClick={cancelMove}>
                                Cancel Move
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="dungeonStage">
                      <div className="grid">
                        {state.grid.map((row, y) =>
                          row.map((t, x) => (
                            (() => {
                              const heroesHere = heroesByTile.get(keyOf(x, y)) || [];
                              const monstersHere = t.room === "monster" ? t.monsters.length : 0;
                              const glyph = getTileGlyph(t, x, y);
                              const stateChip = tileStateChip(t);
                              const artSpec = getTileArtSpec(t, x, y, state.grid, state.ashTrial, brokenTileArt);
                              const utilityArtSpec = getUtilityArtSpec(t, brokenTileArt);
                              const emptyArtSpec = getEmptyTileArtSpec(t, x, y, state.ashTrial, brokenTileArt);
                              const centerMarkerSpec = getTileCenterMarkerSpec(t, x, y, state.ashTrial, brokenTileArt);
                              const radarSpec = getTileRadarSpec(t, x, y, heroesHere, monstersHere, state.turnsSurvived, state.raidActive);
                              const usePathArt = artSpec.enabled && !artSpec.fallbackToGlyph;
                              const useUtilityArt = utilityArtSpec.enabled && !utilityArtSpec.fallbackToGlyph;
                              const useEmptyArt = emptyArtSpec.enabled && !emptyArtSpec.fallbackToGlyph;
                              const useArt = usePathArt || useUtilityArt || useEmptyArt;
                              const typeBadge = isAshBreachAt(state.ashTrial, x, y)
                                ? "AE"
                                : t.entrance
                                ? "E"
                                : t.core
                                ? "C"
                                : t.room === "trap"
                                ? TRAP_ICONS[t.trapType] || "TR"
                                : t.room === "monster"
                                ? MONSTER_ROOM_ICONS[t.roomType] || "MR"
                                : t.room === "utility"
                                ? UTILITY_ICONS[t.roomType] || "UR"
                                : "";
                              const typeTone = isAshBreachAt(state.ashTrial, x, y)
                                ? "ash"
                                : t.entrance
                                ? "entrance"
                                : t.core
                                ? "core"
                                : t.room === "trap"
                                ? "trap"
                                : t.room === "monster"
                                ? "monster"
                                : t.room === "utility"
                                ? "utility"
                                : "neutral";
                              const linkedUtilityTone =
                                useUtilityArt && t.room === "utility" && roomSynergyTag(t) && isLinkedRoom(state.grid, x, y)
                                  ? roomSynergyTag(t).toLowerCase()
                                  : "";
                              return (
                                <button
                                  key={keyOf(x, y)}
                                  className={tileClass(t, x, y) + (useArt ? " art-backed" : "") + (useEmptyArt ? " empty-art" : "")}
                                  onClick={() => setSelected(x, y)}
                                  title={`(${x + 1},${y + 1})`}
                                  disabled={locked}
                                >
                                  {useArt ? (
                                    <>
                                      {useEmptyArt ? (
                                        <img
                                          className="tileArt tileArtEmpty"
                                          src={emptyArtSpec.src}
                                          alt=""
                                          draggable="false"
                                          onError={() => noteBrokenTileArt(emptyArtSpec.src)}
                                        />
                                      ) : null}
                                      {usePathArt ? (
                                        <img
                                          className="tileArt"
                                          src={artSpec.src}
                                          alt=""
                                          draggable="false"
                                          style={{ transform: `rotate(${artSpec.rotationDeg}deg)` }}
                                          onError={() => noteBrokenTileArt(artSpec.src)}
                                        />
                                      ) : null}
                                      {centerMarkerSpec.enabled ? (
                                        <img
                                          className="tileCenterMarker"
                                          src={centerMarkerSpec.src}
                                          alt=""
                                          draggable="false"
                                          onError={() => noteBrokenTileArt(centerMarkerSpec.src)}
                                        />
                                      ) : null}
                                      {useUtilityArt ? (
                                        <>
                                          <img
                                            className="tileArt tileArtSupportBase"
                                            src={utilityArtSpec.baseSrc}
                                            alt=""
                                            draggable="false"
                                            onError={() => noteBrokenTileArt(utilityArtSpec.baseSrc)}
                                          />
                                          <img
                                            className="tileArt tileArtSupportFeature"
                                            src={utilityArtSpec.centerpieceSrc}
                                            alt=""
                                            draggable="false"
                                            onError={() => noteBrokenTileArt(utilityArtSpec.centerpieceSrc)}
                                          />
                                        </>
                                      ) : null}
                                      {tileHasAura(x, y) ? <span className="tileArtAura" /> : null}
                                      {radarSpec.enabled ? (
                                        <span className={`tileRadar ${radarSpec.engaged ? "engaged" : ""}`}>
                                          {radarSpec.dots.map((dot) => (
                                            <span
                                              key={dot.key}
                                              className={`tileRadarDot ${dot.side}`}
                                              style={dot.style}
                                            />
                                          ))}
                                        </span>
                                      ) : null}
                                      {stateChip ? <span className="tileChip tileChipState">{stateChip}</span> : null}
                                      {typeBadge ? <span className={`tileChip tileChipType ${typeTone}`}>{typeBadge}</span> : null}
                                      {linkedUtilityTone ? <span className={`tileChipLink ${linkedUtilityTone}`} /> : null}
                                    </>
                                  ) : (
                                    <>
                                      {radarSpec.enabled ? (
                                        <span className={`tileRadar ${radarSpec.engaged ? "engaged" : ""}`}>
                                          {radarSpec.dots.map((dot) => (
                                            <span
                                              key={dot.key}
                                              className={`tileRadarDot ${dot.side}`}
                                              style={dot.style}
                                            />
                                          ))}
                                        </span>
                                      ) : null}
                                      {stateChip ? <span className="tileChip tileChipState">{stateChip}</span> : null}
                                      {glyph.text ? <span className={`tileGlyph ${glyph.tone || ""}`}>{glyph.text}</span> : null}
                                      {glyph.subtext ? <span className="tileGlyphSub">{glyph.subtext}</span> : null}
                                    </>
                                  )}
                                </button>
                              );
                            })()
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
  );
}
