import { describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({ db: { select: vi.fn(), transaction: vi.fn() } }));
vi.mock("../db", () => ({ requireDb: vi.fn(async () => mocked.db) }));

import { governanceRouter } from "./governance";

const salonUser = { id: 12, openId: "local-salon-user", name: "Owner", email: "owner@example.com", role: "user" as const };
const admin = { id: 1, openId: "local-admin", name: "Admin", email: "admin@example.com", role: "admin" as const };

describe("organization governance router", () => {
  it("denies organization inventory to non-platform-admin users before database access", async () => {
    await expect(governanceRouter.createCaller({ user: salonUser } as never).listOrganizations({ limit: 25, offset: 0 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mocked.db.select).not.toHaveBeenCalled();
  });

  it("requires days for a grant action and does not touch the database when input is invalid", async () => {
    await expect(governanceRouter.createCaller({ user: admin } as never).act({ organizationId: "organization_001", action: "GRANT_DAYS", reasonKa: "დამატებითი დრო" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mocked.db.select).not.toHaveBeenCalled();
  });

  it("requires a Georgian reason for every governance action", async () => {
    await expect(governanceRouter.createCaller({ user: admin } as never).act({ organizationId: "organization_001", action: "SUSPEND", reasonKa: "" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mocked.db.select).not.toHaveBeenCalled();
  });
});
