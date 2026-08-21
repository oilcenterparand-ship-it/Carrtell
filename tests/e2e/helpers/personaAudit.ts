import { expect, type Locator, type Page, type TestInfo } from '@playwright/test';

export type FeedbackItem = {
  severity: 'info' | 'warning' | 'error';
  area: string;
  message: string;
  route?: string;
  screenshot?: string;
  details?: Record<string, unknown>;
};

export function watchRuntime(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  return { consoleErrors, pageErrors };
}

export async function attachFeedback(testInfo: TestInfo, items: FeedbackItem[]) {
  if (!items.length) return;
  await testInfo.attach('ux-feedback', {
    body: Buffer.from(JSON.stringify(items, null, 2), 'utf8'),
    contentType: 'application/json',
  });
}

export async function captureVisual(page: Page, testInfo: TestInfo, name: string) {
  const safe = name.replace(/[^a-zA-Z0-9._-]+/g, '-');
  const file = testInfo.outputPath(`${safe}.png`);
  await page.screenshot({ path: file, fullPage: true, animations: 'disabled' });
  await testInfo.attach(`visual-${safe}`, { path: file, contentType: 'image/png' });
  return file;
}

export async function auditBasicUx(page: Page, testInfo: TestInfo, area: string) {
  const route = new URL(page.url()).pathname;
  const metrics = await page.evaluate(() => {
    const root = document.documentElement;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const overflow = Math.max(root.scrollWidth, document.body?.scrollWidth || 0) - vw;
    const visibleButtons = [...document.querySelectorAll<HTMLElement>('button, a[role="button"]')]
      .filter((el) => {
        const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
      })
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { text: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 80), w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y) };
      });
    const hugeButtons = visibleButtons.filter((b) => b.h > 72 && b.w > vw * 0.72).slice(0, 12);
    const oversizedMobileButtons = vw <= 520 ? visibleButtons.filter((b) => b.h > 64 && b.w > vw * 0.82).slice(0, 12) : [];
    return { vw, vh, overflow, hugeButtons, oversizedMobileButtons, title: document.title };
  });

  const feedback: FeedbackItem[] = [];
  if (metrics.overflow > 2) feedback.push({ severity: 'error', area, route, message: `صفحه ${metrics.overflow}px اسکرول افقی ناخواسته دارد.`, details: metrics });
  if (metrics.hugeButtons.length) feedback.push({ severity: 'warning', area, route, message: 'دکمه‌های بسیار بلند/کشیده پیدا شد؛ تراکم UI باید بازبینی شود.', details: { buttons: metrics.hugeButtons } });
  if (metrics.oversizedMobileButtons.length) feedback.push({ severity: 'warning', area, route, message: 'در موبایل دکمه‌های تمام‌عرض و بلند دیده شد؛ احتمال فضای خالی بیش از نیاز وجود دارد.', details: { buttons: metrics.oversizedMobileButtons } });
  if (!metrics.title.trim()) feedback.push({ severity: 'warning', area, route, message: 'عنوان صفحه (document.title) خالی است.' });
  await attachFeedback(testInfo, feedback);
  expect(metrics.overflow, `horizontal overflow on ${route}`).toBeLessThanOrEqual(2);
  return feedback;
}

export async function auditPanelDensity(page: Page, testInfo: TestInfo, locator: Locator, area: string, opts: { maxViewportHeightRatio?: number; maxViewportWidthRatio?: number; minBottomGap?: number } = {}) {
  if (!(await locator.isVisible().catch(() => false))) return [];
  const route = new URL(page.url()).pathname;
  const box = await locator.boundingBox();
  if (!box) return [];
  const vp = page.viewportSize();
  if (!vp) return [];
  const hRatio = box.height / vp.height;
  const wRatio = box.width / vp.width;
  const bottomGap = vp.height - (box.y + box.height);
  const maxH = opts.maxViewportHeightRatio ?? 0.82;
  const maxW = opts.maxViewportWidthRatio ?? 0.96;
  const feedback: FeedbackItem[] = [];
  if (hRatio > maxH) feedback.push({ severity: 'warning', area, route, message: `پنل ${(hRatio * 100).toFixed(0)}٪ ارتفاع صفحه را گرفته؛ برای یک باکس جمع‌وجور بیش از حد بزرگ است.`, details: { box, viewport: vp, hRatio } });
  if (wRatio > maxW) feedback.push({ severity: 'warning', area, route, message: `پنل ${(wRatio * 100).toFixed(0)}٪ عرض صفحه را گرفته و بیش از حد کشیده است.`, details: { box, viewport: vp, wRatio } });
  if (opts.minBottomGap != null && bottomGap < opts.minBottomGap) feedback.push({ severity: 'warning', area, route, message: 'پنل تقریباً تمام ارتفاع قابل مشاهده را پوشانده و فاصله تنفسی پایینی کافی ندارد.', details: { bottomGap, box, viewport: vp } });
  await attachFeedback(testInfo, feedback);
  return feedback;
}

export async function auditBookingSummaryContent(page: Page, testInfo: TestInfo, dialog: Locator) {
  if (!(await dialog.isVisible().catch(() => false))) return [];
  const text = (await dialog.innerText()).replace(/\s+/g, ' ');
  const required = [
    { label: 'هزینه خدمات', re: /هزینه\s*خدمات|اجرت/ },
    { label: 'مجموع محصولات انتخابی', re: /مجموع\s*محصولات|محصولات\s*انتخابی/ },
    { label: 'هزینه نهایی', re: /هزینه\s*نهایی|مبلغ\s*نهایی/ },
  ];
  const missing = required.filter((x) => !x.re.test(text)).map((x) => x.label);
  const feedback: FeedbackItem[] = missing.length ? [{ severity: 'warning', area: 'customer/booking-selection', route: new URL(page.url()).pathname, message: `خلاصه قیمت رزرو هنوز این ردیف‌ها را شفاف نشان نمی‌دهد: ${missing.join('، ')}`, details: { text: text.slice(0, 1000) } }] : [];
  await attachFeedback(testInfo, feedback);
  return feedback;
}

export async function auditHamburgerCompactness(page: Page, testInfo: TestInfo) {
  const drawer = page.locator('.ct-new-drawer').first();
  if (!(await drawer.isVisible().catch(() => false))) return [];
  const route = new URL(page.url()).pathname;
  const metrics = await drawer.evaluate((root) => {
    const navItems = [...root.querySelectorAll<HTMLElement>('.ct-new-drawer-nav > a, .ct-new-drawer-category-trigger')]
      .filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; })
      .map((el) => { const r = el.getBoundingClientRect(); return { text: (el.innerText || '').trim().slice(0, 50), h: Math.round(r.height), w: Math.round(r.width) }; });
    const r = (root as HTMLElement).getBoundingClientRect();
    const scroll = root.querySelector<HTMLElement>('.ct-new-drawer-scroll');
    return { drawer: { x: r.x, y: r.y, w: r.width, h: r.height }, navItems, scrollHeight: scroll?.scrollHeight || 0, clientHeight: scroll?.clientHeight || 0 };
  });
  const tall = metrics.navItems.filter((x) => x.h > 58);
  const average = metrics.navItems.length ? metrics.navItems.reduce((s, x) => s + x.h, 0) / metrics.navItems.length : 0;
  const feedback: FeedbackItem[] = [];
  if (tall.length) feedback.push({ severity: 'warning', area: 'customer/hamburger', route, message: 'دکمه‌های منوی همبرگری هنوز بلندتر از هدف فشرده هستند.', details: { tall, average, drawer: metrics.drawer } });
  if (average > 56) feedback.push({ severity: 'warning', area: 'customer/hamburger', route, message: `میانگین ارتفاع گزینه‌های منو ${average.toFixed(1)}px است؛ منو می‌تواند جمع‌وجورتر شود.`, details: metrics });
  await attachFeedback(testInfo, feedback);
  return feedback;
}

export async function assertNoRuntimeErrors(runtime: ReturnType<typeof watchRuntime>, testInfo: TestInfo, area: string, route: string) {
  const ignored = [/favicon/i, /ResizeObserver loop/i, /Failed to load resource.*404/i];
  const consoleErrors = runtime.consoleErrors.filter((m) => !ignored.some((re) => re.test(m)));
  const pageErrors = runtime.pageErrors.filter((m) => !ignored.some((re) => re.test(m)));
  const feedback: FeedbackItem[] = [
    ...consoleErrors.map((message) => ({ severity: 'error' as const, area, route, message: `Console error: ${message}` })),
    ...pageErrors.map((message) => ({ severity: 'error' as const, area, route, message: `Page error: ${message}` })),
  ];
  await attachFeedback(testInfo, feedback);
  expect(pageErrors, `page errors on ${route}`).toEqual([]);
}

export async function checkOverlayScrollLock(page: Page, testInfo: TestInfo, selector: string, area: string) {
  const overlay = page.locator(selector).first();
  if (!(await overlay.isVisible().catch(() => false))) return;
  const before = await page.evaluate(() => ({ y: window.scrollY, overflow: getComputedStyle(document.body).overflow, htmlOverflow: getComputedStyle(document.documentElement).overflow }));
  await page.mouse.wheel(0, 700);
  await page.waitForTimeout(120);
  const after = await page.evaluate(() => ({ y: window.scrollY, overflow: getComputedStyle(document.body).overflow, htmlOverflow: getComputedStyle(document.documentElement).overflow }));
  const locked = Math.abs(after.y - before.y) < 4 || ['hidden', 'clip'].includes(after.overflow) || ['hidden', 'clip'].includes(after.htmlOverflow);
  const feedback: FeedbackItem[] = locked ? [] : [{ severity: 'error', area, route: new URL(page.url()).pathname, message: 'هنگام باز بودن Modal/Sheet، صفحه پشت آن اسکرول می‌شود.', details: { before, after } }];
  await attachFeedback(testInfo, feedback);
  expect(locked, 'background page must be scroll-locked while overlay is open').toBeTruthy();
}
