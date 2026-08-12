import { describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  db: null as unknown,
  requireOrganizationRole: vi.fn(),
}));

vi.mock("../db", () => ({ requireDb: vi.fn(async () => mocked.db) }));
vi.mock("../access", () => ({ requireOrganizationRole: mocked.requireOrganizationRole }));

import { servicesRouter } from "./services";

const user = {
  id: 37,
  openId: "service-archive-owner",
  email: "owner@example.com",
  name: "Service Archive Owner",
  loginMethod: "manus",
  role: "user" as const,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  lastSignedIn: new Date("2026-01-01T00:00:00.000Z"),
};

describe("services.archive", () => {
  it("archives a service in its organization without deleting historical records", async () => {
    const where = vi.fn(async () => undefined);
    const set = vi.fn(() => ({ where }));
    const db = { update: vi.fn(() => ({ set })) };
    mocked.db = db;
    mocked.requireOrganizationRole.mockResolvedValue({ role: "OWNER" });

    await expect(servicesRouter.createCaller({ user } as never).archive({
      organizationId: "organization_001",
      serviceId: "service_000001",
    })).resolves.toEqual({ success: true });

    expect(set).toHaveBeenCalledWith({ status: "ARCHIVED" });
    expect(where).toHaveBeenCalledTimes(1);
  });
});

describe("services.setStaffEligibility", () => {
  it("rejects an unrelated staff profile before changing public-booking eligibility", async () => {
    let selectCall = 0;
    const createQuery = (rows: unknown[]) => {
      const query = {
        from: () => query,
        innerJoin: () => query,
        where: () => ({ limit: vi.fn(async () => rows) }),
      };
      return query;
    };
    const db = {
      select: vi.fn(() => createQuery(selectCall++ === 0 ? [{ id: "service_000001" }] : [])),
      insert: vi.fn(),
    };
    mocked.db = db;
    mocked.requireOrganizationRole.mockResolvedValue({ role: "OWNER" });

    await expect(servicesRouter.createCaller({ user } as never).setStaffEligibility({
      organizationId: "organization_001",
      serviceId: "service_000001",
      staffProfileId: "staff_profile_00001",
      canPerform: true,
    })).rejects.toThrow("Staff profile is not active in this organization");
    expect(db.insert).not.toHaveBeenCalled();
  });
});
