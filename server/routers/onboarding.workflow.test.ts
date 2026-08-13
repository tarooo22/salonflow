import { describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  db: null as unknown,
  nanoid: vi.fn(),
  requireOrganizationRole: vi.fn(),
}));

vi.mock("../db", () => ({ requireDb: vi.fn(async () => mocked.db) }));
vi.mock("../access", () => ({ requireOrganizationRole: mocked.requireOrganizationRole }));
vi.mock("nanoid", () => ({ nanoid: mocked.nanoid }));

import { organizationRouter } from "./organizations";
import { staffRouter } from "./staff";

const user = {
  id: 91,
  openId: "invited-member-open-id",
  email: "invited@example.com",
  name: "ნინო ქავთარაძე",
  loginMethod: "manus",
  role: "user" as const,
  createdAt: new Date("2026-08-01T00:00:00.000Z"),
  updatedAt: new Date("2026-08-01T00:00:00.000Z"),
  lastSignedIn: new Date("2026-08-01T00:00:00.000Z"),
};

function chainResult<T>(value: T[]) {
  const chain = {
    from: () => chain,
    innerJoin: () => chain,
    leftJoin: () => chain,
    where: () => chain,
    limit: async () => value,
    orderBy: async () => value,
  };
  return chain;
}

describe("invite acceptance to staff onboarding", () => {
  it("accepts an email-matched invite, exposes the active unprofiled member, and assigns a profile with selected locations", async () => {
    const persisted: unknown[] = [];
    const invite = {
      id: "invite_000000000000001",
      organizationId: "organization_001",
      email: "invited@example.com",
      role: "STAFF" as const,
      status: "PENDING" as const,
      expiresAt: new Date("2026-12-31T00:00:00.000Z"),
      createdAt: new Date("2026-08-13T00:00:00.000Z"),
      invitedByUserId: 77,
    };
    const acceptedMembership = { id: "membership_invited_001", organizationId: "organization_001", userId: user.id, role: "STAFF", status: "ACTIVE" };
    const acceptTx = {
      select: vi.fn().mockReturnValueOnce(chainResult([invite])).mockReturnValueOnce(chainResult([])),
      insert: vi.fn(() => ({ values: vi.fn(async (value: unknown) => { persisted.push(value); }) })),
      update: vi.fn(() => ({ set: () => ({ where: vi.fn(async () => undefined) }) })),
    };
    const createTx = {
      insert: vi.fn(() => ({ values: vi.fn(async (value: unknown) => { persisted.push(value); }) })),
    };
    const db = {
      select: vi.fn()
        .mockReturnValueOnce(chainResult([{ membership: acceptedMembership, user }]))
        .mockReturnValueOnce(chainResult([acceptedMembership])),
      transaction: vi.fn()
        .mockImplementationOnce(async (callback: (transaction: typeof acceptTx) => Promise<unknown>) => callback(acceptTx))
        .mockImplementationOnce(async (callback: (transaction: typeof createTx) => Promise<unknown>) => callback(createTx)),
    };
    mocked.db = db;
    mocked.nanoid.mockReturnValueOnce("membership_invited_001").mockReturnValueOnce("staff_profile_001");
    mocked.requireOrganizationRole.mockResolvedValue({ role: "MANAGER" });

    await expect(organizationRouter.createCaller({ user } as never).acceptStaffInvite({ token: "A".repeat(32) })).resolves.toEqual({
      organizationId: "organization_001",
      membershipId: "membership_invited_001",
      alreadyMember: false,
    });
    await expect(staffRouter.createCaller({ user } as never).listUnprofiledMembers({ organizationId: "organization_001" })).resolves.toEqual([{ membership: acceptedMembership, user }]);
    await expect(staffRouter.createCaller({ user } as never).createProfile({
      organizationId: "organization_001",
      membershipId: "membership_invited_001",
      publicDisplayName: "ნინო ქავთარაძე",
      jobTitle: "სტილისტი",
      onlineBookingVisible: true,
      color: "#17826A",
      locationIds: ["location_0001", "location_0002"],
    })).resolves.toEqual({ id: "staff_profile_001" });

    expect(persisted).toContainEqual(expect.objectContaining({ id: "membership_invited_001", userId: user.id, status: "ACTIVE" }));
    expect(persisted).toContainEqual(expect.objectContaining({ id: "staff_profile_001", membershipId: "membership_invited_001" }));
    expect(persisted).toContainEqual([
      { staffProfileId: "staff_profile_001", locationId: "location_0001" },
      { staffProfileId: "staff_profile_001", locationId: "location_0002" },
    ]);
  });
});
