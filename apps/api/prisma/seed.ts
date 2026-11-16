import { db } from "../src/repositories.js";
// The included local preview site; no fictional external partnerships.
await db.publisher.upsert({
  where: { id: "byte-journal" },
  update: {},
  create: {
    id: "byte-journal",
    name: "Moonlit Journal",
    category: "technology",
    siteUrl: "http://localhost:5174",
  },
});
await db.$disconnect();
console.log("Workspace initialized. Local publisher preview is available.");
