import { parse as parseCookie } from "cookie";
import { jwtVerify, SignJWT } from "jose";
import type { Request } from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";
import { ENV } from "../_core/env";

const SESSION_KIND = "salonflow-local-v1";

function sessionKey() {
  if (!ENV.cookieSecret) throw new Error("JWT_SECRET is required for local sessions");
  return new TextEncoder().encode(ENV.cookieSecret);
}

export async function createLocalSessionToken(openId: string, name: string | null) {
  const expirationSeconds = Math.floor((Date.now() + ONE_YEAR_MS) / 1000);
  return new SignJWT({ kind: SESSION_KIND, name: name ?? "SalonFlow User" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(openId)
    .setExpirationTime(expirationSeconds)
    .sign(sessionKey());
}

export async function readLocalSessionOpenId(req: Request) {
  const token = parseCookie(req.headers.cookie ?? "")[COOKIE_NAME];
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sessionKey(), { algorithms: ["HS256"] });
    return payload.kind === SESSION_KIND && typeof payload.sub === "string" && payload.sub.startsWith("local_") ? payload.sub : null;
  } catch {
    return null;
  }
}
