import { and, desc, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { aestheticProcedureRecords, appointments, auditLogs, clients, organizationMemberships, organizations, staffProfiles, users } from "../../drizzle/schema";
import { aestheticCreateSchema, aestheticListSchema, aestheticVoidSchema } from "../../shared/validation";
import { protectedProcedure, router } from "../_core/trpc";
import { requireOrganizationAction } from "../access";
import { requireDb } from "../db";
import { requireClinicalPatientAccess, requireRecordAppointment } from "../lib/clinicalAccess";

type Db = Awaited<ReturnType<typeof requireDb>>;

/** Only AESTHETICS workspaces keep procedure records. */
async function requireAestheticsOrganization(db: Db, organizationId: string) {
  const [organization] = await db.select({ vertical: organizations.vertical }).from(organizations).where(eq(organizations.id, organizationId)).limit(1);
  if (organization?.vertical !== "AESTHETICS") throw new TRPCError({ code: "FORBIDDEN", message: "პროცედურების ჟურნალი ხელმისაწვდომია მხოლოდ ესთეტიკური კლინიკის სივრცეში." });
}

const CLIENT_NOT_FOUND = "კლიენტი ვერ მოიძებნა.";

/** The client must belong to the organization, and STAFF need an appointment with them. Returns the STAFF member's profile (null for other roles). */
async function requireClient(db: Db, membership: { id: string; role: string }, organizationId: string, clientId: string) {
  const [client] = await db.select({ id: clients.id }).from(clients).where(and(eq(clients.id, clientId), eq(clients.organizationId, organizationId))).limit(1);
  if (!client) throw new TRPCError({ code: "NOT_FOUND", message: CLIENT_NOT_FOUND });
  return requireClinicalPatientAccess(db, membership, organizationId, clientId, CLIENT_NOT_FOUND);
}

export const aestheticRouter = router({
  /** Newest first; voided records are included and flagged (`isVoided`). */
  list: protectedProcedure.input(aestheticListSchema).query(async ({ ctx, input }) => {
    const membership = await requireOrganizationAction(ctx.user, input.organizationId, "clinical:view");
    const db = await requireDb();
    await requireAestheticsOrganization(db, input.organizationId);
    await requireClient(db, membership, input.organizationId, input.clientId);
    const rows = await db.select({
      id: aestheticProcedureRecords.id,
      appointmentId: aestheticProcedureRecords.appointmentId,
      staffProfileId: aestheticProcedureRecords.staffProfileId,
      performedAt: aestheticProcedureRecords.performedAt,
      procedureName: aestheticProcedureRecords.procedureName,
      productName: aestheticProcedureRecords.productName,
      batchNumber: aestheticProcedureRecords.batchNumber,
      productExpiry: aestheticProcedureRecords.productExpiry,
      doseHundredths: aestheticProcedureRecords.doseHundredths,
      doseUnit: aestheticProcedureRecords.doseUnit,
      treatmentAreas: aestheticProcedureRecords.treatmentAreas,
      notes: aestheticProcedureRecords.notes,
      createdAt: aestheticProcedureRecords.createdAt,
      voidedAt: aestheticProcedureRecords.voidedAt,
      voidReason: aestheticProcedureRecords.voidReason,
      recordedByName: users.name,
    }).from(aestheticProcedureRecords)
      .leftJoin(users, eq(users.id, aestheticProcedureRecords.recordedByUserId))
      .where(and(eq(aestheticProcedureRecords.organizationId, input.organizationId), eq(aestheticProcedureRecords.clientId, input.clientId)))
      .orderBy(desc(aestheticProcedureRecords.performedAt), desc(aestheticProcedureRecords.createdAt))
      .limit(500);
    return rows.map(row => ({ ...row, isVoided: !!row.voidedAt }));
  }),

  create: protectedProcedure.input(aestheticCreateSchema).mutation(async ({ ctx, input }) => {
    const membership = await requireOrganizationAction(ctx.user, input.organizationId, "clinical:write");
    const db = await requireDb();
    await requireAestheticsOrganization(db, input.organizationId);
    const access = await requireClient(db, membership, input.organizationId, input.clientId);
    // STAFF record under their own profile only (it defaults to the profile that has the appointment).
    const isStaff = membership.role === "STAFF";
    if (isStaff && input.staffProfileId && input.staffProfileId !== access.staffProfileId) throw new TRPCError({ code: "FORBIDDEN", message: "სხვა სპეციალისტის სახელით ჩანაწერის დამატება შეუძლებელია." });
    const staffProfileId = isStaff ? access.staffProfileId : input.staffProfileId;
    if (input.appointmentId) await requireRecordAppointment(db, access, input.organizationId, input.clientId, input.appointmentId, "ვიზიტი ვერ მოიძებნა ამ კლიენტისთვის.");
    if (!isStaff && staffProfileId) {
      // staff_profiles has no organizationId; scope through the membership.
      const [practitioner] = await db.select({ id: staffProfiles.id }).from(staffProfiles)
        .innerJoin(organizationMemberships, eq(organizationMemberships.id, staffProfiles.membershipId))
        .where(and(eq(staffProfiles.id, staffProfileId), eq(organizationMemberships.organizationId, input.organizationId))).limit(1);
      if (!practitioner) throw new TRPCError({ code: "NOT_FOUND", message: "სპეციალისტი ვერ მოიძებნა." });
    }
    const id = nanoid(21);
    await db.transaction(async tx => {
      await tx.insert(aestheticProcedureRecords).values({
        id,
        organizationId: input.organizationId,
        clientId: input.clientId,
        appointmentId: input.appointmentId ?? null,
        staffProfileId: staffProfileId ?? null,
        performedAt: input.performedAt ?? new Date(),
        procedureName: input.procedureName,
        productName: input.productName ?? null,
        batchNumber: input.batchNumber ?? null,
        productExpiry: input.productExpiry ?? null,
        doseHundredths: input.doseHundredths ?? null,
        doseUnit: input.doseUnit ?? null,
        treatmentAreas: input.treatmentAreas || null,
        notes: input.notes || null,
        recordedByUserId: ctx.user.id,
      });
      await tx.insert(auditLogs).values({ id: nanoid(21), organizationId: input.organizationId, actorUserId: ctx.user.id, action: "AESTHETIC_PROCEDURE_RECORDED", entityType: "aesthetic_procedure_record", entityId: id, afterState: { clientId: input.clientId } });
    });
    return { id };
  }),

  /** Mistakes are voided with a reason, never edited or deleted; add a new record for the corrected data. */
  void: protectedProcedure.input(aestheticVoidSchema).mutation(async ({ ctx, input }) => {
    const membership = await requireOrganizationAction(ctx.user, input.organizationId, "clinical:write");
    const db = await requireDb();
    await requireAestheticsOrganization(db, input.organizationId);
    const [record] = await db.select({ id: aestheticProcedureRecords.id, clientId: aestheticProcedureRecords.clientId, voidedAt: aestheticProcedureRecords.voidedAt }).from(aestheticProcedureRecords)
      .where(and(eq(aestheticProcedureRecords.id, input.id), eq(aestheticProcedureRecords.organizationId, input.organizationId))).limit(1);
    if (!record) throw new TRPCError({ code: "NOT_FOUND", message: "ჩანაწერი ვერ მოიძებნა." });
    await requireClinicalPatientAccess(db, membership, input.organizationId, record.clientId, "ჩანაწერი ვერ მოიძებნა.");
    if (record.voidedAt) throw new TRPCError({ code: "CONFLICT", message: "ჩანაწერი უკვე გაუქმებულია." });
    await db.transaction(async tx => {
      const result = await tx.update(aestheticProcedureRecords)
        .set({ voidedAt: new Date(), voidedByUserId: ctx.user.id, voidReason: input.reason })
        .where(and(eq(aestheticProcedureRecords.id, input.id), eq(aestheticProcedureRecords.organizationId, input.organizationId), isNull(aestheticProcedureRecords.voidedAt)));
      // Lost a race with a concurrent void.
      if (result[0]?.affectedRows !== 1) throw new TRPCError({ code: "CONFLICT", message: "ჩანაწერი უკვე გაუქმებულია." });
      await tx.insert(auditLogs).values({ id: nanoid(21), organizationId: input.organizationId, actorUserId: ctx.user.id, action: "AESTHETIC_PROCEDURE_VOIDED", entityType: "aesthetic_procedure_record", entityId: input.id, afterState: { clientId: record.clientId } });
    });
    return { success: true };
  }),
});
