import { db } from "../../apps/api/src/repositories.js";
if (process.env.DATABASE_URL !== "file:./e2e.db")
  throw new Error(
    "Refusing to reset any database except the isolated e2e database",
  );
await db.campaign.deleteMany();
await db.publisher.deleteMany();
await db.publisher.create({
  data: {
    id: "byte-journal",
    name: "Moonlit Journal",
    category: "technology",
    siteUrl: "http://localhost:5274",
  },
});
await db.$disconnect();
