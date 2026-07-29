import { defineConfig, devices } from "@playwright/test";

const isCI = Boolean(globalThis.process?.env?.CI);

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  forbidOnly: isCI,
  use: {
    baseURL: "http://127.0.0.1:4173/Dungeonlord/",
    channel: isCI ? undefined : "chrome",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173/Dungeonlord/",
    reuseExistingServer: !isCI,
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
    { name: "tablet-landscape", use: { viewport: { width: 1280, height: 800 } } },
    { name: "tablet-short-landscape", use: { viewport: { width: 1600, height: 620 }, hasTouch: true } },
    { name: "tablet-portrait", use: { viewport: { width: 800, height: 1280 } } },
    { name: "phone", use: { ...devices["Galaxy S9+"] } },
  ],
});
