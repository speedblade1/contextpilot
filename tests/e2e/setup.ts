import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { openSync, closeSync } from "node:fs";
export default function setup() {
  const env = {
    ...process.env,
    DATABASE_URL: "file:./e2e.db",
    AI_MODE: "demo",
    OPENAI_API_KEY: "",
    AI_API_KEY: "",
  };
  closeSync(openSync(resolve("apps/api/prisma/e2e.db"), "a"));
  execFileSync(
    process.execPath,
    [
      resolve("node_modules/prisma/build/index.js"),
      "db",
      "push",
      "--skip-generate",
      "--schema",
      resolve("apps/api/prisma/schema.prisma"),
    ],
    { env, stdio: "pipe" },
  );
  execFileSync(
    process.execPath,
    [
      resolve("node_modules/tsx/dist/cli.mjs"),
      resolve("tests/e2e/reset-db.ts"),
    ],
    {
      stdio: "pipe",
      env: {
        ...process.env,
        DATABASE_URL: "file:./e2e.db",
        AI_MODE: "demo",
        OPENAI_API_KEY: "",
        AI_API_KEY: "",
      },
    },
  );
}
