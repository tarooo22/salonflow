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
  it("allows a manager to create a profile and selected assignments for a different active organization membership", async () => {
    const db = createStaffDb([{ id: "membership_other_001", status: "ACTIVE" }]);
    mocked.db = db;
    mocked.requireOrganizationRole.mockResolvedValue({ role: "MANAGER" });
    mocked.nanoid.mockReturnValueOnce("staff_profile_00001");

    await expect(staffRouter.createCaller({ user } as never).createProfile({
      organizationId: "organization_001",
      membershipId: "membership_other_001",
      publicDisplayName: "ლელა ბერიძე",
      jobTitle: "თმის სტილისტი",
      onlineBookingVisible: true,
      color: "#17826A",
      locationIds: ["location_0001", "location_0002"],
    })).resolves.toEqual({ id: "staff_profile_00001" });

    expect(db.values).toHaveBeenNthCalledWith(1, expect.objectContaining({
      id: "staff_profile_00001",
      membershipId: "membership_other_001",
      publicDisplayName: "ლელა ბერიძე",
      onlineBookingVisible: true,
    }));
    expect(db.values).toHaveBeenNthCalledWith(2, [
      { staffProfileId: "staff_profile_00001", locationId: "location_0001" },
      { staffProfileId: "staff_profile_00001", locationId: "location_0002" },
    ]);
  });
});

describe("staff.listUnprofiledMembers", () => {
  it("returns active organization members that do not yet have a specialist profile", async () => {
    const rows = [{ membership: { id: "membership_0002", role: "STAFF" }, user: { id: 32, name: "ნინო ქავთარაძე", email: "nino@example.com" } }];
    const chain = {
      from: () => chain,
      innerJoin: () => chain,
      leftJoin: () => chain,
      where: () => ({ orderBy: vi.fn(async () => rows) }),
    };
    mocked.db = { select: vi.fn(() => chain) };
    mocked.requireOrganizationRole.mockResolvedValue({ role: "MANAGER" });

    await expect(staffRouter.createCaller({ user } as never).listUnprofiledMembers({ organizationId: "organization_001" })).resolves.toEqual(rows);
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

describe("staff.updateProfile", () => {
  it("rejects profile edits when the specialist is not active in the current organization", async () => {
    const chain = {
      from: () => chain,
      innerJoin: () => chain,
      where: () => ({ limit: vi.fn(async () => []) }),
    };
    const db = { select: vi.fn(() => chain), transaction: vi.fn() };
    mocked.db = db;
    mocked.requireOrganizationRole.mockResolvedValue({ role: "MANAGER" });

    await expect(staffRouter.createCaller({ user } as never).updateProfile({
      organizationId: "organization_001",
      staffProfileId: "staff_profile_00001",
      publicDisplayName: "ლელა ბერიძე",
      onlineBookingVisible: true,
      color: "#17826A",
      locationIds: ["location_0001"],
    })).rejects.toThrow("Staff profile is not active in this organization");
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it("rejects a location assignment that is not active in the current organization", async () => {
    const profileChain = {
      from: () => profileChain,
      innerJoin: () => profileChain,
      where: () => ({ limit: vi.fn(async () => [{ id: "staff_profile_00001" }]) }),
    };
    const locationChain = {
      from: () => locationChain,
      where: vi.fn(async () => []),
    };
    const db = { select: vi.fn().mockReturnValueOnce(profileChain).mockReturnValueOnce(locationChain), transaction: vi.fn() };
    mocked.db = db;
    mocked.requireOrganizationRole.mockResolvedValue({ role: "MANAGER" });

    await expect(staffRouter.createCaller({ user } as never).updateProfile({
      organizationId: "organization_001",
      staffProfileId: "staff_profile_00001",
      publicDisplayName: "ლელა ბერიძე",
      onlineBookingVisible: true,
      color: "#17826A",
      locationIds: ["location_0001"],
    })).rejects.toThrow("One or more locations are not active in this organization");
    expect(db.transaction).not.toHaveBeenCalled();
  });
});

describe("staff.requestTimeOff", () => {
  it("rejects a staff member who is not assigned to the requested active location", async () => {
    const chain = {
      from: () => chain,
      innerJoin: () => chain,
      where: () => ({ limit: vi.fn(async () => []) }),
    };
    const db = { select: vi.fn(() => chain), insert: vi.fn() };
    mocked.db = db;
    mocked.requireOrganizationRole.mockResolvedValue({ role: "STAFF" });

    await expect(staffRouter.createCaller({ user } as never).requestTimeOff({
      organizationId: "organization_001",
      staffProfileId: "staff_profile_00001",
      locationId: "location_0001",
      startsAt: new Date("2026-08-15T09:00:00.000Z"),
      endsAt: new Date("2026-08-15T18:00:00.000Z"),
      reason: "დასვენება",
    })).rejects.toThrow("Staff profile is not assigned to this active location");
    expect(db.insert).not.toHaveBeenCalled();
  });
});

describe("staff.reviewTimeOffRequest", () => {
  it("rejects review of a request outside the active organization", async () => {
    const chain = {
      from: () => chain,
      innerJoin: () => chain,
      where: () => ({ limit: vi.fn(async () => []) }),
    };
    const db = { select: vi.fn(() => chain), update: vi.fn() };
    mocked.db = db;
    mocked.requireOrganizationRole.mockResolvedValue({ role: "MANAGER" });

    await expect(staffRouter.createCaller({ user } as never).reviewTimeOffRequest({
      organizationId: "organization_001",
      requestId: "time_off_request_001",
      status: "APPROVED",
    })).rejects.toThrow("Time-off request was not found in this organization");
    expect(db.update).not.toHaveBeenCalled();
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
