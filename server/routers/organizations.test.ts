import { describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  db: null as unknown,
  nanoid: vi.fn(),
  requireOrganizationRole: vi.fn(),
}));

vi.mock("../db", () => ({
  requireDb: vi.fn(async () => mocked.db),
}));

vi.mock("nanoid", () => ({ nanoid: mocked.nanoid }));
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

describe("organizations.createStaffInvite", () => {
  it("creates a hashed, expiring invitation for a permitted organization manager", async () => {
    const values = vi.fn(async () => undefined);
    mocked.db = { insert: vi.fn(() => ({ values })) };
    mocked.nanoid.mockReturnValueOnce("invite_000000000000001");
    mocked.requireOrganizationRole.mockResolvedValue({ role: "OWNER" });

    const result = await organizationRouter.createCaller({ user } as never).createStaffInvite({
      organizationId: "organization_001",
      email: "NEW.STAFF@EXAMPLE.COM ",
      role: "STAFF",
      origin: "https://salonflow.example",
    });

    expect(result.id).toBe("invite_000000000000001");
    expect(result.inviteUrl).toMatch(/^https:\/\/salonflow\.example\/invite\/[A-Za-z0-9_-]{32,}$/);
    expect(values).toHaveBeenCalledWith(expect.objectContaining({
      id: "invite_000000000000001",
      organizationId: "organization_001",
      email: "new.staff@example.com",
      role: "STAFF",
      status: "PENDING",
      tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
    }));
    expect(values.mock.calls[0]?.[0].tokenHash).not.toContain(result.inviteUrl.split("/").at(-1));
  });
});

describe("organizations.acceptStaffInvite", () => {
  it("creates an active organization membership when the signed-in email matches a pending invite", async () => {
    const invite = {
      id: "invite_000000000000001",
      organizationId: "organization_001",
      email: "owner@example.com",
      role: "STAFF" as const,
      status: "PENDING" as const,
      expiresAt: new Date("2026-12-31T00:00:00.000Z"),
      createdAt: new Date("2026-08-13T00:00:00.000Z"),
      invitedByUserId: 77,
    };
    const inviteChain = { from: () => inviteChain, where: () => ({ limit: vi.fn(async () => [invite]) }) };
    const membershipChain = { from: () => membershipChain, where: () => ({ limit: vi.fn(async () => []) }) };
    const membershipValues = vi.fn(async () => undefined);
    const updateWhere = vi.fn(async () => undefined);
    const tx = {
      select: vi.fn().mockReturnValueOnce(inviteChain).mockReturnValueOnce(membershipChain),
      insert: vi.fn(() => ({ values: membershipValues })),
      update: vi.fn(() => ({ set: () => ({ where: updateWhere }) })),
    };
    const db = { transaction: vi.fn(async (callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx)) };
    mocked.db = db;
    mocked.nanoid.mockReturnValueOnce("membership_invited_001");

    await expect(organizationRouter.createCaller({ user } as never).acceptStaffInvite({ token: "A".repeat(32) })).resolves.toEqual({
      organizationId: "organization_001",
      membershipId: "membership_invited_001",
      alreadyMember: false,
    });
    expect(membershipValues).toHaveBeenCalledWith(expect.objectContaining({
      id: "membership_invited_001",
      organizationId: "organization_001",
      userId: user.id,
      role: "STAFF",
      status: "ACTIVE",
    }));
    expect(updateWhere).toHaveBeenCalledTimes(1);
  });
});
