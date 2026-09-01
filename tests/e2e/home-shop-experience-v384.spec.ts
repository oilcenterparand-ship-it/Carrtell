import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const read = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');

test.describe('Carrtell V3.8.4 home/shop experience contract', () => {
  test('selected car prioritizes compatible products instead of hiding other products', () => {
    const shop = read('src/pages/ShopPage.tsx');
    expect(shop).toContain('function prioritizeProductsForCar');
    expect(shop).toContain('return prioritizeProductsForCar(sorted, activeCarId);');
    expect(shop).not.toContain("if (activeCarId !== 'all') result = result.filter((p) => productMatchesCar(p, activeCarId));");
  });

  test('selected car is not counted as a removable shop filter', () => {
    const shop = read('src/pages/ShopPage.tsx');
    const filterCountLine = shop.split('\n').find((line) => line.includes('const activeFilterCount')) || '';
    expect(filterCountLine).not.toContain("activeCarId !== 'all'");
    const clearBlock = shop.slice(shop.indexOf('function clearShopFilters'), shop.indexOf('function clearShopFilters') + 520);
    expect(clearBlock).not.toContain("setActiveCarId('all')");
    expect(clearBlock).not.toContain('saveSelectedCustomerCar(null)');
  });

  test('product card keeps the suitable-for-your-car badge', () => {
    const shop = read('src/pages/ShopPage.tsx');
    expect(shop).toContain('مناسب خودروی شما');
    expect(shop).toContain("compatibilityStatus === 'compatible'");
  });

  test('home no longer duplicates the complete store catalog', () => {
    const home = read('src/pages/HomePage.tsx');
    expect(home).toContain('ct-home-shop-handoff');
    expect(home).toContain('صفحه اصلی برای کشف سریع پیشنهادهاست');
    expect(home).not.toContain('همه محصولات موجود Carrtell');
    expect(home).not.toContain('visibleProducts.map');
  });

  test('desktop legacy four benefit tiles are replaced by a useful journey panel', () => {
    const home = read('src/pages/HomePage.tsx');
    expect(home).toContain('ct-home-desktop-journey-panel');
    expect(home).toContain('خودروت را انتخاب کن؛ مناسب‌ها اول می‌آیند');
    expect(home).not.toContain('ct-home-desktop-legacy-benefits');
  });

  test('footer is compact-ready and reserves the official trust seal position without inventing a seal id', () => {
    const footer = read('src/components/Footer.tsx');
    expect(footer).toContain('ct-footer-mobile-columns');
    expect(footer).toContain('data-testid="enamad-slot"');
    expect(footer).toContain('محل نماد اعتماد');
    expect(footer).not.toMatch(/trustseal\.enamad\.ir\/\?id=\d+/);
  });

  test('search and category toolbar receive visual polish without changing mega menu component logic', () => {
    const css = read('src/index.css');
    const layout = read('src/components/Layout.tsx');
    expect(css).toContain('Carrtell V3.8.4 — Home/Shop separation, compact footer, search + category polish');
    expect(css).toContain('.ct-new-search-form::before');
    expect(css).toContain('.ct-home-category-trigger:hover');
    expect(layout).toContain('<DynamicCategoryMegaMenu');
    expect(layout).toContain('onMouseEnter={() => { if (window.innerWidth >= 768) setHomeCategoryMenuOpen(true); }}');
  });
});
