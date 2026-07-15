export const LAST_CUSTOMER_PHONE_KEY = 'carrtell:last-customer-phone';
export const OTP_CODE_KEY = 'carrtell:otp-code';

export function normalizePhone(phone: string) {
  return phone.replace(/\s|-/g, '').trim();
}

export async function requestOtp(phone: string) {
  const clean = normalizePhone(phone);
  if (!/^09\d{9}$/.test(clean)) throw new Error('شماره موبایل معتبر وارد کن.');
  const code = String(Math.floor(1000 + Math.random() * 9000));
  sessionStorage.setItem(OTP_CODE_KEY, code);
  console.info('Carrtell OTP mock code:', code);
  return { ok: true, code };
}

export async function verifyOtp(phone: string, code: string) {
  const clean = normalizePhone(phone);
  const saved = sessionStorage.getItem(OTP_CODE_KEY);
  if (saved && code && saved !== code) throw new Error('کد تایید اشتباه است.');
  localStorage.setItem(LAST_CUSTOMER_PHONE_KEY, clean);
  return { ok: true, phone: clean };
}

export function logoutCustomer() {
  localStorage.removeItem(LAST_CUSTOMER_PHONE_KEY);
}
