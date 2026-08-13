export function gelTextToTetri(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ""] = normalized.split(".");
  const tetri = Number(whole) * 100 + Number((fraction + "00").slice(0, 2));
  return Number.isSafeInteger(tetri) ? tetri : null;
}
