export function gelInputToTetri(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(normalized);
  if (!match) return null;
  const whole = Number(match[1]);
  const fraction = Number((match[2] ?? "").padEnd(2, "0"));
  const tetri = whole * 100 + fraction;
  return Number.isSafeInteger(tetri) ? tetri : null;
}
