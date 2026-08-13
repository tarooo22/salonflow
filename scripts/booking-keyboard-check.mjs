import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

try {
  await page.goto("http://127.0.0.1:3000/book/gldani-beauty", { waitUntil: "networkidle" });
  const serviceCards = page.locator('button[aria-pressed]');
  await serviceCards.first().waitFor({ state: "visible" });

  let focusedService = false;
  let focusVisible = false;
  for (let index = 0; index < 18; index += 1) {
    await page.keyboard.press("Tab");
    const active = page.locator(":focus");
    if (await active.count() && await active.getAttribute("aria-pressed") !== null) {
      focusedService = true;
      focusVisible = await active.evaluate((element) => element.matches(":focus-visible"));
      break;
    }
  }

  if (!focusedService || !focusVisible) {
    throw new Error("Service card did not receive visible keyboard focus.");
  }

  await page.keyboard.press("Enter");
  await page.waitForFunction(() => document.querySelector('button[aria-pressed="true"]') !== null);

  let focusedContinuation = false;
  for (let index = 0; index < 18; index += 1) {
    await page.keyboard.press("Tab");
    const active = page.locator(":focus");
    if (await active.count() && (await active.textContent())?.includes("გაგრძელება")) {
      focusedContinuation = true;
      break;
    }
  }

  if (!focusedContinuation) {
    throw new Error("Primary continuation CTA was not reachable by keyboard.");
  }

  console.log("Booking keyboard validation passed: service card focus, selection, and continuation CTA Tab reachability.");
} finally {
  await browser.close();
}
