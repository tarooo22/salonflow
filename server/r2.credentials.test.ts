import { describe, expect, it } from "vitest";
import { listR2Objects } from "./r2";

const hasR2Credentials = ["R2_ACCOUNT_ID", "R2_BUCKET_NAME", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"].every(key => Boolean(process.env[key]));

describe.skipIf(!hasR2Credentials)("Cloudflare R2 credentials", () => {
  it("can authenticate a lightweight bucket listing", async () => {
    const result = await listR2Objects({ maxKeys: 1 });
    expect(result).toEqual(expect.objectContaining({ ok: true }));
  }, 15_000);
});
