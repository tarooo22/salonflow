import { describe, expect, it } from "vitest";
import { gelTextToTetri } from "./moneyInput";

describe("GEL text input conversion", () => {
  it("converts decimal and comma price input to integer tetri", () => {
    expect(gelTextToTetri("75")).toBe(7500);
    expect(gelTextToTetri("75.50")).toBe(7550);
    expect(gelTextToTetri("12,3")).toBe(1230);
  });

  it("rejects malformed or over-precise money input", () => {
    expect(gelTextToTetri("12.345")).toBeNull();
    expect(gelTextToTetri("₾75")).toBeNull();
  });
});
