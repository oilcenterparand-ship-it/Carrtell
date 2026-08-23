import { expect, test } from '@playwright/test';

test.describe('Dynamic cascading category menu', () => {
  test('homepage keeps the compact category rail', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('navigation', { name: 'دسته‌بندی محصولات' })).toBeVisible();
  });

  test('storefront toolbar stays compact and opens the category cascade', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/shop', { waitUntil: 'domcontentloaded' });
    const trigger = page.getByTestId('shop-category-toolbar-trigger');
    await expect(trigger).toContainText('دسته‌بندی محصولات');
    await trigger.click();
    await expect(page.getByTestId('shop-category-desktop-cascade')).toBeVisible();
    await expect(page.getByTestId('mega-menu-promotion')).toBeVisible();
    const rootBranch = page.getByTestId('shop-category-column-0').locator('button[data-has-children="true"]').first();
    await expect(rootBranch).toBeVisible();
    await rootBranch.hover();
    await expect(page.getByTestId('shop-category-column-1')).toBeVisible();
    const menuBox = await page.getByTestId('shop-category-desktop-cascade').boundingBox();
    expect(menuBox?.height || 0).toBeLessThanOrEqual(340);
    await expect(page.locator('[data-shop-amazing], [data-shop-products]').first()).toBeAttached();
  });

  test('desktop menu opens child categories in the next column', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/shop', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('main-hamburger-menu').click();
    await page.getByTestId('drawer-category-trigger').hover();
    const mega = page.getByTestId('dynamic-category-mega-menu');
    await expect(mega).toBeVisible();
    const rootBranch = mega.getByTestId('category-column-0').locator('[data-has-children="true"]').first();
    await expect(rootBranch).toBeVisible();
    await rootBranch.hover();
    await expect(mega.getByTestId('category-column-1')).toBeVisible();
  });

  test('mobile category sheet drills down and supports back navigation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/shop?view=categories', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('mobile-mega-menu-promotion')).toBeVisible();
    const rootCategory = page.locator('[data-category-level="0"][data-has-children="true"]').first();
    await expect(rootCategory).toHaveAttribute('data-category-level', '0');
    const rootFontSize = await rootCategory.locator('.ct-category-choice-copy b').evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize));
    await rootCategory.click();
    const childCategory = page.locator('[data-category-level="1"]').first();
    await expect(childCategory).toHaveAttribute('data-category-level', '1');
    const childFontSize = await childCategory.locator('.ct-category-choice-copy b').evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize));
    expect(rootFontSize).toBeGreaterThan(childFontSize);
    await page.getByRole('button', { name: /بازگشت به مرحله قبل/ }).click();
    await expect(page.locator('[data-category-level="0"][data-has-children="true"]').first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(4);
  });
});
