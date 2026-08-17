export type BookingCalendarEvent = {
  startsAt: Date;
  endsAt: Date;
  title: string;
  location?: string | null;
  description?: string;
};

function escapeIcsText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function formatIcsDate(value: Date) {
  return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function createBookingCalendarIcs(event: BookingCalendarEvent) {
  const now = formatIcsDate(new Date());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SalonFlow//Booking//KA",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${crypto.randomUUID()}@salonflow`,
    `DTSTAMP:${now}`,
    `DTSTART:${formatIcsDate(event.startsAt)}`,
    `DTEND:${formatIcsDate(event.endsAt)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    event.location ? `LOCATION:${escapeIcsText(event.location)}` : null,
    event.description ? `DESCRIPTION:${escapeIcsText(event.description)}` : null,
    "STATUS:TENTATIVE",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return `${lines.join("\r\n")}\r\n`;
}

export function downloadBookingCalendar(event: BookingCalendarEvent) {
  const blob = new Blob([createBookingCalendarIcs(event)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "salonflow-booking.ics";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
