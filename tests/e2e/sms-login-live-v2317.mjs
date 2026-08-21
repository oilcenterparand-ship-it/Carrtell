import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import readline from 'node:readline/promises';
import process from 'node:process';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const baseURL = 'http://127.0.0.1:4173';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForServer(timeout = 30000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    try {
      const response = await fetch(baseURL, { redirect: 'manual' });
      if (response.status >= 200 && response.status < 500) return;
    } catch {}
    await sleep(350);
  }
  throw new Error('Vite preview روی 127.0.0.1:4173 بالا نیامد.');
}

function cleanPhone(value) {
  return String(value || '').replace(/\D/g, '');
}

async function responseBody(response) {
  const raw = await response.text().catch(() => '');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return raw; }
}

let preview;
let browser;

try {
  const phone = cleanPhone(await rl.question('شماره موبایل واقعی تست را وارد کن (09xxxxxxxxx): '));
  if (!/^09\d{9}$/.test(phone)) {
    throw new Error('شماره موبایل باید دقیقاً به شکل 09xxxxxxxxx باشد.');
  }

  console.log('\n[CARRTELL OTP LOGIN] Starting production preview...');
  const previewCommand = process.platform === 'win32'
    ? {
        command: process.env.ComSpec || 'cmd.exe',
        args: ['/d', '/s', '/c', 'npm run preview -- --host 127.0.0.1 --port 4173'],
      }
    : {
        command: 'npm',
        args: ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173'],
      };

  preview = spawn(
    previewCommand.command,
    previewCommand.args,
    { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true },
  );
  preview.stdout?.on('data', () => {});
  preview.stderr?.on('data', () => {});

  await waitForServer();

  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const page = await context.newPage();

  const browserErrors = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));

  await page.goto(`${baseURL}/login-otp?returnTo=%2F`, { waitUntil: 'domcontentloaded' });

  const phoneInput = page.getByPlaceholder('شماره موبایل؛ 09xxxxxxxxx');
  await phoneInput.waitFor({ state: 'visible', timeout: 10000 });
  await phoneInput.fill(phone);

  const otpRequest = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      /\/auth\/v1\/otp(?:\?|$)/.test(response.url()),
    { timeout: 20000 },
  );

  await page.getByRole('button', { name: 'دریافت کد ورود' }).click();

  const otpResponse = await otpRequest;
  const otpStatus = otpResponse.status();
  const otpBody = await responseBody(otpResponse);

  console.log(`[CARRTELL OTP LOGIN] send OTP HTTP ${otpStatus}`);
  if (otpStatus < 200 || otpStatus >= 300) {
    throw new Error(`ارسال OTP از Supabase شکست خورد: ${JSON.stringify(otpBody)}`);
  }

  const otpGroup = page.getByLabel('کد تأیید شش رقمی');
  await otpGroup.waitFor({ state: 'visible', timeout: 10000 });
  console.log('[CARRTELL OTP LOGIN] SMS accepted and OTP inputs are visible.');

  const code = cleanPhone(await rl.question('کد ۶ رقمی پیامک‌شده را وارد کن: '));
  if (!/^\d{6}$/.test(code)) {
    throw new Error('کد باید دقیقاً ۶ رقم باشد.');
  }

  const verifyResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      /\/auth\/v1\/verify(?:\?|$)/.test(response.url()),
    { timeout: 20000 },
  );

  const inputs = otpGroup.locator('input');
  if (await inputs.count() !== 6) {
    throw new Error(`تعداد باکس‌های OTP برابر ۶ نیست: ${await inputs.count()}`);
  }

  for (let i = 0; i < 6; i += 1) {
    await inputs.nth(i).fill(code[i]);
  }

  const verifyResponse = await verifyResponsePromise;
  const verifyStatus = verifyResponse.status();
  const verifyBody = await responseBody(verifyResponse);

  console.log(`[CARRTELL OTP LOGIN] verify OTP HTTP ${verifyStatus}`);

  if (verifyStatus < 200 || verifyStatus >= 300) {
    throw new Error(`VERIFY FAILED: ${JSON.stringify({
      status: verifyStatus,
      body: verifyBody,
      url: page.url(),
      browserErrors,
    })}`);
  }

  const hasAccessToken =
    verifyBody &&
    typeof verifyBody === 'object' &&
    ('access_token' in verifyBody || ('session' in verifyBody && verifyBody.session?.access_token));

  await sleep(800);

  const setupButton = page.getByRole('button', { name: 'فعلاً رد شدن' });
  const setupVisible = await setupButton.isVisible().catch(() => false);

  if (setupVisible) {
    console.log('[CARRTELL OTP LOGIN] LOGIN SUCCESS: Supabase session ساخته شده است.');
    console.log('[CARRTELL OTP LOGIN] UX FINDING: کاربر جدید بعد از OTP روی مرحله اختیاری تعیین نام کاربری/رمز متوقف می‌شود و مستقیم Redirect نمی‌شود.');
    console.log('[CARRTELL OTP LOGIN] Agent روی «فعلاً رد شدن» کلیک می‌کند تا Redirect را هم تست کند.');
    await setupButton.click();
    await page.waitForURL(`${baseURL}/`, { timeout: 10000 });
  } else if (page.url() === `${baseURL}/login-otp?returnTo=%2F` || page.url().includes('/login-otp')) {
    const notice = await page.getByRole('status').textContent().catch(() => null);
    throw new Error(`VERIFY 200 گرفتیم ولی UI نه Redirect شد و نه Setup نشان داد: ${JSON.stringify({
      hasAccessToken: Boolean(hasAccessToken),
      notice,
      url: page.url(),
      browserErrors,
    })}`);
  }

  console.log(`[CARRTELL OTP LOGIN] Final URL: ${page.url()}`);
  console.log(`[CARRTELL OTP LOGIN] Session token in verify response: ${Boolean(hasAccessToken)}`);
  console.log('PASSED: REAL OTP VERIFY + LOGIN DIAGNOSTIC');
} finally {
  await browser?.close().catch(() => {});
  rl.close();

  if (preview && !preview.killed) {
    preview.kill();
  }
}
