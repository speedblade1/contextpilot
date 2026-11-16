# @contextpilot/sdk

A small TypeScript SDK for ContextPilot's fictional contextual advertisements.

```ts
import { ContextPilot } from "@contextpilot/sdk";
const ads = new ContextPilot({
  publisherId: "byte-journal",
  apiUrl: "http://localhost:4000",
});
const placement = await ads.renderAd({
  container: "#ad-container",
  context: { category: "technology", keywords: ["software"], country: "DE" },
});
// On teardown:
placement.destroy();
ads.dispose();
```

Exports ESM, CommonJS and standalone TypeScript declarations. `fetchAd(context)` returns an Ad or null and rejects errors. `renderAd` renders loading, no-fill and error messages. It uses safe text rendering and HTTP(S) links, omits credentials/referrers and does not track visitors. Add your site's origin to the API's allowlist. `dispose()` aborts outstanding requests and makes the client unusable.

This package is an unpublished portfolio demo, with no real billing or advertising delivery guarantees. Full integration and architecture documentation lives in the monorepo's `docs/SDK-GUIDE.md`.
