# Build ContextPilot yourself

Rebuild one working slice at a time. Do not start by reproducing the entire interface. The goal is to explain why every boundary exists and prove it with a test.

## Milestone 1 — A runnable workspace

**Learn:** npm workspaces, module resolution, development versus production builds.

**Create:** root `package.json`, `tsconfig.json`, `apps/api/package.json`, `apps/web/package.json`, `packages/shared/package.json`, `.gitignore`, `.env.example`.

**Steps:** Create the directories. Add `workspaces: ["apps/*", "packages/*"]`. Use TypeScript strict mode and ES modules. Install dependencies from the root. Add a tiny Express health route and a Vite React page that fetches it through the development proxy. Ignore `.env`, SQLite files and build output before adding a real key.

**Check:** Run the API and request `/api/health`. Start Vite and verify the browser receives JSON, then run `tsc --noEmit`.

**Common mistakes:** Running npm in an unrelated parent folder; using a browser-exposed environment variable for an API key; assuming a TypeScript compile validates incoming JSON.

**Exercise:** Add a version string to the health response and display it on the page without duplicating the response type.

## Milestone 2 — Define valid data

**Learn:** Runtime schemas, inferred types, optional patches and invariants.

**Create:** `packages/shared/src/index.ts`, `tests/shared.test.ts`.

**Steps:** Write a strict complete campaign schema. Restrict categories/countries; require positive bounded two-decimal USD budgets; validate HTTP(S) URLs. Derive a partial schema for patches. Implement `missingFields` by validating each required field. Merge validated patches with object spread, never by rebuilding an object from only supplied keys.

**Check:** Test empty draft completion, negative budgets, invalid country codes and status injection. A patch `{budget:400}` must not contain a status property or erase the campaign name.

**Common mistakes:** Treating `null` and an absent property as equivalent; accepting numeric strings without deciding whether coercion is intended; using TypeScript assertions instead of parsing.

**Exercise:** Add a maximum campaign-name length and show its error clearly in the browser.

## Milestone 3 — Persistence and CRUD

**Learn:** Relational models, Prisma generation, serialization and ownership.

**Create:** `apps/api/prisma/schema.prisma`, `seed.ts`, `src/repositories.ts`, `scripts/database.ts`.

**Steps:** Model publishers, campaigns and ordered messages. Store draft JSON in a text column, but require schema validation before every write. Use a fixed server-side local owner, not a body-supplied owner. Add idempotent publisher and campaign seeds. Implement create/list/detail/patch/delete endpoints and a consistent error envelope.

**Check:** Create a campaign, restart the server and read it again. Use a separate test database in integration tests. Verify delete cascades to conversation messages.

**Common mistakes:** Resetting the development database inside tests; assuming a seed is safe if repeated; letting the client choose ownership; returning ORM rows without normalizing dates/JSON.

**Exercise:** Add pagination to campaign listing, with validated cursor or offset inputs.

## Milestone 4 — Lifecycle and concurrency

**Learn:** State machines, optimistic concurrency, transactions and explicit consent.

**Create:** `src/services/campaigns.ts`, the corresponding API integration tests.

**Steps:** Define DRAFT, READY and ACTIVE. Compute READY from complete validated data. Require confirmation on a separate lifecycle endpoint. Refuse active edits. Include `version` in every mutation and update using the expected version in the WHERE condition. Store chat messages and draft updates in one transaction.

**Check:** Activate an incomplete draft: reject it. Activate with `confirmed:false`: reject it. Submit two updates at revision 0: exactly one should succeed. Pause an active campaign before editing.

**Common mistakes:** Checking version only before an update; treating a chat message saying “yes” as UI consent; persisting the assistant answer before validating its patch.

**Exercise:** Add an explicit archived state and draw every legal transition before writing code.

## Milestone 5 — Deterministic conversation

**Learn:** Dependency inversion, orchestration and bounded parsing.

**Create:** `src/ai/provider.ts`, `src/services/conversation.ts`.

**Steps:** Define a provider interface with `propose(context)`. Build a narrow demo implementation that extracts budgets, country names, category keywords and names. Load the draft, recent conversation and publisher catalog on the server. Apply the proposal through campaign services, then ask for the first missing field. Label the interface as simulation.

**Check:** Send a campaign idea, then a budget-only change. Confirm country/publisher fields remain. Test an invalid provider patch and verify that neither draft nor messages changed.

**Common mistakes:** Asking for a field already present; treating the demo parser as full natural language support; sending the whole database as context.

**Exercise:** Teach the demo parser a new phrase while keeping the API test provider independent.

## Milestone 6 — Real AI adapter

**Learn:** Function calls, prompt injection boundaries, timeout and retry policies.

**Create:** `LiveProvider`, `parseProposal`, `tests/ai.test.ts`.

**Steps:** Read the official provider documentation. Configure server-only URL/model/key. Declare a proposal-only function tool. Force that function, check the returned name and number of calls, parse JSON, and validate with Zod. Use SDK-managed bounded retries and timeouts. Return usage totals when supplied. Convert provider errors to safe public errors.

**Check:** Inject fake SDK clients for valid arguments, malformed JSON, wrong tool name, timeout and transient failure. A test suite must run without a real key. If you later make a live request, record that result separately from mock test evidence.

**Common mistakes:** Inventing model names; trusting tool arguments because they look structured; allowing model calls to activate campaigns; logging raw errors that can contain request data.

**Exercise:** Implement another provider adapter without changing campaign business logic.

## Milestone 7 — React dashboard and review

**Learn:** Query state versus local form state, controlled inputs and mutation invalidation.

**Create:** `apps/web/src/api.ts`, `main.tsx`, `CampaignProgress.tsx`, `styles.css`.

**Steps:** Add list/detail routes. Use TanStack Query for server data and local state for unsaved review edits. Populate the form only from successful server responses. Disable chat while review edits are unsaved to avoid silent overwrites. Invalidate detail/list queries after successful writes. Display loading, conflict and validation errors. Add a confirmation dialog, responsive layout, keyboard focus containment and reduced-motion styling.

**Check:** Reload after editing and verify persistence. Test desktop and narrow layouts. Navigate by keyboard. Confirm the progress component counts validated fields, not merely nonempty inputs.

**Common mistakes:** Optimistically displaying a rejected model proposal as persisted state; submitting an empty numeric field as zero; hiding errors in the console; enabling activation with unsaved form changes.

**Exercise:** Split the builder into chat, review and confirmation components while keeping a single source of truth for the campaign revision.

## Milestone 8 — Contextual delivery and SDK

**Learn:** Filtering versus ranking, package APIs, DOM safety and lifecycle cleanup.

**Create:** `services/matching.ts`, `packages/sdk/src/index.ts`, the publisher demo.

**Steps:** Filter active campaigns by publisher, country and budget. Score category/keyword matches deterministically. Return a minimal ad response. Implement an SDK fetch with timeout and no credentials. Render text with DOM APIs, validate links, and expose placement destruction and client disposal. Build ESM/CommonJS and declarations with tsup.

**Check:** Test no-fill, unsafe text, unsafe URLs, fetch failure, cleanup and disposal while a response is pending. Open the publisher demo and check an eligible ad from your stored campaign.

**Common mistakes:** Rendering `innerHTML`; leaking event handlers/requests after navigation; confusing an impression read with billing; implying keyword scoring is a real auction.

**Exercise:** Add a frequency-independent round-robin strategy using no visitor identifiers, and explain how it changes deterministic tests.

## Milestone 9 — Evidence and portfolio

**Learn:** Layered testing, CI, reproducibility and honest claims.

**Create:** Vitest/Playwright config, GitHub Actions workflow, README and design documents.

**Steps:** Write a browser workflow from idea to confirmed activation to SDK delivery. Capture actual screenshots. Run build, typecheck, lint, tests and browser workflow. Record failures as well as final passes. Freeze dependencies in a lockfile. Explain limitations rather than filling gaps with invented metrics.

**Check:** Rebuild from a fresh clone using only the README. Verify setup needs no paid key and no undocumented database step.

**Common mistakes:** Claiming tests passed because they were written; making screenshots the only proof; describing mocked provider tests as live API verification.

**Exercise:** Ask a friend to follow only your README and collect the setup issues they encounter.

## Suggested study order

Read the shared schema, campaign service, conversation service, provider adapter and SDK first. Then follow one request from the React mutation through Express to SQLite. Finally study the tests before changing behavior: they describe the invariants your implementation must preserve.
