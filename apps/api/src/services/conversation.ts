import { missingFields, type Publisher } from "@contextpilot/shared";
import type { Provider } from "../ai/provider.js";
import { db, repository } from "../repositories.js";
import {
  requireCampaign,
  updateCampaign,
  validatePatch,
  AppError,
} from "./campaigns.js";
const questions: Record<string, string> = {
  campaignName: "What would you like to name this campaign?",
  productDescription: "What product or service are you promoting?",
  targetCountries: "Which countries: US, GB, DE, FR or CA?",
  budget: "What is your planned campaign budget in USD?",
  publisherIds: "Select publishers in the review panel.",
  category: "Choose technology, education, fitness or travel.",
  destinationUrl: "What HTTP(S) destination URL should the ad open?",
  currency: "Campaign budgets use USD.",
};
export async function converse(
  provider: Provider,
  id: string,
  version: number,
  content: string,
) {
  const row = await requireCampaign(id);
  if (row.status === "ACTIVE")
    throw new AppError(
      409,
      "ACTIVE_CAMPAIGN",
      "Pause the campaign before editing",
    );
  if (row.version !== version)
    throw new AppError(
      409,
      "STALE_VERSION",
      "Reload the campaign before continuing.",
    );
  const history = await repository.history(id);
  const result = await provider.propose({
    draft: JSON.parse(row.data),
    messages: [...history, { role: "user", content }],
    publishers: (await db.publisher.findMany()) as Publisher[],
  });
  const draft = await validatePatch(JSON.parse(row.data), result.patch);
  const missing = missingFields(draft);
  const answer = missing.length
    ? `Draft updated. ${questions[missing[0]]}`
    : "Your campaign is ready for review. Check every field, then use the confirmation button to save or activate the campaign.";
  const campaign = await updateCampaign(id, version, result.patch, [
    { role: "user", content },
    { role: "assistant", content: answer },
  ]);
  return {
    campaign,
    messages: await repository.history(id),
    missing,
    tokens: result.tokens ?? null,
  };
}
