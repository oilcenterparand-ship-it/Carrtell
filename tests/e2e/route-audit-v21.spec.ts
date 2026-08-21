import { test, expect } from '@playwright/test';

const staticPublicRoutes = [
  '/', '/shop', '/shop/all-products', '/shop/special-offers', '/shop/featured',
  '/shop/packages', '/cart', '/payment', '/book', '/dashboard', '/investor',
  '/login-otp', '/blog', '/notifications', '/profile/support',
  '/profile/wallet', '/profile/returns', '/authenticity', '/report-bug',
  '/unauthorized'
];

async function assertHealthyPage(page: import('@playwright/test').Page, route: string, errors: string[]) {
  await expect(page.locator('#root')).toBeAttached();
  await expect(page.locator('body')).not.toHaveText(/Cannot GET|Application error|Internal Server Error/i);
  const dims = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth
  }));
  expect(dims.sw - dims.cw, `horizontal overflow on ${route}: ${dims.sw-dims.cw}px`).toBeLessThanOrEqual(8);
  expect(errors, `runtime errors on ${route}: ${errors.join(' | ')}`).toEqual([]);
}

test.describe('Carrtell v2.1 public/customer route audit', () => {
  for (const route of staticPublicRoutes) {
    test(`${route} renders without fatal UI failure`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('body')).toBeVisible();
      await assertHealthyPage(page, route, errors);
    });
  }

  test('/driver protects anonymous users and renders technician login without fatal UI failure', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/driver', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/driver\/login(?:\?|$)/, { timeout: 20_000 });
    await expect(page.getByRole('heading', { name: /ورود سرویس.?کار/ })).toBeVisible({ timeout: 10_000 });
    await assertHealthyPage(page, '/driver -> /driver/login', errors);
  });
});
