import { describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  db: null as unknown,
  requireOrganizationAction: vi.fn(),
  requireOrganizationRole: vi.fn(),
  nanoid: vi.fn(() => "payment_generated_00001"),
}));

vi.mock("../db", () => ({ requireDb: vi.fn(async () => mocked.db) }));
vi.mock("../access", () => ({
  requireOrganizationAction: mocked.requireOrganizationAction,
  requireOrganizationRole: mocked.requireOrganizationRole,
}));
vi.mock("nanoid", () => ({ nanoid: mocked.nanoid }));

import { paymentsRouter } from "./payments";

const user = {
  id: 41,
  openId: "payment-operator",
  email: "owner@example.com",
  name: "Payment Operator",
  loginMethod: "manus",
  role: "user" as const,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  lastSignedIn: new Date("2026-01-01T00:00:00.000Z"),
};

const input = {
  organizationId: "organization_00001",
  appointmentId: "appointment_000001",
  amountTetri: 8_000,
  refundedTetri: 1_000,
  method: "CARD_TERMINAL" as const,
  status: "PARTIALLY_REFUNDED" as const,
};

function createPaymentDb(appointmentRows: unknown[], paymentRows: unknown[]) {
  const values = vi.fn(async () => undefined);
  let selectCall = 0;
  return {
    select: vi.fn(() => {
      selectCall += 1;
      if (selectCall === 1) {
        return { from: () => ({ where: () => ({ limit: vi.fn(async () => appointmentRows) }) }) };
      }
      return { from: () => ({ where: vi.fn(async () => paymentRows) }) };
    }),
    insert: vi.fn(() => ({ values })),
    values,
  };
}

describe("payments.record", () => {
  it("records an integer-tetri payment and returns the server-derived balance after a partial refund", async () => {
    const db = createPaymentDb(
      [{ id: input.appointmentId, totalTetri: 10_000 }],
      [{ amountTetri: 8_000, refundedTetri: 1_000, status: "PARTIALLY_REFUNDED" }],
    );
    mocked.db = db;
    mocked.requireOrganizationAction.mockResolvedValue({ role: "OWNER" });

    await expect(paymentsRouter.createCaller({ user } as never).record(input)).resolves.toEqual({
      id: "payment_generated_00001",
      balance: { collectedTetri: 7_000, balanceTetri: 3_000, overpaymentTetri: 0 },
    });
    expect(mocked.requireOrganizationAction).toHaveBeenCalledWith(user, input.organizationId, "finance:manage");
    expect(db.values).toHaveBeenCalledWith(expect.objectContaining({
      id: "payment_generated_00001",
      appointmentId: input.appointmentId,
      amountTetri: 8_000,
      refundedTetri: 1_000,
      collectedByUserId: user.id,
    }));
  });

  it("rejects an appointment outside the organization scope before recording a payment", async () => {
    const db = createPaymentDb([], []);
    mocked.db = db;
    mocked.requireOrganizationAction.mockResolvedValue({ role: "OWNER" });

    await expect(paymentsRouter.createCaller({ user } as never).record(input)).rejects.toThrow("Appointment not found");
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("rejects a refund that exceeds the original payment before querying or writing financial records", async () => {
    mocked.requireOrganizationAction.mockResolvedValue({ role: "OWNER" });
    const db = createPaymentDb([], []);
    mocked.db = db;

    await expect(paymentsRouter.createCaller({ user } as never).record({
      ...input,
      refundedTetri: 8_001,
    })).rejects.toThrow("Refunded amount cannot exceed the payment amount");
    expect(db.select).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });
});
