import { useEffect, useMemo, useState } from 'react';
import {
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
  const [saved, setSaved] = useState(false);
  const selectedPreset = useMemo(
    () => carrtellThemePresets.find((item) => item.id === form.presetId) ?? carrtellThemePresets[1],
    [form.presetId]
  );

  const persist = (next: AppearanceState) => {
    setForm(next);
    saveCarrtellAppearance(next);
    setSaved(true);
  };

  useEffect(() => {
    if (!saved) return;
    const timer = window.setTimeout(() => setSaved(false), 1800);
    return () => window.clearTimeout(timer);
  }, [saved, form]);

  const update = <K extends keyof AppearanceState>(key: K, value: AppearanceState[K]) => {
    persist({ ...form, [key]: value });
  };

  return (
    <div className="min-h-screen space-y-5 bg-[var(--ct-bg)] p-4 text-[var(--ct-text)] md:p-6" dir="rtl">
      <div className="rounded-3xl border border-[var(--ct-border)] bg-[var(--ct-surface)] p-5 shadow-[var(--ct-shadow)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[var(--ct-primary)]">Appearance Studio</p>
            <h1 className="mt-1 text-2xl font-black text-[var(--ct-heading)]">ظاهر سایت</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--ct-muted)]">
              هر انتخاب بلافاصله ذخیره و روی تمام صفحات اعمال می‌شود. رنگ متن، زمینه، فیلدها، هدر و کارت‌ها برای هر تم از قبل با کنتراست امن تنظیم شده‌اند.
            </p>
          </div>
          <div className={`rounded-2xl border px-4 py-2 text-sm font-bold transition ${saved ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-[var(--ct-border)] bg-[var(--ct-surface-2)] text-[var(--ct-muted)]'}`}>
            {saved ? '✓ تغییرات ذخیره و اعمال شد' : 'ذخیره خودکار فعال است'}
          </div>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        {carrtellThemePresets.map((theme) => {
          const active = form.presetId === theme.id;
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => update('presetId', theme.id as CarrtellThemePresetId)}
              className="rounded-3xl border p-4 text-right transition hover:-translate-y-1"
              style={{
                background: theme.cssVars['--ct-surface'],
                color: theme.cssVars['--ct-text'],
                borderColor: active ? theme.cssVars['--ct-primary'] : theme.cssVars['--ct-border'],
                boxShadow: active ? `0 0 0 3px ${theme.cssVars['--ct-primary']}33, ${theme.cssVars['--ct-shadow']}` : theme.cssVars['--ct-shadow']
              }}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {['--ct-bg', '--ct-surface', '--ct-primary', '--ct-accent'].map((key) => (
                    <span key={key} className="h-8 w-8 rounded-full border" style={{ background: theme.cssVars[key], borderColor: theme.cssVars['--ct-border'] }} />
                  ))}
                </div>
                {active && <span className="rounded-full px-3 py-1 text-xs font-black" style={{ background: theme.cssVars['--ct-primary'], color: theme.cssVars['--ct-primary-text'] }}>فعال</span>}
              </div>
              <h3 className="text-lg font-black" style={{ color: theme.cssVars['--ct-heading'] }}>{theme.name}</h3>
              <p className="mt-2 text-sm leading-6" style={{ color: theme.cssVars['--ct-muted'] }}>{theme.description}</p>
              <span className="mt-3 inline-flex rounded-full border px-3 py-1 text-xs" style={{ background: theme.cssVars['--ct-surface-2'], borderColor: theme.cssVars['--ct-border'], color: theme.cssVars['--ct-text'] }}>
                {theme.mode === 'dark' ? 'پایه تیره' : 'پایه روشن'}
              </span>
            </button>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-[var(--ct-border)] bg-[var(--ct-surface)] p-5">
          <h2 className="text-lg font-black text-[var(--ct-heading)]">فونت سایت</h2>
          <p className="mt-1 text-sm text-[var(--ct-muted)]">فونت انتخابی روی سایت، پنل کاربری و پنل مدیریت اعمال می‌شود.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {carrtellFonts.map((font) => (
              <button
                key={font.id}
                type="button"
                onClick={() => update('fontId', font.id as CarrtellFontId)}
                className="rounded-2xl border px-4 py-3 text-right transition"
                style={{
                  fontFamily: font.cssFamily,
                  background: form.fontId === font.id ? 'color-mix(in srgb, var(--ct-primary) 14%, var(--ct-surface))' : 'var(--ct-surface-2)',
                  borderColor: form.fontId === font.id ? 'var(--ct-primary)' : 'var(--ct-border)',
                  color: 'var(--ct-text)'
                }}
              >
                <b>{font.name}</b><span className="mt-1 block text-sm text-[var(--ct-muted)]">نمونه متن فروشگاهی کارتل</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--ct-border)] bg-[var(--ct-surface)] p-5">
          <h2 className="text-lg font-black text-[var(--ct-heading)]">حالت نمایش</h2>
          <p className="mt-1 text-sm text-[var(--ct-muted)]">برای هماهنگی کامل، حالت «مطابق تم» پیشنهاد می‌شود.</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {(['system', 'light', 'dark'] as UserThemeMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => update('userMode', mode)}
                className="rounded-2xl border px-3 py-3 text-center text-sm font-bold"
                style={{
                  background: form.userMode === mode ? 'var(--ct-primary)' : 'var(--ct-surface-2)',
                  color: form.userMode === mode ? 'var(--ct-primary-text)' : 'var(--ct-text)',
                  borderColor: form.userMode === mode ? 'var(--ct-primary)' : 'var(--ct-border)'
                }}
              >
                {mode === 'system' ? 'مطابق تم' : mode === 'light' ? 'روشن' : 'تاریک'}
              </button>
            ))}
          </div>
        </div>
      </section>


      <section className="rounded-3xl border border-[var(--ct-border)] bg-[var(--ct-surface)] p-5">
        <h2 className="text-lg font-black text-[var(--ct-heading)]">تنظیمات رنگ هدر</h2>
        <p className="mt-1 text-sm text-[var(--ct-muted)]">با خالی‌گذاشتن هر رنگ، مقدار پیش‌فرض تم فعال استفاده می‌شود.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ['headerBackground', 'پس‌زمینه هدر', selectedPreset.cssVars['--ct-header']],
            ['headerTextColor', 'رنگ متن هدر', selectedPreset.cssVars['--ct-header-text']],
            ['headerButtonBackground', 'رنگ دکمه‌های هدر', selectedPreset.cssVars['--ct-header-2']],
            ['headerSearchBackground', 'رنگ نوار جستجو', selectedPreset.cssVars['--ct-input-bg']],
            ['headerBorderColor', 'رنگ خط هدر', selectedPreset.cssVars['--ct-border']]
          ].map(([key, label, fallback]) => {
            const value = (form as any)[key] || fallback;
            return (
              <label key={key} className="rounded-2xl border border-[var(--ct-border)] bg-[var(--ct-surface-2)] p-3">
                <span className="mb-2 block text-xs font-black text-[var(--ct-text)]">{label}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={value}
                    onChange={(event) => update(key as keyof AppearanceState, event.target.value as never)}
                    className="h-10 w-14 cursor-pointer rounded-lg border border-[var(--ct-border)] bg-transparent p-1"
                  />
                  <button
                    type="button"
                    onClick={() => update(key as keyof AppearanceState, '' as never)}
                    className="rounded-lg border border-[var(--ct-border)] px-2 py-2 text-[11px] font-bold text-[var(--ct-muted)]"
                  >
                    پیش‌فرض
                  </button>
                </div>
              </label>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--ct-border)] bg-[var(--ct-surface)] p-5">
        <h2 className="text-lg font-black text-[var(--ct-heading)]">پیش‌نمایش کنتراست و اجزا</h2>
        <p className="mt-1 text-sm text-[var(--ct-muted)]">کارت، متن، قیمت، دکمه، فیلد و وضعیت‌ها با تم فعال.</p>
        <div className="mt-4 rounded-3xl border p-5" style={{ background: selectedPreset.cssVars['--ct-bg'], color: selectedPreset.cssVars['--ct-text'], borderColor: selectedPreset.cssVars['--ct-border'] }}>
          <div className="rounded-2xl border p-4" style={{ background: selectedPreset.cssVars['--ct-surface'], borderColor: selectedPreset.cssVars['--ct-border'] }}>
            <div className="aspect-[4/1] rounded-2xl" style={{ background: `linear-gradient(135deg, ${selectedPreset.cssVars['--ct-surface-2']}, ${selectedPreset.cssVars['--ct-surface-3']})` }} />
            <h3 className="mt-4 text-xl font-black" style={{ color: selectedPreset.cssVars['--ct-heading'] }}>روغن موتور مناسب خودروی شما</h3>
            <p className="mt-2 text-sm" style={{ color: selectedPreset.cssVars['--ct-muted'] }}>متن کم‌رنگ و متن اصلی باید در تمام صفحات کاملاً خوانا باشند.</p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <b style={{ color: selectedPreset.cssVars['--ct-primary'] }}>۱,۲۵۰,۰۰۰ تومان</b>
              <button className="rounded-xl px-4 py-2 text-sm font-black" style={{ background: selectedPreset.cssVars['--ct-primary'], color: selectedPreset.cssVars['--ct-primary-text'] }}>افزودن به سبد</button>
            </div>
            <input className="mt-4 w-full rounded-xl border px-4 py-3 outline-none" placeholder="نمونه فیلد هماهنگ با تم" style={{ background: selectedPreset.cssVars['--ct-input-bg'], color: selectedPreset.cssVars['--ct-input-text'], borderColor: selectedPreset.cssVars['--ct-border'] }} />
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <span className="rounded-xl px-3 py-2 text-center text-sm font-bold" style={{ background: `${selectedPreset.cssVars['--ct-success']}20`, color: selectedPreset.cssVars['--ct-success'] }}>موفق</span>
              <span className="rounded-xl px-3 py-2 text-center text-sm font-bold" style={{ background: `${selectedPreset.cssVars['--ct-warning']}20`, color: selectedPreset.cssVars['--ct-warning'] }}>هشدار</span>
              <span className="rounded-xl px-3 py-2 text-center text-sm font-bold" style={{ background: `${selectedPreset.cssVars['--ct-danger']}20`, color: selectedPreset.cssVars['--ct-danger'] }}>خطا</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
