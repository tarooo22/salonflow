import { describe, expect, it } from "vitest";
import { gelInputToTetri } from "../../shared/money";

describe("gelInputToTetri", () => {
  it("converts GEL input to whole tetri without floating-point storage", () => {
    expect(gelInputToTetri("50")).toBe(5_000);
    expect(gelInputToTetri("50.05")).toBe(5_005);
    expect(gelInputToTetri("50,5")).toBe(5_050);
  });

  it("rejects more than two fractional digits and non-numeric input", () => {
    expect(gelInputToTetri("50.005")).toBeNull();
    expect(gelInputToTetri("₾50")).toBeNull();
  });
});
