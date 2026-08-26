import { describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({ db: null as unknown, requireOrganizationAction: vi.fn() }));

vi.mock("../db", () => ({ requireDb: vi.fn(async () => mocked.db) }));
vi.mock("../access", () => ({ requireOrganizationAction: mocked.requireOrganizationAction }));
vi.mock("drizzle-orm", async importOriginal => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    and: (...conditions: unknown[]) => ({ kind: "and", conditions }),
    eq: (column: unknown, value: unknown) => ({ kind: "eq", column, value }),
    gte: (column: unknown, value: unknown) => ({ kind: "gte", column, value }),
    lte: (column: unknown, value: unknown) => ({ kind: "lte", column, value }),
    inArray: (column: unknown, values: unknown[]) => ({ kind: "inArray", column, values }),
  };
});

import { reportingRouter } from "./reporting";

const user = { id: 1, openId: "local_reporting_user", email: "owner@example.com", name: "Owner", loginMethod: "local", role: "user" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };

function reportDb(queryRows: unknown[][]) {
  const wheres: unknown[] = [];
  return {
    select: vi.fn(() => {
      const rows = queryRows.shift() ?? [];
      const chain = {
        from: () => chain,
        innerJoin: () => chain,
        where: (condition: unknown) => { wheres.push(condition); return chain; },
        then: <TResult1 = unknown[], TResult2 = never>(onfulfilled?: ((value: unknown[]) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null) => Promise.resolve(rows).then(onfulfilled, onrejected),
      };
      return chain;
    }),
    wheres,
  };
}

describe("reporting.exportCsv", () => {
  it("requires report scope and returns selected-range rows with injection-safe CSV cells", async () => {
    mocked.requireOrganizationAction.mockResolvedValue({ role: "OWNER" });
    const db = reportDb([[{ 
      id: "=HYPERLINK(\"https://invalid.example\")",
      startsAt: new Date("2026-08-01T09:00:00.000Z"),
      endsAt: new Date("2026-08-01T10:00:00.000Z"),
      status: "COMPLETED",
      totalTetri: 12_500,
      discountTetri: 0,
    }], []]);
    mocked.db = db;
    const startsAt = new Date("2026-08-01T00:00:00.000Z");
    const endsAt = new Date("2026-08-02T23:59:59.999Z");

    const result = await reportingRouter.createCaller({ user } as never).exportCsv({ organizationId: "organization_0001", startsAt, endsAt });

    expect(mocked.requireOrganizationAction).toHaveBeenCalledWith(user, "organization_0001", "reports:view");
    expect(result.filename).toBe("salonflow-bookings-2026-08-01-2026-08-02.csv");
    expect(result.csv).toContain("'=HYPERLINK");
    expect(db.wheres[0]).toMatchObject({ kind: "and", conditions: expect.arrayContaining([
      expect.objectContaining({ kind: "eq", value: "organization_0001" }),
      expect.objectContaining({ kind: "gte", value: startsAt }),
      expect.objectContaining({ kind: "lte", value: endsAt }),
    ]) });
  });
});

describe("reporting.feedbackInsights", () => {
  it("returns organization-scoped aggregates without client identifiers or feedback text", async () => {
    mocked.requireOrganizationAction.mockResolvedValue({ role: "OWNER" });
    const db = reportDb([
      [{ rating: 5, status: "APPROVED", submittedAt: new Date("2026-08-01T09:00:00.000Z") }, { rating: 3, status: "HIDDEN", submittedAt: new Date("2026-08-02T09:00:00.000Z") }],
      [{ clientId: "client_a", consentType: "MARKETING_EMAIL", granted: true, withdrawnAt: null, createdAt: new Date("2026-08-01T09:00:00.000Z") }, { clientId: "client_a", consentType: "MARKETING_SMS", granted: false, withdrawnAt: new Date("2026-08-02T09:00:00.000Z") }],
    ]);
    mocked.db = db;
    const startsAt = new Date("2026-08-01T00:00:00.000Z");
    const endsAt = new Date("2026-08-03T23:59:59.999Z");

    const result = await reportingRouter.createCaller({ user } as never).feedbackInsights({ organizationId: "organization_0001", startsAt, endsAt });

    expect(mocked.requireOrganizationAction).toHaveBeenCalledWith(user, "organization_0001", "reports:view");
    expect(result.feedback).toMatchObject({ total: 2, averageRating: 4, ratings: expect.arrayContaining([{ rating: 5, count: 1 }]) });
    expect(result.consent).toMatchObject({ currentOptIns: { marketingEmail: 1, marketingSms: 0 }, activity: { granted: 1, withdrawn: 1 } });
    expect(JSON.stringify(result)).not.toContain("client_a");
    expect(db.wheres[0]).toMatchObject({ kind: "and", conditions: expect.arrayContaining([expect.objectContaining({ kind: "eq", value: "organization_0001" })]) });
  });
});
