import { useEffect, useState } from 'react';
import { getSmsSettings, getSmsTemplates, saveSmsSettings, updateSmsTemplate } from '../../services/smsOtpApi';

export default function SmsSettings() {
  const [settings, setSettings] = useState<any>({ provider: 'test', is_enabled: false, test_mode: true });
  const [templates, setTemplates] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

  async function load() {
    const s = await getSmsSettings().catch(() => null);
    setSettings(s || { provider: 'test', is_enabled: false, test_mode: true });
    setTemplates(await getSmsTemplates().catch(() => []));
  }
  useEffect(() => { load(); }, []);

  async function save() {
    await saveSmsSettings(settings);
    for (const t of templates) await updateSmsTemplate(t.id, t.body, t.is_active);
    setMsg('تنظیمات پیامک ذخیره شد');
    setTimeout(() => setMsg(''), 2500);
  }

  return <div dir="rtl" className="min-h-screen bg-slate-950 p-6 text-white">
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="rounded-3xl border border-white/10 bg-slate-900 p-6">
        <h1 className="text-2xl font-black">پیامک و ورود OTP</h1>
        <p className="mt-2 text-slate-300">تا زمان اتصال API واقعی، پیامک‌ها در حالت تست فقط داخل لاگ ثبت می‌شوند.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2"><span>سرویس‌دهنده</span><select value={settings.provider || 'test'} onChange={e=>setSettings({...settings, provider:e.target.value})} className="w-full rounded-2xl bg-slate-800 p-3"><option value="test">Test / فقط لاگ</option><option value="kavenegar">کاوه‌نگار</option><option value="farazsms">فراز SMS</option><option value="melipayamak">ملی پیامک</option></select></label>
        <label className="space-y-2"><span>API Key</span><input value={settings.api_key || ''} onChange={e=>setSettings({...settings, api_key:e.target.value})} className="w-full rounded-2xl bg-slate-800 p-3" /></label>
        <label className="space-y-2"><span>شماره ارسال‌کننده</span><input value={settings.sender_number || ''} onChange={e=>setSettings({...settings, sender_number:e.target.value})} className="w-full rounded-2xl bg-slate-800 p-3" /></label>
        <div className="flex items-center gap-4 rounded-2xl bg-slate-900 p-4"><label><input type="checkbox" checked={!!settings.is_enabled} onChange={e=>setSettings({...settings, is_enabled:e.target.checked})} /> فعال</label><label><input type="checkbox" checked={!!settings.test_mode} onChange={e=>setSettings({...settings, test_mode:e.target.checked})} /> حالت تست</label></div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-900 p-6">
        <h2 className="mb-4 text-xl font-bold">قالب پیامک‌ها</h2>
        <div className="space-y-4">
          {templates.map((t, i) => <div key={t.id} className="rounded-2xl bg-slate-950 p-4">
            <div className="mb-2 flex items-center justify-between"><b>{t.title}</b><span className="text-xs text-slate-400">{t.template_key}</span></div>
            <textarea value={t.body} onChange={e=>{const n=[...templates]; n[i]={...t, body:e.target.value}; setTemplates(n)}} className="min-h-[90px] w-full rounded-2xl bg-slate-800 p-3" />
            <label className="mt-2 block"><input type="checkbox" checked={!!t.is_active} onChange={e=>{const n=[...templates]; n[i]={...t, is_active:e.target.checked}; setTemplates(n)}} /> فعال</label>
          </div>)}
        </div>
      </div>
      <button onClick={save} className="rounded-2xl bg-amber-400 px-6 py-3 font-black text-slate-950">ذخیره تنظیمات پیامک</button>
      {msg && <span className="mr-4 text-emerald-400">{msg}</span>}
    </div>
  </div>;
}
