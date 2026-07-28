import { COUNCIL_RAID_FACTIONS, DOCTRINE_RULES, MONSTER_ROOMS, STANDARD_ARTIFACTS, TRAP_TYPES, UTILITY_ROOMS } from "../gameContent";
import { BUILD_VERSION } from "../playtestSupport";
import { COUNCIL_FAVOR_RULES, councilFavorBadgeTone, formatCouncilFavorLabel, getCouncilFavorInfo } from "../systems/council";
import { anyUtilityRoom, isAshBreachAt, isAshTrialActive } from "../systems/dungeon";
import { artifactCopyCap, artifactTagsForDisplay, hydrateArtifactDefinition } from "../systems/economy";
import { traderPrice } from "../systems/marketActions";
import { MONSTER_PASSIVE_MAP, doctrineUpgradeCost, effectiveMonsterRoomCapValue, entityStatusSummary, formatMonsterPassiveList, monsterEvolutionStageValue, monsterSpeedValue } from "../systems/monsters";
import { objectiveTargetLabel } from "../systems/pathing";
import { MONSTER_ROOM_ICONS, TRAP_ICONS, UTILITY_ICONS, invaderLabel, invaderPassiveSummary } from "../systems/presentation";
import { HERO_LEADER_TRAIT_MAP, HERO_ORDER_MAP, MARKET_ART, getRaidDirectiveRule, resolveRaidDirectiveKey, topArchetypesFromWeights } from "../systems/raids";
import { ECONOMY_ROLES, ROOM_TIER_MAX, formatStars, nextCouncilDay, safeEntityLabel, safeEntityMaxHp, safeEntityStars, scaleByDay } from "../systems/shared";

export default function ToolboxPanel(props) {
  const {
    activateDominionPower,
    activeEntrances,
    addMonsterToRoom,
    advancedToolboxOpen,
    armTrap,
    artifactMods,
    attendCouncil,
    buildMonsterRoom,
    buildTrapRoom,
    buildUtilityRoom,
    buyArtifact,
    buyFromFleshMarket,
    buyFromTrader,
    canManageSelectedMonsterRoom,
    checklist,
    clearTile,
    concludeCouncil,
    copyDiagnosticsBundle,
    core,
    councilAwaitingConclusion,
    councilSessionActive,
    dealerCatalogExhausted,
    declineCouncil,
    drawerPanelTitle,
    effectiveMonsterRoomCap,
    evolutionStageLabel,
    exportRun,
    fuseA,
    fuseB,
    fusionPreview,
    importRun,
    invPreview,
    isBattlePhase,
    isBuildPhase,
    loadRun,
    locked,
    maxRooms,
    newRun,
    ownedArtifactCounts,
    pendingDirective,
    pendingEscalationLevel,
    pendingRaidCrestSrc,
    pendingRaidDifficulty,
    pendingRaidLeaderTrait,
    pendingRaidMeta,
    pendingRaidOrder,
    pendingRaidType,
    projectedTrapDamage,
    raidForecastMix,
    recruitMonster,
    resetRun,
    restoreBackup,
    returnAllMonstersFromSelectedRoom,
    returnMonsterFromSelectedRoom,
    roomsPlaced,
    roomTypeDesc,
    roomTypeIcon,
    roomTypeName,
    roomUpgradePrice,
    sacrificeIdx,
    sacrificeMonster,
    saveRun,
    saveStatus,
    selectedHeroes,
    selectedHeroIntent,
    selectedInventoryMonsterIndex,
    selectedIsAshBreach,
    selectedLinkBonus,
    selectedLinkInfo,
    selectedMonsterRoomCapValue,
    selectedMonsterRoomHasSpace,
    selectedReadiness,
    selectedTile,
    selectedTileAuras,
    selectInvasionChoice,
    setActiveTab,
    setAdvancedToolboxOpen,
    setFuseA,
    setFuseB,
    setSacrificeIdx,
    setSelectedInventoryMonsterIndex,
    setState,
    showInvasionChoiceCards,
    standardArtifactAtCapCount,
    standardArtifactCollectedCount,
    state,
    triggerFusion,
    upgradeDoctrine,
    upgradeRoom,
    usePendingRaidCrest,
    validation,
  } = props;

  return (
    <section className="panel panel--toolbox">
                      {drawerPanelTitle("Toolbox")}

                    <div className="toolboxScroll">
                      <div className="card">
                        <div className="cardTitle">Checklist</div>
                        <div className="checkRow">
                          <span className={"checkDot " + (checklist.entrancePlaced ? "on" : "off")} />
                          Entrance placed
                        </div>
                        <div className="checkRow">
                          <span className={"checkDot " + (checklist.corePlaced ? "on" : "off")} />
                          Core placed
                        </div>
                        <div className="checkRow">
                          <span className={"checkDot " + (checklist.validPath ? "on" : "off")} />
                          {isAshTrialActive(state.ashTrial) ? "All entrances connected" : "Valid path E to C"}
                        </div>
                        {!validation.ok && <div className="warn">{validation.reason}</div>}
                      </div>

                      <div className="card">
                        <div className="cardTitle">Daily Event</div>
                        <div className="muted">{state.dailyEvent?.name || "Calm Day"}</div>
                        <div className="muted small">{state.dailyEvent?.desc || "No unusual effects today."}</div>
                      </div>

                      <div className="card">
                        <div className="cardTitle">Raid Forecast</div>
                        {councilSessionActive ? (
                          <div className="entityItem">
                            <div className="entityName">Council Day</div>
                            <div className="entityMeta">No invasion is chosen today. Resolve the Council, then conclude it to advance.</div>
                            {councilAwaitingConclusion ? (
                              <button className="btn small" onClick={concludeCouncil}>
                                Conclude Council
                              </button>
                            ) : null}
                          </div>
                        ) : showInvasionChoiceCards ? (
                          <div className="entityList">
                            <div className="muted">
                              {state.selectedInvasionKey ? "Selected invasion. You can change it until battle begins." : "Choose the next invasion before battle begins."}
                            </div>
                            {(state.invasionChoices || []).map((choice) => {
                              const order = choice.orderKey ? HERO_ORDER_MAP[choice.orderKey] : null;
                              const leaderTrait = choice.leaderTraitKey ? HERO_LEADER_TRAIT_MAP[choice.leaderTraitKey] : null;
                              const directive = getRaidDirectiveRule(choice.directiveKey || order?.directiveKey || resolveRaidDirectiveKey(choice.raidType, null, state.day));
                              return (
                                <button
                                  className={`entityItem invasionChoice ${state.selectedInvasionKey === choice.key ? "active" : ""}`}
                                  key={`invasion-choice-${choice.key}`}
                                  onClick={() => selectInvasionChoice(choice.key)}
                                >
                                  <div className="entityName">{choice.label}</div>
                                  {order ? <div className="entityMeta">{order.name} | {order.modifier}</div> : null}
                                  <div className="muted small">Directive: {directive.name} | Expected mix: {order ? topArchetypesFromWeights(order.archetypeWeights || {}, 2).join(" / ") : "Mixed pressure"}</div>
                                  {leaderTrait ? <div className="muted small">Leader Trait: {leaderTrait.name} - {leaderTrait.desc}</div> : null}
                                  <div className="entityStats">
                                    Rewards x{(choice.rewardMult || 1).toFixed(2)}
                                    {choice.clearEvolutionBonus ? ` | Clear +${choice.clearEvolutionBonus} Evolution` : ""}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <>
                            <div className="raidForecastHeader">
                              {usePendingRaidCrest && pendingRaidType !== "council" ? (
                                <img className="expeditionCrest" src={pendingRaidCrestSrc} alt="" draggable="false" />
                              ) : null}
                              <div>
                                <div className="entityName">
                                  {pendingRaidMeta.label}{pendingEscalationLevel ? ` - Level ${pendingEscalationLevel}` : ""}
                                </div>
                                {pendingRaidOrder && pendingRaidType !== "council" ? (
                                  <div className="entityMeta">
                                    {pendingRaidOrder.name} | {pendingRaidOrder.modifier}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                            <div className="muted">{pendingRaidMeta.desc}</div>
                            <div className="muted">Directive: {pendingDirective.name}</div>
                            {pendingRaidLeaderTrait && pendingRaidType !== "council" ? (
                              <div className="muted small">Leader Trait: {pendingRaidLeaderTrait.name} - {pendingRaidLeaderTrait.desc}</div>
                            ) : null}
                            <div className="muted small">
                              Expected mix: {raidForecastMix} | Rewards x{(pendingRaidDifficulty.rewardMult || 1).toFixed(2)}
                              {pendingRaidDifficulty.clearEvolutionBonus ? ` | Clear +${pendingRaidDifficulty.clearEvolutionBonus} Evolution` : ""}
                            </div>
                            {state.scoutQueue?.length ? (
                              <div className="entityList">
                                <div className="entityItem">
                                  <div className="entityName">Revealed Ahead</div>
                                  <div className="entityMeta">Scout effects expose upcoming invaders before the raid fully unfolds.</div>
                                </div>
                                {state.scoutQueue.slice(0, 2).map((h, idx) => (
                                  <div className="entityItem" key={`forecast-scout-${h.id}-${idx}`}>
                                    <div className="entityName">{h.name}</div>
                                    <div className="entityMeta">
                                      {safeEntityLabel(h.race, "Unknown")} {safeEntityLabel(h.class, "Hero")} | {formatStars(safeEntityStars(h))} | {h.archetypeLabel || "Zealot"}
                                    </div>
                                    {h.profileKey || h.orderName ? (
                                      <div className="muted small">
                                        {h.profileName || "Expeditioner"}{h.orderName ? ` | ${h.orderName}` : ""}{h.isRaidLeader && h.leaderTraitName ? ` | ${h.leaderTraitName}` : ""}
                                      </div>
                                    ) : null}
                                    <div className="entityStats">
                                      HP {h.hp}/{safeEntityMaxHp(h)} | ATK {h.atk}
                                    </div>
                                    <div className="muted small">{invaderPassiveSummary(h)}</div>
                                    <div className="muted small">
                                      {h.raidOriginLabel || "Hero Raid"}{h.factionName ? ` | ${h.factionName}` : ""}{h.isRaidLeader ? " | Leader" : ""}
                                      {h.raidDirectiveKey ? ` | ${getRaidDirectiveRule(h.raidDirectiveKey).name}` : ""}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                            {state.pendingCouncilRaid?.attackers?.length ? (
                              <div className="entityList">
                                {state.pendingCouncilRaid.attackers.map((attacker) => (
                                  <div className="entityItem" key={`raid-attacker-${attacker.key}`}>
                                    <div className="entityName">{attacker.memberName}</div>
                                    <div className="entityMeta">{attacker.raidName}</div>
                                    <div className="muted">{attacker.raidModifier}</div>
                                    <div className="muted small">
                                      Directive {getRaidDirectiveRule(attacker.directiveKey || COUNCIL_RAID_FACTIONS[attacker.key]?.defaultDirective || state.pendingCouncilRaid?.directiveKey || "rush-core").name} |{" "}
                                      {topArchetypesFromWeights(attacker.archetypeWeights || {}, 2).join(" / ") || "Mixed pressure"}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                            {state.nextRaidBoons?.length ? (
                              <div className="entityList">
                                {state.nextRaidBoons.map((boon, idx) => (
                                  <div className="entityItem" key={`raid-boon-${idx}`}>
                                    <div className="entityName">{boon.label || "Raid Influence"}</div>
                                    <div className="entityMeta">{boon.sponsorName || "Council leverage"}</div>
                                    <div className="entityMeta">{boon.desc}</div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="muted small">No stored council leverage for the next raid.</div>
                            )}
                          </>
                        )}
                      </div>

                      <details
                        className="toolboxAdvanced"
                        open={advancedToolboxOpen}
                        onToggle={(event) => setAdvancedToolboxOpen(event.currentTarget.open)}
                      >
                        <summary>Advanced Management</summary>
                        <div className="toolboxAdvancedBody">
                      <div className="card">
                        <div className="cardTitle">Tile Details</div>
                        <div className="kv">
                          <div>Pos</div>
                          <div>({state.selected.x + 1}, {state.selected.y + 1})</div>
                          <div>Entrance</div>
                          <div>{selectedTile.entrance ? "YES" : "no"}</div>
                          <div>Ash Breach</div>
                          <div>{selectedIsAshBreach ? "YES" : "no"}</div>
                          <div>Core</div>
                          <div>{selectedTile.core ? "YES" : "no"}</div>
                          <div>Room</div>
                          <div>
                            <span className="iconBadge">{roomTypeIcon(selectedTile) || "--"}</span>
                            {roomTypeName(selectedTile)}
                          </div>
                          <div>Room Tier</div>
                          <div>{selectedTile.room ? selectedTile.roomTier || 1 : "n/a"}</div>
                          <div>Monster Cap</div>
                          <div>{effectiveMonsterRoomCap(selectedTile)}</div>
                          <div>Synergy Tag</div>
                          <div>{selectedLinkInfo.tag || "none"}</div>
                          <div>Link State</div>
                          <div>{selectedLinkInfo.tag ? (selectedLinkInfo.linked ? "Linked" : "Unlinked") : "n/a"}</div>
                          <div>Linked Bonus</div>
                          <div>{selectedLinkBonus}</div>
                          <div>Room Effect</div>
                          <div>{roomTypeDesc(selectedTile, state.selected.x, state.selected.y) || "n/a"}</div>
                          <div>Readiness</div>
                          <div>{selectedReadiness}</div>
                          <div>Trap Armed</div>
                          <div>{selectedTile.room === "trap" ? (selectedTile.trap ? "YES" : "no") : "n/a"}</div>
                          <div>Trap Star</div>
                          <div>{selectedTile.room === "trap" ? formatStars(selectedTile.trapStar ?? selectedTile.trapStars ?? 1) : "n/a"}</div>
                          <div>Trap Rank</div>
                          <div>{selectedTile.room === "trap" ? Math.max(1, selectedTile.trapRank ?? selectedTile.roomTier ?? 1) : "n/a"}</div>
                          <div>Trap Charges</div>
                          <div>{selectedTile.room === "trap" ? Math.max(0, selectedTile.trapChargesRemaining ?? 0) : "n/a"}</div>
                          <div>Trap Cooldown</div>
                          <div>{selectedTile.room === "trap" ? Math.max(0, selectedTile.trapCooldownRemaining ?? 0) : "n/a"}</div>
                          <div>Trap Broken</div>
                          <div>{selectedTile.room === "trap" ? (selectedTile.trapBroken ? "YES" : "no") : "n/a"}</div>
                          <div>Projected Trap</div>
                          <div>{selectedTile.room === "trap" ? projectedTrapDamage(selectedTile, state.selected.x, state.selected.y) : "n/a"}</div>
                          <div>Nearby Auras</div>
                          <div>{selectedTileAuras.length ? selectedTileAuras.join(", ") : "none"}</div>
                          <div>Heroes Here</div>
                          <div>
                            {selectedHeroes.length ? (
                              <div className="entityList">
                                {selectedHeroes.map((h) => (
                                  <div className="entityItem" key={h.id}>
                                    <div className="entityName">
                                      {h.name} ({invaderLabel(h)})
                                    </div>
                                    <div className="entityMeta">
                                      {safeEntityLabel(h.race, "Unknown")} {safeEntityLabel(h.class, "Hero")} | {formatStars(safeEntityStars(h))} | {invaderPassiveSummary(h)}
                                    </div>
                                    {h.profileKey || h.orderName ? (
                                      <div className="muted">
                                        {h.profileName || "Expeditioner"}{h.orderName ? ` | ${h.orderName}` : ""}{h.isRaidLeader && h.leaderTraitName ? ` | Leader Trait ${h.leaderTraitName}` : ""}
                                      </div>
                                    ) : null}
                                    <div className="entityStats">
                                      HP {h.hp}/{safeEntityMaxHp(h)} | ATK {h.atk} | DEF {h.def || 0} | SHD {h.shd || 0} | SPD {h.spd || 0}
                                    </div>
                                    <div className="muted">
                                      Origin {h.raidOriginLabel || "Hero Raid"}{h.factionName ? ` | ${h.factionName}` : ""}{h.isRaidLeader ? " | Leader" : ""} | Behavior {h.archetypeLabel || "Zealot"}{h.raidDirectiveKey ? ` | Directive ${getRaidDirectiveRule(h.raidDirectiveKey).name}` : ""}{h.memory?.lastIntent ? ` | Intent ${h.memory.lastIntent}` : ""}
                                    </div>
                                    <div className="muted">
                                      Objective {h.memory?.currentObjective || "Press the Core"}{h.memory?.targetTile ? ` | Target ${objectiveTargetLabel(h.memory.targetTile)}` : ""}
                                    </div>
                                    <div className="muted">Status: {entityStatusSummary(h)}</div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="entityEmpty">none</div>
                            )}
                          </div>
                          <div>Monsters Here</div>
                          <div>
                            {selectedTile.monsters.length ? (
                              <div className="entityList">
                                {selectedTile.monsters.map((m, idx) => (
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
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="entityEmpty">none</div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="card">
                        <div className="cardTitle">Currencies</div>
                        <div className="kv">
                          <div>Soulshards</div>
                          <div>{state.currency.soulshards}</div>
                          <div>Essence</div>
                          <div>{state.currency.essence}</div>
                          <div>Dominion</div>
                          <div>{state.currency.dominion}</div>
                          <div>Evolution</div>
                          <div>{state.currency.evolution}</div>
                          <div>Darkcrystals</div>
                          <div>{state.currency.darkcrystals}</div>
                        </div>
                      </div>

                      <div className="card">
                        <div className="cardTitle">Economy Roles</div>
                        <div className="entityList">
                          {ECONOMY_ROLES.map(([name, desc]) => (
                            <div className="entityItem" key={`economy-${name}`}>
                              <div className="entityName">{name}</div>
                              <div className="entityMeta">{desc}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="card">
                        <div className="cardTitle">Doctrine Tree</div>
                        <div className="entityList">
                          {Object.values(DOCTRINE_RULES).map((rule) => {
                            const currentLevel = state.doctrines?.[rule.key] || 0;
                            const nextLevel = rule.levels[currentLevel] || null;
                            const nextLevelCost = doctrineUpgradeCost(rule, currentLevel, artifactMods);
                            return (
                              <div className="entityItem" key={`doctrine-${rule.key}`}>
                                <div className="entityName">
                                  {rule.name} ({currentLevel}/{rule.levels.length})
                                </div>
                                <div className="entityMeta">Uses {rule.currency}. Current: {rule.levels.slice(0, currentLevel).map((level) => level.desc).join(" ") || "No doctrine bonus yet."}</div>
                                <div className="row">
                                  <button className="btn" onClick={() => upgradeDoctrine(rule.key)} disabled={!nextLevel || locked || !isBuildPhase}>
                                    {nextLevel ? `Upgrade (${nextLevelCost} ${rule.currency})` : "Maxed"}
                                  </button>
                                  <div className="muted">{nextLevel ? nextLevel.desc : "Mastered."}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="card">
                        <div className="cardTitle">Council of Dungeonlords</div>
                        {state.council?.active ? (
                          <>
                            <div className="muted">Day {state.council.day} Council is in session.</div>
                            <div className="entityList">
                              {(state.council?.roster || []).map((m) => (
                                (() => {
                                  const favorInfo = getCouncilFavorInfo(state.councilFavor?.[m.key] || 0);
                                  return (
                                    <div className="entityItem" key={m.key}>
                                      <div className="entityName">
                                        {m.name} - {m.title}
                                      </div>
                                      <div className="entityMeta">{m.theme}</div>
                                      <div className="row">
                                        <span className={`badge ${councilFavorBadgeTone(favorInfo)}`}>{formatCouncilFavorLabel(favorInfo)}</span>
                                        <div className="muted">{m.role}</div>
                                      </div>
                                    </div>
                                  );
                                })()
                              ))}
                            </div>
                            <div className="entityList">
                              {COUNCIL_FAVOR_RULES.map((line) => (
                                <div className="entityItem" key={`toolbox-favor-rule-${line}`}>
                                  <div className="entityMeta">{line}</div>
                                </div>
                              ))}
                            </div>
                            <div className="row">
                              <button className="btn" onClick={attendCouncil}>
                                Attend
                              </button>
                              <button className="btn danger" onClick={declineCouncil}>
                                Decline
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="muted">Next Council: Day {nextCouncilDay(state.day)}.</div>
                        )}
                      </div>

                      <div className="card marketCard marketCard--flesh" style={{ "--market-card-art": `url(${MARKET_ART.flesh})` }}>
                        <div className="marketCardBackdrop" />
                        <div className="cardTitle">Flesh Market (Maltheron)</div>
                        {state.fleshMarketUntilDay >= state.day && state.fleshMarketUntilDay > 0 ? (
                          <>
                            <div className="muted">Open until Day {state.fleshMarketUntilDay}. Darkcrystals compete with Core Doctrine.</div>
                            <div className="row">
                              <select className="select" value={sacrificeIdx} onChange={(e) => setSacrificeIdx(e.target.value)}>
                                <option value="">Sacrifice: pick monster</option>
                                {state.invMonsters.map((m, idx) => (
                                  <option key={`sac-${idx}`} value={idx} disabled={!!m.isUnique || !!m.isFused}>
                                    {m.name}{m.isUnique ? " (Unique)" : m.isFused ? " (Fused)" : ""} ({formatStars(safeEntityStars(m))})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="row">
                              <button className="btn danger" onClick={() => sacrificeMonster(Number(sacrificeIdx))} disabled={sacrificeIdx === ""}>
                                Sacrifice
                              </button>
                              <div className="muted">Inventory only. Unique monsters cannot be sacrificed.</div>
                            </div>
                            <div className="entityList marketOfferList">
                              {state.fleshMarketStock?.length ? (
                                state.fleshMarketStock.map((offer, idx) => (
                                  <div className="entityItem marketOfferItem" key={`flesh-offer-${offer.key}-${idx}`}>
                                    <div className="entityName">{offer.name}</div>
                                    <div className="entityMeta">
                                      {offer.type === "monster" ? "Unique Monster" : "Unique Artifact"}
                                      {offer.type === "monster" ? ` | ${formatStars(offer.stars)}` : ""}
                                    </div>
                                    <div className="entityMeta">{offer.desc}</div>
                                    {offer.type === "monster" ? (
                                      <div className="muted small">
                                        Passives: {(offer.passiveKeys || []).map((key) => MONSTER_PASSIVE_MAP[key]?.name || key).join(", ")}
                                      </div>
                                    ) : null}
                                    <div className="muted">Cost: {offer.cost} Darkcrystals</div>
                                    <div className="row">
                                      <button className="btn" onClick={() => buyFromFleshMarket(idx)} disabled={!!offer.soldOut || state.currency.darkcrystals < offer.cost}>
                                        {offer.soldOut ? "Owned" : "Buy"}
                                      </button>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="entityEmpty">No stock remains in the market today.</div>
                              )}
                            </div>
                            <div className="card marketSubcard marketSubcard--crucible" style={{ "--market-card-art": `url(${MARKET_ART.crucible})` }}>
                              <div className="marketCardBackdrop" />
                              <div className="cardTitle">Fusion Crucible</div>
                              <div className="row">
                                <select className="select" value={fuseA} onChange={(e) => setFuseA(e.target.value)}>
                                  <option value="">Primary body</option>
                                  {state.invMonsters.map((m, idx) => (
                                    <option key={`fuse-a-${idx}`} value={idx} disabled={!!m.isUnique || !!m.isFused}>
                                      {m.name}{m.isUnique ? " (Unique)" : m.isFused ? " (Fused)" : ""} ({formatStars(safeEntityStars(m))})
                                    </option>
                                  ))}
                                </select>
                                <select className="select" value={fuseB} onChange={(e) => setFuseB(e.target.value)}>
                                  <option value="">Secondary trait</option>
                                  {state.invMonsters.map((m, idx) => (
                                    <option key={`fuse-b-${idx}`} value={idx} disabled={!!m.isUnique || !!m.isFused || `${idx}` === `${fuseA}`}>
                                      {m.name}{m.isUnique ? " (Unique)" : m.isFused ? " (Fused)" : ""} ({formatStars(safeEntityStars(m))})
                                    </option>
                                  ))}
                                </select>
                              </div>
                              {fusionPreview ? (
                                <>
                                  <div className="entityMeta">
                                    Output: <span className="iconBadge">{fusionPreview.recipe?.icon || fusionPreview.result.icon}</span> {fusionPreview.result.name} | {formatStars(fusionPreview.result.stars)} | Stage {monsterEvolutionStageValue(fusionPreview.result)}
                                  </div>
                                  <div className="muted small">
                                    Archetype: {fusionPreview.recipe?.name || "Abomination"} | Inherited Passives: {formatMonsterPassiveList(fusionPreview.result.passiveKeys, fusionPreview.result.passiveRanks)}
                                  </div>
                                  <div className="muted small">
                                    Stats: HP {fusionPreview.result.stats.maxHp} | ATK {fusionPreview.result.stats.atk} | DEF {fusionPreview.result.stats.def}
                                  </div>
                                  <div className="muted small">Cost: {fusionPreview.cost} Darkcrystals | Secondary recipe shapes the fusion result.</div>
                                </>
                              ) : (
                                <div className="muted small">Choose a primary monster and a secondary trait donor. Unique and fused monsters cannot be used in v1.</div>
                              )}
                              <div className="row">
                                <button
                                  className="btn"
                                  onClick={triggerFusion}
                                  disabled={!fusionPreview || state.currency.darkcrystals < fusionPreview.cost || state.phase !== "build"}
                                >
                                  Fuse Monsters
                                </button>
                                <div className="muted small">Primary sets the body. Secondary sets the recipe and one inherited trait.</div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="muted">Closed. Gain access by accepting Maltheron's Council boon.</div>
                        )}
                      </div>

                      <div className="card">
                        <div className="cardTitle">Path Preview</div>
                        {selectedHeroes[0] && selectedHeroIntent ? (
                          <>
                            <div className="entityName">{invaderLabel(selectedHeroes[0])}</div>
                            <div className="entityMeta">
                              {selectedHeroes[0].archetypeLabel || "Zealot"} | {selectedHeroIntent.directiveLabel}
                            </div>
                            <div className="muted">Objective: {selectedHeroIntent.currentObjective}</div>
                            <div className="muted">Target Tile: {selectedHeroIntent.targetTileLabel}</div>
                            <div className="muted small">Intent: {selectedHeroIntent.intent}</div>
                            <div className="muted">
                              Path tiles glow cyan. Likely lure candidates glow amber.
                            </div>
                          </>
                        ) : activeEntrances.length > 0 && core ? (
                          <div className="muted">
                            {activeEntrances.length > 1
                              ? "All active entrance routes are highlighted while no invader is selected."
                              : "Default entrance-to-core route is highlighted while no invader is selected."}
                          </div>
                        ) : (
                          <div className="muted">No active entrance-to-core route is available to preview.</div>
                        )}
                      </div>

                      <div className="card">
                        <div className="cardTitle">Build Rooms</div>
                        <div className="row">
                          <select
                            className="select"
                            value={state.selectedTrapType}
                            onChange={(e) => setState((s) => ({ ...s, selectedTrapType: e.target.value }))}
                            disabled={locked || state.movePayload || !isBuildPhase}
                          >
                            {TRAP_TYPES.map((trap) => (
                              <option key={trap.key} value={trap.key}>
                                {TRAP_ICONS[trap.key] || "TR"} - {trap.name}
                              </option>
                            ))}
                          </select>
                          <div className="muted">Trap type.</div>
                        </div>
                        <div className="row">
                          <button
            className="btn"
            onClick={() => {
              buildTrapRoom();        // whatever your function is called
              setActiveTab("dungeon");
            }}
            disabled={locked || state.movePayload || !isBuildPhase}
          >
            Build Trap Room
          </button>
                          <div className="muted">Counts toward {maxRooms} rooms.</div>
                        </div>
                        <div className="row">
                          <select
                            className="select"
                            value={state.selectedMonsterRoomType}
                            onChange={(e) => setState((s) => ({ ...s, selectedMonsterRoomType: e.target.value }))}
                            disabled={locked || state.movePayload || !isBuildPhase}
                          >
                            {MONSTER_ROOMS.map((room) => (
                              <option key={room.key} value={room.key}>
                                {MONSTER_ROOM_ICONS[room.key] || "MR"} - {room.name}
                              </option>
                            ))}
                          </select>
                          <div className="muted">Monster room passive.</div>
                        </div>
                        <div className="row">
                          <button
            className="btn"
            onClick={() => {
              buildMonsterRoom();     // whatever your function is called
              setActiveTab("dungeon");
            }}
            disabled={locked || state.movePayload || !isBuildPhase}
                          >
            Build Monster Room
          </button>

                          <div className="muted">Up to {effectiveMonsterRoomCapValue(state, 1)} monsters inside.</div>
                        </div>
                        <div className="row">
                          <select
                            className="select"
                            value={state.selectedUtilityRoomType}
                            onChange={(e) => setState((s) => ({ ...s, selectedUtilityRoomType: e.target.value }))}
            disabled={locked || state.movePayload || !isBuildPhase}
                          >
                            {UTILITY_ROOMS.map((room) => (
                              <option key={room.key} value={room.key} disabled={anyUtilityRoom(state.grid, room.key)}>
                                {UTILITY_ICONS[room.key] || "UR"} - {room.name} (Unique)
                              </option>
                            ))}
                          </select>
                          <div className="muted">
                            Utility aura <span className="badge unique">Unique</span>
                          </div>
                        </div>
                        <div className="row">
                          <button
                            className="btn"
                            onClick={() => {
                              buildUtilityRoom();
                              setActiveTab("dungeon");
                            }}
            disabled={locked || state.movePayload || !isBuildPhase}
                          >
                            Build Utility Room
                          </button>
                          <div className="muted">Affects adjacent tiles.</div>
                        </div>
                        <div className="row">
                          <button
                            className="btn"
                            onClick={armTrap}
                            disabled={locked || state.movePayload || !isBuildPhase || selectedTile.room !== "trap"}
                          >
                            {selectedTile.room === "trap" && selectedTile.trap ? "Disarm Trap" : "Arm Trap"}
                          </button>
                          <div className="muted">Trap stars add charges. Rank adds damage. Cooldown refreshes every turn.</div>
                        </div>
                        <div className="row">
                          <button className="btn danger" onClick={clearTile} disabled={locked || state.movePayload || !isBuildPhase || selectedTile.entrance || isAshBreachAt(state.ashTrial, state.selected.x, state.selected.y)}>Clear Tile</button>
                          <div className="muted">Clears room/flags. Monsters return to inventory. Entrance is fixed.</div>
                        </div>

                        <div className="muted small">Rooms placed: {roomsPlaced} / {maxRooms}</div>
                      </div>

                      <div className="card">
                        <div className="cardTitle">Room Architect</div>
                        <div className="row">
                          <button
                            className="btn"
                            onClick={upgradeRoom}
                            disabled={
                              locked ||
                              state.movePayload ||
                              !isBuildPhase ||
                              !selectedTile.room ||
                              (selectedTile.roomTier || 1) >= ROOM_TIER_MAX ||
                              (roomUpgradePrice !== null && state.currency.essence < roomUpgradePrice)
                            }
                          >
                            Upgrade Room
                          </button>
                          <div className="muted">
                            {selectedTile.room
                              ? `Cost ${scaleByDay(roomUpgradePrice, state.day, 0.03, 3.0)} Essence. Max Tier ${ROOM_TIER_MAX}.`
                              : "Select a room to upgrade."}
                          </div>
                        </div>
                      </div>

                      <div className="card">
                        <div className="cardTitle">Room Staffing</div>
                        {selectedTile.room === "monster" ? (
                          <>
                            <div className="row">
                              <select
                                className="select"
                                value={selectedInventoryMonsterIndex}
                                onChange={(e) => setSelectedInventoryMonsterIndex(e.target.value)}
                                disabled={!canManageSelectedMonsterRoom || !state.invMonsters.length || !selectedMonsterRoomHasSpace}
                              >
                                <option value="">Choose inventory monster</option>
                                {state.invMonsters.map((monster, idx) => (
                                  <option key={`room-staff-${idx}`} value={idx}>
                                    {monster.name} ({formatStars(safeEntityStars(monster))})
                                  </option>
                                ))}
                              </select>
                              <div className="muted">
                                Room {selectedTile.monsters.length}/{selectedMonsterRoomCapValue}
                              </div>
                            </div>
                            <div className="row">
                              <button
                                className="btn"
                                onClick={addMonsterToRoom}
                                disabled={!canManageSelectedMonsterRoom || !selectedMonsterRoomHasSpace || selectedInventoryMonsterIndex === ""}
                              >
                                Place Selected Monster
                              </button>
                              <div className="muted">
                                {artifactMods.roomWithdrawHealFull
                                  ? "Stable Hooks heals withdrawn monsters to full."
                                  : "Build phase only. Transfer uses return -> place."}
                              </div>
                            </div>
                            {selectedTile.monsters.length ? (
                              <div className="entityList">
                                {selectedTile.monsters.map((monster, idx) => (
                                  <div className="entityItem" key={`room-monster-${idx}`}>
                                    <div className="entityName">{monster.name}</div>
                                    <div className="entityMeta">
                                      {safeEntityLabel(monster.race, "Monster")}
                                      <span className="badge class">{safeEntityLabel(monster.class, "Brute")}</span>
                                      {monster.isFused ? <span className="badge unique">Fused</span> : null} | {formatStars(safeEntityStars(monster))}
                                    </div>
                                    <div className="entityStats">
                                      HP {monster.hp}/{safeEntityMaxHp(monster)} | ATK {monster.atk} | DEF {monster.def || 0} | SPD {monsterSpeedValue(monster)}
                                    </div>
                                    <div className="muted">Status: {entityStatusSummary(monster)}</div>
                                    <div className="row">
                                      <button className="btn small" onClick={() => returnMonsterFromSelectedRoom(idx)} disabled={!canManageSelectedMonsterRoom}>
                                        Return to Inventory
                                      </button>
                                      <div className="muted small">{evolutionStageLabel(monster)}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="entityEmpty">No monsters stationed here.</div>
                            )}
                            <div className="row">
                              <button className="btn danger" onClick={returnAllMonstersFromSelectedRoom} disabled={!canManageSelectedMonsterRoom || !selectedTile.monsters.length}>
                                Withdraw All
                              </button>
                              <div className="muted">Return the room roster to inventory.</div>
                            </div>
                          </>
                        ) : (
                          <div className="muted">Select a monster room to place or withdraw monsters.</div>
                        )}
                      </div>

                      <div className="card marketCard marketCard--trader" style={{ "--market-card-art": `url(${MARKET_ART.trader})` }}>
                        <div className="marketCardBackdrop" />
                        <div className="cardTitle">Monster Trader</div>
                        {state.traderStock && state.traderStock.length > 0 ? (
                          <div className="entityList marketOfferList">
                            {state.traderStock.map((m, idx) => (
                              <div className="entityItem marketOfferItem" key={`trade-${m.key}-${idx}`}>
                                <div className="entityName">{m.name}</div>
                                <div className="entityMeta">
                                  {safeEntityLabel(m.race, "Monster")}
                                  <span className="badge class">{safeEntityLabel(m.class, "Brute")}</span> | {formatStars(safeEntityStars(m))}
                                </div>
                                <div className="entityStats">
                                  HP {m.hp}/{safeEntityMaxHp(m)} | ATK {m.atk} | DEF {m.def || 0}
                                </div>
                                <div className="row">
                                  <button className="btn" onClick={() => buyFromTrader(idx)} disabled={!isBuildPhase}>
                                    Buy ({traderPrice(m, state.day)} Soulshards)
                                  </button>
                                  <div className="muted">Daily stock</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="muted">Trader is out of stock.</div>
                        )}
                      </div>

                      <div className="card marketCard marketCard--dealer" style={{ "--market-card-art": `url(${MARKET_ART.dealer})` }}>
                        <div className="marketCardBackdrop" />
                        <div className="cardTitle">Shady Dealer</div>
                        <div className="muted">Collected {standardArtifactCollectedCount}/{STANDARD_ARTIFACTS.length} Standard Artifacts.</div>
                        {state.shadyStock && state.shadyStock.length > 0 ? (
                          <div className="entityList marketOfferList">
                            {state.shadyStock.map((rawArtifact, idx) => {
                              const artifact = hydrateArtifactDefinition(rawArtifact);
                              const ownedCount = ownedArtifactCounts[artifact.key] || 0;
                              const copyCap = artifactCopyCap(artifact);
                              const atCap = ownedCount >= copyCap;
                              return (
                                <div className="entityItem marketOfferItem" key={`artifact-${artifact.key}-${idx}`}>
                                  <div className="entityName">{artifact.name}</div>
                                  <div className="entityMeta">{artifact.desc}</div>
                                  <div className="dockBadgeRow">
                                    {artifactTagsForDisplay(artifact).map((tag) => (
                                      <span className="badge favorNeutral" key={`${artifact.key}-tag-${tag}`}>
                                        {tag}
                                      </span>
                                    ))}
                                    <span className="muted small">Owned {ownedCount}/{copyCap}</span>
                                  </div>
                                  <div className="row">
                                    <button className="btn" onClick={() => buyArtifact(idx)} disabled={!isBuildPhase || atCap}>
                                      Buy ({artifact.cost.amount} {artifact.cost.currency})
                                    </button>
                                    <div className="muted">{atCap ? "Copy cap reached" : "Daily stock"}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="muted">
                            {standardArtifactAtCapCount >= STANDARD_ARTIFACTS.length
                              ? "Dealer has nothing left to sell. You have completed the standard artifact catalog."
                              : dealerCatalogExhausted
                              ? "Dealer has no eligible standard artifacts left to offer at your current unlocks."
                              : "Dealer is out of stock."}
                          </div>
                        )}
                      </div>

                      <div className="card">
                        <div className="cardTitle">Dominion Powers</div>
                        <div className="row">
                          <button
                            className="btn"
                            onClick={() => activateDominionPower("pulse")}
                            disabled={locked || !isBattlePhase || state.currency.dominion < 2}
                          >
                            Pulse (2 DP)
                          </button>
                          <div className="muted">Damages all heroes before they act.</div>
                        </div>
                        <div className="row">
                          <button
                            className="btn"
                            onClick={() => activateDominionPower("shield")}
                            disabled={locked || !isBattlePhase || state.currency.dominion < 2}
                          >
                            Shield (2 DP)
                          </button>
                          <div className="muted">Adds +10 Core Shield.</div>
                        </div>
                        <div className="row">
                          <button
                            className="btn"
                            onClick={() => activateDominionPower("speed")}
                            disabled={locked || !isBattlePhase || state.currency.dominion < 1}
                          >
                            Speed (1 DP)
                          </button>
                          <div className="muted">Monsters act first this turn.</div>
                        </div>
                        <div className="row">
                          <button
                            className="btn"
                            onClick={() => activateDominionPower("strength")}
                            disabled={locked || !isBattlePhase || state.currency.dominion < 1}
                          >
                            Strength (1 DP)
                          </button>
                          <div className="muted">Monsters gain +1 ATK this turn.</div>
                        </div>
                      </div>

                      <div className="card">
                        <div className="cardTitle">Recruit</div>
                        <div className="row">
                          <button className="btn" onClick={recruitMonster} disabled={locked || state.movePayload || !isBuildPhase}>Recruit Monster</button>
                          <div className="muted">Cost scales with day and monster type.</div>
                        </div>
                        <div className="row">
                          <div className="muted">Inventory: {state.invMonsters.length} monsters</div>
                        </div>
                        {invPreview.length > 0 && (
                          <div className="muted small">
                            Next up: {invPreview.map((m) => `${m.name} (${formatStars(safeEntityStars(m))})`).join(", ")}
                          </div>
                        )}
                      </div>
                      <div className="card">
                        <div className="cardTitle">Invading Party</div>
                        {state.currentParty && state.currentParty.length > 0 ? (
                          <div className="entityList">
                            {state.currentParty
                              .slice()
                              .sort((a, b) => (b.spd || 0) - (a.spd || 0))
                              .map((h) => (
                                <div className="entityItem" key={`party-${h.id}`}>
                                  <div className="entityName">{h.name}</div>
                                  <div className="entityMeta">
                                    {safeEntityLabel(h.race, "Unknown")} {safeEntityLabel(h.class, "Hero")} | {formatStars(safeEntityStars(h))} | {h.archetypeLabel || "Zealot"}
                                  </div>
                                  {h.profileKey || h.orderName ? (
                                    <div className="muted small">
                                      {h.profileName || "Expeditioner"}{h.orderName ? ` | ${h.orderName}` : ""}{h.isRaidLeader && h.leaderTraitName ? ` | ${h.leaderTraitName}` : ""}
                                    </div>
                                  ) : null}
                                  <div className="entityStats">
                                    HP {h.hp}/{safeEntityMaxHp(h)} | ATK {h.atk} | DEF {h.def || 0} | SHD {h.shd || 0} | SPD {h.spd || 0}
                                  </div>
                                  <div className="muted small">{invaderPassiveSummary(h)}</div>
                                  <div className="muted small">
                                    {h.raidOriginLabel || "Hero Raid"}{h.factionName ? ` | ${h.factionName}` : ""}{h.isRaidLeader ? " | Leader" : ""}
                                    {h.raidDirectiveKey ? ` | ${getRaidDirectiveRule(h.raidDirectiveKey).name}` : ""}
                                  </div>
                                  <div className="muted small">
                                    Objective {h.memory?.currentObjective || "Press the Core"}{h.memory?.targetTile ? ` | ${objectiveTargetLabel(h.memory.targetTile)}` : ""}
                                  </div>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <div className="muted">No party generated yet.</div>
                        )}
                      </div>

                      <div className="card">
                        <div className="cardTitle">Last Raid</div>
                        {state.lastRaidReport ? (
                          <>
                            <div className="muted">Turns: {state.lastRaidReport.turns}</div>
                            <div className="muted">Kills: {state.lastRaidReport.kills}</div>
                            <div className="muted">Essence Gained: {state.lastRaidReport.essence}</div>
                            <div className="muted">Soulshards Gained: {state.lastRaidReport.soulshards}</div>
                            <div className="muted">Core Damage: {state.lastRaidReport.coreDamage}</div>
                            {state.lastRaidReport.rewardMultiplier ? (
                              <div className="muted">Reward Multiplier: x{state.lastRaidReport.rewardMultiplier.toFixed(2)}</div>
                            ) : null}
                            {state.lastRaidReport.escalationLevel ? (
                              <div className="muted">Escalation Level: {state.lastRaidReport.escalationLevel}</div>
                            ) : null}
                            {state.lastRaidReport.clearEvolutionBonus ? (
                              <div className="muted">Clear Bonus: +{state.lastRaidReport.clearEvolutionBonus} Evolution</div>
                            ) : null}
                          </>
                        ) : (
                          <div className="muted">No raid report yet.</div>
                        )}
                      </div>

                      <div className="card">
                        <div className="cardTitle">Run</div>
                        <div className="row">
                          <button className="btn" onClick={resetRun}>Reset Run</button>
                          <div className="muted">Keeps layout. Clears monsters. Rearms traps.</div>
                        </div>
                        <div className="row">
                          <button className="btn" onClick={newRun}>New Run</button>
                          <div className="muted">Wipes everything and starts fresh.</div>
                        </div>
                        <div className="row">
                          <button className="btn" onClick={loadRun}>Load Run</button>
                          <div className="muted">Loads the last auto-saved run.</div>
                        </div>
                        <div className="row">
                          <button className="btn" onClick={saveRun}>Save Now</button>
                          <div className="muted">Manual save for testing.</div>
                        </div>
                      </div>

                      <div className="card">
                        <div className="cardTitle">Playtest Support</div>
                        <div className="muted small">
                          Reports are local and player-controlled. Include the build, seed, reproduction steps, and a screenshot for visual issues.
                        </div>
                        <div className="row">
                          <a
                            className="btn"
                            href={`${import.meta.env.BASE_URL}guidebook/Dungeonlord_Guidebook.pdf`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Guidebook
                          </a>
                          <a
                            className="btn"
                            href={`${import.meta.env.BASE_URL}playtest/Dungeonlord_Bug_Report_Template.txt`}
                            download
                          >
                            Bug Report Template
                          </a>
                        </div>
                        <div className="row">
                          <button className="btn" onClick={exportRun}>Export Save</button>
                          <div className="muted">Downloads a portable JSON save.</div>
                        </div>
                        <div className="row">
                          <button className="btn" type="button" onClick={() => document.getElementById("run-import-input")?.click()}>Import Save</button>
                          <input id="run-import-input" className="visuallyHidden" type="file" accept="application/json,.json" onChange={importRun} />
                          <div className="muted">Loads a JSON save from another device.</div>
                        </div>
                        <div className="row">
                          <button className="btn" onClick={restoreBackup}>Restore Backup</button>
                          <div className="muted">Returns to the previous automatic save.</div>
                        </div>
                        <div className="row">
                          <button className="btn" onClick={() => copyDiagnosticsBundle(false)}>Copy Diagnostics</button>
                          <button className="btn" onClick={() => copyDiagnosticsBundle(true)}>Copy With Save</button>
                        </div>
                        <div className="muted small">
                          Copy Diagnostics for normal reports. Use Copy With Save only when exact reproduction is needed.
                        </div>
                        <div className="muted small">Build {BUILD_VERSION} | Seed {state.runSeed} | {saveStatus}</div>
                      </div>
                        </div>
                      </details>
                    </div>
                  </section>
  );
}
