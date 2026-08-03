import { describe, expect, it } from "vitest";
import { getRunRandomState } from "../random";
import { createDefaultState } from "../systems/runState";
import { CURRENT_SAVE_VERSION, serializeSave } from "./saveSchema";
import { SAVE_MIGRATIONS, hydrateSaveText, migrateSaveData, migrateSaveText } from "./saveMigrations";

describe("save migrations", () => {
  it("upgrades unversioned currency and trap-star fields without mutating the source", () => {
    const source = {
      grid: [[{ trap: true, trapStars: 3 }]],
      day: 7,
      essence: 44,
    };
    const original = structuredClone(source);
    const migrated = migrateSaveData(source);

    expect(SAVE_MIGRATIONS.map((migration) => migration.id)).toEqual([
      "legacy-currency-object",
      "legacy-trap-star-field",
    ]);
    expect(migrated).toMatchObject({
      saveVersion: CURRENT_SAVE_VERSION,
      currency: { essence: 44 },
    });
    expect(migrated.grid[0][0]).toMatchObject({ trapStars: 3, trapStar: 3 });
    expect(source).toEqual(original);
  });

  it("delegates final defensive normalization to runState", () => {
    const fresh = createDefaultState({ runSeed: "DL-MIGRATION-HYDRATE", rngCursor: 0 });
    const { currency: _currency, saveVersion: _saveVersion, ...legacy } = fresh;
    const loaded = hydrateSaveText(
      JSON.stringify({
        ...legacy,
        essence: 42,
        phase: "battle",
        raidActive: true,
        rngCursor: 31,
      })
    );

    expect(loaded).toMatchObject({
      runSeed: "DL-MIGRATION-HYDRATE",
      phase: "battle",
      raidActive: true,
      saveVersion: CURRENT_SAVE_VERSION,
    });
    expect(loaded.currency).toMatchObject({ essence: 42, soulshards: 30, darkcrystals: 0 });
    expect(getRunRandomState()).toEqual({ seed: "DL-MIGRATION-HYDRATE", cursor: 31 });
  });

  it("round-trips a current save through migration with meaningful state intact", () => {
    const fresh = createDefaultState({ runSeed: "DL-CURRENT-ROUNDTRIP", rngCursor: 0 });
    const raw = serializeSave({
      ...fresh,
      day: 6,
      coreHp: 173,
      currency: { ...fresh.currency, essence: 88, soulshards: 61 },
    });
    const loaded = hydrateSaveText(raw);

    expect(loaded).toMatchObject({
      saveVersion: CURRENT_SAVE_VERSION,
      runSeed: "DL-CURRENT-ROUNDTRIP",
      day: 6,
      coreHp: 173,
    });
    expect(loaded.currency).toMatchObject({ essence: 88, soulshards: 61 });
    expect(loaded.grid[0][0].entrance).toBe(true);
    expect(loaded.grid[0][2].core).toBe(true);
  });

  it("fails malformed and unrelated save text safely", () => {
    expect(migrateSaveData(null)).toBeNull();
    expect(migrateSaveText("not-json")).toBeNull();
    expect(migrateSaveText('{"hello":"world"}')).toBeNull();
    expect(hydrateSaveText('{"grid":"invalid"}')).toBeNull();
  });
});
