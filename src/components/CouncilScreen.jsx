import { COUNCIL_CHAMBER_ART, COUNCIL_FAVOR_RULES, COUNCIL_MEMBER_CRESTS, COUNCIL_MEMBER_MAP, councilFavorBadgeTone, councilQuestGoalLabel, councilQuestProgressLabel, councilRewardLabel, formatCouncilFavorLabel } from "../systems/council";

export default function CouncilScreen(props) {
  const {
    absentCouncilMembers,
    acceptCouncilBoon,
    acceptCouncilQuest,
    brokenCouncilArt,
    concludeCouncil,
    councilAwaitingConclusion,
    councilQuestPlacementBlock,
    councilRoster,
    focusedCouncilBoons,
    focusedCouncilCrestSrc,
    focusedCouncilMember,
    focusedCouncilSponsor,
    focusedCouncilSponsorStatus,
    focusedCouncilStanding,
    noteBrokenCouncilArt,
    setCouncilScreenOpen,
    setFocusedCouncilKey,
    state,
    useCouncilAbsentSilhouette,
    useCouncilBackdrop,
    useCouncilSigil,
    useFocusedCouncilCrest,
  } = props;

  return (
    <div className="councilScreen">
                <div className="councilScreenHeader">
                  <div className="councilScreenTitle">Council of the Dungeonlords - Day {state.day}</div>
                  <div className="row">
                    {councilAwaitingConclusion ? (
                      <button className="btn primary" onClick={concludeCouncil}>
                        Conclude Council
                      </button>
                    ) : null}
                    <button className="btn" onClick={() => setCouncilScreenOpen(false)}>
                      Return to Dungeon
                    </button>
                  </div>
                </div>
                <div className="councilScreenBody">
                  <div className="councilRing">
                    {useCouncilBackdrop ? (
                      <img
                        className="councilHallBackdrop"
                        src={COUNCIL_CHAMBER_ART.backdrop}
                        alt=""
                        draggable="false"
                        onError={() => noteBrokenCouncilArt(COUNCIL_CHAMBER_ART.backdrop)}
                      />
                    ) : null}
                    <div className="councilRingShade" />
                    {absentCouncilMembers.map((m, idx) => {
                      const count = Math.max(1, absentCouncilMembers.length);
                      const angle = (idx / count) * Math.PI * 2 - Math.PI / 2;
                      const radiusX = 330;
                      const radiusY = 212;
                      const x = Math.cos(angle) * radiusX;
                      const y = Math.sin(angle) * radiusY + 4;
                      const crestSrc = COUNCIL_MEMBER_CRESTS[m.key] || null;
                      const useCrest = !!crestSrc && !brokenCouncilArt[crestSrc];
                      return (
                        <div
                          className="councilAbsentPresence"
                          key={`council-absent-${m.key}`}
                          style={{ transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` }}
                        >
                          {useCouncilAbsentSilhouette ? (
                            <img
                              className="councilAbsentSilhouette"
                              src={COUNCIL_CHAMBER_ART.absentSilhouette}
                              alt=""
                              draggable="false"
                              onError={() => noteBrokenCouncilArt(COUNCIL_CHAMBER_ART.absentSilhouette)}
                            />
                          ) : null}
                          {useCrest ? (
                            <img
                              className="councilAbsentCrest"
                              src={crestSrc}
                              alt=""
                              draggable="false"
                              onError={() => noteBrokenCouncilArt(crestSrc)}
                            />
                          ) : null}
                        </div>
                      );
                    })}
                    <div className="councilCenter">
                      {useCouncilSigil ? (
                        <img
                          className="councilCenterSigil"
                          src={COUNCIL_CHAMBER_ART.sigil}
                          alt=""
                          draggable="false"
                          onError={() => noteBrokenCouncilArt(COUNCIL_CHAMBER_ART.sigil)}
                        />
                      ) : null}
                      <div className="councilCenterTitle">The Council Hall</div>
                      <div className="muted">A chamber of oaths, bargains, and measured threats.</div>
                    </div>
                    {councilRoster.map((m, idx) => {
                      const count = Math.max(1, councilRoster.length);
                      const angle = (idx / count) * Math.PI * 2 - Math.PI / 2;
                      const baseRadiusX = count > 5 ? 240 : 220;
                      const baseRadiusY = count > 5 ? 168 : 156;
                      const radialOffset = idx % 2 === 0 ? 12 : -8;
                      const x = Math.cos(angle) * Math.max(150, baseRadiusX + radialOffset);
                      const y = Math.sin(angle) * Math.max(116, baseRadiusY + radialOffset * 0.55);
                      const crestSrc = COUNCIL_MEMBER_CRESTS[m.key] || null;
                      const useCrest = !!crestSrc && !brokenCouncilArt[crestSrc];
                      return (
                        <div
                          className={`councilNode ${focusedCouncilMember?.key === m.key ? "active" : ""} ${useCrest ? "hasCrest" : "fallback"}`}
                          key={`council-node-${m.key}`}
                          style={{ transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` }}
                          onClick={() => setFocusedCouncilKey(m.key)}
                        >
                          {useCrest ? (
                            <img
                              className="councilNodeCrest"
                              src={crestSrc}
                              alt=""
                              draggable="false"
                              onError={() => noteBrokenCouncilArt(crestSrc)}
                            />
                          ) : null}
                          <div className="councilNodeName">{m.name}</div>
                          <div className="councilNodeMeta">{m.title}</div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="councilDetails" style={{ "--council-scroll-url": `url(${COUNCIL_CHAMBER_ART.scrollTexture})` }}>
                    <div className="card councilCard councilFocusedCard">
                      <div className="cardTitle">Focused Dungeonlord</div>
                      {focusedCouncilMember ? (
                        <>
                          <div className="councilFocusedHeader">
                            {useFocusedCouncilCrest ? (
                              <img
                                className="councilFocusedCrest"
                                src={focusedCouncilCrestSrc}
                                alt=""
                                draggable="false"
                                onError={() => noteBrokenCouncilArt(focusedCouncilCrestSrc)}
                              />
                            ) : null}
                            <div className="councilFocusedText">
                              <div className="entityName">{focusedCouncilMember.name}</div>
                              <div className="entityMeta">
                                {focusedCouncilMember.title} - {focusedCouncilMember.theme}
                              </div>
                            </div>
                          </div>
                          <div className="row">
                            <span className={`badge ${councilFavorBadgeTone(focusedCouncilStanding)}`}>
                              {formatCouncilFavorLabel(focusedCouncilStanding)}
                            </span>
                            <div className="muted">{focusedCouncilMember.role}</div>
                          </div>
                          <div className="muted">Standing Effect: {focusedCouncilStanding.summary}</div>
                          <div className="muted">Personality: {focusedCouncilMember.personality}</div>
                          <div className="muted">Current Deal: {focusedCouncilMember.deal}</div>
                          <div className="muted">Sponsor Status: {focusedCouncilSponsorStatus}</div>
                          <div className="muted">
                            Rivalries:{" "}
                            {(focusedCouncilMember.rivalries || []).map((r) => COUNCIL_MEMBER_MAP[r]?.name || r).join(", ")}
                          </div>
                          <div className="muted">
                            Leverage in next raid: {focusedCouncilBoons.length ? focusedCouncilBoons.map((boon) => boon.label).join(", ") : "none"}
                          </div>
                        </>
                      ) : (
                        <div className="entityEmpty">Select a Dungeonlord.</div>
                      )}
                    </div>
                    <div className="card councilCard">
                      <div className="cardTitle">Favor Rules</div>
                      <div className="entityList">
                        {COUNCIL_FAVOR_RULES.map((line) => (
                          <div className="entityItem" key={`favor-rule-full-${line}`}>
                            <div className="entityMeta">{line}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="card councilCard">
                      <div className="cardTitle">Council Discourse</div>
                      <div className="entityList">
                        {state.councilSession.dialogue.map((line, idx) => (
                          <div className="entityItem" key={`council-line-${idx}`}>
                            <div className="entityMeta">{line}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="card councilCard">
                      <div className="cardTitle">Rumors & Intelligence</div>
                      <div className="entityList">
                        {state.councilSession.rumors.map((line, idx) => (
                          <div className="entityItem" key={`council-rumor-${idx}`}>
                            <div className="entityMeta">{line}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="card councilCard">
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
                        <div className="entityEmpty">Select a Dungeonlord.</div>
                      )}
                    </div>
                    <div className="card councilCard">
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
                    <div className="card councilCard">
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
                                <div className="muted">Current Progress: {councilQuestProgressLabel(state, quest)}</div>
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
                        <div className="entityEmpty">Select a Dungeonlord.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
  );
}
