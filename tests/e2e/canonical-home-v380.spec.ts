import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

test('homepage follows the approved dark gold Carrtell reference', () => {
  const home = read('src/pages/HomePage.tsx');
  const css = read('src/index.css');
  expect(home).toContain('ct-reference-home');
  expect(home).toContain('ct-reference-quick-actions');
  expect(home).toContain('ct-reference-promo-grid');
  expect(home).toContain('ct-reference-industrial');
  expect(home).toContain('ct-reference-category-grid');
  expect(css).toContain('canonical dark/gold homepage based on the approved reference');
  expect(css).toContain('grid-template-columns:repeat(2,minmax(0,1fr))');
});

test('homepage remains dynamic and compatible-products shortcut is connected', () => {
  const home = read('src/pages/HomePage.tsx');
  const css = read('src/index.css');
  expect(home).toContain('getMegaMenuTiles()');
  expect(home).toContain('getMegaMenuPromotion()');
  expect(home).toContain('getProductCategories()');
  expect(home).toContain("title: 'محصولات مرتبط با خودروی شما'");
  expect(home).toContain("to: '/my-car/products'");
  expect(home).toContain("title: 'پیشنهادشده‌ها'");
  expect(home).toContain('is-${tone}');
  expect(css).toContain('.ct-reference-quick-action.is-car');
  expect(css).toContain('color:#4ade80');
});

test('responsive rules cover desktop tablet and mobile without changing touch safety', () => {
  const css = read('src/index.css');
  expect(css).toContain('@media(max-width:1023px)');
  expect(css).toContain('@media(max-width:767px)');
  expect(css).toContain('@media(max-width:420px)');
  expect(css).toContain('grid-template-columns:repeat(5,minmax(0,1fr))');
  expect(css).toContain('overflow-x:auto');
});
