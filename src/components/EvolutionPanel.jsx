import { MONSTER_ROOM_MAP } from "../systems/dungeon";
import { evoSourceKey } from "../systems/monsterActions";
import { entityStatusSummary, monsterCanEvolve, monsterSpeedValue } from "../systems/monsters";
import { formatStars, safeEntityLabel, safeEntityMaxHp, safeEntityStars } from "../systems/shared";

export default function EvolutionPanel(props) {
  const {
    cancelEvolution,
    chooseEvolution,
    drawerPanelTitle,
    evolutionButtonLabel,
    evolutionStageLabel,
    isBuildPhase,
    startEvolution,
    state,
  } = props;

  return (
    <section className="panel panel--evolution">
                    {drawerPanelTitle("Evolution")}
                    <div className="toolboxScroll">
                      <div className="card">
                        <div className="cardTitle">Evolution Points</div>
                        <div className="muted">Global: {state.currency.evolution}</div>
                      </div>
                      <div className="card">
                        <div className="cardTitle">Evolvable Monsters</div>
                        {(() => {
                          const items = [];
                          state.invMonsters.forEach((m, idx) => {
                            if (monsterCanEvolve(m, state.currency.evolution)) {
                              items.push({ source: { type: "inv", index: idx }, monster: m, label: "Inventory" });
                            }
                          });
                          state.grid.forEach((row, y) => {
                            row.forEach((t, x) => {
                              if (t.room === "monster" && t.monsters.length) {
                                t.monsters.forEach((m, idx) => {
                                  if (monsterCanEvolve(m, state.currency.evolution)) {
                                    const roomName = MONSTER_ROOM_MAP[t.roomType]?.name || "Monster Room";
                                    items.push({
                                      source: { type: "room", x, y, index: idx },
                                      monster: m,
                                      label: `${roomName} (${x + 1},${y + 1})`,
                                    });
                                  }
                                });
                              }
                            });
                          });
                          if (!items.length) {
                            return <div className="entityEmpty">No monsters have enough Evolution to advance.</div>;
                          }
                          return (
                            <div className="entityList">
                              {items.map((item, idx) => (
                                <div className="entityItem" key={`evo-${idx}`}>
                                  <div className="entityName">{item.monster.name}</div>
                                  <div className="entityMeta">
                                    {safeEntityLabel(item.monster.race, "Monster")}
                                    <span className="badge class">{safeEntityLabel(item.monster.class, "Brute")}</span> |{" "}
                                    {item.monster.isFused ? <span className="badge unique">Fused</span> : null}{" "}
                                    {formatStars(safeEntityStars(item.monster))} | Evo {item.monster.evoPoints || 0} |{" "}
                                    {safeEntityLabel(item.monster.passive, "None")}
                                  </div>
                                  <div className="entityStats">
                                    HP {item.monster.hp}/{safeEntityMaxHp(item.monster)} | ATK {item.monster.atk} | DEF {item.monster.def || 0} | SPD {monsterSpeedValue(item.monster)}
                                  </div>
                                  <div className="muted">Location: {item.label}</div>
                                  <div className="muted">
                                    {evolutionStageLabel(item.monster)}{item.monster.branchClass ? ` | Branch ${item.monster.branchClass}` : ""}{item.monster.fusionParents?.length ? ` | ${item.monster.fusionParents.join(" + ")}` : ""}
                                  </div>
                                  <div className="muted">Status: {entityStatusSummary(item.monster)}</div>
                                  <div className="row">
                                    <button
                                      className="btn"
                                      onClick={() => startEvolution(item.source)}
                                      disabled={!isBuildPhase || !monsterCanEvolve(item.monster, state.currency.evolution)}
                                    >
                                      {evolutionButtonLabel(item.monster)}
                                    </button>
                                    <div className="muted">{evolutionStageLabel(item.monster)}</div>
                                  </div>
                                  {state.evolutionOffer &&
                                    evoSourceKey(state.evolutionOffer.source) === evoSourceKey(item.source) && (
                                      <div className="evolveOptions">
                                        {state.evolutionOffer.options.map((opt, optIdx) => (
                                          <button
                                            className="btn small"
                                            key={`evo-choice-${idx}-${optIdx}`}
                                            onClick={() => chooseEvolution(item.source, opt)}
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
                          );
                        })()}
                      </div>
                    </div>
                  </section>
  );
}
