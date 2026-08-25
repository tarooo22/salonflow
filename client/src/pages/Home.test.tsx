import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");

describe("home final conversion CTA", () => {
  it("uses a solid high-contrast surface rather than the inherited primary gradient", () => {
    expect(source).toContain('variant="publicSecondary"');
    expect(source).toContain('!bg-white');
    expect(source).toContain('!text-[#21072d]');
    expect(source).toContain("რეგისტრაციის დაწყება");
    expect(source).toContain("ხელით დამტკიცების შემდეგ");
  });

  it("uses a booking-first public CTA and avoids fabricated hero business proof", () => {
    expect(source).toContain('href="/book"');
    expect(source).toContain("ონლაინ ჩაწერის რეალური გზა");
    expect(source).toContain("არ აჩვენებს გამოგონილ თავისუფალ დროს");
  });

  it("presents distinct salon owner and client paths using the shared Salon House system", () => {
    expect(source).toContain("იპოვე სალონი");
    expect(source).toContain("ვმართავ სალონს");
    expect(source).toContain("კლიენტისთვის");
    expect(source).toContain("სალონისთვის");
    expect(source).toContain("ხელით დამტკიცება");
    expect(source).toContain("სალონის პირველი სვლა");
    expect(source).toContain("sf-salon-panel");
    expect(source).toContain("sf-salon-flowline");
  });

  it("keeps the approved-listing Marketplace discovery entry without replacing the existing hero", () => {
    expect(source).toContain("MarketplaceHighlights");
    expect(source).toContain("SalonFlowHeroScene");
  });

  it("explains that salon users do not need special technical knowledge", () => {
    expect(source).toContain("მჭირდება თუ არა სპეციალური ტექნიკური ცოდნა SalonFlow-ის გამოსაყენებლად?");
    expect(source).toContain("საჭიროა მხოლოდ ადგილობრივი ელფოსტა და პაროლი");
    expect(source).not.toContain("არის თუ არა საჭირო Manus ანგარიში?");
  });
});
