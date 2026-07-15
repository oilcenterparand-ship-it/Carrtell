import React, { useEffect, useState } from 'react';
import { defaultSmartSalesSettings, getSmartSalesSettings, listSmartSalesRules, saveSmartSalesSettings, saveSmartSalesRule, deleteSmartSalesRule } from '../services/smartSalesApi';

export default function SmartSales() {
  const [settings, setSettings] = useState(defaultSmartSalesSettings);
  const [rules, setRules] = useState<any[]>([]);
  const [title, setTitle] = useState('پیشنهاد مکمل دستی');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const reload = async () => {
    setSettings(await getSmartSalesSettings());
    setRules(await listSmartSalesRules());
  };

  useEffect(() => { reload(); }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      await saveSmartSalesSettings(settings);
      setMessage('تنظیمات ذخیره شد.');
    } catch (e: any) {
      setMessage(e.message || 'خطا در ذخیره تنظیمات');
    } finally {
      setSaving(false);
    }
  };

  const addRule = async () => {
    await saveSmartSalesRule({ title, rule_type: 'manual', is_active: true, priority: 100, target_product_ids: [] });
    setTitle('پیشنهاد مکمل دستی');
    await reload();
  };

  return (
    <div className="p-4 md:p-6 text-white" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-black">فروش هوشمند و پیشنهاد مکمل</h1>
        <p className="text-white/60 mt-1">پیشنهادها فقط از محصولات فعال، موجود و سازگار با خودروی کاربر نمایش داده می‌شوند.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="font-bold mb-4">تنظیمات موتور فروش</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              ['enabled', 'فعال بودن موتور پیشنهاد'],
              ['show_in_cart', 'نمایش در سبد خرید'],
              ['show_in_product', 'نمایش در صفحه محصول'],
              ['show_packages', 'نمایش پکیج‌های آماده مدیر'],
              ['only_in_stock', 'فقط محصولات موجود'],
              ['only_compatible_car', 'فقط مناسب خودروی کاربر'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-3 rounded-xl bg-black/20 p-3 border border-white/10">
                <input type="checkbox" checked={Boolean((settings as any)[key])} onChange={(e) => setSettings({ ...settings, [key]: e.target.checked } as any)} />
                <span>{label}</span>
              </label>
            ))}
            <label className="rounded-xl bg-black/20 p-3 border border-white/10">
              <span className="text-sm text-white/70">حداکثر تعداد پیشنهاد</span>
              <input className="mt-2 w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2" type="number" value={settings.max_items} onChange={(e) => setSettings({ ...settings, max_items: Number(e.target.value) })} />
            </label>
          </div>
          <button disabled={saving} onClick={saveSettings} className="mt-4 rounded-xl bg-amber-400 px-5 py-2 font-bold text-black">{saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}</button>
          {message && <p className="mt-3 text-sm text-emerald-300">{message}</p>}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="font-bold mb-4">قانون جدید</h2>
          <input className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} />
          <button onClick={addRule} className="mt-3 w-full rounded-xl bg-white/10 hover:bg-white/20 px-4 py-2">افزودن قانون</button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="font-bold mb-4">قوانین پیشنهاد</h2>
        <div className="space-y-2">
          {rules.map((rule) => (
            <div key={rule.id} className="flex items-center justify-between rounded-xl bg-black/20 border border-white/10 p-3">
              <div>
                <div className="font-bold">{rule.title}</div>
                <div className="text-xs text-white/50">اولویت: {rule.priority} | وضعیت: {rule.is_active ? 'فعال' : 'غیرفعال'}</div>
              </div>
              <button onClick={() => deleteSmartSalesRule(rule.id).then(reload)} className="rounded-lg bg-red-500/20 text-red-200 px-3 py-1">حذف</button>
            </div>
          ))}
          {!rules.length && <div className="text-white/50">هنوز قانونی ثبت نشده است.</div>}
        </div>
      </div>
    </div>
  );
}
