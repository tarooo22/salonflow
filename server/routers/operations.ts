import { nanoid } from "nanoid";
import { and, asc, desc, eq, gte, isNull, lt } from "drizzle-orm";
import { attendanceEntries, appointments, auditLogs, locations, organizationMemberships, staffLocations, staffProfiles, tips } from "../../drizzle/schema";
import { attendanceClockSchema, attendanceListSchema, tipCreateSchema } from "../../shared/validation";
import { requireOrganizationAction, requireOrganizationRole } from "../access";
import { requireDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

async function ownStaffProfile(db: Awaited<ReturnType<typeof requireDb>>, organizationId: string, userId: number) {
  const [profile] = await db.select({ id: staffProfiles.id }).from(staffProfiles)
    .innerJoin(organizationMemberships, eq(staffProfiles.membershipId, organizationMemberships.id))
    .where(and(eq(organizationMemberships.organizationId, organizationId), eq(organizationMemberships.userId, userId), eq(organizationMemberships.status, "ACTIVE"), eq(staffProfiles.status, "ACTIVE"))).limit(1);
  return profile;
}

export const operationsRouter = router({
  attendanceStatus: protectedProcedure.input(attendanceClockSchema.pick({ organizationId: true, locationId: true })).query(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const db = await requireDb();
    const profile = await ownStaffProfile(db, input.organizationId, ctx.user.id);
    if (!profile) return { profileId: null, active: null };
    const [active] = await db.select().from(attendanceEntries).where(and(eq(attendanceEntries.organizationId, input.organizationId), eq(attendanceEntries.locationId, input.locationId), eq(attendanceEntries.staffProfileId, profile.id), isNull(attendanceEntries.clockOutAt))).orderBy(desc(attendanceEntries.clockInAt)).limit(1);
    return { profileId: profile.id, active: active ?? null };
  }),

  clockIn: protectedProcedure.input(attendanceClockSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const db = await requireDb();
    const profile = await ownStaffProfile(db, input.organizationId, ctx.user.id);
    if (!profile) throw new Error("თქვენი თანამშრომლის პროფილი ჯერ არ არის აქტიური.");
    const [assignment] = await db.select({ staffProfileId: staffLocations.staffProfileId }).from(staffLocations).where(and(eq(staffLocations.staffProfileId, profile.id), eq(staffLocations.locationId, input.locationId))).limit(1);
    if (!assignment) throw new Error("ამ ფილიალზე clock-in წვდომა არ გაქვთ.");
    const [active] = await db.select({ id: attendanceEntries.id }).from(attendanceEntries).where(and(eq(attendanceEntries.organizationId, input.organizationId), eq(attendanceEntries.staffProfileId, profile.id), isNull(attendanceEntries.clockOutAt))).limit(1);
    if (active) throw new Error("თქვენ უკვე გაქვთ ღია სამუშაო დრო.");
    const id = nanoid(21); const now = new Date();
    await db.transaction(async tx => { await tx.insert(attendanceEntries).values({ id, organizationId: input.organizationId, locationId: input.locationId, staffProfileId: profile.id, clockInAt: now, note: input.note, recordedByUserId: ctx.user.id }); await tx.insert(auditLogs).values({ id: nanoid(21), organizationId: input.organizationId, actorUserId: ctx.user.id, action: "ATTENDANCE_CLOCK_IN", entityType: "attendance_entry", entityId: id, afterState: { locationId: input.locationId, clockInAt: now.toISOString() } }); });
    return { id, clockInAt: now };
  }),

  clockOut: protectedProcedure.input(attendanceClockSchema.pick({ organizationId: true, locationId: true })).mutation(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const db = await requireDb();
    const profile = await ownStaffProfile(db, input.organizationId, ctx.user.id);
    if (!profile) throw new Error("თქვენი თანამშრომლის პროფილი ჯერ არ არის აქტიური.");
    const [active] = await db.select().from(attendanceEntries).where(and(eq(attendanceEntries.organizationId, input.organizationId), eq(attendanceEntries.locationId, input.locationId), eq(attendanceEntries.staffProfileId, profile.id), isNull(attendanceEntries.clockOutAt))).orderBy(desc(attendanceEntries.clockInAt)).limit(1);
    if (!active) throw new Error("ღია სამუშაო დრო ვერ მოიძებნა.");
    const now = new Date();
    await db.transaction(async tx => { await tx.update(attendanceEntries).set({ clockOutAt: now }).where(eq(attendanceEntries.id, active.id)); await tx.insert(auditLogs).values({ id: nanoid(21), organizationId: input.organizationId, actorUserId: ctx.user.id, action: "ATTENDANCE_CLOCK_OUT", entityType: "attendance_entry", entityId: active.id, beforeState: { clockInAt: active.clockInAt.toISOString() }, afterState: { clockOutAt: now.toISOString() } }); });
    return { id: active.id, clockInAt: active.clockInAt, clockOutAt: now };
  }),

  listAttendance: protectedProcedure.input(attendanceListSchema).query(async ({ ctx, input }) => {
    const membership = await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"]);
    const db = await requireDb();
    const conditions = [eq(attendanceEntries.organizationId, input.organizationId), gte(attendanceEntries.clockInAt, input.startsAt), lt(attendanceEntries.clockInAt, input.endsAt)];
    if (input.locationId) conditions.push(eq(attendanceEntries.locationId, input.locationId));
    if (membership.role === "STAFF") { const profile = await ownStaffProfile(db, input.organizationId, ctx.user.id); if (!profile) return []; conditions.push(eq(attendanceEntries.staffProfileId, profile.id)); }
    return db.select({ entry: attendanceEntries, staffName: staffProfiles.publicDisplayName, locationName: locations.name }).from(attendanceEntries).innerJoin(staffProfiles, eq(attendanceEntries.staffProfileId, staffProfiles.id)).innerJoin(locations, eq(attendanceEntries.locationId, locations.id)).where(and(...conditions)).orderBy(desc(attendanceEntries.clockInAt));
  }),

  listTips: protectedProcedure.input(attendanceListSchema).query(async ({ ctx, input }) => {
    await requireOrganizationRole(ctx.user, input.organizationId, ["OWNER", "MANAGER", "RECEPTIONIST"]);
    const db = await requireDb(); const conditions = [eq(tips.organizationId, input.organizationId), gte(tips.createdAt, input.startsAt), lt(tips.createdAt, input.endsAt)]; if (input.locationId) conditions.push(eq(tips.locationId, input.locationId));
    return db.select({ tip: tips, staffName: staffProfiles.publicDisplayName, locationName: locations.name }).from(tips).innerJoin(staffProfiles, eq(tips.staffProfileId, staffProfiles.id)).innerJoin(locations, eq(tips.locationId, locations.id)).where(and(...conditions)).orderBy(desc(tips.createdAt));
  }),

  recordTip: protectedProcedure.input(tipCreateSchema).mutation(async ({ ctx, input }) => {
    await requireOrganizationAction(ctx.user, input.organizationId, "tips:record");
    const db = await requireDb();
    const [location] = await db.select({ id: locations.id }).from(locations).where(and(eq(locations.id, input.locationId), eq(locations.organizationId, input.organizationId), eq(locations.status, "ACTIVE"))).limit(1);
    if (!location) throw new Error("არჩეული ფილიალი მიუწვდომელია.");
    const [assignment] = await db.select({ staffProfileId: staffLocations.staffProfileId }).from(staffLocations).where(and(eq(staffLocations.staffProfileId, input.staffProfileId), eq(staffLocations.locationId, input.locationId))).limit(1);
    if (!assignment) throw new Error("არჩეული სპეციალისტი ამ ფილიალზე მიუწვდომელია.");
    if (input.appointmentId) { const [appointment] = await db.select({ id: appointments.id }).from(appointments).where(and(eq(appointments.id, input.appointmentId), eq(appointments.organizationId, input.organizationId), eq(appointments.locationId, input.locationId), eq(appointments.staffProfileId, input.staffProfileId))).limit(1); if (!appointment) throw new Error("ეს ჩაწერა არჩეულ სპეციალისტს ან ფილიალს არ ეკუთვნის."); }
    const id = nanoid(21); const now = new Date();
    await db.transaction(async tx => { await tx.insert(tips).values({ id, organizationId: input.organizationId, locationId: input.locationId, appointmentId: input.appointmentId, staffProfileId: input.staffProfileId, amountTetri: input.amountTetri, method: input.method, collectedByUserId: ctx.user.id, note: input.note }); await tx.insert(auditLogs).values({ id: nanoid(21), organizationId: input.organizationId, actorUserId: ctx.user.id, action: "TIP_RECORDED", entityType: "tip", entityId: id, afterState: { amountTetri: input.amountTetri, staffProfileId: input.staffProfileId, appointmentId: input.appointmentId ?? null, method: input.method, recordedAt: now.toISOString() } }); });
    return { id, createdAt: now };
  }),
});
