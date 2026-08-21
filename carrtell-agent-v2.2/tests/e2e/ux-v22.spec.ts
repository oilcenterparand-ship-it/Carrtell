import { test, expect } from '@playwright/test';

test.describe('Carrtell v2.2 UX signals', () => {
  test('shop primary touch targets are reasonably tappable on mobile', async ({ page }, testInfo) => {
    test.skip(!/android|iphone|mobile/i.test(testInfo.project.name));
    await page.goto('/shop');

    const selectors = [
      '.ct-shop-car-banner-action',
      'a[href="/book"]'
    ];

    for (const selector of selectors) {
      const el = page.locator(selector).first();
      if (await el.count()) {
        const box = await el.boundingBox();
        expect(box, `${selector} has no box`).not.toBeNull();
        if (box) {
          expect(box.height, `${selector} touch height too small`).toBeGreaterThanOrEqual(40);
        }
      }
    }
  });

  test('shop to booking keeps user in public flow', async ({ page }) => {
    await page.goto('/shop');
    const service = page.locator('a[href="/book"]').first();
    await service.click();
    await expect(page).toHaveURL(/\/book/);
    expect(page.url()).not.toContain('/login-otp');
  });
});
