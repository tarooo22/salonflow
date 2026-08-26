import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const helper = readFileSync(new URL("./PublicMeta.tsx", import.meta.url), "utf8");
const home = readFileSync(new URL("../../pages/Home.tsx", import.meta.url), "utf8");
const directory = readFileSync(new URL("../../pages/MarketplaceDirectory.tsx", import.meta.url), "utf8");
const partner = readFileSync(new URL("../../pages/PartnerLanding.tsx", import.meta.url), "utf8");

describe("public route metadata", () => {
  it("updates only title, description, Open Graph summary and a canonical URL", () => {
    expect(helper).toContain('upsertMeta("name", "description"');
    expect(helper).toContain('upsertMeta("property", "og:title"');
    expect(helper).toContain('link[rel="canonical"]');
    expect(helper).not.toContain("billingCode");
  });

  it("assigns route-specific public metadata to Home, Directory and Partner routes", () => {
    expect(home).toContain('canonicalPath: "/"');
    expect(directory).toContain('canonicalPath: "/salons"');
    expect(partner).toContain('canonicalPath: "/partner"');
  });
});
