import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({ db: null as unknown, requireOrganizationAction: vi.fn() }));

vi.mock("../db", () => ({ requireDb: vi.fn(async () => mocked.db) }));
vi.mock("../access", () => ({ requireOrganizationAction: mocked.requireOrganizationAction }));
vi.mock("drizzle-orm", async importOriginal => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  const tag = (kind: string) => (...args: unknown[]) => ({ kind, args });
  return { ...actual, and: tag("and"), eq: tag("eq"), desc: tag("desc"), inArray: tag("inArray") };
});

import { dentalToothRecords } from "../../drizzle/schema";
import { isValidToothCode, toothSurfacesSchema } from "../../shared/validation";
import { dentalRouter, latestPerTooth } from "./dental";

type Tagged = { kind: string; args: unknown[] };
function has(condition: unknown, kind: string, ...lead: unknown[]): boolean {
  if (!condition || typeof condition !== "object") return false;
  const node = condition as Tagged;
  if (node.kind === kind && lead.every((value, index) => node.args[index] === value)) return true;
  return Array.isArray(node.args) && node.args.some(arg => has(arg, kind, ...lead));
}

/** Does the (tagged) condition tree contain this literal value? */
function mentions(condition: unknown, value: unknown): boolean {
  if (condition === value) return true;
  if (Array.isArray(condition)) return condition.some(item => mentions(item, value));
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
/** db whose successive select() calls resolve to the given row sets; transaction() exposes insert chains. */
function capture(selects: unknown[][]) {
  const chains = selects.map(chain);
  const queue = [...chains];
  const inserts: { calls: Record<string, any[]> }[] = [];
  const tx = { insert: vi.fn(() => { const i = chain([]); inserts.push(i); return i.c; }) };
  const db = { select: vi.fn(() => queue.shift()!.c), transaction: vi.fn(async (callback: (t: typeof tx) => Promise<void>) => callback(tx)) };
  return { db, all: chains, inserts };
}

const user = { id: 5, openId: "dentist", role: "user" as const };
const orgId = "organization_0001";
const otherOrgId = "organization_0002";
const clientId = "client_0000000001";
const dentalOrg = [{ vertical: "DENTAL" }];
const clientRow = [{ id: clientId }];

beforeEach(() => {
  mocked.requireOrganizationAction.mockReset();
  mocked.requireOrganizationAction.mockResolvedValue({ id: "m1", role: "OWNER" });
});

describe("FDI tooth code and surface validation", () => {
  it("accepts every permanent and primary tooth and nothing else", () => {
    const permanent = [1, 2, 3, 4].flatMap(q => [1, 2, 3, 4, 5, 6, 7, 8].map(p => `${q}${p}`));
    const primary = [5, 6, 7, 8].flatMap(q => [1, 2, 3, 4, 5].map(p => `${q}${p}`));
    expect(permanent).toHaveLength(32);
    expect(primary).toHaveLength(20);
    [...permanent, ...primary].forEach(code => expect(isValidToothCode(code)).toBe(true));
    for (const bad of ["10", "19", "09", "56", "66", "76", "86", "49", "90", "1", "111", "A1", "", "5 "]) expect(isValidToothCode(bad)).toBe(false);
  });

  it("normalises surfaces to MODBL order, rejects unknown or repeated ones", () => {
    expect(toothSurfacesSchema.parse("dom")).toBe("MOD");
    expect(toothSurfacesSchema.parse("")).toBeUndefined();
    expect(toothSurfacesSchema.safeParse("MX").success).toBe(false);
    expect(toothSurfacesSchema.safeParse("MM").success).toBe(false);
    expect(toothSurfacesSchema.safeParse("MODBLL").success).toBe(false);
  });
});

describe("latestPerTooth", () => {
  it("keeps only the newest entry of each tooth, ordered by tooth code", () => {
    const rows = [
      { id: "c", toothCode: "36", condition: "CROWN" },
      { id: "b", toothCode: "11", condition: "FILLED" },
      { id: "a", toothCode: "36", condition: "CARIES" },
      { id: "z", toothCode: "11", condition: "HEALTHY" },
    ];
    expect(latestPerTooth(rows).map(row => row.id)).toEqual(["b", "c"]);
  });
});

describe("dental access, vertical gate and org scoping", () => {
  it("requires clinical:view / clinical:write and touches no data when denied", async () => {
    mocked.requireOrganizationAction.mockRejectedValue(Object.assign(new Error("no"), { code: "FORBIDDEN" }));
    const { db } = capture([]);
    mocked.db = db;
    const caller = dentalRouter.createCaller({ user } as never);
    await expect(caller.chart({ organizationId: orgId, clientId })).rejects.toThrow();
    await expect(caller.record({ organizationId: orgId, clientId, toothCode: "11", condition: "CARIES" })).rejects.toThrow();
    expect(mocked.requireOrganizationAction).toHaveBeenNthCalledWith(1, user, orgId, "clinical:view");
    expect(mocked.requireOrganizationAction).toHaveBeenNthCalledWith(2, user, orgId, "clinical:write");
    expect(db.select).not.toHaveBeenCalled();
  });

  it("is unavailable outside DENTAL organizations (Georgian FORBIDDEN)", async () => {
    for (const vertical of ["SALON", "AESTHETICS"]) {
      const { db, inserts } = capture([[{ vertical }]]);
      mocked.db = db;
      await expect(dentalRouter.createCaller({ user } as never).chart({ organizationId: orgId, clientId })).rejects.toMatchObject({ code: "FORBIDDEN", message: expect.stringContaining("სტომატოლოგიური") });
      expect(inserts).toHaveLength(0);
    }
    const { db } = capture([[{ vertical: "SALON" }]]);
    mocked.db = db;
    await expect(dentalRouter.createCaller({ user } as never).record({ organizationId: orgId, clientId, toothCode: "11", condition: "CARIES" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it("another organization's client is NOT_FOUND, and the lookup is scoped by organizationId", async () => {
    const { db, all } = capture([dentalOrg, []]);
    mocked.db = db;
    await expect(dentalRouter.createCaller({ user } as never).toothHistory({ organizationId: otherOrgId, clientId, toothCode: "26" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(mentions(all[1].calls.where[0], otherOrgId)).toBe(true);
  });

  it("rejects an invalid tooth code, surface or note before touching data", async () => {
    const { db } = capture([]);
    mocked.db = db;
    const caller = dentalRouter.createCaller({ user } as never);
    await expect(caller.record({ organizationId: orgId, clientId, toothCode: "19", condition: "CARIES" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.record({ organizationId: orgId, clientId, toothCode: "11", surfaces: "MX", condition: "CARIES" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.record({ organizationId: orgId, clientId, toothCode: "11", condition: "CARIES", note: "x".repeat(1001) })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(db.select).not.toHaveBeenCalled();
  });
});

describe("STAFF reach patients only through their own appointments", () => {
  const staffMember = { id: "m-staff", role: "STAFF" };
  const ownAppointment = [{ staffProfileId: "staff_profile_01" }];

  it("allows chart, toothHistory and record when the specialist has a accepted appointment with the patient", async () => {
    mocked.requireOrganizationAction.mockResolvedValue(staffMember);
    const { db, all } = capture([dentalOrg, clientRow, ownAppointment, []]);
    mocked.db = db;
    await expect(dentalRouter.createCaller({ user } as never).chart({ organizationId: orgId, clientId })).resolves.toEqual([]);
    const where = all[2].calls.where[0];
    expect(mentions(where, "m-staff")).toBe(true);
    expect(mentions(where, orgId)).toBe(true);
    expect(mentions(where, clientId)).toBe(true);
    // Only accepted visits count (a PENDING public booking must not unlock records), and only an active profile.
    expect(mentions(where, "CONFIRMED")).toBe(true);
    expect(mentions(where, "PENDING")).toBe(false);
    expect(mentions(where, "ACTIVE")).toBe(true);

    mocked.db = capture([dentalOrg, clientRow, ownAppointment, []]).db;
    await expect(dentalRouter.createCaller({ user } as never).toothHistory({ organizationId: orgId, clientId, toothCode: "11" })).resolves.toEqual([]);
    const writer = capture([dentalOrg, clientRow, ownAppointment, []]);
    mocked.db = writer.db;
    await expect(dentalRouter.createCaller({ user } as never).record({ organizationId: orgId, clientId, toothCode: "11", condition: "CARIES" })).resolves.toHaveProperty("id");
  });

  it("is NOT_FOUND (same as a foreign client) without such an appointment, and nothing is read or written", async () => {
    mocked.requireOrganizationAction.mockResolvedValue(staffMember);
    const caller = dentalRouter.createCaller({ user } as never);
    for (const call of [
      () => caller.chart({ organizationId: orgId, clientId }),
      () => caller.toothHistory({ organizationId: orgId, clientId, toothCode: "11" }),
      () => caller.record({ organizationId: orgId, clientId, toothCode: "11", condition: "CARIES" }),
    ]) {
      const { db } = capture([dentalOrg, clientRow, []]);
      mocked.db = db;
      await expect(call()).rejects.toMatchObject({ code: "NOT_FOUND", message: "პაციენტი ვერ მოიძებნა." });
      expect(db.select).toHaveBeenCalledTimes(3);
      expect(db.transaction).not.toHaveBeenCalled();
    }
  });

  it("OWNER and MANAGER skip the appointment check", async () => {
    for (const role of ["OWNER", "MANAGER"]) {
      mocked.requireOrganizationAction.mockResolvedValue({ id: "m1", role });
      const { db } = capture([dentalOrg, clientRow, []]);
      mocked.db = db;
      await expect(dentalRouter.createCaller({ user } as never).chart({ organizationId: orgId, clientId })).resolves.toEqual([]);
      expect(db.select).toHaveBeenCalledTimes(3);
    }
  });

  it("RECEPTIONIST has no clinical action", async () => {
    const { roleCan } = await vi.importActual<typeof import("../access")>("../access");
    expect(roleCan("RECEPTIONIST", "clinical:view")).toBe(false);
    expect(roleCan("RECEPTIONIST", "clinical:write")).toBe(false);
    expect(roleCan("STAFF", "clinical:view")).toBe(true);
  });
});

describe("dental.chart / toothHistory / record", () => {
  it("chart returns the latest entry per tooth, scoped by organization and client", async () => {
    const entry = (id: string, toothCode: string, condition: string) => ({ id, toothCode, condition, surfaces: null, note: null, appointmentId: null, recordedAt: new Date() });
    const { db, all } = capture([dentalOrg, clientRow, [entry("2", "36", "CROWN"), entry("1", "36", "CARIES"), entry("3", "11", "FILLED")]]);
    mocked.db = db;
    const result = await dentalRouter.createCaller({ user } as never).chart({ organizationId: orgId, clientId });
    expect(result.map(row => `${row.toothCode}:${row.condition}`)).toEqual(["11:FILLED", "36:CROWN"]);
    expect(has(all[2].calls.where[0], "eq", dentalToothRecords.organizationId, orgId)).toBe(true);
    expect(has(all[2].calls.where[0], "eq", dentalToothRecords.clientId, clientId)).toBe(true);
  });

  it("toothHistory is newest first and includes the recorder name", async () => {
    const { db, all } = capture([dentalOrg, clientRow, [{ id: "2", recordedByName: "ნინო" }]]);
    mocked.db = db;
    const rows = await dentalRouter.createCaller({ user } as never).toothHistory({ organizationId: orgId, clientId, toothCode: "36" });
    expect(rows[0].recordedByName).toBe("ნინო");
    expect(has(all[2].calls.where[0], "eq", dentalToothRecords.toothCode, "36")).toBe(true);
    expect(has(all[2].calls.orderBy[0], "desc", dentalToothRecords.recordedAt)).toBe(true);
  });

  it("record appends a normalised entry plus an audit row; the router has no update or delete", async () => {
    const { db, inserts } = capture([dentalOrg, clientRow, []]);
    mocked.db = db;
    const result = await dentalRouter.createCaller({ user } as never).record({ organizationId: orgId, clientId, toothCode: "36", surfaces: "dom", condition: "FILLED", note: "  composite  " });
    expect(result.id).toHaveLength(21);
    const values = inserts[0].calls.values[0];
    expect(values).toMatchObject({ organizationId: orgId, clientId, toothCode: "36", surfaces: "MOD", condition: "FILLED", note: "composite", appointmentId: null, recordedByUserId: 5 });
    expect(inserts[1].calls.values[0]).toMatchObject({ action: "DENTAL_TOOTH_RECORDED", entityId: values.id });
    expect(JSON.stringify(inserts[1].calls.values[0])).not.toContain("composite");
    expect(Object.keys((dentalRouter as any)._def.procedures).sort()).toEqual(["chart", "record", "toothHistory"]);
  });

  it("record keeps recordedAt strictly after the tooth's previous entry (1-second timestamps)", async () => {
    const previous = new Date(Date.now() + 60_000);
    const { db, inserts } = capture([dentalOrg, clientRow, [{ recordedAt: previous }]]);
    mocked.db = db;
    await dentalRouter.createCaller({ user } as never).record({ organizationId: orgId, clientId, toothCode: "36", condition: "CROWN" });
    expect(inserts[0].calls.values[0].recordedAt.getTime()).toBe(previous.getTime() + 1000);
  });

  it("an appointment of another client or organization is NOT_FOUND", async () => {
    const { db } = capture([dentalOrg, clientRow, []]);
    mocked.db = db;
    await expect(dentalRouter.createCaller({ user } as never).record({ organizationId: orgId, clientId, toothCode: "11", condition: "CARIES", appointmentId: "appointment_00001" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(db.transaction).not.toHaveBeenCalled();
  });
});
