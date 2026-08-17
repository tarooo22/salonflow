import { describe, expect, it } from "vitest";
import { renderPublicSalonProfileHead, renderPublicSalonProfileSnapshot } from "./publicProfileSeo";

const profile = {
  salon: { organizationName: "სილამაზის ჯგუფი", publicSlug: "vake-salon", name: "ვაკე სალონი", address: "თბილისი", phone: null, email: null, publicDescription: "<strong>კეთილი</strong> მოვლა", bookingEnabled: true, coverImageUrl: "/manus-storage/salons/cover.webp", coverImageAltKa: "ინტერიერი" },
  services: [{ id: "service_01", nameKa: "თმის შეჭრა", description: null, durationMinutes: 60, priceTetri: 4_000, isFromPrice: false, categoryNameKa: "თმა" }],
  team: [],
  feed: [],
  gallery: [],
};

describe("public salon profile SEO snapshot", () => {
  it("writes crawler-visible content and absolute share metadata without trusting stored HTML", () => {
    const origin = "https://salonflow.example";
    const head = renderPublicSalonProfileHead(profile, origin);
    const html = renderPublicSalonProfileSnapshot(profile, origin);
    expect(head).toContain('<link rel="canonical" href="https://salonflow.example/salon/vake-salon" />');
    expect(head).toContain('https://salonflow.example/manus-storage/salons/cover.webp');
    expect(html).toContain("ვაკე სალონი");
    expect(html).toContain("თმის შეჭრა");
    expect(html).toContain("&lt;strong&gt;კეთილი&lt;/strong&gt; მოვლა");
    expect(html).not.toContain("<strong>კეთილი</strong>");
  });
});
