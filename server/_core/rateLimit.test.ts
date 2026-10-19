import { describe, expect, it } from "vitest";
import { AUTH_PROCEDURES, clientKey, createRateLimiter, trpcProcedures } from "./rateLimit";

describe("createRateLimiter", () => {
  it("allows max, blocks max+1, resets after the window, keeps keys separate", () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 2 });
    expect(limiter.hit("a", 1, 0).allowed).toBe(true);
    expect(limiter.hit("a", 1, 10).allowed).toBe(true);
    const blocked = limiter.hit("a", 1, 20);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBe(1);
    expect(limiter.hit("b", 1, 20).allowed).toBe(true);
    expect(limiter.hit("a", 1, 1000).allowed).toBe(true);
  });

  it("counts a batch by cost and sweeps expired entries", () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 2 });
    expect(limiter.hit("a", 3, 0).allowed).toBe(false);
    limiter.sweep(1000);
    expect(limiter.size()).toBe(0);
  });
});

describe("trpcProcedures", () => {
  it("splits a batched URL and ignores the query string", () => {
    const names = trpcProcedures("/api/trpc/public.catalog,auth.login?batch=1&input=%7B%7D");
    expect(names).toEqual(["public.catalog", "auth.login"]);
    expect(names.filter(n => AUTH_PROCEDURES.has(n))).toEqual(["auth.login"]);
  });

  it("returns nothing for non-tRPC paths", () => {
    expect(trpcProcedures("/api/other")).toEqual([]);
  });

  it("reads the procedure like tRPC does, so path tricks cannot skip the limit", () => {
    expect(trpcProcedures("/API/trpc/auth.login")).toEqual(["auth.login"]);
    expect(trpcProcedures("/api/trpc/x/auth.login?batch=1")).toEqual(["auth.login"]);
    expect(trpcProcedures("/api/trpc/auth%2Elogin%2Cpublic.catalog")).toEqual(["auth.login", "public.catalog"]);
  });

  it("groups IPv6 clients by /64 and leaves IPv4 alone", () => {
    expect(clientKey("2001:db8:1:2:aaaa::1")).toBe(clientKey("2001:db8:1:2:bbbb:cccc:dddd:eeee"));
    expect(clientKey("2001:db8:1:2::1")).not.toBe(clientKey("2001:db8:1:3::1"));
    expect(clientKey("203.0.113.7")).toBe("203.0.113.7");
    expect(clientKey("::ffff:203.0.113.7")).toBe("::ffff:203.0.113.7");
  });
});
