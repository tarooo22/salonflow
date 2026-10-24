/** Georgian phone for display: "+995599352314" -> "+995 599 35 23 14". Unknown shapes are returned unchanged. */
export function formatPhoneDisplay(raw: string): string {
  const digits = raw.replace(/[\s()-]/g, "");
  const m = /^(?:\+?995)?(\d{9})$/.exec(digits);
  if (!m) return raw;
  const n = m[1];
  // shortcut: only 2-digit landline codes (32 Tbilisi, 31 Batumi, ...) are grouped as 2+1+2+2+2; upgrade if 3-4 digit codes matter
  if (n.startsWith("5")) return `+995 ${n.slice(0, 3)} ${n.slice(3, 5)} ${n.slice(5, 7)} ${n.slice(7)}`;
  return `+995 ${n.slice(0, 2)} ${n.slice(2, 3)} ${n.slice(3, 5)} ${n.slice(5, 7)} ${n.slice(7)}`;
}
