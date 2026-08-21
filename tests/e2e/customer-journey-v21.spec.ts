import { test, expect } from '@playwright/test';

test.describe('Carrtell customer journey baseline', () => {
  test('guest can browse home -> shop -> booking without forced login', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();

    await page.goto('/shop');
    await expect(page).toHaveURL(/\/shop/);
    expect(page.url()).not.toContain('/login-otp');

    await page.goto('/book');
    await expect(page.getByRole('heading', { name: 'رزرو سرویس در محل' })).toBeVisible();
    expect(page.url()).not.toContain('/login-otp');
  });

  test('booking starts focused on one question: requested service', async ({ page }) => {
    await page.goto('/book');
    await expect(page.locator('[data-booking-step="service"]')).toBeVisible();
    await expect(page.getByText('چه خدماتی برای خودرو می‌خواهید؟')).toBeVisible();
    await expect(page.locator('[data-booking-step="vehicle"]')).toBeHidden();
    await expect(page.locator('[data-booking-step="recommendations"]')).toBeHidden();
    await expect(page.getByRole('button', { name: /ادامه/ })).toBeVisible();
  });

  test('mobile booking does not have major horizontal overflow', async ({ page }, testInfo) => {
    test.skip(!/android|iphone|mobile/i.test(testInfo.project.name));
    await page.goto('/book');
    const d = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    expect(d.sw - d.cw).toBeLessThanOrEqual(5);
  });
});
