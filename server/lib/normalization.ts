const GEORGIAN_COUNTRY_CODE = "995";

export function normalizeEmail(value?: string | null): string | null {
  const normalized = value?.trim().toLocaleLowerCase();
  return normalized || null;
}

/** Normalizes common Georgian mobile inputs to E.164 without guessing non-Georgian numbers. */
export function normalizeGeorgianPhone(value?: string | null): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith(GEORGIAN_COUNTRY_CODE) && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 10 && digits.slice(1, 2) === "5") return `+995${digits.slice(1)}`;
  if (digits.startsWith("5") && digits.length === 9) return `+995${digits}`;
  return null;
}

export function cleanSearch(value?: string | null): string {
  return value?.trim().replace(/[\\%_]/g, "") ?? "";
}

export function toTetri(gel: string | number): number {
  const value = typeof gel === "string" ? Number(gel) : gel;
  if (!Number.isFinite(value)) throw new Error("Invalid money value");
  return Math.round(value * 100);
}

export function formatGelFromTetri(tetri: number, locale = "ka-GE"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "GEL" }).format(tetri / 100);
}
