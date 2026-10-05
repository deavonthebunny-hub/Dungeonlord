import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { createServer } from "vite";

const flags = process.argv.slice(2);
if (flags.some(flag => flag !== "--poor-first-raid")) throw new Error("Usage: npm run balance:opening -- [--poor-first-raid]");
const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: "custom" });
try {
  const { runOpeningSuite } = await server.ssrLoadModule("/src/testing/openingBalance.js");
  const suite = runOpeningSuite({ poorFirstRaid: flags.includes("--poor-first-raid") });
  const git = (...args) => execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  const sources = new Set([...git("ls-files", "src", "scripts", "package.json", "package-lock.json").split(/\r?\n/).filter(file => /\.(js|jsx|mjs|json)$/.test(file)), "src/testing/openingPolicy.js", "src/testing/openingBalance.js", "scripts/opening-balance.mjs"]);
  const sourceHashes = Object.fromEntries(await Promise.all([...sources].sort().map(async file => [file, createHash("sha256").update(await readFile(file)).digest("hex")])));
  const report = { timestamp: new Date().toISOString(), sourceRevision: { commit: git("rev-parse", "HEAD"), trackedChanges: git("diff", "--stat", "HEAD"), sourceHashes }, suite };
  const directory = path.resolve("output/balance-openings");
  await mkdir(directory, { recursive: true });
  const destination = path.join(directory, `production${flags.includes("--poor-first-raid") ? "-poor-first-raid" : ""}-${report.timestamp.replace(/[:.]/g, "-")}.json`);
  await writeFile(destination, `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
  process.stdout.write(`${JSON.stringify({ report: destination, ...suite.summary, seeds: suite.summary.seeds.map(({ seed, dayOneSurvivors, coreDay3, coreDay5, coreAtCouncil, completeWipes, reachedCouncil }) => ({ seed, dayOneSurvivors, coreDay3, coreDay5, coreAtCouncil, completeWipes, reachedCouncil })) }, null, 2)}\n`);
} finally {
  await server.close();
}
