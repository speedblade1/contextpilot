import "./config.js";
import { PrismaClient } from "@prisma/client";
import type { Campaign, Draft, Message } from "@contextpilot/shared";
export const db = new PrismaClient();
export const ownerId = "local-demo";
export function serialize(row: {
  id: string;
  data: string;
  status: string;
  version: number;
  createdAt: Date;
  impressions: number;
  spentCents: number;
  servedRequests: number;
}): Campaign {
  return {
    ...row,
    data: JSON.parse(row.data) as Draft,
    status: row.status as Campaign["status"],
    createdAt: row.createdAt.toISOString(),
  };
}
export const repository = {
  list: async () =>
    (
      await db.campaign.findMany({
        where: { ownerId },
        orderBy: { createdAt: "desc" },
      })
    ).map(serialize),
  get: (id: string) => db.campaign.findFirst({ where: { id, ownerId } }),
  create: async () =>
    serialize(
      await db.campaign.create({
        data: { ownerId, data: JSON.stringify({ currency: "USD" }) },
      }),
    ),
  history: async (campaignId: string): Promise<Message[]> =>
    (
      await db.message.findMany({
        where: { campaignId },
        orderBy: { id: "asc" },
      })
    ).map(({ role, content }) => ({ role: role as Message["role"], content })),
};
