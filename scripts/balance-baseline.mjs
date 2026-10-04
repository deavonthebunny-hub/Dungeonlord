import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { createServer } from "vite";

const args = process.argv.slice(2);
const options = { seed: "DL--1F0BD67D", days: 5 };
for (let index = 0; index < args.length; index += 2) {
  const flag = args[index];
  const value = args[index + 1];
  if (!value || !["--seed", "--days"].includes(flag)) throw new Error("Usage: npm run balance:baseline -- [--seed DL-SEED] [--days 1-9]");
  if (flag === "--seed") options.seed = value;
  else options.days = Number(value);
}

const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
try {
  const { runOpeningBaseline } = await server.ssrLoadModule("/src/testing/balanceBaseline.js");
  const report = runOpeningBaseline(options);
  try {
    report.sourceRevision = {
      commit: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
      workingTreeModified: !!execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim(),
    };
  } catch {
    report.sourceRevision = { unavailable: true };
  }
  const directory = path.resolve("output/balance-baselines");
  await mkdir(directory, { recursive: true });
  const filename = `${report.seed}-days-${report.requestedDays}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  const destination = path.join(directory, filename);
  await writeFile(destination, `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
  process.stdout.write(`${JSON.stringify({ report: destination, seed: report.seed, strategy: report.strategy, raids: report.raids.length, finalCoreHp: report.final.coreHp, stopReason: report.stopReason }, null, 2)}\n`);
} finally {
  await server.close();
}
