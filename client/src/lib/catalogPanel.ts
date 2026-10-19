import { gelInputToTetri } from "@shared/money";

export const employmentTypeLabel = { FULL_TIME: "სრული განაკვეთი", PART_TIME: "ნახევარი განაკვეთი", CHAIR_RENTAL: "სავარძლის გაქირავება", FREELANCE: "ფრილანსი" } as const;
export type EmploymentType = keyof typeof employmentTypeLabel;

export type VacancyForm = { locationId: string; title: string; roleCategory: string; employmentType: EmploymentType; salaryFromGel: string; salaryToGel: string; description: string; contactPhone: string; contactEmail: string };
export const emptyVacancyForm: VacancyForm = { locationId: "", title: "", roleCategory: "", employmentType: "FULL_TIME", salaryFromGel: "", salaryToGel: "", description: "", contactPhone: "", contactEmail: "" };

/** Empty salary means "not stated" (null); anything else must be a valid GEL amount, converted to integer tetri. */
export function optionalGelToTetri(value: string): number | null | undefined {
  if (!value.trim()) return null;
  return gelInputToTetri(value) ?? undefined;
}

export function buildVacancyInput(form: VacancyForm): { ok: true; value: Omit<VacancyForm, "salaryFromGel" | "salaryToGel" | "roleCategory" | "contactPhone" | "contactEmail"> & { roleCategory: string | null; salaryFromTetri: number | null; salaryToTetri: number | null; contactPhone: string | null; contactEmail: string | null } } | { ok: false; error: string } {
  const salaryFromTetri = optionalGelToTetri(form.salaryFromGel);
  const salaryToTetri = optionalGelToTetri(form.salaryToGel);
  if (salaryFromTetri === undefined || salaryToTetri === undefined) return { ok: false, error: "ანაზღაურება მიუთითეთ ლარში, მაგ. 1500 ან 1500.50." };
  if (salaryFromTetri !== null && salaryToTetri !== null && salaryFromTetri > salaryToTetri) return { ok: false, error: "მაქსიმალური ანაზღაურება მინიმალურზე ნაკლები ვერ იქნება." };
  const contactPhone = form.contactPhone.trim() || null;
  const contactEmail = form.contactEmail.trim() || null;
  if (!contactPhone && !contactEmail) return { ok: false, error: "მიუთითეთ ტელეფონი ან ელფოსტა." };
  if (!form.locationId) return { ok: false, error: "აირჩიეთ ფილიალი." };
  const { salaryFromGel: _f, salaryToGel: _t, ...rest } = form;
  return { ok: true, value: { ...rest, title: form.title.trim(), description: form.description.trim(), roleCategory: form.roleCategory || null, salaryFromTetri, salaryToTetri, contactPhone, contactEmail } };
}

export function vacancyStatusInfo(row: { status: "DRAFT" | "PUBLISHED" | "CLOSED"; isExpired: boolean }) {
  if (row.status === "PUBLISHED") return row.isExpired ? { label: "ვადაგასული", tone: "warning" as const } : { label: "გამოქვეყნებული", tone: "success" as const };
  return row.status === "CLOSED" ? { label: "დახურული", tone: "neutral" as const } : { label: "დრაფტი", tone: "info" as const };
}

/** `<input type="datetime-local">` value (local time) -> Date, or null when empty/invalid. */
export function localInputToDate(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
export function dateToLocalInput(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}
