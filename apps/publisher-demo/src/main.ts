import { ContextPilot, type AdContext } from "@contextpilot/sdk";
const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const publishers = new Map<
  string,
  { name: string; category: AdContext["category"] }
>();
const keywords: Record<AdContext["category"], string[]> = {
  technology: ["programming", "software"],
  education: ["learning", "course"],
  fitness: ["fitness", "workout"],
  travel: ["travel", "holiday"],
};
let sdk: ContextPilot | undefined;
async function render() {
  sdk?.dispose();
  sdk = new ContextPilot({
    publisherId: document.querySelector<HTMLSelectElement>("#publisher")!.value,
    apiUrl,
  });
  await sdk.renderAd({
    container: "#ad-container",
    context: {
      category:
        publishers.get(
          document.querySelector<HTMLSelectElement>("#publisher")!.value,
        )?.category ?? "technology",
      keywords:
        keywords[
          publishers.get(
            document.querySelector<HTMLSelectElement>("#publisher")!.value,
          )?.category ?? "technology"
        ],
      country: document.querySelector<HTMLSelectElement>("#country")!
        .value as AdContext["country"],
    },
  });
  const category =
    publishers.get(
      document.querySelector<HTMLSelectElement>("#publisher")!.value,
    )?.category ?? "technology";
  document.querySelector("#placement-context")!.textContent =
    `${category} · ${keywords[category].join(", ")}`;
}
document
  .querySelector("#country")!
  .addEventListener("change", () => void render());
document
  .querySelector("#refresh")!
  .addEventListener("click", () => void render());
window.addEventListener("pagehide", () => sdk?.dispose());
document
  .querySelector("#publisher")!
  .addEventListener("change", () => void render());
async function initialize() {
  try {
    const response = await fetch(`${apiUrl}/api/publishers`, {
      credentials: "omit",
    });
    if (!response.ok) throw new Error("Could not load publishers");
    const list = (await response.json()) as {
      id: string;
      name: string;
      category: AdContext["category"];
    }[];
    const select = document.querySelector<HTMLSelectElement>("#publisher")!;
    select.replaceChildren();
    for (const p of list) {
      publishers.set(p.id, p);
      const option = document.createElement("option");
      option.value = p.id;
      option.textContent = p.name;
      select.append(option);
    }
    if (list.some((p) => p.id === "byte-journal"))
      select.value = "byte-journal";
    if (!list.length) {
      document.querySelector("#ad-container")!.textContent =
        "Add a publisher in your workspace to preview a placement.";
      return;
    }
    await render();
  } catch {
    document.querySelector("#ad-container")!.textContent =
      "Cannot reach your workspace. Check that the API is running.";
  }
}
void initialize();
