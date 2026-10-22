import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({ db: null as unknown, requireOrganizationAction: vi.fn() }));

vi.mock("../db", () => ({ requireDb: vi.fn(async () => mocked.db) }));
vi.mock("../access", () => ({ requireOrganizationAction: mocked.requireOrganizationAction }));
vi.mock("drizzle-orm", async importOriginal => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  const tag = (kind: string) => (...args: unknown[]) => ({ kind, args });
  return { ...actual, and: tag("and"), eq: tag("eq"), desc: tag("desc"), isNull: tag("isNull") };
});

import { aestheticRouter } from "./aesthetic";

/** Does the (tagged) condition tree contain this literal value? */
function mentions(condition: unknown, value: unknown): boolean {
  if (condition === value) return true;
  if (!condition || typeof condition !== "object") return false;
  const args = (condition as { args?: unknown[] }).args;
  return Array.isArray(args) && args.some(arg => mentions(arg, value));
}

/** Thenable query-builder stub: awaiting yields `rows`; call arguments are recorded. */
function chain(rows: unknown[]) {
  const calls: Record<string, any[]> = {};
  const c: any = new Proxy({}, { get: (_t, prop: string) => prop === "then" ? (resolve: (value: unknown) => void) => resolve(rows) : (...args: unknown[]) => { calls[prop] = args; return c; } });
  return { c, calls };
}
/** db whose successive select() calls resolve to the given row sets; transaction() exposes insert/update chains. */
function capture(selects: unknown[][], updateResult: unknown[] = [{ affectedRows: 1 }]) {
  const chains = selects.map(chain);
  const queue = [...chains];
  const inserts: { calls: Record<string, any[]> }[] = [];
  const updates: { calls: Record<string, any[]> }[] = [];
  const tx = {
    insert: vi.fn(() => { const i = chain([]); inserts.push(i); return i.c; }),
    update: vi.fn(() => { const u = chain(updateResult); updates.push(u); return u.c; }),
  };
  const db = { select: vi.fn(() => queue.shift()!.c), transaction: vi.fn(async (callback: (t: typeof tx) => Promise<void>) => callback(tx)) };
  return { db, all: chains, inserts, updates };
}

const user = { id: 5, openId: "injector", role: "user" as const };
const orgId = "organization_0001";
const otherOrgId = "organization_0002";
const clientId = "client_0000000001";
const recordId = "record_00000000001";
const aestheticsOrg = [{ vertical: "AESTHETICS" }];
const clientRow = [{ id: clientId }];
const base = { organizationId: orgId, clientId, procedureName: "Botox" };

beforeEach(() => {
  mocked.requireOrganizationAction.mockReset();
  mocked.requireOrganizationAction.mockResolvedValue({ id: "m1", role: "OWNER" });
});

describe("aesthetic access, vertical gate and org scoping", () => {
  it("requires clinical:view / clinical:write and touches no data when denied", async () => {
    mocked.requireOrganizationAction.mockRejectedValue(Object.assign(new Error("no"), { code: "FORBIDDEN" }));
    const { db } = capture([]);
    mocked.db = db;
    const caller = aestheticRouter.createCaller({ user } as never);
    await expect(caller.list({ organizationId: orgId, clientId })).rejects.toThrow();
    await expect(caller.create(base)).rejects.toThrow();
    await expect(caller.void({ organizationId: orgId, id: recordId, reason: "შეცდომა" })).rejects.toThrow();
    expect(mocked.requireOrganizationAction.mock.calls.map(call => call[2])).toEqual(["clinical:view", "clinical:write", "clinical:write"]);
    expect(db.select).not.toHaveBeenCalled();
  });

  it("is unavailable outside AESTHETICS organizations", async () => {
    for (const vertical of ["SALON", "DENTAL"]) {
      const { db } = capture([[{ vertical }], [{ vertical }], [{ vertical }]]);
      mocked.db = db;
      const caller = aestheticRouter.createCaller({ user } as never);
      await expect(caller.list({ organizationId: orgId, clientId })).rejects.toMatchObject({ code: "FORBIDDEN", message: expect.stringContaining("ესთეტიკური") });
      await expect(caller.create(base)).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller.void({ organizationId: orgId, id: recordId, reason: "შეცდომა" })).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(db.transaction).not.toHaveBeenCalled();
    }
  });

  it("another organization's client, appointment, practitioner or record is NOT_FOUND", async () => {
    const caller = aestheticRouter.createCaller({ user } as never);
    const scoped = capture([aestheticsOrg, []]);
    mocked.db = scoped.db;
    await expect(caller.list({ organizationId: otherOrgId, clientId })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(mentions(scoped.all[1].calls.where[0], otherOrgId)).toBe(true);
    mocked.db = capture([aestheticsOrg, clientRow, []]).db;
    await expect(caller.create({ ...base, appointmentId: "appointment_00001" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    mocked.db = capture([aestheticsOrg, clientRow, []]).db;
    await expect(caller.create({ ...base, staffProfileId: "staff_0000000001" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    mocked.db = capture([aestheticsOrg, []]).db;
    await expect(caller.void({ organizationId: otherOrgId, id: recordId, reason: "შეცდომა" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("STAFF reach clients only through their own appointments", () => {
  const staffMember = { id: "m-staff", role: "STAFF" };
  const ownAppointment = [{ staffProfileId: "staff_profile_01" }];

  it("list is allowed with an own appointment and NOT_FOUND without", async () => {
    mocked.requireOrganizationAction.mockResolvedValue(staffMember);
    const caller = aestheticRouter.createCaller({ user } as never);
    mocked.db = capture([aestheticsOrg, clientRow, ownAppointment, []]).db;
    await expect(caller.list({ organizationId: orgId, clientId })).resolves.toEqual([]);
    mocked.db = capture([aestheticsOrg, clientRow, []]).db;
    await expect(caller.list({ organizationId: orgId, clientId })).rejects.toMatchObject({ code: "NOT_FOUND", message: "კლიენტი ვერ მოიძებნა." });
  });

  it("create defaults staffProfileId to their own profile and writes nothing without an appointment", async () => {
    mocked.requireOrganizationAction.mockResolvedValue(staffMember);
    const caller = aestheticRouter.createCaller({ user } as never);
    const allowed = capture([aestheticsOrg, clientRow, ownAppointment]);
    mocked.db = allowed.db;
    await caller.create(base);
    expect(allowed.inserts[0].calls.values[0]).toMatchObject({ staffProfileId: "staff_profile_01", recordedByUserId: 5 });
    const ownExplicit = capture([aestheticsOrg, clientRow, ownAppointment]);
    mocked.db = ownExplicit.db;
    await caller.create({ ...base, staffProfileId: "staff_profile_01" });
    expect(ownExplicit.inserts[0].calls.values[0]).toMatchObject({ staffProfileId: "staff_profile_01" });

    const denied = capture([aestheticsOrg, clientRow, []]);
    mocked.db = denied.db;
    await expect(caller.create(base)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(denied.db.transaction).not.toHaveBeenCalled();
  });

  it("create cannot name another specialist", async () => {
    mocked.requireOrganizationAction.mockResolvedValue(staffMember);
    const { db } = capture([aestheticsOrg, clientRow, ownAppointment]);
    mocked.db = db;
    await expect(aestheticRouter.createCaller({ user } as never).create({ ...base, staffProfileId: "staff_other_0001" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it("void only works on records of patients they can access", async () => {
    mocked.requireOrganizationAction.mockResolvedValue(staffMember);
    const caller = aestheticRouter.createCaller({ user } as never);
    const ok = capture([aestheticsOrg, [{ id: recordId, clientId, voidedAt: null }], ownAppointment]);
    mocked.db = ok.db;
    await expect(caller.void({ organizationId: orgId, id: recordId, reason: "შეცდომა" })).resolves.toEqual({ success: true });
    const denied = capture([aestheticsOrg, [{ id: recordId, clientId, voidedAt: null }], []]);
    mocked.db = denied.db;
    await expect(caller.void({ organizationId: orgId, id: recordId, reason: "შეცდომა" })).rejects.toMatchObject({ code: "NOT_FOUND", message: "ჩანაწერი ვერ მოიძებნა." });
    expect(denied.db.transaction).not.toHaveBeenCalled();
  });

  it("OWNER and MANAGER keep any practitioner and skip the appointment check; RECEPTIONIST has no clinical action", async () => {
    for (const role of ["OWNER", "MANAGER"]) {
      mocked.requireOrganizationAction.mockResolvedValue({ id: "m1", role });
      const { db, inserts } = capture([aestheticsOrg, clientRow, [{ id: "staff_other_0001" }]]);
      mocked.db = db;
      await aestheticRouter.createCaller({ user } as never).create({ ...base, staffProfileId: "staff_other_0001" });
      expect(inserts[0].calls.values[0]).toMatchObject({ staffProfileId: "staff_other_0001" });
      expect(db.select).toHaveBeenCalledTimes(3);
    }
    const { roleCan } = await vi.importActual<typeof import("../access")>("../access");
    expect(roleCan("RECEPTIONIST", "clinical:view")).toBe(false);
    expect(roleCan("RECEPTIONIST", "clinical:write")).toBe(false);
  });
});

describe("aesthetic.create", () => {
  it("stores the dose as integer hundredths with its unit, plus an audit row without clinical content", async () => {
    const { db, inserts } = capture([aestheticsOrg, clientRow]);
    mocked.db = db;
    const performedAt = new Date("2026-03-01T10:00:00.000Z");
    const result = await aestheticRouter.createCaller({ user } as never).create({ ...base, performedAt, productName: "Dysport", batchNumber: "B123", productExpiry: "2027-05-31", doseHundredths: 1250, doseUnit: "UNITS", treatmentAreas: "შუბლი", notes: "" });
    const values = inserts[0].calls.values[0];
    expect(values).toMatchObject({ id: result.id, organizationId: orgId, clientId, performedAt, productExpiry: "2027-05-31", doseHundredths: 1250, doseUnit: "UNITS", notes: null, recordedByUserId: 5 });
    expect(Number.isInteger(values.doseHundredths)).toBe(true);
    expect(inserts[1].calls.values[0]).toMatchObject({ action: "AESTHETIC_PROCEDURE_RECORDED", entityId: result.id });
    expect(JSON.stringify(inserts[1].calls.values[0])).not.toContain("Dysport");
  });

  it("rejects fractional doses, a dose without a unit, bad dates and over-long text", async () => {
    mocked.db = capture([]).db;
    const caller = aestheticRouter.createCaller({ user } as never);
    await expect(caller.create({ ...base, doseHundredths: 12.5, doseUnit: "UNITS" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.create({ ...base, doseHundredths: 1250 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.create({ ...base, doseUnit: "ML" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.create({ ...base, productExpiry: "2027-02-30" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.create({ ...base, procedureName: "x".repeat(161) })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.create({ ...base, batchNumber: "x".repeat(81) })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.create({ ...base, treatmentAreas: "x".repeat(501) })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.create({ ...base, notes: "x".repeat(2001) })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("aesthetic.list", () => {
  it("includes voided records, flagged", async () => {
    const row = (id: string, voidedAt: Date | null) => ({ id, voidedAt, voidReason: voidedAt ? "შეცდომა" : null, recordedByName: "ნინო" });
    mocked.db = capture([aestheticsOrg, clientRow, [row("a", null), row("b", new Date())]]).db;
    const rows = await aestheticRouter.createCaller({ user } as never).list({ organizationId: orgId, clientId });
    expect(rows.map(r => r.isVoided)).toEqual([false, true]);
  });
});

describe("aesthetic.void", () => {
  it("requires a reason", async () => {
    mocked.db = capture([]).db;
    const caller = aestheticRouter.createCaller({ user } as never);
    await expect(caller.void({ organizationId: orgId, id: recordId, reason: "" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.void({ organizationId: orgId, id: recordId, reason: "   " })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.void({ organizationId: orgId, id: recordId, reason: "x".repeat(301) })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("voids once: sets voidedAt/by/reason, audits, and keeps the content", async () => {
    const { db, updates, inserts } = capture([aestheticsOrg, [{ id: recordId, clientId, voidedAt: null }]]);
    mocked.db = db;
    await expect(aestheticRouter.createCaller({ user } as never).void({ organizationId: orgId, id: recordId, reason: "  არასწორი პროდუქტი " })).resolves.toEqual({ success: true });
    const set = updates[0].calls.set[0];
    expect(Object.keys(set).sort()).toEqual(["voidReason", "voidedAt", "voidedByUserId"]);
    expect(set).toMatchObject({ voidedByUserId: 5, voidReason: "არასწორი პროდუქტი" });
    expect(inserts[0].calls.values[0]).toMatchObject({ action: "AESTHETIC_PROCEDURE_VOIDED", entityId: recordId });
  });

  it("cannot void twice (already voided, or lost the race)", async () => {
    const already = capture([aestheticsOrg, [{ id: recordId, clientId, voidedAt: new Date() }]]);
    mocked.db = already.db;
    await expect(aestheticRouter.createCaller({ user } as never).void({ organizationId: orgId, id: recordId, reason: "შეცდომა" })).rejects.toMatchObject({ code: "CONFLICT" });
    expect(already.db.transaction).not.toHaveBeenCalled();

    const raced = capture([aestheticsOrg, [{ id: recordId, clientId, voidedAt: null }]], [{ affectedRows: 0 }]);
    mocked.db = raced.db;
    await expect(aestheticRouter.createCaller({ user } as never).void({ organizationId: orgId, id: recordId, reason: "შეცდომა" })).rejects.toMatchObject({ code: "CONFLICT" });
    expect(raced.inserts).toHaveLength(0);
  });

  it("the router has no edit or delete procedure", () => {
    expect(Object.keys((aestheticRouter as any)._def.procedures).sort()).toEqual(["create", "list", "void"]);
  });
});
