import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, MapPin, RefreshCw, Route, UserRoundCheck, Wrench } from 'lucide-react';
import { dispatchStatusLabels, getDispatchRequests, type DispatchStatus } from '../services/dispatchApi';

type Row = Record<string, any>;

type Lane = {
  key: string;
  title: string;
  subtitle: string;
  statuses: DispatchStatus[];
};

const lanes: Lane[] = [
  { key: 'assigned', title: 'منتظر قبول', subtitle: 'ماموریت برای سرویس‌کار ارسال شده', statuses: ['assigned'] },
  { key: 'accepted', title: 'قبول شده', subtitle: 'سرویس‌کار ماموریت را پذیرفته', statuses: ['accepted'] },
  { key: 'en_route', title: 'در مسیر', subtitle: 'حرکت به سمت مشتری شروع شده', statuses: ['en_route'] },
  { key: 'arrived', title: 'رسیده', subtitle: 'سرویس‌کار به محل رسیده', statuses: ['arrived'] },
  { key: 'in_progress', title: 'در حال سرویس', subtitle: 'عملیات روی خودرو در حال انجام است', statuses: ['in_progress'] },
  { key: 'completed', title: 'تکمیل شده', subtitle: 'ماموریت با گزارش نهایی بسته شده', statuses: ['completed'] },
];

export default function ServiceOperationsBoard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true); setError('');
    try { setRows(await getDispatchRequests('all')); }
    catch (err: any) { setError(err?.message || 'دریافت وضعیت ماموریت‌ها انجام نشد.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  const activeCount = useMemo(() => rows.filter((row) => ['assigned','accepted','en_route','arrived','in_progress'].includes(String(row.status))).length, [rows]);
  const completedToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return rows.filter((row) => row.status === 'completed' && String(row.completed_at || row.updated_at || '').slice(0, 10) === today).length;
  }, [rows]);

  return <div className="space-y-5" dir="rtl">
    <section className="rounded-[28px] border border-slate-800 bg-gradient-to-l from-sky-950/40 via-slate-900 to-slate-950 p-5 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-black text-sky-300"><Route className="h-4 w-4" /> مرکز کنترل ماموریت‌ها</div>
          <h1 className="mt-2 text-2xl font-black text-white">هر سرویس الان دقیقاً کجاست؟</h1>
          <p className="mt-2 text-sm leading-7 text-slate-400">این صفحه فقط برای مشاهده روند اجراست. تخصیص سفارش‌های پرداخت‌شده از «صف تخصیص» انجام می‌شود.</p>
        </div>
        <button onClick={() => void load()} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm font-black text-slate-200"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> بروزرسانی</button>
      </div>
    </section>

    <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Kpi icon={<Wrench />} label="ماموریت فعال" value={activeCount} />
      <Kpi icon={<UserRoundCheck />} label="منتظر قبول" value={rows.filter((r) => r.status === 'assigned').length} />
      <Kpi icon={<Route />} label="در مسیر / سرویس" value={rows.filter((r) => ['en_route','arrived','in_progress'].includes(r.status)).length} />
      <Kpi icon={<CheckCircle2 />} label="تکمیل امروز" value={completedToday} />
    </section>

    {error && <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm font-bold text-rose-200">{error}</div>}

    <div className="grid items-start gap-4 xl:grid-cols-3 2xl:grid-cols-6">
      {lanes.map((lane) => {
        const items = rows.filter((row) => lane.statuses.includes(row.status));
        return <section key={lane.key} className="overflow-hidden rounded-[26px] border border-slate-800 bg-slate-900/75">
          <header className="border-b border-slate-800 bg-slate-950/55 p-4">
            <div className="flex items-center justify-between gap-2"><h2 className="font-black text-white">{lane.title}</h2><span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-black text-slate-300">{items.length.toLocaleString('fa-IR')}</span></div>
            <p className="mt-1 text-[11px] leading-5 text-slate-500">{lane.subtitle}</p>
          </header>
          <div className="space-y-2 p-2">
            {items.map((row) => <article key={row.id} className="rounded-2xl border border-slate-800 bg-slate-950/65 p-3">
              <div className="flex items-start justify-between gap-2"><div className="min-w-0"><b className="block truncate text-sm text-white">{row.customer_name || 'مشتری'}</b><span className="mt-1 block truncate text-[11px] text-slate-500">{row.vehicle_title || row.car_name || 'خودرو ثبت نشده'}</span></div><span className="rounded-full bg-amber-400/10 px-2 py-1 text-[10px] font-black text-amber-200">{dispatchStatusLabels[row.status as DispatchStatus] || row.status}</span></div>
              <div className="mt-3 space-y-1.5 text-[11px] text-slate-400"><Line icon={<UserRoundCheck className="h-3.5 w-3.5" />} text={row.assigned_driver_name || 'سرویس‌کار نامشخص'} /><Line icon={<Clock3 className="h-3.5 w-3.5" />} text={`${row.preferred_date || '-'} · ${row.preferred_time || '-'}`} /><Line icon={<MapPin className="h-3.5 w-3.5" />} text={row.address_text || 'آدرس ثبت نشده'} /></div>
            </article>)}
            {!items.length && !loading && <div className="rounded-2xl border border-dashed border-slate-800 p-5 text-center text-[11px] text-slate-600">موردی در این مرحله نیست.</div>}
          </div>
        </section>;
      })}
    </div>
  </div>;
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) { return <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-4"><div className="flex items-center justify-between text-slate-500"><span className="text-xs font-bold">{label}</span><span className="text-amber-300">{icon}</span></div><b className="mt-3 block text-2xl text-white">{value.toLocaleString('fa-IR')}</b></div>; }
function Line({ icon, text }: { icon: React.ReactNode; text: string }) { return <div className="flex min-w-0 items-start gap-1.5"><span className="mt-0.5 shrink-0 text-amber-300">{icon}</span><span className="line-clamp-2">{text}</span></div>; }
