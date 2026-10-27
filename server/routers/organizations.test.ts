import { describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  db: null as unknown,
  nanoid: vi.fn(),
  requireApprovedTrialForWorkspaceCreation: vi.fn(async () => ({ id: "trial_workspace_001" })),
  claimTrialForOrganization: vi.fn(async () => undefined),
  requireOrganizationRole: vi.fn(async () => ({ id: "membership_owner_01", role: "OWNER" })),
}));

vi.mock("../db", () => ({
  requireDb: vi.fn(async () => mocked.db),
}));

vi.mock("nanoid", () => ({ nanoid: mocked.nanoid }));
vi.mock("../lib/trialAccess", () => ({ requireApprovedTrialForWorkspaceCreation: mocked.requireApprovedTrialForWorkspaceCreation, claimTrialForOrganization: mocked.claimTrialForOrganization }));
vi.mock("../access", () => ({ requireOrganizationRole: mocked.requireOrganizationRole }));

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
  const where = vi.fn(async () => undefined);
  const set = vi.fn(() => ({ where }));
  const update = vi.fn(() => ({ set }));
  const transaction = vi.fn(async (callback: (tx: { insert: () => { values: typeof values }; update: typeof update }) => Promise<void>) => {
    await callback({ insert: () => ({ values }), update });
  });
  return { transaction, values, update };
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
    expect(mocked.requireApprovedTrialForWorkspaceCreation).toHaveBeenCalledWith(user.id);
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
    expect(mocked.claimTrialForOrganization).toHaveBeenCalledWith(expect.anything(), "trial_workspace_001", expect.any(String));
    expect(db.values).toHaveBeenNthCalledWith(4, expect.objectContaining({
      trialRequestId: "trial_workspace_001",
      eventType: "WORKSPACE_CREATED_LEGACY",
      actorUserId: user.id,
      metadata: { organizationId: "organization_setup_001", locationId: "location_setup_00001" },
    }));
  });
});

describe("organizations.updateLocationSettings", () => {
  it("requires OWNER role and constrains the update to the selected organization and active location", async () => {
    const where = vi.fn(async () => [{ affectedRows: 1 }]);
    const set = vi.fn(() => ({ where }));
    const update = vi.fn(() => ({ set }));
    mocked.db = { update };

    const result = await organizationRouter.createCaller({ user } as never).updateLocationSettings({
      organizationId: "organization_0001",
      locationId: "location_00000001",
      bookingEnabled: false,
      minimumNoticeMinutes: 180,
      maximumAdvanceDays: 45,
    });

    expect(result).toEqual({ success: true });
    expect(mocked.requireOrganizationRole).toHaveBeenCalledWith(user, "organization_0001", ["OWNER"]);
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ bookingEnabled: false, minimumNoticeMinutes: 180, maximumAdvanceDays: 45 }));
    expect(where).toHaveBeenCalledOnce();
  });
});

describe("organizations.setVertical", () => {
  it("is OWNER-only, changes the vertical and writes an audit entry", async () => {
    const where = vi.fn(async () => undefined);
    const set = vi.fn(() => ({ where }));
    const values = vi.fn(async () => undefined);
    const limit = vi.fn(async () => [{ vertical: "SALON" }]);
    mocked.nanoid.mockReturnValue("audit_vertical_0000001");
    mocked.db = {
      select: () => ({ from: () => ({ where: () => ({ limit }) }) }),
      transaction: async (callback: (tx: unknown) => Promise<void>) => callback({ update: () => ({ set }), insert: () => ({ values }) }),
    };
    await expect(organizationRouter.createCaller({ user } as never).setVertical({ organizationId: "organization_0001", vertical: "DENTAL" })).resolves.toEqual({ vertical: "DENTAL" });
    expect(mocked.requireOrganizationRole).toHaveBeenCalledWith(user, "organization_0001", ["OWNER"]);
    expect(set).toHaveBeenCalledWith({ vertical: "DENTAL" });
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ action: "ORGANIZATION_VERTICAL_CHANGED", beforeState: { vertical: "SALON" }, afterState: { vertical: "DENTAL" } }));
  });

  it("rejects an unknown vertical", async () => {
    await expect(organizationRouter.createCaller({ user } as never).setVertical({ organizationId: "organization_0001", vertical: "SPA" as never })).rejects.toThrow();
  });
});

describe("organizations.listLocationOpeningHours", () => {
  it("is open to every workspace role and scopes the rows to the organization's own location", async () => {
    const rows = [{ weekday: 0, opensAt: "10:00:00", closesAt: "20:00:00" }];
    const where = vi.fn(() => ({ orderBy: async () => rows }));
    mocked.db = { select: () => ({ from: () => ({ innerJoin: () => ({ where }) }) }) };

    const result = await organizationRouter.createCaller({ user } as never).listLocationOpeningHours({ organizationId: "organization_0001", locationId: "location_00000001" });

    expect(result).toEqual(rows);
    expect(mocked.requireOrganizationRole).toHaveBeenCalledWith(user, "organization_0001", ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    expect(where).toHaveBeenCalledOnce();
  });
});

describe("organizations.setLocationOpeningHours", () => {
  const days = [
    { weekday: 0, open: true, startLocalTime: "10:00", endLocalTime: "19:30" },
    { weekday: 1, open: true, startLocalTime: "10:00", endLocalTime: "19:30" },
    { weekday: 5, open: false, startLocalTime: "10:00", endLocalTime: "18:00" },
  ];
  const input = { organizationId: "organization_0001", locationId: "location_00000001", days };

  function openingHoursDb(locationRows: unknown[]) {
    const calls: string[] = [];
    const insertedValues: unknown[] = [];
    const tx = {
      select: (columns: Record<string, unknown>) => ({ from: () => ({
        where: () => "id" in columns
          ? { limit: () => ({ for: async () => { calls.push("lock"); return locationRows; } }) }
          : { orderBy: async () => { calls.push("read"); return [{ weekday: 2, opensAt: "09:00:00", closesAt: "17:00:00" }]; } },
      }) }),
      delete: () => ({ where: async () => { calls.push("delete"); } }),
      insert: () => ({ values: async (rows: unknown) => { calls.push("insert"); insertedValues.push(rows); } }),
    };
    const transaction = vi.fn(async (callback: (tx: unknown) => Promise<void>) => callback(tx));
    return { db: { transaction }, calls, insertedValues, transaction };
  }

  it("is OWNER/MANAGER only and replaces the rows plus an audit entry in one transaction", async () => {
    mocked.requireOrganizationRole.mockClear();
    mocked.nanoid.mockReturnValue("generated_id_0000000001");
    const harness = openingHoursDb([{ id: "location_00000001" }]);
    mocked.db = harness.db;

    await expect(organizationRouter.createCaller({ user } as never).setLocationOpeningHours(input)).resolves.toEqual({ success: true, openDays: 2 });

    expect(mocked.requireOrganizationRole).toHaveBeenCalledWith(user, "organization_0001", ["OWNER", "MANAGER"]);
    expect(harness.transaction).toHaveBeenCalledTimes(1);
    expect(harness.calls).toEqual(["lock", "read", "delete", "insert", "insert"]);
    expect(harness.insertedValues[0]).toEqual([
      expect.objectContaining({ locationId: "location_00000001", weekday: 0, startLocalTime: "10:00:00", endLocalTime: "19:30:00" }),
      expect.objectContaining({ locationId: "location_00000001", weekday: 1, startLocalTime: "10:00:00", endLocalTime: "19:30:00" }),
    ]);
    expect(harness.insertedValues[1]).toEqual(expect.objectContaining({
      action: "LOCATION_OPENING_HOURS_CHANGED", entityType: "location", entityId: "location_00000001", organizationId: "organization_0001", actorUserId: user.id,
      beforeState: { days: [{ weekday: 2, opensAt: "09:00:00", closesAt: "17:00:00" }] },
      afterState: { days: [{ weekday: 0, opensAt: "10:00", closesAt: "19:30" }, { weekday: 1, opensAt: "10:00", closesAt: "19:30" }] },
    }));
  });

  it("rejects a caller outside the organization before touching the database", async () => {
    const harness = openingHoursDb([{ id: "location_00000001" }]);
    mocked.db = harness.db;
    mocked.requireOrganizationRole.mockRejectedValueOnce(new Error("FORBIDDEN"));
    await expect(organizationRouter.createCaller({ user } as never).setLocationOpeningHours(input)).rejects.toThrow("FORBIDDEN");
    expect(harness.transaction).not.toHaveBeenCalled();
  });

  it("does not write when the location is not an active location of the organization", async () => {
    const harness = openingHoursDb([]);
    mocked.db = harness.db;
    await expect(organizationRouter.createCaller({ user } as never).setLocationOpeningHours(input)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(harness.calls).toEqual(["lock"]);
  });

  it.each([
    ["duplicate weekdays", [days[0]!, days[0]!]],
    ["a weekday above 6", [{ ...days[0]!, weekday: 7 }]],
    ["an end before the start", [{ ...days[0]!, startLocalTime: "18:00", endLocalTime: "10:00" }]],
    ["an equal start and end", [{ ...days[0]!, endLocalTime: "10:00" }]],
    ["a malformed time", [{ ...days[0]!, startLocalTime: "9:00" }]],
    ["every day closed (an empty set would mean no limit)", [{ ...days[0]!, open: false }]],
    ["more than seven days", Array.from({ length: 8 }, (_, weekday) => ({ ...days[0]!, weekday }))],
  ])("rejects %s", async (_label, badDays) => {
    const harness = openingHoursDb([{ id: "location_00000001" }]);
    mocked.db = harness.db;
    await expect(organizationRouter.createCaller({ user } as never).setLocationOpeningHours({ ...input, days: badDays })).rejects.toThrow();
    expect(harness.transaction).not.toHaveBeenCalled();
  });

  it("ignores the times of a closed day", async () => {
    const harness = openingHoursDb([{ id: "location_00000001" }]);
    mocked.db = harness.db;
    await expect(organizationRouter.createCaller({ user } as never).setLocationOpeningHours({ ...input, days: [days[0]!, { weekday: 6, open: false, startLocalTime: "20:00", endLocalTime: "08:00" }] })).resolves.toEqual({ success: true, openDays: 1 });
  });
});
