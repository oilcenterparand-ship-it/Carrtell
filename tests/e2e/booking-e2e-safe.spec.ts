import { test, expect } from '@playwright/test';

test.describe('Carrtell safe booking baseline', () => {
  test('guest booking begins safely without SMS/database writes', async ({ page }) => {
    await page.goto('/book');
    await expect(page.getByRole('heading', { name: 'رزرو سرویس در محل' })).toBeVisible();
    await expect(page.locator('[data-booking-step="service"]')).toBeVisible();
    expect(page.url()).not.toContain('/login-otp');
  });
});
