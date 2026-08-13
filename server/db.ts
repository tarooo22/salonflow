import { and, eq, gt, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, organizationMemberships, passwordResetTokens, users } from "../drizzle/schema";
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
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return undefined;
  const db = await requireDb();
  const result = await db.select().from(users).where(eq(users.normalizedEmail, normalizedEmail)).limit(1);
  return result[0];
}

export async function createLocalUser(input: {
  openId: string;
  name: string;
  email: string;
  passwordHash: string;
}) {
  const normalizedEmail = normalizeEmail(input.email);
  if (!normalizedEmail) throw new Error("A valid email address is required");
  const db = await requireDb();
  await db.insert(users).values({
    openId: input.openId,
    name: input.name,
    email: input.email.trim(),
    normalizedEmail,
    passwordHash: input.passwordHash,
    loginMethod: "password",
    role: input.openId === ENV.ownerOpenId ? "admin" : "user",
    accountStatus: "ACTIVE",
    lastSignedIn: new Date(),
  });
  return getUserByOpenId(input.openId);
}

export async function createPasswordResetToken(input: { id: string; userId: number; tokenHash: string; expiresAt: Date }) {
  const db = await requireDb();
  await db.insert(passwordResetTokens).values(input);
}

export async function consumePasswordResetAndUpdatePassword(input: { tokenHash: string; passwordHash: string; now?: Date }) {
  const db = await requireDb();
  const now = input.now ?? new Date();
  return db.transaction(async tx => {
    const [token] = await tx.select().from(passwordResetTokens).where(and(
      eq(passwordResetTokens.tokenHash, input.tokenHash),
      isNull(passwordResetTokens.consumedAt),
      gt(passwordResetTokens.expiresAt, now),
    )).limit(1);
    if (!token) return false;

    const [consumed] = await tx.update(passwordResetTokens).set({ consumedAt: now }).where(and(
      eq(passwordResetTokens.id, token.id),
      isNull(passwordResetTokens.consumedAt),
      gt(passwordResetTokens.expiresAt, now),
    ));
    if (consumed.affectedRows !== 1) return false;
    await tx.update(users).set({ passwordHash: input.passwordHash, loginMethod: "password", lastSignedIn: now }).where(eq(users.id, token.userId));
    return true;
  });
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
