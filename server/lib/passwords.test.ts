import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./passwords";

describe("local password helpers", () => {
  it("hashes with a unique scrypt salt and verifies only the correct password", async () => {
    const first = await hashPassword("ძლიერი-პაროლი-123");
    const second = await hashPassword("ძლიერი-პაროლი-123");
    expect(first).not.toBe(second);
    await expect(verifyPassword("ძლიერი-პაროლი-123", first)).resolves.toBe(true);
    await expect(verifyPassword("სხვა-პაროლი-123", first)).resolves.toBe(false);
  });

  it("rejects malformed or absent stored hashes", async () => {
    await expect(verifyPassword("any-password", undefined)).resolves.toBe(false);
    await expect(verifyPassword("any-password", "not-a-password-hash")).resolves.toBe(false);
  });
});
