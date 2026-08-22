import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");

describe("home final conversion CTA", () => {
  it("uses a solid high-contrast surface rather than the inherited primary gradient", () => {
    expect(source).toContain('variant="publicSecondary"');
    expect(source).toContain('!bg-white');
    expect(source).toContain('!text-[#21072d]');
    expect(source).toContain("დაიწყე უფასოდ");
  });

  it("uses a booking-first public CTA and avoids fabricated hero business proof", () => {
    expect(source).toContain('href="/book"');
    expect(source).toContain("ონლაინ ჩაწერის რეალური გზა");
    expect(source).toContain("არ აჩვენებს გამოგონილ თავისუფალ დროს");
  });
});
