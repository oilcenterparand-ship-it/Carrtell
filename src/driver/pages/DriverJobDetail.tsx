import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarClock, CheckCircle2, Clock3, MapPin, Navigation, Phone, Wrench } from 'lucide-react';
import {
  DriverJob,
  completeDriverJob,
  driverStatusLabels,
  getDriverJobById,
  updateDriverJobStatus,
} from '../services/driverJobsApi';
import { formatMissionDate, formatMissionTime, getMissionTimingBadge } from '../utils/missionSchedule';

const serviceOptions = [
  'تعویض روغن موتور',
  'تعویض فیلتر روغن',
  'تعویض فیلتر هوا',
  'تعویض فیلتر کابین',
  'تعویض ضدیخ',
  'بازدید عمومی خودرو',
];

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
      setLoading(true);
      setError(null);
      const data = await getDriverJobById(id);
      setJob(data);
      setCurrentKm(data.final_km ? String(data.final_km) : data.current_km ? String(data.current_km) : '');
      setNextKm(data.next_service_km ? String(data.next_service_km) : '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت ماموریت');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [id]);
  const status = useMemo(() => String(job?.status || 'assigned'), [job?.status]);

  async function changeStatus(nextStatus: 'en_route' | 'arrived' | 'in_progress') {
    if (!id) return;
    try {
      setSaving(true);
      setError(null);
      setJob(await updateDriverJobStatus(id, nextStatus));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در تغییر وضعیت');
    } finally {
      setSaving(false);
    }
  }

  function toggleService(item: string) {
    setServices((list) => list.includes(item) ? list.filter((value) => value !== item) : [...list, item]);
  }

  async function complete() {
    if (!id) return;
    const current = Number(currentKm);
    const next = Number(nextKm);
    if (!current || current < 1) return setError('کیلومتر فعلی را وارد کن.');
    if (!next || next <= current) return setError('کیلومتر سرویس بعدی باید از کیلومتر فعلی بیشتر باشد.');
    if (!services.length) return setError('حداقل یک مورد انجام‌شده را انتخاب کن.');
    try {
      setSaving(true);
      setError(null);
      setJob(await completeDriverJob(id, {
        finalKm: current,
        nextServiceKm: next,
        usedProducts: services.map((item) => `${item} * 1`).join('\n'),
        notes,
        serviceType: services.join('، '),
        changedItems: services,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در پایان ماموریت');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Shell><Box>در حال دریافت ماموریت...</Box></Shell>;
  if (!job) return <Shell><ErrorBox text={error || 'ماموریت پیدا نشد.'} /></Shell>;

  return (
    <Shell>
      <div className="mb-3 flex items-center justify-between">
        <Link to="/driver/dashboard" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black">بازگشت</Link>
        <span className="rounded-full bg-amber-100 px-3 py-2 text-xs font-black text-amber-800">{driverStatusLabels[status] || status}</span>
      </div>

      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <MissionSchedule job={job} />
        <h1 className="mt-4 text-2xl font-black">{job.customer_name || 'مشتری'}</h1>
        <p className="mt-1 font-bold text-slate-500">{job.vehicle_title || job.car_name || 'خودرو ثبت نشده'}</p>
        <div className="mt-4 space-y-2">
          <Info icon={MapPin}>{job.address_text || 'آدرس ثبت نشده'}</Info>
          <Info icon={Phone}>{job.customer_phone || 'شماره ثبت نشده'}</Info>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <a href={mapUrl(job)} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-3 py-4 font-black text-white"><Navigation className="h-5 w-5" />مسیریابی</a>
          <a href={`tel:${job.customer_phone || ''}`} className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-3 py-4 font-black text-white"><Phone className="h-5 w-5" />تماس</a>
        </div>
      </section>

      {error && <ErrorBox text={error} />}

      <section className="mt-4 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        {status === 'completed' ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
            <h2 className="mt-3 text-xl font-black">ماموریت تکمیل شد</h2>
            <p className="mt-2 text-sm text-slate-500">ماموریت بعدی از صفحه اصلی تکنسین نمایش داده می‌شود.</p>
            <Link to="/driver/dashboard" className="mt-5 inline-flex rounded-2xl bg-amber-400 px-6 py-4 font-black text-slate-950">ماموریت بعدی</Link>
          </div>
        ) : status === 'assigned' || status === 'confirmed' ? (
          <Action title="برای حرکت آماده‌ای؟" button="شروع حرکت" onClick={() => changeStatus('en_route')} disabled={saving} />
        ) : status === 'en_route' ? (
          <Action title="به محل مشتری رسیدی؟" button="رسیدم به محل" onClick={() => changeStatus('arrived')} disabled={saving} />
        ) : status === 'arrived' ? (
          <Action title="خودرو آماده سرویس است؟" button="شروع سرویس" onClick={() => changeStatus('in_progress')} disabled={saving} />
        ) : (
          <div>
            <div className="mb-4 flex items-center gap-2"><Wrench className="h-6 w-6 text-amber-500" /><h2 className="text-xl font-black">ثبت پایان سرویس</h2></div>
            <label className="block text-sm font-black">کیلومتر فعلی</label>
            <input value={currentKm} onChange={(e) => setCurrentKm(e.target.value.replace(/\D/g, ''))} inputMode="numeric" className="mt-2 w-full rounded-2xl border-2 border-slate-200 px-4 py-4 text-lg font-black outline-none focus:border-amber-400" placeholder="مثلاً ۸۵۰۰۰" />

            <label className="mt-4 block text-sm font-black">کیلومتر سرویس بعدی</label>
            <input value={nextKm} onChange={(e) => setNextKm(e.target.value.replace(/\D/g, ''))} inputMode="numeric" className="mt-2 w-full rounded-2xl border-2 border-slate-200 px-4 py-4 text-lg font-black outline-none focus:border-amber-400" placeholder="به‌صورت دستی وارد شود" />

            <label className="mt-4 block text-sm font-black">چه کارهایی انجام شد؟</label>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {serviceOptions.map((item) => (
                <button key={item} type="button" onClick={() => toggleService(item)} className={`rounded-2xl border-2 p-3 text-right text-sm font-black ${services.includes(item) ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-slate-200 bg-white'}`}>{services.includes(item) ? '✓ ' : ''}{item}</button>
              ))}
            </div>

            <label className="mt-4 block text-sm font-black">توضیح کوتاه (اختیاری)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-2 w-full rounded-2xl border-2 border-slate-200 p-4 outline-none focus:border-amber-400" />

            <button disabled={saving} onClick={() => void complete()} className="mt-5 w-full rounded-2xl bg-emerald-600 px-5 py-5 text-lg font-black text-white disabled:opacity-50">{saving ? 'در حال ثبت...' : 'ثبت پایان سرویس'}</button>
          </div>
        )}
      </section>
    </Shell>
  );
}


function MissionSchedule({ job }: { job: DriverJob }) {
  const badge = getMissionTimingBadge(job);
  const badgeClass = badge.tone === 'danger'
    ? 'bg-red-600 text-white'
    : badge.tone === 'today'
      ? 'bg-emerald-600 text-white'
      : badge.tone === 'upcoming'
        ? 'bg-sky-100 text-sky-800'
        : 'bg-slate-200 text-slate-700';
  return <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4">
    <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-2 text-sm font-black text-amber-900"><CalendarClock className="h-5 w-5" />زمان دریافت خدمات</span><span className={`rounded-full px-3 py-1 text-xs font-black ${badgeClass}`}>{badge.label}</span></div>
    <div className="mt-3 text-lg font-black">{formatMissionDate(job)}</div>
    <div className="mt-1 flex items-center gap-2 font-black text-amber-800"><Clock3 className="h-5 w-5" />ساعت {formatMissionTime(job)}</div>
  </div>;
}
function Shell({ children }: { children: React.ReactNode }) { return <main className="min-h-screen bg-slate-100 px-3 py-4 text-slate-900" dir="rtl"><div className="mx-auto max-w-xl">{children}</div></main>; }
function Box({ children }: { children: React.ReactNode }) { return <div className="rounded-3xl bg-white p-6 text-center shadow-sm">{children}</div>; }
function ErrorBox({ text }: { text: string }) { return <div className="my-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-black text-red-700">{text}</div>; }
function Info({ icon: Icon, children }: { icon: typeof MapPin; children: React.ReactNode }) { return <div className="flex items-start gap-2 rounded-2xl bg-slate-50 p-3 text-sm"><Icon className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" /><span>{children}</span></div>; }
function Action({ title, button, onClick, disabled }: { title: string; button: string; onClick: () => void; disabled: boolean }) { return <div className="py-4 text-center"><h2 className="text-xl font-black">{title}</h2><button disabled={disabled} onClick={onClick} className="mt-5 w-full rounded-2xl bg-amber-400 px-5 py-5 text-xl font-black text-slate-950 disabled:opacity-50">{button}</button></div>; }
function mapUrl(job: DriverJob) { return job.latitude && job.longitude ? `https://www.google.com/maps/dir/?api=1&destination=${job.latitude},${job.longitude}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address_text || '')}`; }
