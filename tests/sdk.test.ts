// @vitest-environment jsdom
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { ContextPilot } from "../packages/sdk/src";
const context = { category: "technology" as const, keywords: ["software"] };
let sdk: ContextPilot;
beforeEach(() => {
  document.body.innerHTML = '<div id="ad"></div>';
  sdk = new ContextPilot({
    publisherId: "byte-journal",
    apiUrl: "http://localhost:4000",
  });
});
afterEach(() => {
  sdk.dispose();
  vi.unstubAllGlobals();
});
function respond(ad: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ad }) }),
  );
}
describe("Publisher SDK", () => {
  it("renders text safely and uses safe external link attributes", async () => {
    respond({
      id: "a",
      title: "<img src=x onerror=alert(1)>",
      description: "A course",
      url: "https://example.com",
    });
    await sdk.renderAd({ container: "#ad", context });
    expect(document.querySelector("img")).toBeNull();
    expect(document.querySelector("h3")?.textContent).toContain("<img");
    expect(document.querySelector("a")?.rel).toContain("noopener");
  });
  it("handles an empty response", async () => {
    respond(null);
    await sdk.renderAd({ container: "#ad", context });
    expect(document.body.textContent).toContain("No matching advertisement");
  });
  it("shows a network failure without exposing internals", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("secret")));
    await sdk.renderAd({ container: "#ad", context });
    expect(document.body.textContent).toContain("currently unavailable");
    expect(document.body.textContent).not.toContain("secret");
  });
  it("rejects unsafe URLs", async () => {
    respond({
      id: "a",
      title: "unsafe",
      description: "x",
      url: "javascript:alert(1)",
    });
    await sdk.renderAd({ container: "#ad", context });
    expect(document.querySelector("a")).toBeNull();
    expect(document.body.textContent).toContain("unavailable");
  });
  it("cleans up only its own placement", async () => {
    respond(null);
    const p = await sdk.renderAd({ container: "#ad", context });
    p.destroy();
    p.destroy();
    expect(document.querySelector("#ad")?.children.length).toBe(0);
  });
  it("does not render late responses after dispose", async () => {
    let resolve!: (value: unknown) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(
        () =>
          new Promise((r) => {
            resolve = r;
          }),
      ),
    );
    const pending = sdk.renderAd({ container: "#ad", context });
    sdk.dispose();
    resolve({ ok: true, json: async () => ({ ad: null }) });
    await pending;
    expect(document.querySelector("#ad")?.children.length).toBe(0);
    await expect(sdk.fetchAd(context)).rejects.toThrow("disposed");
  });
});
