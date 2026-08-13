import { describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  db: null as unknown,
  nanoid: vi.fn(),
  requireOrganizationRole: vi.fn(),
}));

vi.mock("../db", () => ({ requireDb: vi.fn(async () => mocked.db) }));
vi.mock("../access", () => ({ requireOrganizationRole: mocked.requireOrganizationRole }));
vi.mock("nanoid", () => ({ nanoid: mocked.nanoid }));

import { staffRouter } from "./staff";

const user = {
  id: 31,
  openId: "staff-profile-user",
  email: "owner@example.com",
  name: "Staff Profile Owner",
  loginMethod: "manus",
  role: "user" as const,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  lastSignedIn: new Date("2026-01-01T00:00:00.000Z"),
};

function createStaffDb(membershipRows: unknown[]) {
  const values = vi.fn(async () => undefined);
  const tx = { insert: () => ({ values }) };
  return {
    select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(async () => membershipRows) })) })) })),
    transaction: vi.fn(async (callback: (transaction: typeof tx) => Promise<void>) => callback(tx)),
    values,
  };
}

describe("staff.createProfile", () => {
  it("creates a profile and all selected location assignments for an active organization membership", async () => {
    const db = createStaffDb([{ id: "membership_0001", status: "ACTIVE" }]);
    mocked.db = db;
    mocked.requireOrganizationRole.mockResolvedValue({ role: "OWNER" });
    mocked.nanoid.mockReturnValueOnce("staff_profile_00001");

    await expect(staffRouter.createCaller({ user } as never).createProfile({
      organizationId: "organization_001",
      membershipId: "membership_0001",
      publicDisplayName: "ლელა ბერიძე",
      jobTitle: "თმის სტილისტი",
      onlineBookingVisible: true,
      color: "#17826A",
      locationIds: ["location_0001", "location_0002"],
    })).resolves.toEqual({ id: "staff_profile_00001" });

    expect(db.values).toHaveBeenNthCalledWith(1, expect.objectContaining({
      id: "staff_profile_00001",
      membershipId: "membership_0001",
      publicDisplayName: "ლელა ბერიძე",
      onlineBookingVisible: true,
    }));
    expect(db.values).toHaveBeenNthCalledWith(2, [
      { staffProfileId: "staff_profile_00001", locationId: "location_0001" },
      { staffProfileId: "staff_profile_00001", locationId: "location_0002" },
    ]);
  });
});

describe("staff.addWorkingHours", () => {
  it("rejects an hours rule when the specialist is not assigned to the selected active location", async () => {
    const chain = {
      from: () => chain,
      innerJoin: () => chain,
      where: () => ({ limit: vi.fn(async () => []) }),
    };
    const db = {
      select: vi.fn(() => chain),
      insert: vi.fn(),
    };
    mocked.db = db;
    mocked.requireOrganizationRole.mockResolvedValue({ role: "OWNER" });

    await expect(staffRouter.createCaller({ user } as never).addWorkingHours({
      organizationId: "organization_001",
      staffProfileId: "staff_profile_00001",
      locationId: "location_0001",
      weekday: 0,
      startLocalTime: "09:00",
      endLocalTime: "18:00",
    })).rejects.toThrow("Staff profile is not assigned to this active location");
    expect(db.insert).not.toHaveBeenCalled();
  });
});

describe("staff.addScheduleException", () => {
  it("rejects a schedule exception whose end precedes its start", async () => {
    mocked.requireOrganizationRole.mockResolvedValue({ role: "OWNER" });
    await expect(staffRouter.createCaller({ user } as never).addScheduleException({
      organizationId: "organization_001",
      staffProfileId: "staff_profile_00001",
      type: "VACATION",
      startsAt: new Date("2026-08-15T12:00:00.000Z"),
      endsAt: new Date("2026-08-15T09:00:00.000Z"),
      fullDay: false,
    })).rejects.toThrow();
  });
});

describe("staff schedule management", () => {
  it("removes a working-hours rule only after organization-scoped ownership lookup", async () => {
    const deleteWhere = vi.fn(async () => undefined);
    const chain = {
      from: () => chain,
      innerJoin: () => chain,
      where: () => ({ limit: vi.fn(async () => [{ id: "hours_rule_00001" }]) }),
    };
    const db = {
      select: vi.fn(() => chain),
      delete: vi.fn(() => ({ where: deleteWhere })),
    };
    mocked.db = db;
    mocked.requireOrganizationRole.mockResolvedValue({ role: "MANAGER" });

    await expect(staffRouter.createCaller({ user } as never).deleteWorkingHours({ organizationId: "organization_001", id: "hours_rule_00001" })).resolves.toEqual({ success: true });
    expect(db.delete).toHaveBeenCalledTimes(1);
    expect(deleteWhere).toHaveBeenCalledTimes(1);
  });

  it("does not delete an exception that is outside the organization scope", async () => {
    const chain = { from: () => chain, where: () => ({ limit: vi.fn(async () => []) }) };
    const db = { select: vi.fn(() => chain), delete: vi.fn() };
    mocked.db = db;
    mocked.requireOrganizationRole.mockResolvedValue({ role: "OWNER" });

    await expect(staffRouter.createCaller({ user } as never).deleteScheduleException({ organizationId: "organization_001", id: "exception_00001" })).rejects.toThrow("Schedule exception is not available in this organization");
    expect(db.delete).not.toHaveBeenCalled();
  });
});
