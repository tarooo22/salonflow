import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/trpc", () => ({ trpc: {} }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { canReceivePayment, tetriToGelInput } from "./ReceivePaymentDialog";
import { gelInputToTetri } from "@shared/money";

describe("ReceivePaymentDialog helpers", () => {
  it("prefills the GEL field from integer tetri and round-trips through gelInputToTetri", () => {
    for (const tetri of [1, 5, 99, 100, 7_500, 12_345]) expect(gelInputToTetri(tetri ? tetriToGelInput(tetri) : "0")).toBe(tetri);
    expect(tetriToGelInput(7_505)).toBe("75.05");
  });

  it("offers the action only to front-desk roles on billable visits with a balance", () => {
    for (const role of ["OWNER", "MANAGER", "RECEPTIONIST"]) expect(canReceivePayment(role, "COMPLETED", 100)).toBe(true);
    expect(canReceivePayment("STAFF", "COMPLETED", 100)).toBe(false);
    expect(canReceivePayment(undefined, "COMPLETED", 100)).toBe(false);
    expect(canReceivePayment("OWNER", "CANCELLED", 100)).toBe(false);
    expect(canReceivePayment("OWNER", "NO_SHOW", 100)).toBe(false);
    expect(canReceivePayment("OWNER", "COMPLETED", 0)).toBe(false);
  });
});
