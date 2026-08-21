import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    // Production preview registers /sw.js. A controlling service worker can
    // intercept requests before Playwright page.route sees them, which made
    // relation-table mocks appear as empty responses and caused flaky E2E runs.
    serviceWorkers: 'block',
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'], browserName: 'chromium', channel: 'chrome' } },
    { name: 'android-chrome', use: { browserName: 'chromium', channel: 'chrome', viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true } },
    { name: 'iphone-chrome-emulation', use: { browserName: 'chromium', channel: 'chrome', viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true } },
  ],
});
