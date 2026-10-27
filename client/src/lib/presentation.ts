import { DATE_NAMES } from "@/components/public/BookingPrimitives";

// Written by hand (not Intl ka-GE currency): browsers without full ka data print "GEL 1,225.00" instead of "1 225,00 ₾".
export function formatGelTetri(tetri: number) {
  const abs = Math.abs(Math.round(tetri));
  const whole = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
  return `${tetri < 0 ? "-" : ""}${whole},${String(abs % 100).padStart(2, "0")}\u00A0₾`;
}

const pad2 = (value: number) => String(value).padStart(2, "0");

// Georgian month names are written out by hand: the browser's ka-GE data is often missing and falls back to English.
function zonedParts(value: Date, timeZone?: string) {
  const parts = new Intl.DateTimeFormat("en-GB", { year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23", ...(timeZone ? { timeZone } : {}) }).formatToParts(value);
  const get = (type: string) => Number(parts.find(part => part.type === type)?.value ?? 0);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute") };
}

/** "23 ოქტ 2026, 14:30" */
export function formatKaDateTime(value: Date, timeZone?: string) {
  const p = zonedParts(value, timeZone);
  return `${p.day} ${DATE_NAMES.ka.monthShort[p.month - 1]} ${p.year}, ${pad2(p.hour)}:${pad2(p.minute)}`;
}

/** "23 ოქტ 2026" */
export function formatKaDate(value: Date, timeZone?: string) {
  const p = zonedParts(value, timeZone);
  return `${p.day} ${DATE_NAMES.ka.monthShort[p.month - 1]} ${p.year}`;
}

/** "14:30" */
export function formatKaTime(value: Date, timeZone?: string) {
  const p = zonedParts(value, timeZone);
  return `${pad2(p.hour)}:${pad2(p.minute)}`;
}

/** "YYYY-MM" -> "ოქტ 2026" */
export function formatKaMonthYear(month: string) {
  const [year, m] = month.split("-").map(Number) as [number, number];
  return `${DATE_NAMES.ka.monthShort[m - 1]} ${year}`;
}

/** "YYYY-MM-DD" -> "ხუთ, 23 ოქტ" (or just "23 ოქტ" without the weekday) */
export function formatKaDayKey(key: string, withWeekday = true) {
  const [y, m, d] = key.split("-").map(Number) as [number, number, number];
  const weekday = DATE_NAMES.ka.weekdayShort[(new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7];
  return `${withWeekday ? `${weekday}, ` : ""}${d} ${DATE_NAMES.ka.monthShort[m - 1]}`;
}

const INTL_LOCALES = { ka: "ka-GE", en: "en-GB", ru: "ru-RU" } as const;

/** Medium date + short time in the visitor's language (public pages). */
export function formatDateTimeForLocale(value: Date, locale: keyof typeof INTL_LOCALES, timeZone?: string) {
  if (locale === "ka") return formatKaDateTime(value, timeZone); // ka-GE ICU data is missing in many browsers
  return new Intl.DateTimeFormat(INTL_LOCALES[locale], { dateStyle: "medium", timeStyle: "short", ...(timeZone ? { timeZone } : {}) }).format(value);
}

const paymentMethodLabels: Record<string, string> = {
  CASH: "ნაღდი ფული",
  CARD_TERMINAL: "ბარათით — ტერმინალი",
  BANK_TRANSFER: "საბანკო გადარიცხვა",
  ONLINE: "ონლაინ გადახდა",
  OTHER: "სხვა მეთოდი",
};

const paymentStateLabels: Record<string, string> = {
  UNPAID: "გადასახდელია",
  PARTIAL: "ნაწილობრივ გადახდილი",
  PAID: "გადახდილი",
  REFUNDED: "დაბრუნებული",
  OVERPAID: "ზედმეტად გადახდილი",
};

export function formatPaymentMethod(method: string) {
  return paymentMethodLabels[method] ?? "სხვა მეთოდი";
}

export function formatPaymentState(state: string | null | undefined) {
  return paymentStateLabels[state ?? "UNPAID"] ?? "გადასახდელია";
}
