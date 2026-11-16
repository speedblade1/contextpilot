> Current personalized release (November 14, 2026): see [PERSONAL-WORKSPACE.md](PERSONAL-WORKSPACE.md). The following record describes the original November 13 baseline, not the current UI or provider configuration.

# Verification record

Executed locally on **November 13, 2026**, on Windows with Node **24.15.0** and npm **11.12.1**. Results describe this checkout, not a deployed service.

| Check                             | Actual result                                                                                                    |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Dependency installation           | Completed; lockfile generated                                                                                    |
| `npm run db:setup`                | Passed; Prisma client generated, SQLite schema synchronized, 4 fictional publishers and 1 sample campaign seeded |
| `npm run build`                   | Passed for shared package, SDK, API, React dashboard and publisher demo                                          |
| `npm run typecheck`               | Passed, including source, scripts, config and test files                                                         |
| `npm run lint`                    | Passed                                                                                                           |
| `npm test`                        | **31 passed**, 5 files                                                                                           |
| `npm run test:e2e`                | **2 passed**, Chromium                                                                                           |
| `npm audit` / final install audit | **0 vulnerabilities** after dependency upgrades and overrides                                                    |
| SDK packaging                     | `npm pack -w @contextpilot/sdk --dry-run` succeeded; ESM, CJS and declarations present                           |
| Built API startup                 | `node apps/api/dist/server.js` started successfully on loopback; stopped after check                             |
| Visual review                     | Dashboard, builder, dark mode, mobile and publisher screenshots opened and inspected                             |

The browser workflow created a campaign, extracted its description/budget/countries/publisher, changed the budget, edited the review panel, confirmed activation, reloaded persisted data and rendered that campaign in the publisher demo. Cleanup deleted its temporary campaign and restored the seeded active campaign. The second browser test checked dark-mode persistence and a 390-pixel viewport without page-level horizontal overflow.

The unit/integration suite covers required fields, negative/zero budgets, invalid countries/publishers/URLs, unauthorized patch fields, field preservation, explicit confirmation, stale and concurrent writes, active-edit protection, matching eligibility, API origin/header guards, provider outputs/errors/timeouts, SDK text/URL safety, no-fill, network failure and disposal. The React component test checks accessible progress against validated fields.

## Issues found and resolved

- Sandboxed dependency downloads failed DNS resolution; installation succeeded with network access.
- Supertest's initial API tests failed because the sandbox denied localhost connections. The same tests passed with local networking enabled.
- Prisma's Windows schema engine could not initialize a missing SQLite file. Setup now creates the empty file in append mode before schema synchronization, preserving existing databases.
- Initial type and SDK build errors were fixed, including the SDK build configuration and standalone declaration packaging.
- Initial dependency audit found advisories in validation and development tooling. Updated Zod/Vitest and applied tested root overrides; the final audit reported zero.

Vite reports two non-fatal annotation warnings from Zod's own source comments; generated bundles complete successfully. Playwright reports an environment color-variable warning; both tests pass.

## Not verified or claimed

- No live Thaura request was made: no API key was supplied. Adapter tests use injected SDK responses and deterministic providers.
- The GitHub Actions workflow is provided but has not run on GitHub.
- No deployment, public npm publication, performance/load benchmark, comprehensive security assessment or formal accessibility audit was performed.
- Browser verification covered Chromium, not Firefox or WebKit.
- Advertising spend/impressions remain fictional seeded values; no payment or production ad delivery occurred.
