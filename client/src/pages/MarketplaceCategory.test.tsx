import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { categoryLandingHeading, categoryLandingLede, categoryLandingPath, landingKind } from "@shared/categoryLanding";
import { marketplaceCategoryHref } from "@/components/public/MarketplaceDiscovery";

const source = readFileSync(new URL("./MarketplaceCategory.tsx", import.meta.url), "utf8");
const app = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");
const home = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");
const directory = readFileSync(new URL("./MarketplaceDirectory.tsx", import.meta.url), "utf8");

describe("category landing copy", () => {
  it("builds the H1 with the vertical's own wording", () => {
    expect(categoryLandingHeading("hair", "თმა")).toBe("თმა — სალონები და ონლაინ ჩაწერა");
    expect(categoryLandingHeading("cosmetology", "კოსმეტოლოგია")).toBe("კოსმეტოლოგია — ესთეტიკის ცენტრები და ონლაინ ჩაწერა");
    expect(categoryLandingHeading("aesthetic-laser", "ლაზერული პროცედურები")).toContain("ესთეტიკის ცენტრები");
    expect(categoryLandingHeading("dental-implants", "იმპლანტაცია")).toBe("იმპლანტაცია — სტომატოლოგიური კლინიკები და ონლაინ ჩაწერა");
  });

  it("keeps the vertical rule in step with the client's verticals", () => {
    expect(landingKind("dental-kids")).toBe("dental");
    expect(landingKind("barber")).toBe("beauty");
    expect(categoryLandingLede("dental-kids", "ბავშვთა სტომატოლოგია")).toContain("კლინიკა");
    expect(categoryLandingPath("hair")).toBe("/salons/c/hair");
    expect(marketplaceCategoryHref("brows-lashes")).toBe("/salons/c/brows-lashes");
  });
});

describe("category landing page wiring", () => {
  it("is routed, reads real listings by category and offers the explainer, other categories and an empty state", () => {
    expect(app).toContain('path={"/salons/c/:slug"}');
    expect(source).toContain("trpc.marketplace.directory.useQuery({ limit, offset: 0, categorySlug: slug }");
    expect(source).toContain("<HowItWorks ");
    expect(source).toContain('howTitle: "როგორ ჩავეწერო ონლაინ"');
    expect(source).toContain('others: "სხვა კატეგორიები"');
    expect(source).toContain('href="/salons"');
    expect(source).toContain("noindex,nofollow");
    expect(source).not.toContain("SalonFlow");
  });

  it("Home tiles and /salons category chips link to the landing page while ?category= keeps working", () => {
    expect(home).toContain("marketplaceCategoryHref(category.slug)");
    expect(directory).toContain("marketplaceCategoryHref(nextCategory)");
    expect(directory).toContain("marketplaceDiscoveryFilters(");
  });
});
