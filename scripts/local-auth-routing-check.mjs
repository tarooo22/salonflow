import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

try {
  await page.goto("http://127.0.0.1:3000/register", { waitUntil: "networkidle" });
  await page.locator("#auth-name").waitFor({ state: "visible" });
  await page.locator("#auth-email").waitFor({ state: "visible" });
  await page.locator("#auth-password").waitFor({ state: "visible" });
  if ((await page.content()).includes("/app-auth") || page.url().includes("manus.im")) throw new Error("Registration page still exposes Manus OAuth navigation.");

  await page.goto("http://127.0.0.1:3000/login", { waitUntil: "networkidle" });
  await page.locator("#auth-email").waitFor({ state: "visible" });
  await page.locator("#auth-password").waitFor({ state: "visible" });
  if ((await page.content()).includes("/app-auth") || page.url().includes("manus.im")) throw new Error("Login page still exposes Manus OAuth navigation.");

  await page.goto("http://127.0.0.1:3000/app/today", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "შესვლა" }).click();
  await page.waitForURL(/\/login\?returnTo=/);
  if (new URL(page.url()).origin !== "http://127.0.0.1:3000") throw new Error("Protected gate redirected away from local SalonFlow login.");
  console.log("Local auth routing validation passed: register/login forms and protected gate stay inside SalonFlow.");
} finally {
  await browser.close();
}
