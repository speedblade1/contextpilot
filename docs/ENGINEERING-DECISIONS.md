# Engineering decisions

| Decision                    | Why                                                | Trade-off / alternative                                               |
| --------------------------- | -------------------------------------------------- | --------------------------------------------------------------------- |
| npm workspaces              | One install and shared contracts                   | Independent packages need a publishing/versioning policy              |
| Prisma 6 + SQLite           | Reproducible local relational persistence          | Production should use managed storage, migrations and tested backups  |
| JSON draft column           | Incomplete drafts are easy to merge and inspect    | SQL cannot constrain every field; normalized targets scale better     |
| Strict partial Zod patches  | Reject unauthorized fields, preserve absent fields | Null cannot mean clear; form corrections use valid replacement values |
| Forced function call        | Explicit extraction contract                       | Compatible services must support function calling                     |
| Trusted follow-up questions | Predictable missing-field behavior                 | Less natural than model-authored conversation                         |
| Demo parser                 | Free, deterministic, independently testable        | Limited English vocabulary, not an LLM substitute                     |
| Optimistic revisions        | Prevent stale chat/form overwrites                 | Users reload after conflict; no collaborative merging                 |
| DRAFT / READY / ACTIVE      | Small, inspectable lifecycle                       | Explicit save is a confirmation checkpoint; drafts already persist    |
| Fixed local owner           | Keeps learning scope focused                       | Not authentication; loopback deployment only                          |
| No impression writes        | No tracking or artificial accounting               | Statistics are seeded and never represent real delivery               |
| Derived ad creative         | Campaigns immediately integrate with SDK           | A separate creative model is needed for multiple assets/approval      |
| Pure DOM SDK                | Small integration surface, no React requirement    | Publisher owns styling; no iframe isolation                           |
| Stable matching ties        | Reproducible demos/tests                           | Not fair rotation, auction or optimization                            |

The five-country and USD restrictions are product constraints, not accidental omissions. Publisher IDs come from the database. No pricing is delegated to the model. Monetary eligibility uses integer cents; display budgets are bounded decimal numbers validated to two places.

The Express routing layer intentionally combines route declaration and thin HTTP adapters. Splitting each one-line adapter into another controller file would add navigation overhead without changing boundaries. Services isolate domain decisions; repositories centralize common reads and serialization; transaction writes are explicit in services.

Security work completed: bounded JSON inputs, strict schemas, catalog checks, fixed owner filtering, expected revisions, dedicated confirmations, CORS/origin guard, security headers, AI rate limiting, safe rendered text and links, secret redaction and server-only keys. Work still required before deployment: real authentication, tenant ownership checks at every query, CSRF/session policy, per-account quotas, retention/deletion policy, abuse review, server-side URL approval, monitoring, migration strategy and financial controls if real spending is ever introduced.

No production SLA, benchmark, model accuracy score or live provider result is claimed. Dependency versions are frozen by the generated lockfile after install; update them with tests rather than assuming newer releases preserve behavior.

The root dependency overrides pin patched versions of deepmerge-ts, Effect, minimatch and esbuild. Prisma CLI is a root development dependency so npm applies these overrides to its configuration dependencies. Database setup and the complete test/build workflow were rerun with these versions; the final npm audit reported no advisories. Reassess overrides when upgrading their parent packages rather than retaining them indefinitely.
