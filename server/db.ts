import { and, eq, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { createHmac, timingSafeEqual } from "node:crypto";
import { InsertUser, organizationMemberships, users } from "../drizzle/schema";
import { normalizeEmail } from "./lib/normalization";
import { ENV } from "./_core/env";

let database: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!database && process.env.DATABASE_URL) {
    try {
      database = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Connection initialization failed", { message: error instanceof Error ? error.message : "Unknown error" });
      database = null;
    }
  }
  return database;
}

export async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const normalizedEmail = normalizeEmail(user.email);
  const role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  await db.insert(users).values({
    openId: user.openId,
    name: user.name ?? null,
    email: user.email ?? null,
    normalizedEmail,
    loginMethod: user.loginMethod ?? null,
    role,
    lastSignedIn: user.lastSignedIn ?? new Date(),
  }).onDuplicateKeyUpdate({
    set: {
      name: user.name ?? null,
      email: user.email ?? null,
      normalizedEmail,
      loginMethod: user.loginMethod ?? null,
      lastSignedIn: new Date(),
    },
  });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserByNormalizedEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return undefined;
  const result = await db.select().from(users).where(eq(users.normalizedEmail, normalizedEmail)).limit(1);
  return result[0];
}

export async function createLocalUser(input: { openId: string; name: string; email: string; passwordHash: string }) {
  const db = await requireDb();
  const normalizedEmail = normalizeEmail(input.email);
  if (!normalizedEmail) throw new Error("Email is required");
  await db.insert(users).values({
    openId: input.openId,
    name: input.name,
    email: input.email.trim(),
    normalizedEmail,
    passwordHash: input.passwordHash,
    loginMethod: "local",
    locale: "ka-GE",
    accountStatus: "ACTIVE",
    lastSignedIn: new Date(),
  });
  return getUserByOpenId(input.openId);
}

export async function updateOwnUserProfile(userId: number, input: { name: string }) {
  const db = await requireDb();
  await db.update(users).set({ name: input.name.trim() }).where(eq(users.id, userId));
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0];
}

export function createLegacyRecoveryCode(openId: string) {
  const digest = createHmac("sha256", ENV.cookieSecret)
    .update(`salonflow-legacy-recovery-v1:${openId}`)
    .digest("hex")
    .toUpperCase();
  return `SFRC-${digest.slice(0, 4)}-${digest.slice(4, 8)}-${digest.slice(8, 12)}-${digest.slice(12, 16)}-${digest.slice(16, 20)}`;
}

function safeRecoveryCodeMatch(expected: string, received: string) {
  const expectedBytes = Buffer.from(expected);
  const receivedBytes = Buffer.from(received.trim().toUpperCase());
  return expectedBytes.length === receivedBytes.length && timingSafeEqual(expectedBytes, receivedBytes);
}

export async function getLegacyLocalUserByRecoveryCode(recoveryCode: string) {
  const db = await requireDb();
  const candidates = await db.select().from(users).where(and(
    isNull(users.email),
    isNull(users.normalizedEmail),
    isNull(users.loginMethod),
  ));
  return candidates.find(candidate => (
    candidate.openId.startsWith("local_")
    && Boolean(candidate.passwordHash)
    && safeRecoveryCodeMatch(createLegacyRecoveryCode(candidate.openId), recoveryCode)
  ));
}

export async function getActiveMembership(userId: number, organizationId: string) {
  const db = await requireDb();
  const result = await db.select().from(organizationMemberships).where(and(
    eq(organizationMemberships.userId, userId),
    eq(organizationMemberships.organizationId, organizationId),
    eq(organizationMemberships.status, "ACTIVE"),
  )).limit(1);
  return result[0];
}
