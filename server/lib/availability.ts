import { and, eq, gt, lt, ne } from "drizzle-orm";
import { appointments, locationOpeningHours, scheduleExceptions, workingHourRules, type locations } from "../../drizzle/schema";
import { dateKeyInTimeZone, zonedDateTimeToUtc } from "../../shared/timezones";
import type { requireDb } from "../db";
import { intervalsOverlap } from "./appointments";

export type BusyInterval = { startsAt: Date; endsAt: Date };

export function isSlotAvailable(
  startsAt: Date,
  endsAt: Date,
  busyIntervals: BusyInterval[],
  bufferBeforeMinutes = 0,
  bufferAfterMinutes = 0,
) {
  const protectedStart = new Date(startsAt.getTime() - bufferBeforeMinutes * 60_000);
  const protectedEnd = new Date(endsAt.getTime() + bufferAfterMinutes * 60_000);
  return !busyIntervals.some(interval => intervalsOverlap(protectedStart, protectedEnd, interval.startsAt, interval.endsAt));
}

export function generateAvailableSlots({
  openingStart,
  openingEnd,
  durationMinutes,
  slotIntervalMinutes,
  bufferBeforeMinutes = 0,
  bufferAfterMinutes = 0,
  minimumStart,
  busyIntervals,
}: {
  openingStart: Date;
  openingEnd: Date;
  durationMinutes: number;
  slotIntervalMinutes: number;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
  minimumStart?: Date;
  busyIntervals: BusyInterval[];
}) {
  if (durationMinutes <= 0 || slotIntervalMinutes <= 0 || openingStart >= openingEnd) return [];
  const slots: Array<{ startsAt: Date; endsAt: Date }> = [];
  for (let cursor = new Date(openingStart); ; cursor = new Date(cursor.getTime() + slotIntervalMinutes * 60_000)) {
    const endsAt = new Date(cursor.getTime() + durationMinutes * 60_000);
    if (endsAt.getTime() + bufferAfterMinutes * 60_000 > openingEnd.getTime()) break;
    if (minimumStart && cursor < minimumStart) continue;
    if (isSlotAvailable(cursor, endsAt, busyIntervals, bufferBeforeMinutes, bufferAfterMinutes)) {
      slots.push({ startsAt: cursor, endsAt });
    }
  }
  return slots;
}

type Db = Awaited<ReturnType<typeof requireDb>>;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
type Location = typeof locations.$inferSelect;
type ScheduleExceptionRow = typeof scheduleExceptions.$inferSelect;

/** Schema weekday (0=Monday … 6=Sunday) of the local date of `value`, and a converter from "HH:mm[:ss]" on that date to UTC. */
function localDay(value: Date, timeZone: string) {
  const [year, month, day] = dateKeyInTimeZone(value, timeZone).split("-").map(Number) as [number, number, number];
  const weekday = (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
  const atTime = (time: string) => { const [hour, minute] = time.split(":").map(Number); return zonedDateTimeToUtc({ year, month, day, hour: hour ?? 0, minute: minute ?? 0, second: 0 }, timeZone); };
  return { weekday, atTime };
}

// Service buffers are capped at 240 min (serviceSchema in shared/validation.ts) and appointments copy them, so a stored
// appointment whose [startsAt, endsAt] lies more than this outside a window cannot reach into it with its own buffers.
export const MAX_APPOINTMENT_BUFFER_MINUTES = 240;

/**
 * Where-clause narrowing an appointments read to rows that can overlap [from, to) once their buffers are added:
 * startsAt < to + max buffer AND endsAt > from − max buffer. Callers still run intervalsOverlap on the buffered
 * interval, so overlap semantics are unchanged; this only skips rows that can never match (uses the staff/time index).
 */
export function appointmentsNearWindow(from: Date, to: Date) {
  const margin = MAX_APPOINTMENT_BUFFER_MINUTES * 60_000;
  return and(lt(appointments.startsAt, new Date(to.getTime() + margin)), gt(appointments.endsAt, new Date(from.getTime() - margin)));
}

export type OpeningHourRow = { weekday: number; startLocalTime: string; endLocalTime: string };
export async function fetchOpeningHours(db: Pick<Db, "select">, locationId: string): Promise<OpeningHourRow[]> {
  // shortcut: opening hours are off until salons can edit them and pre-5dd82c1 rows (saved as 0=Sunday) are backfilled; set ENFORCE_OPENING_HOURS=true then.
  if (process.env.ENFORCE_OPENING_HOURS !== "true") return [];
  return db.select({ weekday: locationOpeningHours.weekday, startLocalTime: locationOpeningHours.startLocalTime, endLocalTime: locationOpeningHours.endLocalTime }).from(locationOpeningHours)
    .where(eq(locationOpeningHours.locationId, locationId));
}
/** Opening hours apply only when the location has rows on record; then start ≥ window start and protected end ≤ window end for a window of that weekday. */
export function fitsOpeningHours(opening: OpeningHourRow[], weekday: number, atTime: (time: string) => Date, startsAt: Date, protectedEnd: Date) {
  return !opening.length || opening.some(row => row.weekday === weekday && startsAt.getTime() >= atTime(row.startLocalTime).getTime() && protectedEnd.getTime() <= atTime(row.endLocalTime).getTime());
}

// One blocking-exception rule for the read side (availableSlots), the public commit side (isStartOffered) and staff moves.
export function fetchBlockingExceptions(db: Pick<Db, "select">, location: Pick<Location, "organizationId">, from: Date, to: Date) {
  return db.select().from(scheduleExceptions).where(and(eq(scheduleExceptions.organizationId, location.organizationId), ne(scheduleExceptions.type, "EXTENDED_WORKING_TIME"), lt(scheduleExceptions.startsAt, to), gt(scheduleExceptions.endsAt, from)));
}
export function exceptionBlocks(exception: Pick<ScheduleExceptionRow, "staffProfileId" | "locationId" | "startsAt" | "endsAt">, locationId: string, staffProfileId: string, startsAt: Date, endsAt: Date) {
  // A staff exception (leave, sick day) follows the person to every location; location scope only narrows closures.
  const applies = exception.staffProfileId != null ? exception.staffProfileId === staffProfileId : (exception.locationId == null || exception.locationId === locationId);
  return applies && intervalsOverlap(startsAt, endsAt, exception.startsAt, exception.endsAt);
}

// Commit-time twin of availableSlots: the start must sit on the staff member's working-hour slot grid, fit the
// location's opening hours (when on record) and clear every closure/exception. Appointment overlap is checked by the caller.
export async function isStartOffered(tx: Tx, location: Location, staffProfileId: string, startsAt: Date, durationMinutes: number, bufferBeforeMinutes: number, bufferAfterMinutes: number) {
  const { weekday, atTime } = localDay(startsAt, location.timezone);
  const rules = await tx.select({ startLocalTime: workingHourRules.startLocalTime, endLocalTime: workingHourRules.endLocalTime }).from(workingHourRules)
    .where(and(eq(workingHourRules.staffProfileId, staffProfileId), eq(workingHourRules.locationId, location.id), eq(workingHourRules.weekday, weekday)));
  const onGrid = rules.some(rule => generateAvailableSlots({ openingStart: atTime(rule.startLocalTime), openingEnd: atTime(rule.endLocalTime), durationMinutes, slotIntervalMinutes: location.slotIntervalMinutes, bufferBeforeMinutes, bufferAfterMinutes, busyIntervals: [] }).some(slot => slot.startsAt.getTime() === startsAt.getTime()));
  if (!onGrid) return false;
  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);
  if (!fitsOpeningHours(await fetchOpeningHours(tx, location.id), weekday, atTime, startsAt, new Date(endsAt.getTime() + bufferAfterMinutes * 60_000))) return false;
  const exceptions = await fetchBlockingExceptions(tx, location, startsAt, endsAt);
  return !exceptions.some(exception => exceptionBlocks(exception, location.id, staffProfileId, startsAt, endsAt));
}

/**
 * Staff-side hours check (calendar moves, walk-ins): the window rule of generateAvailableSlots without the slot grid,
 * i.e. start ≥ window start and end + after-buffer ≤ window end, on the start's local day. The visit must fit one of the
 * staff member's working-hour windows and, when the location has opening hours on record, an opening-hours window of
 * that weekday; or else one of the staff member's EXTENDED_WORKING_TIME exceptions. Blocking exceptions are checked separately.
 */
export async function fitsWorkingHours(db: Pick<Db, "select">, location: Pick<Location, "id" | "organizationId" | "timezone">, staffProfileId: string, startsAt: Date, endsAt: Date, bufferAfterMinutes: number) {
  const { weekday, atTime } = localDay(startsAt, location.timezone);
  const protectedEnd = endsAt.getTime() + bufferAfterMinutes * 60_000;
  const fits = (windowStart: Date, windowEnd: Date) => startsAt.getTime() >= windowStart.getTime() && protectedEnd <= windowEnd.getTime();
  const rules = await db.select({ startLocalTime: workingHourRules.startLocalTime, endLocalTime: workingHourRules.endLocalTime }).from(workingHourRules)
    .where(and(eq(workingHourRules.staffProfileId, staffProfileId), eq(workingHourRules.locationId, location.id), eq(workingHourRules.weekday, weekday)));
  if (!rules.some(rule => fits(atTime(rule.startLocalTime), atTime(rule.endLocalTime)))) {
    const extensions = await db.select().from(scheduleExceptions).where(and(eq(scheduleExceptions.organizationId, location.organizationId), eq(scheduleExceptions.staffProfileId, staffProfileId), eq(scheduleExceptions.type, "EXTENDED_WORKING_TIME"), lt(scheduleExceptions.startsAt, new Date(protectedEnd)), gt(scheduleExceptions.endsAt, startsAt)));
    // An approved extension is explicit opening for that person, so it also stands in for the location's opening hours.
    return extensions.some(extension => (extension.locationId == null || extension.locationId === location.id) && fits(extension.startsAt, extension.endsAt));
  }
  return fitsOpeningHours(await fetchOpeningHours(db, location.id), weekday, atTime, startsAt, new Date(protectedEnd));
}
