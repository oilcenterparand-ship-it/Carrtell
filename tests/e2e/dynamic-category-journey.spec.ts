import { expect, test } from '@playwright/test';

test.describe('Dynamic category journey', () => {
  test('category browser is public and starts with a guided heading', async ({ page }) => {
    await page.goto('/categories', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'دسته‌بندی محصولات' })).toBeVisible();
    await expect(page.getByText('انتخاب مرحله‌به‌مرحله محصول')).toBeVisible();
    await expect(page).not.toHaveURL(/login|auth|otp/i);
  });

  test('category route supports deep dynamic slugs without a fatal page', async ({ page }) => {
    const response = await page.goto('/category/15w40', { waitUntil: 'domcontentloaded' });
    expect(response?.status() || 200).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).not.toHaveText(/^\s*$/);
  });

  test('guided category UI has no major mobile overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/categories', { waitUntil: 'domcontentloaded' });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(4);
  });
});
