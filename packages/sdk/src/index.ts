export interface Ad {
  id: string;
  title: string;
  description: string;
  url: string;
}
// Keep the browser SDK dependency-free while checking the response at runtime.
function parseAd(value: unknown): Ad {
  if (!value || typeof value !== "object")
    throw new Error("Invalid advertisement");
  const ad = value as Record<string, unknown>;
  if (
    !["id", "title", "description", "url"].every(
      (key) => typeof ad[key] === "string",
    )
  )
    throw new Error("Invalid advertisement");
  const url = new URL(ad.url as string);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password
  )
    throw new Error("Unsafe advertisement URL");
  return {
    id: ad.id as string,
    title: ad.title as string,
    description: ad.description as string,
    url: url.href,
  };
}
export interface AdContext {
  category: "technology" | "education" | "fitness" | "travel";
  keywords: string[];
  country?: "US" | "GB" | "DE" | "FR" | "CA";
}
export interface Placement {
  destroy(): void;
}
export class ContextPilot {
  private placements = new Set<Placement>();
  private controllers = new Set<AbortController>();
  private disposed = false;
  constructor(
    private options: {
      publisherId: string;
      apiUrl: string;
      timeoutMs?: number;
    },
  ) {
    const url = new URL(options.apiUrl);
    if (!["http:", "https:"].includes(url.protocol))
      throw new Error("apiUrl must use HTTP(S)");
  }
  async fetchAd(context: AdContext): Promise<Ad | null> {
    if (this.disposed) throw new Error("SDK is disposed");
    const controller = new AbortController();
    this.controllers.add(controller);
    const timeout = setTimeout(
      () => controller.abort(),
      this.options.timeoutMs ?? 8000,
    );
    try {
      const response = await fetch(
        `${this.options.apiUrl.replace(/\/$/, "")}/api/ads/match`,
        {
          method: "POST",
          credentials: "omit",
          referrerPolicy: "no-referrer",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            publisherId: this.options.publisherId,
            country: context.country ?? "US",
            category: context.category,
            keywords: context.keywords,
          }),
        },
      );
      if (!response.ok) throw new Error("Ad service unavailable");
      const body = (await response.json()) as { ad: unknown };
      return body.ad === null ? null : parseAd(body.ad);
    } finally {
      clearTimeout(timeout);
      this.controllers.delete(controller);
    }
  }
  async renderAd(options: {
    container: string | HTMLElement;
    context: AdContext;
  }): Promise<Placement> {
    if (this.disposed) throw new Error("SDK is disposed");
    const container =
      typeof options.container === "string"
        ? document.querySelector<HTMLElement>(options.container)
        : options.container;
    if (!container) throw new Error("Ad container not found");
    const root = document.createElement("aside");
    root.setAttribute("aria-label", "Sponsored advertisement");
    root.setAttribute("role", "status");
    root.textContent = "Loading sponsored content…";
    container.append(root);
    let destroyed = false;
    const placement: Placement = {
      destroy: () => {
        destroyed = true;
        root.remove();
        this.placements.delete(placement);
      },
    };
    this.placements.add(placement);
    try {
      const ad = await this.fetchAd(options.context);
      if (destroyed) return placement;
      root.replaceChildren();
      if (!ad) {
        root.textContent = "No matching advertisement.";
        return placement;
      }
      const label = document.createElement("small");
      label.textContent = "SPONSORED";
      const title = document.createElement("h3");
      title.textContent = ad.title;
      const description = document.createElement("p");
      description.textContent = ad.description;
      const link = document.createElement("a");
      link.href = ad.url;
      link.textContent = "Learn more →";
      link.target = "_blank";
      link.rel = "noopener noreferrer sponsored";
      root.append(label, title, description, link);
    } catch {
      if (!destroyed)
        root.textContent = "Sponsored content is currently unavailable.";
    }
    return placement;
  }
  dispose() {
    this.disposed = true;
    for (const c of this.controllers) c.abort();
    for (const p of this.placements) p.destroy();
    this.controllers.clear();
  }
}
