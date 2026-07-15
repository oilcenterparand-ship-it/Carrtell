import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  ListChecks,
  MapPin,
  Phone,
  RefreshCw,
  Route,
  Sparkles,
  UserRound,
  Wrench,
} from "lucide-react";
import {
  DriverJob,
  driverStatusLabels,
  getDriverJobs,
} from "../services/driverJobsApi";

const activeStatuses = ["assigned", "en_route", "on_way", "dispatched", "arrived", "in_progress", "working", "in_service"];

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
      setError(err instanceof Error ? err.message : "خطا در دریافت مأموریت‌ها");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayJobs = jobs.filter((job) => (job.scheduled_at || job.created_at || "").startsWith(today));
    const completed = jobs.filter((job) => job.status === "completed");
    const active = jobs.filter((job) => activeStatuses.includes(String(job.status)));
    return { today: todayJobs.length, active: active.length, completed: completed.length, total: jobs.length };
  }, [jobs]);

  const activeJobs = jobs.filter((job) => job.status !== "completed" && job.status !== "cancelled");
  const completedJobs = jobs.filter((job) => job.status === "completed").slice(0, 4);
  const nextJob = activeJobs[0];

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-slate-900" dir="rtl">
      <section className="mx-auto max-w-6xl px-4 py-5 sm:py-8">
        <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-amber-600">پنل سرویس‌کار Carrtell</p>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl">سلام، آماده‌ای برای مأموریت‌های امروز؟</h1>
            <p className="mt-1 text-sm text-slate-500">تمام مراحل سرویس را ساده، سریع و دقیق ثبت کن.</p>
          </div>
          <button
            onClick={load}
            className="inline-flex items-center justify-center gap-2 self-start rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-amber-300 hover:text-amber-700"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            بروزرسانی
          </button>
        </header>

        <section className="mb-5 overflow-hidden rounded-[28px] border border-amber-100 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.07)]">
          <div className="grid gap-0 lg:grid-cols-[1.25fr_.75fr]">
            <div className="p-5 sm:p-7">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                    <Sparkles className="h-3.5 w-3.5" /> مأموریت بعدی
                  </span>
                  <h2 className="mt-3 text-xl font-black sm:text-2xl">
                    {nextJob ? nextJob.customer_name || "مشتری" : "فعلاً مأموریت فعالی نداری"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {nextJob ? nextJob.car_name || "خودروی مشتری" : "وقتی مأموریت جدیدی ثبت شود، اینجا نمایش داده می‌شود."}
                  </p>
                </div>
                <div className="rounded-2xl bg-amber-400 p-3 text-slate-950 shadow-lg shadow-amber-200">
                  <Wrench className="h-6 w-6" />
                </div>
              </div>

              {nextJob ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoItem icon={Clock3} text={formatDate(nextJob.scheduled_at || nextJob.created_at)} />
                  <InfoItem icon={MapPin} text={nextJob.address_text || "آدرس ثبت نشده"} />
                  <InfoItem icon={Phone} text={nextJob.customer_phone || "شماره ثبت نشده"} />
                  <InfoItem icon={Route} text={driverStatusLabels[String(nextJob.status)] || "در انتظار شروع"} />
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                  برای بررسی روند کامل، از مأموریت نمایشی استفاده کن.
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center gap-3 border-t border-slate-100 bg-gradient-to-br from-amber-50 to-white p-5 sm:p-7 lg:border-r lg:border-t-0">
              {nextJob && (
                <Link
                  to={`/driver/jobs/${nextJob.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 py-4 font-black text-slate-950 shadow-lg shadow-amber-200 transition hover:bg-amber-300"
                >
                  ادامه مأموریت
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              )}
              <Link
                to="/driver/jobs/test"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 font-black text-slate-700 transition hover:border-amber-300 hover:text-amber-700"
              >
                مأموریت نمایشی
                <ChevronLeft className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={CalendarDays} label="مأموریت امروز" value={stats.today} tone="amber" />
          <StatCard icon={Route} label="در حال انجام" value={stats.active} tone="blue" />
          <StatCard icon={CheckCircle2} label="تکمیل‌شده" value={stats.completed} tone="green" />
          <StatCard icon={ListChecks} label="کل مأموریت‌ها" value={stats.total} tone="slate" />
        </div>

        {loading && <StateBox text="در حال دریافت مأموریت‌ها..." />}
        {error && <StateBox danger text={error} />}

        {!loading && !error && (
          <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
            <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black">مأموریت‌های فعال</h2>
                  <p className="mt-1 text-xs text-slate-500">اولویت‌بندی‌شده بر اساس زمان ثبت</p>
                </div>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">{activeJobs.length.toLocaleString("fa-IR")} مورد</span>
              </div>

              {activeJobs.length === 0 ? (
                <Empty text="فعلاً مأموریت فعالی نداری." />
              ) : (
                <div className="space-y-3">
                  {activeJobs.map((job) => <JobCard key={job.id} job={job} />)}
                </div>
              )}
            </section>

            <aside className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <h2 className="text-lg font-black">آخرین سرویس‌ها</h2>
              </div>
              {completedJobs.length === 0 ? (
                <Empty text="هنوز سرویس تکمیل‌شده‌ای ثبت نشده." />
              ) : (
                <div className="space-y-3">
                  {completedJobs.map((job) => (
                    <Link key={job.id} to={`/driver/jobs/${job.id}`} className="block rounded-2xl border border-slate-100 bg-slate-50 p-3 transition hover:border-amber-200 hover:bg-amber-50/40">
                      <div className="flex items-center gap-2">
                        <div className="rounded-xl bg-white p-2 text-emerald-500 shadow-sm"><UserRound className="h-4 w-4" /></div>
                        <div>
                          <div className="font-black">{job.customer_name || "مشتری"}</div>
                          <div className="text-xs text-slate-500">{job.car_name || "خودرو ثبت نشده"}</div>
                        </div>
                      </div>
                      <div className="mt-3 text-xs font-bold text-emerald-600">تکمیل در کیلومتر {job.final_km?.toLocaleString("fa-IR") || "-"}</div>
                    </Link>
                  ))}
                </div>
              )}
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}

function InfoItem({ icon: Icon, text }: { icon: typeof Clock3; text: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-600">
      <Icon className="h-4 w-4 shrink-0 text-amber-500" />
      <span className="truncate">{text}</span>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }: { icon: typeof CalendarDays; label: string; value: number; tone: "amber" | "blue" | "green" | "slate" }) {
  const tones = {
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-sky-50 text-sky-600",
    green: "bg-emerald-50 text-emerald-600",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`mb-3 inline-flex rounded-2xl p-2.5 ${tones[tone]}`}><Icon className="h-5 w-5" /></div>
      <div className="text-2xl font-black text-slate-900">{value.toLocaleString("fa-IR")}</div>
      <div className="mt-1 text-xs font-bold text-slate-500">{label}</div>
    </div>
  );
}

function JobCard({ job }: { job: DriverJob }) {
  return (
    <Link to={`/driver/jobs/${job.id}`} className="group block rounded-[22px] border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="rounded-2xl bg-amber-50 p-3 text-amber-600"><Wrench className="h-5 w-5" /></div>
          <div className="min-w-0">
            <h3 className="truncate font-black">{job.customer_name || "مشتری بدون نام"}</h3>
            <p className="mt-1 truncate text-sm text-slate-500">{job.car_name || "خودرو ثبت نشده"}</p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-black text-amber-700">
          {driverStatusLabels[String(job.status)] || job.status || "جدید"}
        </span>
      </div>
      <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
        <span className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" />{job.customer_phone || "بدون شماره"}</span>
        <span className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-slate-400" />{formatDate(job.scheduled_at || job.created_at)}</span>
        <span className="flex items-center gap-2 sm:col-span-2"><MapPin className="h-4 w-4 shrink-0 text-slate-400" /><span className="truncate">{job.address_text || "آدرس ثبت نشده"}</span></span>
      </div>
    </Link>
  );
}

function StateBox({ text, danger = false }: { text: string; danger?: boolean }) {
  return <div className={`rounded-3xl border p-4 ${danger ? "border-red-200 bg-red-50 text-red-700" : "border-slate-200 bg-white text-slate-600"}`}>{text}</div>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">{text}</div>;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value;
  }
}
