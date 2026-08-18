import { describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  db: null as unknown,
  nanoid: vi.fn(),
  requireOrganizationRole: vi.fn(),
}));

vi.mock("../db", () => ({ requireDb: vi.fn(async () => mocked.db) }));
vi.mock("../access", () => ({ requireOrganizationRole: mocked.requireOrganizationRole }));
vi.mock("nanoid", () => ({ nanoid: mocked.nanoid }));
vi.mock("drizzle-orm", async importOriginal => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    and: (...conditions: unknown[]) => ({ kind: "and", conditions }),
    eq: (column: unknown, value: unknown) => ({ kind: "eq", column, value }),
    gte: (column: unknown, value: unknown) => ({ kind: "gte", column, value }),
    lt: (column: unknown, value: unknown) => ({ kind: "lt", column, value }),
    asc: (column: unknown) => ({ kind: "asc", column }),
    desc: (column: unknown) => ({ kind: "desc", column }),
  };
});

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

describe("staff.createMember", () => {
  it("rejects assigning one specialist account to multiple branches", async () => {
    mocked.db = {};
    mocked.requireOrganizationRole.mockResolvedValue({ role: "OWNER" });

    await expect(staffRouter.createCaller({ user } as never).createMember({
      organizationId: "organization_001",
      fullName: "ანი ბერიძე",
      role: "STAFF",
      publicDisplayName: "ანი",
      onlineBookingVisible: true,
      color: "#7C3AED",
      locationIds: ["location_0001", "location_0002"],
    })).rejects.toMatchObject({ message: "სპეციალისტი ზუსტად ერთ აქტიურ ფილიალზე უნდა იყოს მინიჭებული." });
  });
});

describe("staff.updateSelfProfile", () => {
  function selfProfileDb(profileRows: unknown[]) {
    const updateWhere = vi.fn(async () => undefined);
    const updateSet = vi.fn(() => ({ where: updateWhere }));
    const chain = { from: () => chain, innerJoin: () => chain, where: () => ({ limit: vi.fn(async () => profileRows) }) };
    return { select: vi.fn(() => chain), update: vi.fn(() => ({ set: updateSet })), updateSet, updateWhere };
  }

  it("updates only profile-safe fields for the calling specialist's own active membership", async () => {
    const db = selfProfileDb([{ id: "staff_profile_00001" }]);
    mocked.db = db;
    mocked.requireOrganizationRole.mockResolvedValue({ id: "membership_0001", role: "STAFF" });

    await expect(staffRouter.createCaller({ user } as never).updateSelfProfile({
      organizationId: "organization_001",
      staffProfileId: "staff_profile_00001",
      publicDisplayName: "ლელა ბერიძე",
      publicBio: "გამოცდილი კოლორისტი",
      jobTitle: "წამყვანი სტილისტი",
      specialty: "ბალაიაჟი",
      experienceYears: 8,
      avatarAltKa: "ლელა ბერიძის პროფესიული პორტრეტი",
    })).resolves.toEqual({ success: true });

    expect(mocked.requireOrganizationRole).toHaveBeenCalledWith(user, "organization_001", ["STAFF"]);
    const update = db.updateSet.mock.calls[0]?.[0];
    expect(update).toMatchObject({ publicDisplayName: "ლელა ბერიძე", publicBio: "გამოცდილი კოლორისტი", jobTitle: "წამყვანი სტილისტი", specialty: "ბალაიაჟი", experienceYears: 8, avatarAltKa: "ლელა ბერიძის პროფესიული პორტრეტი" });
    expect(update).not.toHaveProperty("onlineBookingVisible");
    expect(update).not.toHaveProperty("color");
    expect(db.updateWhere).toHaveBeenCalledTimes(1);
  });

  it("rejects a cross-profile update before writing", async () => {
    const db = selfProfileDb([]);
    mocked.db = db;
    mocked.requireOrganizationRole.mockResolvedValue({ id: "membership_0001", role: "STAFF" });

    await expect(staffRouter.createCaller({ user } as never).updateSelfProfile({ organizationId: "organization_001", staffProfileId: "another_staff_profile", publicBio: "ცვლილების მცდელობა" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.update).not.toHaveBeenCalled();
  });

  it("rejects owner-controlled fields rather than silently accepting them", async () => {
    await expect(staffRouter.createCaller({ user } as never).updateSelfProfile({
      organizationId: "organization_001",
      staffProfileId: "staff_profile_00001",
      publicBio: "ჩემი აღწერა",
      onlineBookingVisible: false,
    } as never)).rejects.toThrow();
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

  it("updates working hours only after active organization/location ownership lookup", async () => {
    const updateWhere = vi.fn(async () => undefined);
    const chain = { from: () => chain, innerJoin: () => chain, where: () => ({ limit: vi.fn(async () => [{ id: "hours_rule_00001" }]) }) };
    const db = { select: vi.fn(() => chain), update: vi.fn(() => ({ set: vi.fn(() => ({ where: updateWhere })) })) };
    mocked.db = db;
    mocked.requireOrganizationRole.mockResolvedValue({ role: "OWNER" });

    await expect(staffRouter.createCaller({ user } as never).updateWorkingHours({ organizationId: "organization_001", id: "hours_rule_00001", staffProfileId: "staff_profile_00001", locationId: "location_0001", weekday: 2, startLocalTime: "10:00", endLocalTime: "19:00" })).resolves.toEqual({ success: true });
    expect(db.update).toHaveBeenCalledTimes(1);
    expect(updateWhere).toHaveBeenCalledTimes(1);
  });

  it("does not update an exception that is outside the organization scope", async () => {
    const chain = { from: () => chain, where: () => ({ limit: vi.fn(async () => []) }) };
    const db = { select: vi.fn(() => chain), update: vi.fn() };
    mocked.db = db;
    mocked.requireOrganizationRole.mockResolvedValue({ role: "OWNER" });

    await expect(staffRouter.createCaller({ user } as never).updateScheduleException({ organizationId: "organization_001", id: "exception_00001", staffProfileId: "staff_profile_00001", locationId: "location_0001", type: "VACATION", startsAt: new Date("2026-08-15T09:00:00.000Z"), endsAt: new Date("2026-08-15T18:00:00.000Z"), fullDay: false })).rejects.toThrow("Schedule exception is not available in this organization");
    expect(db.update).not.toHaveBeenCalled();
  });

  it("does not update an exception when its specialist is no longer assigned to the active location", async () => {
    const rows = [[{ id: "exception_00001", staffProfileId: "staff_profile_00001", locationId: "location_0001" }], []];
    const select = vi.fn(() => {
      const chain = { from: () => chain, innerJoin: () => chain, where: () => ({ limit: vi.fn(async () => rows.shift() ?? []) }) };
      return chain;
    });
    const db = { select, update: vi.fn() };
    mocked.db = db;
    mocked.requireOrganizationRole.mockResolvedValue({ role: "MANAGER" });

    await expect(staffRouter.createCaller({ user } as never).updateScheduleException({ organizationId: "organization_001", id: "exception_00001", staffProfileId: "staff_profile_00001", locationId: "location_0001", type: "VACATION", startsAt: new Date("2026-08-15T09:00:00.000Z"), endsAt: new Date("2026-08-15T18:00:00.000Z"), fullDay: false })).rejects.toThrow("Schedule exception staff profile is not assigned to this active location");
    expect(db.update).not.toHaveBeenCalled();
  });
});

describe("staff.performance", () => {
  it("returns period-scoped, appointment-derived metrics only to the organization owner", async () => {
    const rows = [
      [{ profile: { id: "staff_profile_00001", publicDisplayName: "ლელა ბერიძე", status: "ACTIVE", sortOrder: 0 } }],
      [{ staffProfileId: "staff_profile_00001", status: "COMPLETED", totalTetri: 12_500 }, { staffProfileId: "staff_profile_00001", status: "CONFIRMED", totalTetri: 8_000 }],
    ];
    const wheres: unknown[] = [];
    const select = vi.fn(() => {
      const result = rows.shift() ?? [];
      const chain = { from: () => chain, innerJoin: () => chain, where: (condition: unknown) => { wheres.push(condition); return chain; }, orderBy: async () => result, then: <TResult1 = unknown[], TResult2 = never>(onfulfilled?: ((value: unknown[]) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null) => Promise.resolve(result).then(onfulfilled, onrejected) };
      return chain;
    });
    mocked.db = { select };
    mocked.requireOrganizationRole.mockResolvedValue({ role: "OWNER" });

    const result = await staffRouter.createCaller({ user } as never).performance({ organizationId: "organization_001", startsAt: new Date("2026-08-01T00:00:00.000Z"), endsAt: new Date("2026-08-31T23:59:59.999Z") });

    expect(mocked.requireOrganizationRole).toHaveBeenCalledWith(user, "organization_001", ["OWNER"]);
    expect(result).toEqual([{ profile: expect.objectContaining({ id: "staff_profile_00001", publicDisplayName: "ლელა ბერიძე" }), metrics: { staffProfileId: "staff_profile_00001", completedAppointments: 1, serviceVolume: 2, bookedRevenueTetri: 20_500 } }]);
    expect(wheres[1]).toMatchObject({ kind: "and", conditions: expect.arrayContaining([
      expect.objectContaining({ kind: "eq", value: "organization_001" }),
      expect.objectContaining({ kind: "gte", value: new Date("2026-08-01T00:00:00.000Z") }),
      expect.objectContaining({ kind: "lt", value: new Date("2026-08-31T23:59:59.999Z") }),
    ]) });
  });
});
