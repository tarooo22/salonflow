import { describe, expect, it } from "vitest";
import { clientTerms, verticalName } from "./verticalTerms";

describe("verticalTerms", () => {
  it("uses patients for dental clinics only", () => {
    expect(clientTerms("DENTAL").plural).toBe("პაციენტები");
    expect(clientTerms("SALON").plural).toBe("კლიენტები");
    expect(clientTerms("AESTHETICS").singular).toBe("კლიენტი");
    expect(clientTerms(undefined).genitive).toBe("კლიენტის");
  });
  it("names verticals, defaulting to salon", () => {
    expect(verticalName("DENTAL")).toBe("სტომატოლოგიური კლინიკა");
    expect(verticalName(undefined)).toBe("სალონი");
  });
});
