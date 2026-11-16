import {
  campaignSchema,
  patchSchema,
  missingFields,
  type Draft,
  type Message,
} from "@contextpilot/shared";
import { db, repository, serialize, ownerId } from "../repositories.js";
export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export async function requireCampaign(id: string) {
  const row = await repository.get(id);
  if (!row) throw new AppError(404, "NOT_FOUND", "Campaign not found");
  return row;
}
export async function validatePatch(
  current: Draft,
  input: unknown,
): Promise<Draft> {
  const patch = patchSchema.parse(input);
  if (patch.publisherIds) {
    const publishers = await db.publisher.count({
      where: { id: { in: patch.publisherIds } },
    });
    if (publishers !== new Set(patch.publisherIds).size)
      throw new AppError(
        422,
        "PUBLISHER_UNAVAILABLE",
        "Select publishers from the catalog",
      );
  }
  return { ...current, ...patch };
}
export async function updateCampaign(
  id: string,
  version: number,
  input: unknown,
  messages: Message[] = [],
) {
  const row = await requireCampaign(id);
  if (row.status === "ACTIVE")
    throw new AppError(
      409,
      "ACTIVE_CAMPAIGN",
      "Pause the campaign before editing",
    );
  const data = await validatePatch(JSON.parse(row.data), input);
  return db.$transaction(async (tx) => {
    const result = await tx.campaign.updateMany({
      where: { id, ownerId, version, status: { not: "ACTIVE" } },
      data: {
        data: JSON.stringify(data),
        status: missingFields(data).length ? "DRAFT" : "READY",
        version: { increment: 1 },
      },
    });
    if (!result.count)
      throw new AppError(
        409,
        "STALE_VERSION",
        "Campaign changed. Reload and try again.",
      );
    if (messages.length)
      await tx.message.createMany({
        data: messages.map((m) => ({ ...m, campaignId: id })),
      });
    return serialize(await tx.campaign.findUniqueOrThrow({ where: { id } }));
  });
}
export async function transition(
  id: string,
  version: number,
  action: "activate" | "pause" | "save",
  confirmed: boolean,
) {
  if (!confirmed)
    throw new AppError(
      422,
      "CONFIRMATION_REQUIRED",
      "Explicit confirmation is required",
    );
  const row = await requireCampaign(id);
  if (action === "activate" || action === "save")
    campaignSchema.parse(JSON.parse(row.data));
  if (action === "pause" && row.status !== "ACTIVE")
    throw new AppError(
      409,
      "INVALID_STATE",
      "Only active campaigns can be paused",
    );
  if (action !== "pause" && row.status !== "READY")
    throw new AppError(409, "INVALID_STATE", "Review a complete draft first");
  const result = await db.campaign.updateMany({
    where: { id, ownerId, version, status: row.status },
    data: {
      status: action === "activate" ? "ACTIVE" : "READY",
      version: { increment: 1 },
    },
  });
  if (!result.count)
    throw new AppError(
      409,
      "STALE_VERSION",
      "Campaign changed. Reload and review again.",
    );
  return serialize(await requireCampaign(id));
}
