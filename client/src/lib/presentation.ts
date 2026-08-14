export function formatGelTetri(tetri: number) {
  return new Intl.NumberFormat("ka-GE", { style: "currency", currency: "GEL", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(tetri / 100);
}

export function formatKaDateTime(value: Date, timeZone?: string) {
  return new Intl.DateTimeFormat("ka-GE", { dateStyle: "medium", timeStyle: "short", ...(timeZone ? { timeZone } : {}) }).format(value);
}
