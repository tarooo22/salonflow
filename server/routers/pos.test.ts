import { describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({ db: null as unknown, requireOrganizationAction: vi.fn(async () => ({ role: "OWNER" })) }));

vi.mock("../db", () => ({ requireDb: vi.fn(async () => mocked.db) }));
vi.mock("../access", () => ({ requireOrganizationAction: mocked.requireOrganizationAction, requireOrganizationRole: vi.fn() }));
vi.mock("nanoid", () => ({ nanoid: vi.fn(() => "generated_pos_id") }));

import { posRouter } from "./pos";

const ids = { organizationId: "organization_001", locationId: "location_0001", productId: "product_00001", stockId: "stock_0000001" };
const user = { id: 7, role: "user" as const };

/** Each `select().from().where()` call returns the next queued rows (awaitable, or with `.limit`). */
function createDb(selectQueue: unknown[][], affectedRows: number) {
  const insertValues = vi.fn(async () => undefined);
  const tx = {
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(async () => [{ affectedRows }]) })) })),
    insert: vi.fn(() => ({ values: insertValues })),
  };
  const from = () => {
    const source: Record<string, unknown> = { innerJoin: () => source };
    source.where = () => {
      const rows = selectQueue.shift() ?? [];
      return { limit: vi.fn(async () => rows), then: (resolve: (value: unknown[]) => unknown) => Promise.resolve(rows).then(resolve) };
    };
    return source;
  };
  const select = vi.fn(() => ({ from }));
  return { select, transaction: vi.fn(async (callback: (t: typeof tx) => Promise<unknown>) => callback(tx)), tx, insertValues };
}

describe("pos stock atomicity", () => {
  it("aborts the sale when the conditional stock decrement matches no row (concurrent oversell)", async () => {
    const db = createDb([
      [{ id: ids.locationId }],
      [{ id: ids.productId, nameKa: "შამპუნი", retailPriceTetri: 1_500 }],
      [{ id: ids.stockId, productId: ids.productId, currentQuantity: 1 }],
    ], 0);
    mocked.db = db;

    await expect(posRouter.createCaller({ user } as never).createSale({
      organizationId: ids.organizationId, locationId: ids.locationId, method: "CASH", lines: [{ productId: ids.productId, quantity: 1 }],
    })).rejects.toThrow("არჩეული რაოდენობა მარაგში აღარ არის.");

    expect(db.tx.insert).toHaveBeenCalledTimes(2); // sale + line only; no movement/audit after the failed decrement (tx rolls back)
  });

  it("rejects a stock adjustment whose conditional update matches no row", async () => {
    const db = createDb([[{ stock: { id: ids.stockId, currentQuantity: 5 }, product: {} }]], 0);
    mocked.db = db;

    await expect(posRouter.createCaller({ user } as never).adjustStock({
      organizationId: ids.organizationId, locationId: ids.locationId, productId: ids.productId, quantityDelta: -3, reason: "დაზიანება",
    })).rejects.toThrow("მარაგი ნულზე ნაკლები ვერ გახდება.");

    expect(db.tx.insert).not.toHaveBeenCalled();
  });
});
