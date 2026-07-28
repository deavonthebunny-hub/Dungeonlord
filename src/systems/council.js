import { COUNCIL_FAVOR_BANDS, COUNCIL_RAID_FACTIONS, COUNCIL_SPONSOR_CONTENT } from "../gameContent";
import { calcArtifactMods } from "./economy";
import { buildUniqueMonsterEntity } from "./markets";
import { generateMonster, pickRewardMonsterEntry } from "./monsters";
import { getRaidDirectiveRule } from "./raids";
import { DOMINION_CAP, MONSTER_KEYS, addLog, clamp, councilEraIndex, monsterStarCapForDay, nextCouncilDayAfter, pick, pickUnique } from "./shared";

const COUNCIL_MEMBERS = [
  {
    key: "malachar",
    name: "Lord Malachar",
    title: "The Cruel",
    theme: "Tyranny & Torment",
    vibe: "ruthless, calculating",
    role: "control-obsessed strategist",
    personality: "Measured, merciless, always three moves ahead.",
    deal: "Offers tactical counsel and a small Essence stipend for discipline.",
    rivalries: ["blackthorn", "zurkhan"],
  },
  {
    key: "crimson-twins",
    name: "Selene & Vespera Nightwhisper",
    title: "The Crimson Twins",
    theme: "Beauty & Pain",
    vibe: "seductive, elegant",
    role: "social warfare",
    personality: "Poetic cruelty paired with icy pragmatism.",
    deal: "Can sponsor a rare monster recruitment at reduced cost.",
    rivalries: ["grimjaw", "lyralei"],
  },
  {
    key: "zephyra",
    name: "Archmage Zephyra Voidcaller",
    title: "The Riftmind",
    theme: "Void & Forbidden Magic",
    vibe: "mysterious, obsessive",
    role: "reality-bending theorist",
    personality: "Speaks in riddles, hoards forbidden knowledge.",
    deal: "Shares intelligence on hero tactics and grants Evolution.",
    rivalries: ["xaldros", "nihaza"],
  },
  {
    key: "grimjaw",
    name: "Overlord Grimjaw Ironbeast",
    title: "The Iron Pact",
    theme: "Iron & Honor",
    vibe: "honorable, fierce",
    role: "keeps the council in check",
    personality: "Rigid honor, steady temper, brutal justice.",
    deal: "Offers a Dominion boon for those who hold the line.",
    rivalries: ["crimson-twins", "zurkhan"],
  },
  {
    key: "blackthorn",
    name: "Baron Thaddeus Blackthorn",
    title: "The Masked Serpent",
    theme: "Politics & Intrigue",
    vibe: "charismatic, diplomatic",
    role: "alliance-maker",
    personality: "Smiling blades and veiled threats.",
    deal: "Trade favors for Soulshards and spy rumors.",
    rivalries: ["malachar", "tharos"],
  },
  {
    key: "lyralei",
    name: "Countess Lyralei Shadowdancer",
    title: "The Veiled Scholar",
    theme: "Shadows & Wisdom",
    vibe: "patient, calm",
    role: "archivist of secrets",
    personality: "Soft-spoken, unsettlingly precise.",
    deal: "Reveals scouting intelligence and grants a quest.",
    rivalries: ["crimson-twins", "xaldros"],
  },
  {
    key: "maltheron",
    name: "Lord Maltheron",
    title: "The Flesh Shaper",
    theme: "Flesh & Mutation",
    vibe: "calm, twisted",
    role: "Flesh Market broker",
    personality: "Clinical curiosity masking monstrous intent.",
    deal: "Flesh Market access: fuse monsters or harvest Dark Crystals.",
    rivalries: ["nihaza", "grimjaw"],
  },
  {
    key: "vexira",
    name: "Vexira the Vile",
    title: "The Toxblood Queen",
    theme: "Poisons & Plagues",
    vibe: "sadistic, venomous",
    role: "attrition specialist",
    personality: "Laughs at suffering, delights in slow victory.",
    deal: "Supplies toxins that strengthen traps for a time.",
    rivalries: ["grimjaw", "zurkhan"],
  },
  {
    key: "tharos",
    name: "Tharos Dreadveil",
    title: "The Black Veil",
    theme: "Assassination & Secrets",
    vibe: "silent, calculating",
    role: "information warfare",
    personality: "Few words; every one a threat.",
    deal: "Grants a covert bounty quest for Essence.",
    rivalries: ["blackthorn", "xaldros"],
  },
  {
    key: "xaldros",
    name: "Xaldros the Hollow",
    title: "The Mirror King",
    theme: "Madness & Illusions",
    vibe: "theatrical, unstable",
    role: "misdirection incarnate",
    personality: "Chaotic, mocking, impossibly charismatic.",
    deal: "Offers a risky boon that doubles a reward but cuts a resource.",
    rivalries: ["zephyra", "lyralei"],
  },
  {
    key: "zurkhan",
    name: "Zurkhan Bloodlash",
    title: "The Beast Tyrant",
    theme: "Beasts & Brutality",
    vibe: "brash, savage",
    role: "raw-force extremist",
    personality: "Respects only strength and spectacle.",
    deal: "Can recruit a powerful beast at higher Essence cost.",
    rivalries: ["grimjaw", "malachar"],
  },
  {
    key: "nihaza",
    name: "Matriarch Nihaza",
    title: "The Stillborn Flame",
    theme: "Extinction & Ash",
    vibe: "silent, apocalyptic",
    role: "prophecy with teeth",
    personality: "Rarely speaks; when she does, it is doom.",
    deal: "Grants a prophecy quest for Evolution.",
    rivalries: ["zephyra", "maltheron"],
  },
];
const COUNCIL_ART_BASE = `${import.meta.env.BASE_URL}assets/council/`;
const COUNCIL_CHAMBER_ART = {
  backdrop: `${COUNCIL_ART_BASE}council-hall-bg.png`,
  sigil: `${COUNCIL_ART_BASE}council-center-sigil.png`,
  absentSilhouette: `${COUNCIL_ART_BASE}absent-silhouette.png`,
  scrollTexture: `${COUNCIL_ART_BASE}dark-decree-scroll.png`,
};
const COUNCIL_MEMBER_CRESTS = {
  malachar: `${COUNCIL_ART_BASE}malachar-crest.png`,
  "crimson-twins": `${COUNCIL_ART_BASE}crimson-twins-crest.png`,
  zephyra: `${COUNCIL_ART_BASE}zephyra-crest.png`,
  grimjaw: `${COUNCIL_ART_BASE}grimjaw-crest.png`,
  blackthorn: `${COUNCIL_ART_BASE}blackthorn-crest.png`,
  lyralei: `${COUNCIL_ART_BASE}lyralei-crest.png`,
  maltheron: `${COUNCIL_ART_BASE}maltheron-crest.png`,
  vexira: `${COUNCIL_ART_BASE}vexira-crest.png`,
  tharos: `${COUNCIL_ART_BASE}tharos-crest.png`,
  xaldros: `${COUNCIL_ART_BASE}xaldros-crest.png`,
  zurkhan: `${COUNCIL_ART_BASE}zurkhan-crest.png`,
  nihaza: `${COUNCIL_ART_BASE}nihaza-crest.png`,
};
const COUNCIL_MEMBER_MAP = Object.fromEntries(COUNCIL_MEMBERS.map((member) => [member.key, member]));
const COUNCIL_FAVOR_RULES = [
  "Attend Council: +1 with each attendee.",
  "Decline Council: -1 with each attendee.",
  "Accept a boon: +2 with that sponsor.",
  "Accept a quest: +1 with that sponsor.",
  "Complete a Council quest: +2 with that sponsor.",
  "Fail or let a Council quest expire: -2 with that sponsor.",
  "Each Council drifts all favor 1 step toward neutral.",
  "Rivalries pull enemies 1 point in the opposite direction.",
];
function buildCouncilRoster(lastRoster = []) {
  const keep = pickUnique(lastRoster, Math.min(2, lastRoster.length));
  const remainingPool = COUNCIL_MEMBERS.filter((m) => !keep.some((k) => k.key === m.key));
  const fresh = pickUnique(remainingPool, Math.max(0, 6 - keep.length));
  return [...keep, ...fresh];
}
const COUNCIL_RUMORS = [
  "Scouts report a surge in hero enlistment near the eastern frontier.",
  "A new relic was unearthed beneath the capital. The clergy guards it fiercely.",
  "Hero supply lines are stretched thin after a northern crusade.",
  "A rival guild is testing anti-trap tactics in the wilds.",
  "A noble house funds elite expeditions to purge rogue dungeons.",
  "Wandering paladins have rallied; raids may intensify soon.",
];
const COUNCIL_DIALOGUE = [
  "{name}: The council grows restless. The heroes are adapting faster than expected.",
  "{name}: The mortal kingdoms bleed, but their resolve sharpens. We must respond.",
  "{name}: I smell fear in their ranks. The next raids will be bold, not wise.",
  "{name}: Keep your halls disciplined. Chaos invites collapse.",
  "{name}: My spies whisper of a new blessing for the invaders.",
  "{name}: The core is the heart. Guard it, or lose everything.",
  "{name}: We should share the burden, or the council will fracture.",
  "{name}: Power gathers like stormclouds. Strike before it breaks.",
];
const COUNCIL_QUEST_COUNTER_KEYS = [
  "zeroCoreDamageRaidCount",
  "survivedRaidCount",
  "highCoreRaidCount",
  "trapKillCount",
  "trapOrPoisonKillCount",
  "monsterRoomKillCount",
  "detourCount",
  "revealedInvaderCount",
  "highestStarLeaderKillCount",
  "soulshardsEarnedSinceCouncil",
  "evolutionSpentSinceCouncil",
  "monsterEvolutionCount",
  "monsterSacrificeCount",
  "darkcrystalsEarnedSinceCouncil",
];
function createEmptyCouncilQuestCounters() {
  return Object.fromEntries(COUNCIL_QUEST_COUNTER_KEYS.map((key) => [key, 0]));
}

function addCouncilQuestCounter(stateLike, metricKey, amount = 1) {
  if (!metricKey || !Number.isFinite(amount) || amount === 0) return stateLike;
  const counters = {
    ...createEmptyCouncilQuestCounters(),
    ...(stateLike.councilQuestCounters || {}),
  };
  counters[metricKey] = Math.max(0, (counters[metricKey] || 0) + amount);
  const nextState = { ...stateLike, councilQuestCounters: counters };
  if (nextState.councilQuest?.active && nextState.councilQuest.metricKey === metricKey) {
    nextState.councilQuest = {
      ...nextState.councilQuest,
      progress: councilQuestProgressValue(nextState, nextState.councilQuest),
    };
  }
  return nextState;
}
function councilBandValue(bands, day, fallback = 0) {
  if (!Array.isArray(bands) || bands.length === 0) return fallback;
  const idx = Math.max(0, Math.min(councilEraIndex(day), bands.length - 1));
  return bands[idx] ?? fallback;
}
function clampCouncilFavor(score = 0) {
  return clamp(Math.round(score || 0), -6, 6);
}
function normalizeCouncilFavorMap(favorMap = {}) {
  const next = {};
  for (const member of COUNCIL_MEMBERS) {
    const value = favorMap?.[member.key];
    if (!Number.isFinite(value)) continue;
    const clamped = clampCouncilFavor(value);
    if (clamped !== 0) next[member.key] = clamped;
  }
  return next;
}
function decayCouncilFavorTowardNeutral(favorMap = {}) {
  const next = {};
  let changed = false;
  for (const member of COUNCIL_MEMBERS) {
    const current = clampCouncilFavor(favorMap?.[member.key] || 0);
    const decayed = current > 0 ? current - 1 : current < 0 ? current + 1 : 0;
    if (decayed !== current) changed = true;
    if (decayed !== 0) next[member.key] = decayed;
  }
  return { favorMap: next, changed };
}
function getCouncilFavorInfo(score = 0) {
  const clamped = clampCouncilFavor(score);
  const band =
    COUNCIL_FAVOR_BANDS.find((entry) => clamped >= entry.min && clamped <= entry.max) ||
    COUNCIL_FAVOR_BANDS.find((entry) => entry.key === "neutral") ||
    COUNCIL_FAVOR_BANDS[0];
  return {
    ...band,
    score: clamped,
  };
}
function councilFavorBadgeTone(favorInfo) {
  switch (favorInfo?.key) {
    case "hostile":
      return "favorHostile";
    case "wary":
      return "favorWary";
    case "favored":
      return "favorFavored";
    case "allied":
      return "favorAllied";
    default:
      return "favorNeutral";
  }
}
function formatCouncilFavorLabel(scoreOrInfo) {
  const info = typeof scoreOrInfo === "object" && scoreOrInfo ? scoreOrInfo : getCouncilFavorInfo(scoreOrInfo);
  return `Favor ${info.score >= 0 ? `+${info.score}` : info.score} • ${info.name}`;
}
function resolveCouncilSponsorAccess(memberKey, score, day, baseContent = {}) {
  const favorInfo = getCouncilFavorInfo(score);
  const baseLocked = !!baseContent?.locked;
  const baseLockedReason = baseContent?.lockedReason || "";
  const hostileReason = "Hostile toward your rule.";
  const waryReason = "Wary. Earn more favor to receive contracts.";
  const hardQuestReason = "Favored standing required for hard contracts.";
  if (baseLocked) {
    return {
      favorInfo,
      rewardBandShift: 0,
      available: false,
      lockedReason: baseLockedReason,
      boon: { available: false, lockedReason: baseLockedReason },
      quests: {
        standard: { available: false, lockedReason: baseLockedReason },
        hard: { available: false, lockedReason: baseLockedReason },
      },
    };
  }
  if (favorInfo.key === "hostile") {
    return {
      favorInfo,
      rewardBandShift: 0,
      available: false,
      lockedReason: hostileReason,
      boon: { available: false, lockedReason: hostileReason },
      quests: {
        standard: { available: false, lockedReason: hostileReason },
        hard: { available: false, lockedReason: hostileReason },
      },
    };
  }
  if (favorInfo.key === "wary") {
    return {
      favorInfo,
      rewardBandShift: 0,
      available: true,
      lockedReason: "",
      boon: { available: true, lockedReason: "" },
      quests: {
        standard: { available: false, lockedReason: waryReason },
        hard: { available: false, lockedReason: waryReason },
      },
    };
  }
  if (favorInfo.key === "neutral") {
    return {
      favorInfo,
      rewardBandShift: 0,
      available: true,
      lockedReason: "",
      boon: { available: true, lockedReason: "" },
      quests: {
        standard: { available: true, lockedReason: "" },
        hard: { available: false, lockedReason: hardQuestReason },
      },
    };
  }
  const allied = favorInfo.key === "allied";
  return {
    favorInfo,
    rewardBandShift: allied ? 1 : 0,
    available: true,
    lockedReason: "",
    boon: { available: true, lockedReason: "" },
    quests: {
      standard: { available: true, lockedReason: "" },
      hard: { available: true, lockedReason: "" },
    },
  };
}
function buildCouncilReward(reward, day, rewardBandShift = 0) {
  if (!reward) return null;
  if (Number.isFinite(reward.amount)) return { ...reward };
  if (Array.isArray(reward.bands) && reward.bands.length > 0) {
    const baseIdx = Math.max(0, Math.min(councilEraIndex(day), reward.bands.length - 1));
    const shiftedIdx = Math.max(0, Math.min(baseIdx + rewardBandShift, reward.bands.length - 1));
    return {
      ...reward,
      amount: reward.bands[shiftedIdx] ?? reward.bands[baseIdx] ?? 0,
    };
  }
  return {
    ...reward,
    amount: councilBandValue(reward.bands, day, 0),
  };
}
function councilRewardLabel(reward) {
  if (!reward) return "No direct reward";
  if (reward.type === "monster") return `${reward.count || 1} themed monster`;
  if (reward.type === "ash-tribute") return `+${reward.amount || 3} Essence on hero death until next Council`;
  if (reward.type === "monster-room-cap-bonus") return `Monster rooms +${reward.amount || 1} capacity until next Council`;
  if (reward.type === "room-cap-bonus") return `+${reward.amount || 1} permanent room cap`;
  return `+${reward.amount} ${reward.type}`;
}
function buildCouncilBoon(member, day, sponsorAccess) {
  const content = COUNCIL_SPONSOR_CONTENT[member.key] || null;
  const boon = content?.boon || null;
  if (!boon) return null;
  return {
    ...boon,
    sponsorKey: member.key,
    sponsorName: member.name,
    reward: buildCouncilReward(boon.reward, day, sponsorAccess?.rewardBandShift || 0),
    available: !!sponsorAccess?.boon?.available,
    lockedReason: sponsorAccess?.boon?.lockedReason || "",
  };
}
function buildCouncilQuestVariant(member, day, difficulty, sponsorAccess) {
  const content = COUNCIL_SPONSOR_CONTENT[member.key] || null;
  const quest = content?.quests?.[difficulty] || null;
  if (!quest) return null;
  return {
    ...quest,
    sponsorKey: member.key,
    sponsorName: member.name,
    difficulty,
    goal: councilBandValue(quest.goalBands, day, 0),
    progress: 0,
    reward: buildCouncilReward(quest.reward, day, sponsorAccess?.rewardBandShift || 0),
    available: !!sponsorAccess?.quests?.[difficulty]?.available,
    lockedReason: sponsorAccess?.quests?.[difficulty]?.lockedReason || "",
  };
}
function buildCouncilSponsorEntry(member, day, favorMap = {}) {
  const content = COUNCIL_SPONSOR_CONTENT[member.key] || {};
  const sponsorAccess = resolveCouncilSponsorAccess(member.key, favorMap?.[member.key] || 0, day, content);
  return {
    key: member.key,
    available: sponsorAccess.available,
    lockedReason: sponsorAccess.lockedReason,
    favorInfo: sponsorAccess.favorInfo,
    boon: buildCouncilBoon(member, day, sponsorAccess),
    quests: {
      standard: buildCouncilQuestVariant(member, day, "standard", sponsorAccess),
      hard: buildCouncilQuestVariant(member, day, "hard", sponsorAccess),
    },
  };
}
function buildCouncilSession(roster, day, favorMap = {}) {
  const speakers = pickUnique(roster, Math.min(4, roster.length));
  const dialogue = speakers.map((s) => pick(COUNCIL_DIALOGUE).replace("{name}", s.name));
  if (roster.length >= 2) {
    const a = roster[0];
    const b = roster[1];
    dialogue.push(`${a.name} and ${b.name} clash over strategy, but no blood is spilled... this time.`);
  }
  const rumors = pickUnique(COUNCIL_RUMORS, 2);
  const sponsors = roster.map((member) => buildCouncilSponsorEntry(member, day, favorMap));
  return {
    day,
    status: "pending",
    dialogue,
    rumors,
    sponsors,
    courtedSponsorKey: null,
    acceptedCouncilBoonKey: null,
    acceptedCouncilQuestId: null,
    acceptedCouncilQuestDifficulty: null,
  };
}
function rebuildCouncilSessionWithFavor(session, roster, day, favorMap = {}) {
  if (!session || !Array.isArray(roster) || roster.length === 0) return session;
  const rebuilt = buildCouncilSession(roster, day, favorMap);
  return {
    ...rebuilt,
    dialogue: Array.isArray(session.dialogue) && session.dialogue.length ? session.dialogue : rebuilt.dialogue,
    rumors: Array.isArray(session.rumors) && session.rumors.length ? session.rumors : rebuilt.rumors,
    status: session.status || rebuilt.status,
    courtedSponsorKey: session.courtedSponsorKey || null,
    acceptedCouncilBoonKey: session.acceptedCouncilBoonKey || null,
    acceptedCouncilQuestId: session.acceptedCouncilQuestId || null,
    acceptedCouncilQuestDifficulty: session.acceptedCouncilQuestDifficulty || null,
  };
}
function councilQuestProgressValue(stateLike, quest) {
  if (!quest) return 0;
  if (quest.questType === "ash-breach-trial") {
    return Math.max(0, stateLike?.ashTrial?.raidsCompleted || 0);
  }
  return Math.max(0, stateLike?.councilQuestCounters?.[quest.metricKey] || 0);
}
function councilQuestGoalLabel(quest) {
  if (!quest) return "";
  if (quest.questType === "ash-breach-trial") {
    const breaches = Math.max(1, quest.breachCount || 1);
    return `${breaches} Ash Breach${breaches > 1 ? "es" : ""}; survive ${quest.goal || 2} connected raids.`;
  }
  return `Goal: ${quest.goal}`;
}
function councilQuestProgressLabel(stateLike, quest) {
  if (!quest) return "";
  const progress = councilQuestProgressValue(stateLike, quest);
  if (quest.questType === "ash-breach-trial") {
    return `${progress}/${quest.goal || 2} connected raids`;
  }
  return `${progress}/${quest.goal || 0}`;
}
function canAcceptCouncilSponsorAction(session, sponsorKey) {
  if (!session || session.status !== "attended" || !sponsorKey) return false;
  return !session.courtedSponsorKey || session.courtedSponsorKey === sponsorKey;
}
function applyCouncilRewardToState(stateLike, reward, sponsorName = "", day = 1) {
  if (!reward) {
    return { nextState: stateLike, rewardText: sponsorName ? `${sponsorName} offers influence only.` : "No direct reward." };
  }
  let nextState = { ...stateLike };
  const currency = { ...(stateLike.currency || {}) };
  if (reward.type === "essence") {
    currency.essence += reward.amount || 0;
    nextState.currency = currency;
    return { nextState, rewardText: `+${reward.amount || 0} Essence` };
  }
  if (reward.type === "soulshards") {
    currency.soulshards += reward.amount || 0;
    nextState.currency = currency;
    return { nextState, rewardText: `+${reward.amount || 0} Soulshards` };
  }
  if (reward.type === "evolution") {
    currency.evolution += reward.amount || 0;
    nextState.currency = currency;
    return { nextState, rewardText: `+${reward.amount || 0} Evolution` };
  }
  if (reward.type === "dominion") {
    const gain = Math.max(0, reward.amount || 0);
    const nextDominion = Math.min(DOMINION_CAP, currency.dominion + gain);
    const applied = Math.max(0, nextDominion - currency.dominion);
    currency.dominion = nextDominion;
    nextState.currency = currency;
    return { nextState, rewardText: applied > 0 ? `+${applied} Dominion` : "Dominion already at cap" };
  }
  if (reward.type === "darkcrystals") {
    currency.darkcrystals = (currency.darkcrystals || 0) + (reward.amount || 0);
    const counters = {
      ...createEmptyCouncilQuestCounters(),
      ...(stateLike.councilQuestCounters || {}),
    };
    counters.darkcrystalsEarnedSinceCouncil += reward.amount || 0;
    nextState.currency = currency;
    nextState.councilQuestCounters = counters;
    return { nextState, rewardText: `+${reward.amount || 0} Darkcrystals` };
  }
  if (reward.type === "ash-tribute") {
    const untilDay = nextCouncilDayAfter(day);
    nextState.ashTributeUntilDay = untilDay;
    return { nextState, rewardText: `+${reward.amount || 3} Essence on hero death until Day ${untilDay}` };
  }
  if (reward.type === "monster-room-cap-bonus") {
    const untilDay = stateLike?.ashTrial?.expiresDay || nextCouncilDayAfter(day);
    nextState.ashMonsterRoomCapUntilDay = Math.max(stateLike?.ashMonsterRoomCapUntilDay || 0, untilDay);
    return { nextState, rewardText: `Monster rooms gain +${reward.amount || 1} capacity until Day ${untilDay}` };
  }
  if (reward.type === "room-cap-bonus") {
    const gain = Math.max(1, reward.amount || 1);
    nextState.bonusRoomCapPermanent = Math.max(0, stateLike?.bonusRoomCapPermanent || 0) + gain;
    return { nextState, rewardText: `+${gain} permanent room cap` };
  }
  if (reward.type === "monster") {
    const count = Math.max(1, reward.count || 1);
    const pool = Array.isArray(reward.monsterPool) && reward.monsterPool.length ? reward.monsterPool : MONSTER_KEYS;
    const invMonsters = [...(stateLike.invMonsters || [])];
    const addedNames = [];
    const artifactMods = calcArtifactMods(stateLike.artifacts || [], day);
    for (let i = 0; i < count; i += 1) {
      const picked = pickRewardMonsterEntry(day, pool);
      const monster =
        picked?.type === "unique"
          ? buildUniqueMonsterEntity(picked.monster, day, artifactMods)
          : picked?.monster
            ? generateMonster(picked.monster.key, stateLike.turnsSurvived || 0, monsterStarCapForDay(day), day)
            : null;
      if (!monster) continue;
      invMonsters.push(monster);
      addedNames.push(monster.name);
    }
    nextState.invMonsters = invMonsters;
    return {
      nextState,
      rewardText: count === 1 ? `${addedNames[0]} joins your inventory` : `${count} themed monsters join your inventory`,
    };
  }
  return { nextState, rewardText: "Reward granted." };
}
function addLogLines(stateLike, lines = []) {
  let nextState = stateLike;
  for (let idx = lines.length - 1; idx >= 0; idx -= 1) {
    nextState = addLog(nextState, lines[idx]);
  }
  return nextState;
}
function applyCouncilFavorShiftDetailed(favorMap, memberKey, delta, reason = "Council politics") {
  const next = normalizeCouncilFavorMap(favorMap || {});
  const logLines = [];
  if (!memberKey || !delta) return { favorMap: next, logLines };
  const member = COUNCIL_MEMBER_MAP[memberKey];
  const applySingleShift = (targetKey, shift, why) => {
    if (!targetKey || !shift) return;
    const before = clampCouncilFavor(next[targetKey] || 0);
    const after = clampCouncilFavor(before + shift);
    if (after === before) return;
    if (after === 0) delete next[targetKey];
    else next[targetKey] = after;
    const appliedDelta = after - before;
    const targetMember = COUNCIL_MEMBER_MAP[targetKey];
    logLines.push(`Favor: ${targetMember?.name || targetKey} ${appliedDelta >= 0 ? `+${appliedDelta}` : appliedDelta} (${why}).`);
  };
  applySingleShift(memberKey, delta, reason);
  for (const rivalKey of member?.rivalries || []) {
    applySingleShift(rivalKey, -Math.sign(delta), `Rivalry with ${member?.name || memberKey}`);
  }
  return { favorMap: next, logLines };
}
function buildCouncilRaidFromRoster(roster = [], day = 1, favorMap = {}) {
  const sorted = [...roster].sort((a, b) => {
    const aFavor = getCouncilFavorInfo(favorMap[a.key] || 0);
    const bFavor = getCouncilFavorInfo(favorMap[b.key] || 0);
    if (aFavor.score !== bFavor.score) return aFavor.score - bFavor.score;
    const aBandIdx = COUNCIL_FAVOR_BANDS.findIndex((band) => band.key === aFavor.key);
    const bBandIdx = COUNCIL_FAVOR_BANDS.findIndex((band) => band.key === bFavor.key);
    if (aBandIdx !== bBandIdx) return aBandIdx - bBandIdx;
    return a.key.localeCompare(b.key);
  });
  const attackerCount = sorted.length > 1 && day >= 40 ? 2 : 1;
  const attackers = sorted.slice(0, attackerCount).map((member) => {
    const faction = COUNCIL_RAID_FACTIONS[member.key] || {};
    return {
      key: member.key,
      memberName: member.name,
      memberTitle: member.title,
      raidName: faction.raidName || member.title,
      desc: faction.desc || member.theme,
      raidModifier: faction.raidModifier || member.role,
      directiveKey: faction.defaultDirective || "rush-core",
      archetypeWeights: faction.archetypeWeights || {},
    };
  });
  const primaryDirectiveKey = attackers[0]?.directiveKey || "rush-core";
  const directive = getRaidDirectiveRule(primaryDirectiveKey);
  return {
    day,
    attackers,
    label: `Council Retaliation: ${attackers.map((a) => a.memberName).join(" & ")}`,
    desc: attackers.map((a) => a.raidName).join(" / "),
    modifierText: attackers.map((a) => a.raidModifier).join(" "),
    directiveKey: primaryDirectiveKey,
    directiveLabel: directive.name,
  };
}

export { COUNCIL_MEMBERS, COUNCIL_ART_BASE, COUNCIL_CHAMBER_ART, COUNCIL_MEMBER_CRESTS, COUNCIL_MEMBER_MAP, COUNCIL_FAVOR_RULES, buildCouncilRoster, COUNCIL_RUMORS, COUNCIL_DIALOGUE, COUNCIL_QUEST_COUNTER_KEYS, createEmptyCouncilQuestCounters, addCouncilQuestCounter, councilBandValue, clampCouncilFavor, normalizeCouncilFavorMap, decayCouncilFavorTowardNeutral, getCouncilFavorInfo, councilFavorBadgeTone, formatCouncilFavorLabel, resolveCouncilSponsorAccess, buildCouncilReward, councilRewardLabel, buildCouncilBoon, buildCouncilQuestVariant, buildCouncilSponsorEntry, buildCouncilSession, rebuildCouncilSessionWithFavor, councilQuestProgressValue, councilQuestGoalLabel, councilQuestProgressLabel, canAcceptCouncilSponsorAction, applyCouncilRewardToState, addLogLines, applyCouncilFavorShiftDetailed, buildCouncilRaidFromRoster };
