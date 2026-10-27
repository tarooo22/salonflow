import { afterEach, describe, expect, it, vi } from "vitest";

const r2 = vi.hoisted(() => ({ putR2Object: vi.fn(), getR2SignedUrl: vi.fn() }));
vi.mock("./r2", () => r2);

import { STORAGE_ERROR_MESSAGE, storageGetSignedUrl, storagePut } from "./storage";

afterEach(() => vi.restoreAllMocks());

describe("storage error mapping", () => {
  it("shows a Georgian message and logs the raw R2 detail server-side only", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    r2.putR2Object.mockRejectedValue(new Error("R2 storage config missing: set R2_ACCOUNT_ID"));
    const failure = await storagePut("a/b.jpg", Buffer.from("x"), "image/jpeg").catch(error => error);
    expect(failure).toMatchObject({ code: "INTERNAL_SERVER_ERROR", message: STORAGE_ERROR_MESSAGE });
    expect(failure.message).not.toContain("R2");
    expect(log.mock.calls.join(" ")).toContain("R2 storage config missing");
  });

  it("maps signing failures the same way and passes success through", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    r2.getR2SignedUrl.mockRejectedValueOnce(new Error("boom"));
    await expect(storageGetSignedUrl("k")).rejects.toMatchObject({ message: STORAGE_ERROR_MESSAGE });
    r2.getR2SignedUrl.mockResolvedValueOnce("https://signed");
    await expect(storageGetSignedUrl("k")).resolves.toBe("https://signed");
  });
});
