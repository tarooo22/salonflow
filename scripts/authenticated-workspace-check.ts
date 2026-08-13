import { chromium, type Page } from "playwright";
import { and, eq } from "drizzle-orm";
import { locations, organizationMemberships, organizations, users } from "../drizzle/schema";
import { requireDb } from "../server/db";

const baseUrl = "http://127.0.0.1:3000";
const runId = `${Date.now()}${Math.floor(Math.random() * 10_000)}`;
const email = `validation-${runId}@example.test`;
const organizationSlug = `validation-${runId}`;
const publicSlug = `validation-booking-${runId}`;
const routes = [
  ["/app/today", "დღეს"],
  ["/app/calendar", "კალენდარი"],
  ["/app/clients", "კლიენტები"],
  ["/app/staff", "გუნდი"],
  ["/app/reports", "ანგარიშები"],
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
  await page.getByRole("button", { name: "სამუშაო სივრცის შექმნა" }).click();
  await page.waitForURL(`${baseUrl}/app/today`);
  await page.getByRole("heading", { name: "დღეს", exact: true }).waitFor({ state: "visible" });

  await verifyKeyboardNavigation(page);
  await verifyWorkspaceSurfaces(page, { width: 1280, height: 720 });
  await verifyWorkspaceSurfaces(page, { width: 375, height: 812 });
  const errorPage = await context.newPage();
  await verifyErrorStates(errorPage);
  await errorPage.close();
  console.log("Authenticated workspace validation passed: local onboarding, keyboard focus/traversal, and desktop/mobile rendering are healthy.");
} finally {
  await browser.close();
  await cleanup();
}

// Drizzle's MySQL client intentionally keeps a reusable pool alive. This is a
// disposable verification command, so exit once the awaited cleanup completes.
process.exit(0);
