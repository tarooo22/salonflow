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

  it("routes platform admins away from trial onboarding while preserving the default trial destination", () => {
    expect(source).toContain('user.role === "admin"');
    expect(source).toContain('destination === "/app/trial-status"');
    expect(source).toContain('"/app/trial-admin"');
    expect(source).toContain('const returnTo = useMemo(getReturnTo, []);');
  });
});
