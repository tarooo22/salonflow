const DANGEROUS_PREFIXES = ["=", "+", "-", "@", "\t", "\r"];

export function sanitizeCsvCell(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  const shouldEscape = DANGEROUS_PREFIXES.some(prefix => stringValue.startsWith(prefix));
  const escaped = shouldEscape ? `'${stringValue}` : stringValue;
  return escaped.replaceAll('"', '""');
}

export function buildCsv(rows: Array<Record<string, string | number | boolean | null | undefined>>) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map(header => `"${sanitizeCsvCell(row[header])}"`).join(","));
  }
  return lines.join("\n");
}
