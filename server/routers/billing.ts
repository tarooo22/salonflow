import { TRPCError } from "@trpc/server";
import { and, desc, eq, gt, like, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { billingConfigurations, billingPaymentEvents, billingPaymentSubmissions, organizationAccessGrants, organizationMemberships, organizations, trialAccessRequests, users } from "../../drizzle/schema";
import { requireDb } from "../db";
import { storagePut } from "../storage";
import { protectedProcedure, router } from "../_core/trpc";

const receiptSchema = z.object({ organizationId: z.string().min(1), transferComment: z.string().trim().min(3).max(160), originalName: z.string().trim().min(1).max(255), mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]), dataUrl: z.string().min(20).max(14_000_000) });
const ownerInput = z.object({ organizationId: z.string().min(1) });

async function ownerMembership(userId: number, organizationId: string) {
  const db = await requireDb();
  const [membership] = await db.select().from(organizationMemberships).where(and(eq(organizationMemberships.userId, userId), eq(organizationMemberships.organizationId, organizationId), eq(organizationMemberships.status, "ACTIVE"), eq(organizationMemberships.role, "OWNER"))).limit(1);
  if (!membership) throw new TRPCError({ code: "FORBIDDEN", message: "გადახდის ქვითრის მართვა ხელმისაწვდომია მხოლოდ სალონის მფლობელისთვის." });
  return db;
}
function requireAdmin(role: string) { if (role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "ეს მოქმედება ხელმისაწვდომია მხოლოდ SalonFlow platform admin-ისთვის." }); }
function monthFrom(date: Date) { const value = new Date(date); value.setMonth(value.getMonth() + 1); return value; }

export const billingRouter = router({
  workspaceStatus: protectedProcedure.input(ownerInput).query(async ({ ctx, input }) => {
    const db = await requireDb();
    const [membership] = await db.select().from(organizationMemberships).where(and(eq(organizationMemberships.userId, ctx.user.id), eq(organizationMemberships.organizationId, input.organizationId), eq(organizationMemberships.status, "ACTIVE"))).limit(1);
    if (!membership) throw new TRPCError({ code: "FORBIDDEN", message: "ამ სამუშაო სივრცეზე წვდომა არ გაქვთ." });
    const [trial] = await db.select().from(trialAccessRequests).where(eq(trialAccessRequests.organizationId, input.organizationId)).limit(1);
    if (!trial) return { locked: false, endsAt: null };
    const [grant] = await db.select().from(organizationAccessGrants).where(and(eq(organizationAccessGrants.organizationId, input.organizationId), eq(organizationAccessGrants.status, "ACTIVE"), gt(organizationAccessGrants.endsAt, new Date()))).limit(1);
    const trialActive = trial.status === "APPROVED" && !!trial.expiresAt && trial.expiresAt > new Date();
    return { locked: !trialActive && !grant, endsAt: grant?.endsAt ?? trial.expiresAt ?? null };
  }),
  ownerStatus: protectedProcedure.input(ownerInput).query(async ({ ctx, input }) => {
    const db = await ownerMembership(ctx.user.id, input.organizationId);
    const [organization] = await db.select({ id: organizations.id, name: organizations.name, billingCode: organizations.billingCode }).from(organizations).where(eq(organizations.id, input.organizationId)).limit(1);
    if (!organization) throw new TRPCError({ code: "NOT_FOUND", message: "სალონი ვერ მოიძებნა." });
    const [config] = await db.select().from(billingConfigurations).where(eq(billingConfigurations.id, 1)).limit(1);
    const [submission] = await db.select().from(billingPaymentSubmissions).where(eq(billingPaymentSubmissions.organizationId, input.organizationId)).orderBy(desc(billingPaymentSubmissions.createdAt)).limit(1);
    const [grant] = await db.select().from(organizationAccessGrants).where(and(eq(organizationAccessGrants.organizationId, input.organizationId), eq(organizationAccessGrants.status, "ACTIVE"), gt(organizationAccessGrants.endsAt, new Date()))).orderBy(desc(organizationAccessGrants.endsAt)).limit(1);
    const [trial] = await db.select().from(trialAccessRequests).where(eq(trialAccessRequests.organizationId, input.organizationId)).limit(1);
    return { organization, config: config ? { beneficiaryName: config.beneficiaryName, personalNumber: config.personalNumber, accountNumber: config.accountNumber, monthlyPriceTetri: config.monthlyPriceTetri, transferCommentPrefix: config.transferCommentPrefix, privacyNoticeKa: config.privacyNoticeKa } : null, submission, trialEndsAt: trial?.status === "APPROVED" ? trial.expiresAt : null, activeEndsAt: grant?.endsAt ?? (trial?.status === "APPROVED" ? trial.expiresAt : null) };
  }),
  submitReceipt: protectedProcedure.input(receiptSchema).mutation(async ({ ctx, input }) => {
    const db = await ownerMembership(ctx.user.id, input.organizationId);
    const [organization] = await db.select().from(organizations).where(eq(organizations.id, input.organizationId)).limit(1);
    const [config] = await db.select().from(billingConfigurations).where(eq(billingConfigurations.id, 1)).limit(1);
    if (!organization?.billingCode || !config?.monthlyPriceTetri || !config.beneficiaryName || !config.accountNumber) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "გადახდის რეკვიზიტები ჯერ არ არის კონფიგურირებული." });
    const match = input.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match || match[1] !== input.mimeType) throw new TRPCError({ code: "BAD_REQUEST", message: "ქვითრის ფორმატი არასწორია." });
    const bytes = Buffer.from(match[2], "base64");
    if (!bytes.length || bytes.length > 10 * 1024 * 1024) throw new TRPCError({ code: "BAD_REQUEST", message: "ქვითრის ზომა უნდა იყოს არაუმეტეს 10 MB." });
    const ext = input.mimeType === "application/pdf" ? "pdf" : input.mimeType.split("/")[1];
    const stored = await storagePut(`billing-receipts/${organization.id}/${nanoid(12)}.${ext}`, bytes, input.mimeType);
    const id = nanoid(21);
    await db.transaction(async tx => {
      await tx.insert(billingPaymentSubmissions).values({ id, organizationId: organization.id, submittedByUserId: ctx.user.id, billingCodeSnapshot: organization.billingCode!, amountTetri: config.monthlyPriceTetri, transferComment: input.transferComment, receiptKey: stored.key, receiptMimeType: input.mimeType, receiptOriginalName: input.originalName, receiptSizeBytes: bytes.length, status: "SUBMITTED" });
      await tx.insert(billingPaymentEvents).values({ id: nanoid(21), billingPaymentSubmissionId: id, eventType: "SUBMITTED", actorUserId: ctx.user.id, metadata: { billingCode: organization.billingCode, transferComment: input.transferComment } });
    });
    return { id };
  }),
  adminConfig: protectedProcedure.query(async ({ ctx }) => { requireAdmin(ctx.user.role); const db = await requireDb(); const [config] = await db.select().from(billingConfigurations).where(eq(billingConfigurations.id, 1)).limit(1); return config ?? null; }),
  saveConfig: protectedProcedure.input(z.object({ beneficiaryName: z.string().trim().min(2).max(160), personalNumber: z.string().trim().min(5).max(32), accountNumber: z.string().trim().min(8).max(64), monthlyPriceTetri: z.number().int().positive(), transferCommentPrefix: z.string().trim().min(2).max(32), privacyNoticeKa: z.string().trim().min(10).max(5000) })).mutation(async ({ ctx, input }) => {
    requireAdmin(ctx.user.role); const db = await requireDb(); await db.insert(billingConfigurations).values({ id: 1, ...input, updatedByUserId: ctx.user.id }).onDuplicateKeyUpdate({ set: { ...input, updatedByUserId: ctx.user.id } }); return { saved: true };
  }),
  adminList: protectedProcedure.input(z.object({ status: z.enum(["SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "CANCELLED"]).optional(), search: z.string().trim().min(1).max(160).optional() })).query(async ({ ctx, input }) => {
    requireAdmin(ctx.user.role); const db = await requireDb(); const term = input.search ? `%${input.search}%` : undefined;
    const rows = await db.select({ submission: billingPaymentSubmissions, organizationName: organizations.name, ownerEmail: users.email }).from(billingPaymentSubmissions).innerJoin(organizations, eq(billingPaymentSubmissions.organizationId, organizations.id)).innerJoin(users, eq(billingPaymentSubmissions.submittedByUserId, users.id)).where(and(input.status ? eq(billingPaymentSubmissions.status, input.status) : undefined, term ? or(like(organizations.name, term), like(organizations.billingCode, term), like(users.email, term), like(billingPaymentSubmissions.billingCodeSnapshot, term)) : undefined)).orderBy(desc(billingPaymentSubmissions.createdAt)).limit(100);
    return rows.map(row => ({ ...row.submission, organizationName: row.organizationName, ownerEmail: row.ownerEmail, receiptUrl: `/manus-storage/${row.submission.receiptKey}` }));
  }),
  approveMonthly: protectedProcedure.input(z.object({ submissionId: z.string().min(1), note: z.string().trim().max(500).optional() })).mutation(async ({ ctx, input }) => {
    requireAdmin(ctx.user.role); const db = await requireDb(); const [submission] = await db.select().from(billingPaymentSubmissions).where(eq(billingPaymentSubmissions.id, input.submissionId)).limit(1); if (!submission || !["SUBMITTED", "UNDER_REVIEW"].includes(submission.status)) throw new TRPCError({ code: "CONFLICT", message: "ეს ქვითარი უკვე დამუშავებულია ან ვერ მოიძებნა." });
    const [existing] = await db.select().from(organizationAccessGrants).where(and(eq(organizationAccessGrants.organizationId, submission.organizationId), eq(organizationAccessGrants.status, "ACTIVE"), gt(organizationAccessGrants.endsAt, new Date()))).orderBy(desc(organizationAccessGrants.endsAt)).limit(1);
    const startsAt = existing?.endsAt && existing.endsAt > new Date() ? existing.endsAt : new Date(); const endsAt = monthFrom(startsAt); const grantId = nanoid(21);
    await db.transaction(async tx => { await tx.update(billingPaymentSubmissions).set({ status: "APPROVED", reviewedByUserId: ctx.user.id, reviewedAt: new Date(), reviewNoteKa: input.note ?? null }).where(eq(billingPaymentSubmissions.id, submission.id)); await tx.insert(organizationAccessGrants).values({ id: grantId, organizationId: submission.organizationId, source: "MONTHLY_MANUAL", billingPaymentSubmissionId: submission.id, startsAt, endsAt, grantedByUserId: ctx.user.id, grantReasonKa: input.note ?? "ხელით დადასტურებული 1-თვიანი პაკეტი" }); await tx.insert(billingPaymentEvents).values({ id: nanoid(21), billingPaymentSubmissionId: submission.id, eventType: "APPROVED_MONTHLY", actorUserId: ctx.user.id, metadata: { grantId, endsAt: endsAt.toISOString() } }); }); return { endsAt };
  }),
  rejectReceipt: protectedProcedure.input(z.object({ submissionId: z.string().min(1), note: z.string().trim().min(3).max(500) })).mutation(async ({ ctx, input }) => { requireAdmin(ctx.user.role); const db = await requireDb(); const [submission] = await db.select().from(billingPaymentSubmissions).where(eq(billingPaymentSubmissions.id, input.submissionId)).limit(1); if (!submission || !["SUBMITTED", "UNDER_REVIEW"].includes(submission.status)) throw new TRPCError({ code: "CONFLICT", message: "ეს ქვითარი უკვე დამუშავებულია ან ვერ მოიძებნა." }); await db.transaction(async tx => { await tx.update(billingPaymentSubmissions).set({ status: "REJECTED", reviewedByUserId: ctx.user.id, reviewedAt: new Date(), reviewNoteKa: input.note }).where(eq(billingPaymentSubmissions.id, submission.id)); await tx.insert(billingPaymentEvents).values({ id: nanoid(21), billingPaymentSubmissionId: submission.id, eventType: "REJECTED", actorUserId: ctx.user.id, metadata: { note: input.note } }); }); return { rejected: true }; }),
  grantBonusDays: protectedProcedure.input(z.object({ organizationId: z.string().min(1), days: z.number().int().min(1).max(365), reason: z.string().trim().min(3).max(500) })).mutation(async ({ ctx, input }) => { requireAdmin(ctx.user.role); const db = await requireDb(); const [existing] = await db.select().from(organizationAccessGrants).where(and(eq(organizationAccessGrants.organizationId, input.organizationId), eq(organizationAccessGrants.status, "ACTIVE"), gt(organizationAccessGrants.endsAt, new Date()))).orderBy(desc(organizationAccessGrants.endsAt)).limit(1); const startsAt = existing?.endsAt && existing.endsAt > new Date() ? existing.endsAt : new Date(); const endsAt = new Date(startsAt.getTime() + input.days * 86400000); await db.insert(organizationAccessGrants).values({ id: nanoid(21), organizationId: input.organizationId, source: "BONUS_DAYS", startsAt, endsAt, grantedByUserId: ctx.user.id, grantReasonKa: input.reason, metadata: { days: input.days } }); return { endsAt }; }),
});
