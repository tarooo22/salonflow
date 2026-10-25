// These suites cover enforced opening hours (off by default until the backfill; see fetchOpeningHours).
process.env.ENFORCE_OPENING_HOURS = "true";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { appointments, locationOpeningHours, locations, scheduleExceptions, staffProfiles, workingHourRules } from "../../drizzle/schema";

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
  it("exposes no unscoped create or UTC-day listToday procedures", () => {
    const procedures = Object.keys((appointmentsRouter as any)._def.procedures);
    expect(procedures).not.toContain("create");
    expect(procedures).not.toContain("listToday");
  });

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

// Friday 2026-08-14 (schema weekday 4) in Tbilisi (UTC+4); staff hours 10:00–19:00 local = 06:00–15:00Z.
const at = (time: string) => new Date(`2026-08-14T${time}:00.000Z`);
const booked = { id: appointmentId, organizationId, locationId, staffProfileId, startsAt: new Date("2026-08-13T08:00:00.000Z"), endsAt: new Date("2026-08-13T09:00:00.000Z"), bufferBeforeMinutes: 0, bufferAfterMinutes: 15, status: "CONFIRMED" as const };

/** DB double that answers each select by its `from` table; the transaction runs on the same double and records updates. */
function tableDb(rowsByTable: Map<unknown, unknown[]>) {
  const updates: unknown[] = [];
  const select = vi.fn(() => ({ from: (table: unknown) => query(rowsByTable.get(table) ?? []) }));
  const tx = {
    select,
    insert: vi.fn(() => ({ values: vi.fn(() => ({ onDuplicateKeyUpdate: vi.fn(async () => undefined), then: (resolve: (value: unknown) => unknown) => Promise.resolve(undefined).then(resolve) })) })),
    update: vi.fn(() => ({ set: (values: unknown) => ({ where: async () => { updates.push(values); } }) })),
  };
  const db = { select, transaction: vi.fn(async (run: (transaction: typeof tx) => Promise<unknown>) => run(tx)) };
  return { db, tx, updates };
}

describe("staff-side reschedule integrity", () => {
  beforeEach(() => { vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date("2026-08-14T05:00:00.000Z")); });
  afterEach(() => { vi.useRealTimers(); });

  const hours = [{ startLocalTime: "10:00:00", endLocalTime: "19:00:00" }];
  const setup = ({ role = "OWNER", others = [] as unknown[], opening = [] as unknown[], exceptions = [] as unknown[] } = {}) => {
    mocked.requireOrganizationAction.mockResolvedValueOnce({ role });
    const rows = new Map<unknown, unknown[]>([
      [locations, [{ id: locationId, organizationId, timezone: "Asia/Tbilisi" }]],
      [workingHourRules, hours],
      [locationOpeningHours, opening],
      [scheduleExceptions, exceptions],
    ]);
    const harness = tableDb(rows);
    // The first appointments read is the booking being moved; later reads are the staff member's bookings inside the transaction.
    let appointmentReads = 0;
    harness.db.select.mockImplementation(() => ({ from: (table: unknown) => query(table === appointments ? (appointmentReads++ === 0 ? [booked] : [booked, ...others]) : rows.get(table) ?? []) }));
    mocked.db = harness.db;
    return harness;
  };
  const move = (startsAt: Date, extra: { allowOutsideHours?: boolean } = {}) => appointmentsRouter.createCaller({ user } as never).reschedule({ organizationId, appointmentId, startsAt, ...extra });

  it("moves a booking that fits the staff member's hours and is clear of other bookings", async () => {
    const { updates } = setup();
    await expect(move(at("08:00"))).resolves.toMatchObject({ id: appointmentId, endsAt: at("09:00") });
    expect(updates).toEqual([expect.objectContaining({ startsAt: at("08:00"), endsAt: at("09:00"), staffProfileId })]);
  });

  it("rejects a move whose after-buffer overlaps the next booking even though the visits only touch", async () => {
    const { updates } = setup({ others: [{ ...booked, id: "other_2026_abcdefghij", startsAt: at("09:00"), endsAt: at("10:00"), bufferAfterMinutes: 0 }] });
    await expect(move(at("08:00"))).rejects.toMatchObject({ code: "CONFLICT", message: "არჩეული დრო უკვე დაკავებულია." });
    expect(updates).toEqual([]);
  });

  it("rejects a move into the past before taking any schedule lock", async () => {
    const { db } = setup();
    await expect(move(new Date("2026-08-14T04:50:00.000Z"))).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it("rejects a move that runs past the staff member's working hours with PRECONDITION_FAILED", async () => {
    const { updates } = setup();
    await expect(move(at("14:30"))).rejects.toMatchObject({ code: "PRECONDITION_FAILED", message: "არჩეული დრო სპეციალისტის სამუშაო საათებს სცდება." });
    expect(updates).toEqual([]);
  });

  it("rejects a move outside the location's opening hours even inside staff hours", async () => {
    setup({ opening: [{ weekday: 4, startLocalTime: "10:00:00", endLocalTime: "18:00:00" }] });
    await expect(move(at("13:30"))).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });

  it("rejects a move into a blocking exception and the override does not skip it", async () => {
    setup({ exceptions: [{ staffProfileId, locationId: null, type: "VACATION", startsAt: at("00:00"), endsAt: at("20:00") }] });
    await expect(move(at("08:00"))).rejects.toMatchObject({ code: "CONFLICT" });
    setup({ exceptions: [{ staffProfileId, locationId: null, type: "VACATION", startsAt: at("00:00"), endsAt: at("20:00") }] });
    await expect(move(at("14:30"), { allowOutsideHours: true })).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it.each(["OWNER", "MANAGER"])("lets an %s move outside hours with the explicit override, still checking overlap", async role => {
    const { updates } = setup({ role });
    await expect(move(at("14:30"), { allowOutsideHours: true })).resolves.toMatchObject({ endsAt: at("15:30") });
    expect(updates).toHaveLength(1);
    setup({ role, others: [{ ...booked, id: "other_2026_abcdefghij", startsAt: at("15:30"), endsAt: at("16:00"), bufferAfterMinutes: 0 }] });
    await expect(move(at("14:30"), { allowOutsideHours: true })).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("rejects a walk-in whose service buffer would touch the next booking", async () => {
    mocked.requireOrganizationAction.mockResolvedValueOnce({ role: "RECEPTIONIST" });
    const assignment = { staffProfileId, serviceId: "service_2026_abcdefgh", serviceName: "ფენი", serviceDurationMinutes: 60, serviceBufferBeforeMinutes: 0, serviceBufferAfterMinutes: 15, servicePriceTetri: 5_000, durationOverrideMinutes: null, priceOverrideTetri: null };
    const { db, updates } = tableDb(new Map<unknown, unknown[]>([
      [locations, [{ id: locationId, organizationId, timezone: "Asia/Tbilisi" }]],
      [staffProfiles, [assignment]],
      [workingHourRules, [{ startLocalTime: "10:00:00", endLocalTime: "19:00:00" }]],
      [appointments, [{ ...booked, id: "other_2026_abcdefghij", startsAt: at("09:00"), endsAt: at("10:00") }]],
    ]));
    mocked.db = db;

    await expect(appointmentsRouter.createCaller({ user } as never).createWalkIn({ organizationId, locationId, staffProfileId, serviceId: assignment.serviceId, startsAt: at("08:00") }))
      .rejects.toMatchObject({ code: "CONFLICT", message: "არჩეული დრო უკვე დაკავებულია." });
    expect(updates).toEqual([]);
  });

  it.each(["RECEPTIONIST", "STAFF"])("refuses the hours override for %s before reading any booking", async role => {
    const { db } = setup({ role });
    await expect(move(at("14:30"), { allowOutsideHours: true })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.select).not.toHaveBeenCalled();
  });
});
