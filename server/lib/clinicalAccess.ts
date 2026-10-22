import { and, eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { appointments, staffProfiles } from "../../drizzle/schema";
import type { requireDb } from "../db";
import { CLINICAL_ACCESS_STATUSES } from "../../shared/validation";

type Db = Awaited<ReturnType<typeof requireDb>>;

export { CLINICAL_ACCESS_STATUSES };

/**
 * Clinical records are reachable by STAFF only through their own appointments: the member's active staff profile must
 * have an accepted appointment (CLINICAL_ACCESS_STATUSES, past or future) with this client. OWNER/MANAGER are unrestricted.
 * A patient the specialist has no appointment with is NOT_FOUND, exactly like a foreign client (no existence leak).
 * Returns the staff profile that has the appointment, or null for roles that are not restricted.
 * shortcut: a member with several staff profiles is represented by the first matching one, split by profile if that ever happens.
 */
export async function requireClinicalPatientAccess(
  db: Db,
  membership: { id: string; role: string },
  organizationId: string,
  clientId: string,
  notFoundMessage: string,
): Promise<{ staffProfileId: string | null }> {
  if (membership.role !== "STAFF") return { staffProfileId: null };
  const [own] = await db.select({ staffProfileId: appointments.staffProfileId }).from(appointments)
    .innerJoin(staffProfiles, eq(staffProfiles.id, appointments.staffProfileId))
    .where(and(
      eq(staffProfiles.membershipId, membership.id),
      eq(appointments.organizationId, organizationId),
      eq(appointments.clientId, clientId),
      eq(staffProfiles.status, "ACTIVE"),
      inArray(appointments.status, [...CLINICAL_ACCESS_STATUSES]),
    )).limit(1);
  if (!own) throw new TRPCError({ code: "NOT_FOUND", message: notFoundMessage });
  return { staffProfileId: own.staffProfileId };
}

/** A record may be linked to a visit of this client; STAFF only to their own accepted visit. */
export async function requireRecordAppointment(db: Db, access: { staffProfileId: string | null }, organizationId: string, clientId: string, appointmentId: string, notFoundMessage: string) {
  const [appointment] = await db.select({ id: appointments.id }).from(appointments).where(and(
    eq(appointments.id, appointmentId), eq(appointments.organizationId, organizationId), eq(appointments.clientId, clientId),
    access.staffProfileId ? eq(appointments.staffProfileId, access.staffProfileId) : undefined,
    access.staffProfileId ? inArray(appointments.status, [...CLINICAL_ACCESS_STATUSES]) : undefined,
  )).limit(1);
  if (!appointment) throw new TRPCError({ code: "NOT_FOUND", message: notFoundMessage });
}
