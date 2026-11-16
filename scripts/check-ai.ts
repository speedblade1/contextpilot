import { OpenAIProvider } from "../apps/api/src/ai/openai.js";
import { config } from "../apps/api/src/config.js";
import { AppError } from "../apps/api/src/services/campaigns.js";
if (!config.apiKey) {
  console.log(
    "OPENAI_API_KEY is empty. Add it to the private .env file; no request was sent.",
  );
  process.exitCode = 1;
} else {
  try {
    const result = await new OpenAIProvider().propose({
      draft: { currency: "USD" },
      publishers: [],
      messages: [
        {
          role: "user",
          content: "Set the budget to 1 USD; leave all other fields unchanged.",
        },
      ],
    });
    if (result.patch.budget !== 1)
      throw new Error("Unexpected validated response");
    console.log(
      `OpenAI connection verified. Model: ${config.model}. Tokens: ${result.tokens ?? "not reported"}. No campaign was changed.`,
    );
  } catch (error) {
    console.error(
      error instanceof AppError
        ? `${error.code}: ${error.message}`
        : "AI check failed. No campaign was changed.",
    );
    process.exitCode = 1;
  }
}
