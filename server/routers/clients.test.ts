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
