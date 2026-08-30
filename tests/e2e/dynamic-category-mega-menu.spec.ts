import { expect, test } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

const dynamicCategories = [
  { id: '10000000-0000-4000-8000-000000000001', parent_id: null, title: 'ریشه آزمایشی پویا', slug: 'dynamic-root-qa', image_url: '/images/mega-menu/economy-oil-change.webp', icon_emoji: '🚚', sort_order: 1, is_active: true },
  { id: '10000000-0000-4000-8000-000000000002', parent_id: '10000000-0000-4000-8000-000000000001', title: 'شاخه آزمایشی پویا', slug: 'dynamic-branch-qa', icon_emoji: '🛢️', sort_order: 1, is_active: true },
  { id: '10000000-0000-4000-8000-000000000003', parent_id: '10000000-0000-4000-8000-000000000002', title: 'دسته نهایی پویا', slug: 'dynamic-leaf-qa', icon_emoji: '⚙️', sort_order: 1, is_active: true },
  { id: '10000000-0000-4000-8000-000000000004', parent_id: null, title: 'دسته مادر دوم پویا', slug: 'dynamic-root-second-qa', icon_emoji: '🚗', landing_url: '/industrial', sort_order: 2, is_active: true },
];

async function mockDynamicCategoryData(page: import('@playwright/test').Page) {
  await page.route('**/rest/v1/product_categories*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(dynamicCategories) }));
  await page.route('**/rest/v1/mega_menu_promotions*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: '20000000-0000-4000-8000-000000000001', title: 'تبلیغ پویای ایجنت', subtitle: 'قابل تغییر از پنل مدیریت', badge: 'تست پویا', button_text: 'مشاهده محصولات', image_url: '', link_url: '/industrial', is_active: true }) }));
  await page.route('**/rest/v1/mega_menu_tiles*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
    { id: '30000000-0000-4000-8000-000000000001', title: 'بنر کوچک پویا یک', subtitle: 'قابل مدیریت', badge: 'تست', image_url: '/images/mega-menu/car-cleaning.webp', link_url: '/shop?q=نظافت', sort_order: 1, is_active: true },
    { id: '30000000-0000-4000-8000-000000000002', title: 'بنر کوچک پویا دو', subtitle: 'قابل مدیریت', badge: 'تست', image_url: '/images/mega-menu/fuel-additives.webp', link_url: '/shop?q=مکمل', sort_order: 2, is_active: true },
  ]) }));
}

test.describe('Dynamic cascading category menu', () => {
  test('homepage alone keeps the premium category toolbar on desktop and mobile', async ({ page }) => {
    const categoryRail = page.locator('nav.ct-new-access-row[aria-label="دسته‌بندی محصولات"]');
    await mockDynamicCategoryData(page);

    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await expect(categoryRail).toBeVisible();
      await expect(page.getByTestId('home-hero-promo-tiles')).toContainText('بنر کوچک پویا یک');
      await expect(categoryRail).toContainText('پیشنهاد شگفت‌انگیز');
      await expect(categoryRail).toContainText('پرفروش‌ها');
      await expect(categoryRail).toContainText('پکیج‌های خودرویی');
      if (viewport.width >= 768) await page.getByTestId('home-category-toolbar-trigger').hover();
      else await page.getByTestId('home-category-toolbar-trigger').click();
      await expect(page.getByTestId('home-category-modal')).toBeVisible();
      if (viewport.width >= 768) {
        const railBox = await categoryRail.boundingBox();
        expect(railBox?.height || 0).toBeLessThanOrEqual(30);
        await expect(page.getByTestId('home-category-desktop-cascade')).toBeVisible();
        await expect(page.getByTestId('home-mega-menu-promotion')).toContainText('تبلیغ پویای ایجنت');
        await expect(page.getByTestId('home-category-column-0')).toContainText('ریشه آزمایشی پویا');
        await expect(page.getByTestId('home-category-modal').locator('.ct-home-category-desktop-title > b')).toHaveText('دسته‌بندی محصولات');
        const triggerBox = await page.getByTestId('home-category-toolbar-trigger').boundingBox();
        const sheetBox = await page.locator('.ct-home-category-sheet').boundingBox();
        const promotionBox = await page.getByTestId('home-mega-menu-promotion').boundingBox();
        const promotionCopyBox = await page.getByTestId('home-mega-menu-promotion').locator('.ct-mega-promotion-copy').boundingBox();
        expect(Math.abs((triggerBox?.y || 0) + (triggerBox?.height || 0) + 5 - (sheetBox?.y || 0))).toBeLessThanOrEqual(4);
        expect((sheetBox?.y || 0) + (sheetBox?.height || 0)).toBeLessThanOrEqual(viewport.height - 8);
        expect(sheetBox?.width || 0).toBeLessThanOrEqual(1320);
        expect(sheetBox?.height || 0).toBeLessThanOrEqual(348);
        expect((promotionBox?.y || 0) + (promotionBox?.height || 0)).toBeLessThanOrEqual((sheetBox?.y || 0) + (sheetBox?.height || 0));
        expect(promotionCopyBox?.width || 0).toBeGreaterThan(180);
        const rootIconBox = await page.getByTestId('home-category-column-0').locator('button > .ct-category-card-media').first().boundingBox();
        expect(rootIconBox?.width || 0).toBeLessThanOrEqual(31);
        const leafRoot = page.getByTestId('home-category-column-0').locator('button[data-has-children="false"]').first();
        await leafRoot.hover();
        await page.waitForTimeout(160);
        await expect(page.getByTestId('home-category-column-1')).toContainText('شاخه آزمایشی پویا');
      } else {
        await expect(page.locator('.ct-mobile-bottom-nav')).toBeVisible();
        const railInner = categoryRail.locator('.ct-new-access-inner');
        const railMetrics = await railInner.evaluate((node) => ({ scrollWidth: node.scrollWidth, clientWidth: node.clientWidth, overflowX: getComputedStyle(node).overflowX, touchAction: getComputedStyle(node).touchAction }));
        expect(railMetrics.scrollWidth).toBeGreaterThan(railMetrics.clientWidth);
        expect(railMetrics.overflowX).toBe('auto');
        expect(railMetrics.touchAction).toContain('pan-x');
        await expect(categoryRail).toContainText('پیشنهاد شگفت‌انگیز');
        await expect(categoryRail).toContainText('پرفروش‌ها');
        await expect(categoryRail).toContainText('پکیج‌های خودرویی');
        const sheetBox = await page.locator('.ct-home-category-sheet').boundingBox();
        expect(sheetBox?.height || 0).toBeLessThanOrEqual(viewport.height * 0.54);
        expect(sheetBox?.width || 0).toBeLessThanOrEqual(viewport.width - 12);
        const root = page.locator('[data-category-level="0"][data-has-children="true"]').first();
        await expect(root).toContainText('ریشه آزمایشی پویا');
        await expect(root.locator('.ct-category-card-media img')).toHaveAttribute('src', '/images/mega-menu/economy-oil-change.webp');
        const mediaBox = await root.locator('.ct-category-card-media').boundingBox();
        const titleBox = await root.locator('b').boundingBox();
        expect((titleBox?.y || 0)).toBeGreaterThan((mediaBox?.y || 0) + (mediaBox?.height || 0) - 2);
        await root.click();
        await expect(page.locator('[data-category-level="1"]').first()).toContainText('شاخه آزمایشی پویا');
        await page.getByRole('button', { name: /بازگشت به مرحله قبل/ }).click();
      }
      await page.getByRole('button', { name: 'بستن دسته‌بندی‌ها' }).click();

      if (viewport.width < 768) {
        await page.locator('.ct-mobile-bottom-nav').getByRole('link', { name: /رزرو سرویس/ }).click();
        await expect(page).toHaveURL(/\/book$/);
        await expect(page.getByRole('heading', { name: 'رزرو سرویس در محل' })).toBeVisible();
      }

      for (const route of ['/shop', '/book', '/payment', '/shop/product/non-existent-product']) {
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await expect(categoryRail).toHaveCount(0);
      }
    }
  });

  test('mobile vehicle selector is compact and visually highlighted', async ({ page }) => {
    await mockDynamicCategoryData(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('main-hamburger-menu').click();
    const vehicleButton = page.getByTestId('drawer-vehicle-picker-button');
    await expect(vehicleButton).toBeVisible();
    const box = await vehicleButton.boundingBox();
    expect(box?.height || 0).toBeLessThanOrEqual(56);
    const style = await vehicleButton.evaluate((node) => ({ backgroundImage: getComputedStyle(node).backgroundImage, borderRadius: getComputedStyle(node).borderRadius }));
    expect(style.backgroundImage).toContain('gradient');
    expect(Number.parseFloat(style.borderRadius)).toBeGreaterThanOrEqual(12);
    await expect(page.locator('.ct-mobile-bottom-nav')).toBeVisible();
  });

  test('storefront toolbar stays compact and opens the category cascade', async ({ page }) => {
    await mockDynamicCategoryData(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/shop', { waitUntil: 'domcontentloaded' });
    const trigger = page.getByTestId('shop-category-toolbar-trigger');
    await expect(trigger).toContainText('دسته‌بندی محصولات');
    await trigger.hover();
    await expect(page.getByTestId('shop-category-desktop-cascade')).toBeVisible();
    await expect(page.getByTestId('mega-menu-promotion')).toContainText('تبلیغ پویای ایجنت');
    const rootBranch = page.getByTestId('shop-category-column-0').locator('button[data-has-children="true"]').first();
    await expect(rootBranch).toBeVisible();
    await rootBranch.hover();
    await expect(page.getByTestId('shop-category-column-1')).toBeVisible();
    const menuBox = await page.getByTestId('shop-category-desktop-cascade').boundingBox();
    expect(menuBox?.height || 0).toBeLessThanOrEqual(340);
    await expect(page.locator('[data-shop-amazing], [data-shop-products]').first()).toBeAttached();
  });

  test('configured category card and promotion open the industrial page', async ({ page }) => {
    await mockDynamicCategoryData(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('home-category-toolbar-trigger').hover();
    await page.getByTestId('home-category-column-0').getByRole('button', { name: /دسته مادر دوم پویا/ }).click();
    await expect(page).toHaveURL(/\/industrial$/);

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('home-category-toolbar-trigger').hover();
    await page.getByTestId('home-mega-menu-promotion').click();
    await expect(page).toHaveURL(/\/industrial$/);
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
    await expect(page.getByTestId('shop-category-mobile-accordion')).toBeVisible();
    await expect(page.locator('.ct-mobile-bottom-nav')).toBeVisible();
    const sheetBox = await page.locator('.ct-home-category-sheet').boundingBox();
    expect(sheetBox?.height || 0).toBeLessThanOrEqual(844 * 0.54);
    const rootCategory = page.locator('[data-category-level="0"][data-has-children="true"]').first();
    await expect(rootCategory).toHaveAttribute('data-category-level', '0');
    const rootFontSize = await rootCategory.locator('b').evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize));
    await rootCategory.click();
    const childCategory = page.locator('[data-category-level="1"]').first();
    await expect(childCategory).toHaveAttribute('data-category-level', '1');
    const childFontSize = await childCategory.locator('.ct-category-choice-copy b').evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize));
    expect(rootFontSize).toBeGreaterThan(childFontSize);
    expect(rootFontSize).toBeLessThanOrEqual(10);
    expect(childFontSize).toBeLessThanOrEqual(9);
    await page.getByRole('button', { name: /بازگشت به مرحله قبل/ }).click();
    await expect(page.locator('[data-category-level="0"][data-has-children="true"]').first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(4);
  });
});
