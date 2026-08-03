import { describe, expect, it } from "vitest";
import { DOCTRINE_RULES, STANDARD_ARTIFACTS } from "../gameContent";
import { upgradeDoctrineTransition } from "./dungeonActions";
import { calcArtifactMods, getCoreMaxHp, getDoctrineEffects } from "./economy";
import { buyArtifactTransition } from "./marketActions";
import { generateArtifactStock } from "./markets";
import { doctrineUpgradeCost } from "./monsters";
import { createDefaultState } from "./runState";

const standardArtifact = (key) => STANDARD_ARTIFACTS.find((artifact) => artifact.key === key);

describe("artifact and doctrine progression", () => {
  it("honors artifact unlock days and copy caps when generating stock", () => {
    createDefaultState({ runSeed: "DL-ARTIFACT-STOCK", rngCursor: 0 });
    const dayOneKeys = ["graven-coin", "shard-prism", "rage-brand", "wicked-gears", "dread-veil"];
    const cappedDayOneArtifacts = dayOneKeys.flatMap((key) =>
      Array.from({ length: standardArtifact(key).maxCopies }, () => ({ key }))
    );

    const exhaustedDayOne = generateArtifactStock(1, cappedDayOneArtifacts);
    const daySixStock = generateArtifactStock(6, cappedDayOneArtifacts);

    expect(exhaustedDayOne).toEqual([]);
    expect(daySixStock).toHaveLength(4);
    expect(daySixStock.every((artifact) => artifact.unlockDay <= 6)).toBe(true);
    expect(new Set(daySixStock.map((artifact) => artifact.key))).toEqual(
      new Set(["cinder-chain", "warden-spikes"])
    );
  });

  it("prevents buying an artifact beyond its copy cap", () => {
    const fresh = createDefaultState({ runSeed: "DL-ARTIFACT-CAP", rngCursor: 0 });
    const gravenCoin = standardArtifact("graven-coin");
    const capped = {
      ...fresh,
      artifacts: [{ key: "graven-coin" }, { key: "graven-coin" }],
      shadyStock: [gravenCoin],
      currency: { ...fresh.currency, soulshards: 999 },
    };
    const blocked = buyArtifactTransition(capped, 0);

    expect(blocked.artifacts).toHaveLength(2);
    expect(blocked.shadyStock).toHaveLength(1);
    expect(blocked.currency.soulshards).toBe(999);
    expect(blocked.log.some((line) => line.includes("copy limit"))).toBe(true);
  });

  it("hydrates and stacks standard and unique artifact modifiers", () => {
    const mods = calcArtifactMods([
      { key: "graven-coin" },
      { key: "graven-coin" },
      { key: "rage-brand" },
      { key: "preserved-heart" },
    ]);

    expect(mods).toMatchObject({
      essenceOnKill: 4,
      monsterAtk: 1,
      coreStartShield: 8,
    });
  });

  it("exposes every mastered doctrine effect at its documented threshold", () => {
    expect(getDoctrineEffects({ trap: 3, monster: 3, utility: 3, core: 3 })).toMatchObject({
      trapFlatDamage: 2,
      trapChargeBonus: 1,
      trapCooldownReduction: 1,
      monsterAtkBonus: 1,
      monsterHpBonus: 3,
      monsterRoomCapBonus: 1,
      utilityPotencyBonus: 1,
      utilityScoutBonus: 1,
      utilityPotencyBonusExtra: 1,
      coreMaxHpBonus: 25,
      coreShieldBonus: 5,
      dungeonlordAtkBonus: 2,
    });
  });

  it("raises current and maximum Core HP when Core Doctrine advances", () => {
    const fresh = createDefaultState({ runSeed: "DL-CORE-DOCTRINE", rngCursor: 0 });
    const funded = {
      ...fresh,
      coreHp: 200,
      currency: { ...fresh.currency, darkcrystals: 8 },
    };
    const upgraded = upgradeDoctrineTransition(funded, "core");

    expect(upgraded.doctrines.core).toBe(1);
    expect(upgraded.currency.darkcrystals).toBe(0);
    expect(upgraded.coreHp).toBe(225);
    expect(getCoreMaxHp(upgraded)).toBe(275);
  });

  it("leaves doctrine state unchanged when its currency is insufficient", () => {
    const fresh = createDefaultState({ runSeed: "DL-DOCTRINE-NO-FUNDS", rngCursor: 0 });
    const blocked = upgradeDoctrineTransition(
      { ...fresh, currency: { ...fresh.currency, essence: 34 } },
      "trap"
    );

    expect(blocked.doctrines.trap).toBe(0);
    expect(blocked.currency.essence).toBe(34);
    expect(blocked.log.some((line) => line.includes("Not enough essence"))).toBe(true);
  });

  it("applies Black Catechism to doctrine upgrade costs", () => {
    const fresh = createDefaultState({ runSeed: "DL-DOCTRINE-DISCOUNT", rngCursor: 0 });
    const artifactMods = calcArtifactMods([{ key: "black-catechism" }]);
    const discountedCost = doctrineUpgradeCost(DOCTRINE_RULES.trap, 0, artifactMods);
    const funded = {
      ...fresh,
      day: 32,
      artifacts: [{ key: "black-catechism" }],
      currency: { ...fresh.currency, essence: discountedCost },
    };
    const upgraded = upgradeDoctrineTransition(funded, "trap");

    expect(discountedCost).toBe(32);
    expect(upgraded.doctrines.trap).toBe(1);
    expect(upgraded.currency.essence).toBe(0);
  });
});
