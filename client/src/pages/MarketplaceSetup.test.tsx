import { describe, expect, it } from "vitest";
import { marketplaceListingStatusLabel } from "./MarketplaceSetup";

describe("Marketplace setup presentation", () => {
  it("renders listing lifecycle labels in Georgian without suggesting automatic approval", () => {
    expect(marketplaceListingStatusLabel("DRAFT")).toBe("მოსამზადებელია");
    expect(marketplaceListingStatusLabel("SUBMITTED")).toBe("განხილვაზეა");
    expect(marketplaceListingStatusLabel("APPROVED")).toBe("საჯაროა");
    expect(marketplaceListingStatusLabel("REJECTED")).toBe("დასაზუსტებელია");
  });
});
