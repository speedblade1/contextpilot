import "../apps/api/src/config.js";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { openSync, closeSync } from "node:fs";
import { resolve } from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const cli = fileURLToPath(
  new URL("../node_modules/prisma/build/index.js", import.meta.url),
);
// Prisma's Windows schema engine can fail creating a missing SQLite file.
// Append mode creates it without truncating an existing database.
const databasePath = process.env.DATABASE_URL!.replace(/^file:/, "");
closeSync(openSync(resolve(root, "apps/api/prisma", databasePath), "a"));
for (const args of [["generate"], ["db", "push"]])
  execFileSync(
    process.execPath,
    [cli, ...args, "--schema", "apps/api/prisma/schema.prisma"],
    { cwd: root, stdio: "inherit", env: process.env },
  );
await import("../apps/api/prisma/seed.js");
