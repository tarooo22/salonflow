import { describe, expect, it } from "vitest";
import { getSessionCookieOptions } from "./cookies";

describe("session cookie options", () => {
  it("uses browser-valid Lax cookies for local HTTP development", () => {
    const options = getSessionCookieOptions({ protocol: "http", headers: {} } as never);
    expect(options).toMatchObject({ httpOnly: true, path: "/", sameSite: "lax", secure: false });
  });

  it("keeps deployed HTTPS cookies secure while retaining same-site protection", () => {
    const options = getSessionCookieOptions({ protocol: "http", headers: { "x-forwarded-proto": "https" } } as never);
    expect(options).toMatchObject({ httpOnly: true, path: "/", sameSite: "lax", secure: true });
  });
});
