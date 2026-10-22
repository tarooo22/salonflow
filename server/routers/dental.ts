import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { appointments, auditLogs, clients, dentalToothRecords, organizations, users } from "../../drizzle/schema";
import { dentalChartSchema, dentalRecordSchema, dentalToothHistorySchema } from "../../shared/validation";
import { protectedProcedure, router } from "../_core/trpc";
import { requireOrganizationAction } from "../access";
import { requireDb } from "../db";
import { requireClinicalPatientAccess, requireRecordAppointment } from "../lib/clinicalAccess";

type Db = Awaited<ReturnType<typeof requireDb>>;
const PATIENT_NOT_FOUND = "პაციენტი ვერ მოიძებნა.";

/** Only DENTAL workspaces have a tooth chart, the patient must belong to the organization, and STAFF need an appointment with them. */
async function requireDentalClient(db: Db, membership: { id: string; role: string }, organizationId: string, clientId: string) {
  const [organization] = await db.select({ vertical: organizations.vertical }).from(organizations).where(eq(organizations.id, organizationId)).limit(1);
  if (organization?.vertical !== "DENTAL") throw new TRPCError({ code: "FORBIDDEN", message: "კბილების რუკა ხელმისაწვდომია მხოლოდ სტომატოლოგიური კლინიკის სივრცეში." });
  const [client] = await db.select({ id: clients.id }).from(clients).where(and(eq(clients.id, clientId), eq(clients.organizationId, organizationId))).limit(1);
  if (!client) throw new TRPCError({ code: "NOT_FOUND", message: PATIENT_NOT_FOUND });
  return requireClinicalPatientAccess(db, membership, organizationId, clientId, PATIENT_NOT_FOUND);
}

/** Rows must be newest first; keeps the first (latest) entry of every tooth. */
export function latestPerTooth<T extends { toothCode: string }>(rowsNewestFirst: T[]): T[] {
  const seen = new Map<string, T>();
  for (const row of rowsNewestFirst) if (!seen.has(row.toothCode)) seen.set(row.toothCode, row);
  return Array.from(seen.values()).sort((a, b) => Number(a.toothCode) - Number(b.toothCode));
}

export const dentalRouter = router({
  /** Current state per tooth (latest entry of each tooth that has any record). */
  chart: protectedProcedure.input(dentalChartSchema).query(async ({ ctx, input }) => {
    const membership = await requireOrganizationAction(ctx.user, input.organizationId, "clinical:view");
    const db = await requireDb();
    await requireDentalClient(db, membership, input.organizationId, input.clientId);
    const rows = await db.select({
      id: dentalToothRecords.id,
      toothCode: dentalToothRecords.toothCode,
      surfaces: dentalToothRecords.surfaces,
      condition: dentalToothRecords.condition,
      note: dentalToothRecords.note,
      appointmentId: dentalToothRecords.appointmentId,
      recordedAt: dentalToothRecords.recordedAt,
    }).from(dentalToothRecords)
      .where(and(eq(dentalToothRecords.organizationId, input.organizationId), eq(dentalToothRecords.clientId, input.clientId)))
      .orderBy(desc(dentalToothRecords.recordedAt), desc(dentalToothRecords.id));
    return latestPerTooth(rows);
  }),

  /** All entries of one tooth, newest first, with the recorder's display name. */
  toothHistory: protectedProcedure.input(dentalToothHistorySchema).query(async ({ ctx, input }) => {
    const membership = await requireOrganizationAction(ctx.user, input.organizationId, "clinical:view");
    const db = await requireDb();
    await requireDentalClient(db, membership, input.organizationId, input.clientId);
    return db.select({
      id: dentalToothRecords.id,
      toothCode: dentalToothRecords.toothCode,
      surfaces: dentalToothRecords.surfaces,
      condition: dentalToothRecords.condition,
      note: dentalToothRecords.note,
      appointmentId: dentalToothRecords.appointmentId,
      recordedAt: dentalToothRecords.recordedAt,
      recordedByName: users.name,
    }).from(dentalToothRecords)
      .leftJoin(users, eq(users.id, dentalToothRecords.recordedByUserId))
      .where(and(eq(dentalToothRecords.organizationId, input.organizationId), eq(dentalToothRecords.clientId, input.clientId), eq(dentalToothRecords.toothCode, input.toothCode)))
      .orderBy(desc(dentalToothRecords.recordedAt), desc(dentalToothRecords.id))
      .limit(200);
  }),

  /** Append-only: a correction is a new entry. */
  record: protectedProcedure.input(dentalRecordSchema).mutation(async ({ ctx, input }) => {
    const membership = await requireOrganizationAction(ctx.user, input.organizationId, "clinical:write");
    const db = await requireDb();
    const access = await requireDentalClient(db, membership, input.organizationId, input.clientId);
    if (input.appointmentId) await requireRecordAppointment(db, access, input.organizationId, input.clientId, input.appointmentId, "ვიზიტი ვერ მოიძებნა ამ პაციენტისთვის.");
    // recordedAt has 1-second resolution: keep it strictly after the tooth's previous entry so "latest" is unambiguous.
    const [previous] = await db.select({ recordedAt: dentalToothRecords.recordedAt }).from(dentalToothRecords).where(and(
      eq(dentalToothRecords.organizationId, input.organizationId), eq(dentalToothRecords.clientId, input.clientId), eq(dentalToothRecords.toothCode, input.toothCode),
    )).orderBy(desc(dentalToothRecords.recordedAt)).limit(1);
    // Compare in whole seconds (rounded up, like MySQL's TIMESTAMP rounding) so a quick correction never ties with the entry it corrects.
    const nowSec = Math.ceil(Date.now() / 1000) * 1000;
    const recordedAt = previous && previous.recordedAt.getTime() >= nowSec ? new Date(previous.recordedAt.getTime() + 1000) : new Date(nowSec);
    const id = nanoid(21);
    await db.transaction(async tx => {
      await tx.insert(dentalToothRecords).values({
        id,
        organizationId: input.organizationId,
        clientId: input.clientId,
        toothCode: input.toothCode,
        surfaces: input.surfaces ?? null,
        condition: input.condition,
        note: input.note || null,
        appointmentId: input.appointmentId ?? null,
        recordedByUserId: ctx.user.id,
        recordedAt,
      });
      // No clinical content in the audit trail, only what happened.
      await tx.insert(auditLogs).values({ id: nanoid(21), organizationId: input.organizationId, actorUserId: ctx.user.id, action: "DENTAL_TOOTH_RECORDED", entityType: "dental_tooth_record", entityId: id, afterState: { clientId: input.clientId } });
    });
    return { id, recordedAt };
  }),
});
