import { STANDARD_ARTIFACTS } from "../gameContent";
import { artifactCopyCap, artifactTagsForDisplay } from "../systems/economy";
import { entityStatusSummary, monsterCanEvolve, monsterSpeedValue } from "../systems/monsters";
import { formatStars, safeEntityLabel, safeEntityMaxHp, safeEntityStars } from "../systems/shared";

export default function InventoryPanel(props) {
  const {
    cancelEvolution,
    canManageSelectedMonsterRoom,
    chooseEvolution,
    drawerPanelTitle,
    evolutionButtonLabel,
    evolutionStageLabel,
    isBuildPhase,
    ownedArtifactGroups,
    placeInventoryMonsterInSelectedRoom,
    selectedMonsterRoomCapValue,
    selectedMonsterRoomHasSpace,
    selectedTile,
    standardArtifactCollectedCount,
    startEvolution,
    state,
  } = props;

  return (
    <section className="panel panel--inventory">
                    {drawerPanelTitle("Monster Inventory")}
                    <div className="toolboxScroll">
                      <div className="card">
                        <div className="cardTitle">Stockpile</div>
                        <div className="muted">Total: {state.invMonsters.length}</div>
                      </div>
                      <div className="card">
                        <div className="cardTitle">Artifacts</div>
                        <div className="muted">Collected {standardArtifactCollectedCount}/{STANDARD_ARTIFACTS.length} Standard Artifacts.</div>
                        {ownedArtifactGroups.length ? (
                          <div className="entityList">
                            {ownedArtifactGroups.map(({ artifact, count }) => (
                              <div className="entityItem" key={`owned-${artifact.key}`}>
                                <div className="entityName">{artifact.name}</div>
                                <div className="entityMeta">{artifact.desc}</div>
                                <div className="dockBadgeRow">
                                  {artifactTagsForDisplay(artifact).map((tag) => (
                                    <span className="badge favorNeutral" key={`${artifact.key}-owned-tag-${tag}`}>
                                      {tag}
                                    </span>
                                  ))}
                                  <span className="muted small">Owned {count}/{artifactCopyCap(artifact)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="entityEmpty">No artifacts owned.</div>
                        )}
                      </div>
                      <div className="card">
                        <div className="cardTitle">Monsters</div>
                        {state.invMonsters.length ? (
                          <div className="entityList">
                            {state.invMonsters.map((m, idx) => (
                              <div className="entityItem" key={`${m.key}-${idx}`}>
                                <div className="entityName">{m.name}</div>
                                <div className="entityMeta">
                                  {safeEntityLabel(m.race, "Monster")}
                                  <span className="badge class">{safeEntityLabel(m.class, "Brute")}</span>
                                  {m.isFused ? <span className="badge unique">Fused</span> : null} | {formatStars(safeEntityStars(m))} |{" "}
                                  {safeEntityLabel(m.passive, "None")}
                                </div>
                                <div className="entityStats">
                                  HP {m.hp}/{safeEntityMaxHp(m)} | ATK {m.atk} | DEF {m.def || 0} | SPD {monsterSpeedValue(m)} | Evo {m.evoPoints || 0}
                                </div>
                                <div className="muted">
                                  {evolutionStageLabel(m)}{m.branchClass ? ` | Branch ${m.branchClass}` : ""}{m.fusionParents?.length ? ` | ${m.fusionParents.join(" + ")}` : ""}
                                </div>
                                <div className="muted">Status: {entityStatusSummary(m)}</div>
                                <div className="row">
                                  <button
                                    className="btn"
                                    onClick={() => startEvolution({ type: "inv", index: idx })}
                                    disabled={!isBuildPhase || !monsterCanEvolve(m, state.currency.evolution)}
                                  >
                                    {evolutionButtonLabel(m)}
                                  </button>
                                  <div className="muted">{evolutionStageLabel(m)}</div>
                                </div>
                                {selectedTile.room === "monster" ? (
                                  <div className="row">
                                    <button
                                      className="btn small"
                                      onClick={() => placeInventoryMonsterInSelectedRoom(idx)}
                                      disabled={!canManageSelectedMonsterRoom || !selectedMonsterRoomHasSpace}
                                    >
                                      Assign to Selected Room
                                    </button>
                                    <div className="muted small">
                                      {selectedMonsterRoomHasSpace
                                        ? `Room ${selectedTile.monsters.length}/${selectedMonsterRoomCapValue}`
                                        : "Selected room is full."}
                                    </div>
                                  </div>
                                ) : null}
                                {state.evolutionOffer &&
                                  state.evolutionOffer.source?.type === "inv" &&
                                  state.evolutionOffer.source?.index === idx && (
                                  <div className="evolveOptions">
                                    {state.evolutionOffer.options.map((opt, optIdx) => (
                                      <button
                                        className="btn small"
                                        key={`${m.key}-evo-${optIdx}`}
                                        onClick={() => chooseEvolution({ type: "inv", index: idx }, opt)}
                                      >
                                        {opt.name} (+{opt.passive})
                                      </button>
                                    ))}
                                    <button className="btn small danger" onClick={cancelEvolution}>
                                      Cancel
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="entityEmpty">No monsters in inventory.</div>
                        )}
                      </div>
                    </div>
                  </section>
  );
}
