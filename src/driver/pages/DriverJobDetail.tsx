import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowRight, CalendarClock, Check, CheckCircle2, Clock3, MapPin, Navigation,
  Phone, Route, Save, Wrench,
} from 'lucide-react';
import {
  DriverJob,
  completeDriverJob,
  driverStatusLabels,
  getDriverActionLabel,
  getDriverJobById,
  getNextDriverAction,
  updateDriverJobStatus,
} from '../services/driverJobsApi';
import { formatMissionDate, formatMissionTime } from '../utils/missionSchedule';
import { hasCoordinates, openNeshanNavigation } from '../utils/neshanNavigation';

const serviceOptions = ['تعویض روغن موتور', 'تعویض فیلتر روغن', 'تعویض فیلتر هوا', 'تعویض فیلتر کابین', 'تعویض ضدیخ', 'بازدید عمومی خودرو'];

export default function DriverJobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState<DriverJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentKm, setCurrentKm] = useState('');
  const [nextKm, setNextKm] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  async function load() {
    if (!id) return;
    try {
      setLoading(true); setError(null);
      const data = await getDriverJobById(id);
      setJob(data);
      setCurrentKm(data.final_km ? String(data.final_km) : data.current_km ? String(data.current_km) : '');
      setNextKm(data.next_service_km ? String(data.next_service_km) : '');
      setNotes(data.driver_notes || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت ماموریت');
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [id]);
  const nextStatus = useMemo(() => getNextDriverAction(job?.status), [job?.status]);
  const completed = String(job?.status) === 'completed';
  const canComplete = ['in_progress', 'working', 'in_service'].includes(String(job?.status));

  async function advance() {
    if (!id || !nextStatus) return;
    try {
      setSaving(true); setError(null);
      const updated = await updateDriverJobStatus(id, nextStatus);
      setJob(updated);
      if (nextStatus === 'en_route') {
        if (hasCoordinates(updated.latitude, updated.longitude)) {
          await openNeshanNavigation({ latitude: updated.latitude!, longitude: updated.longitude! });
        } else {
          setError('حرکت ثبت شد، اما مختصات مشتری ثبت نشده است. آدرس را از مدیر دریافت کن.');
        }
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'تغییر وضعیت انجام نشد.'); }
    finally { setSaving(false); }
  }

  function toggleService(item: string) {
    setServices((list) => list.includes(item) ? list.filter((value) => value !== item) : [...list, item]);
  }

  async function complete(event: FormEvent) {
    event.preventDefault();
    if (!id) return;
    const current = Number(currentKm);
    const next = Number(nextKm);
    if (!current || current < 1) return setError('کیلومتر فعلی را وارد کن.');
    if (!next || next <= current) return setError('کیلومتر سرویس بعدی باید بیشتر از کیلومتر فعلی باشد.');
    if (!services.length) return setError('حداقل یک عملیات انجام‌شده را انتخاب کن.');
    try {
      setSaving(true); setError(null);
      const updated = await completeDriverJob(id, {
        finalKm: current,
        nextServiceKm: next,
        usedProducts: services.map((item) => `${item} * 1`).join('\n'),
        changedItems: services,
        serviceType: services.join('، '),
        notes,
      });
      setJob(updated);
    } catch (err) { setError(err instanceof Error ? err.message : 'ثبت پایان سرویس انجام نشد.'); }
    finally { setSaving(false); }
  }

  if (loading) return <Shell><div className="grid min-h-[70dvh] place-items-center text-sm text-slate-400">در حال دریافت ماموریت...</div></Shell>;
  if (!job) return <Shell><ErrorBox text={error || 'ماموریت پیدا نشد.'} /></Shell>;

  return (
    <Shell>
      <header className="sticky top-0 z-30 -mx-4 border-b border-white/5 bg-[#0b1628]/95 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <Link to="/driver/dashboard" className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.05]"><ArrowRight className="h-5 w-5" /></Link>
          <div className="min-w-0 text-center"><div className="text-xs font-bold text-slate-500">ماموریت</div><div className="truncate font-black">{job.customer_name || 'مشتری'}</div></div>
          <span className="rounded-full bg-amber-400/15 px-3 py-1.5 text-xs font-black text-amber-200">{driverStatusLabels[String(job.status)] || 'جدید'}</span>
        </div>
      </header>

      <div className="space-y-4 py-4 pb-28">
        {error && <ErrorBox text={error} />}

        <section className="rounded-[30px] border border-amber-400/20 bg-gradient-to-b from-amber-400/10 to-white/[0.03] p-4">
          <div className="flex items-center justify-between gap-3">
            <div><div className="text-xs font-bold text-amber-300">مشتری</div><h1 className="mt-1 text-2xl font-black">{job.customer_name || 'مشتری'}</h1><p className="mt-1 text-sm font-bold text-slate-400">{job.vehicle_title || job.car_name || 'خودرو ثبت نشده'}</p></div>
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-400 text-slate-950"><Wrench className="h-7 w-7" /></div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <QuickLink href={job.customer_phone ? `tel:${job.customer_phone}` : undefined} icon={<Phone className="h-4 w-4" />} text="تماس با مشتری" />
            <button type="button" disabled={!hasCoordinates(job.latitude, job.longitude)} onClick={() => hasCoordinates(job.latitude, job.longitude) && void openNeshanNavigation({ latitude: job.latitude!, longitude: job.longitude! })} className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-sm font-black disabled:cursor-not-allowed disabled:opacity-40"><Navigation className="h-4 w-4 text-sky-300" /> مسیریابی با نشان</button>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-2">
          <MiniInfo icon={<CalendarClock className="h-4 w-4" />} label="تاریخ مراجعه" value={formatMissionDate(job)} />
          <MiniInfo icon={<Clock3 className="h-4 w-4" />} label="ساعت" value={formatMissionTime(job)} />
        </section>

        <section className="rounded-3xl border border-white/5 bg-white/[0.035] p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-black"><MapPin className="h-5 w-5 text-amber-300" /> آدرس مشتری</div>
          <p className="text-sm leading-7 text-slate-300">{job.address_text || 'آدرس ثبت نشده'}</p>
        </section>

        {!completed && <section className="rounded-3xl border border-amber-400/15 bg-amber-400/[0.06] p-4"><div className="text-[11px] font-black text-amber-300">اقدام بعدی</div><div className="mt-1 text-base font-black text-white">{getDriverActionLabel(job.status)}</div><p className="mt-1 text-xs leading-6 text-slate-500">فقط همین مرحله را انجام بده؛ بعد از ثبت، دکمه بعدی خودکار جایگزین می‌شود.</p></section>}

        {canComplete && !completed && (
          <form onSubmit={complete} className="space-y-4 rounded-3xl border border-white/5 bg-white/[0.035] p-4">
            <div><h2 className="font-black">ثبت گزارش سرویس</h2><p className="mt-1 text-xs leading-6 text-slate-500">فقط مواردی که واقعاً انجام شده ثبت کن.</p></div>
            <div className="grid grid-cols-2 gap-2">
              {serviceOptions.map((item) => {
                const active = services.includes(item);
                return <button type="button" key={item} onClick={() => toggleService(item)} className={`flex min-h-16 items-center justify-between gap-2 rounded-2xl border p-3 text-right text-sm font-bold ${active ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100' : 'border-white/10 bg-black/15 text-slate-300'}`}><span>{item}</span>{active && <Check className="h-4 w-4 shrink-0" />}</button>;
              })}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="کیلومتر فعلی" value={currentKm} onChange={setCurrentKm} />
              <Field label="سرویس بعدی" value={nextKm} onChange={setNextKm} />
            </div>
            <label className="block"><span className="mb-2 block text-xs font-bold text-slate-400">توضیحات سرویس‌کار</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-amber-400/50" placeholder="وضعیت خودرو، نشتی، پیشنهاد بعدی و..." /></label>
            <button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-4 text-base font-black text-slate-950 disabled:opacity-50"><Save className="h-5 w-5" /> {saving ? 'در حال ثبت...' : 'پایان سرویس و ثبت گزارش'}</button>
          </form>
        )}

        {completed && <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5 text-center"><CheckCircle2 className="mx-auto h-10 w-10 text-emerald-300" /><h2 className="mt-3 font-black text-emerald-100">ماموریت تکمیل شد</h2><p className="mt-2 text-xs leading-6 text-emerald-200/70">گزارش سرویس ثبت شده و این ماموریت وارد سوابق شما شده است.</p></div>}
      </div>

      {!completed && nextStatus && (
        <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-[520px] -translate-x-1/2 border-t border-white/10 bg-[#091423]/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
          <div className="mb-2 flex items-center justify-center gap-2 text-[11px] font-black text-slate-500"><span className="h-2 w-2 rounded-full bg-amber-300" /> فقط دکمه مرحله فعلی فعال است</div><button disabled={saving} onClick={() => void advance()} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-200/40 bg-amber-400 px-5 py-4 text-lg font-black text-slate-950 shadow-[0_10px_30px_rgba(251,191,36,.22)] transition active:scale-[.98] disabled:opacity-50"><Route className="h-5 w-5" />{saving ? 'در حال ثبت...' : getDriverActionLabel(job.status)}</button>
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) { return <main className="min-h-[100dvh] bg-[#07111f] text-white" dir="rtl"><div className="mx-auto min-h-[100dvh] w-full max-w-[520px] bg-[#0b1628] px-4 shadow-2xl shadow-black/40 sm:border-x sm:border-white/5">{children}</div></main>; }
function ErrorBox({ text }: { text: string }) { return <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-bold text-red-100">{text}</div>; }
function QuickLink({ href, icon, text, external }: { href?: string; icon: React.ReactNode; text: string; external?: boolean }) { return <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} className={`flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-sm font-black ${href ? '' : 'pointer-events-none opacity-40'}`}>{icon}{text}</a>; }
function MiniInfo({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="rounded-2xl border border-white/5 bg-white/[0.035] p-3"><div className="flex items-center gap-1.5 text-xs text-slate-500">{icon}{label}</div><div className="mt-2 text-sm font-black">{value}</div></div>; }
function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block"><span className="mb-2 block text-xs font-bold text-slate-400">{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} inputMode="numeric" className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-amber-400/50" placeholder="مثلاً ۸۵۰۰۰" /></label>; }
