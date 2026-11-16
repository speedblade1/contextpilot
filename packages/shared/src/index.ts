import { z } from "zod";

export const countries = ["US", "GB", "DE", "FR", "CA"] as const;
export const categories = [
  "technology",
  "education",
  "fitness",
  "travel",
] as const;
export const safeUrl = z
  .string()
  .url()
  .max(500)
  .refine((value) => {
    const url = new URL(value);
    return (
      ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password
    );
  }, "Use an HTTP(S) URL without credentials");
export const campaignSchema = z
  .object({
    campaignName: z.string().trim().min(1).max(100),
    productDescription: z.string().trim().min(1).max(1000),
    targetCountries: z.array(z.enum(countries)).min(1).max(5),
    budget: z.number().positive().max(1000000).multipleOf(0.01),
    currency: z.literal("USD"),
    publisherIds: z.array(z.string().min(1).max(80)).min(1).max(20),
    category: z.enum(categories),
    destinationUrl: safeUrl,
  })
  .strict();
export const patchSchema = campaignSchema.partial().strict();
export type CampaignData = z.infer<typeof campaignSchema>;
export type Draft = z.infer<typeof patchSchema>;
export type CampaignState = "DRAFT" | "READY" | "ACTIVE";
export type Campaign = {
  id: string;
  data: Draft;
  status: CampaignState;
  version: number;
  createdAt: string;
  impressions: number;
  spentCents: number;
  servedRequests: number;
};
export type Publisher = {
  id: string;
  name: string;
  category: (typeof categories)[number];
  siteUrl?: string | null;
};
export type Message = { role: "user" | "assistant"; content: string };
export const adSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    url: safeUrl,
  })
  .strict();
export type Ad = z.infer<typeof adSchema>;
export function missingFields(draft: Draft): string[] {
  return Object.keys(campaignSchema.shape).filter(
    (key) =>
      !campaignSchema.shape[key as keyof CampaignData].safeParse(
        draft[key as keyof Draft],
      ).success,
  );
}
