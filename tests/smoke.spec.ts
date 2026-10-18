import { test, expect } from '@playwright/test';

// Read-only smoke checks — safe to run against production. Never submit forms or create data here.

test('health endpoint responds', async ({ request }) => {
  const res = await request.get('/health');
  expect(res.ok()).toBeTruthy();
  expect(await res.json()).toMatchObject({ ok: true, service: 'salonflow' });
});

const publicPages = ['/', '/features', '/pricing', '/faq', '/contact', '/salons', '/book', '/login', '/register'];

for (const path of publicPages) {
  test(`public page ${path} renders without errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    const res = await page.goto(path);
    expect(res?.status()).toBeLessThan(400);
    await expect(page).toHaveTitle(/SalonFlow/);
    await expect(page.locator('#root')).not.toBeEmpty();
    expect(errors).toEqual([]);
  });
}

test('home page is in Georgian', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ka');
});

test('login page shows the sign-in form', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
  await expect(page.locator('input[type="password"]').first()).toBeVisible();
});
