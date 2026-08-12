import { describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  db: null as unknown,
  requireOrganizationAction: vi.fn(),
  nanoid: vi.fn(() => "generated_finance_entry"),
}));

vi.mock("../db", () => ({
  requireDb: vi.fn(async () => mocked.db),
}));

vi.mock("../access", () => ({
  requireOrganizationAction: mocked.requireOrganizationAction,
  requireOrganizationRole: vi.fn(),
}));

vi.mock("nanoid", () => ({ nanoid: mocked.nanoid }));

import { financeRouter } from "./finance";

const ids = {
  organizationId: "organization_001",
  locationId: "location_0001",
  appointmentId: "appointment_001",
  appointmentServiceId: "service_line_01",
  ruleId: "rule_00000001",
};

const user = {
  id: 7,
  openId: "finance-test-user",
  email: "owner@example.com",
  name: "Finance Test Owner",
  loginMethod: "manus",
  role: "user" as const,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  lastSignedIn: new Date("2026-01-01T00:00:00.000Z"),
};

function caller() {
  return financeRouter.createCaller({ user } as never);
}

function createLocationDb(locationRows: unknown[]) {
  const values = vi.fn(async () => undefined);
  return {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({ limit: vi.fn(async () => locationRows) })),
      })),
    })),
    insert: vi.fn(() => ({ values })),
    values,
  };
}

function createCommissionDb(queryRows: unknown[][]) {
  const values = vi.fn(async () => undefined);
  const tx = {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => {
          const rows = queryRows.shift() ?? [];
          return {
            limit: vi.fn(async () => rows),
            then: <TResult1 = unknown[], TResult2 = never>(
              onfulfilled?: ((value: unknown[]) => TResult1 | PromiseLike<TResult1>) | null,
              onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
            ) => Promise.resolve(rows).then(onfulfilled, onrejected),
          };
        }),
      })),
    })),
    insert: vi.fn(() => ({ values })),
  };
  return {
    transaction: vi.fn(async (callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx)),
    tx,
    values,
  };
}

describe("finance router mutations", () => {
  it("records an integer-tetri expense only when the location belongs to the organization", async () => {
    const db = createLocationDb([{ id: ids.locationId }]);
    mocked.db = db;
    mocked.requireOrganizationAction.mockResolvedValue({ role: "OWNER" });

    await expect(caller().createExpense({
      organizationId: ids.organizationId,
      locationId: ids.locationId,
      category: "მარაგები",
      amountTetri: 12_500,
      expenseDate: new Date("2026-08-13T00:00:00.000Z"),
      description: "თმის მოვლის პროდუქცია",
    })).resolves.toEqual({ id: "generated_finance_entry" });

    expect(db.values).toHaveBeenCalledWith(expect.objectContaining({
      organizationId: ids.organizationId,
      locationId: ids.locationId,
      amountTetri: 12_500,
      createdByUserId: user.id,
      status: "ACTIVE",
    }));
  });

  it("rejects a cross-organization expense location before inserting anything", async () => {
    const db = createLocationDb([]);
    mocked.db = db;
    mocked.requireOrganizationAction.mockResolvedValue({ role: "OWNER" });

    await expect(caller().createExpense({
      organizationId: ids.organizationId,
      locationId: ids.locationId,
      category: "ქირა",
      amountTetri: 80_000,
      expenseDate: new Date("2026-08-13T00:00:00.000Z"),
    })).rejects.toThrow("Active location not found in this organization");

    expect(db.insert).not.toHaveBeenCalled();
  });

  it("rejects a second commission for the same appointment-service line", async () => {
    const db = createCommissionDb([
      [{ id: ids.appointmentId, locationId: ids.locationId, discountTetri: 0 }],
      [{ id: ids.appointmentServiceId, staffProfileId: "staff_profile_1", serviceId: "service_000001", priceTetriSnapshot: 10_000 }],
      [{ id: ids.ruleId, organizationId: ids.organizationId, status: "ACTIVE", type: "PERCENTAGE", valueTetri: 1_000, locationId: null, staffProfileId: null, serviceId: null }],
      [{ id: "existing_entry" }],
    ]);
    mocked.db = db;
    mocked.requireOrganizationAction.mockResolvedValue({ role: "OWNER" });

    await expect(caller().createCommissionEntry(ids)).rejects.toThrow(
      "A commission entry already exists for this appointment service",
    );

    expect(db.tx.insert).not.toHaveBeenCalled();
  });

  it("rejects a commission rule whose scoped location does not match the appointment", async () => {
    const db = createCommissionDb([
      [{ id: ids.appointmentId, locationId: ids.locationId, discountTetri: 0 }],
      [{ id: ids.appointmentServiceId, staffProfileId: "staff_profile_1", serviceId: "service_000001", priceTetriSnapshot: 10_000 }],
      [{ id: ids.ruleId, organizationId: ids.organizationId, status: "ACTIVE", type: "PERCENTAGE", valueTetri: 1_000, locationId: "other_location", staffProfileId: null, serviceId: null }],
    ]);
    mocked.db = db;
    mocked.requireOrganizationAction.mockResolvedValue({ role: "OWNER" });

    await expect(caller().createCommissionEntry(ids)).rejects.toThrow(
      "Commission rule does not apply to this appointment service",
    );

    expect(db.tx.insert).not.toHaveBeenCalled();
  });
});
