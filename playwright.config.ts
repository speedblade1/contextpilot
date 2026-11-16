import { defineConfig } from "@playwright/test";
export default defineConfig({
  globalSetup: "./tests/e2e/setup.ts",
  testDir: "tests/e2e",
  workers: 1,
  use: {
    channel: "chromium",
    baseURL: "http://localhost:5273",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev:e2e",
    env: {
      AI_MODE: "demo",
      PORT: "4100",
      VITE_API_URL: "http://localhost:4100",
      CORS_ORIGINS:
        "http://localhost:5273,http://localhost:5274,http://127.0.0.1:5273,http://127.0.0.1:5274",
      DATABASE_URL: "file:./e2e.db",
      OPENAI_API_KEY: "",
      AI_API_KEY: "",
    },
    url: "http://localhost:5273",
    reuseExistingServer: false,
    timeout: 60000,
  },
});
