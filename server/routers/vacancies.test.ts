import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({ db: null as unknown, requireOrganizationRole: vi.fn() }));

vi.mock("../db", () => ({ requireDb: vi.fn(async () => mocked.db) }));
vi.mock("../access", () => ({ requireOrganizationRole: mocked.requireOrganizationRole }));
vi.mock("drizzle-orm", async importOriginal => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  const tag = (kind: string) => (...args: unknown[]) => ({ kind, args });
  return { ...actual, and: tag("and"), or: tag("or"), not: tag("not"), eq: tag("eq"), gt: tag("gt"), like: tag("like"), isNull: tag("isNull"), desc: tag("desc"), asc: tag("asc") };
});

import { locationMarketplaceProfiles, vacancies } from "../../drizzle/schema";
import { vacanciesRouter } from "./vacancies";

type Tagged = { kind: string; args: unknown[] };
/** Does the (nested) condition contain `kind(args...)` whose leading args match? */
function has(condition: unknown, kind: string, ...lead: unknown[]): boolean {
  if (!condition || typeof condition !== "object") return false;
  const node = condition as Tagged;
  if (node.kind === kind && lead.every((value, index) => node.args[index] === value)) return true;
  return Array.isArray(node.args) && node.args.some(arg => has(arg, kind, ...lead));
}

/** Thenable query-builder stub: every method returns itself, awaiting yields `rows`; arguments are recorded. */
function chain(rows: unknown[]) {
  const calls: Record<string, any[]> = {};
  const c: any = new Proxy({}, { get: (_t, prop: string) => prop === "then" ? (resolve: (value: unknown) => void) => resolve(rows) : (...args: unknown[]) => { calls[prop] = args; return c; } });
  return { c, calls };
}
/** db whose successive select() calls resolve to the given row sets. */
function capture(selects: unknown[][]) {
  const chains = selects.map(chain);
  const queue = [...chains];
  const select = vi.fn(() => queue.shift()!.c);
  const insertChain = chain([]);
  const updateChain = chain([]);
  return { db: { select, insert: vi.fn(() => insertChain.c), update: vi.fn(() => updateChain.c) }, all: chains, insertChain, updateChain };
}

const user = { id: 5, openId: "owner", role: "user" as const };
const admin = { id: 1, openId: "admin", role: "admin" as const };
const orgId = "organization_0001";
const otherOrgId = "organization_0002";
const vacancyId = "vacancy_000000001";
const locationId = "location_00000001";
const future = new Date(Date.now() + 86_400_000);
const past = new Date(Date.now() - 86_400_000);

const publicRow = (overrides: Record<string, unknown> = {}) => ({
  id: vacancyId, title: "სტილისტი", roleCategory: "hair", employmentType: "FULL_TIME", salaryFromTetri: null, salaryToTetri: null,
  contactPhone: "555123456", contactEmail: null, publishedAt: new Date(), expiresAt: future, vipUntil: null,
  businessName: "სალონი", locationName: "ვაკე", locationPublicSlug: "salon-vake", areaLabelKa: "ვაკე", coverImageKey: null, description: "აღწერა", ...overrides,
});

const createInput = { organizationId: orgId, locationId, title: "სტილისტი", employmentType: "FULL_TIME" as const, description: "ვეძებთ გამოცდილ სტილისტს", contactPhone: "555123456" };

beforeEach(() => {
  mocked.requireOrganizationRole.mockReset();
  mocked.requireOrganizationRole.mockResolvedValue({ id: "m1", role: "OWNER" });
});

describe("vacancies public listing", () => {
  it("lists only published, unexpired vacancies of approved locations, VIP first, without internal ids", async () => {
    const { db, all } = capture([[publicRow({ vipUntil: future }), publicRow({ id: "vacancy_000000002", vipUntil: past })]]);
    mocked.db = db;
    const result = await vacanciesRouter.createCaller({ user: null } as never).publicList({ limit: 24, offset: 0 });
    const calls = all[0].calls;
    expect(has(calls.where[0], "eq", vacancies.status, "PUBLISHED")).toBe(true);
    expect(has(calls.where[0], "gt", vacancies.expiresAt)).toBe(true);
    expect(has(calls.where[0], "eq", locationMarketplaceProfiles.status, "APPROVED")).toBe(true);
    expect(calls.orderBy).toHaveLength(3); // VIP CASE, publishedAt desc, id desc
    expect(result.items.map(item => item.isVip)).toEqual([true, false]);
    expect(result.items[0]).not.toHaveProperty("organizationId");
    expect(result.items[0]).not.toHaveProperty("locationId");
    expect(result.items[0]).not.toHaveProperty("description");
    expect(result.hasMore).toBe(false);
  });

  it("applies the dental vertical as a roleCategory prefix filter", async () => {
    const { db, all } = capture([[]]);
    mocked.db = db;
    await vacanciesRouter.createCaller({ user: null } as never).publicList({ vertical: "dental", limit: 24, offset: 0 });
    expect(has(all[0].calls.where[0], "like", vacancies.roleCategory, "dental%")).toBe(true);
  });

  it("detail of a vacancy that is not publicly visible is NOT_FOUND", async () => {
    mocked.db = capture([[]]).db;
    await expect(vacanciesRouter.createCaller({ user: null } as never).publicDetail({ id: vacancyId })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("VIP strip requires an active vipUntil", async () => {
    const { db, all } = capture([[publicRow({ vipUntil: future })]]);
    mocked.db = db;
    const rows = await vacanciesRouter.createCaller({ user: null } as never).publicVipList({ limit: 6 });
    expect(has(all[0].calls.where[0], "gt", vacancies.vipUntil)).toBe(true);
    expect(rows[0].isVip).toBe(true);
  });
});

describe("vacancies owner procedures are organization-scoped", () => {
  it("requires OWNER/MANAGER membership of the given organization before touching data", async () => {
    mocked.requireOrganizationRole.mockRejectedValue(Object.assign(new Error("no"), { code: "FORBIDDEN" }));
    const { db } = capture([]);
    mocked.db = db;
    await expect(vacanciesRouter.createCaller({ user } as never).create(createInput)).rejects.toThrow();
    expect(mocked.requireOrganizationRole).toHaveBeenCalledWith(user, orgId, ["OWNER", "MANAGER"]);
    expect(db.select).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("another organization cannot edit or close a vacancy (lookup is scoped by organizationId)", async () => {
    const { db, all } = capture([[], []]);
    mocked.db = db;
    const caller = vacanciesRouter.createCaller({ user } as never);
    await expect(caller.update({ organizationId: otherOrgId, id: vacancyId, title: "ახალი სათაური" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller.close({ organizationId: otherOrgId, id: vacancyId })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(has(all[0].calls.where[0], "eq", vacancies.organizationId, otherOrgId)).toBe(true);
    expect(db.update).not.toHaveBeenCalled();
  });

  it("rejects a location that is not in the organization", async () => {
    const { db } = capture([[]]);
    mocked.db = db;
    await expect(vacanciesRouter.createCaller({ user } as never).create(createInput)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("requires a phone or an email", async () => {
    mocked.db = capture([]).db;
    await expect(vacanciesRouter.createCaller({ user } as never).create({ ...createInput, contactPhone: undefined })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("creates a published vacancy that expires in 30 days by default and is never VIP", async () => {
    const { db, insertChain } = capture([[{ id: locationId }]]);
    mocked.db = db;
    await vacanciesRouter.createCaller({ user } as never).create({ ...createInput, publish: true } as never);
    const values = insertChain.calls.values[0];
    expect(values.organizationId).toBe(orgId);
    expect(values.status).toBe("PUBLISHED");
    expect(values.vipUntil).toBeUndefined();
    expect((values.expiresAt.getTime() - values.publishedAt.getTime()) / 86_400_000).toBeCloseTo(30, 5);
  });

  it("does not let an owner change VIP through update", async () => {
    const { db, updateChain } = capture([[{ id: vacancyId, contactPhone: "555123456", contactEmail: null, salaryFromTetri: null, salaryToTetri: null }]]);
    mocked.db = db;
    await vacanciesRouter.createCaller({ user } as never).update({ organizationId: orgId, id: vacancyId, title: "ახალი სათაური", vipUntil: future } as never);
    expect(updateChain.calls.set[0]).toEqual({ title: "ახალი სათაური" });
  });
});

describe("vacancies VIP is platform-admin only", () => {
  it("denies a salon user before database access", async () => {
    const { db } = capture([]);
    mocked.db = db;
    await expect(vacanciesRouter.createCaller({ user } as never).setVip({ id: vacancyId, vipUntil: future })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.select).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
  });

  it("lets an admin set and clear vipUntil, and rejects a past date", async () => {
    const { db, updateChain } = capture([[{ id: vacancyId }], [{ id: vacancyId }]]);
    mocked.db = db;
    const caller = vacanciesRouter.createCaller({ user: admin } as never);
    await expect(caller.setVip({ id: vacancyId, vipUntil: past })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await caller.setVip({ id: vacancyId, vipUntil: future });
    expect(updateChain.calls.set[0]).toEqual({ vipUntil: future, vipSetByUserId: 1 });
    await caller.setVip({ id: vacancyId, vipUntil: null });
    expect(updateChain.calls.set[0]).toEqual({ vipUntil: null, vipSetByUserId: 1 });
  });
});
