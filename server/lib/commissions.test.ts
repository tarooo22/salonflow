import { describe, expect, it } from "vitest";
import { calculateCommissionTetri, commissionRuleApplies, splitDiscountAcrossServices } from "./commissions";

describe("commission calculation", () => {
  it("calculates fixed and percentage commissions in integer tetri", () => {
    expect(calculateCommissionTetri(12_500, { type: "PERCENTAGE", valueTetri: 2_000 })).toBe(2_500);
    expect(calculateCommissionTetri(12_500, { type: "FIXED", valueTetri: 3_000 })).toBe(3_000);
    expect(calculateCommissionTetri(1_000, { type: "FIXED", valueTetri: 3_000 })).toBe(1_000);
  });

  it("splits a discount across service snapshots without floating-point values", () => {
    const allocations = splitDiscountAcrossServices([10_000, 5_000, 5_000], 3_001);
    expect(allocations.reduce((sum, value) => sum + value, 0)).toBe(3_001);
    expect(allocations).toEqual([1_500, 750, 751]);
  });

  it("accepts global rules but rejects any mismatched scoped rule", () => {
    const target = { locationId: "location_A", staffProfileId: "staff_A", serviceId: "service_A" };
    expect(commissionRuleApplies({ locationId: null, staffProfileId: null, serviceId: null }, target)).toBe(true);
    expect(commissionRuleApplies({ locationId: "location_B", staffProfileId: null, serviceId: null }, target)).toBe(false);
    expect(commissionRuleApplies({ locationId: "location_A", staffProfileId: "staff_A", serviceId: "service_B" }, target)).toBe(false);
  });
});
