import { describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({ db: null as unknown, nanoid: vi.fn(() => "trial_audit_001"), getTrialRequestForUser: vi.fn() }));

vi.mock("../db", () => ({ requireDb: vi.fn(async () => mocked.db) }));
vi.mock("nanoid", () => ({ nanoid: mocked.nanoid }));
vi.mock("../lib/trialAccess", () => ({ getTrialRequestForUser: mocked.getTrialRequestForUser }));

import { trialAccessRouter } from "./trialAccess";

const applicant = { id: 90, openId: "trial-applicant", name: "Applicant", email: "applicant@example.com", role: "user" as const };
const admin = { id: 1, openId: "platform-admin", name: "Admin", email: "admin@example.com", role: "admin" as const };

function createPendingDb() {
  const values = vi.fn(async () => undefined);
  const updateWhere = vi.fn(async () => undefined);
  const updateSet = vi.fn(() => ({ where: updateWhere }));
  const update = vi.fn(() => ({ set: updateSet }));
  const transaction = vi.fn(async (callback: (tx: { update: typeof update; insert: () => { values: typeof values } }) => Promise<void>) => callback({ update, insert: () => ({ values }) }));
  const pendingRequest = { id: "trial_pending_001", userId: applicant.id, requestedSalonName: "Test Salon", requestedSalonSlug: "test-salon", status: "PENDING" as const, expiresAt: null };
  const select = vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(async () => [pendingRequest]) })) })) }));
  return { select, transaction, update, values };
}

function createRequestDb(queryRows: unknown[][]) {
  const values = vi.fn(async () => undefined);
  const select = vi.fn(() => {
    const rows = queryRows.shift() ?? [];
    return { from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(async () => rows) })) })) };
  });
  const transaction = vi.fn(async (callback: (tx: { insert: () => { values: typeof values } }) => Promise<void>) => callback({ insert: () => ({ values }) }));
  return { select, transaction, values };
}

describe("trialAccess admin router", () => {
  it("accepts an unused salon code instead of treating empty conflict query arrays as a collision", async () => {
    mocked.getTrialRequestForUser.mockResolvedValueOnce(undefined);
    const db = createRequestDb([[], [], []]);
    mocked.db = db;
    await expect(trialAccessRouter.createCaller({ user: applicant } as never).request({ salonName: "Tamo Salon", salonSlug: "tamoo-2026" })).resolves.toEqual({ requestId: "trial_audit_001", alreadyApproved: false });
    expect(db.transaction).toHaveBeenCalledTimes(1);
    expect(db.values).toHaveBeenCalledWith(expect.objectContaining({ userId: applicant.id, requestedSalonName: "Tamo Salon", requestedSalonSlug: "tamoo-2026", status: "PENDING" }));
  });

  it("keeps the collision message only when an organization or public booking slug actually exists", async () => {
    const db = createRequestDb([[], [{ id: "existing_org" }], []]);
    mocked.db = db;
    await expect(trialAccessRouter.createCaller({ user: applicant } as never).request({ salonName: "Tamo Salon", salonSlug: "taken-code" })).rejects.toMatchObject({ code: "CONFLICT", message: "სალონის ეს კოდი უკვე გამოყენებულია. აირჩიეთ სხვა კოდი." });
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it("denies the queue to a salon user before any database access", async () => {
    mocked.db = { select: vi.fn() };
    await expect(trialAccessRouter.createCaller({ user: applicant } as never).adminList({ limit: 25, offset: 0, status: "PENDING" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect((mocked.db as { select: ReturnType<typeof vi.fn> }).select).not.toHaveBeenCalled();
  });

  it("gives platform admin approval exactly seven days and writes an audit event", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-25T10:00:00.000Z"));
    const db = createPendingDb();
    mocked.db = db;
    const result = await trialAccessRouter.createCaller({ user: admin } as never).adminDecide({ trialRequestId: "trial_pending_001", decision: "APPROVE", reviewNoteKa: "Facebook-ზე კონტაქტი დადასტურდა." });
    expect(result).toEqual({ status: "APPROVED", expiresAt: new Date("2026-09-01T10:00:00.000Z") });
    expect(db.update).toHaveBeenCalledTimes(1);
    expect(db.values).toHaveBeenCalledWith(expect.objectContaining({ trialRequestId: "trial_pending_001", eventType: "APPROVED_7_DAY_TRIAL", actorUserId: admin.id, metadata: { expiresAt: "2026-09-01T10:00:00.000Z" } }));
    vi.useRealTimers();
  });
});
