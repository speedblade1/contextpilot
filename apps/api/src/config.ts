import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
dotenv.config({
  path: fileURLToPath(new URL("../../../.env", import.meta.url)),
  quiet: true,
});
process.env.DATABASE_URL ??= "file:./dev.db";
export const config = {
  mode: process.env.AI_MODE ?? "live",
  provider: process.env.AI_PROVIDER ?? "openai",
  baseURL: process.env.AI_BASE_URL ?? "https://api.openai.com/v1",
  model: process.env.AI_MODEL ?? "gpt-5.4-mini",
  apiKey:
    (process.env.AI_PROVIDER ?? "openai") === "openai"
      ? process.env.OPENAI_API_KEY
      : process.env.AI_API_KEY,
  timeout: Number(process.env.AI_TIMEOUT_MS ?? 30000),
  origins: (
    process.env.CORS_ORIGINS ??
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174"
  ).split(","),
};
if (!["demo", "live"].includes(config.mode))
  throw new Error("AI_MODE must be demo or live");
