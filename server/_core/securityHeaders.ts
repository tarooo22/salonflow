import type { NextFunction, Request, Response } from "express";

/**
 * Minimal hardening headers. Only `frame-ancestors` is set in the CSP: a full policy would break
 * fonts, R2 media and maps. HSTS is sent only over HTTPS (req.secure honours X-Forwarded-Proto
 * because the app trusts the Railway proxy).
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Content-Security-Policy", "frame-ancestors 'none'");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  if (req.secure) res.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
  next();
}
