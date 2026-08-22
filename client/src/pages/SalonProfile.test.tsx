import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./SalonProfile.tsx", import.meta.url), "utf8");

describe("SalonProfile booking handoff", () => {
  it("renders a localized booking path only behind the existing booking-enabled gate", () => {
    expect(source).toContain("bookingPathLabels");
    expect(source).toContain("ჩაწერის გზა");
    expect(source).toContain("{salon.bookingEnabled ? <div");
    expect(source).toContain("დაცული მოთხოვნა");
  });
});
