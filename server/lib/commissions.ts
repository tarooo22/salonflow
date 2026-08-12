export type CommissionRuleInput = {
  type: "PERCENTAGE" | "FIXED";
  valueTetri: number;
};

export function calculateCommissionTetri(serviceNetTetri: number, rule: CommissionRuleInput | null | undefined) {
  if (!rule || serviceNetTetri <= 0 || rule.valueTetri <= 0) return 0;
  if (rule.type === "FIXED") return Math.min(serviceNetTetri, rule.valueTetri);
  return Math.floor((serviceNetTetri * rule.valueTetri) / 10_000);
}

export function splitDiscountAcrossServices(
  servicePricesTetri: number[],
  discountTetri: number,
) {
  const grossTetri = servicePricesTetri.reduce((sum, price) => sum + price, 0);
  if (grossTetri <= 0 || discountTetri <= 0) return servicePricesTetri.map(() => 0);
  let remainingDiscount = Math.min(discountTetri, grossTetri);
  return servicePricesTetri.map((price, index) => {
    if (index === servicePricesTetri.length - 1) return remainingDiscount;
    const portion = Math.floor((price * discountTetri) / grossTetri);
    const applied = Math.min(price, remainingDiscount, portion);
    remainingDiscount -= applied;
    return applied;
  });
}

export function commissionRuleApplies(
  rule: { locationId: string | null; staffProfileId: string | null; serviceId: string | null },
  target: { locationId: string; staffProfileId: string; serviceId: string },
) {
  return (!rule.locationId || rule.locationId === target.locationId) &&
    (!rule.staffProfileId || rule.staffProfileId === target.staffProfileId) &&
    (!rule.serviceId || rule.serviceId === target.serviceId);
}
