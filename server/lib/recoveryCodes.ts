import { createHmac, timingSafeEqual } from "node:crypto";
import { ENV } from "../_core/env";

const RECOVERY_CODE_PATTERN = /^SF-([A-F0-9]{4})-([A-F0-9]{4})-([A-F0-9]{4})$/;

function recoveryDigest(openId: string) {
  if (!ENV.cookieSecret) throw new Error("Recovery-code signing secret is not configured.");
  return createHmac("sha256", ENV.cookieSecret).update(`salonflow-legacy-recovery:${openId}`).digest("hex").toUpperCase().slice(0, 12);
}

export function createLegacyRecoveryCode(openId: string) {
  if (!openId.startsWith("local_")) throw new Error("Recovery codes are available only for local accounts.");
  const digest = recoveryDigest(openId);
  return `SF-${digest.slice(0, 4)}-${digest.slice(4, 8)}-${digest.slice(8, 12)}`;
}

export function normalizeLegacyRecoveryCode(value: string) {
  const compact = value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!/^SF[A-F0-9]{12}$/.test(compact)) return null;
  return `SF-${compact.slice(2, 6)}-${compact.slice(6, 10)}-${compact.slice(10, 14)}`;
}

export function matchesLegacyRecoveryCode(openId: string, suppliedCode: string) {
  const normalized = normalizeLegacyRecoveryCode(suppliedCode);
  if (!normalized || !openId.startsWith("local_")) return false;
  const expected = Buffer.from(createLegacyRecoveryCode(openId));
  const actual = Buffer.from(normalized);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
