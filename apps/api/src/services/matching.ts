import { campaignSchema, type Ad } from "@contextpilot/shared";
import { db } from "../repositories.js";
const terms: Record<string, string[]> = {
  technology: ["programming", "software", "coding", "technology"],
  education: ["learning", "education", "course", "study"],
  fitness: ["fitness", "workout", "exercise", "health"],
  travel: ["travel", "holiday", "trip", "tourism"],
};
export async function matchAd(input: {
  publisherId: string;
  country: string;
  category: string;
  keywords: string[];
}): Promise<Ad | null> {
  const publisher = await db.publisher.findUnique({
    where: { id: input.publisherId },
  });
  if (!publisher) return null;
  const candidates = await db.campaign.findMany({
    where: { status: "ACTIVE" },
    orderBy: { id: "asc" },
  });
  const ranked = candidates
    .flatMap((row) => {
      const parsed = campaignSchema.safeParse(JSON.parse(row.data));
      if (!parsed.success) return [];
      const c = parsed.data;
      if (
        !c.publisherIds.includes(publisher.id) ||
        !c.targetCountries.includes(
          input.country as (typeof c.targetCountries)[number],
        ) ||
        row.spentCents >= Math.round(c.budget * 100)
      )
        return [];
      const keywordScore = input.keywords.filter((k) =>
        terms[c.category].includes(k.toLowerCase()),
      ).length;
      const score =
        (c.category === publisher.category ? 2 : 0) +
        (c.category === input.category ? 2 : 0) +
        keywordScore;
      if (score < 2) return [];
      return [
        {
          score,
          ad: {
            id: row.id,
            title: c.campaignName,
            description: c.productDescription,
            url: c.destinationUrl,
          },
        },
      ];
    })
    .sort((a, b) => b.score - a.score);
  const ad = ranked[0]?.ad ?? null;
  // Aggregate successful responses, not impressions or unique visitors. No billing.
  if (ad)
    await db.campaign.update({
      where: { id: ad.id },
      data: { servedRequests: { increment: 1 } },
    });
  return ad;
}
