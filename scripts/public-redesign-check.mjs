import { chromium } from "playwright";

const baseUrl = "http://127.0.0.1:3000";
const routes = ["/", "/book", "/login", "/register", "/claim-account", "/route-that-does-not-exist", "/preview-demo"];
const widths = [375, 768, 1024, 1440];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const browser = await chromium.launch({ headless: true });
try {
  for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    for (const route of routes) {
      await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
      const layout = await page.evaluate(() => {
        const viewport = window.innerWidth;
        const offenders = Array.from(document.querySelectorAll("body *")).filter(element => {
          const rect = element.getBoundingClientRect();
          return rect.right > viewport + 1 || rect.left < -1;
        }).slice(0, 8).map(element => ({ tag: element.tagName, className: element.getAttribute("class") ?? "", right: Math.round(element.getBoundingClientRect().right), left: Math.round(element.getBoundingClientRect().left) }));
        return { scrollWidth: document.documentElement.scrollWidth, viewport, offenders };
      });
      assert(layout.scrollWidth <= layout.viewport + 1, `${route} horizontally overflows at ${width}px: ${JSON.stringify(layout)}.`);
      await page.locator("body").click({ position: { x: 2, y: 2 } });
      await page.keyboard.press("Tab");
      const focusDetails = await page.evaluate(() => {
        const element = document.activeElement;
        if (!element || element === document.body) return { visible: false, tag: element?.tagName ?? "NONE" };
        const style = window.getComputedStyle(element);
        return { visible: element.matches(":focus-visible") && (style.outlineStyle !== "none" || style.boxShadow !== "none"), tag: element.tagName, focusVisible: element.matches(":focus-visible"), outline: `${style.outlineStyle} ${style.outlineWidth}`, boxShadow: style.boxShadow };
      });
      assert(focusDetails.visible, `${route} has no visible focus affordance at ${width}px: ${JSON.stringify(focusDetails)}.`);
    }
    await context.close();
  }
  console.log("Public redesign validation passed: no horizontal overflow and visible keyboard focus across 375/768/1024/1440 public-auth routes.");
} finally {
  await browser.close();
}
