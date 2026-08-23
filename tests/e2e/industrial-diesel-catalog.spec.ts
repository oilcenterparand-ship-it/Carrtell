import { expect, test } from '@playwright/test';

test.describe('Carrtell industrial and diesel catalog', () => {
  test('public industrial route is independent and does not require login', async ({ page }) => {
    await page.goto('/industrial', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /روغن و فیلتر ماشین‌آلات دیزلی و صنعتی/ })).toBeVisible();
    await expect(page).not.toHaveURL(/login|auth|otp/i);
    await expect(page.getByRole('link', { name: /فروشگاه محصولات سواری/ })).toHaveAttribute('href', '/shop');
  });

  test('industrial search and brand filter remain usable', async ({ page }) => {
    await page.goto('/industrial', { waitUntil: 'domcontentloaded' });
    const search = page.getByPlaceholder('جستجو در محصولات صنعتی و دیزلی');
    await expect(search).toBeVisible();
    await search.fill('فیلتر گازوئیل');
    await expect(search).toHaveValue('فیلتر گازوئیل');
    await page.getByRole('button', { name: /پاک‌کردن فیلتر/ }).click();
    await expect(search).toHaveValue('');
  });

  test('mobile industrial page has no major horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/industrial', { waitUntil: 'domcontentloaded' });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(4);
    await expect(page.getByRole('heading', { name: /محصولات صنعتی و دیزلی/ })).toBeVisible();
  });

  test('main passenger shop still opens independently', async ({ page }) => {
    await page.goto('/shop', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
    expect(page.url()).not.toContain('/industrial');
  });
});
