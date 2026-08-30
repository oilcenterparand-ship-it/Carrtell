import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

function read(relativePath: string) {
  return fs.readFileSync(path.resolve(relativePath), 'utf8');
}

test.describe('Home category rail and admin credential source contracts', () => {
  test('layout limits the premium dynamic category toolbar to the homepage', async () => {
    const layout = read('src/components/Layout.tsx');
    const sharedMenu = read('src/components/DynamicCategoryMegaMenu.tsx');

    expect(layout).toContain("const showStorefrontBars = location.pathname === '/';");
    expect(layout).toContain('data-testid="home-category-toolbar-trigger"');
    expect(layout).toContain('onMouseEnter={() => { if (window.innerWidth >= 768) setHomeCategoryMenuOpen(true); }}');
    expect(layout).toContain("label: 'پیشنهاد شگفت‌انگیز'");
    expect(layout).toContain("label: 'پرفروش‌ها'");
    expect(layout).toContain("label: 'پکیج‌های خودرویی'");
    expect(layout).toContain('data-testid="home-category-booking-cta"');
    expect(layout).toContain('<DynamicCategoryMegaMenu');
    expect(layout).toContain('getMegaMenuPromotion()');
    expect(read('src/pages/HomePage.tsx')).toContain('getMegaMenuTiles()');
    expect(read('src/pages/HomePage.tsx')).toContain('data-testid="home-hero-promo-tiles"');
    expect(sharedMenu).not.toContain('ct-home-mega-tile-grid');
    expect(sharedMenu).toContain('className="ct-category-card-media"');
    expect(read('src/pages/ShopPage.tsx')).toContain('className="ct-category-card-media"');
    expect(sharedMenu).toContain('[data-testid="home-category-toolbar-trigger"]');
    expect(sharedMenu).toContain("'--ct-home-menu-top'");
    expect(sharedMenu).toContain('ct-home-category-desktop-head');
    expect(sharedMenu).toContain('ct-home-mega-promotion');
  });

  test('desktop category defaults do not depend on fixed category names or slugs', async () => {
    const shop = read('src/pages/ShopPage.tsx');
    const sharedMenu = read('src/components/DynamicCategoryMegaMenu.tsx');

    expect(shop).not.toMatch(/find\(\(item\) => item\.slug === ['"]/);
    expect(sharedMenu).not.toMatch(/item\.slug === ['"]/);
    expect(sharedMenu).toContain('tree.find((item) => item.children.length > 0)');
  });

  test('selected menu styles stay scoped away from booking and the mobile bottom navigation', async () => {
    const styles = read('src/index.css');
    const menu = read('src/components/DynamicCategoryMegaMenu.tsx');
    const shop = read('src/pages/ShopPage.tsx');

    expect(styles).toContain('selected compact card mega menu');
    expect(styles).toContain('.ct-home-category-modal .ct-home-category-mobile-roots');
    expect(styles).toContain('.ct-home-category-modal .ct-home-category-root-grid');
    expect(styles).toContain('viewport-fit desktop calibration');
    expect(styles).toContain('width:min(1080px,calc(100vw - 30px))');
    expect(menu).toContain('data-testid="home-category-mobile-accordion"');
    expect(menu).toContain('queueDesktopPath');
    expect(menu).toContain('category.children.length > 0 && queueDesktopPath');
    expect(shop).toContain('data-testid="shop-category-mobile-accordion"');
    expect(shop).toContain('queueCategoryPath');
    expect(menu).not.toContain('ct-mobile-bottom-nav');
    expect(menu).not.toContain('ct-book-');
    expect(styles).toContain('V3.4.2 FINAL MOBILE OVERRIDES');
    expect(styles).toContain('touch-action:pan-x!important');
  });

  test('admin category editor excludes descendants and database rejects hierarchy cycles', async () => {
    const adminCategories = read('src/admin/pages/Categories.tsx');
    const cycleMigration = read('supabase/migrations/202608230003_category_tree_cycle_guard.sql');

    expect(adminCategories).toContain('getCategoryDescendantIds(categories, editingId)');
    expect(adminCategories).toContain('!invalidParentIds.has(item.id)');
    expect(cycleMigration).toContain('prevent_product_category_cycle');
    expect(cycleMigration).toContain('Category hierarchy cycle is not allowed');
  });

  test('mega-menu advertisement remains fully manageable from admin', async () => {
    const homeContent = read('src/admin/pages/HomeContent.tsx');

    expect(homeContent).toContain('data-testid="admin-mega-menu-promotion-form"');
    for (const field of ['title', 'badge', 'subtitle', 'button_text', 'link_url', 'image_url', 'is_active']) {
      expect(homeContent).toContain(`megaPromotion.${field}`);
    }
    expect(homeContent).toContain('saveMegaMenuPromotion(megaPromotion)');
    expect(homeContent).toContain('data-testid="admin-home-hero-promo-tiles-section"');
    expect(homeContent).toContain('data-testid="admin-home-slider-banners-section"');
    expect(homeContent).toContain('data-testid="admin-home-slider-banner-form"');
    expect(homeContent).toContain('label="تصویر بنر اسلایدی"');
    expect(homeContent).toContain('folder="banners"');
    expect(homeContent).toContain('لینک مقصد؛ مثال: /shop?category=engine-oil');
    const homeApi = read('src/admin/services/homeContentApi.ts');
    expect(homeApi).toContain("supabase.from('homepage_banners').insert");
    expect(homeApi).toContain("supabase.from('homepage_banners').update");
    const shop = read('src/pages/ShopPage.tsx');
    expect(shop).toContain("activeHero?.link_url || '/shop'");
    expect(shop).toContain('activeHero.image_url');
    expect(homeContent).toContain('createMegaMenuTile(megaMenuTileForm)');
    expect(homeContent).toContain('updateMegaMenuTile(editingMegaMenuTileId, megaMenuTileForm)');
    expect(homeContent).toContain('deleteMegaMenuTile(id)');
    expect(read('supabase/migrations/202608240001_mega_menu_tiles.sql')).toContain('create table if not exists public.mega_menu_tiles');
  });

  test('category destinations are dynamic and industrial links are seeded safely', async () => {
    const categoryApi = read('src/admin/services/categoriesApi.ts');
    const adminCategories = read('src/admin/pages/Categories.tsx');
    const sharedMenu = read('src/components/DynamicCategoryMegaMenu.tsx');
    const safeSql = read('supabase/manual/CARRTELL_INDUSTRIAL_DESTINATION_SAFE.sql');

    expect(categoryApi).toContain('landing_url?: string | null');
    expect(categoryApi).toContain('getCategoryDestination');
    expect(adminCategories).toContain('صفحه مقصد اختصاصی');
    expect(sharedMenu).toContain('getCategoryDestination(category)');
    expect(sharedMenu).not.toMatch(/category\.title\s*===\s*['"]روغن/);
    expect(safeSql).toContain("set landing_url = '/industrial'");
    expect(safeSql).toContain("set link_url = '/industrial'");
  });

  test('admin persona has no assumed admin/admin fallback', async () => {
    const persona = read('tests/e2e/persona-admin.spec.ts');

    expect(persona).not.toMatch(/CARRTELL_ADMIN_USERNAME\s*\|\|\s*['"]admin['"]/);
    expect(persona).not.toMatch(/CARRTELL_ADMIN_PASSWORD\s*\|\|\s*['"]admin['"]/);
    expect(persona).toContain('CARRTELL_ADMIN_USERNAME is required');
    expect(persona).toContain('CARRTELL_ADMIN_PASSWORD is required');
  });

  test('both agents collect hidden admin credentials and clear them', async () => {
    for (const scriptName of ['agent.ps1', 'agent-category.ps1']) {
      const script = read(scriptName);
      expect(script).toContain('Read-Host "Carrtell admin username"');
      expect(script).toContain('-AsSecureString');
      expect(script).toContain('Remove-Item Env:CARRTELL_ADMIN_USERNAME');
      expect(script).toContain('Remove-Item Env:CARRTELL_ADMIN_PASSWORD');
      expect(script).not.toMatch(/['"]admin['"]\s*(?:;|$)/m);
    }

    const mainAgent = read('agent.ps1');
    expect(mainAgent).toContain('function Run-AdminStep');
    expect(mainAgent).toContain('throw "Admin Agent step failed');
  });
});
