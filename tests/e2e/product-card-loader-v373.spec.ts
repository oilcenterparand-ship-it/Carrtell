import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

test('product cards are compact and use the themed transparent media canvas', () => {
  const shop = read('src/pages/ShopPage.tsx');
  const smartImage = read('src/lib/smartImage.ts');
  expect(shop).toContain("theme.cardImageBackground || '#101a2c'");
  expect(shop).toContain("grid ? 'h-[292px]' : 'h-[278px]'");
  expect(shop).toContain("grid ? 'h-[124px]' : 'h-[116px]'");
  expect(smartImage).toContain("backgroundColor: 'transparent'");
  expect(smartImage).toContain("ctx.clearRect(0, 0, size.width, size.height)");
});

test('Carrtell loader covers bootstrap and route transitions', () => {
  expect(read('index.html')).toContain('id="ct-bootstrap-loader"');
  expect(read('src/main.tsx')).toContain("bootstrapLoader.classList.add('is-ready')");
  expect(read('src/App.tsx')).toContain('<CarrtellPageLoader />');
  const loader = read('src/components/CarrtellPageLoader.tsx');
  expect(loader).toContain('/brand/logo.png');
  expect(loader).toContain('کارتل در حال آماده‌سازی صفحه است');
});
