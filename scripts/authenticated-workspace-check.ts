import { chromium, type Page } from "playwright";
import { and, eq, inArray, or } from "drizzle-orm";
import { appointmentServices, appointmentStatusHistory, appointments, locationOpeningHours, locations, organizationMemberships, organizations, payments, scheduleLocks, serviceCategories, services, staffLocations, staffProfiles, staffServices, users, workingHourRules } from "../drizzle/schema";
import { createLegacyRecoveryCode, requireDb } from "../server/db";

const baseUrl = "http://127.0.0.1:3000";
const runId = `${Date.now()}${Math.floor(Math.random() * 10_000)}`;
const email = `validation-${runId}@example.test`;
const organizationSlug = `validation-${runId}`;
const publicSlug = `validation-booking-${runId}`;
let validationOpenId: string | null = null;
const routes = [
  ["/app/today", "დღეს"],
  ["/app/calendar", "კალენდარი"],
  ["/app/clients", "კლიენტები"],
  ["/app/staff", "გუნდი"],
  ["/app/reports", "ანგარიშები"],
  ["/app/settings", "პარამეტრები"],
] as const;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function assertVisibleFocus(page: Page, selector: string, label: string) {
  const target = page.locator(selector).filter({ hasNot: page.locator("[disabled]") }).first();
  await target.waitFor({ state: "visible" });
  await target.focus();
  const details = await target.evaluate(element => {
    const style = window.getComputedStyle(element);
    return {
      active: document.activeElement === element,
      outline: `${style.outlineStyle} ${style.outlineWidth}`,
      boxShadow: style.boxShadow,
    };
  });
  assert(details.active, `${label}: expected focused control to become document.activeElement.`);
  assert(
    (details.outline !== "none 0px" && details.outline !== "none 0") || details.boxShadow !== "none",
    `${label}: focused control does not expose a visible focus indicator (${details.outline}; ${details.boxShadow}).`,
  );
}

async function verifyKeyboardNavigation(page: Page) {
  const toggle = page.getByRole("button", { name: "ნავიგაციის გადართვა" });
  await toggle.focus();
  const labels: string[] = [];
  for (let index = 0; index < 7; index += 1) {
    await page.keyboard.press("Tab");
    labels.push(await page.evaluate(() => (document.activeElement as HTMLElement | null)?.innerText?.trim() ?? ""));
  }
  for (const label of ["დღეს", "კალენდარი", "კლიენტები", "გუნდი", "ანგარიშები"]) {
    assert(labels.some(value => value === label), `Keyboard sidebar traversal did not reach “${label}”. Sequence: ${labels.join(" → ")}`);
  }
  await assertVisibleFocus(page, "[data-sidebar=sidebar] button", "Sidebar navigation");
}

async function verifyWorkspaceSurfaces(page: Page, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);
  for (const [route, heading] of routes) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: heading, exact: true }).waitFor({ state: "visible" });
    const noHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    assert(noHorizontalOverflow, `${route} overflows horizontally at ${viewport.width}px.`);
    await assertVisibleFocus(page, "main button, main input, main [role=combobox]", `${route} operational control`);
  }
}

async function verifyErrorStates(page: Page) {
  const protectedFailures = [
    ["/app/today", "დღეს", "appointments.dashboard", "დღის ოპერაციული მონაცემები დროებით ვერ ჩაიტვირთა. გთხოვთ სცადოთ ხელახლა."],
    ["/app/calendar", "კალენდარი", "appointments.listRange", "კალენდრის მონაცემები ვერ ჩაიტვირთა."],
    ["/app/clients", "კლიენტები", "clients.list", "კლიენტების ჩატვირთვა ვერ მოხერხდა."],
    ["/app/staff", "გუნდი", "staff.performance", "სპეციალისტების მაჩვენებლები ვერ ჩაიტვირთა."],
    ["/app/reports", "ანგარიშები", "reporting.revenueSummary", "ანგარიშის მონაცემები დროებით მიუწვდომელია."],
  ] as const;
  for (const [route, heading, procedure, message] of protectedFailures) {
    const requestPattern = new RegExp(`/api/trpc/.*${procedure.replace(".", "\\.")}`);
    await page.route(requestPattern, routeHandler => routeHandler.abort("failed"));
    await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: heading, exact: true }).waitFor({ state: "visible" });
    await page.getByText(message, { exact: true }).waitFor({ state: "visible" });
    await page.unroute(requestPattern);
  }

  const discoveryFailure = /\/api\/trpc\/.*public\.locations/;
  await page.route(discoveryFailure, route => route.abort("failed"));
  await page.goto(`${baseUrl}/book`, { waitUntil: "networkidle" });
  await page.getByText("ონლაინ ჩაწერის მონაცემები დროებით მიუწვდომელია.", { exact: true }).waitFor({ state: "visible" });
  await page.unroute(discoveryFailure);

  const catalogFailure = /\/api\/trpc\/.*public\.bookingCatalog/;
  await page.route(catalogFailure, route => route.abort("failed"));
  await page.goto(`${baseUrl}/book/${publicSlug}`, { waitUntil: "networkidle" });
  await page.getByText("ჩაწერის მონაცემები დროებით მიუწვდომელია. სცადეთ მოგვიანებით.", { exact: true }).waitFor({ state: "visible" });
  await page.unroute(catalogFailure);

  await page.goto(`${baseUrl}/book`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "აირჩიეთ ფილიალი", exact: true }).waitFor({ state: "visible" });
}

async function cleanup() {
  const db = await requireDb();
  const [user] = validationOpenId
    ? await db.select().from(users).where(eq(users.openId, validationOpenId)).limit(1)
    : await db.select().from(users).where(eq(users.normalizedEmail, email)).limit(1);
  const [organization] = await db.select().from(organizations).where(eq(organizations.slug, organizationSlug)).limit(1);
  if (organization) {
    const staffRows = await db.select({ id: staffProfiles.id }).from(staffProfiles)
      .innerJoin(organizationMemberships, eq(staffProfiles.membershipId, organizationMemberships.id))
      .where(eq(organizationMemberships.organizationId, organization.id));
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
    await db.delete(locationOpeningHours).where(inArray(locationOpeningHours.locationId, [organization.id]));
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
  if (user) await db.delete(users).where(and(eq(users.id, user.id), eq(users.openId, user.openId)));
}

async function makeValidationAccountLegacy() {
  const db = await requireDb();
  const [user] = await db.select().from(users).where(eq(users.normalizedEmail, email)).limit(1);
  if (!user) throw new Error("Validation user was not created before legacy-account claim verification.");
  validationOpenId = user.openId;
  await db.update(users).set({ email: null, normalizedEmail: null, loginMethod: null }).where(eq(users.id, user.id));
  return createLegacyRecoveryCode(user.openId);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await context.newPage();

try {
  await page.goto(`${baseUrl}/register`, { waitUntil: "networkidle" });
  await page.locator("#auth-name").fill("Validation Owner");
  await page.locator("#auth-email").fill(email);
  await page.locator("#auth-password").fill("ValidationPassword!2026");
  await page.getByRole("button", { name: "რეგისტრაცია" }).click();
  await page.waitForURL(`${baseUrl}/app/today`);
  await page.getByRole("link", { name: "სამუშაო სივრცის შექმნა" }).click();
  await page.waitForURL(`${baseUrl}/app/setup`);
  await page.locator("#organization-name").fill("SalonFlow Validation Workspace");
  await page.locator("#organization-slug").fill(organizationSlug);
  await page.locator("#location-name").fill("Validation Branch");
  await page.locator("#public-slug").fill(publicSlug);
  await page.getByRole("button", { name: "გაგრძელება" }).click();
  await page.getByText("სამუშაო საათები და გამონაკლისები", { exact: true }).waitFor({ state: "visible" });
  await page.getByRole("button", { name: "გაგრძელება" }).click();
  await page.getByText("პირველი სერვისი და ფასი", { exact: true }).waitFor({ state: "visible" });
  await page.locator("#service-name").fill("Validation Styling");
  await page.locator("#price").fill("75.00");
  await page.getByRole("button", { name: "გაგრძელება" }).click();
  await page.getByText("მფლობელი და გაშვება", { exact: true }).waitFor({ state: "visible" });
  await page.locator("#owner-name").fill("Validation Owner");
  const submitButton = page.locator("form button[type=submit]");
  await submitButton.waitFor({ state: "visible" });
  await submitButton.evaluate(element => (element as HTMLButtonElement).click());
  await page.waitForURL(url => new URL(url).pathname === "/app/today");
  await page.getByRole("heading", { name: "დღეს", exact: true }).waitFor({ state: "visible" });
  await page.getByText("თქვენი SalonFlow მზად არის დასაწყებად", { exact: true }).waitFor({ state: "visible" });

  await page.getByRole("button", { name: "შიდა ჩაწერა" }).click();
  await page.getByLabel("სპეციალისტი").waitFor({ state: "visible" });
  await page.locator("#walkin-start").fill(new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16));
  await page.getByRole("button", { name: "ჩაწერის შექმნა" }).click();
  await page.getByText(/შიდა ჩაწერა შეიქმნა/).waitFor({ state: "visible" });
  await page.getByText("გადასახდელია", { exact: true }).waitFor({ state: "visible" });
  await page.getByRole("button", { name: "გადატანა" }).click();
  await page.getByLabel("ახალი დრო").fill(new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16));
  await page.getByRole("button", { name: "ახალი დროის შენახვა" }).click();
  await page.getByText("ჯავშნის დრო განახლდა.", { exact: true }).waitFor({ state: "visible" });

  await verifyKeyboardNavigation(page);
  await verifyWorkspaceSurfaces(page, { width: 1280, height: 720 });
  await verifyWorkspaceSurfaces(page, { width: 375, height: 812 });
  await page.goto(`${baseUrl}/app/settings`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "პარამეტრები", exact: true }).waitFor({ state: "visible" });
  await page.getByRole("radio", { name: /მუქი/ }).click();
  assert(await page.evaluate(() => document.documentElement.classList.contains("dark")), "Settings theme choice did not apply the dark root class.");
  await page.getByLabel("სახელი").fill("Validation Owner Updated");
  await page.getByRole("button", { name: "პროფილის შენახვა" }).click();
  await page.getByText("პროფილი განახლდა.", { exact: true }).waitFor({ state: "visible" });
  const errorPage = await context.newPage();
  await verifyErrorStates(errorPage);
  await errorPage.close();
  const legacyRecoveryCode = await makeValidationAccountLegacy();
  const claimContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const claimPage = await claimContext.newPage();
  await claimPage.goto(`${baseUrl}/claim-account`, { waitUntil: "networkidle" });
  await claimPage.getByLabel("აღდგენის კოდი").waitFor({ state: "visible" });
  assert(!(await claimPage.locator("main").innerText()).includes("local_"), "Claim screen exposes a raw local account identifier.");
  await claimPage.locator("#recovery-code").fill(legacyRecoveryCode);
  await claimPage.locator("#auth-email").fill(email);
  await claimPage.locator("#auth-password").fill("ValidationPassword!2026");
  await claimPage.getByRole("button", { name: "ანგარიშის აღდგენა" }).click();
  await claimPage.waitForURL(`${baseUrl}/app/today`);
  await claimPage.getByRole("heading", { name: "დღეს", exact: true }).waitFor({ state: "visible" });
  await claimContext.close();
  console.log("Authenticated workspace validation passed: local onboarding, keyboard focus/traversal, and desktop/mobile rendering are healthy.");
} finally {
  await browser.close();
  await cleanup();
}

// Drizzle's MySQL client intentionally keeps a reusable pool alive. This is a
// disposable verification command, so exit once the awaited cleanup completes.
process.exit(0);
