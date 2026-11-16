# Publisher SDK guide

An SDK packages an application's public integration contract so callers do not need to duplicate transport, validation, rendering and cleanup logic. This SDK is intentionally small and has no React dependency.

## Install locally

Inside the monorepo, npm workspaces link `@contextpilot/sdk`. Build it before using the publisher demo:

```sh
npm run build -w @contextpilot/sdk
```

For a separate site, create a tarball with `npm pack -w @contextpilot/sdk`, then install that tarball in the site. A small public Ad interface and runtime shape/URL validator keep the package and its declarations self-contained. The four-field response contract is exercised against the API in the browser workflow. Confirm tarball contents with `npm pack -w @contextpilot/sdk --dry-run`. This project has not been published to a public registry.

```ts
import { ContextPilot } from "@contextpilot/sdk";
const client = new ContextPilot({
  publisherId: "byte-journal",
  apiUrl: "http://localhost:4000",
  timeoutMs: 8000,
});
const placement = await client.renderAd({
  container: "#sponsored",
  context: {
    category: "technology",
    keywords: ["programming", "software"],
    country: "DE",
  },
});
// On route teardown:
placement.destroy();
client.dispose();
```

Add the publisher site's origin to the API's `CORS_ORIGINS` allowlist. Country defaults to US if omitted; it is never inferred from IP. Context keywords are supplied by the site, not scraped or collected from visitors.

## Public API

| API                           | Contract                                                             |
| ----------------------------- | -------------------------------------------------------------------- |
| constructor                   | Publisher ID, HTTP(S) API URL, optional timeout                      |
| fetchAd(context)              | Promise of validated Ad or null; rejects network/validation failures |
| renderAd({container,context}) | Promise of Placement; renders loading, no-fill or error state        |
| placement.destroy()           | Idempotently removes that placement's root only                      |
| client.dispose()              | Aborts pending fetches, destroys placements; client cannot be reused |

`container` accepts a selector or HTMLElement. A missing container throws, because it is an integration error rather than a network issue. A placement is registered before awaiting the request; disposing the SDK during a fetch prevents late rendering. Destroying one completed placement does not affect siblings or other publisher content.

## Rendering and privacy

The response passes a small runtime shape and URL validator. Title and description use `textContent`, never HTML interpolation. URLs must be HTTP(S) without embedded credentials. Links open with `noopener noreferrer sponsored`. Fetch omits credentials and referrers. There is no cookie, visitor ID, local storage, fingerprinting or analytics beacon in the SDK.

The publisher controls CSS; the SDK creates a semantic `aside` with an advertisement label and status. `apps/publisher-demo/index.html` demonstrates simple styling. ESM and CommonJS builds require a module-aware consumer or bundler; no separate CDN script/global build is supplied.

Tests exercise rendering, no-fill, unsafe text/URLs, network errors, cleanup and late-response disposal. HTTP destination URLs are allowed for local examples; a production integration should generally require HTTPS and apply an advertiser URL approval policy.
