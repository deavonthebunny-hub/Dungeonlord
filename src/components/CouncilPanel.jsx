import { COUNCIL_CHAMBER_ART, COUNCIL_FAVOR_RULES, councilFavorBadgeTone, councilQuestGoalLabel, councilQuestProgressLabel, councilRewardLabel, formatCouncilFavorLabel, getCouncilFavorInfo } from "../systems/council";

export default function CouncilPanel(props) {
  const {
    acceptCouncilBoon,
    acceptCouncilQuest,
    attendCouncil,
    concludeCouncil,
    contentWarnings,
    councilQuestPlacementBlock,
    declineCouncil,
    drawerPanelTitle,
    focusedCouncilMember,
    focusedCouncilSponsor,
    focusedCouncilStanding,
    setFocusedCouncilKey,
    state,
  } = props;

  return (
    <section className="panel panel--council" style={{ "--council-scroll-url": `url(${COUNCIL_CHAMBER_ART.scrollTexture})` }}>
                    {drawerPanelTitle("Council of the Dungeonlords")}
                    <div className="toolboxScroll">
                      {state.councilSession && state.councilSession.day === state.day ? (
                        <>
                          <div className="card">
                            <div className="cardTitle">Attending Lords</div>
                            <div className="entityList">
                              {(state.council?.roster || []).map((m) => (
                                (() => {
                                  const favorInfo = getCouncilFavorInfo(state.councilFavor?.[m.key] || 0);
                                  return (
                                    <button
                                      className={`entityItem ${focusedCouncilMember?.key === m.key ? "active" : ""}`}
                                      key={`council-${m.key}`}
                                      onClick={() => setFocusedCouncilKey(m.key)}
                                      type="button"
                                    >
                                      <div className="entityName">
                                        {m.name} - {m.title}
                                      </div>
                                      <div className="entityMeta">{m.theme}</div>
                                      <div className="row">
                                        <span className={`badge ${councilFavorBadgeTone(favorInfo)}`}>{formatCouncilFavorLabel(favorInfo)}</span>
                                        <div className="muted">{m.role}</div>
                                      </div>
                                    </button>
                                  );
                                })()
                              ))}
                            </div>
                            {state.councilSession.status === "pending" && (
                              <div className="row">
                                <button className="btn" onClick={attendCouncil}>
                                  Attend
                                </button>
                                <button className="btn danger" onClick={declineCouncil}>
                                  Decline
                                </button>
                              </div>
                            )}
                            {state.councilSession.status === "attended" && <div className="muted">Status: Attended</div>}
                            {state.councilSession.status === "declined" && <div className="muted">Status: Declined</div>}
                            {state.councilSession.status !== "pending" ? (
                              <button className="btn primary" onClick={concludeCouncil}>
                                Conclude Council
                              </button>
                            ) : null}
                          </div>

                          <div className="card">
                            <div className="cardTitle">Favor Rules</div>
                            <div className="entityList">
                              {COUNCIL_FAVOR_RULES.map((line) => (
                                <div className="entityItem" key={`favor-rule-side-${line}`}>
                                  <div className="entityMeta">{line}</div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="card">
                            <div className="cardTitle">Council Discourse</div>
                            <div className="entityList">
                              {state.councilSession.dialogue.map((line, idx) => (
                                <div className="entityItem" key={`council-line-${idx}`}>
                                  <div className="entityMeta">{line}</div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="card">
                            <div className="cardTitle">Rumors & Intelligence</div>
                            <div className="entityList">
                              {state.councilSession.rumors.map((line, idx) => (
                                <div className="entityItem" key={`council-rumor-${idx}`}>
                                  <div className="entityMeta">{line}</div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="card">
                            <div className="cardTitle">Sponsor Boon</div>
                            {focusedCouncilSponsor?.boon ? (
                              <>
                                <div className="entityName">{focusedCouncilSponsor.boon.title}</div>
                                <div className="entityMeta">{focusedCouncilSponsor.boon.desc}</div>
                                <div className="muted">{councilRewardLabel(focusedCouncilSponsor.boon.reward)}</div>
                                <div className="muted small">{focusedCouncilSponsor.boon.raidEffect?.desc || "No next-raid leverage."}</div>
                                <div className="muted small">{formatCouncilFavorLabel(focusedCouncilSponsor.favorInfo || focusedCouncilStanding)}</div>
                                {!focusedCouncilSponsor.available ? <div className="muted small">{focusedCouncilSponsor.lockedReason}</div> : null}
                                <div className="row">
                                  {state.councilSession.status !== "attended" ? (
                                    <button className="btn" disabled>
                                      Attend First
                                    </button>
                                  ) : !focusedCouncilSponsor.available ? (
                                    <button className="btn" disabled>
                                      Unavailable
                                    </button>
                                  ) : state.councilSession.acceptedCouncilBoonKey === focusedCouncilSponsor.key ? (
                                    <button className="btn" disabled>
                                      Accepted
                                    </button>
                                  ) : state.councilSession.acceptedCouncilBoonKey ? (
                                    <button className="btn" disabled>
                                      Boon Taken
                                    </button>
                                  ) : state.councilSession.courtedSponsorKey && state.councilSession.courtedSponsorKey !== focusedCouncilSponsor.key ? (
                                    <button className="btn" disabled>
                                      Courting Another Sponsor
                                    </button>
                                  ) : (
                                    <button className="btn" onClick={() => acceptCouncilBoon(focusedCouncilSponsor.key)}>
                                      Accept Boon
                                    </button>
                                  )}
                                </div>
                              </>
                            ) : (
                              <div className="entityEmpty">
                                {state.councilSession.status === "attended" ? "Select a Dungeonlord to review their boon." : "Attend the Council to access boons."}
                              </div>
                            )}
                          </div>

                          <div className="card">
                            <div className="cardTitle">Active Council Quest</div>
                            {state.councilQuest?.active ? (
                              <>
                                <div className="entityName">{state.councilQuest.title}</div>
                                <div className="entityMeta">{state.councilQuest.desc}</div>
                                <div className="muted">{state.councilQuest.sponsorName}</div>
                                <div className="muted">Progress: {councilQuestProgressLabel(state, state.councilQuest)}</div>
                                <div className="muted">Reward: {councilRewardLabel(state.councilQuest.reward)}</div>
                                {state.councilQuest.failurePenalty ? <div className="muted small">Failure: {state.councilQuest.failurePenalty}</div> : null}
                              </>
                            ) : (
                              <div className="entityEmpty">No active quest.</div>
                            )}
                          </div>

                          <div className="card">
                            <div className="cardTitle">Sponsor Quests</div>
                            {focusedCouncilSponsor ? (
                              <div className="entityList">
                              {["standard", "hard"].map((difficulty) => {
                                const quest = focusedCouncilSponsor.quests?.[difficulty];
                                if (!quest) return null;
                                const taken = state.councilSession.acceptedCouncilQuestId === quest.id;
                                const blockedBySponsor =
                                  !!state.councilSession.courtedSponsorKey && state.councilSession.courtedSponsorKey !== focusedCouncilSponsor.key;
                                const placementBlockedReason = councilQuestPlacementBlock(quest);
                                return (
                                  <div className="entityItem" key={quest.id}>
                                    <div className="entityName">
                                      {quest.title} ({difficulty})
                                    </div>
                                      <div className="entityMeta">{quest.desc}</div>
                                    <div className="muted">{councilQuestGoalLabel(quest)}</div>
                                    <div className="muted">Progress: {councilQuestProgressLabel(state, quest)}</div>
                                    <div className="muted">Reward: {councilRewardLabel(quest.reward)}</div>
                                    <div className="muted small">{formatCouncilFavorLabel(focusedCouncilSponsor.favorInfo || focusedCouncilStanding)}</div>
                                    {quest.failurePenalty ? <div className="muted small">Failure: {quest.failurePenalty}</div> : null}
                                    {!quest.available ? <div className="muted small">{quest.lockedReason}</div> : null}
                                    {placementBlockedReason ? <div className="muted small">{placementBlockedReason}</div> : null}
                                    <div className="row">
                                      {state.councilSession.status !== "attended" ? (
                                        <button className="btn" disabled>
                                          Attend First
                                        </button>
                                      ) : !quest.available ? (
                                        <button className="btn" disabled>
                                          Unavailable
                                        </button>
                                      ) : placementBlockedReason ? (
                                        <button className="btn" disabled>
                                          Frontline Needed
                                        </button>
                                      ) : taken ? (
                                        <button className="btn" disabled>
                                          Accepted
                                        </button>
                                      ) : state.councilSession.acceptedCouncilQuestId || state.councilQuest?.active ? (
                                          <button className="btn" disabled>
                                            Quest Taken
                                          </button>
                                        ) : blockedBySponsor ? (
                                          <button className="btn" disabled>
                                            Courting Another Sponsor
                                          </button>
                                        ) : (
                                          <button className="btn" onClick={() => acceptCouncilQuest(focusedCouncilSponsor.key, difficulty)}>
                                            Accept {difficulty}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="entityEmpty">Select a Dungeonlord to review their quests.</div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="card">
                          <div className="muted">The Council is not in session.</div>
                        </div>
                      )}
                      {contentWarnings.length ? (
                        <div className="card">
                          <div className="cardTitle">Content Validation</div>
                          <div className="entityList">
                            {contentWarnings.map((warning, idx) => (
                              <div className="entityItem" key={`content-warning-${idx}`}>
                                <div className="entityMeta">{warning}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </section>
  );
}
