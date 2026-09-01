import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

test.describe('Carrtell admin media manager v3.8.3 contracts', () => {
  test('media manager is split into compact purpose-driven tabs', () => {
    const source = read('src/admin/pages/HomeContent.tsx');
    expect(source).toContain('data-testid="admin-media-manager"');
    expect(source).toContain("label: 'بنر اصلی'");
    expect(source).toContain("label: 'بنرهای کوچک'");
    expect(source).toContain("label: 'تبلیغ مگامنو'");
    expect(source).toContain("label: 'بخش‌ها و آیکون‌ها'");
    expect(source).toContain('پیش‌نمایش زنده');
  });

  test('every primary banner field has persistent purpose help', () => {
    const source = read('src/admin/pages/HomeContent.tsx');
    for (const field of ['عنوان بنر', 'زیرعنوان', 'لینک مقصد', 'برچسب روی بنر', 'ترتیب نمایش', 'وضعیت نمایش']) {
      expect(source).toContain(`title="${field}"`);
    }
    expect(source).toContain('عدد کمتر زودتر نمایش داده می‌شود');
    expect(source).toContain('مشتری به این صفحه می‌رود');
  });

  test('optimized upload is performed once and exposes progress', () => {
    const uploader = read('src/admin/components/ImageUploader.tsx');
    const api = read('src/admin/services/uploadApi.ts');
    expect(uploader).toContain('uploadOptimizedPublicImage(optimized, file.name, folder)');
    expect(uploader).not.toContain('uploadPublicImage(file, folder)');
    expect(uploader).toContain('بهینه شد:');
    expect(api).toContain('export async function uploadOptimizedPublicImage');
  });

  test('image controls support preview, manual URL and removal', () => {
    const uploader = read('src/admin/components/ImageUploader.tsx');
    expect(uploader).toContain('یا آدرس عکس را دستی وارد کن');
    expect(uploader).toContain("onClick={() => onChange('')}");
    expect(uploader).toContain('accept="image/*"');
  });

  test('Windows launcher bypasses signature policy without changing system policy', () => {
    const launcher = read('agent.cmd');
    expect(launcher).toContain('-ExecutionPolicy Bypass');
    expect(launcher).toContain('-File "%~dp0agent.ps1"');
    expect(launcher).not.toContain('Set-ExecutionPolicy');
  });
});
