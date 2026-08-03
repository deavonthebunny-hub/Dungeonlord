import { expect, test } from "@playwright/test";
import { Buffer } from "node:buffer";

test.beforeEach(async ({ page }) => {
  await page.goto("./");
});

test("fresh run exposes the guided invasion flow", async ({ page }) => {
  await expect(page.getByText("Dungeonlord", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/First Run 1\/7|First Run 2\/7/)).toBeVisible();
  await page.getByRole("button", { name: /Menu Dungeon/i }).click();
  await page.getByRole("button", { name: /Toolbox/i }).click();
  await expect(page.getByText("Raid Forecast", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Normal Hero Raid/i }).click();
  if ((page.viewportSize()?.width ?? 0) > 980) {
    await page.getByRole("button", { name: "Close" }).click();
  } else {
    await page.getByRole("button", { name: /Menu Toolbox/i }).click();
    await page.getByRole("button", { name: /Dungeon Grid only/i }).click();
  }
  const beginBattle = page.getByRole("button", { name: "Begin Battle" });
  await expect(beginBattle).toBeEnabled();
  await beginBattle.click();
  const startRaid = page.getByRole("button", { name: "Start Raid" });
  await expect(startRaid).toBeEnabled();
  await startRaid.click();

  const endTurn = page.getByRole("button", { name: "End Turn" });
  for (let turn = 0; turn < 24 && (await endTurn.isEnabled()); turn += 1) {
    await endTurn.click();
  }

  await expect(page.getByText("First Run 7/7", { exact: true })).toBeVisible();
  await expect(page.getByText("Day: 2", { exact: true })).toBeVisible();
});

test("grid and control rail remain available", async ({ page }) => {
  await expect(page.locator(".grid .tile").or(page.locator(".grid button"))).toHaveCount(64);
  await expect(page.getByText("Selected Tile", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Upgrade Dungeon" })).toBeVisible();
});

test("short wide tablet can scroll controls and invasion choices", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "tablet-short-landscape", "Dedicated short tablet contract.");

  const grid = page.locator(".grid");
  const controlRail = page.locator(".dungeonControlRail");
  await expect(grid).toBeVisible();
  await expect(controlRail).toBeVisible();

  const railMetrics = await controlRail.evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
    overflowY: getComputedStyle(element).overflowY,
  }));
  expect(railMetrics.overflowY).toBe("scroll");
  expect(railMetrics.scrollHeight).toBeGreaterThanOrEqual(railMetrics.clientHeight);

  const viewportFit = await page.evaluate(() => ({
    appHeight: document.querySelector(".app")?.getBoundingClientRect().height || 0,
    viewportHeight: window.innerHeight,
  }));
  expect(viewportFit.appHeight).toBeLessThanOrEqual(viewportFit.viewportHeight);

  await page.locator(".dungeonGutter").evaluate((element) => {
    element.style.minHeight = "520px";
  });
  const forcedOverflow = await controlRail.evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
  }));
  expect(forcedOverflow.scrollHeight).toBeGreaterThan(forcedOverflow.clientHeight);

  const upgradeDungeon = page.getByRole("button", { name: "Upgrade Dungeon" });
  await upgradeDungeon.scrollIntoViewIfNeeded();
  await expect(upgradeDungeon).toBeVisible();
  expect(await controlRail.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);

  await page.getByRole("button", { name: /Menu Dungeon/i }).click();
  await page.getByRole("button", { name: /Toolbox/i }).click();
  const toolboxScroll = page.locator(".panel--toolbox .toolboxScroll");
  await expect(toolboxScroll).toBeVisible();
  expect(await toolboxScroll.evaluate((element) => getComputedStyle(element).overflowY)).toBe("scroll");

  const normalChoice = page.getByRole("button", { name: /Normal Hero Raid/i });
  const eliteChoice = page.getByRole("button", { name: /Elite Expedition/i });
  await normalChoice.scrollIntoViewIfNeeded();
  await normalChoice.click();
  await eliteChoice.scrollIntoViewIfNeeded();
  await eliteChoice.click();
  await expect(page.locator(".invasionChoice.active")).toContainText("Elite Expedition");
  await expect(grid).toBeVisible();
});

test("portable save export produces a JSON download", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "One browser project is sufficient for the download contract.");

  await page.getByRole("button", { name: /Menu Dungeon/i }).click();
  await page.getByRole("button", { name: /Toolbox/i }).click();
  await page.locator("summary").filter({ hasText: "Advanced Management" }).click();
  await expect(page.getByText("Playtest Support", { exact: true })).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Save" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^dungeonlord-.*-day-\d+\.json$/);

  const templateDownloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Bug Report Template" }).click();
  const templateDownload = await templateDownloadPromise;
  expect(templateDownload.suggestedFilename()).toBe("Dungeonlord_Bug_Report_Template.txt");
});

test("legacy import preserves the previous run as a restorable backup", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "One browser project is sufficient for persistence integration.");

  await page.getByRole("button", { name: /Menu Dungeon/i }).click();
  await page.getByRole("button", { name: /Toolbox/i }).click();
  await page.locator("summary").filter({ hasText: "Advanced Management" }).click();

  const legacyGrid = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => ({})));
  await page.locator("#run-import-input").setInputFiles({
    name: "legacy-dungeonlord-save.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        grid: legacyGrid,
        day: 3,
        essence: 42,
        runSeed: "DL-E2E-LEGACY",
        rngCursor: 11,
      })
    ),
  });

  await expect(page.getByText("Day: 3", { exact: true })).toBeVisible();
  await expect(page.getByText(/Seed DL-E2E-LEGACY/).first()).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Restore Backup" }).click();
  await expect(page.getByText("Day: 1", { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByText("Day: 1", { exact: true })).toBeVisible();
  await expect(page.getByText("Dungeonlord", { exact: true }).first()).toBeVisible();
});
