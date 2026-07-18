import { expect, test } from "@playwright/test";

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

test("portable save export produces a JSON download", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "One browser project is sufficient for the download contract.");

  await page.getByRole("button", { name: /Menu Dungeon/i }).click();
  await page.getByRole("button", { name: /Toolbox/i }).click();
  await page.locator("summary").filter({ hasText: "Advanced Management" }).click();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Save" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^dungeonlord-.*-day-\d+\.json$/);
});
