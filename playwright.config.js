import { defineConfig, devices } from "@playwright/test"
import { E2E_API_PORT, E2E_WEB_PORT } from "./e2e/constants.js"

const e2eJwtSecret =
  process.env.JWT_SECRET || "playwright-e2e-jwt-secret-min-32-chars!!"

const apiEnv = {
  ...process.env,
  PORT: E2E_API_PORT,
  JWT_SECRET: e2eJwtSecret,
}

const webEnv = {
  ...process.env,
  JWT_SECRET: e2eJwtSecret,
  VITE_API_URL: `http://127.0.0.1:${E2E_API_PORT}`,
  E2E_WEB_PORT,
}

export default defineConfig({
  testDir: ".",
  testMatch: ["e2e/**/*.spec.js", "tests/e2e/**/*.spec.js"],
  testIgnore: ["**/node_modules/**", "backend/**"],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: `http://localhost:${E2E_WEB_PORT}`,
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "npm run dev --prefix backend",
      url: `http://127.0.0.1:${E2E_API_PORT}/health`,
      reuseExistingServer: false,
      timeout: 90000,
      env: apiEnv,
    },
    {
      command: "npm run dev:web",
      url: `http://localhost:${E2E_WEB_PORT}`,
      reuseExistingServer: false,
      timeout: 120000,
      env: webEnv,
    },
  ],
})
