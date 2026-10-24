import { describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({ db: null as unknown }));

vi.mock("../db", () => ({ requireDb: vi.fn(async () => mocked.db) }));
vi.mock("../access", () => ({ requireOrganizationRole: vi.fn(async () => ({ role: "OWNER" })), requireOrganizationAction: vi.fn() }));
vi.mock("nanoid", () => ({ nanoid: vi.fn(() => "generated_listing_id") }));

import { marketplaceRouter } from "./marketplace";

const input = {
  organizationId: "organization_001",
  locationId: "location_0001",
  categoryServiceLinks: [{ categoryId: "category_00001", serviceIds: ["service_000001"] }],
};

function createDb(selectQueue: unknown[][]) {
  const tx = { delete: vi.fn(() => ({ where: vi.fn(async () => undefined) })), insert: vi.fn(() => ({ values: vi.fn(async () => undefined) })) };
  const insertValues = { onDuplicateKeyUpdate: vi.fn(async () => undefined), then: (resolve: (value: unknown) => unknown) => Promise.resolve(undefined).then(resolve) };
  return {
    select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => {
      const rows = selectQueue.shift() ?? [];
      return { limit: vi.fn(async () => rows), then: (resolve: (value: unknown[]) => unknown) => Promise.resolve(rows).then(resolve) };
    }) })) })),
    insert: vi.fn(() => ({ values: vi.fn(() => insertValues) })),
    delete: vi.fn(),
    transaction: vi.fn(async (callback: (t: typeof tx) => Promise<unknown>) => callback(tx)),
    tx,
  };
}

describe("marketplace saveOwnListing link replacement", () => {
  it("validates categories before touching existing links, so a bad category never wipes them", async () => {
    const db = createDb([[{ id: input.locationId, organizationId: input.organizationId }], [], [{ id: "service_000001" }], []]);
    mocked.db = db;

    await expect(marketplaceRouter.createCaller({ user: { id: 7, role: "user" } } as never).saveOwnListing(input)).rejects.toMatchObject({ code: "BAD_REQUEST" });

    expect(db.delete).not.toHaveBeenCalled();
    expect(db.transaction).not.toHaveBeenCalled();
    expect(db.tx.delete).not.toHaveBeenCalled();
  });

  it("deletes and re-inserts links inside one transaction when everything is valid", async () => {
    const db = createDb([[{ id: input.locationId, organizationId: input.organizationId }], [], [{ id: "service_000001" }], [{ id: "category_00001" }]]);
    mocked.db = db;

    await expect(marketplaceRouter.createCaller({ user: { id: 7, role: "user" } } as never).saveOwnListing(input)).resolves.toEqual({ success: true });

    expect(db.transaction).toHaveBeenCalledTimes(1);
    expect(db.tx.delete).toHaveBeenCalledTimes(2);
    expect(db.tx.insert).toHaveBeenCalledTimes(2);
    expect(db.delete).not.toHaveBeenCalled();
  });
});
