import type { NextFunction, Request, Response } from "express";

// shortcut: in-memory per process, move to a shared store if Railway runs >1 replica
export function createRateLimiter(opts: { windowMs: number; max: number }) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  // Drop expired windows so the map cannot grow without bound.
  const sweep = (now: number) => {
    hits.forEach((entry, key) => {
      if (entry.resetAt <= now) hits.delete(key);
    });
  };
  const timer = setInterval(() => sweep(Date.now()), Math.max(opts.windowMs, 60_000));
  timer.unref();

  return {
    /** Fixed window. `cost` lets a tRPC batch of N matching calls count as N. */
    hit(key: string, cost = 1, now = Date.now()) {
      let entry = hits.get(key);
      if (!entry || entry.resetAt <= now) {
        entry = { count: 0, resetAt: now + opts.windowMs };
        hits.set(key, entry);
      }
      entry.count += cost;
      return {
        allowed: entry.count <= opts.max,
        retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
      };
    },
    sweep,
    size: () => hits.size,
  };
}

/** Procedure names in a tRPC URL; a batch is `/api/trpc/a.x,b.y?batch=1`. */
export function trpcProcedures(url: string): string[] {
  const path = url.split("?")[0];
  // Express mounts match case-insensitively, and tRPC's express adapter takes the procedure from the
  // last path segment only — parse the same way so `/API/trpc/...` or `/api/trpc/x/auth.login` still count.
  if (!/^\/api\/trpc\//i.test(path)) return [];
  try {
    return decodeURIComponent(path.slice(path.lastIndexOf("/") + 1)).split(",").filter(Boolean);
  } catch {
    return [];
  }
}

/** Rate-limit key: IPv6 clients are grouped by /64, since one subscriber usually owns the whole prefix. */
export function clientKey(ip: string): string {
  if (!ip.includes(":") || ip.toLowerCase().startsWith("::ffff:")) return ip;
  const [head, tail = ""] = ip.split("%")[0].split("::");
  const front = head ? head.split(":") : [];
  const back = tail ? tail.split(":") : [];
  const groups = [...front, ...Array(Math.max(0, 8 - front.length - back.length)).fill("0"), ...back];
  return `${groups.slice(0, 4).join(":")}::/64`;
}

export const AUTH_PROCEDURES = new Set([
  "auth.login",
  "auth.register",
  "auth.claimLegacyLocal",
  "invitations.accept",
]);

export const PUBLIC_BOOKING_WRITE_PROCEDURES = new Set([
  "public.commitBooking",
  "public.commitMultiBooking",
  "public.rescheduleBookingByToken",
  "public.cancelBookingByToken",
  "public.joinWaitlist",
  "public.submitFeedback",
]);

const MESSAGE = "ძალიან ბევრი მოთხოვნა. სცადეთ ცოტა ხანში.";

function reject(req: Request, res: Response, retryAfterSec: number) {
  res.setHeader("Retry-After", String(retryAfterSec));
  const names = trpcProcedures(req.originalUrl);
  if (names.length === 0) {
    res.status(429).json({ error: MESSAGE });
    return;
  }
  // Shape a tRPC client (superjson transformer) can surface as a TRPCClientError.
  const error = (path: string) => ({
    error: {
      json: { message: MESSAGE, code: -32029, data: { code: "TOO_MANY_REQUESTS", httpStatus: 429, path } },
    },
  });
  const isBatch = req.query.batch === "1";
  res.status(429).json(isBatch ? names.map(error) : error(names[0]));
}

/**
 * Limits per client IP. With `procedures`, only matching tRPC calls count
 * (cost = how many of them the request carries); without, every request counts once.
 */
export function rateLimit(opts: { windowMs: number; max: number; procedures?: Set<string> }) {
  const limiter = createRateLimiter(opts);
  return (req: Request, res: Response, next: NextFunction) => {
    const cost = opts.procedures
      ? trpcProcedures(req.originalUrl).filter(name => opts.procedures!.has(name)).length
      : 1;
    if (cost === 0) return next();
    const result = limiter.hit(clientKey(req.ip ?? "unknown"), cost);
    if (result.allowed) return next();
    reject(req, res, result.retryAfterSec);
  };
}
