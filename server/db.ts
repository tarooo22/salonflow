import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
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

export async function getActiveMembership(userId: number, organizationId: string) {
  const db = await requireDb();
  const result = await db.select().from(organizationMemberships).where(and(
    eq(organizationMemberships.userId, userId),
    eq(organizationMemberships.organizationId, organizationId),
    eq(organizationMemberships.status, "ACTIVE"),
  )).limit(1);
  return result[0];
}
