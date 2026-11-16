import { test, expect } from "@playwright/test";
test("conversation, explicit review, activation and SDK delivery", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Create campaign" }).click();
  await page
    .getByLabel("Your message")
    .fill(
      "Promote my programming course in Germany and France with a budget of $500",
    );
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByLabel("Budget (USD)")).toHaveValue("500");
  await page.getByLabel("Your message").fill("Increase the budget to $400");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByLabel("Budget (USD)")).toHaveValue("400");
  await page
    .getByLabel("Campaign name", { exact: true })
    .fill("E2E programming course");
  await page.getByLabel("Destination URL").fill("https://example.com/e2e");
  await page.getByRole("button", { name: "Apply review edits" }).click();
  await expect(page.getByText("8 of 8 details ready")).toBeVisible();
  const id = page.url().split("/").at(-1)!;
  await page
    .getByRole("button", { name: "Review & activate campaign" })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("button", { name: "Confirm activate", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Pause campaign to edit" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Budget (USD)")).toHaveValue("400");
  // Isolate delivery from the seeded campaign, which otherwise ties deterministically.
  const list = await (
    await request.get("http://localhost:4100/api/campaigns")
  ).json();
  const paused = [];
  for (const c of list)
    if (c.id !== id && c.status === "ACTIVE") {
      await request.post(
        `http://localhost:4100/api/campaigns/${c.id}/transition`,
        {
          headers: { "X-ContextPilot-Client": "1" },
          data: { version: c.version, action: "pause", confirmed: true },
        },
      );
      paused.push(c);
    }
  try {
    await page.goto("http://localhost:5274");
    await expect(page.locator("#ad-container h3")).toHaveText(
      "E2E programming course",
    );
    await page.screenshot({
      path: "docs/screenshots/publisher.png",
      fullPage: true,
      animations: "disabled",
    });
    await page.goto(`http://localhost:5273/campaigns/${id}`);
    await page.screenshot({
      path: "docs/screenshots/builder.png",
      fullPage: true,
      animations: "disabled",
    });
    await page.goto("http://localhost:5273");
    await page.screenshot({
      path: "docs/screenshots/dashboard.png",
      fullPage: true,
      animations: "disabled",
    });
  } finally {
    for (const c of paused)
      await request.post(
        `http://localhost:4100/api/campaigns/${c.id}/transition`,
        {
          headers: { "X-ContextPilot-Client": "1" },
          data: { version: c.version + 1, action: "activate", confirmed: true },
        },
      );
    const current = await (
      await request.get(`http://localhost:4100/api/campaigns/${id}`)
    ).json();
    await request.delete(`http://localhost:4100/api/campaigns/${id}`, {
      headers: { "X-ContextPilot-Client": "1" },
      data: { version: current.campaign.version, confirmed: true },
    });
  }
});
