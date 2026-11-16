# LLM integration

## Verified provider contract

The [official Thaura API page](https://thaura.ai/api-platform), consulted November 13, 2026, documents an OpenAI-compatible base URL of `https://backend.thaura.ai/v1`, chat model `thaura`, and function calling with forced tool choice. The implementation uses the OpenAI JavaScript client and a `propose_campaign_patch` function declaration. No invented model identifiers or endpoint paths are required. The SDK supplies the chat-completions route.

Configure the root `.env` as described in the README. Keep `AI_MODE=demo` until you deliberately enable provider requests. API keys never reach the React bundle, publisher page, API response or logs. Live integration is implemented but must be verified with an actual key before claiming a successful Thaura round trip.

## Responsibilities and trust

The provider receives current draft, publisher catalog and the last 20 messages. System instructions require extraction only, preservation of unrelated fields, catalog-constrained IDs and no activation. The model returns function arguments. These are **untrusted data**, not executable commands.

The adapter checks that exactly one expected function call exists, parses JSON and applies a strict Zod partial schema. The conversation service validates catalog IDs, merges the patch onto the existing draft, determines missing fields, and writes through the version-checked campaign service. Unknown properties, malformed budgets, unsupported countries, unsafe URLs and fabricated publishers fail closed. Nothing is stored after validation failure.

Function calling improves shape reliability, but is not a security boundary or guarantee. The schema does not set `strict:true` because this extraction tool uses optional patch fields and supports compatible providers without assuming their strict JSON-schema subset. Runtime validation is authoritative. A provider that cannot perform forced function calls needs a different adapter.

## Multi-turn changes

Scalar keys replace only that key. Arrays are complete replacements: the prompt instructs the model to combine existing values when the user says “add.” Server business logic remains provider independent. A second message changing only budget leaves all other fields untouched. Final activation is impossible through a patch because `status`, `ownerId`, prices and spending counters are not patch fields.

The deterministic parser is a useful executable fixture. It recognizes a small English vocabulary and asks the same trusted follow-up questions as the live flow. It is visibly labeled as simulation, has no API key requirement, and is not advertised as a general natural-language model. Ambiguous language should be corrected in the review panel.

## Failure handling

The OpenAI client uses a configurable per-attempt timeout and two SDK-managed retries for transient failures. Total wall time can exceed the per-attempt timeout because retries and backoff are included. Nontransient errors are not blindly retried. The adapter converts errors to safe application codes and never exposes the raw error body. Invalid JSON/tool calls produce `INVALID_MODEL_OUTPUT`. Validation failures preserve the previous draft and messages so the user can retry or edit manually.

When usage is supplied, the response returns `total_tokens` as `tokens`; otherwise it is null. This is request-level instrumentation, not a durable billing/metrics system. No token prices or spend are fabricated.

## Prompt injection

System instructions identify user and catalog strings as untrusted, but prompts alone cannot guarantee resistance. Actual containment comes from the allowlisted patch schema, catalog verification, fixed owner, expected revision, state machine and separate confirmation endpoint. A malicious model may still propose plausible but unwanted valid fields. The review panel and explicit final action are necessary human checks. No external browsing, arbitrary tools, code execution or untrusted tool response execution is available.

## Tests

`tests/ai.test.ts` injects fake SDK clients for valid calls, token usage, unexpected tool names, timeout and API failure. `tests/api.test.ts` injects a provider with fabricated publishers and verifies no writes occur. These test the adapter contract and boundaries without a paid API; they do not establish live model accuracy or comprehensive adversarial resistance.
