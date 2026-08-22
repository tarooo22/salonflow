import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./LocalAuth.tsx", import.meta.url), "utf8");

describe("local auth Salon House shell", () => {
  it("retains local credential boundaries while using shared Salon House presentation", () => {
    expect(source).toContain("ადგილობრივი ელფოსტა და პაროლი");
    expect(source).toContain("sf-salon-panel");
    expect(source).toContain("sf-salon-eyebrow");
    expect(source).not.toContain("Manus OAuth");
  });
});
