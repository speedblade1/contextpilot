// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { it, expect } from "vitest";
import { CampaignProgress } from "../apps/web/src/CampaignProgress";
it("reports validated completion accessibly", () => {
  render(<CampaignProgress draft={{ currency: "USD", budget: 500 }} />);
  expect(screen.getByRole("progressbar").getAttribute("value")).toBe("2");
  expect(screen.getByText("2 of 8 details ready")).toBeTruthy();
});
