import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({ db: null as unknown, requireOrganizationRole: vi.fn(), storagePut: vi.fn() }));

vi.mock("../db", () => ({ requireDb: vi.fn(async () => mocked.db) }));
vi.mock("../access", () => ({ requireOrganizationRole: mocked.requireOrganizationRole }));
vi.mock("../storage", () => ({ storagePut: mocked.storagePut }));
vi.mock("drizzle-orm", async importOriginal => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  const tag = (kind: string) => (...args: unknown[]) => ({ kind, args });
  return { ...actual, and: tag("and"), or: tag("or"), eq: tag("eq"), like: tag("like"), isNull: tag("isNull"), desc: tag("desc"), asc: tag("asc"), exists: tag("exists"), notExists: tag("notExists") };
});

import { locationMarketplaceProfiles, locations, products } from "../../drizzle/schema";
import { productsRouter } from "./products";

type Tagged = { kind: string; args: unknown[] };
function has(condition: unknown, kind: string, ...lead: unknown[]): boolean {
  if (!condition || typeof condition !== "object") return false;
  const node = condition as Tagged;
  if (node.kind === kind && lead.every((value, index) => node.args[index] === value)) return true;
  return Array.isArray(node.args) && node.args.some(arg => has(arg, kind, ...lead));
}

function chain(rows: unknown[]) {
  const calls: Record<string, any[]> = {};
  const c: any = new Proxy({}, { get: (_t, prop: string) => prop === "then" ? (resolve: (value: unknown) => void) => resolve(rows) : (...args: unknown[]) => { calls[prop] = args; return c; } });
  return { c, calls };
}
function capture(selects: unknown[][]) {
  const chains = selects.map(chain);
  const queue = [...chains];
  const select = vi.fn(() => queue.shift()!.c);
  const insertChain = chain([]);
  const updateChain = chain([]);
  return { db: { select, insert: vi.fn(() => insertChain.c), update: vi.fn(() => updateChain.c) }, all: chains, insertChain, updateChain };
}

const user = { id: 5, openId: "owner", role: "user" as const };
const orgId = "organization_0001";
const otherOrgId = "organization_0002";
const productId = "product_0000000001";
const locationId = "location_00000001";
const createInput = { organizationId: orgId, locationId, name: "შამპუნი", priceTetri: 2500, inStock: true, sortOrder: 0 };

beforeEach(() => {
  mocked.requireOrganizationRole.mockReset();
  mocked.requireOrganizationRole.mockResolvedValue({ id: "m1", role: "OWNER" });
  mocked.storagePut.mockReset();
  mocked.storagePut.mockResolvedValue({ key: "salons/x/products/y/img.png", url: "/manus-storage/salons/x/products/y/img.png" });
});

describe("products owner procedures are organization-scoped", () => {
  it("requires OWNER/MANAGER membership before touching data", async () => {
    mocked.requireOrganizationRole.mockRejectedValue(new Error("forbidden"));
    const { db } = capture([]);
    mocked.db = db;
    await expect(productsRouter.createCaller({ user } as never).create(createInput)).rejects.toThrow();
    expect(mocked.requireOrganizationRole).toHaveBeenCalledWith(user, orgId, ["OWNER", "MANAGER"]);
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("another organization cannot edit or archive a product, and nothing is stored", async () => {
    const { db, all } = capture([[]]);
    mocked.db = db;
    await expect(productsRouter.createCaller({ user } as never).update({ organizationId: otherOrgId, id: productId, status: "ARCHIVED" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(has(all[0].calls.where[0], "eq", products.organizationId, otherOrgId)).toBe(true);
    expect(db.update).not.toHaveBeenCalled();
    expect(mocked.storagePut).not.toHaveBeenCalled();
  });

  it("rejects a location outside the organization", async () => {
    const { db } = capture([[]]);
    mocked.db = db;
    await expect(productsRouter.createCaller({ user } as never).create(createInput)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("archives instead of deleting", async () => {
    const { db, updateChain } = capture([[{ id: productId }]]);
    mocked.db = db;
    await productsRouter.createCaller({ user } as never).update({ organizationId: orgId, id: productId, status: "ARCHIVED" });
    expect(updateChain.calls.set[0]).toEqual({ status: "ARCHIVED" });
  });

  it("stores an uploaded photo under the organization's folder and keeps only the key", async () => {
    const { db, insertChain } = capture([[{ id: locationId }]]);
    mocked.db = db;
    await productsRouter.createCaller({ user } as never).create({ ...createInput, imageDataUrl: "data:image/png;base64,iVBORw0KGgo=", imageAltKa: "შამპუნის ბოთლი" });
    expect(mocked.storagePut.mock.calls[0][0]).toMatch(new RegExp(`^salons/${orgId}/products/`));
    expect(insertChain.calls.values[0]).toMatchObject({ organizationId: orgId, imageKey: "salons/x/products/y/img.png", imageAltKa: "შამპუნის ბოთლი" });
  });

  it("rejects a photo without an alt text and a non-image payload", async () => {
    mocked.db = capture([]).db;
    const caller = productsRouter.createCaller({ user } as never);
    await expect(caller.create({ ...createInput, imageDataUrl: "data:image/png;base64,AAAA" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.create({ ...createInput, imageDataUrl: "data:text/html;base64,AAAA", imageAltKa: "შამპუნის ბოთლი" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("products public listing", () => {
  const row = { id: productId, name: "შამპუნი", brand: null, description: null, priceTetri: 2500, inStock: false, imageKey: "salons/x/products/y/img.png", imageAltKa: "ბოთლი", businessName: "სალონი", locationName: "ვაკე", locationPublicSlug: "salon-vake", areaLabelKa: "ვაკე" };

  it("shows only active products of approved locations and exposes a URL, not storage keys or internal ids", async () => {
    const { db, all } = capture([[row]]);
    mocked.db = db;
    const result = await productsRouter.createCaller({ user: null } as never).publicList({ limit: 24, offset: 0 });
    const where = all[0].calls.where[0];
    expect(has(where, "eq", products.status, "ACTIVE")).toBe(true);
    expect(has(where, "eq", locationMarketplaceProfiles.status, "APPROVED")).toBe(true);
    expect(result.items[0]).toMatchObject({ inStock: false, imageUrl: "/manus-storage/salons/x/products/y/img.png" });
    expect(result.items[0]).not.toHaveProperty("imageKey");
    expect(result.items[0]).not.toHaveProperty("organizationId");
  });

  it("filters the salon-profile list by publicSlug, still requiring approval", async () => {
    const { db, all } = capture([[row]]);
    mocked.db = db;
    await productsRouter.createCaller({ user: null } as never).byLocation({ publicSlug: "salon-vake" });
    const where = all[0].calls.where[0];
    expect(has(where, "eq", locations.publicSlug, "salon-vake")).toBe(true);
    expect(has(where, "eq", locationMarketplaceProfiles.status, "APPROVED")).toBe(true);
  });
});
