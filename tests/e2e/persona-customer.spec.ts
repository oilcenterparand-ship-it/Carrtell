import { test, expect } from '@playwright/test';
import { auditBasicUx, assertNoRuntimeErrors, auditBookingSummaryContent, auditHamburgerCompactness, auditPanelDensity, captureVisual, checkOverlayScrollLock, watchRuntime } from './helpers/personaAudit';

test.describe('Persona: Customer', () => {
  test('public shopping journey is usable without forced login', async ({ page }, testInfo) => {
    const runtime = watchRuntime(page);
    await page.goto('/shop');
    await expect(page).not.toHaveURL(/login|admin/);
    await expect(page.locator('body')).toBeVisible();
    await auditBasicUx(page, testInfo, 'customer/shop');

    const menuButton = page.getByRole('button', { name: /باز کردن منو|منو|menu/i }).first();
    if (await menuButton.isVisible().catch(() => false)) {
      await menuButton.click();
      await expect(page).not.toHaveURL(/login/);
      const loginDialog = page.getByText(/ورود با شماره موبایل|ورود به حساب/).first();
      expect(await loginDialog.isVisible().catch(() => false)).toBeFalsy();
      await auditHamburgerCompactness(page, testInfo);
      await auditPanelDensity(page, testInfo, page.locator('.ct-new-drawer').first(), 'customer/hamburger', { maxViewportHeightRatio: 0.96, maxViewportWidthRatio: 0.94 });
      await captureVisual(page, testInfo, 'hamburger-open');
    }
    await assertNoRuntimeErrors(runtime, testInfo, 'customer/shop', '/shop');
  });

  test('booking selection box is compact, locks background, and explains final cost', async ({ page }, testInfo) => {
    const runtime = watchRuntime(page);
    await page.goto('/book');
    await expect(page.locator('body')).toBeVisible();
    await auditBasicUx(page, testInfo, 'customer/booking');

    const cartButton = page.getByRole('button', { name: /مشاهده انتخاب‌های رزرو|سبد|انتخاب.*رزرو|انتخاب‌ها|خلاصه/i }).first();
    if (await cartButton.isVisible().catch(() => false)) {
      await cartButton.click();
      const overlaySelector = '[data-testid="booking-selection-backdrop"], [role="dialog"], [aria-modal="true"]';
      await checkOverlayScrollLock(page, testInfo, overlaySelector, 'customer/booking-selection');
      const dialog = page.getByRole('dialog').first();
      if (await dialog.isVisible().catch(() => false)) {
        await auditPanelDensity(page, testInfo, dialog, 'customer/booking-selection', { maxViewportHeightRatio: 0.74, maxViewportWidthRatio: 0.94, minBottomGap: 12 });
        await auditBookingSummaryContent(page, testInfo, dialog);
      }
      await captureVisual(page, testInfo, 'booking-selection-open');
    }
    await assertNoRuntimeErrors(runtime, testInfo, 'customer/booking', '/book');
  });

  test('mobile bottom navigation keeps correct routes', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'desktop-chrome', 'mobile navigation audit');
    await page.goto('/');
    const shop = page.getByRole('link', { name: /فروشگاه/ }).last();
    if (await shop.isVisible().catch(() => false)) {
      await shop.click();
      await expect(page).toHaveURL(/\/shop(?:$|\?)/);
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(30);
    }
    const book = page.getByRole('link', { name: /رزرو/ }).last();
    if (await book.isVisible().catch(() => false)) {
      await book.click();
      await expect(page).toHaveURL(/\/book(?:$|\?)/);
    }
    await auditBasicUx(page, testInfo, 'customer/mobile-nav');
    await captureVisual(page, testInfo, 'mobile-nav-book');
  });

  test('public download page installs only the customer app', async ({ page }, testInfo) => {
    const runtime = watchRuntime(page);
    await page.goto('/download');
    await expect(page.getByRole('heading', { name: /دانلود و نصب Carrtell/ })).toBeVisible();
    await expect(page.getByText('اپ فروشگاه Carrtell')).toBeVisible();
    await expect(page.getByText('اپ سرویس‌کار Carrtell')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /نصب اپ فروشگاه|نصب شده/ })).toBeVisible();
    await assertNoRuntimeErrors(runtime, testInfo, 'customer/download', '/download');
  });

});
