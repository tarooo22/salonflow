import { and, asc, eq, inArray, isNotNull } from "drizzle-orm";
import { appointmentServices, appointments, clients, locations, organizationMemberships, staffProfiles, users } from "../../drizzle/schema";
import type { requireDb } from "../db";
import { dateKeyInTimeZone, timeKeyInTimeZone } from "../../shared/timezones";

type Db = Awaited<ReturnType<typeof requireDb>>;

const BRAND_COLOR = "#CF3F55";
const FOOTER = "Chawera — ონლაინ ჩაწერა";
const SEND_TIMEOUT_MS = 5_000;

export type EmailMessage = { to: string; subject: string; html: string; text: string };
export type SendResult = "sent" | "skipped" | "failed";

// Logs carry only the template name and the outcome. Never addresses, names or tokens.
function log(template: string, result: string) {
  console.info(`[notify] ${template}: ${result}`);
}

export function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character] ?? character);
}

const oneLine = (value: string) => value.replace(/[\r\n]+/g, " ").trim();

/**
 * Origin used for links in emails. PUBLIC_SITE_URL wins, then the Railway-provided public domain.
 * The request Host header is attacker-controlled (a booking made with a forged Host would put a
 * manage-booking token on a foreign domain), so it is only used outside production.
 */
export function resolveSiteOrigin(req?: { get?: (name: string) => string | undefined } | null): string | null {
  const configured = process.env.PUBLIC_SITE_URL?.trim();
  if (configured && /^https?:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(configured.replace(/\/$/, ""))) return configured.replace(/\/$/, "");
  const railway = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (railway && /^[a-z0-9.-]+$/i.test(railway)) return `https://${railway}`;
  if (process.env.NODE_ENV === "production") return null;
  const host = req?.get?.("host");
  if (host && /^[a-z0-9.-]+(?::\d+)?$/i.test(host)) return `${/^(localhost|127\.)/.test(host) ? "http" : "https"}://${host}`;
  return null;
}

/** Sends one email through Resend. Never throws; resolves to what happened. */
export async function sendEmail(message: EmailMessage, template = "email"): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    log(template, "skipped: email not configured");
    return "skipped";
  }
  const from = process.env.NOTIFY_FROM?.trim();
  if (!from) {
    log(template, "skipped: NOTIFY_FROM not set");
    return "skipped";
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [message.to], subject: oneLine(message.subject), html: message.html, text: message.text }),
      signal: controller.signal,
    });
    if (!response.ok) {
      log(template, `failed: http ${response.status}`);
      return "failed";
    }
    log(template, "sent");
    return "sent";
  } catch (error) {
    log(template, controller.signal.aborted ? "failed: timeout" : "failed: network");
    return "failed";
  } finally {
    clearTimeout(timer);
  }
}

// ---------- formatting ----------

const MONTHS = ["იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი", "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"];
const WEEKDAYS = ["კვირა", "ორშაბათი", "სამშაბათი", "ოთხშაბათი", "ხუთშაბათი", "პარასკევი", "შაბათი"];

/** "ორშაბათი, 27 ოქტომბერი, 14:30" in the location's time zone. */
export function formatBookingTime(startsAt: Date, timeZone: string): string {
  const dateKey = dateKeyInTimeZone(startsAt, timeZone);
  const [year, month, day] = dateKey.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${weekday}, ${day} ${MONTHS[month - 1]}, ${timeKeyInTimeZone(startsAt, timeZone)}`;
}

// ---------- templates ----------

export type BookingFacts = {
  salonName: string;
  address?: string | null;
  serviceNames: string[];
  specialistName?: string | null;
  startsAt: Date;
  timeZone: string;
  firstName?: string | null;
};

type Row = { label: string; value: string };

function layout(title: string, intro: string, rows: Row[], action?: { label: string; url: string }) {
  const rowsHtml = rows.map(row => `<tr><td style="padding:6px 12px 6px 0;color:#6b7280;vertical-align:top;white-space:nowrap">${escapeHtml(row.label)}</td><td style="padding:6px 0;color:#111827">${escapeHtml(row.value)}</td></tr>`).join("");
  const actionHtml = action ? `<p style="margin:24px 0"><a href="${escapeHtml(action.url)}" style="display:inline-block;background:${BRAND_COLOR};color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">${escapeHtml(action.label)}</a></p>` : "";
  const html = `<!doctype html><html lang="ka"><body style="margin:0;padding:24px;background:#f9fafb;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5"><div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px;border-top:4px solid ${BRAND_COLOR}"><h1 style="margin:0 0 12px;font-size:20px;color:${BRAND_COLOR}">${escapeHtml(title)}</h1><p style="margin:0 0 16px;color:#111827">${escapeHtml(intro)}</p><table role="presentation" style="border-collapse:collapse;font-size:15px">${rowsHtml}</table>${actionHtml}<p style="margin:24px 0 0;padding-top:16px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:13px">${escapeHtml(FOOTER)}</p></div></body></html>`;
  const text = [title, "", intro, "", ...rows.map(row => `${row.label}: ${row.value}`), ...(action ? ["", `${action.label}: ${action.url}`] : []), "", FOOTER].join("\n");
  return { html, text };
}

function bookingRows(facts: BookingFacts, status?: string): Row[] {
  return [
    { label: "სალონი", value: facts.salonName },
    ...(facts.address ? [{ label: "მისამართი", value: facts.address }] : []),
    { label: "სერვისი", value: facts.serviceNames.join(", ") },
    ...(facts.specialistName ? [{ label: "სპეციალისტი", value: facts.specialistName }] : []),
    { label: "დრო", value: formatBookingTime(facts.startsAt, facts.timeZone) },
    ...(status ? [{ label: "სტატუსი", value: status }] : []),
  ];
}

export function bookingReceivedEmail(facts: BookingFacts, manageUrl: string | null): Omit<EmailMessage, "to"> {
  const greeting = facts.firstName ? `გამარჯობა, ${facts.firstName}! ` : "";
  const { html, text } = layout(
    "თქვენი ჯავშანი მიღებულია",
    `${greeting}ჯავშანი გაიგზავნა და სალონის დადასტურებას ელოდება. დადასტურებისას შეგატყობინებთ.`,
    bookingRows(facts, "დასადასტურებელია"),
    manageUrl ? { label: "ჯავშნის ნახვა და მართვა", url: manageUrl } : undefined,
  );
  return { subject: `ჯავშანი მიღებულია — ${facts.salonName}`, html, text };
}

export function bookingStatusEmail(facts: BookingFacts, status: "CONFIRMED" | "CANCELLED"): Omit<EmailMessage, "to"> {
  const confirmed = status === "CONFIRMED";
  const greeting = facts.firstName ? `გამარჯობა, ${facts.firstName}! ` : "";
  const { html, text } = layout(
    confirmed ? "თქვენი ჯავშანი დადასტურებულია" : "თქვენი ჯავშანი გაუქმებულია",
    confirmed ? `${greeting}სალონმა ჯავშანი დაადასტურა. გელოდებით!` : `${greeting}სამწუხაროდ, სალონმა ჯავშანი გააუქმა. გთხოვთ, აირჩიოთ სხვა დრო ან დაუკავშირდეთ სალონს.`,
    bookingRows(facts, confirmed ? "დადასტურებულია" : "გაუქმებულია"),
  );
  return { subject: `${confirmed ? "ჯავშანი დადასტურებულია" : "ჯავშანი გაუქმებულია"} — ${facts.salonName}`, html, text };
}

/** No client phone or email on purpose: first name only. */
export function ownerNewBookingEmail(facts: BookingFacts, calendarUrl: string | null): Omit<EmailMessage, "to"> {
  const rows: Row[] = [
    ...(facts.firstName ? [{ label: "კლიენტი", value: facts.firstName }] : []),
    { label: "სერვისი", value: facts.serviceNames.join(", ") },
    ...(facts.specialistName ? [{ label: "სპეციალისტი", value: facts.specialistName }] : []),
    { label: "დრო", value: formatBookingTime(facts.startsAt, facts.timeZone) },
    { label: "ფილიალი", value: facts.salonName },
  ];
  const { html, text } = layout("ახალი ონლაინ ჯავშანი", "ონლაინ ჩაწერით ახალი ჯავშანი შემოვიდა და დასადასტურებელია.", rows, calendarUrl ? { label: "კალენდრის გახსნა", url: calendarUrl } : undefined);
  return { subject: "ახალი ონლაინ ჯავშანი", html, text };
}

// ---------- recipients and data loading ----------

/** Emails of ACTIVE owners and managers of this organization only. */
export async function ownerRecipientEmails(db: Db, organizationId: string): Promise<string[]> {
  const rows = await db.select({ email: users.email }).from(organizationMemberships)
    .innerJoin(users, eq(users.id, organizationMemberships.userId))
    .where(and(
      eq(organizationMemberships.organizationId, organizationId),
      eq(organizationMemberships.status, "ACTIVE"),
      inArray(organizationMemberships.role, ["OWNER", "MANAGER"]),
      eq(users.accountStatus, "ACTIVE"),
      isNotNull(users.email),
    ));
  const seen = new Set<string>();
  for (const row of rows) {
    const email = row.email?.trim();
    if (email && email.includes("@")) seen.add(email.toLowerCase());
  }
  return Array.from(seen);
}

async function loadBooking(db: Db, appointmentId: string) {
  const [row] = await db.select({
    organizationId: appointments.organizationId,
    startsAt: appointments.startsAt,
    staffProfileId: appointments.staffProfileId,
    salonName: locations.name,
    address: locations.address,
    timeZone: locations.timezone,
    firstName: clients.firstName,
    clientEmail: clients.email,
  }).from(appointments)
    .innerJoin(locations, eq(locations.id, appointments.locationId))
    .innerJoin(clients, eq(clients.id, appointments.clientId))
    .where(eq(appointments.id, appointmentId)).limit(1);
  if (!row) return null;
  const serviceRows = await db.select({ name: appointmentServices.serviceNameSnapshot }).from(appointmentServices)
    .where(eq(appointmentServices.appointmentId, appointmentId)).orderBy(asc(appointmentServices.sortOrder));
  const [staff] = await db.select({ name: staffProfiles.publicDisplayName }).from(staffProfiles).where(eq(staffProfiles.id, row.staffProfileId)).limit(1);
  const facts: BookingFacts = {
    salonName: row.salonName, address: row.address, serviceNames: serviceRows.map(service => service.name),
    specialistName: staff?.name ?? null, startsAt: row.startsAt, timeZone: row.timeZone, firstName: row.firstName,
  };
  return { organizationId: row.organizationId, clientEmail: row.clientEmail, facts };
}

const looksLikeEmail = (value: string | null | undefined): value is string => !!value && value.length <= 320 && /^[^\s@]+@[^\s@]+$/.test(value);

function emailConfigured() {
  if (process.env.RESEND_API_KEY) return true;
  log("all", "skipped: email not configured");
  return false;
}

// ---------- orchestration (fire-and-forget; call AFTER the transaction commits) ----------

/** New online booking: confirmation to the customer (if they gave an email) and a heads-up to owners/managers. Never throws. */
export async function notifyNewOnlineBooking(db: Db, input: { appointmentId: string; manageToken: string; customerEmail?: string | null; /** The name typed in this booking; the stored client may belong to someone else (shared phone). */ customerFirstName?: string | null; origin: string | null }): Promise<void> {
  try {
    if (!emailConfigured()) return;
    const booking = await loadBooking(db, input.appointmentId);
    if (!booking) return;
    if (looksLikeEmail(input.customerEmail)) {
      await sendEmail({ to: input.customerEmail, ...bookingReceivedEmail({ ...booking.facts, firstName: input.customerFirstName ?? null }, input.origin ? `${input.origin}/manage-booking/${input.manageToken}` : null) }, "booking_received");
    }
    for (const to of await ownerRecipientEmails(db, booking.organizationId)) {
      await sendEmail({ to, ...ownerNewBookingEmail(booking.facts, input.origin ? `${input.origin}/app/calendar` : null) }, "owner_new_booking");
    }
  } catch {
    log("new_booking", "failed: unexpected");
  }
}

/** Salon confirmed or cancelled a booking: tell the customer if we have an email on record. Never throws. */
export async function notifyAppointmentStatusChange(db: Db, input: { appointmentId: string; status: string }): Promise<void> {
  try {
    if (input.status !== "CONFIRMED" && input.status !== "CANCELLED") return;
    if (!emailConfigured()) return;
    const booking = await loadBooking(db, input.appointmentId);
    if (!booking || !looksLikeEmail(booking.clientEmail)) return;
    await sendEmail({ to: booking.clientEmail, ...bookingStatusEmail(booking.facts, input.status) }, input.status === "CONFIRMED" ? "booking_confirmed" : "booking_cancelled");
  } catch {
    log("status_change", "failed: unexpected");
  }
}
