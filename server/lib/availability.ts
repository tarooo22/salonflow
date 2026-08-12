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
