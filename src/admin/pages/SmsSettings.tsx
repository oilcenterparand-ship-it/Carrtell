import { useEffect, useMemo, useState } from 'react';
import {
  getSmsSettings,
  getSmsTemplates,
  saveSmsSettings,
  sendTestSms,
  updateSmsTemplate,
} from '../../services/smsOtpApi';

type Step = 1 | 2 | 3;

const fieldClass = 'w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-amber-400';

export default function SmsSettings() {
  const [settings, setSettings] = useState<any>({ provider: 'test', is_enabled: false, test_mode: true });
  const [templates, setTemplates] = useState<any[]>([]);
  const [step, setStep] = useState<Step>(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testTemplate, setTestTemplate] = useState('order_created');

  async function load() {
    try {
      const loadedSettings = await getSmsSettings().catch(() => null);
      const loadedTemplates = await getSmsTemplates().catch(() => []);
      setSettings(loadedSettings || { provider: 'test', is_enabled: false, test_mode: true });
      setTemplates(loadedTemplates);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'خطا در بارگذاری تنظیمات پیامک');
    }
  }

  useEffect(() => { load(); }, []);

  const activeTemplate = useMemo(
    () => templates.find((item) => item.template_key === testTemplate),
    [templates, testTemplate],
  );

  function flash(text: string) {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  }

  async function saveAll() {
    setSaving(true);
    setError('');
    try {
      await saveSmsSettings(settings);
      for (const template of templates) {
        await updateSmsTemplate(template.id, template.body, Boolean(template.is_active ?? template.is_enabled));
      }
      flash('تنظیمات پیامک ذخیره شد');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'ذخیره تنظیمات ناموفق بود');
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setSaving(true);
    setError('');
    try {
      const result = await sendTestSms(testPhone, testTemplate, {
        order_code: 'TEST-1001',
        status: 'در حال آماده‌سازی',
        code: '123456',
        review_link: `${window.location.origin}/review/test`,
        service_code: 'SRV-1001',
      });
      flash(result.test ? 'پیامک آزمایشی در لاگ ثبت شد' : 'پیامک برای ارسال در صف قرار گرفت');
    } catch (testError) {
      setError(testError instanceof Error ? testError.message : 'ارسال آزمایشی ناموفق بود');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 p-4 text-white md:p-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="rounded-3xl border border-white/10 bg-slate-900 p-6">
          <p className="text-sm font-bold text-amber-300">مرکز پیامک Carrtell</p>
          <h1 className="mt-2 text-2xl font-black md:text-3xl">راه‌اندازی مرحله‌ای پیامک و اعلان</h1>
          <p className="mt-2 text-sm text-slate-300">هر مرحله را جدا تنظیم کن و در پایان یک پیامک آزمایشی ثبت کن.</p>
        </header>

        <div className="grid grid-cols-3 gap-2">
          {[['۱', 'سرویس‌دهنده'], ['۲', 'قالب‌ها'], ['۳', 'تست نهایی']].map(([number, label], index) => {
            const current = index + 1 === step;
            const done = index + 1 < step;
            return (
              <button key={number} onClick={() => setStep((index + 1) as Step)} className={`rounded-2xl border p-3 text-sm font-bold transition ${current ? 'border-amber-400 bg-amber-400 text-slate-950' : done ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-white/10 bg-slate-900 text-slate-400'}`}>
                <span className="block text-lg">{done ? '✓' : number}</span>{label}
              </button>
            );
          })}
        </div>

        {step === 1 && (
          <section className="space-y-5 rounded-3xl border border-white/10 bg-slate-900 p-6">
            <div>
              <h2 className="text-xl font-black">مرحله ۱: سرویس‌دهنده</h2>
              <p className="mt-1 text-sm text-slate-400">برای شروع، حالت تست را انتخاب کن. اتصال واقعی بعداً از طریق Edge Function انجام می‌شود.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2"><span>سرویس‌دهنده</span><select value={settings.provider || 'test'} onChange={(event) => setSettings({ ...settings, provider: event.target.value })} className={fieldClass}><option value="test">حالت تست / فقط لاگ</option><option value="kavenegar">کاوه‌نگار</option><option value="farazsms">فراز SMS</option><option value="melipayamak">ملی پیامک</option></select></label>
              <label className="space-y-2"><span>شماره ارسال‌کننده</span><input value={settings.sender_number || ''} onChange={(event) => setSettings({ ...settings, sender_number: event.target.value })} className={fieldClass} placeholder="مثلاً 1000..." /></label>
              <label className="space-y-2 md:col-span-2"><span>API Key</span><input type="password" value={settings.api_key || ''} onChange={(event) => setSettings({ ...settings, api_key: event.target.value })} className={fieldClass} placeholder="کلید سرویس پیامک" /></label>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <button onClick={() => setSettings({ ...settings, is_enabled: !settings.is_enabled })} className={`rounded-2xl border p-4 text-right ${settings.is_enabled ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-white/10 bg-slate-950'}`}><b className="block">ارسال پیامک</b><span className="text-sm text-slate-400">{settings.is_enabled ? 'فعال است' : 'غیرفعال است'}</span></button>
              <button onClick={() => setSettings({ ...settings, test_mode: !settings.test_mode })} className={`rounded-2xl border p-4 text-right ${settings.test_mode ? 'border-amber-400/40 bg-amber-400/10' : 'border-white/10 bg-slate-950'}`}><b className="block">حالت تست</b><span className="text-sm text-slate-400">{settings.test_mode ? 'فقط در لاگ ثبت می‌شود' : 'آماده اتصال واقعی'}</span></button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-4 rounded-3xl border border-white/10 bg-slate-900 p-6">
            <div><h2 className="text-xl font-black">مرحله ۲: قالب پیامک‌ها</h2><p className="mt-1 text-sm text-slate-400">هر رویداد را فعال یا غیرفعال کن و متن آن را تغییر بده.</p></div>
            {templates.length === 0 ? <div className="rounded-2xl bg-slate-950 p-5 text-slate-400">قالبی در دیتابیس پیدا نشد.</div> : templates.map((template, index) => (
              <article key={template.id} className="rounded-2xl border border-white/10 bg-slate-950 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><div><b>{template.title || template.template_key}</b><p className="text-xs text-slate-500">{template.template_key}</p></div><button onClick={() => { const next = [...templates]; next[index] = { ...template, is_active: !(template.is_active ?? template.is_enabled) }; setTemplates(next); }} className={`rounded-full px-4 py-2 text-xs font-bold ${(template.is_active ?? template.is_enabled) ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'}`}>{(template.is_active ?? template.is_enabled) ? 'فعال' : 'غیرفعال'}</button></div>
                <textarea value={template.body || ''} onChange={(event) => { const next = [...templates]; next[index] = { ...template, body: event.target.value }; setTemplates(next); }} className={`${fieldClass} min-h-[110px] resize-y`} />
              </article>
            ))}
          </section>
        )}

        {step === 3 && (
          <section className="space-y-5 rounded-3xl border border-white/10 bg-slate-900 p-6">
            <div><h2 className="text-xl font-black">مرحله ۳: تست نهایی</h2><p className="mt-1 text-sm text-slate-400">شماره را وارد کن؛ در حالت تست، نتیجه داخل لاگ پیامک ثبت می‌شود.</p></div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2"><span>شماره موبایل تست</span><input value={testPhone} onChange={(event) => setTestPhone(event.target.value)} className={fieldClass} placeholder="0912..." /></label>
              <label className="space-y-2"><span>قالب تست</span><select value={testTemplate} onChange={(event) => setTestTemplate(event.target.value)} className={fieldClass}>{templates.map((template) => <option key={template.id} value={template.template_key}>{template.title || template.template_key}</option>)}</select></label>
            </div>
            {activeTemplate && <div className="rounded-2xl border border-white/10 bg-slate-950 p-4"><span className="text-xs text-slate-500">پیش‌نمایش قالب</span><p className="mt-2 leading-8 text-slate-200">{activeTemplate.body}</p></div>}
            <button disabled={saving || !testPhone.trim()} onClick={handleTest} className="w-full rounded-2xl bg-emerald-500 px-6 py-4 font-black text-white disabled:cursor-not-allowed disabled:opacity-50">ثبت پیامک آزمایشی</button>
          </section>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button disabled={step === 1} onClick={() => setStep((step - 1) as Step)} className="rounded-2xl border border-white/10 bg-slate-900 px-5 py-3 font-bold disabled:opacity-30">مرحله قبل</button>
          <div className="flex gap-3">
            <button disabled={saving} onClick={saveAll} className="rounded-2xl border border-amber-400/40 bg-amber-400/10 px-5 py-3 font-black text-amber-300 disabled:opacity-50">{saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}</button>
            {step < 3 && <button onClick={() => setStep((step + 1) as Step)} className="rounded-2xl bg-amber-400 px-6 py-3 font-black text-slate-950">مرحله بعد</button>}
          </div>
        </div>

        {message && <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-300">{message}</div>}
        {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">{error}</div>}
      </div>
    </div>
  );
}
