import { chromium, type Page } from "playwright";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { and, eq, inArray, or } from "drizzle-orm";
import { appointmentServices, appointmentStatusHistory, appointments, locationOpeningHours, locations, organizationMemberships, organizations, payments, scheduleLocks, serviceCategories, services, staffLocations, staffProfiles, staffServices, users, workingHourRules } from "../drizzle/schema";
import { requireDb } from "../server/db";

const baseUrl = "http://127.0.0.1:3000";
const runId = `${Date.now()}${Math.floor(Math.random() * 10_000)}`;
const email = `screenshots-${runId}@example.test`;
const organizationSlug = `screenshots-${runId}`;
const publicSlug = `salonflow-preview-${runId}`;
const outputDir = "/home/ubuntu/final-salonflow-screenshots";

async function capture(page: Page, fileName: string, path: string, waitForText?: string) {
  await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle" });
  if (waitForText) await page.getByRole("heading", { name: waitForText, exact: true }).waitFor({ state: "visible", timeout: 10_000 });
  await page.screenshot({ path: join(outputDir, `${fileName}.png`), fullPage: true });
}

async function cleanup() {
  const db = await requireDb();
  const [organization] = await db.select().from(organizations).where(eq(organizations.slug, organizationSlug)).limit(1);
  if (organization) {
    const staffRows = await db.select({ id: staffProfiles.id }).from(staffProfiles).innerJoin(organizationMemberships, eq(staffProfiles.membershipId, organizationMemberships.id)).where(eq(organizationMemberships.organizationId, organization.id));
    const serviceRows = await db.select({ id: services.id }).from(services).where(eq(services.organizationId, organization.id));
    const appointmentRows = await db.select({ id: appointments.id }).from(appointments).where(eq(appointments.organizationId, organization.id));
    const staffIds = staffRows.map(row => row.id);
    const serviceIds = serviceRows.map(row => row.id);
    const appointmentIds = appointmentRows.map(row => row.id);
    if (appointmentIds.length) {
      await db.delete(payments).where(inArray(payments.appointmentId, appointmentIds));
      await db.delete(appointmentStatusHistory).where(inArray(appointmentStatusHistory.appointmentId, appointmentIds));
      await db.delete(appointmentServices).where(inArray(appointmentServices.appointmentId, appointmentIds));
      await db.delete(appointments).where(inArray(appointments.id, appointmentIds));
    }
    if (staffIds.length && serviceIds.length) await db.delete(staffServices).where(or(inArray(staffServices.staffProfileId, staffIds), inArray(staffServices.serviceId, serviceIds)));
    else if (staffIds.length) await db.delete(staffServices).where(inArray(staffServices.staffProfileId, staffIds));
    else if (serviceIds.length) await db.delete(staffServices).where(inArray(staffServices.serviceId, serviceIds));
    if (staffIds.length) await db.delete(workingHourRules).where(inArray(workingHourRules.staffProfileId, staffIds));
    if (staffIds.length) await db.delete(scheduleLocks).where(inArray(scheduleLocks.staffProfileId, staffIds));
    const locationRows = await db.select({ id: locations.id }).from(locations).where(eq(locations.organizationId, organization.id));
    const locationIds = locationRows.map(row => row.id);
    if (locationIds.length) {
      await db.delete(locationOpeningHours).where(inArray(locationOpeningHours.locationId, locationIds));
      await db.delete(staffLocations).where(inArray(staffLocations.locationId, locationIds));
    }
    if (staffIds.length) await db.delete(staffProfiles).where(inArray(staffProfiles.id, staffIds));
    if (serviceIds.length) await db.delete(services).where(inArray(services.id, serviceIds));
    await db.delete(serviceCategories).where(eq(serviceCategories.organizationId, organization.id));
    await db.delete(locations).where(eq(locations.organizationId, organization.id));
    await db.delete(organizationMemberships).where(eq(organizationMemberships.organizationId, organization.id));
    await db.delete(organizations).where(eq(organizations.id, organization.id));
  }
  await db.delete(users).where(and(eq(users.normalizedEmail, email), eq(users.loginMethod, "local")));
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

try {
  await mkdir(outputDir, { recursive: true });
  await capture(page, "01-home", "/");
  await capture(page, "02-book-discovery", "/book");
  await capture(page, "03-login", "/login");
  await capture(page, "04-register", "/register");
  await capture(page, "05-claim-account", "/claim-account");
  await capture(page, "06-demo-preview", "/preview-demo");
  await capture(page, "07-not-found", "/404");

  await page.goto(`${baseUrl}/register`, { waitUntil: "networkidle" });
  await page.locator("#auth-name").fill("Preview Operator");
  await page.locator("#auth-email").fill(email);
  await page.locator("#auth-password").fill("PreviewPassword!2026");
  await page.getByRole("button", { name: "რეგისტრაცია" }).click();
  await page.waitForURL(`${baseUrl}/app/today`);
  await page.getByRole("link", { name: "სამუშაო სივრცის შექმნა" }).click();
  await page.waitForURL(`${baseUrl}/app/setup`);
  await page.screenshot({ path: join(outputDir, "08-workspace-setup.png"), fullPage: true });
  await page.locator("#organization-name").fill("SalonFlow Preview Workspace");
  await page.locator("#organization-slug").fill(organizationSlug);
  await page.locator("#location-name").fill("Preview Branch");
  await page.locator("#public-slug").fill(publicSlug);
  await page.getByRole("button", { name: "გაგრძელება" }).click();
  await page.getByRole("button", { name: "გაგრძელება" }).click();
  await page.locator("#service-name").fill("Preview Styling");
  await page.locator("#price").fill("75.00");
  await page.getByRole("button", { name: "გაგრძელება" }).click();
  await page.locator("#owner-name").fill("Preview Operator");
  await page.locator("form button[type=submit]").evaluate(element => (element as HTMLButtonElement).click());
  await page.waitForURL(url => new URL(url).pathname === "/app/today");
  await page.getByRole("heading", { name: "დღეს", exact: true }).waitFor({ state: "visible" });

  await page.getByRole("button", { name: "შიდა ჩაწერა" }).click();
  await page.locator("#walkin-start").fill(new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16));
  await page.getByRole("button", { name: "ჩაწერის შექმნა" }).click();
  await page.getByText(/შიდა ჩაწერა შეიქმნა/).waitFor({ state: "visible" });
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(outputDir, "09-today.png"), fullPage: true });

  await capture(page, "10-calendar", "/app/calendar", "კალენდარი");
  await capture(page, "11-clients", "/app/clients", "კლიენტები");
  await capture(page, "12-services", "/app/services", "სერვისები");
  await capture(page, "13-staff", "/app/staff", "გუნდი");
  await capture(page, "14-reports", "/app/reports", "ანგარიშები");
  await capture(page, "15-settings", "/app/settings", "პარამეტრები");
  await capture(page, "16-public-booking-flow", `/book/${publicSlug}`);
  console.log(`Saved final route screenshots to ${outputDir}`);
} finally {
  await browser.close();
  await cleanup();
}

process.exit(0);
