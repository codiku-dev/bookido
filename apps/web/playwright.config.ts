import { defineConfig, devices } from "@playwright/test";

/** Use `localhost` (not `127.0.0.1`) so auth cookies align with `NEXT_PUBLIC_*` URLs that point at `localhost`. */
const baseURL = process.env["PLAYWRIGHT_BASE_URL"] ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  workers: process.env["CI"] ? 1 : undefined,
  reporter: process.env["CI"] ? "github" : [["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    locale: "en",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
