import { FUSION_ARCHETYPE_RULES, MONSTER_ROOMS, STANDARD_ARTIFACTS, STANDARD_HERO_PROFILES, STANDARD_MONSTERS, TRAP_TYPES, UTILITY_ROOMS } from "../gameContent";
import { artifactTagsForDisplay } from "../systems/economy";
import { MONSTER_PASSIVE_RULES } from "../systems/monsters";
import { MONSTER_ROOM_ICONS, TRAP_ICONS, UTILITY_ICONS } from "../systems/presentation";
import { EXPEDITION_ORDER_CRESTS, HERO_LEADER_TRAIT_MAP, HERO_ORDER_LIST, HERO_ORDER_MAP, HERO_PASSIVE_MAP, HERO_PASSIVE_RULES, getRaidDirectiveRule, topArchetypesFromWeights } from "../systems/raids";
import { NEW_RECRUIT_MONSTER_KEYS, STATUS_RULE_LIST } from "../systems/shared";

export default function GlossaryPanel(props) {
  const {
    drawerPanelTitle,
  } = props;

  return (
    <section className="panel panel--glossary">
                    {drawerPanelTitle("Glossary")}
                    <div className="toolboxScroll">
                      <div className="card glossaryEssentials">
                        <div className="cardTitle">First Run Essentials</div>
                        <div className="entityList">
                          <div className="entityItem">
                            <div className="entityName">Build and Battle</div>
                            <div className="entityMeta">Build is for construction, staffing, markets, and choosing the next invasion. Begin Battle locks the invasion; Start Raid releases it; End Turn resolves movement and room combat.</div>
                          </div>
                          <div className="entityItem">
                            <div className="entityName">Currencies</div>
                            <div className="entityMeta">Essence builds the dungeon. Soulshards grow the roster. Evolution advances monsters. Dominion powers tactical actions. Darkcrystals fund doctrines and the Flesh Market.</div>
                          </div>
                          <div className="entityItem">
                            <div className="entityName">Core Pressure</div>
                            <div className="entityMeta">Core damage persists between raids. Protecting it is the long-term survival clock of an endless run; ordinary build phases do not repair it.</div>
                          </div>
                          <div className="entityItem">
                            <div className="entityName">Traps</div>
                            <div className="entityMeta">Armed traps spend charges when triggered. Remaining charges and cooldowns reset automatically when the next build day begins.</div>
                          </div>
                          <div className="entityItem">
                            <div className="entityName">Links and Auras</div>
                            <div className="entityMeta">Blood, Ward, and Hunt rooms link only to an orthogonally adjacent room with the same tag. Utility auras are separate radius effects and do not create links.</div>
                          </div>
                          <div className="entityItem">
                            <div className="entityName">Raid Cadence</div>
                            <div className="entityMeta">Choose Normal or Elite on ordinary days. Every fifth non-Council day is a forced Escalation Raid. Days divisible by 10 belong to the Council.</div>
                          </div>
                        </div>
                      </div>
                      <div className="card">
                        <div className="cardTitle">Room Rules</div>
                        <div className="entityList">
                          <div className="entityItem">
                            <div className="entityName">Utility Rooms</div>
                            <div className="entityMeta">Support-only tiles. They affect adjacent tiles within 1 square and are not meant to be traversed.</div>
                          </div>
                          <div className="entityItem">
                            <div className="entityName">Monster Rooms</div>
                            <div className="entityMeta">House your monsters and add a room passive. Base cap is 3 monsters, increased by room tier and doctrine.</div>
                          </div>
                          <div className="entityItem">
                            <div className="entityName">Trap Rooms</div>
                            <div className="entityMeta">Trigger when invaders enter. Trap stars and ranks increase damage, charges, and cooldown efficiency.</div>
                          </div>
                          <div className="entityItem">
                            <div className="entityName">Room Upgrades</div>
                            <div className="entityMeta">Most room effects scale with tier. Check the Selected Tile panel for the current exact values.</div>
                          </div>
                        </div>
                      </div>

                      <div className="card">
                        <div className="cardTitle">Room Links</div>
                        <div className="entityList">
                          <div className="entityItem">
                            <div className="entityName">Link Rule</div>
                            <div className="entityMeta">New Blood, Ward, and Hunt rooms become Linked when at least one orthogonally adjacent room shares the same tag.</div>
                          </div>
                          <div className="entityItem">
                            <div className="entityName">No Stacking</div>
                            <div className="entityMeta">A linked bonus only needs one matching neighbor and does not stack from multiple matching neighbors.</div>
                          </div>
                        </div>
                      </div>

                      <div className="card">
                        <div className="cardTitle">Utility Rooms</div>
                        <div className="entityList">
                          {UTILITY_ROOMS.map((room) => (
                            <div className="entityItem" key={room.key}>
                              <div className="entityName">
                                <span className="iconBadge">{UTILITY_ICONS[room.key] || "UR"}</span>
                                {room.name}
                              </div>
                              <div className="entityMeta">{room.desc}</div>
                              {room.synergyTag ? <div className="muted small">Tag {room.synergyTag} | Linked: {room.linkDesc}</div> : null}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="card">
                        <div className="cardTitle">Monster Rooms</div>
                        <div className="entityList">
                          {MONSTER_ROOMS.map((room) => (
                            <div className="entityItem" key={room.key}>
                              <div className="entityName">
                                <span className="iconBadge">{MONSTER_ROOM_ICONS[room.key] || "MR"}</span>
                                {room.name}
                              </div>
                              <div className="entityMeta">{room.desc}</div>
                              {room.synergyTag ? <div className="muted small">Tag {room.synergyTag} | Linked: {room.linkDesc}</div> : null}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="card">
                        <div className="cardTitle">Trap Rooms</div>
                        <div className="entityList">
                          {TRAP_TYPES.map((trap) => (
                            <div className="entityItem" key={trap.key}>
                              <div className="entityName">
                                <span className="iconBadge">{TRAP_ICONS[trap.key] || "TR"}</span>
                                {trap.name}
                              </div>
                              <div className="entityMeta">{trap.desc}</div>
                              <div className="muted small">Base damage {trap.baseDmg} | Base cooldown {trap.baseCooldown}</div>
                              {trap.synergyTag ? <div className="muted small">Tag {trap.synergyTag} | Linked: {trap.linkDesc}</div> : null}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="card">
                        <div className="cardTitle">Monster Passives</div>
                        <div className="entityList">
                          {MONSTER_PASSIVE_RULES.map((p) => (
                            <div className="entityItem" key={p.key}>
                              <div className="entityName">{p.name}</div>
                              <div className="entityMeta">{p.desc}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="card">
                        <div className="cardTitle">Hero Passives</div>
                        <div className="entityList">
                          {HERO_PASSIVE_RULES.map((p) => (
                            <div className="entityItem" key={p.key}>
                              <div className="entityName">{p.name}</div>
                              <div className="entityMeta">{p.desc}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="card">
                        <div className="cardTitle">Hero Orders</div>
                        <div className="entityList">
                          {HERO_ORDER_LIST.map((order) => (
                            <div className="entityItem" key={order.key}>
                              <div className="entityName">
                                {EXPEDITION_ORDER_CRESTS[order.key] ? (
                                  <img className="glossaryCrest" src={EXPEDITION_ORDER_CRESTS[order.key]} alt="" draggable="false" />
                                ) : null}
                                {order.name}
                              </div>
                              <div className="entityMeta">{order.desc}</div>
                              <div className="muted small">
                                Directive {getRaidDirectiveRule(order.directiveKey).name} | Expected mix{" "}
                                {topArchetypesFromWeights(order.archetypeWeights || {}, 2).join(" / ") || "Mixed pressure"}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="card">
                        <div className="cardTitle">Hero Profiles</div>
                        <div className="entityList">
                          {STANDARD_HERO_PROFILES.map((profile) => (
                            <div className="entityItem" key={profile.key}>
                              <div className="entityName">{profile.name}</div>
                              <div className="entityMeta">
                                {profile.className} | {HERO_ORDER_MAP[profile.orderKey]?.name || profile.orderKey}
                              </div>
                              <div className="muted small">
                                Unlock Day {profile.unlockDay} | Passives {(profile.passivePool || []).map((key) => HERO_PASSIVE_MAP[key]?.name || key).join(", ")}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="card">
                        <div className="cardTitle">Leader Traits</div>
                        <div className="entityList">
                          {Object.values(HERO_LEADER_TRAIT_MAP).map((trait) => (
                            <div className="entityItem" key={trait.key}>
                              <div className="entityName">{trait.name}</div>
                              <div className="entityMeta">{trait.desc}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="card">
                        <div className="cardTitle">Statuses</div>
                        <div className="entityList">
                          {STATUS_RULE_LIST.map((status) => (
                            <div className="entityItem" key={status.key}>
                              <div className="entityName">
                                {status.name} <span className="muted small">({status.short})</span>
                              </div>
                              <div className="entityMeta">{status.desc}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="card">
                        <div className="cardTitle">New Recruits</div>
                        <div className="entityList">
                          {STANDARD_MONSTERS.filter((monster) => NEW_RECRUIT_MONSTER_KEYS.has(monster.key)).map((monster) => (
                            <div className="entityItem" key={monster.key}>
                              <div className="entityName">
                                <span className="iconBadge">{monster.icon}</span>
                                {monster.name}
                              </div>
                              <div className="entityMeta">
                                HP {monster.hp} | ATK {monster.atk} | Cost {monster.cost}
                              </div>
                              <div className="muted small">
                                Unlock Day {monster.unlockDay} | Classes {(monster.classPool || []).join(", ") || (monster.affinityPool || []).join(", ")}
                              </div>
                              <div className="muted small">
                                Passive Bias {(monster.passiveBias || []).join(", ") || "None"} | Fusion {monster.fusionHint || "auto"}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="card">
                        <div className="cardTitle">Flesh Market Fusion</div>
                        <div className="entityList">
                          {Object.values(FUSION_ARCHETYPE_RULES).map((rule) => (
                            <div className="entityItem" key={rule.key}>
                              <div className="entityName">
                                <span className="iconBadge">{rule.icon}</span>
                                {rule.name}
                              </div>
                              <div className="entityMeta">Secondary role recipe for {rule.classTags.join(", ")}.</div>
                              <div className="muted small">Base cost {rule.baseCost} Darkcrystals. Primary body + secondary archetype shaping.</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="card">
                        <div className="cardTitle">Artifacts</div>
                        <div className="entityList">
                          {STANDARD_ARTIFACTS.map((artifact) => (
                            <div className="entityItem" key={artifact.key}>
                              <div className="entityName">{artifact.name}</div>
                              <div className="entityMeta">{artifact.desc}</div>
                              <div className="dockBadgeRow">
                                {artifactTagsForDisplay(artifact).map((tag) => (
                                  <span className="badge favorNeutral" key={`${artifact.key}-glossary-tag-${tag}`}>
                                    {tag}
                                  </span>
                                ))}
                                <span className="muted small">Unlock Day {artifact.unlockDay}</span>
                                <span className="muted small">Max {artifact.maxCopies}</span>
                              </div>
                              <div className="muted small">Cost: {artifact.cost.amount} {artifact.cost.currency}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>
  );
}
