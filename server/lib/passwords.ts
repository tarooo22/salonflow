import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const HASH_PREFIX = "scrypt";
const KEY_LENGTH = 64;

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const derived = await scrypt(password, salt, KEY_LENGTH) as Buffer;
  return `${HASH_PREFIX}$${salt}$${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, stored: string | null | undefined) {
  if (!stored) return false;
  const [prefix, salt, encodedKey, ...rest] = stored.split("$");
  if (prefix !== HASH_PREFIX || !salt || !encodedKey || rest.length > 0) return false;

  try {
    const expected = Buffer.from(encodedKey, "base64url");
    const derived = await scrypt(password, salt, expected.length) as Buffer;
    return expected.length === derived.length && timingSafeEqual(expected, derived);
  } catch {
    return false;
  }
}
