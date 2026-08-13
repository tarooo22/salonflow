import { describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  db: null as unknown,
  nanoid: vi.fn(),
}));

vi.mock("../db", () => ({
  requireDb: vi.fn(async () => mocked.db),
}));

vi.mock("nanoid", () => ({ nanoid: mocked.nanoid }));

import { organizationRouter } from "./organizations";

const user = {
  id: 17,
  openId: "workspace-setup-owner",
  email: "owner@example.com",
  name: "Workspace Setup Owner",
  loginMethod: "manus",
  role: "user" as const,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  lastSignedIn: new Date("2026-01-01T00:00:00.000Z"),
};

function createWorkspaceDb() {
  const values = vi.fn(async () => undefined);
  const transaction = vi.fn(async (callback: (tx: { insert: () => { values: typeof values } }) => Promise<void>) => {
    await callback({ insert: () => ({ values }) });
  });
  return { transaction, values };
}

describe("organizations.createWorkspace", () => {
  it("creates the organization, owner membership, and first location in one transaction", async () => {
    const db = createWorkspaceDb();
    mocked.db = db;
    mocked.nanoid.mockReturnValueOnce("organization_setup_001").mockReturnValueOnce("membership_setup_0001").mockReturnValueOnce("location_setup_00001");

    const result = await organizationRouter.createCaller({ user } as never).createWorkspace({
      organization: {
        name: "Lela Beauty Studio",
        slug: "lela-beauty",
        timezone: "Asia/Tbilisi",
        contactPhone: "+995 555 12 34 56",
        contactEmail: "OWNER@EXAMPLE.COM ",
      },
      location: {
        name: "ვაკის ფილიალი",
        publicSlug: "lela-vake",
        timezone: "Asia/Tbilisi",
        address: "თბილისი, ჭავჭავაძის გამზირი 12",
        phone: "+995 555 12 34 56",
        email: "OWNER@EXAMPLE.COM ",
        bookingEnabled: true,
        slotIntervalMinutes: 15,
        minimumNoticeMinutes: 60,
        maximumAdvanceDays: 60,
        cancellationCutoffMinutes: 120,
      },
    });

    expect(result).toEqual({
      organizationId: "organization_setup_001",
      membershipId: "membership_setup_0001",
      locationId: "location_setup_00001",
    });
    expect(db.transaction).toHaveBeenCalledTimes(1);
    expect(db.values).toHaveBeenNthCalledWith(1, expect.objectContaining({
      id: "organization_setup_001",
      slug: "lela-beauty",
      defaultTimezone: "Asia/Tbilisi",
      contactEmail: "owner@example.com",
    }));
    expect(db.values).toHaveBeenNthCalledWith(2, expect.objectContaining({
      id: "membership_setup_0001",
      organizationId: "organization_setup_001",
      userId: user.id,
      role: "OWNER",
      status: "ACTIVE",
    }));
    expect(db.values).toHaveBeenNthCalledWith(3, expect.objectContaining({
      id: "location_setup_00001",
      organizationId: "organization_setup_001",
      publicSlug: "lela-vake",
      timezone: "Asia/Tbilisi",
      email: "owner@example.com",
    }));
  });
});
