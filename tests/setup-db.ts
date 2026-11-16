import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { openSync, closeSync } from "node:fs";
// A dedicated database: never reset the user's development database.
closeSync(openSync(resolve("apps/api/prisma/test.db"), "a"));
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
  { env: { ...process.env, DATABASE_URL: "file:./test.db" }, stdio: "pipe" },
);
