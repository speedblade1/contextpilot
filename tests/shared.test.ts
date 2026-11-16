import { it, expect } from "vitest";
import { missingFields, patchSchema } from "../packages/shared/src";
it("detects required fields without losing provided values", () => {
  expect(missingFields({ currency: "USD", budget: 500 })).toHaveLength(6);
  expect(patchSchema.parse({ budget: 500 })).toEqual({ budget: 500 });
});
