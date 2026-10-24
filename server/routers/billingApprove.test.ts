import { describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({ db: null as unknown }));

vi.mock("../db", () => ({ requireDb: vi.fn(async () => mocked.db) }));
vi.mock("../storage", () => ({ storagePut: vi.fn(), storageGetSignedUrl: vi.fn() }));
vi.mock("nanoid", () => ({ nanoid: vi.fn(() => "generated_billing_id") }));

import { billingRouter } from "./billing";

describe("billing approveMonthly", () => {
  it("locks the organization and reads the latest grant inside the transaction to chain the new month after it", async () => {
    const existingEnd = new Date("2030-03-15T10:00:00.000Z");
    const grantValues = vi.fn(async () => undefined);
    const eventValues = vi.fn(async () => undefined);
    const forUpdate = vi.fn(async () => [{ id: "org" }]);
    const txSelectQueue: unknown[][] = [[{ endsAt: existingEnd }]];
    const tx = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({
        for: forUpdate,
        orderBy: vi.fn(() => ({ limit: vi.fn(async () => txSelectQueue.shift() ?? []) })),
      })) })) })),
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(async () => [{ affectedRows: 1 }]) })) })),
      insert: vi.fn().mockReturnValueOnce({ values: grantValues }).mockReturnValueOnce({ values: eventValues }),
    };
    const db = {
      // The only non-transactional read is the submission lookup; grants must not be read outside the tx.
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(async () => [{ id: "submission_001", organizationId: "organization_001", status: "SUBMITTED" }]) })) })) })),
      transaction: vi.fn(async (callback: (t: typeof tx) => Promise<unknown>) => callback(tx)),
    };
    mocked.db = db;

    const result = await billingRouter.createCaller({ user: { id: 1, role: "admin" } } as never).approveMonthly({ submissionId: "submission_001" });

    expect(db.select).toHaveBeenCalledTimes(1);
    expect(forUpdate).toHaveBeenCalledTimes(1);
    expect(grantValues).toHaveBeenCalledWith(expect.objectContaining({ startsAt: existingEnd, endsAt: new Date("2030-04-15T10:00:00.000Z") }));
    expect(result.endsAt).toEqual(new Date("2030-04-15T10:00:00.000Z"));
  });
});
