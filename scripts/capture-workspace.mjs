import { chromium } from "@playwright/test";
const browser = await chromium.launch({ channel: "chromium" });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  await page.goto("http://localhost:5173");
  await page.getByRole("heading", { name: "Your campaigns" }).waitFor();
  await page.getByText("Loading campaigns…").waitFor({ state: "hidden" });
  await page.screenshot({
    path: "docs/screenshots/personal-workspace.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.goto("http://localhost:5173/settings");
  await page.getByRole("heading", { name: "OpenAI connection" }).waitFor();
  await page.getByText("Checking configuration…").waitFor({ state: "hidden" });
  await page.screenshot({
    path: "docs/screenshots/personal-settings.png",
    fullPage: true,
    animations: "disabled",
  });
  console.log(
    "Captured the actual personal workspace and settings; no campaigns or preferences were changed.",
  );
} finally {
  await browser.close();
}
