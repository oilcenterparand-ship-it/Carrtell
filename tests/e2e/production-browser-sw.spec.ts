import { test, expect, type Page, type Response } from '@playwright/test';

const fatalConsolePattern = /failed to load module script|mime type|application error|uncaught|syntaxerror|referenceerror/i;

function watchRuntime(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];
  const badAssets: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('requestfailed', (request) => {
    failedRequests.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText || 'failed'}`);
  });
  page.on('response', (response: Response) => {
    const request = response.request();
    const destination = request.resourceType();
    if (destination !== 'script' && destination !== 'stylesheet') return;

    const contentType = (response.headers()['content-type'] || '').toLowerCase();
    const okScript = destination !== 'script' || /javascript|ecmascript|wasm/.test(contentType);
    const okStyle = destination !== 'stylesheet' || contentType.includes('text/css');
    if (!response.ok() || !okScript || !okStyle) {
      badAssets.push(`${response.status()} ${destination} ${response.url()} content-type=${contentType || '(missing)'}`);
    }
  });

  return { consoleErrors, pageErrors, failedRequests, badAssets };
}

async function assertHealthyRuntime(page: Page, runtime: ReturnType<typeof watchRuntime>) {
  await expect(page.locator('#root')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('body')).toBeVisible();
  const text = (await page.locator('body').innerText()).trim();
  expect(text.length, 'production page rendered blank').toBeGreaterThan(20);

  expect(runtime.badAssets, `JS/CSS asset MIME/status failures:\n${runtime.badAssets.join('\n')}`).toEqual([]);
  expect(runtime.failedRequests, `failed production requests:\n${runtime.failedRequests.join('\n')}`).toEqual([]);
  expect(runtime.pageErrors, `page runtime errors:\n${runtime.pageErrors.join('\n')}`).toEqual([]);
  expect(
    runtime.consoleErrors.filter((message) => fatalConsolePattern.test(message)),
    `fatal console errors:\n${runtime.consoleErrors.join('\n')}`,
  ).toEqual([]);
}

test.describe('Carrtell production browser + service worker gate', () => {
  test('admin login loads real built assets with correct MIME before and after SW takes control', async ({ page, context }) => {
    const runtime = watchRuntime(page);

    await page.goto('/admin/login', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'ورود به پنل مدیریت' })).toBeVisible();
    await assertHealthyRuntime(page, runtime);

    const swSupported = await page.evaluate(() => 'serviceWorker' in navigator);
    expect(swSupported).toBeTruthy();

    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });

    // A reload is important: this is the point where the registered production
    // service worker can actually control the document and its asset requests.
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'ورود به پنل مدیریت' })).toBeVisible();

    const hasController = await page.evaluate(() => Boolean(navigator.serviceWorker.controller));
    expect(hasController, 'service worker did not control the reloaded production page').toBeTruthy();
    await assertHealthyRuntime(page, runtime);

    // Verify the actual module script referenced by the current built index is
    // retrievable as JavaScript, never an HTML SPA fallback.
    const moduleSrc = await page.locator('script[type="module"][src]').first().getAttribute('src');
    expect(moduleSrc, 'built index has no module asset').toBeTruthy();
    const check = await page.evaluate(async (src) => {
      const response = await fetch(src!, { cache: 'no-store' });
      return {
        status: response.status,
        contentType: response.headers.get('content-type') || '',
        prefix: (await response.text()).slice(0, 40),
      };
    }, moduleSrc);
    expect(check.status).toBe(200);
    expect(check.contentType.toLowerCase()).toMatch(/javascript|ecmascript/);
    expect(check.prefix.toLowerCase()).not.toContain('<!doctype html');

    // Keep this context isolated so the QA run never pollutes the user's normal browser.
    await context.clearCookies();
  });
});
