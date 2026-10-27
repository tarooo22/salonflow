import { describe, expect, it, vi, beforeEach } from "vitest";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import type { SQL } from "drizzle-orm";

const mocked = vi.hoisted(() => ({ db: null as unknown, role: "RECEPTIONIST" as "OWNER" | "MANAGER" | "RECEPTIONIST" | "STAFF", actions: [] as string[] }));

vi.mock("../db", () => ({ requireDb: vi.fn(async () => mocked.db) }));
vi.mock("../access", async () => {
  const { TRPCError } = await import("@trpc/server");
  const ROLE_ACTIONS: Record<string, string[]> = {
    OWNER: ["payments:record"], MANAGER: ["payments:record"], RECEPTIONIST: ["payments:record"], STAFF: ["calendar:own"],
  };
  return {
    requireOrganizationRole: vi.fn(),
    requireOrganizationAction: vi.fn(async (_user: unknown, _organizationId: string, action: string) => {
      mocked.actions.push(action);
      if (!ROLE_ACTIONS[mocked.role].includes(action)) throw new TRPCError({ code: "FORBIDDEN", message: "ამ მოქმედებისთვის წვდომა არ გაქვთ" });
      return { role: mocked.role };
    }),
  };
});

import type { ROLE_ACTIONS } from "../access";
import { paymentsRouter } from "./payments";

const ids = { organizationId: "organization_001", appointmentId: "appointment_0001" };
const user = { id: 7, role: "user" as const };
const dialect = new MySqlDialect();

type Payment = { id: string; appointmentId: string; amountTetri: number; refundedTetri: number; status: "PAID" | "PENDING" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED"; method: string; externalReference: string | null };

/** Minimal in-memory db: one appointment row, a mutable payments list, and a record of lock/where calls. */
function createDb(appointment: { id: string; organizationId: string; status: string; totalTetri: number } | null, payments: Payment[] = []) {
  const wheres: SQL[] = [];
  const locks: string[] = [];
  const inserted: Array<{ table: string; values: Record<string, unknown> }> = [];
  const tableName = (table: unknown) => (table as Record<symbol, string>)[Symbol.for("drizzle:Name")];
  const tx = {
    select: vi.fn(() => ({
      from: (table: unknown) => ({
        where: (where: SQL) => {
          wheres.push(where);
          const name = tableName(table);
          const rows = () => name === "appointments"
            ? (appointment && dialect.sqlToQuery(where).params.includes(appointment.organizationId) ? [appointment] : [])
            : payments.map(payment => ({ ...payment }));
          return {
            limit: () => ({ for: async (mode: string) => { locks.push(`${name}:${mode}`); return rows(); } }),
            for: async (mode: string) => { locks.push(`${name}:${mode}`); return rows(); },
          };
        },
      }),
    })),
    insert: vi.fn((table: unknown) => ({
      values: vi.fn(async (values: Record<string, unknown>) => {
        inserted.push({ table: tableName(table), values });
        if (tableName(table) === "payments") payments.push(values as Payment);
      }),
    })),
  };
  return { transaction: vi.fn(async (callback: (t: typeof tx) => Promise<unknown>) => callback(tx)), tx, wheres, locks, inserted, payments };
}

const caller = () => paymentsRouter.createCaller({ user } as never);
const input = (overrides: Partial<{ organizationId: string; amountTetri: number; idempotencyKey: string; method: "CASH" | "CARD_TERMINAL" | "BANK_TRANSFER" }> = {}) => ({
  organizationId: ids.organizationId, appointmentId: ids.appointmentId, amountTetri: 3_000, method: "CASH" as const, idempotencyKey: "key_0000000000000001", ...overrides,
});

describe("payments.recordForAppointment", () => {
  beforeEach(() => { mocked.role = "RECEPTIONIST"; mocked.actions = []; });

  it("records a PAID payment with server-set fields, locks the appointment and writes an audit log", async () => {
    const db = createDb({ id: ids.appointmentId, organizationId: ids.organizationId, status: "COMPLETED", totalTetri: 5_000 });
    mocked.db = db;

    const result = await caller().recordForAppointment({ ...input(), note: "ნაწილობრივ" });

    expect(mocked.actions).toEqual(["payments:record"]);
    expect(db.locks).toEqual(["appointments:update", "payments:update"]);
    expect(result).toMatchObject({ replayed: false, amountTetri: 3_000, collectedTetri: 3_000, balanceTetri: 2_000 });
    const payment = db.inserted.find(row => row.table === "payments")!.values;
    expect(payment).toMatchObject({ appointmentId: ids.appointmentId, amountTetri: 3_000, refundedTetri: 0, status: "PAID", method: "CASH", collectedByUserId: 7, notes: "ნაწილობრივ", externalReference: "idem:key_0000000000000001" });
    expect(payment.collectedAt).toBeInstanceOf(Date);
    expect(db.inserted.find(row => row.table === "audit_logs")?.values).toMatchObject({ organizationId: ids.organizationId, action: "APPOINTMENT_PAYMENT_RECORDED", entityId: payment.id });
  });

  it("sums partial payments and closes the balance exactly", async () => {
    const db = createDb({ id: ids.appointmentId, organizationId: ids.organizationId, status: "IN_SERVICE", totalTetri: 5_000 }, [
      { id: "p1", appointmentId: ids.appointmentId, amountTetri: 1_000, refundedTetri: 0, status: "PAID", method: "CASH", externalReference: null },
      { id: "p2", appointmentId: ids.appointmentId, amountTetri: 900, refundedTetri: 0, status: "FAILED", method: "CARD_TERMINAL", externalReference: null },
    ]);
    mocked.db = db;

    const first = await caller().recordForAppointment(input({ amountTetri: 1_500, idempotencyKey: "key_0000000000000002", method: "CARD_TERMINAL" }));
    expect(first).toMatchObject({ collectedTetri: 2_500, balanceTetri: 2_500 });
    const second = await caller().recordForAppointment(input({ amountTetri: 2_500, idempotencyKey: "key_0000000000000003", method: "BANK_TRANSFER" }));
    expect(second).toMatchObject({ collectedTetri: 5_000, balanceTetri: 0 });

    await expect(caller().recordForAppointment(input({ amountTetri: 1, idempotencyKey: "key_0000000000000004" }))).rejects.toThrow("ეს ვიზიტი უკვე სრულად არის გადახდილი.");
  });

  it("rejects an amount above the remaining balance without writing", async () => {
    const db = createDb({ id: ids.appointmentId, organizationId: ids.organizationId, status: "COMPLETED", totalTetri: 5_000 }, [
      { id: "p1", appointmentId: ids.appointmentId, amountTetri: 4_000, refundedTetri: 0, status: "PAID", method: "CASH", externalReference: null },
    ]);
    mocked.db = db;

    await expect(caller().recordForAppointment(input({ amountTetri: 1_001 }))).rejects.toThrow("თანხა აღემატება დარჩენილ დავალიანებას.");
    expect(db.tx.insert).not.toHaveBeenCalled();
  });

  it("replays the same idempotency key without a second insert", async () => {
    const db = createDb({ id: ids.appointmentId, organizationId: ids.organizationId, status: "COMPLETED", totalTetri: 5_000 });
    mocked.db = db;

    const first = await caller().recordForAppointment(input({ amountTetri: 5_000 }));
    const replay = await caller().recordForAppointment(input({ amountTetri: 5_000 }));

    expect(replay).toMatchObject({ replayed: true, paymentId: first.paymentId, amountTetri: 5_000, balanceTetri: 0 });
    expect(db.payments).toHaveLength(1);
    expect(db.inserted.filter(row => row.table === "payments")).toHaveLength(1);
  });

  it.each(["CANCELLED", "NO_SHOW"])("rejects a %s visit", async status => {
    const db = createDb({ id: ids.appointmentId, organizationId: ids.organizationId, status, totalTetri: 5_000 });
    mocked.db = db;

    await expect(caller().recordForAppointment(input())).rejects.toThrow("გაუქმებულ ან გამოუცხადებელ ვიზიტზე გადახდის მიღება შეუძლებელია.");
    expect(db.tx.insert).not.toHaveBeenCalled();
  });

  it("scopes the appointment lookup to the organization (another org's visit is not found)", async () => {
    const db = createDb({ id: ids.appointmentId, organizationId: "other_organization", status: "COMPLETED", totalTetri: 5_000 });
    mocked.db = db;

    await expect(caller().recordForAppointment(input())).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(dialect.sqlToQuery(db.wheres[0]!).params).toEqual(expect.arrayContaining([ids.appointmentId, ids.organizationId]));
    expect(db.tx.insert).not.toHaveBeenCalled();
  });

  it("rejects STAFF and keeps payments:record off the STAFF role", async () => {
    mocked.role = "STAFF";
    const db = createDb({ id: ids.appointmentId, organizationId: ids.organizationId, status: "COMPLETED", totalTetri: 5_000 });
    mocked.db = db;

    await expect(caller().recordForAppointment(input())).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.transaction).not.toHaveBeenCalled();
    const actual = await vi.importActual<{ ROLE_ACTIONS: typeof ROLE_ACTIONS }>("../access");
    expect(actual.ROLE_ACTIONS.STAFF.has("payments:record")).toBe(false);
    expect(["OWNER", "MANAGER", "RECEPTIONIST"].every(role => actual.ROLE_ACTIONS[role as "OWNER"].has("payments:record"))).toBe(true);
  });

  it("rejects unsupported methods and non-positive or fractional amounts at the schema", async () => {
    mocked.db = createDb({ id: ids.appointmentId, organizationId: ids.organizationId, status: "COMPLETED", totalTetri: 5_000 });
    await expect(caller().recordForAppointment({ ...input(), method: "ONLINE" } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller().recordForAppointment(input({ amountTetri: 0 }))).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller().recordForAppointment(input({ amountTetri: 10.5 }))).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
