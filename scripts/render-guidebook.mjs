import { chromium } from "playwright";
import { copyFile, mkdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const source = resolve("docs/Dungeonlord_Guidebook.html");
const outputDir = resolve("output/pdf");
const output = resolve(outputDir, "Dungeonlord_Guidebook.pdf");
const docsCopy = resolve("docs/Dungeonlord_Guidebook.pdf");
const publicDir = resolve("public/guidebook");
const publicCopy = resolve(publicDir, "Dungeonlord_Guidebook.pdf");

await mkdir(outputDir, { recursive: true });
await mkdir(publicDir, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
await page.goto(pathToFileURL(source).href, { waitUntil: "networkidle" });
await page.pdf({
  path: output,
  format: "Letter",
  printBackground: true,
  margin: { top: "0.35in", right: "0.35in", bottom: "0.35in", left: "0.35in" },
  preferCSSPageSize: true,
});
await browser.close();

await copyFile(output, docsCopy);
await copyFile(output, publicCopy);

console.log(output);
