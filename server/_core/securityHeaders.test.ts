import { describe, expect, it, vi } from "vitest";
import { securityHeaders } from "./securityHeaders";

function run(secure: boolean) {
  const headers: Record<string, string> = {};
  const next = vi.fn();
  securityHeaders({ secure } as never, { setHeader: (name: string, value: string) => { headers[name] = value; } } as never, next);
  return { headers, next };
}

describe("securityHeaders", () => {
  it("sets framing, sniffing and referrer protections and continues", () => {
    const { headers, next } = run(false);
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["Content-Security-Policy"]).toBe("frame-ancestors 'none'");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Referrer-Policy"]).toBe("same-origin");
    expect(headers["Strict-Transport-Security"]).toBeUndefined();
    expect(next).toHaveBeenCalledOnce();
  });

  it("adds HSTS only on secure requests", () => {
    expect(run(true).headers["Strict-Transport-Security"]).toBe("max-age=15552000; includeSubDomains");
  });
});
