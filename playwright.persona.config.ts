import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /persona-.*\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  retries: 1,
  timeout: 45_000,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report-persona', open: 'never' }],
    ['./scripts/persona-reporter.mjs'],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
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
  ],
});
