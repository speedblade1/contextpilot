import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    fileParallelism: false,
    env: {
      DATABASE_URL: "file:./test.db",
      AI_MODE: "demo",
      OPENAI_API_KEY: "",
      AI_API_KEY: "",
    },
    testTimeout: 15000,
  },
});
