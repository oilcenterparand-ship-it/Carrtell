import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.CARRTELL_PRODUCTION_QA_PORT || 4180);
const baseURL = process.env.PLAYWRIGHT_PRODUCTION_BASE_URL || `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /production-browser-sw\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report-production', open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    serviceWorkers: 'allow',
  },
  webServer: {
    command: `npm run preview -- --host 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'desktop-production-chrome',
      use: { ...devices['Desktop Chrome'], browserName: 'chromium', channel: 'chrome' },
    },
  ],
});
