import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, CreditCard, FlaskConical, Save, Settings2, ShieldCheck } from 'lucide-react';
import {
  defaultPaymentGatewaySettings,
  getPaymentGatewaySettings,
  updatePaymentGatewaySettings,
  type PaymentGatewaySettings,
} from '../services/paymentsApi';

const inputClass = 'w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-amber-400';

const steps = [
  { title: 'انتخاب حالت', icon: CreditCard },
  { title: 'اتصال درگاه', icon: Settings2 },
  { title: 'بررسی نهایی', icon: ShieldCheck },
];

export default function PaymentSettings() {
  const [settings, setSettings] = useState<PaymentGatewaySettings>(defaultPaymentGatewaySettings);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    getPaymentGatewaySettings()
      .then(setSettings)
      .catch((error) => setMessage(`خطا در دریافت تنظیمات: ${error?.message || error}`))
      .finally(() => setLoading(false));
  }, []);

  const update = <K extends keyof PaymentGatewaySettings>(key: K, value: PaymentGatewaySettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const validation = useMemo(() => {
    if (settings.activeProvider !== 'zarinpal') return { ok: true, text: 'درگاه تستی فعال است و برای توسعه مناسب است.' };
    if (!settings.zarinpalEnabled) return { ok: false, text: 'زرین‌پال انتخاب شده اما هنوز فعال نشده است.' };
    if (!settings.zarinpalMerchantId.trim()) return { ok: false, text: 'Merchant ID زرین‌پال وارد نشده است.' };
    if (!settings.zarinpalEdgeRequestUrl.trim()) return { ok: false, text: 'آدرس Edge Function درخواست پرداخت وارد نشده است.' };
    if (!settings.zarinpalEdgeVerifyUrl.trim()) return { ok: false, text: 'آدرس Edge Function تأیید پرداخت وارد نشده است.' };
    return { ok: true, text: 'تنظیمات اصلی زرین‌پال کامل است.' };
  }, [settings]);

  const save = async () => {
    try {
      setSaving(true);
      setMessage('');
      await updatePaymentGatewaySettings(settings);
      setMessage('تنظیمات پرداخت با موفقیت ذخیره شد.');
    } catch (error: any) {
      setMessage(`خطا در ذخیره تنظیمات: ${error?.message || error}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div dir="rtl" className="p-8 text-white">در حال بارگذاری تنظیمات پرداخت...</div>;

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 p-4 text-white md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-3xl border border-white/10 bg-slate-900 p-6">
          <p className="text-sm font-bold text-amber-300">Carrtell Payment</p>
          <h1 className="mt-2 text-3xl font-black">راه‌اندازی درگاه پرداخت</h1>
          <p className="mt-2 text-sm text-slate-400">تنظیمات را مرحله‌به‌مرحله انجام بده تا چیزی از قلم نیفتد.</p>
        </header>

        <div className="grid grid-cols-3 gap-2">
          {steps.map((item, index) => {
            const Icon = item.icon;
            const active = index === step;
            const done = index < step;
            return (
              <div key={item.title} className={`rounded-2xl border p-3 text-center ${active ? 'border-amber-400 bg-amber-400/10' : done ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-white/10 bg-slate-900'}`}>
                {done ? <Check className="mx-auto h-5 w-5 text-emerald-300" /> : <Icon className={`mx-auto h-5 w-5 ${active ? 'text-amber-300' : 'text-slate-500'}`} />}
                <span className="mt-2 block text-xs font-bold">{item.title}</span>
              </div>
            );
          })}
        </div>

        <section className="rounded-3xl border border-white/10 bg-slate-900 p-6">
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black">کدام حالت پرداخت فعال باشد؟</h2>
                <p className="mt-2 text-sm text-slate-400">برای توسعه از حالت تستی استفاده کن. درگاه واقعی را بعد از ساخت Edge Function فعال می‌کنیم.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <button onClick={() => update('activeProvider', 'test')} className={`rounded-3xl border p-6 text-right ${settings.activeProvider === 'test' ? 'border-amber-400 bg-amber-400/10' : 'border-white/10 bg-slate-950'}`}>
                  <FlaskConical className="mb-4 h-8 w-8 text-amber-300" />
                  <b className="text-lg">پرداخت تستی</b>
                  <p className="mt-2 text-sm leading-6 text-slate-400">بدون انتقال پول واقعی؛ مناسب تست سفارش و فاکتور.</p>
                </button>
                <button onClick={() => update('activeProvider', 'zarinpal')} className={`rounded-3xl border p-6 text-right ${settings.activeProvider === 'zarinpal' ? 'border-emerald-400 bg-emerald-400/10' : 'border-white/10 bg-slate-950'}`}>
                  <CreditCard className="mb-4 h-8 w-8 text-emerald-300" />
                  <b className="text-lg">زرین‌پال</b>
                  <p className="mt-2 text-sm leading-6 text-slate-400">پرداخت واقعی مشتری با Merchant ID و Edge Function.</p>
                </button>
              </div>
              <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950 p-4">
                <span>درگاه تستی به‌عنوان مسیر پشتیبان فعال بماند</span>
                <input type="checkbox" checked={settings.testGatewayEnabled} onChange={(e) => update('testGatewayEnabled', e.target.checked)} />
              </label>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-black">اطلاعات اتصال درگاه</h2>
              {settings.activeProvider === 'test' ? (
                <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-6 text-sm leading-7 text-amber-100">
                  برای حالت تستی هیچ کلید یا آدرس خارجی لازم نیست. فقط ذخیره کن و پرداخت آزمایشی را از صفحه سفارش تست کن.
                </div>
              ) : (
                <div className="space-y-4">
                  <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950 p-4">
                    <span>زرین‌پال فعال باشد</span>
                    <input type="checkbox" checked={settings.zarinpalEnabled} onChange={(e) => update('zarinpalEnabled', e.target.checked)} />
                  </label>
                  <div>
                    <label className="mb-2 block text-sm font-bold">حالت درگاه</label>
                    <select className={inputClass} value={settings.zarinpalMode} onChange={(e) => update('zarinpalMode', e.target.value as 'sandbox' | 'production')}>
                      <option value="sandbox">Sandbox / آزمایشی</option>
                      <option value="production">Production / واقعی</option>
                    </select>
                  </div>
                  <div><label className="mb-2 block text-sm font-bold">Merchant ID</label><input className={inputClass} value={settings.zarinpalMerchantId} onChange={(e) => update('zarinpalMerchantId', e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" /></div>
                  <div><label className="mb-2 block text-sm font-bold">Edge Function درخواست پرداخت</label><input className={inputClass} value={settings.zarinpalEdgeRequestUrl} onChange={(e) => update('zarinpalEdgeRequestUrl', e.target.value)} placeholder="https://.../functions/v1/zarinpal-request" /></div>
                  <div><label className="mb-2 block text-sm font-bold">Edge Function تأیید پرداخت</label><input className={inputClass} value={settings.zarinpalEdgeVerifyUrl} onChange={(e) => update('zarinpalEdgeVerifyUrl', e.target.value)} placeholder="https://.../functions/v1/zarinpal-verify" /></div>
                  <div><label className="mb-2 block text-sm font-bold">مسیر بازگشت</label><input className={inputClass} value={settings.callbackPath} onChange={(e) => update('callbackPath', e.target.value)} placeholder="/payment" /></div>
                  <div><label className="mb-2 block text-sm font-bold">عنوان تراکنش</label><input className={inputClass} value={settings.descriptionPrefix} onChange={(e) => update('descriptionPrefix', e.target.value)} /></div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-black">بررسی و ذخیره نهایی</h2>
              <div className={`rounded-3xl border p-5 ${validation.ok ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100' : 'border-red-500/30 bg-red-500/10 text-red-100'}`}>
                <b>{validation.ok ? 'تنظیمات آماده ذخیره است' : 'تنظیمات ناقص است'}</b>
                <p className="mt-2 text-sm leading-7">{validation.text}</p>
              </div>
              <div className="grid gap-3 rounded-3xl border border-white/10 bg-slate-950 p-5 text-sm md:grid-cols-2">
                <p>درگاه فعال: <b>{settings.activeProvider === 'test' ? 'تستی' : 'زرین‌پال'}</b></p>
                <p>حالت زرین‌پال: <b>{settings.zarinpalMode === 'sandbox' ? 'آزمایشی' : 'واقعی'}</b></p>
                <p>پرداخت تستی: <b>{settings.testGatewayEnabled ? 'فعال' : 'غیرفعال'}</b></p>
                <p>مسیر بازگشت: <b>{settings.callbackPath || '/payment'}</b></p>
              </div>
              <button onClick={save} disabled={saving || !validation.ok} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-6 py-4 font-black text-slate-950 disabled:opacity-50">
                <Save className="h-5 w-5" /> {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات پرداخت'}
              </button>
            </div>
          )}

          {message && <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950 p-4 text-sm">{message}</div>}

          <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-5">
            <button disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))} className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 font-bold disabled:opacity-30">
              <ChevronRight className="h-5 w-5" /> قبلی
            </button>
            {step < steps.length - 1 && (
              <button onClick={() => setStep((value) => Math.min(steps.length - 1, value + 1))} className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 font-black text-slate-950">
                مرحله بعد <ChevronLeft className="h-5 w-5" />
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
