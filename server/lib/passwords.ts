import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(nodeScrypt);
const KEY_LENGTH = 64;

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const key = await scrypt(password, salt, KEY_LENGTH) as Buffer;
  return `scrypt$${salt}$${key.toString("base64url")}`;
}

export async function verifyPassword(password: string, encoded: string | null | undefined) {
  if (!encoded) return false;
  const [algorithm, salt, expected] = encoded.split("$");
  if (algorithm !== "scrypt" || !salt || !expected) return false;
  try {
    const derived = await scrypt(password, salt, KEY_LENGTH) as Buffer;
    const stored = Buffer.from(expected, "base64url");
    return stored.length === derived.length && timingSafeEqual(stored, derived);
  } catch {
    return false;
  }
}
