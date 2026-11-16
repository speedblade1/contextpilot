# Twenty interview questions with example answers

1. **What does ContextPilot do?** It converts advertiser messages into validated campaign draft updates. An explicitly confirmed active campaign can then be served as a fictional contextual ad through a standalone SDK. It is a local demonstration, not a spending platform.

2. **Why separate a provider from orchestration?** The provider only proposes data. Orchestration loads context, verifies the proposal, asks for missing fields and persists changes. This lets me switch from a deterministic parser to a real provider without changing campaign rules.

3. **Why are TypeScript types insufficient at the API boundary?** Types disappear at runtime. A browser or model can send arbitrary JSON. Zod parses the actual value, rejects unknown keys and enforces constraints before a write.

4. **How do partial updates preserve information?** The schema accepts optional known fields. After validating, I merge the patch onto the existing draft. Absent keys retain old values. Arrays are replacement values, so an add request must propose the combined list.

5. **What prevents the model from launching a campaign?** The model tool can only propose campaign content fields. Status is not in the strict patch schema. A separate server endpoint checks complete data, the current lifecycle, expected revision and explicit UI confirmation.

6. **How does optimistic concurrency work?** A client submits the version it read. The database update matches that version and increments it atomically. If no row is changed, the API returns 409. A stale chat response cannot overwrite a newer form edit.

7. **Why use a transaction for conversations?** The field change and the two conversation messages represent one successful step. If any operation fails, neither the new draft nor a misleading success answer should remain committed.

8. **How is prompt injection handled?** The prompt defines extraction boundaries, but containment is enforced in code: strict schemas, publisher lookup, fixed ownership and no lifecycle tool. A valid but unwanted proposal is still possible, which is why final human review matters.

9. **What does function calling guarantee?** It provides a structured response convention, not trust. I still verify the function name/count, parse arguments and validate values. I do not execute model-supplied function names dynamically.

10. **How are provider failures handled?** The SDK has a configured timeout and bounded retries for transient failures. The adapter maps errors to safe status codes. Failed calls leave the draft unchanged and the UI allows retry or manual editing.

11. **Why SQLite and JSON drafts?** They make local setup and incomplete draft evolution straightforward. The cost is reduced SQL-level field constraints and queryability. A larger service would normalize targeting and use migrations on a managed database.

12. **What is the difference between validation and authorization?** Validation decides whether data is structurally and semantically acceptable. Authorization decides whether this actor may change this resource. Here owner filtering is fixed to a clearly marked local user; real identity and tenant authorization remain future work.

13. **Is CORS authentication?** No. It constrains participating browsers, not arbitrary HTTP clients. The demo header is also not a secret. Loopback binding and honest local-only scope are essential until real authentication exists.

14. **Why TanStack Query?** It manages asynchronous server state, loading/error status and invalidation. Unsaved form values remain local React state. Mixing the two without care could overwrite a user's in-progress edits on refetch.

15. **How do JavaScript promises affect SDK cleanup?** A response can resolve after navigation or disposal. The SDK registers placement ownership before awaiting, aborts requests on disposal and checks destruction before rendering a late result.

16. **How does the SDK prevent XSS?** It uses textContent for advertiser strings and validates HTTP(S) destinations. It never injects model-provided HTML. External links use noopener and noreferrer. Production would also need URL approval and abuse controls.

17. **How does matching work?** Eligibility filters status, publisher selection, country and remaining mock budget. A deterministic score combines publisher/page category and fixed vocabulary matches. It returns one highest-scoring ad with stable ties, not a bid-based auction.

18. **How do you test without paid AI?** The demo provider and injected fake SDK responses test the same orchestration contract. Unit tests cover parsing; integration tests cover persistence and business rules; Playwright covers user confirmation and actual SDK delivery. This does not prove live model quality.

19. **What REST status codes matter here?** 201 for creation, 204 for deletion, 422 for invalid campaign values, 409 for stale revisions or illegal state, 429 for rate limiting, and 502/504 for upstream failures/timeouts. Errors share a predictable JSON envelope.

20. **What would you improve before production?** Add authenticated tenant ownership, quotas, retention controls, normalized creatives/targeting, migrations, audit logs, monitoring and accessibility/security evaluation. Real spending needs financial ledgers and transactional billing, not a client-supplied budget field.
