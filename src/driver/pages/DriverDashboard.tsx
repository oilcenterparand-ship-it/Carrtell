import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell, CalendarClock, CheckCircle2, ChevronLeft, Clock3, History,
  Home, LogOut, MapPin, Navigation, Phone, RefreshCw, Route, UserRound, Wrench,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import { DriverJob, driverStatusLabels, getDriverJobs } from '../services/driverJobsApi';
import { getMyTomorrowAvailability, setMyTomorrowAvailability, tomorrowPersianLabel, type TechnicianAvailability } from '../services/technicianAvailabilityApi';
import { formatMissionDate, formatMissionTime, getMissionTimestamp, getMissionTimingBadge } from '../utils/missionSchedule';
import DriverNotificationSetup, { showDriverNotification } from '../components/DriverNotificationSetup';
import PwaInstallButton from '../../components/PwaInstallButton';

const activeStatuses = ['assigned', 'accepted', 'en_route', 'on_way', 'dispatched', 'arrived', 'in_progress', 'working', 'in_service'];

export default function DriverDashboard() {
  const [jobs, setJobs] = useState<DriverJob[]>([]);
  const [tab, setTab] = useState<'today' | 'history' | 'account'>('today');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<TechnicianAvailability | null>(null);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [availabilitySaving, setAvailabilitySaving] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('18:00');
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const nextJobs = await getDriverJobs();
      setJobs(nextJobs);
      const assigned = nextJobs.filter((job) => String(job.status) === 'assigned');
      const seen = new Set<string>(JSON.parse(localStorage.getItem('carrtell:driver-seen-assigned') || '[]'));
      const fresh = assigned.find((job) => !seen.has(String(job.id)));
      if (fresh) {
        await showDriverNotification('ماموریت جدید Carrtell', `${fresh.customer_name || 'مشتری'} · ${fresh.vehicle_title || fresh.car_name || 'خودرو'}`, `/driver/jobs/${fresh.id}`).catch(() => false);
        assigned.forEach((job) => seen.add(String(job.id)));
        localStorage.setItem('carrtell:driver-seen-assigned', JSON.stringify(Array.from(seen).slice(-100)));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت مأموریت‌ها');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    void getMyTomorrowAvailability().then((row) => {
      setAvailability(row);
      if (row) {
        setStartTime(row.start_time.slice(0, 5));
        setEndTime(row.end_time.slice(0, 5));
      }
    }).catch(() => undefined);
  }, []);

  async function saveTomorrowAvailability() {
    setAvailabilityMessage('');
    if (endTime <= startTime) {
      setAvailabilityMessage('ساعت پایان باید بعد از ساعت شروع باشد.');
      return;
    }
    try {
      setAvailabilitySaving(true);
      const row = await setMyTomorrowAvailability(startTime, endTime);
      setAvailability(row);
      setAvailabilityOpen(false);
      setAvailabilityMessage(`آمادگی شما برای ${tomorrowPersianLabel()} از ${startTime} تا ${endTime} ثبت شد.`);
    } catch (err) {
      setAvailabilityMessage(err instanceof Error ? err.message : 'ثبت ساعت آزاد انجام نشد.');
    } finally {
      setAvailabilitySaving(false);
    }
  }

  const activeJobs = useMemo(() => jobs
    .filter((job) => activeStatuses.includes(String(job.status)))
    .sort((a, b) => {
      const byDate = getMissionTimestamp(a) - getMissionTimestamp(b);
      if (byDate !== 0) return byDate;
      return Number(a.queue_position || 0) - Number(b.queue_position || 0);
    }), [jobs]);

  const completedJobs = useMemo(() => jobs
    .filter((job) => String(job.status) === 'completed')
    .sort((a, b) => getMissionTimestamp(b) - getMissionTimestamp(a)), [jobs]);

  const nextJob = activeJobs[0];

  async function logout() {
    await signOut();
    navigate('/driver/login', { replace: true });
  }

  return (
    <main className="min-h-[100dvh] bg-[#07111f] text-white" dir="rtl">
      <div className="mx-auto min-h-[100dvh] w-full max-w-[520px] bg-[#0b1628] pb-24 shadow-2xl shadow-black/40 sm:border-x sm:border-white/5">
        <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0b1628]/95 px-4 pb-3 pt-[max(14px,env(safe-area-inset-top))] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-black text-amber-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.8)]" />
                آماده دریافت مأموریت
              </div>
              <h1 className="mt-1 truncate text-xl font-black">سلام {user?.fullName || 'سرویس‌کار'}</h1>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => void load()} className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.05]" aria-label="بروزرسانی">
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={() => void logout()} className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.05] text-slate-300" aria-label="خروج">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        <section className="space-y-4 px-4 py-4">
          <div className="grid grid-cols-3 gap-2">
            <Stat value={activeJobs.length} label="فعال" icon={<Wrench className="h-4 w-4" />} />
            <Stat value={activeJobs.filter((j) => ['accepted', 'en_route', 'arrived', 'in_progress'].includes(String(j.status))).length} label="در جریان" icon={<Route className="h-4 w-4" />} />
            <Stat value={completedJobs.length} label="تکمیل" icon={<CheckCircle2 className="h-4 w-4" />} />
          </div>

          <section className="overflow-hidden rounded-3xl border border-emerald-400/25 bg-gradient-to-l from-emerald-950/40 to-white/[0.035]">
            <div className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="text-sm font-black text-emerald-300">برنامه فردا · {tomorrowPersianLabel()}</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">ساعت آزاد را ثبت کن؛ سیستم حداکثر ۵ مأموریت بدون تداخل برایت می‌فرستد.</p>
                {availability ? <p className="mt-2 text-xs font-black text-white">ثبت‌شده: {availability.start_time.slice(0, 5)} تا {availability.end_time.slice(0, 5)}</p> : null}
              </div>
              <button type="button" onClick={() => setAvailabilityOpen((value) => !value)} className="shrink-0 rounded-2xl bg-emerald-400 px-3 py-3 text-xs font-black text-slate-950">
                برای فردا آمادگی دارم
              </button>
            </div>
            {availabilityOpen ? (
              <div className="grid grid-cols-2 gap-2 border-t border-white/10 p-4">
                <label className="grid gap-1 text-xs text-slate-300"><span>از ساعت</span><input aria-label="از ساعت" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="min-w-0 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" /></label>
                <label className="grid gap-1 text-xs text-slate-300"><span>تا ساعت</span><input aria-label="تا ساعت" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className="min-w-0 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white" /></label>
                <button type="button" disabled={availabilitySaving} onClick={() => void saveTomorrowAvailability()} className="col-span-2 rounded-xl bg-amber-400 px-4 py-2.5 font-black text-slate-950 disabled:opacity-50">{availabilitySaving ? 'در حال ثبت...' : 'ثبت ساعت آزاد'}</button>
              </div>
            ) : null}
            {availabilityMessage ? <p className="border-t border-white/10 px-4 py-3 text-xs font-bold text-amber-200">{availabilityMessage}</p> : null}
          </section>

          {error && <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-bold text-red-100">{error}</div>}

          <div className="grid grid-cols-2 rounded-2xl bg-black/20 p-1">
            <button onClick={() => setTab('today')} className={`rounded-xl px-3 py-2.5 text-sm font-black transition ${tab === 'today' ? 'bg-amber-400 text-slate-950' : 'text-slate-400'}`}>ماموریت‌های من</button>
            <button onClick={() => setTab('history')} className={`rounded-xl px-3 py-2.5 text-sm font-black transition ${tab === 'history' ? 'bg-amber-400 text-slate-950' : 'text-slate-400'}`}>سوابق</button>
          </div>

          {tab === 'today' ? (
            <>
              <section className="overflow-hidden rounded-[30px] border border-amber-400/25 bg-gradient-to-b from-amber-400/10 to-white/[0.035] shadow-xl shadow-black/20">
                <div className="flex items-center justify-between px-4 pt-4">
                  <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-slate-950">ماموریت بعدی</span>
                  {nextJob?.queue_position ? <span className="text-xs font-bold text-slate-400">اولویت {Number(nextJob.queue_position).toLocaleString('fa-IR')}</span> : null}
                </div>
                {loading ? (
                  <div className="py-12 text-center text-sm text-slate-400">در حال دریافت ماموریت...</div>
                ) : nextJob ? (
                  <div className="p-4">
                    <MissionTimeCard job={nextJob} />
                    <div className="mt-4 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-2xl font-black">{nextJob.customer_name || 'مشتری'}</h2>
                        <p className="mt-1 truncate text-sm font-bold text-slate-400">{nextJob.vehicle_title || nextJob.car_name || 'خودرو ثبت نشده'}</p>
                      </div>
                      <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black text-amber-200">{driverStatusLabels[String(nextJob.status)] || 'آماده'}</span>
                    </div>
                    <div className="mt-4 space-y-2">
                      <Info icon={MapPin} text={nextJob.address_text || 'آدرس ثبت نشده'} />
                      <WarehouseItems job={nextJob} />
                      <div className="grid grid-cols-2 gap-2">
                        <a href={nextJob.customer_phone ? `tel:${nextJob.customer_phone}` : undefined} className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-sm font-black"><Phone className="h-4 w-4 text-emerald-300" /> تماس</a>
                        <a href={nextJob.latitude && nextJob.longitude ? `https://www.google.com/maps/dir/?api=1&destination=${nextJob.latitude},${nextJob.longitude}` : undefined} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-sm font-black"><Navigation className="h-4 w-4 text-sky-300" /> مسیریابی</a>
                      </div>
                    </div>
                    <Link to={`/driver/jobs/${nextJob.id}`} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 py-4 text-lg font-black text-slate-950 active:scale-[.99]">
                      باز کردن ماموریت <ChevronLeft className="h-6 w-6" />
                    </Link>
                  </div>
                ) : (
                  <div className="px-5 py-12 text-center">
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-white/[0.05]"><Bell className="h-7 w-7 text-slate-500" /></div>
                    <p className="mt-4 font-black">فعلاً ماموریت جدیدی ندارید</p>
                    <p className="mt-2 text-xs leading-6 text-slate-500">بعد از تخصیص توسط مدیر، ماموریت همین‌جا نمایش داده می‌شود.</p>
                  </div>
                )}
              </section>

              {activeJobs.length > 1 && (
                <section>
                  <div className="mb-3 flex items-center justify-between"><h2 className="font-black">در صف بعدی</h2><span className="text-xs text-slate-500">{(activeJobs.length - 1).toLocaleString('fa-IR')} ماموریت</span></div>
                  <div className="space-y-2">{activeJobs.slice(1).map((job) => <CompactJob key={job.id} job={job} />)}</div>
                </section>
              )}
            </>
          ) : tab === 'history' ? (
            <section className="space-y-3">
              {completedJobs.map((job) => <HistoryJob key={job.id} job={job} />)}
              {!loading && !completedJobs.length && <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">هنوز سرویس تکمیل‌شده‌ای ثبت نشده است.</div>}
            </section>
          ) : (
            <section className="space-y-3">
              <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.055] p-4">
                <div className="flex items-center gap-3">
                  <img src="/brand/driver-192.png" alt="Carrtell Driver" className="h-20 w-20 rounded-[24px] shadow-lg shadow-black/30" />
                  <div className="min-w-0">
                    <h2 className="text-lg font-black">Carrtell Driver</h2>
                    <p className="mt-1 text-xs leading-6 text-slate-400">نسخه اختصاصی سرویس‌کار؛ بعد از نصب مستقیماً پنل راننده باز می‌شود.</p>
                  </div>
                </div>
                <div className="mt-4">
                  <PwaInstallButton label="نصب Carrtell Driver" manifestHref="/driver.webmanifest" className="bg-emerald-400 text-slate-950" />
                </div>
              </div>
              <DriverNotificationSetup />
              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4 text-xs leading-6 text-slate-500">اگر اعلان مرورگر بسته باشد، اطلاع‌رسانی پیامکی مأموریت از مسیر پیامک Carrtell مستقل باقی می‌ماند.</div>
            </section>
          )}
        </section>

        <nav className="fixed bottom-0 left-1/2 z-40 flex w-full max-w-[520px] -translate-x-1/2 items-center justify-around border-t border-white/10 bg-[#091423]/95 px-4 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl">
          <button onClick={() => setTab('today')} className={`flex min-w-20 flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[11px] font-black ${tab === 'today' ? 'text-amber-300' : 'text-slate-500'}`}><Home className="h-5 w-5" /> خانه</button>
          <button onClick={() => setTab('history')} className={`flex min-w-20 flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[11px] font-black ${tab === 'history' ? 'text-amber-300' : 'text-slate-500'}`}><History className="h-5 w-5" /> سوابق</button>
          <button onClick={() => setTab('account')} className={`flex min-w-20 flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[11px] font-black ${tab === 'account' ? 'text-amber-300' : 'text-slate-500'}`}><UserRound className="h-5 w-5" /> حساب من</button>
        </nav>
      </div>
    </main>
  );
}

function Stat({ value, label, icon }: { value: number; label: string; icon: React.ReactNode }) {
  return <div className="rounded-2xl border border-white/5 bg-white/[0.04] p-3"><div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">{icon}{label}</div><div className="mt-2 text-xl font-black">{value.toLocaleString('fa-IR')}</div></div>;
}

function MissionTimeCard({ job }: { job: DriverJob }) {
  const badge = getMissionTimingBadge(job);
  const badgeClass = badge.tone === 'danger' ? 'bg-red-500/20 text-red-200' : badge.tone === 'today' ? 'bg-emerald-500/20 text-emerald-200' : badge.tone === 'upcoming' ? 'bg-sky-500/20 text-sky-200' : 'bg-white/10 text-slate-300';
  return <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2 text-sm font-black text-amber-200"><CalendarClock className="h-5 w-5" />زمان مراجعه</div><span className={`rounded-full px-3 py-1 text-xs font-black ${badgeClass}`}>{badge.label}</span></div><div className="mt-3 text-base font-black">{formatMissionDate(job)}</div><div className="mt-1 flex items-center gap-2 text-sm font-black text-slate-300"><Clock3 className="h-4 w-4" />ساعت {formatMissionTime(job)}</div></div>;
}

function CompactJob({ job, completed = false }: { job: DriverJob; completed?: boolean }) {
  return <Link to={`/driver/jobs/${job.id}`} className="block rounded-2xl border border-white/5 bg-white/[0.035] p-4 active:bg-white/[0.07]"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><div className="truncate font-black">{job.customer_name || 'مشتری'}</div><div className="mt-1 truncate text-xs text-slate-500">{job.vehicle_title || job.address_text || 'بدون توضیح'}</div><div className="mt-2 flex items-center gap-1 text-xs font-bold text-amber-200"><Clock3 className="h-3.5 w-3.5" />{formatMissionDate(job)} · {formatMissionTime(job)}</div></div><span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${completed ? 'bg-emerald-500/15 text-emerald-200' : 'bg-white/10 text-slate-300'}`}>{driverStatusLabels[String(job.status)] || 'ماموریت'}</span></div>{!completed && <WarehouseItems job={job} compact />}</Link>;
}

function WarehouseItems({ job, compact = false }: { job: DriverJob; compact?: boolean }) {
  const items = Array.isArray(job.warehouse_items) ? job.warehouse_items : [];
  return <div className={`${compact ? 'mt-3' : ''} rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-3`}><div className="mb-2 flex items-center gap-2 text-[11px] font-black text-amber-300"><Wrench className="h-3.5 w-3.5" />اقلام قابل تحویل از انبار</div>{items.length ? <div className="flex flex-wrap gap-1.5">{items.map((item, index) => <span key={item.id || `${item.product_name}-${index}`} className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5 text-[11px] font-bold text-slate-200">{item.product_name} <b className="text-amber-300">× {Number(item.quantity || 1).toLocaleString('fa-IR')}</b></span>)}</div> : <p className="text-[11px] text-slate-500">کالای انباری برای این مأموریت ثبت نشده است.</p>}</div>;
}

function HistoryJob({ job }: { job: DriverJob }) {
  const performed = Array.isArray(job.used_products)
    ? job.used_products.map((item: any) => item?.name || item?.title).filter(Boolean).join('، ')
    : String(job.consumed_products || '').replace(/\n/g, '، ');
  return <Link to={`/driver/jobs/${job.id}`} className="block rounded-3xl border border-emerald-400/10 bg-emerald-400/[0.04] p-4 active:bg-emerald-400/[0.08]">
    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="truncate text-base font-black">{job.customer_name || 'مشتری'}</div><div className="mt-1 truncate text-xs text-slate-500">{job.vehicle_title || job.car_name || 'خودرو ثبت نشده'}</div></div><span className="rounded-full bg-emerald-400/10 px-3 py-1 text-[10px] font-black text-emerald-200">تکمیل‌شده</span></div>
    <div className="mt-3 rounded-2xl border border-white/5 bg-black/15 p-3"><div className="text-[10px] font-black text-slate-600">کارهای انجام‌شده</div><p className="mt-1 text-xs leading-6 text-slate-300">{performed || job.driver_notes || 'گزارش جزئیات برای این سرویس ثبت نشده است.'}</p></div>
    {job.driver_notes && performed && <p className="mt-2 line-clamp-2 text-xs leading-6 text-slate-500">یادداشت: {job.driver_notes}</p>}
    <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-amber-200"><Clock3 className="h-3.5 w-3.5" />{formatMissionDate(job)} · {formatMissionTime(job)}</div>
  </Link>;
}

function Info({ icon: Icon, text }: { icon: typeof MapPin; text: string }) {
  return <div className="flex items-start gap-2 rounded-2xl border border-white/5 bg-white/[0.035] p-3 text-sm text-slate-300"><Icon className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" /><span className="leading-6">{text}</span></div>;
}
