import { describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  db: null as unknown,
  nanoid: vi.fn(),
  requireOrganizationRole: vi.fn(),
}));

vi.mock("../db", () => ({
  requireDb: vi.fn(async () => mocked.db),
}));

vi.mock("../access", () => ({ requireOrganizationRole: mocked.requireOrganizationRole }));
vi.mock("nanoid", () => ({ nanoid: mocked.nanoid }));

import { clientsRouter } from "./clients";

const user = {
  id: 23,
  openId: "client-intake-user",
  email: "reception@example.com",
  name: "Client Intake Reception",
  loginMethod: "manus",
  role: "user" as const,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  lastSignedIn: new Date("2026-01-01T00:00:00.000Z"),
};

function createClientDb() {
  const values = vi.fn(async () => undefined);
  const transaction = vi.fn(async (callback: (tx: { insert: () => { values: typeof values } }) => Promise<void>) => {
    await callback({ insert: () => ({ values }) });
  });
  return { transaction, values };
}

describe("clients.create", () => {
  it("creates normalized client contact details and an immutable consent record set", async () => {
    const db = createClientDb();
    mocked.db = db;
    mocked.requireOrganizationRole.mockResolvedValue({ role: "RECEPTIONIST" });
    mocked.nanoid.mockReturnValueOnce("client_intake_000001").mockReturnValueOnce("consent_booking_0001").mockReturnValueOnce("consent_sms_0000001").mockReturnValueOnce("consent_email_00001");

    await expect(clientsRouter.createCaller({ user } as never).create({
      organizationId: "organization_001",
      firstName: "ნინო",
      phone: "+995 555 12 34 56",
      email: "NINO@EXAMPLE.COM ",
      bookingTermsConsent: true,
      marketingSmsConsent: false,
      marketingEmailConsent: false,
    })).resolves.toEqual({ id: "client_intake_000001" });

    expect(db.values).toHaveBeenNthCalledWith(1, expect.objectContaining({
      id: "client_intake_000001",
      organizationId: "organization_001",
      normalizedPhone: "+995555123456",
      normalizedEmail: "nino@example.com",
      source: "INTERNAL",
    }));
    expect(db.values).toHaveBeenNthCalledWith(2, expect.arrayContaining([
      expect.objectContaining({ consentType: "BOOKING_TERMS", granted: true, source: "INTERNAL" }),
      expect.objectContaining({ consentType: "MARKETING_SMS", granted: false, source: "INTERNAL" }),
      expect.objectContaining({ consentType: "MARKETING_EMAIL", granted: false, source: "INTERNAL" }),
    ]));
  });

  it("rejects an internal client record without booking-terms consent", async () => {
    const db = createClientDb();
    mocked.db = db;
    mocked.requireOrganizationRole.mockResolvedValue({ role: "RECEPTIONIST" });

    await expect(clientsRouter.createCaller({ user } as never).create({
      organizationId: "organization_001",
      firstName: "თამარი",
      phone: "+995 555 98 76 54",
      bookingTermsConsent: false,
      marketingSmsConsent: false,
      marketingEmailConsent: false,
    })).rejects.toThrow("Booking terms consent is required");
    expect(db.transaction).not.toHaveBeenCalled();
  });
});

describe("clients.bookingHistory", () => {
  it("returns the selected client’s organization-scoped appointments with their service snapshots", async () => {
    const appointment = {
      id: "appointment_0001",
      organizationId: "organization_001",
      clientId: "client_history_001",
      startsAt: new Date("2026-08-13T09:00:00.000Z"),
      totalTetri: 7_500,
      status: "COMPLETED",
    };
    const service = { id: "appointment_service_01", appointmentId: appointment.id, serviceNameSnapshot: "თმის შეჭრა" };
    let selectCall = 0;
    const db = {
      select: vi.fn(() => {
        selectCall += 1;
        if (selectCall === 1) {
          return { from: () => ({ where: () => ({ orderBy: () => ({ limit: vi.fn(async () => [appointment]) }) }) }) };
        }
        return { from: () => ({ where: vi.fn(async () => [service]) }) };
      }),
    };
    mocked.db = db;
    mocked.requireOrganizationRole.mockResolvedValue({ role: "RECEPTIONIST" });

    await expect(clientsRouter.createCaller({ user } as never).bookingHistory({
      organizationId: "organization_001",
      clientId: "client_history_001",
      limit: 25,
    })).resolves.toEqual([{ appointment, services: [service] }]);
    expect(mocked.requireOrganizationRole).toHaveBeenCalledWith(user, "organization_001", ["OWNER", "MANAGER", "RECEPTIONIST"]);
  });
});

describe("clients.setConsent", () => {
  it("appends a withdrawal audit record only after confirming the client belongs to the organization", async () => {
    const values = vi.fn(async () => undefined);
    const db = {
      select: vi.fn(() => ({ from: () => ({ where: () => ({ limit: vi.fn(async () => [{ id: "client_history_001" }]) }) }) })),
      insert: vi.fn(() => ({ values })),
    };
    mocked.db = db;
    mocked.requireOrganizationRole.mockResolvedValue({ role: "RECEPTIONIST" });
    mocked.nanoid.mockReturnValueOnce("consent_withdrawal_1");

    await expect(clientsRouter.createCaller({ user } as never).setConsent({
      organizationId: "organization_001",
      clientId: "client_history_001",
      consentType: "MARKETING_EMAIL",
      granted: false,
    })).resolves.toEqual({ success: true });
    expect(values).toHaveBeenCalledWith(expect.objectContaining({
      id: "consent_withdrawal_1",
      clientId: "client_history_001",
      consentType: "MARKETING_EMAIL",
      granted: false,
      source: "INTERNAL",
      withdrawnAt: expect.any(Date),
    }));
  });
});

describe("clients.updateCare", () => {
  it("updates care notes only for the selected active client in the organization", async () => {
    const where = vi.fn(async () => [{ affectedRows: 1 }]);
    const set = vi.fn(() => ({ where }));
    const db = { update: vi.fn(() => ({ set })) };
    mocked.db = db;
    mocked.requireOrganizationRole.mockResolvedValue({ role: "RECEPTIONIST" });

    await expect(clientsRouter.createCaller({ user } as never).updateCare({
      organizationId: "organization_001",
      clientId: "client_history_001",
      notes: "კლიენტს ურჩევნია მშვიდი ვიზიტი",
      preferences: "დილის დრო",
      sensitivityNote: "თავის კანის მგრძნობელობა",
    })).resolves.toEqual({ success: true });

    expect(set).toHaveBeenCalledWith({ notes: "კლიენტს ურჩევნია მშვიდი ვიზიტი", preferences: "დილის დრო", sensitivityNote: "თავის კანის მგრძნობელობა" });
    expect(where).toHaveBeenCalledTimes(1);
  });
});

describe("clients.merge", () => {
  it("merges two active organization clients by reassigning appointments and client gallery sets before creating an audit record", async () => {
    const values = vi.fn(async () => undefined);
    const source = { id: "client_source_001", organizationId: "organization_001", status: "ACTIVE" };
    const target = { id: "client_target_001", organizationId: "organization_001", status: "ACTIVE" };
    const tx = {
      select: vi.fn(() => ({ from: () => ({ where: vi.fn(async () => [source, target]) }) })),
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(async () => undefined) })) })),
      insert: vi.fn(() => ({ values })),
    };
    const db = { transaction: vi.fn(async (callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx)) };
    mocked.db = db;
    mocked.requireOrganizationRole.mockResolvedValue({ role: "MANAGER" });
    mocked.nanoid.mockReturnValueOnce("client_merge_000001");

    await expect(clientsRouter.createCaller({ user } as never).merge({
      organizationId: "organization_001",
      sourceClientId: source.id,
      targetClientId: target.id,
      reason: "დუბლიკატი ჩანაწერი",
    })).resolves.toEqual({ id: "client_merge_000001" });
    expect(tx.update).toHaveBeenCalledTimes(3);
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ sourceClientId: source.id, targetClientId: target.id, mergedByUserId: user.id }));
  });
});
