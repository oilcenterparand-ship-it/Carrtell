import { useEffect, useMemo, useState } from 'react';
import {
  applyCarrtellAppearance,
  carrtellFonts,
  carrtellThemePresets,
  getDefaultAppearance,
  loadCarrtellAppearance,
  saveCarrtellAppearance,
  type CarrtellFontId,
  type CarrtellThemePresetId,
  type UserThemeMode
} from '../../lib/appearanceThemes';

type AppearanceState = ReturnType<typeof getDefaultAppearance>;

export default function Appearance() {
  const [form, setForm] = useState<AppearanceState>(() => loadCarrtellAppearance());
  const selectedPreset = useMemo(
    () => carrtellThemePresets.find((item) => item.id === form.presetId) ?? carrtellThemePresets[0],
    [form.presetId]
  );

  useEffect(() => {
    applyCarrtellAppearance(form);
  }, [form]);

  const update = <K extends keyof AppearanceState>(key: K, value: AppearanceState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    saveCarrtellAppearance(form);
    alert('ظاهر سایت ذخیره شد.');
  };

  return (
    <div className="p-4 md:p-6 space-y-5" dir="rtl">
      <div className="rounded-3xl border border-slate-800/60 bg-slate-950/70 p-5 text-white shadow-xl">
        <p className="text-sm text-amber-300">Appearance Studio</p>
        <h1 className="mt-1 text-2xl font-black">ظاهر سایت</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-300">
          در این بخش تم‌های آماده فروشگاهی، فونت هماهنگ و حالت روشن/تاریک را مدیریت می‌کنی. کنترل دستی رنگ‌ها حذف شده تا خوانایی متن و زمینه خراب نشود.
        </p>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        {carrtellThemePresets.map((theme) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => update('presetId', theme.id as CarrtellThemePresetId)}
            className={`rounded-3xl border p-4 text-right transition hover:-translate-y-1 hover:shadow-xl ${
              form.presetId === theme.id ? 'border-amber-400 bg-amber-400/10' : 'border-slate-800 bg-slate-900/70'
            }`}
          >
            <div className="mb-4 flex items-center gap-2">
              {['--ct-bg', '--ct-surface', '--ct-primary', '--ct-accent'].map((key) => (
                <span
                  key={key}
                  className="h-8 w-8 rounded-full border border-white/20"
                  style={{ background: theme.cssVars[key] }}
                />
              ))}
            </div>
            <h3 className="text-lg font-black text-white">{theme.name}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">{theme.description}</p>
            <span className="mt-3 inline-flex rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">
              {theme.mode === 'dark' ? 'پایه تیره' : 'پایه روشن'}
            </span>
          </button>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="text-lg font-black text-white">فونت سایت</h2>
          <p className="mt-1 text-sm text-slate-400">فونت‌ها هماهنگ و فارسی‌پسند هستند؛ فایل فونت جدید اضافه نمی‌شود.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {carrtellFonts.map((font) => (
              <button
                key={font.id}
                type="button"
                onClick={() => update('fontId', font.id as CarrtellFontId)}
                className={`rounded-2xl border px-4 py-3 text-right transition ${
                  form.fontId === font.id ? 'border-amber-400 bg-amber-400/10 text-amber-200' : 'border-slate-800 bg-slate-950 text-slate-200'
                }`}
                style={{ fontFamily: font.cssFamily }}
              >
                <b>{font.name}</b>
                <span className="mt-1 block text-sm opacity-80">نمونه متن فروشگاهی کارتل</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="text-lg font-black text-white">حالت پیش‌فرض کاربر</h2>
          <p className="mt-1 text-sm text-slate-400">کاربر از هدر می‌تواند بین روشن، تاریک و سیستم تغییر دهد.</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {(['system', 'light', 'dark'] as UserThemeMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => update('userMode', mode)}
                className={`rounded-2xl border px-4 py-3 text-center text-sm font-bold ${
                  form.userMode === mode ? 'border-amber-400 bg-amber-400/10 text-amber-200' : 'border-slate-800 bg-slate-950 text-slate-200'
                }`}
              >
                {mode === 'system' ? 'سیستم' : mode === 'light' ? 'روشن' : 'تاریک'}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-white">پیش‌نمایش زنده</h2>
            <p className="text-sm text-slate-400">نمونه کارت محصول، دکمه، قیمت، فیلد و متن با تم انتخابی.</p>
          </div>
          <button onClick={handleSave} className="rounded-2xl bg-amber-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/20">
            ذخیره ظاهر سایت
          </button>
        </div>

        <div
          className="rounded-3xl border p-5"
          style={{
            background: selectedPreset.cssVars['--ct-bg'],
            color: selectedPreset.cssVars['--ct-text'],
            borderColor: selectedPreset.cssVars['--ct-border'],
            fontFamily: carrtellFonts.find((font) => font.id === form.fontId)?.cssFamily
          }}
        >
          <div
            className="rounded-2xl border p-4"
            style={{ background: selectedPreset.cssVars['--ct-surface'], borderColor: selectedPreset.cssVars['--ct-border'] }}
          >
            <div className="aspect-video rounded-2xl" style={{ background: selectedPreset.cssVars['--ct-surface-2'] }} />
            <h3 className="mt-4 text-xl font-black">روغن موتور مناسب خودروی شما</h3>
            <p className="mt-2 text-sm" style={{ color: selectedPreset.cssVars['--ct-muted'] }}>
              متن کم‌رنگ و متن اصلی باید روی زمینه کاملاً خوانا باشند.
            </p>
            <div className="mt-4 flex items-center justify-between">
              <b style={{ color: selectedPreset.cssVars['--ct-primary'] }}>۱,۲۵۰,۰۰۰ تومان</b>
              <button
                className="rounded-xl px-4 py-2 text-sm font-black"
                style={{ background: selectedPreset.cssVars['--ct-primary'], color: selectedPreset.cssVars['--ct-primary-text'] }}
              >
                افزودن به سبد
              </button>
            </div>
            <input
              className="mt-4 w-full rounded-xl border px-4 py-3 outline-none"
              placeholder="نمونه فیلد هماهنگ با تم"
              style={{
                background: selectedPreset.cssVars['--ct-input-bg'],
                color: selectedPreset.cssVars['--ct-input-text'],
                borderColor: selectedPreset.cssVars['--ct-border']
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
