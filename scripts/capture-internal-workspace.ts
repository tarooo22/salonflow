import { chromium } from "playwright";
import { and, eq } from "drizzle-orm";
import { locations, organizationMemberships, organizations, users } from "../drizzle/schema";
import { requireDb } from "../server/db";

const baseUrl = "http://127.0.0.1:3000";
const runId = `${Date.now()}${Math.floor(Math.random() * 10_000)}`;
const email = `internal-capture-${runId}@example.test`;
const organizationSlug = `internal-capture-${runId}`;
const publicSlug = `internal-booking-${runId}`;
const outputDirectory = "/home/ubuntu/screenshots";
const screens = [
  ["/app/today", "დღეს", "salonflow-internal-today.png"],
  ["/app/calendar", "კალენდარი", "salonflow-internal-calendar.png"],
  ["/app/clients", "კლიენტები", "salonflow-internal-clients.png"],
  ["/app/staff", "გუნდი", "salonflow-internal-staff.png"],
  ["/app/reports", "ანგარიშები", "salonflow-internal-reports.png"],
] as const;

async function cleanup() {
  const db = await requireDb();
  const [user] = await db.select().from(users).where(eq(users.normalizedEmail, email)).limit(1);
  const [organization] = await db.select().from(organizations).where(eq(organizations.slug, organizationSlug)).limit(1);
  if (organization) {
    await db.delete(locations).where(eq(locations.organizationId, organization.id));
    await db.delete(organizationMemberships).where(eq(organizationMemberships.organizationId, organization.id));
    await db.delete(organizations).where(eq(organizations.id, organization.id));
  }
  if (user) await db.delete(users).where(and(eq(users.id, user.id), eq(users.normalizedEmail, email)));
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

try {
  await page.goto(`${baseUrl}/register`, { waitUntil: "networkidle" });
  await page.locator("#auth-name").fill("Internal Preview Owner");
  await page.locator("#auth-email").fill(email);
  await page.locator("#auth-password").fill("InternalPreviewPassword!2026");
  await page.getByRole("button", { name: "რეგისტრაცია" }).click();
  await page.waitForURL(`${baseUrl}/app/today`);
  await page.getByRole("link", { name: "სამუშაო სივრცის შექმნა" }).click();
  await page.waitForURL(`${baseUrl}/app/setup`);
  await page.locator("#organization-name").fill("SalonFlow შიდა Preview");
  await page.locator("#organization-slug").fill(organizationSlug);
  await page.locator("#location-name").fill("Preview ფილიალი");
  await page.locator("#public-slug").fill(publicSlug);
  await page.getByRole("button", { name: "სამუშაო სივრცის შექმნა" }).click();
  await page.waitForURL(`${baseUrl}/app/today`);

  for (const [route, heading, filename] of screens) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: heading, exact: true }).waitFor({ state: "visible" });
    await page.screenshot({ path: `${outputDirectory}/${filename}`, fullPage: true });
  }
  console.log(`Internal workspace screenshots captured in ${outputDirectory}.`);
} finally {
  await browser.close();
  await cleanup();
}

process.exit(0);
