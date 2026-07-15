import { useEffect, useState } from 'react';
import { getPaymentSettings, savePaymentSettings, type PaymentSettings as PaymentSettingsType } from '../services/paymentEngineApi';

const inputClass = 'w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-amber-400';
const labelClass = 'mb-2 block text-sm font-bold text-slate-200';

export default function PaymentSettings() {
  const [settings, setSettings] = useState<PaymentSettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    getPaymentSettings()
      .then((data) => mounted && setSettings(data))
      .catch((err) => mounted && setMessage(`خطا در دریافت تنظیمات: ${err.message}`))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const update = <K extends keyof PaymentSettingsType>(key: K, value: PaymentSettingsType[K]) => {
    setSettings((prev) => prev ? { ...prev, [key]: value } : prev);
  };

  const save = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      setMessage('');
      const saved = await savePaymentSettings(settings);
      setSettings(saved);
      setMessage('✅ تنظیمات پرداخت ذخیره شد.');
    } catch (err: any) {
      setMessage(`❌ خطا در ذخیره: ${err.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div dir="rtl" className="p-6 text-white">در حال بارگذاری تنظیمات پرداخت...</div>;
  }

  if (!settings) {
    return <div dir="rtl" className="p-6 text-red-200">تنظیمات پرداخت قابل دریافت نیست.</div>;
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 p-4 text-white md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold text-amber-300">💳 Carrtell Payment Engine</p>
              <h1 className="mt-2 text-2xl font-black md:text-3xl">تنظیمات پرداخت</h1>
              <p className="mt-2 text-sm text-slate-400">درگاه، روش‌های پرداخت، کارت‌به‌کارت و حالت تست/واقعی را از اینجا مدیریت کن.</p>
            </div>
            <button onClick={save} disabled={saving} className="rounded-2xl bg-amber-400 px-6 py-3 font-black text-slate-950 hover:bg-amber-300 disabled:opacity-60">
              {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
            </button>
          </div>
          {message && <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm">{message}</div>}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-white/10 bg-slate-900 p-6">
            <h2 className="mb-5 text-xl font-black">درگاه پرداخت آنلاین</h2>
            <div className="space-y-4">
              <label className={labelClass}>انتخاب درگاه</label>
              <select className={inputClass} value={settings.provider} onChange={(e) => update('provider', e.target.value as any)}>
                <option value="test">پرداخت تستی</option>
                <option value="zarinpal">زرین‌پال</option>
                <option value="idpay">آیدی‌پی</option>
                <option value="card_to_card">کارت به کارت</option>
                <option value="cash_on_delivery">پرداخت در محل</option>
              </select>

              <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950 p-4">
                <span>پرداخت آنلاین فعال باشد</span>
                <input type="checkbox" checked={settings.online_enabled} onChange={(e) => update('online_enabled', e.target.checked)} />
              </label>

              <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950 p-4">
                <span>حالت تست / Sandbox</span>
                <input type="checkbox" checked={settings.sandbox_mode} onChange={(e) => update('sandbox_mode', e.target.checked)} />
              </label>

              <div>
                <label className={labelClass}>Merchant ID / API Key</label>
                <input className={inputClass} value={settings.merchant_id ?? ''} onChange={(e) => update('merchant_id', e.target.value)} placeholder="کد پذیرنده زرین‌پال یا کلید API" />
              </div>

              <div>
                <label className={labelClass}>Callback URL</label>
                <input className={inputClass} value={settings.callback_url ?? ''} onChange={(e) => update('callback_url', e.target.value)} placeholder="https://your-domain.com/payment/callback" />
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-slate-900 p-6">
            <h2 className="mb-5 text-xl font-black">روش‌های پرداخت مشتری</h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950 p-4">
                <span>کارت به کارت فعال باشد</span>
                <input type="checkbox" checked={settings.card_to_card_enabled} onChange={(e) => update('card_to_card_enabled', e.target.checked)} />
              </label>
              <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950 p-4">
                <span>پرداخت در محل فعال باشد</span>
                <input type="checkbox" checked={settings.cod_enabled} onChange={(e) => update('cod_enabled', e.target.checked)} />
              </label>
              <div>
                <label className={labelClass}>شماره کارت</label>
                <input className={inputClass} value={settings.card_number ?? ''} onChange={(e) => update('card_number', e.target.value)} placeholder="6037-xxxx-xxxx-xxxx" />
              </div>
              <div>
                <label className={labelClass}>نام صاحب کارت</label>
                <input className={inputClass} value={settings.card_owner ?? ''} onChange={(e) => update('card_owner', e.target.value)} placeholder="نام صاحب کارت" />
              </div>
              <div>
                <label className={labelClass}>حداقل مبلغ سفارش</label>
                <input type="number" className={inputClass} value={settings.min_order_amount ?? 0} onChange={(e) => update('min_order_amount', Number(e.target.value))} />
              </div>
              <div>
                <label className={labelClass}>توضیحات پرداخت</label>
                <textarea className={`${inputClass} min-h-28`} value={settings.payment_note ?? ''} onChange={(e) => update('payment_note', e.target.value)} placeholder="توضیحات نمایش داده‌شده در Checkout" />
              </div>
            </div>
          </section>
        </div>

        <div className="rounded-3xl border border-amber-400/30 bg-amber-400/10 p-5 text-sm text-amber-100">
          نکته: حالت تست برای ادامه توسعه فعال بماند. قبل از انتشار نهایی، RLS و Edge Function درگاه واقعی محدودتر می‌شود.
        </div>
      </div>
    </div>
  );
}
