import { useMemo } from 'react';

const latinDigits = (value: string) => value.replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit))).replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
const pad = (value: number) => String(value).padStart(2, '0');

function jalaliParts(date: Date) {
  const parts = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', { year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value || 0);
  return { year: get('year'), month: get('month'), day: get('day') };
}

function toJalaliLocal(value?: string | null) {
  if (!value) return { date: '', time: '' };
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return { date: '', time: '' };
  const j = jalaliParts(parsed);
  return { date: `${j.year}/${pad(j.month)}/${pad(j.day)}`, time: `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}` };
}

function fromJalaliLocal(dateValue: string, timeValue: string) {
  const normalized = latinDigits(dateValue).trim().replace(/-/g, '/');
  const match = normalized.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (!match) return null;
  const target = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  const approximateYear = target.year + 621;
  for (let offset = -35; offset <= 400; offset += 1) {
    const candidate = new Date(approximateYear, 2, 1 + offset, 12, 0, 0, 0);
    const j = jalaliParts(candidate);
    if (j.year === target.year && j.month === target.month && j.day === target.day) {
      const [hour, minute] = latinDigits(timeValue || '00:00').split(':').map(Number);
      candidate.setHours(hour || 0, minute || 0, 0, 0);
      return candidate.toISOString();
    }
  }
  return null;
}

export default function JalaliDateTimeInput({ value, onChange, label, help }: { value?: string | null; onChange: (value: string) => void; label: string; help: string }) {
  const current = useMemo(() => toJalaliLocal(value), [value]);
  function update(date: string, time: string) {
    if (!date) return onChange('');
    const iso = fromJalaliLocal(date, time);
    if (iso) onChange(iso);
  }
  return (
    <label className="block">
      <span className="text-xs font-black text-slate-200">{label}</span>
      <small className="mt-1 block text-[11px] leading-5 text-slate-500">{help}</small>
      <div className="mt-2 grid grid-cols-[1fr_105px] gap-2">
        <input dir="ltr" inputMode="numeric" placeholder="۱۴۰۵/۰۶/۰۷" defaultValue={current.date} onBlur={(event) => update(event.target.value, current.time || '00:00')} className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-3 text-center text-sm text-white outline-none focus:border-amber-400" />
        <input dir="ltr" type="time" value={current.time} onChange={(event) => update(current.date, event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-2 py-3 text-sm text-white outline-none focus:border-amber-400" />
      </div>
    </label>
  );
}
