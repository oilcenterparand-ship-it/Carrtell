import { useEffect, useState } from 'react';
import { RefreshCw, Save, Sparkles } from 'lucide-react';
import { getAdminRecommendationSettings, saveAdminRecommendationSettings } from '../services/recommendationSettingsApi';
import type { RecommendationSettings } from '../../customer/services/recommendationsApi';

function parseCsv(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function toCsv(value: string[]) {
  return (value || []).join(', ');
}

export default function RecommendationSettingsPage() {
  const [settings, setSettings] = useState<RecommendationSettings | null>(null);
  const [essential, setEssential] = useState('');
  const [picks, setPicks] = useState('');
  const [nextService, setNextService] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    setMessage('');
    try {
      const data = await getAdminRecommendationSettings();
      setSettings(data);
      setEssential(toCsv(data.essential_categories));
      setPicks(toCsv(data.carrtell_pick_categories));
      setNextService(toCsv(data.next_service_categories));
    } catch (error) {
      console.error('recommendation settings load error:', error);
      setMessage('تنظیمات پیشنهادها لود نشد. SQL پچ پیشنهادها را اجرا کن.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!settings) return;
    setSaving(true);
    setMessage('');
    try {
      const saved = await saveAdminRecommendationSettings({
        ...settings,
        essential_categories: parseCsv(essential),
        carrtell_pick_categories: parseCsv(picks),
        next_service_categories: parseCsv(nextService),
      });
      setSettings(saved);
      setMessage('تنظیمات پیشنهاد هوشمند ذخیره شد.');
    } catch (error) {
      console.error('recommendation settings save error:', error);
      setMessage('ذخیره تنظیمات انجام نشد. اتصال Supabase یا SQL را بررسی کن.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-white/50">در حال بارگذاری تنظیمات پیشنهادها...</div>;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-gold-500/10 px-3 py-1 text-xs font-black text-gold-300"><Sparkles className="h-4 w-4" /> موتور پیشنهاد Carrtell</p>
          <h1 className="text-2xl font-black text-white">تنظیمات پیشنهاد محصول براساس خودرو</h1>
          <p className="mt-2 text-sm leading-7 text-white/50">این بخش AI آزاد نیست؛ فقط محصولات فعال و موجود را براساس سازگاری خودرو، گیربکس و دسته‌بندی پیشنهاد می‌دهد.</p>
        </div>
        <button onClick={load} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white/75 hover:bg-white/10"><RefreshCw className="h-4 w-4" /> بروزرسانی</button>
      </div>

      {!!message && <div className="rounded-2xl border border-gold-400/20 bg-gold-500/10 p-4 text-sm text-gold-100">{message}</div>}

      {settings && (
        <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <input type="checkbox" checked={settings.is_enabled} onChange={(e) => setSettings({ ...settings, is_enabled: e.target.checked })} className="ml-2" />
              <span className="font-bold text-white">فعال بودن پیشنهادها</span>
            </label>
            <label className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <input type="checkbox" checked={settings.only_in_stock} onChange={(e) => setSettings({ ...settings, only_in_stock: e.target.checked })} className="ml-2" />
              <span className="font-bold text-white">فقط محصولات موجود</span>
            </label>
            <label className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <input type="checkbox" checked={settings.show_unmatched_warning} onChange={(e) => setSettings({ ...settings, show_unmatched_warning: e.target.checked })} className="ml-2" />
              <span className="font-bold text-white">نمایش هشدار ناسازگاری</span>
            </label>
          </div>

          <div className="mt-6 grid gap-5">
            <label>
              <span className="mb-2 block text-sm font-bold text-white/70">دسته‌بندی اقلام ضروری</span>
              <textarea value={essential} onChange={(e) => setEssential(e.target.value)} rows={3} className="w-full rounded-2xl border border-white/10 bg-navy-950 px-4 py-3 text-sm text-white outline-none focus:border-gold-400" />
              <small className="mt-1 block text-xs text-white/35">با کاما جدا کن. مثال: oil, engine_oil, oil_filter, air_filter</small>
            </label>
            <label>
              <span className="mb-2 block text-sm font-bold text-white/70">دسته‌بندی پیشنهاد کارتل</span>
              <textarea value={picks} onChange={(e) => setPicks(e.target.value)} rows={3} className="w-full rounded-2xl border border-white/10 bg-navy-950 px-4 py-3 text-sm text-white outline-none focus:border-gold-400" />
            </label>
            <label>
              <span className="mb-2 block text-sm font-bold text-white/70">دسته‌بندی سرویس بعدی</span>
              <textarea value={nextService} onChange={(e) => setNextService(e.target.value)} rows={3} className="w-full rounded-2xl border border-white/10 bg-navy-950 px-4 py-3 text-sm text-white outline-none focus:border-gold-400" />
            </label>
          </div>

          <button onClick={save} disabled={saving} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gold-500 px-6 py-3 text-sm font-black text-navy-950 hover:bg-gold-400 disabled:opacity-50"><Save className="h-4 w-4" /> {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}</button>
        </div>
      )}
    </div>
  );
}
