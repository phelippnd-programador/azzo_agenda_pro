import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  use: {
    baseURL: "https://127.0.0.1:4173",
    headless: true,
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 720 },
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4173",
    url: "https://127.0.0.1:4173",
    reuseExistingServer: true,
    ignoreHTTPSErrors: true,
    timeout: 120_000,
  },
});
