import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const baseUrl = process.argv[2] || "http://127.0.0.1:4173/Dungeonlord/";
const outputDir = resolve("docs/assets");

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

await page.goto(baseUrl, { waitUntil: "networkidle" });
await page.screenshot({
  path: resolve(outputDir, "first-run-dungeon.png"),
  fullPage: false,
});

await page.getByRole("button", { name: /Menu Dungeon/i }).click();
await page.getByRole("button", { name: /Toolbox/i }).click();
await page.getByText("Raid Forecast", { exact: true }).scrollIntoViewIfNeeded();
await page.screenshot({
  path: resolve(outputDir, "raid-forecast.png"),
  fullPage: false,
});

await browser.close();
