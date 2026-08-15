import { chromium, type Page } from "playwright";
import { and, eq, inArray, or } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { appointmentServices, appointments, clients, expenses, locationOpeningHours, locations, organizationMemberships, organizations, payments, serviceCategories, services, staffLocations, staffProfiles, staffServices, users, workingHourRules } from "../drizzle/schema";
import { requireDb } from "../server/db";
import { createLegacyRecoveryCode } from "../server/lib/recoveryCodes";

const baseUrl = "http://127.0.0.1:3000";
const runId = `${Date.now()}${Math.floor(Math.random() * 10_000)}`;
const email = `validation-${runId}@example.test`;
const organizationSlug = `validation-${runId}`;
const publicSlug = `validation-booking-${runId}`;
let validationOpenId: string | null = null;
const shouldCaptureScreenshots = process.env.CAPTURE_SCREENSHOTS !== "0";
const routes = [
  ["/app/today", "დღეს"],
  ["/app/calendar", "კალენდარი"],
  ["/app/clients", "კლიენტები"],
  ["/app/services", "სერვისები"],
  ["/app/staff", "გუნდი"],
  ["/app/reports", "ანგარიშები"],
  ["/app/settings", "პარამეტრები"],
] as const;
const screenshotRoutes = [
  ["today", "/app/today", "დღეს"],
  ["calendar", "/app/calendar", "კალენდარი"],
  ["clients", "/app/clients", "კლიენტები"],
  ["services", "/app/services", "სერვისები"],
  ["staff", "/app/staff", "გუნდი"],
  ["reports", "/app/reports", "ანგარიშები"],
  ["settings", "/app/settings", "პარამეტრები"],
] as const;
const publicScreenshotRoutes = [
  ["home", "/", "მეტი დრო სტუმრებისთვის. ნაკლები დრო ქაოსისთვის."],
  ["features", "/features", "ერთი workflow — ჩაწერებიდან ანგარიშებამდე."],
  ["pricing", "/pricing", "ფასები უნდა იყოს ისეთივე მკაფიო, როგორც თქვენი ოპერაციები."],
  ["product-demo", "/demo", "იხილეთ workflow, არა გამოგონილი dashboard."],
  ["faq", "/faq", "სანამ დაიწყებთ, პასუხები ხელთ გქონდეთ."],
  ["contact", "/contact", "კონტაქტის არხი უნდა იყოს რეალური, არა დეკორაცია."],
  ["discovery", "/book", "იპოვეთ თქვენთვის სასურველი ფილიალი."],
  ["booking", `/book/${publicSlug}`, "დაჯავშნეთ თქვენი მშვიდი დრო."],
  ["login", "/login", "კეთილი იყოს თქვენი დაბრუნება"],
  ["register", "/register", "შექმენით თქვენი სამუშაო სივრცის ანგარიში"],
  ["claim", "/claim-account", "აღადგინეთ ძველი ანგარიში"],
  ["not-found", "/404", "ეს გვერდი ვერ ვიპოვეთ."],
  ["demo", "/preview-demo", "SalonFlow-ის სადემონსტრაციო ოპერაციული მონაცემები"],
] as const;
const screenshotViewports = [
  ["mobile", { width: 375, height: 812 }],
  ["phone-plus", { width: 430, height: 932 }],
  ["tablet", { width: 768, height: 1024 }],
  ["laptop", { width: 1024, height: 900 }],
  ["wide", { width: 1280, height: 900 }],
  ["desktop", { width: 1440, height: 1000 }],
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
    await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: heading, exact: true }).waitFor({ state: "visible" });
    const noHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    assert(noHorizontalOverflow, `${route} overflows horizontally at ${viewport.width}px.`);
    await assertVisibleFocus(page, "main button, main input, main [role=combobox]", `${route} operational control`);
  }
}

async function verifyBookingInteractionFeedback(page: Page) {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${baseUrl}/book/${publicSlug}`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "დაჯავშნეთ თქვენი მშვიდი დრო.", exact: true }).waitFor({ state: "visible" });

  const continueButton = () => page.locator("div.fixed").getByRole("button", { name: "გაგრძელება", exact: true });
  await continueButton().click();
  const errorSummary = page.locator("[data-booking-error]");
  await errorSummary.getByText("ჯერ აირჩიეთ სერვისი", { exact: true }).waitFor({ state: "visible" });
  assert(await errorSummary.evaluate(element => document.activeElement === element), "Booking validation error summary did not receive focus.");

  await page.emulateMedia({ reducedMotion: "reduce" });
  const errorMotion = await errorSummary.evaluate(element => window.getComputedStyle(element).animationDuration);
  assert(Number.parseFloat(errorMotion) <= 0.001, `Booking reduced-motion animation override was not applied: ${errorMotion}.`);
  await page.emulateMedia({ reducedMotion: "no-preference" });
}

async function captureWorkspaceScreenshots(page: Page) {
  const output = "/home/ubuntu/master-redesign-screenshots";
  await mkdir(output, { recursive: true });
  for (const [name, route, heading] of screenshotRoutes) {
    for (const [mode, viewport] of screenshotViewports) {
      await page.setViewportSize(viewport);
      await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
      await page.getByRole("heading", { name: heading, exact: true }).waitFor({ state: "visible" });
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${output}/${name}-${mode}.png`, fullPage: true });
    }
  }
}

async function capturePublicScreenshots(page: Page) {
  const output = "/home/ubuntu/master-redesign-screenshots";
  await mkdir(output, { recursive: true });
  for (const [name, route, heading] of publicScreenshotRoutes) {
    for (const [mode, viewport] of screenshotViewports) {
      await page.setViewportSize(viewport);
      await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
      await page.getByRole("heading", { name: heading, exact: true }).waitFor({ state: "visible" });
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${output}/${name}-${mode}.png`, fullPage: true });
    }
  }
}

async function seedValidationOperations() {
  const db = await requireDb();
  const [organization] = await db.select().from(organizations).where(eq(organizations.slug, organizationSlug)).limit(1);
  const [owner] = await db.select().from(users).where(eq(users.normalizedEmail, email)).limit(1);
  if (!organization || !owner) throw new Error("Validation workspace was not available for populated screenshot data.");
  const [location] = await db.select().from(locations).where(eq(locations.organizationId, organization.id)).limit(1);
  const [staff] = await db.select({ id: staffProfiles.id }).from(staffProfiles)
    .innerJoin(organizationMemberships, eq(staffProfiles.membershipId, organizationMemberships.id))
    .where(eq(organizationMemberships.organizationId, organization.id)).limit(1);
  const [service] = await db.select().from(services).where(eq(services.organizationId, organization.id)).limit(1);
  if (!location || !staff || !service) throw new Error("Validation workspace setup did not create the location, specialist, or service required for evidence.");

  const clientRows = [
    { id: randomUUID(), organizationId: organization.id, firstName: "ნინო", lastName: "აბაშიძე", normalizedPhone: `+995555${runId.slice(-6)}`, email: `nino-${runId}@example.test`, normalizedEmail: `nino-${runId}@example.test`, source: "INTERNAL", createdByUserId: owner.id },
    { id: randomUUID(), organizationId: organization.id, firstName: "თამარ", lastName: "ბერიძე", normalizedPhone: `+995556${runId.slice(-6)}`, email: `tamar-${runId}@example.test`, normalizedEmail: `tamar-${runId}@example.test`, source: "INTERNAL", createdByUserId: owner.id },
    { id: randomUUID(), organizationId: organization.id, firstName: "ანა", lastName: "გელაშვილი", normalizedPhone: `+995557${runId.slice(-6)}`, email: `ana-${runId}@example.test`, normalizedEmail: `ana-${runId}@example.test`, source: "INTERNAL", createdByUserId: owner.id },
  ];
  await db.insert(clients).values(clientRows);
  const now = new Date();
  const appointmentRows = clientRows.map((client, index) => {
    const startsAt = new Date(now.getTime() + (index - 1) * 60 * 60 * 1000);
    const endsAt = new Date(startsAt.getTime() + service.defaultDurationMinutes * 60 * 1000);
    return {
      id: randomUUID(), organizationId: organization.id, locationId: location.id, clientId: client.id, staffProfileId: staff.id,
      startsAt, endsAt, source: "RECEPTION" as const, status: (index === 0 ? "COMPLETED" : index === 1 ? "CONFIRMED" : "PENDING") as const,
      subtotalTetri: service.priceTetri, totalTetri: service.priceTetri, createdByUserId: owner.id, idempotencyKey: `dark-luxury-${runId}-${index}`,
    };
  });
  await db.insert(appointments).values(appointmentRows);
  await db.insert(appointmentServices).values(appointmentRows.map((appointment, index) => ({
    id: randomUUID(), appointmentId: appointment.id, serviceId: service.id, staffProfileId: staff.id, serviceNameSnapshot: service.nameKa,
    durationMinutesSnapshot: service.defaultDurationMinutes, priceTetriSnapshot: service.priceTetri, sortOrder: index,
  })));
  await db.insert(payments).values([
    { id: randomUUID(), appointmentId: appointmentRows[0].id, amountTetri: service.priceTetri, method: "CARD_TERMINAL", status: "PAID", collectedByUserId: owner.id, collectedAt: now },
    { id: randomUUID(), appointmentId: appointmentRows[1].id, amountTetri: Math.floor(service.priceTetri / 2), method: "CASH", status: "PAID", collectedByUserId: owner.id, collectedAt: now },
  ]);
  await db.insert(expenses).values({ id: randomUUID(), organizationId: organization.id, locationId: location.id, category: "ოპერაციული მარაგი", amountTetri: 1800, expenseDate: now.toISOString().slice(0, 10), description: "Disposable Dark Luxury evidence expense", createdByUserId: owner.id });
}

async function verifyErrorStates(page: Page) {
  const protectedFailures = [
    ["/app/today", "დღეს", "appointments.dashboard", "დღის ოპერაციული მონაცემები ვერ ჩაიტვირთა"],
    ["/app/calendar", "კალენდარი", "appointments.listRange", "კალენდრის მონაცემები ვერ ჩაიტვირთა"],
    ["/app/clients", "კლიენტები", "clients.list", "კლიენტების ჩატვირთვა ვერ მოხერხდა"],
    ["/app/staff", "გუნდი", "staff.performance", "სპეციალისტების მაჩვენებლები ვერ ჩაიტვირთა."],
    ["/app/reports", "ანგარიშები", "reporting.revenueSummary", "ანგარიშის მონაცემები დროებით მიუწვდომელია"],
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
  await page.getByText("ჩაწერის მონაცემები დროებით მიუწვდომელია. შეამოწმეთ კავშირი და სცადეთ მოგვიანებით.", { exact: true }).waitFor({ state: "visible" });
  await page.unroute(catalogFailure);

  await page.goto(`${baseUrl}/book`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "იპოვეთ თქვენთვის სასურველი ფილიალი.", exact: true }).waitFor({ state: "visible" });
}

async function cleanup() {
  const db = await requireDb();
  const [user] = validationOpenId
    ? await db.select().from(users).where(eq(users.openId, validationOpenId)).limit(1)
    : await db.select().from(users).where(eq(users.normalizedEmail, email)).limit(1);
  const [organization] = await db.select().from(organizations).where(eq(organizations.slug, organizationSlug)).limit(1);
  if (organization) {
    const appointmentRows = await db.select({ id: appointments.id, clientId: appointments.clientId }).from(appointments).where(eq(appointments.organizationId, organization.id));
    const appointmentIds = appointmentRows.map(row => row.id);
    const clientIds = appointmentRows.flatMap(row => row.clientId ? [row.clientId] : []);
    if (appointmentIds.length) {
      await db.delete(payments).where(inArray(payments.appointmentId, appointmentIds));
      await db.delete(appointmentServices).where(inArray(appointmentServices.appointmentId, appointmentIds));
      await db.delete(appointments).where(inArray(appointments.id, appointmentIds));
    }
    await db.delete(expenses).where(eq(expenses.organizationId, organization.id));
    if (clientIds.length) await db.delete(clients).where(inArray(clients.id, clientIds));
    const staffRows = await db.select({ id: staffProfiles.id }).from(staffProfiles)
      .innerJoin(organizationMemberships, eq(staffProfiles.membershipId, organizationMemberships.id))
      .where(eq(organizationMemberships.organizationId, organization.id));
    const serviceRows = await db.select({ id: services.id }).from(services).where(eq(services.organizationId, organization.id));
    const staffIds = staffRows.map(row => row.id);
    const serviceIds = serviceRows.map(row => row.id);
    if (staffIds.length && serviceIds.length) await db.delete(staffServices).where(or(inArray(staffServices.staffProfileId, staffIds), inArray(staffServices.serviceId, serviceIds)));
    else if (staffIds.length) await db.delete(staffServices).where(inArray(staffServices.staffProfileId, staffIds));
    else if (serviceIds.length) await db.delete(staffServices).where(inArray(staffServices.serviceId, serviceIds));
    if (staffIds.length) await db.delete(workingHourRules).where(inArray(workingHourRules.staffProfileId, staffIds));
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
  return user.openId;
}

const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ?? "/usr/bin/chromium" });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await context.newPage();

try {
  await page.goto(`${baseUrl}/register`, { waitUntil: "networkidle" });
  await page.locator("#auth-name").fill("Validation Owner");
  await page.locator("#auth-email").fill(email);
  await page.locator("#auth-password").fill("ValidationPassword!2026");
  await page.getByRole("button", { name: "ანგარიშის შექმნა" }).click();
  await page.waitForFunction(() => window.location.pathname === "/app/today");
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

  await seedValidationOperations();
  if (shouldCaptureScreenshots) {
    await captureWorkspaceScreenshots(page);
    await capturePublicScreenshots(page);
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`${baseUrl}/app/today`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "დღეს", exact: true }).waitFor({ state: "visible" });
  await verifyKeyboardNavigation(page);
  await verifyWorkspaceSurfaces(page, { width: 1280, height: 720 });
  await verifyWorkspaceSurfaces(page, { width: 375, height: 812 });
  await verifyWorkspaceSurfaces(page, { width: 430, height: 932 });
  await verifyWorkspaceSurfaces(page, { width: 768, height: 1024 });
  await verifyWorkspaceSurfaces(page, { width: 1024, height: 900 });
  await verifyWorkspaceSurfaces(page, { width: 1440, height: 1000 });
  await verifyBookingInteractionFeedback(page);
  const errorPage = await context.newPage();
  await verifyErrorStates(errorPage);
  await errorPage.close();
  const legacyOpenId = await makeValidationAccountLegacy();
  const recoveryCode = createLegacyRecoveryCode(legacyOpenId);
  const claimContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const claimPage = await claimContext.newPage();
  await claimPage.goto(`${baseUrl}/claim-account`, { waitUntil: "networkidle" });
  await claimPage.locator("#recovery-code").fill(recoveryCode);
  await claimPage.locator("#auth-email").fill(email);
  await claimPage.locator("#auth-password").fill("ValidationPassword!2026");
  await claimPage.getByRole("button", { name: "ანგარიშის აღდგენა" }).click();
  await claimPage.waitForFunction(() => window.location.pathname === "/app/today");
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
