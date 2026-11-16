import { db } from "../apps/api/src/repositories.js";
import { mkdir, writeFile } from "node:fs/promises";
const campaigns = await db.campaign.findMany({ include: { messages: true } });
const publishers = await db.publisher.findMany();
await mkdir("backups", { recursive: true });
await writeFile(
  `backups/before-personalization-${Date.now()}.json`,
  JSON.stringify({ campaigns, publishers }, null, 2),
);
const sample = campaigns.find((c) => c.id === "sample-course");
let removedSample = false;
if (sample) {
  const data = JSON.parse(sample.data);
  if (
    data.campaignName === "Build something brilliant" &&
    data.destinationUrl === "https://example.com/course" &&
    data.productDescription.startsWith("A fictional hands-on")
  ) {
    await db.campaign.delete({ where: { id: sample.id } });
    removedSample = true;
  }
}
for (const [id, name] of [
  ["open-notebook", "Open Notebook"],
  ["stride-daily", "Stride Daily"],
  ["roam-review", "Roam Review"],
]) {
  const referenced = campaigns.some(
    (c) =>
      !(removedSample && c.id === "sample-course") &&
      JSON.parse(c.data).publisherIds?.includes(id),
  );
  if (!referenced)
    await db.publisher.deleteMany({ where: { id, name, siteUrl: null } });
}
await db.publisher.updateMany({
  where: { id: "byte-journal", name: "Byte Journal" },
  data: { name: "Moonlit Journal", siteUrl: "http://localhost:5174" },
});
await db.$disconnect();
console.log(
  "Backed up workspace data; removed untouched fixtures and kept personal campaigns.",
);
