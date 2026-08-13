import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./passwords";

describe("password hashing", () => {
  it("accepts the original password and rejects a different password", async () => {
    const hash = await hashPassword("SalonFlow-secure-password-2026");

    await expect(verifyPassword("SalonFlow-secure-password-2026", hash)).resolves.toBe(true);
    await expect(verifyPassword("different-password", hash)).resolves.toBe(false);
  });

  it("fails closed for malformed or absent password hashes", async () => {
    await expect(verifyPassword("any-password", null)).resolves.toBe(false);
    await expect(verifyPassword("any-password", "not-a-password-hash")).resolves.toBe(false);
  });
});
