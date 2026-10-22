export const DOSE_UNITS = [
  { value: "UNITS", label: "ერთეული (U)" },
  { value: "ML", label: "მლ" },
  { value: "MG", label: "მგ" },
  { value: "OTHER", label: "სხვა" },
] as const;
export type DoseUnit = (typeof DOSE_UNITS)[number]["value"];

const MAX_HUNDREDTHS = 10_000_000;

/** "12.5" or "12,5" -> 1250. Parses the text, no float math. Null when empty or invalid (more than 2 decimals, zero, too large). */
export function parseDoseToHundredths(text: string): number | null {
  const match = /^(\d{1,7})(?:[.,](\d{1,2}))?$/.exec(text.trim());
  if (!match) return null;
  const value = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0") || "0");
  return value >= 1 && value <= MAX_HUNDREDTHS ? value : null;
}

export function formatDose(hundredths: number | null | undefined, unit: string | null | undefined): string {
  if (hundredths == null) return "";
  const whole = Math.floor(hundredths / 100);
  const fraction = String(hundredths % 100).padStart(2, "0").replace(/0+$/, "");
  const label = DOSE_UNITS.find(item => item.value === unit)?.label ?? "";
  return `${whole}${fraction ? `.${fraction}` : ""} ${label}`.trim();
}
