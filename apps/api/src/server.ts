import { createApp } from "./app.js";
import { db } from "./repositories.js";
const server = createApp().listen(
  Number(process.env.PORT ?? 4000),
  "127.0.0.1",
  () =>
    console.log("ContextPilot API: http://localhost:4000 (personal workspace)"),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () =>
    server.close(() => void db.$disconnect().then(() => process.exit(0))),
  );
