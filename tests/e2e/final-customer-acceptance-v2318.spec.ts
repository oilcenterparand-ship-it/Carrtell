import { test, expect } from '@playwright/test';

const routes = ['/', '/shop', '/cart', '/book'];

test.describe('Carrtell v2.3.18 final customer acceptance', () => {
  for (const route of routes) {
    test(`${route} has no fatal customer-facing runtime/network failure`, async ({ page }) => {
      const pageErrors: string[] = [];
      const badResponses: string[] = [];

      page.on('pageerror', (error) => pageErrors.push(error.message));
      page.on('response', (response) => {
        const url = response.url();
        if (
          response.status() >= 500 &&
          !url.includes('google') &&
          !url.includes('gstatic')
        ) {
          badResponses.push(`${response.status()} ${url}`);
        }
      });

      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('body')).not.toHaveText(
        /Cannot GET|Internal Server Error|Application error/i,
      );

      expect(pageErrors, `page errors on ${route}`).toEqual([]);
      expect(badResponses, `5xx responses on ${route}`).toEqual([]);
    });
  }

  test('guest hamburger exposes public customer actions without login CTA', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'باز کردن منو' }).click();

    const drawer = page.locator('.ct-new-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer.locator('a[href="/login-otp"]')).toHaveCount(0);
    await expect(drawer.getByRole('button', { name: 'دسته‌بندی محصولات' })).toBeVisible();
    await expect(drawer.getByRole('link', { name: 'فروشگاه' })).toHaveCount(0);
    await expect(drawer.getByRole('link', { name: 'سرویس در محل' })).toBeVisible();
  });

  test('mobile critical pages have no major horizontal overflow', async ({ page }, testInfo) => {
    test.skip(!/android|iphone|mobile/i.test(testInfo.project.name));

    for (const route of ['/', '/shop', '/cart', '/book']) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `horizontal overflow on ${route}`).toBeLessThanOrEqual(8);
    }
  });
});
