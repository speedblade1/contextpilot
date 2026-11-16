# Portfolio summary

## CV description

ContextPilot is a TypeScript full-stack portfolio application for conversational creation and review of fictional advertising campaigns, paired with a privacy-conscious publisher SDK and deterministic contextual matching.

## Three CV bullets

- Implemented a React/Express monorepo with Prisma/SQLite persistence, shared Zod validation, explicit campaign lifecycle controls and optimistic concurrency.
- Built interchangeable deterministic and OpenAI-compatible AI adapters that propose validated field changes while keeping activation and authorization decisions in trusted backend code.
- Developed a standalone TypeScript publisher SDK with safe DOM rendering and cleanup, plus unit, API, SDK and browser workflow tests without paid AI dependencies.

Use these bullets only after studying the implementation and being able to explain your own contribution. No performance improvement, user adoption or deployment claim is implied.

## LinkedIn description

I built ContextPilot to explore how conversational interfaces can control structured workflows safely. Advertisers describe a campaign, review validated fields and explicitly confirm activation in a fictional local environment. A separate publisher SDK matches ads to page context without behavioral tracking. The project includes a deterministic AI simulation, a configurable live-provider adapter, persistence, tests and a rebuild tutorial. Its focus is understandable engineering boundaries rather than real ad spending.

## Sixty-second explanation

“ContextPilot is a portfolio project that connects conversational campaign creation to a publisher integration. The React dashboard sends messages to an Express API. An AI adapter proposes a limited field patch, but trusted code validates countries, budgets and publisher IDs before changing the draft. Users review the result and confirm activation themselves. I use a state machine and version checks to prevent invalid transitions and stale overwrites. The standalone SDK asks for an eligible ad based on page category, keywords and country, then renders it safely. All advertising is fictional, and the key-free demo makes tests reproducible. The most important lesson is that an LLM should propose changes, while deterministic code owns permissions and state.”

## Five-minute walkthrough

**0:00–0:45 — Product.** Show the campaign dashboard and distinguish fictional spend/statistics from real data. Create a campaign and explain the single-user local scope.

**0:45–1:45 — Conversation.** Send the programming-course example, change the budget, and show how unrelated fields remain. Explain the narrow simulation mode and optional live adapter. Point to the provider interface and strict partial schema.

**1:45–2:45 — Trust.** Complete name/URL, apply the review edits, and open confirmation. Explain DRAFT/READY/ACTIVE, expected versions and atomic message/draft updates. Show the tests that reject activation without confirmation and fabricated publishers.

**2:45–3:45 — SDK.** Open Byte Journal. Explain eligibility filters, category scoring and deterministic ties. Show the small integration and cleanup API. Explain why textContent and URL validation matter.

**3:45–4:30 — Verification.** Run or show the recorded build/test commands. Distinguish fake-provider contract tests from a real provider request. Explain the dedicated integration-test database and browser-test cleanup.

**4:30–5:00 — Trade-offs.** Discuss JSON drafts, SQLite, lack of authentication, seeded metrics and no auction/billing. Describe the next production work without suggesting it is already complete.
