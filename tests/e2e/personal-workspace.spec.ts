import { test, expect } from "@playwright/test";
const headers = { "X-ContextPilot-Client": "1" };
test("workspace name and animation preference persist", async ({ page }) => {
  await page.goto("/settings");
  await page.getByLabel("Workspace name").fill("Fern’s little studio");
  await page.getByRole("button", { name: "Save workspace name" }).click();
  await page.getByLabel("Gentle animations").uncheck();
  await page.reload();
  await expect(page.getByLabel("Workspace name")).toHaveValue(
    "Fern’s little studio",
  );
  await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
  await expect(
    page.getByText(/demo|simulation environment|mock impressions/i),
  ).toHaveCount(0);
  await page.screenshot({
    path: "docs/screenshots/settings.png",
    fullPage: true,
    animations: "disabled",
  });
});
test("publisher registration, integration snippet and confirmed removal work", async ({
  page,
}) => {
  await page.goto("/publishers");
  await page.getByLabel("Publisher name").fill("Lavender Notes");
  await page.getByLabel("Website URL").fill("http://localhost:5274/notes");
  await page
    .getByRole("button", { name: "Add publisher", exact: true })
    .click();
  const card = page
    .locator("article")
    .filter({ has: page.getByRole("heading", { name: "Lavender Notes" }) });
  await expect(card).toBeVisible();
  await card.getByText("Integration code").click();
  await expect(card.locator("pre")).toContainText("ContextPilot");
  await card.getByRole("button", { name: "Remove publisher" }).click();
  await card.getByRole("button", { name: "Confirm delete" }).click();
  await expect(card).toHaveCount(0);
});
test("manual campaign works without an OpenAI key and real served requests are counted", async ({
  page,
  request,
}) => {
  await page.route("**/api/health", (route) =>
    route.fulfill({
      json: {
        ok: true,
        mode: "live",
        provider: "openai",
        model: "gpt-5.4-mini",
        aiConfigured: false,
        localOnly: true,
      },
    }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Create campaign" }).click();
  await expect(
    page.getByRole("link", { name: "Connect OpenAI" }),
  ).toBeVisible();
  await expect(page.getByLabel("Your message")).toBeDisabled();
  const id = page.url().split("/").at(-1)!;
  try {
    await page
      .getByLabel("Campaign name", { exact: true })
      .fill("Moonlit coding lessons");
    await page
      .getByLabel("Product description")
      .fill("A programming course for curious builders.");
    await page.getByLabel("Budget (USD)").fill("125");
    await page
      .getByRole("combobox", { name: "Category", exact: true })
      .selectOption("technology");
    await page
      .getByLabel("Destination URL")
      .fill("https://example.com/lessons");
    await page.getByLabel("DE", { exact: true }).check();
    await page.getByLabel("Moonlit Journal").check();
    await page.getByRole("button", { name: "Apply review edits" }).click();
    await expect(page.getByText("8 of 8 details ready")).toBeVisible();
    await page
      .getByRole("button", { name: "Review & activate campaign" })
      .click();
    await page
      .getByRole("button", { name: "Confirm activate", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Pause campaign to edit" }),
    ).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: "docs/screenshots/manual-builder.png",
      fullPage: true,
      animations: "disabled",
    });
    await page.goto("http://localhost:5274");
    await expect(page.locator("#ad-container h3")).toHaveText(
      "Moonlit coding lessons",
    );
    const current = await (
      await request.get(`http://localhost:4100/api/campaigns/${id}`)
    ).json();
    expect(current.campaign.servedRequests).toBeGreaterThanOrEqual(1);
    expect(current.campaign.spentCents).toBe(0);
  } finally {
    const current = await (
      await request.get(`http://localhost:4100/api/campaigns/${id}`)
    ).json();
    await request.delete(`http://localhost:4100/api/campaigns/${id}`, {
      headers,
      data: { version: current.campaign.version, confirmed: true },
    });
  }
});
