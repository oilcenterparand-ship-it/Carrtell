import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_SYSTEM_SETTINGS, getSystemSettings, SystemSetting, upsertManySystemSettings } from '../services/systemSettingsApi';
import { updateStaffTemporaryCredentials } from '../../auth/staffPasswordAuth';

const groupLabels: Record<string, string> = {
  store: 'فروشگاه و برند',
  service: 'سرویس در محل',
  orders: 'سفارش‌ها',
  sms: 'پیامک',
  map: 'نقشه نشان',
  appearance: 'ظاهر سایت',
  payment: 'پرداخت',
  notifications: 'اعلان‌ها',
};

const groupDescriptions: Record<string, string> = {
  store: 'اطلاعات عمومی Carrtell، وضعیت فعالیت و راه‌های تماس.',
  service: 'هزینه اعزام، محدوده سرویس و تنظیمات عملیاتی سرویس در محل.',
  orders: 'حداقل خرید، مالیات، کارمزد خدمات و قوانین سفارش.',
  sms: 'فعال‌سازی و تنظیمات پایه پیامک. اتصال واقعی پیامک در بخش پیامک مدیریت می‌شود.',
  map: 'نگهداری کلید نشان و مختصات انبار اصلی. اتصال واقعی نقشه برای مرحله آخر نگه داشته شده است.',
  appearance: 'رنگ‌ها و حالت نمایشی پایه. Theme Builder قبلی همچنان حفظ می‌شود.',
};

function parseInputValue(raw: string, oldValue: any) {
  if (typeof oldValue === 'boolean') return raw === 'true';
  if (typeof oldValue === 'number') return Number(raw || 0);
  return raw;
}

export default function SystemSettingsCenter() {
  const [settings, setSettings] = useState<SystemSetting[]>(DEFAULT_SYSTEM_SETTINGS);
  const [activeGroup, setActiveGroup] = useState('store');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [staffUsername, setStaffUsername] = useState('admin');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffSaving, setStaffSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    getSystemSettings()
      .then((items) => mounted && setSettings(items))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const groups = useMemo(() => {
    const keys = Array.from(new Set(settings.map((item) => item.group_key)));
    return keys.length ? keys : Object.keys(groupLabels);
  }, [settings]);

  const activeItems = settings.filter((item) => item.group_key === activeGroup);

  function updateSetting(key: string, value: string) {
    setSettings((prev) =>
      prev.map((item) =>
        item.group_key === activeGroup && item.setting_key === key
          ? { ...item, setting_value: parseInputValue(value, item.setting_value) }
          : item
      )
    );
  }

  async function saveStaffCredentials() {
    if (!staffUsername.trim() || staffPassword.length < 5) { setMessage('برای ورود کارکنان، نام کاربری معتبر و رمز حداقل ۵ کاراکتری وارد کن.'); return; }
    setStaffSaving(true); setMessage('');
    try { await updateStaffTemporaryCredentials('admin', staffUsername, staffPassword); setStaffPassword(''); setMessage('اطلاعات ورود مدیریت ذخیره شد.'); }
    catch (error: any) { setMessage(error?.message || 'ذخیره اطلاعات ورود ناموفق بود.'); }
    finally { setStaffSaving(false); }
  }

  async function save() {
    setSaving(true);
    setMessage('');
    try {
      await upsertManySystemSettings(settings);
      setMessage('تنظیمات با موفقیت ذخیره شد.');
    } catch (error: any) {
      setMessage(error?.message || 'ذخیره تنظیمات ناموفق بود.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/30">
          <p className="text-sm text-amber-300">Carrtell Admin</p>
          <h1 className="mt-2 text-2xl md:text-3xl font-black">مرکز تنظیمات سیستم</h1>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            تنظیمات اصلی فروشگاه، سرویس در محل، سفارش‌ها، پیامک، نقشه و ظاهر سایت از این صفحه مدیریت می‌شوند.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-3xl border border-white/10 bg-white/[0.04] p-3 h-max">
            {groups.map((group) => (
              <button
                key={group}
                onClick={() => setActiveGroup(group)}
                className={`mb-2 w-full rounded-2xl px-4 py-3 text-right text-sm font-bold transition ${
                  activeGroup === group
                    ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-900/80 text-slate-200 hover:bg-slate-800'
                }`}
              >
                {groupLabels[group] || group}
              </button>
            ))}
          </aside>

          <main className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 md:p-6">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-black">{groupLabels[activeGroup] || activeGroup}</h2>
                <p className="mt-2 text-sm text-slate-400">{groupDescriptions[activeGroup]}</p>
              </div>
              <button
                onClick={save}
                disabled={saving}
                className="rounded-2xl bg-amber-400 px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-60"
              >
                {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
              </button>
            </div>

            {message && (
              <div className="mb-4 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200">{message}</div>
            )}

            <div className="mb-6 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4">
              <h3 className="font-black text-amber-200">ورود مدیریت</h3>
              <p className="mt-1 text-xs leading-6 text-slate-400">این بخش فقط برای نام کاربری و رمز مدیر اصلی است. حساب هر سرویس‌کار از صفحه «سرویس‌کارها» جداگانه ساخته و ویرایش می‌شود.</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input value={staffUsername} onChange={(e)=>setStaffUsername(e.target.value)} placeholder="نام کاربری مدیریت" className="rounded-xl border border-white/10 bg-slate-950 px-3 py-3" />
                <input type="password" value={staffPassword} onChange={(e)=>setStaffPassword(e.target.value)} placeholder="رمز جدید مدیریت" className="rounded-xl border border-white/10 bg-slate-950 px-3 py-3" />
              </div>
              <div className="mt-3 flex flex-wrap gap-2"><button onClick={saveStaffCredentials} disabled={staffSaving} className="rounded-xl bg-amber-400 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-50">{staffSaving ? 'در حال ذخیره...' : 'ذخیره ورود مدیریت'}</button><a href="/admin/technicians" className="rounded-xl border border-cyan-400/30 px-4 py-3 text-sm font-black text-cyan-200">مدیریت سرویس‌کارها و رمزها</a></div>
            </div>

            {loading ? (
              <div className="rounded-2xl bg-slate-900 p-6 text-slate-300">در حال دریافت تنظیمات...</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {activeItems.map((item) => (
                  <label key={`${item.group_key}-${item.setting_key}`} className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                    <span className="block text-sm font-bold text-slate-100">{item.label || item.setting_key}</span>
                    {item.description && <span className="mt-1 block text-xs text-slate-500">{item.description}</span>}

                    {typeof item.setting_value === 'boolean' ? (
                      <select
                        value={String(item.setting_value)}
                        onChange={(e) => updateSetting(item.setting_key, e.target.value)}
                        className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-white outline-none focus:border-amber-400"
                      >
                        <option value="true">فعال</option>
                        <option value="false">غیرفعال</option>
                      </select>
                    ) : (
                      <input
                        value={item.setting_value ?? ''}
                        type={typeof item.setting_value === 'number' ? 'number' : 'text'}
                        onChange={(e) => updateSetting(item.setting_key, e.target.value)}
                        className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-white outline-none placeholder:text-slate-600 focus:border-amber-400"
                      />
                    )}
                  </label>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
