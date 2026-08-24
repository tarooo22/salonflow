import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { trialAccessEvents, trialAccessRequests } from "../../drizzle/schema";
import { requireDb } from "../db";

type TrialRequest = typeof trialAccessRequests.$inferSelect;

async function markExpired(trial: TrialRequest) {
  const expiresAt = trial.expiresAt;
  if (trial.status !== "APPROVED" || !expiresAt || expiresAt > new Date()) return trial;
  const db = await requireDb();
  await db.transaction(async tx => {
    await tx.update(trialAccessRequests).set({ status: "EXPIRED" }).where(and(eq(trialAccessRequests.id, trial.id), eq(trialAccessRequests.status, "APPROVED")));
    await tx.insert(trialAccessEvents).values({ id: nanoid(21), trialRequestId: trial.id, eventType: "EXPIRED_BY_ACCESS_CHECK", metadata: { expiresAt: expiresAt.toISOString() } });
  });
  return { ...trial, status: "EXPIRED" as const };
}

export async function getTrialRequestForUser(userId: number) {
  const db = await requireDb();
  const [trial] = await db.select().from(trialAccessRequests).where(eq(trialAccessRequests.userId, userId)).limit(1);
  return trial ? markExpired(trial) : null;
}

export async function requireApprovedTrialForWorkspaceCreation(userId: number) {
  const trial = await getTrialRequestForUser(userId);
  if (!trial || trial.status !== "APPROVED" || !trial.expiresAt || trial.expiresAt <= new Date()) {
    throw new TRPCError({ code: "FORBIDDEN", message: "სალონის შექმნა ხელმისაწვდომია მხოლოდ დამტკიცებული, მოქმედი 7-დღიანი საცდელი წვდომის შემდეგ." });
  }
  if (trial.organizationId) throw new TRPCError({ code: "CONFLICT", message: "ამ საცდელი წვდომისთვის სალონი უკვე შეიქმნა." });
  return trial;
}

export async function requireActiveTrialForOrganization(organizationId: string) {
  const db = await requireDb();
  const [trial] = await db.select().from(trialAccessRequests).where(eq(trialAccessRequests.organizationId, organizationId)).limit(1);
  if (!trial) return null;
  const current = await markExpired(trial);
  if (current.status !== "APPROVED" || !current.expiresAt || current.expiresAt <= new Date()) {
    throw new TRPCError({ code: "FORBIDDEN", message: "ამ სალონის 7-დღიანი საცდელი წვდომა დასრულებულია. გასაგრძელებლად დაუკავშირდით SalonFlow-ს." });
  }
  return current;
}

/**
 * Public booking remains available to legacy tenants with no trial record. A trial-linked
 * organization can retain its public profile after expiry, but cannot receive new bookings.
 */
export async function isOrganizationTrialPublicBookingActive(organizationId: string) {
  const db = await requireDb();
  const [trial] = await db.select().from(trialAccessRequests).where(eq(trialAccessRequests.organizationId, organizationId)).limit(1);
  if (!trial) return true;
  const current = await markExpired(trial);
  return current.status === "APPROVED" && Boolean(current.expiresAt) && current.expiresAt! > new Date();
}
