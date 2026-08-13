import { describe, expect, it } from "vitest";
import { createDemoPreview } from "./demoPreview";

describe("development demo preview dataset", () => {
  it("is deterministic and meets the documented preview-size minimums without persisted data", () => {
    const demo = createDemoPreview();
    expect(demo.locations).toHaveLength(2);
    expect(demo.staff).toHaveLength(4);
    expect(demo.clients).toHaveLength(12);
    expect(demo.services).toHaveLength(12);
    expect(demo.appointments).toHaveLength(18);
    expect(demo.payments).toBeGreaterThan(0);
    expect(demo.commissions).toBeGreaterThan(0);
    expect(demo.expenses).toBeGreaterThan(0);
    expect(createDemoPreview()).toEqual(demo);
  });
});
