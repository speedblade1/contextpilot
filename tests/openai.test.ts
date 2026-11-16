import { it, expect, vi, afterEach } from "vitest";
import OpenAI from "openai";
import {
  OpenAIProvider,
  openAITool,
  parseOpenAIProposal,
} from "../apps/api/src/ai/openai";
import { config } from "../apps/api/src/config";
const original = config.apiKey;
afterEach(() => {
  config.apiKey = original;
});
const empty = {
  campaignName: null,
  productDescription: null,
  targetCountries: null,
  budget: null,
  currency: null,
  publisherIds: null,
  category: null,
  destinationUrl: null,
};
const context = {
  draft: {},
  messages: [{ role: "user" as const, content: "Set budget to 20 USD" }],
  publishers: [],
};
it("converts nullable strict output into a safe partial patch", () =>
  expect(parseOpenAIProposal(JSON.stringify({ ...empty, budget: 20 }))).toEqual(
    { budget: 20 },
  ));
it.each([
  { ...empty, budget: -1 },
  { ...empty, targetCountries: ["ZZ"] },
  { ...empty, status: "ACTIVE" },
  { budget: 5 },
])("rejects invalid strict proposals", (value) =>
  expect(() => parseOpenAIProposal(JSON.stringify(value))).toThrow(),
);
it("uses Responses with strict function calling, no storage and no parallel tools", async () => {
  config.apiKey = "test-only";
  const create = vi.fn().mockResolvedValue({
    status: "completed",
    output: [
      {
        type: "function_call",
        name: openAITool.name,
        arguments: JSON.stringify({ ...empty, budget: 20 }),
      },
    ],
    usage: { total_tokens: 45 },
  });
  const provider = new OpenAIProvider({
    responses: { create },
  } as unknown as OpenAI);
  expect(await provider.propose(context)).toEqual({
    patch: { budget: 20 },
    tokens: 45,
  });
  expect(create.mock.calls[0][0]).toMatchObject({
    store: false,
    parallel_tool_calls: false,
    tools: [{ strict: true }],
  });
});
it("blocks an unconfigured provider before a network request", async () => {
  config.apiKey = "";
  const create = vi.fn();
  await expect(
    new OpenAIProvider({ responses: { create } } as unknown as OpenAI).propose(
      context,
    ),
  ).rejects.toMatchObject({ code: "AI_NOT_CONFIGURED" });
  expect(create).not.toHaveBeenCalled();
});
it.each([
  [new OpenAI.APIConnectionTimeoutError(), "AI_TIMEOUT"],
  [
    new OpenAI.APIError(401, {}, "private-key-details", new Headers()),
    "AI_AUTH_FAILED",
  ],
  [
    new OpenAI.APIError(429, {}, "private billing details", new Headers()),
    "AI_LIMIT",
  ],
  [
    new OpenAI.APIError(
      429,
      { code: "insufficient_quota" },
      "private quota details",
      new Headers(),
    ),
    "AI_QUOTA",
  ],
  [
    new OpenAI.APIError(404, {}, "not found", new Headers()),
    "AI_MODEL_UNAVAILABLE",
  ],
])("maps provider errors to safe actionable messages", async (error, code) => {
  config.apiKey = "test-only";
  const create = vi.fn().mockRejectedValue(error);
  await expect(
    new OpenAIProvider({ responses: { create } } as unknown as OpenAI).propose(
      context,
    ),
  ).rejects.toMatchObject({ code });
});
it("rejects incomplete responses rather than applying truncated updates", async () => {
  config.apiKey = "test-only";
  const create = vi
    .fn()
    .mockResolvedValue({ status: "incomplete", output: [] });
  await expect(
    new OpenAIProvider({ responses: { create } } as unknown as OpenAI).propose(
      context,
    ),
  ).rejects.toMatchObject({ code: "INVALID_MODEL_OUTPUT" });
});
