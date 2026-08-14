import { describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({ db: null as unknown, requireOrganizationRole: vi.fn(), requireOrganizationAction: vi.fn(), businessDayRange: vi.fn() }));

vi.mock("drizzle-orm", async importOriginal => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    and: (...conditions: unknown[]) => ({ kind: "and", conditions }),
    eq: (left: unknown, right: unknown) => ({ kind: "eq", left, right }),
    sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({ kind: "sql", strings: [...strings], values }),
  };
});
vi.mock("../db", () => ({ requireDb: vi.fn(async () => mocked.db) }));
vi.mock("../access", () => ({ requireOrganizationRole: mocked.requireOrganizationRole, requireOrganizationAction: mocked.requireOrganizationAction }));
vi.mock("@shared/timezones", async importOriginal => ({ ...(await importOriginal<typeof import("@shared/timezones")>()), businessDayRange: mocked.businessDayRange }));

import { appointmentsRouter } from "./appointments";

const user = { id: 37, openId: "appointment-owner", email: "owner@example.com", name: "Owner", loginMethod: "local", role: "user" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
const organizationId = "organization_2026_abcd";
const locationId = "location_2026_abcdefgh";
const appointmentId = "appointment_2026_abcdef";
const staffProfileId = "staff_2026_abcdefghijk";

function query(rows: unknown[]) {
  const chain = {
    from: () => chain,
    leftJoin: () => chain,
    innerJoin: () => chain,
    where: vi.fn(() => chain),
    limit: async () => rows,
    orderBy: async () => rows,
    then: <TResult1 = unknown[], TResult2 = never>(onfulfilled?: ((value: unknown[]) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null) => Promise.resolve(rows).then(onfulfilled, onrejected),
  };
  return chain;
}

describe("appointments operational data contracts", () => {
  it("scopes the Today queue to its active location and timezone-derived business-day range", async () => {
    const startsAt = new Date("2026-08-13T20:00:00.000Z");
    const endsAt = new Date("2026-08-14T20:00:00.000Z");
    mocked.businessDayRange.mockReturnValue({ startsAt, endsAt, dateKey: "2026-08-14" });
    const queries: Array<ReturnType<typeof query>> = [];
    let selectCall = 0;
    const appointment = { id: appointmentId, organizationId, locationId, clientId: "client_2026_abcdef", staffProfileId, startsAt: new Date("2026-08-14T08:00:00.000Z"), endsAt: new Date("2026-08-14T09:00:00.000Z"), status: "CONFIRMED" as const, totalTetri: 12_000 };
    const db = { select: vi.fn(() => {
      const rows = [[{ id: locationId, name: "ვაკე", timezone: "Asia/Tbilisi" }], [{ appointment, clientFirstName: "ანა", clientLastName: "მაისურაძე", staffName: "თამარ", staffColor: "#17826A" }], [{ appointmentId, amountTetri: 8_000, refundedTetri: 0, status: "PAID" as const }], [{ id: "service_snapshot_2026", appointmentId, serviceNameSnapshot: "თმის შეჭრა", durationMinutesSnapshot: 60, priceTetriSnapshot: 12_000, sortOrder: 0 }]][selectCall++] ?? [];
      const created = query(rows as unknown[]); queries.push(created); return created;
    }) };
    mocked.db = db;
    mocked.requireOrganizationRole.mockResolvedValue({ id: "membership_2026_abcd", role: "OWNER" });

    const result = await appointmentsRouter.createCaller({ user } as never).dashboard({ organizationId, locationId });

    expect(mocked.businessDayRange).toHaveBeenCalledWith("Asia/Tbilisi");
    expect(queries[1].where).toHaveBeenCalledWith(expect.objectContaining({ kind: "and", conditions: expect.arrayContaining([
      expect.objectContaining({ kind: "eq", right: locationId }),
      expect.objectContaining({ kind: "sql", values: expect.arrayContaining([startsAt]) }),
      expect.objectContaining({ kind: "sql", values: expect.arrayContaining([endsAt]) }),
    ]) }));
    expect(result).toMatchObject({ dateKey: "2026-08-14", counts: { CONFIRMED: 1 }, metrics: { scheduledTetri: 12_000, collectedTetri: 8_000, outstandingTetri: 4_000 } });
    expect(result.appointments[0]).toMatchObject({ client: { firstName: "ანა", lastName: "მაისურაძე" }, staff: { id: staffProfileId, publicDisplayName: "თამარ" }, services: [{ serviceNameSnapshot: "თმის შეჭრა" }] });
  });

  it("applies Calendar location and explicit range filters before returning joined cards", async () => {
    const startsAt = new Date("2026-08-14T00:00:00.000Z");
    const endsAt = new Date("2026-08-15T00:00:00.000Z");
    const queries: Array<ReturnType<typeof query>> = [];
    let selectCall = 0;
    const appointment = { id: appointmentId, organizationId, locationId, clientId: null, staffProfileId, startsAt: new Date("2026-08-14T08:00:00.000Z"), endsAt: new Date("2026-08-14T09:00:00.000Z"), status: "PENDING" as const, totalTetri: 12_000 };
    const db = { select: vi.fn(() => {
      const rows = [[{ appointment, clientFirstName: null, clientLastName: null, staffName: "თამარ", staffColor: "#17826A" }], [{ id: "service_snapshot_2026", appointmentId, serviceNameSnapshot: "ფენი", durationMinutesSnapshot: 60, priceTetriSnapshot: 12_000, sortOrder: 0 }]][selectCall++] ?? [];
      const created = query(rows as unknown[]); queries.push(created); return created;
    }) };
    mocked.db = db;
    mocked.requireOrganizationRole.mockResolvedValue({ id: "membership_2026_abcd", role: "OWNER" });

    const result = await appointmentsRouter.createCaller({ user } as never).listRange({ organizationId, locationId, startsAt, endsAt });

    expect(queries[0].where).toHaveBeenCalledWith(expect.objectContaining({ kind: "and", conditions: expect.arrayContaining([
      expect.objectContaining({ kind: "eq", right: locationId }),
      expect.objectContaining({ kind: "sql", values: expect.arrayContaining([startsAt]) }),
      expect.objectContaining({ kind: "sql", values: expect.arrayContaining([endsAt]) }),
    ]) }));
    expect(result[0]).toMatchObject({ id: appointmentId, client: null, staff: { id: staffProfileId, publicDisplayName: "თამარ", color: "#17826A" }, services: [{ serviceNameSnapshot: "ფენი" }] });
  });

  it("does not reveal the day queue to a STAFF membership without a linked profile", async () => {
    mocked.businessDayRange.mockReturnValue({ startsAt: new Date("2026-08-13T20:00:00.000Z"), endsAt: new Date("2026-08-14T20:00:00.000Z"), dateKey: "2026-08-14" });
    let selectCall = 0;
    const db = { select: vi.fn(() => query(([[{ id: locationId, name: "ვაკე", timezone: "Asia/Tbilisi" }], []][selectCall++] ?? []) as unknown[])) };
    mocked.db = db;
    mocked.requireOrganizationRole.mockResolvedValue({ id: "membership_staff_2026", role: "STAFF" });

    const result = await appointmentsRouter.createCaller({ user } as never).dashboard({ organizationId, locationId });

    expect(result.appointments).toEqual([]);
    expect(result.balances).toEqual([]);
    expect(result.metrics).toEqual({ scheduledTetri: 0, collectedTetri: 0, outstandingTetri: 0 });
  });

  it("requires the existing calendar-management action before a walk-in can query or write operational data", async () => {
    mocked.requireOrganizationAction.mockRejectedValueOnce(new Error("ამ მოქმედებისთვის წვდომა არ გაქვთ"));
    mocked.db = { select: vi.fn() };

    await expect(appointmentsRouter.createCaller({ user } as never).createWalkIn({
      organizationId, locationId, staffProfileId, serviceId: "service_2026_abcdefgh", startsAt: new Date("2026-08-14T10:00:00.000Z"),
    })).rejects.toThrow("ამ მოქმედებისთვის წვდომა არ გაქვთ");
    expect((mocked.db as { select: ReturnType<typeof vi.fn> }).select).not.toHaveBeenCalled();
  });

  it("rejects rescheduling a checked-in appointment before opening a schedule lock transaction", async () => {
    mocked.requireOrganizationAction.mockResolvedValueOnce(undefined);
    const checkedIn = { id: appointmentId, organizationId, staffProfileId, startsAt: new Date("2026-08-14T08:00:00.000Z"), endsAt: new Date("2026-08-14T09:00:00.000Z"), status: "CHECKED_IN" as const };
    const db = { select: vi.fn(() => query([checkedIn])), transaction: vi.fn() };
    mocked.db = db;

    await expect(appointmentsRouter.createCaller({ user } as never).reschedule({
      organizationId, appointmentId, startsAt: new Date("2026-08-14T10:00:00.000Z"),
    })).rejects.toThrow("ამ სტატუსის ჯავშნის გადატანა აღარ შეიძლება");
    expect(db.transaction).not.toHaveBeenCalled();
  });
});
