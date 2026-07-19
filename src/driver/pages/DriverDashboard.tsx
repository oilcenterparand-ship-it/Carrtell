import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, ChevronLeft, Clock3, MapPin, Phone, RefreshCw, Route, Wrench } from 'lucide-react';
import { DriverJob, driverStatusLabels, getDriverJobs } from '../services/driverJobsApi';
import {
  formatMissionDate,
  formatMissionTime,
  getMissionTimestamp,
  getMissionTimingBadge,
} from '../utils/missionSchedule';

const activeStatuses = ['assigned', 'en_route', 'on_way', 'dispatched', 'arrived', 'in_progress', 'working', 'in_service'];

export default function DriverDashboard() {
  const [jobs, setJobs] = useState<DriverJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      setJobs(await getDriverJobs());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت مأموریت‌ها');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const activeJobs = useMemo(
    () => jobs
      .filter((job) => activeStatuses.includes(String(job.status)))
      .sort((a, b) => {
        const byDate = getMissionTimestamp(a) - getMissionTimestamp(b);
        if (byDate !== 0) return byDate;
        return Number(a.queue_position || 0) - Number(b.queue_position || 0);
      }),
    [jobs],
  );
  const nextJob = activeJobs[0];

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900" dir="rtl">
      <section className="mx-auto max-w-xl px-3 py-4 sm:px-4">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black text-amber-600">پنل ساده تکنسین Carrtell</p>
            <h1 className="mt-1 text-xl font-black">ماموریت‌های من</h1>
          </div>
          <button onClick={() => void load()} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm" aria-label="بروزرسانی">
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </header>

        {error && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}

        <section className="mb-4 rounded-[28px] border-2 border-amber-300 bg-white p-4 shadow-lg shadow-amber-100">
          <div className="mb-3 flex items-center justify-between">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">ماموریت بعدی</span>
            {nextJob?.queue_position ? <span className="text-xs font-bold text-slate-500">شماره {Number(nextJob.queue_position).toLocaleString('fa-IR')}</span> : null}
          </div>

          {loading ? (
            <div className="py-10 text-center text-sm text-slate-500">در حال دریافت ماموریت...</div>
          ) : nextJob ? (
            <>
              <MissionTimeCard job={nextJob} />
              <h2 className="mt-4 text-2xl font-black">{nextJob.customer_name || 'مشتری'}</h2>
              <p className="mt-1 font-bold text-slate-500">{nextJob.vehicle_title || nextJob.car_name || 'خودرو ثبت نشده'}</p>
              <div className="mt-4 space-y-2 text-sm">
                <Info icon={MapPin} text={nextJob.address_text || 'آدرس ثبت نشده'} />
                <Info icon={Phone} text={nextJob.customer_phone || 'شماره ثبت نشده'} />
                <Info icon={Route} text={driverStatusLabels[String(nextJob.status)] || 'آماده شروع'} />
              </div>
              <Link to={`/driver/jobs/${nextJob.id}`} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 py-4 text-lg font-black text-slate-950 shadow-lg shadow-amber-200">
                باز کردن ماموریت
                <ChevronLeft className="h-6 w-6" />
              </Link>
            </>
          ) : (
            <div className="py-10 text-center">
              <Wrench className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 font-bold text-slate-500">فعلاً ماموریتی برای شما ثبت نشده است.</p>
            </div>
          )}
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-black">ماموریت‌های بعدی</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{activeJobs.length.toLocaleString('fa-IR')}</span>
          </div>
          <div className="space-y-2">
            {activeJobs.slice(1).map((job, index) => (
              <div key={job.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-black">{job.customer_name || 'مشتری'}</div>
                    <div className="mt-1 flex items-center gap-1 text-xs font-bold text-amber-700"><CalendarClock className="h-4 w-4" />{formatMissionDate(job)}</div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-slate-600"><Clock3 className="h-4 w-4" />ساعت {formatMissionTime(job)}</div>
                    <div className="mt-1 truncate text-xs text-slate-500">{job.address_text || job.vehicle_title || 'بدون آدرس'}</div>
                  </div>
                  <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">{Number(job.queue_position || index + 2).toLocaleString('fa-IR')}</span>
                </div>
              </div>
            ))}
            {!loading && activeJobs.length <= 1 && <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-500">ماموریت دیگری در صف نیست.</div>}
          </div>
        </section>
      </section>
    </main>
  );
}

function MissionTimeCard({ job }: { job: DriverJob }) {
  const badge = getMissionTimingBadge(job);
  const badgeClass = badge.tone === 'danger'
    ? 'bg-red-600 text-white'
    : badge.tone === 'today'
      ? 'bg-emerald-600 text-white'
      : badge.tone === 'upcoming'
        ? 'bg-sky-100 text-sky-800'
        : 'bg-slate-200 text-slate-700';

  return (
    <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-black text-amber-900"><CalendarClock className="h-5 w-5" />زمان دریافت خدمات</div>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${badgeClass}`}>{badge.label}</span>
      </div>
      <div className="mt-3 text-lg font-black text-slate-900">{formatMissionDate(job)}</div>
      <div className="mt-1 flex items-center gap-2 text-base font-black text-amber-800"><Clock3 className="h-5 w-5" />ساعت {formatMissionTime(job)}</div>
    </div>
  );
}

function Info({ icon: Icon, text }: { icon: typeof MapPin; text: string }) {
  return <div className="flex items-start gap-2 rounded-2xl bg-slate-50 p-3 text-slate-700"><Icon className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" /><span>{text}</span></div>;
}
