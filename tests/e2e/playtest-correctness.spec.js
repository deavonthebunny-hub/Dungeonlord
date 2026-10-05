import { expect, test } from "@playwright/test";
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

// Clipboard contents are an external shared surface; keep these cases ordered.
test.describe.configure({ mode: "serial" });

async function openSupport(page) {
  await page.getByRole("button", { name: /Menu Dungeon/i }).click();
  await page.getByRole("button", { name: /Toolbox/i }).click();
  const advanced = page.locator("details.toolboxAdvanced");
  if (await advanced.getAttribute("open") === null) {
    await advanced.locator("summary").click();
  }
  await expect(page.getByRole("button", { name: "Copy With Save" })).toBeVisible();
}

async function copyWithSave(page, context) {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.evaluate(() => navigator.clipboard.writeText("B1-copy-not-completed"));
  await page.getByRole("button", { name: "Copy With Save" }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toMatch(/"save"\s*:/);
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text.length).toBeGreaterThan(100);
  return { text, bundle: JSON.parse(text) };
}

async function importSave(page, save, name = "b1-test-save.json") {
  await page.locator("#run-import-input").setInputFiles({
    name, mimeType: "application/json", buffer: Buffer.from(JSON.stringify(save)),
  });
  await expect(page.getByText(`Day: ${save.day}`, { exact: true })).toBeVisible();
}

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Desktop integration; shared rendering remains covered by the responsive smoke matrix.");
  await page.goto("./");
  await openSupport(page);
});

test("queued powers and active Escalation identity use the same guarded rules as combat", async ({ page, context }) => {
  const { bundle } = await copyWithSave(page, context);
  const save = bundle.save;
  save.day = 5;
  save.nextRaidType = "escalation";
  save.pendingEscalationLevel = 1;
  save.currency.dominion = 4;
  save.doctrines.monster = 2;
  save.selected = { x: 1, y: 0 };
  const monster = save.grid[0][1].monsters[0];
  save.grid[0][1].monsters = [{ ...monster, name: "B1 HP defender", isFused: true, hp: 38, stats: { ...monster.stats, maxHp: 35 } }];
  await importSave(page, save);
  await expect(page.locator(".entityStats").filter({ hasText: "HP 38/38" }).first()).toBeVisible();
  await page.getByRole("button", { name: "Begin Battle" }).click();
  await page.getByRole("button", { name: "Start Raid" }).click();
  await expect(page.locator(".raidForecastHeader .entityName")).toHaveText("Escalation Raid - Level 1");

  const pulse = page.getByRole("button", { name: "Pulse (2 DP)", exact: true });
  await pulse.click();
  await expect(pulse).toBeDisabled();
  await expect(page.getByText(/Pulse queued for the next turn/)).toBeVisible();
  const queued = (await copyWithSave(page, context)).bundle.save;
  expect(queued.currency.dominion).toBe(2);
  expect(queued.dominionEffects.pulsePending).toBe(true);
  const speed = page.getByRole("button", { name: "Speed (1 DP)", exact: true });
  const strength = page.getByRole("button", { name: "Strength (1 DP)", exact: true });
  await speed.click();
  await expect(speed).toBeDisabled();
  await strength.click();
  await expect(strength).toBeDisabled();
  await page.getByRole("button", { name: "End Turn" }).click();
  const resolved = (await copyWithSave(page, context)).bundle.save;
  expect(resolved.dominionEffects).toMatchObject({ pulsePending: false, monsterFirstStrike: false, monsterAtk: 0 });
  expect(resolved.log.filter((line) => line.includes("Dominion Pulse hits"))).toHaveLength(1);
  await expect(page.locator(".raidForecastHeader .entityName")).toHaveText("Escalation Raid - Level 1");
});

test("Copy With Save creates a nonempty portable bundle that imports in another context", async ({ page, context, browser }, testInfo) => {
  const captured = await copyWithSave(page, context);
  expect(captured.bundle).toMatchObject({ game: "Dungeonlord", run: { day: 1 } });
  expect(captured.bundle.save.grid).toHaveLength(8);
  await testInfo.attach("nonempty-copy-with-save.json", { body: captured.text, contentType: "application/json" });
  const targetContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  try {
    const target = await targetContext.newPage();
    await target.goto("http://127.0.0.1:4173/Dungeonlord/");
    await openSupport(target);
    await importSave(target, captured.bundle.save);
    await expect(target.getByText(`Seed ${captured.bundle.save.runSeed}`).first()).toBeVisible();
    const imported = (await copyWithSave(target, targetContext)).bundle.save;
    expect(imported.coreHp).toBe(captured.bundle.save.coreHp);
    expect(imported.currency).toEqual(captured.bundle.save.currency);
    await target.reload();
    await expect(target.getByText("Day: 1", { exact: true })).toBeVisible();
    await expect(target.getByText(`Seed ${captured.bundle.save.runSeed}`).first()).toBeVisible();
  } finally {
    await targetContext.close();
  }
});

test("authored starters retain ordinary stats and their placement bonus after reload", async ({ page, context }) => {
  const save = (await copyWithSave(page, context)).bundle.save;
  expect(save.grid[0][1].monsters.map(m => [m.key, m.stars, m.hp, m.atk])).toEqual([["ogre", 2, 32, 9], ["boar", 2, 22, 6]]);
  await page.reload();
  await openSupport(page);
  const reloaded = (await copyWithSave(page, context)).bundle.save;
  // Hydration adds default fusion metadata; all original fields must survive.
  expect(reloaded.grid[0][1].monsters).toMatchObject(save.grid[0][1].monsters);
  expect(reloaded.coreHp).toBe(250);
  expect(reloaded.currency).toEqual(save.currency);
});

test("a Day 1 empty-roster clear exposes a paid, reload-safe Day 2 recovery offer", async ({ page, context }) => {
  const save = (await copyWithSave(page, context)).bundle.save;
  Object.assign(save, { phase: "battle", raidActive: true, raidType: "normal", raidRemaining: 0, coreHp: 185, raidStartCoreHp: 185, heroes: [], currentParty: [], partyQueue: [], scoutQueue: [], invMonsters: [] });
  save.grid[0][1].monsters = [];
  await importSave(page, save, "b2-empty-roster-raid.json");
  await page.getByRole("button", { name: "End Turn" }).click();
  await expect(page.getByText("Day: 2", { exact: true })).toBeVisible();
  await expect(page.getByText(/Opening recovery offer: one sturdy replacement/)).toBeVisible();
  await page.reload();
  await openSupport(page);
  const offer = page.locator(".marketOfferItem").filter({ hasText: "Opening recovery offer:" });
  await expect(offer).toHaveCount(1);
  const prior = (await copyWithSave(page, context)).bundle.save;
  expect(prior.coreHp).toBe(185);
  await offer.getByRole("button", { name: "Buy (20 Soulshards)", exact: true }).click();
  await expect(offer).toHaveCount(0);
  const bought = (await copyWithSave(page, context)).bundle.save;
  expect(bought.currency.soulshards).toBe(prior.currency.soulshards - 20);
  expect(bought.coreHp).toBe(185);
  expect(bought.invMonsters).toHaveLength(1);
  expect(bought.invMonsters[0]).toMatchObject({ key: "ogre", stars: 2, openingRecoveryOffer: false });
  expect(bought.grid.flat().every(tile => tile.monsters.length === 0)).toBe(true);
});

test("preserved Day 11, 15, and 31 checkpoints import and restore without modifying originals", async ({ page, context }, testInfo) => {
  const directory = process.env.DUNGEONLORD_CHECKPOINT_DIR;
  test.skip(!directory, "Optional local evidence verification; set DUNGEONLORD_CHECKPOINT_DIR to the preserved run folder.");
  const verification = [];
  let completedRunBundle;
  for (const day of [11, 15, 31]) {
    const source = path.join(directory, `checkpoint-day-${day}.json`);
    const original = await readFile(source);
    const hash = createHash("sha256").update(original).digest("hex");
    const save = JSON.parse(original.toString("utf8"));
    await importSave(page, save, `checkpoint-day-${day}.json`);
    const captured = await copyWithSave(page, context);
    expect(captured.bundle.save).toMatchObject({ day, phase: save.phase, coreHp: save.coreHp, runSeed: save.runSeed });
    expect(captured.bundle.save.currency).toEqual(save.currency);
    expect(captured.bundle.save.grid.flat().filter((tile) => tile.room)).toHaveLength(save.grid.flat().filter((tile) => tile.room).length);
    if (day === 31) {
      completedRunBundle = captured.text;
      await page.locator(".grid .tile").filter({ hasText: "SK" }).first().click();
      await expect(page.locator(".entityStats").filter({ hasText: "HP 38/38" }).first()).toBeVisible();
    }
    await page.reload();
    await expect(page.getByText(`Day: ${day}`, { exact: true })).toBeVisible();
    await openSupport(page);
    // Reload autosave rotates the one-slot backup, so import a different run
    // before explicitly testing restore of the preserved checkpoint.
    await importSave(page, { ...save, day: day + 1 }, "temporary-b1-roundtrip.json");
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Restore Backup" }).click();
    await expect(page.getByText(`Day: ${day}`, { exact: true })).toBeVisible();
    expect(createHash("sha256").update(await readFile(source)).digest("hex")).toBe(hash);
    verification.push({ day, bytes: original.length, sha256: hash, coreHp: save.coreHp, savedRngCursor: save.rngCursor, importedRngCursor: captured.bundle.save.rngCursor, imported: true, reloaded: true, backupRestored: true, diagnosticBytes: Buffer.byteLength(captured.text) });
  }
  const output = path.resolve("output/b1-verification");
  await mkdir(output, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const bundlePath = path.join(output, `${stamp}-day31-copy-with-save.json`);
  const verificationPath = path.join(output, `${stamp}-checkpoint-verification.json`);
  await writeFile(bundlePath, `${completedRunBundle}\n`, { flag: "wx" });
  await writeFile(verificationPath, `${JSON.stringify({ method: "isolated browser UI import, copy, reload, and backup restore", verification }, null, 2)}\n`, { flag: "wx" });
  await testInfo.attach("preserved-checkpoint-verification.json", { path: verificationPath, contentType: "application/json" });
  await testInfo.attach("day31-copy-with-save.json", { path: bundlePath, contentType: "application/json" });
});
