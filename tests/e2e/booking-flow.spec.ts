import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

test.describe('Carrtell booking flow structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/book', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'رزرو سرویس در محل' })).toBeVisible();
  });

  test('booking starts with service selection, not vehicle/product clutter', async ({ page }) => {
    await expect(page.locator('[data-booking-step="service"]')).toBeVisible();
    await expect(page.getByText('مرحله ۱ از ۶')).toBeVisible();
    await expect(page.locator('[data-booking-step="vehicle"]')).toBeHidden();
    await expect(page.getByRole('button', { name: /مرحله قبل/ })).toBeDisabled();
  });

  test('cannot continue without selecting a service', async ({ page }) => {
    await page.getByRole('button', { name: /ادامه/ }).click();
    await expect(page.getByText('حداقل یک خدمت را انتخاب کنید.')).toBeVisible();
  });

  test('public booking does not force account login', async ({ page }) => {
    await expect(page).toHaveURL(/\/book/);
    expect(page.url()).not.toContain('/login-otp');
  });

  test('mobile booking has no major horizontal overflow', async ({ page }, testInfo) => {
    test.skip(!/android|iphone|mobile/i.test(testInfo.project.name));
    const overflow = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
    expect(overflow.scrollWidth - overflow.clientWidth).toBeLessThanOrEqual(5);
  });
});
