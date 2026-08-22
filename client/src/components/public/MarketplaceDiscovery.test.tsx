import { describe, expect, it } from "vitest";
import { marketplacePromotionLabel } from "./MarketplaceDiscovery";

describe("Marketplace discovery disclosure", () => {
  it("uses explicit promoted-placement labels rather than pretending to rank salons organically", () => {
    expect(marketplacePromotionLabel("VIP")).toBe("VIP / რეკლამა");
    expect(marketplacePromotionLabel("RECOMMENDED")).toBe("რეკომენდებული");
    expect(marketplacePromotionLabel(undefined)).toBeNull();
  });
});
