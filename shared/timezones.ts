export type ZonedDateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function numericParts(value: Date, timeZone: string): ZonedDateParts {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(value);
  const read = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find(part => part.type === type)?.value ?? 0);
  return { year: read("year"), month: read("month"), day: read("day"), hour: read("hour"), minute: read("minute"), second: read("second") };
}

function partsAsUtc(parts: ZonedDateParts) {
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
}

/** Converts a local wall-clock time in an IANA timezone into the matching UTC instant. */
export function zonedDateTimeToUtc(parts: ZonedDateParts, timeZone: string): Date {
  const target = partsAsUtc(parts);
  let timestamp = target;

  // A short convergence loop correctly handles non-whole-hour offsets and DST shifts.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const observed = numericParts(new Date(timestamp), timeZone);
    const difference = target - partsAsUtc(observed);
    if (difference === 0) break;
    timestamp += difference;
  }

  return new Date(timestamp);
}

export function dateKeyInTimeZone(value: Date, timeZone: string): string {
  const { year, month, day } = numericParts(value, timeZone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function timeKeyInTimeZone(value: Date, timeZone: string): string {
  const { hour, minute } = numericParts(value, timeZone);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function datePartsFromKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return { year, month, day };
}

/** Returns true when a YYYY-MM-DD key is before the location's active local day. */
export function isDateKeyInPast(dateKey: string, timeZone: string, reference = new Date()): boolean {
  return dateKey < dateKeyInTimeZone(reference, timeZone);
}

/** Returns true when an optional local HH:mm preference is already elapsed in the location's timezone. */
export function isLocalDateTimeElapsed(dateKey: string, timeKey: string, timeZone: string, reference = new Date()): boolean {
  if (isDateKeyInPast(dateKey, timeZone, reference)) return true;
  if (dateKey > dateKeyInTimeZone(reference, timeZone)) return false;
  const { year, month, day } = datePartsFromKey(dateKey);
  const [hour, minute] = timeKey.split(":").map(Number);
  return zonedDateTimeToUtc({ year, month, day, hour, minute, second: 0 }, timeZone).getTime() <= reference.getTime();
}

function incrementCalendarDate(parts: Pick<ZonedDateParts, "year" | "month" | "day">): Pick<ZonedDateParts, "year" | "month" | "day"> {
  const next = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + 1));
  return { year: next.getUTCFullYear(), month: next.getUTCMonth() + 1, day: next.getUTCDate() };
}

/** Returns the exact UTC range for the active location's current local business day. */
export function businessDayRange(timeZone: string, reference = new Date()): { startsAt: Date; endsAt: Date; dateKey: string } {
  const { year, month, day } = numericParts(reference, timeZone);
  const startParts = { year, month, day, hour: 0, minute: 0, second: 0 };
  const nextDate = incrementCalendarDate(startParts);
  return {
    startsAt: zonedDateTimeToUtc(startParts, timeZone),
    endsAt: zonedDateTimeToUtc({ ...nextDate, hour: 0, minute: 0, second: 0 }, timeZone),
    dateKey: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
  };
}

export function formatTimeInTimeZone(value: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("ka-GE", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(value);
}
