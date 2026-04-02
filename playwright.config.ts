import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://localhost:4010",
    trace: "on-first-retry",
  },
  webServer: {
    command: "MOCK_OAUTH_PROVIDER=true npm run build && MOCK_OAUTH_PROVIDER=true npm run start",
    url: "http://localhost:4010",
    reuseExistingServer: false,
    timeout: 180000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 16"] },
    },
  ],
});
