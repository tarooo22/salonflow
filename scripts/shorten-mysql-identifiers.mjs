import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const path = "drizzle/railway-initial-schema.sql";
const sql = readFileSync(path, "utf8");
const replacements = new Map();
const cleaned = sql.replace(/`([^`]+)`/g, (full, identifier) => {
  if (identifier.length <= 64) return full;
  if (!replacements.has(identifier)) {
    const digest = createHash("sha256").update(identifier).digest("hex").slice(0, 20);
    replacements.set(identifier, `sf_${digest}`);
  }
  return `\`${replacements.get(identifier)}\``;
});
writeFileSync(path, cleaned);
console.log(`Shortened ${replacements.size} MySQL identifiers.`);
for (const [from, to] of replacements) console.log(`${from} -> ${to}`);
