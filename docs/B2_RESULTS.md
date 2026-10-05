# B2 — Recoverable Opening Pilot

Implemented locally: 2026-10-03. Release identifier remains `0.1.0-alpha.2`.

B1 was committed and pushed to the existing `origin/main` as `98c753d`. B2 is the subsequent local implementation; it has not been committed, pushed, or separately deployed during this step.

## Implemented rules

1. Fresh runs receive an ordinary **two-star Ogre and two-star Boar**, rather than two independent recruit-pool rolls. Their names, classes, and single passives remain seeded. They use existing species/star stats, can die, and are not unique or fused units.
2. The already-staffed starters now receive the Training Den's existing permanent +1 ATK placement bonus exactly once. Fresh Ogre stats are 32 HP / 9 ATK / 3 DEF; Boar stats are 22 HP / 6 ATK / 1 DEF, before temporary combat effects. Reload does not add the bonus again.
3. A layout-preserving run reset supplies the same pair **in inventory**, retaining the existing empty-room/manual-staffing behavior. Inventory units do not receive a placement bonus until staffed.
4. On completing Day 1 alive with **no living owned monsters in rooms or inventory**, the next trader stock includes one ordinary two-star Ogre for **20 Soulshards**. It replaces one stock slot, is visible and optional, lasts only on Day 2, and must be purchased and staffed. Buying removes both that offer and its special price marker. It does not refund losses, grant money, restore the Core, or recur on later days.
5. The checklist recommends Normal while learning and explains that the Core can be moved to make space for traps before the staffed room. The glossary explains opening defense and the recovery offer.

Only the opening starter defense and a narrow replacement offer were changed. Normal/Elite/Escalation/Council counts, hero stats/stars/passives, damage events, general recruitment/trader prices, rewards, trap charges, later markets, day cadence, and ordinary Core-repair rules are unchanged. The original player's Ward Lantern placement was not changed.

## Declared measurement policy

Ten seeds were declared before numerical tuning:

`DL--1F0BD67D`, `DL-B2-02`, `DL-B2-03`, `DL-B2-04`, `DL-B2-05`, `DL-B2-06`, `DL-B2-07`, `DL-B2-08`, `DL-B2-09`, `DL-B2-10`.

The mixed policy is reproducible in `src/testing/openingPolicy.js`:

- Day 1: move Core to (5,1), staffed Training Den to (4,1); build Spike Pit (2,1), Poison Vent (3,1), and Reinforced Keystone (4,2).
- Buy visible ordinary stock up to three staff, retaining at least ten Soulshards. Prefer the labelled recovery offer when present; otherwise take the cheapest qualifying offer. Accept the first construction-quality rolls.
- Buy at most one dungeon capacity upgrade per day until Level 3 when affordable. Level 2 adds a Flame Jet (5,1), moves Core to (6,1), and adds Soul Altar (2,2). Level 3 adds Flame Jet (6,1), moves Core to (7,1), and adds Ward Lantern (3,2). Utilities are non-walkable; they do not create route shortcuts.
- Otherwise attempt the next Trap Doctrine up to level 2, then one paid Keystone upgrade up to tier 3. No repeat attempts within a day.
- Choose Normal on ordinary days; accept forced Day 5 Escalation. Stop on reaching Day 10 **before handling Council**, or on defeat.
- No Dominion powers, blind Recruit attempts, stock rerolls, trap rebuilds, free permanent-bonus cycling, artifact shopping, fusion, or seed-specific knowledge.

The baseline used `mixed-keystone-reserve-normal-no-powers-v1`. The final policy is `...-v2`: its only purchase-policy addition is prioritizing the visible paid recovery offer. On the normal final suite no Day 1 roster wipes occur, so that addition does not affect the normal before/after result.

These are developer mechanical runs using production transitions, not autonomous browser playthroughs or human first-time usability results. A disclosed reasonable strategy is a pilot proxy; it does not establish that beginners discover it without help.

## One-category-at-a-time screening

Before shipping-rule edits, developer-only fixtures screened the same ten seeds against B1 production rules. The party fixture retained the generated party's RNG draws but limited Normal to two members on Day 1 and at most three on Days 2–3. The roster fixture rebuilt the old generated pair's stats as two-star Ogre/Boar while retaining their old classes/passives, so it was a **screening proxy**, not the final authored implementation. Later encounters diverge as choices, deaths, and RNG consumption change.

| Screening fixture | Day 1 defender retention | Reach Council | Reach Council with fewer than two full wipes | Total full wipes |
|---|---:|---:|---:|---:|
| B1 current rules | 3/10 | 5/10 | 0/10 | 45 |
| Training Den placement bonus only | 3/10 | 5/10 | 0/10 | 45 |
| Early party limits only | 5/10 | 6/10 | 0/10 | 51 |
| Placement bonus + early party limits | 5/10 | 6/10 | 0/10 | 50 |
| Savage Kennels starter room only | 6/10 | 7/10 | 1/10 | 32 |
| Sturdier pair proxy only | 10/10 | 10/10 | 9/10 | 8 |
| Sturdier pair + Savage Kennels | 10/10 | 10/10 | 10/10 | 0 |

The sturdier pair was the smallest screened change that met the normal pilot thresholds. Party reductions and the Kennels replacement were **not implemented**. The final production pair was then rerun with its actual class/passive generation and the correct Training Den bonus. It has a different RNG footprint from B1 new-run generation; the same seed labels do not imply identical invader rosters across builds.

Original screening evidence: `output/balance-openings/comparison-2026-10-04T03-16-30-067Z.json`. The earlier four-candidate report is also preserved. Experimental fixture switches were removed from the final runner so the standard command cannot silently trim encounters.

## Actual normal-opening results

| Metric | B1 rules + declared mixed policy | B2 production rules + mixed policy |
|---|---:|---:|
| At least one fielded defender after Day 1 | 3/10 | 10/10 |
| Reach Day 10 Council entry alive | 5/10 | 10/10 |
| Reach Council without repeated complete wipes | 0/10 | 9/10 |
| Total complete roster wipes through Day 9 | 45 | 9 |

Both provisional 8-of-10 normal-opening thresholds pass. This does not guarantee survival for every seed or defense.

| Seed | Day 1 survivors | Core after Day 3 | Core after Day 5 | Core at Council entry | Full wipes |
|---|---:|---:|---:|---:|---:|
| DL--1F0BD67D | 3 | 250 | 241 | 241 | 1 |
| DL-B2-02 | 3 | 250 | 218 | 218 | 1 |
| DL-B2-03 | 3 | 250 | 250 | 250 | 1 |
| DL-B2-04 | 3 | 250 | 183 | 183 | 2 |
| DL-B2-05 | 3 | 250 | 250 | 250 | 1 |
| DL-B2-06 | 3 | 250 | 250 | 250 | 1 |
| DL-B2-07 | 3 | 250 | 250 | 250 | 0 |
| DL-B2-08 | 3 | 250 | 196 | 196 | 1 |
| DL-B2-09 | 3 | 250 | 242 | 242 | 1 |
| DL-B2-10 | 3 | 250 | 250 | 250 | 0 |

Measured Core bands for this policy: Day 3 **250/250**, Day 5 **183–250/250**. Do not turn these into a requirement for compulsory damage. Nine full wipes still occur; the worst seed has two. Reusing the unchanged-layout/no-purchases/no-powers reference on the original seed still loses the Core on Day 4, so the new pair is not an automatic win.

## Poor-first-raid recovery stress

The stress fixture sets every fielded defender to **1 HP once**, immediately before starting Day 1. It preserves their max HP/stats and uses normal combat thereafter. It does not remove enemies, grant rewards, inject replacement monsters, or heal the Core. This is a deliberate adversity test, not a claimed natural raid or a complete model of poor human play.

Before adding the recovery offer, eight of ten runs suffered a full Day 1 wipe. **0/8** retained a defender after Day 2; 6/10 reached Council, and 51 full wipes occurred through the recorded runs.

After the single paid recovery offer:

- The same eight runs suffer the same Day 1 wipe.
- **8/8** buy the 20-Shard Ogre and retain a defender after Day 2.
- They retain **10–18 Soulshards** after Day 2 preparation.
- Seven buy the normal 41-Essence capacity upgrade; the eighth can instead buy the 35-Essence Trap Doctrine. Replacement does not consume Essence or require rare stock.
- All ten reach Council; total full wipes decrease to **23**, not zero. Only 3/10 avoid repeated full wipes in this deliberately severe stress suite. Later recovery after successive wipes remains a B3/B4 tuning concern, not a solved general guarantee.
- Core at Council entry ranges **82–221** in the stress suite.

Before/after evidence is preserved in the timestamped `current-poor-first-raid-2026-10-04T03-44-38-168Z.json` and `...03-46-25-675Z.json` reports under `output/balance-openings/`.

## Reproduction and regression checks

```powershell
npm.cmd run balance:opening
npm.cmd run balance:opening -- --poor-first-raid
npm.cmd run balance:baseline -- --seed DL--1F0BD67D --days 5
$env:DUNGEONLORD_CHECKPOINT_DIR = 'C:\Users\Deavo\Desktop\dungeonlord\output\autonomous-playtest-2026-10-03'
npm.cmd run check:alpha
```

The opening command writes new timestamped JSON files under `output/balance-openings/`, using exclusive creation. It records the seed manifest, policy, source commit/file SHA-256 hashes, decisions/spending, Core/currencies, deployed and inventory defenders, invader composition, RNG cursors, and every combat turn. Stress-mode reports clearly label the intervention. It never touches browser saves.

Final source-hashed reports: `production-2026-10-04T03-56-40-638Z.json` and `production-poor-first-raid-2026-10-04T03-56-47-178Z.json` in that directory. Their source hashes were checked against the final files. Raw reports and original playtest exports remain local and untracked; this document contains the durable results summary.

New unit coverage checks ordinary starter stats, idempotent placement bonuses, layout-reset inventory, legacy wounded/empty rosters, the limited paid offer, reload compatibility, purchase guards, normal later trader stock/RNG, deterministic policy replay, the two provisional normal targets, and affordable next-day recovery. Browser tests check actual starter reload and visible offer purchase/reload in isolated contexts. Preserved Day 11/15/31 exports are rechecked without changing originals.

The initial browser reload assertion incorrectly required byte-identical entity shapes despite existing hydration adding safe fusion defaults. It was corrected to verify all original fields while allowing those defaults; no production save rewrite was made for that test.

A second new browser-test attempt toggled Advanced Management closed when it was already open on Day 2. The support helper now checks the details element before opening it. This was a test navigation error, not an unavailable recovery offer or production clipboard failure.

Final `check:alpha` passed: **86 unit tests in 17 files, ESLint, production build, and 18 applicable Playwright tests**, with 32 profile-specific skips. Both new browser cases and the optional preserved Day 11/15/31 verification ran successfully. Original checkpoint hashes are unchanged. CI without the local checkpoint folder also skips that optional case.

## Remaining work

B3 is next: coherent Normal/Elite/Escalation budgets and first-Escalation pressure. B4 must still address late trap dominance, economy/progression, and defensive diversity. B5/B6 and fresh human/device testing remain necessary. B2 does not establish overall game balance or complete the Day 30 strategy matrix.
