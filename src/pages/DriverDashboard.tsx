import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  DriverJob,
  driverStatusLabels,
  getDriverJobs,
} from "../driver/services/driverJobsApi";

const activeStatuses = ["assigned", "on_way", "arrived", "working"];

export default function DriverDashboard() {
  const [jobs, setJobs] = useState<DriverJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await getDriverJobs();
      setJobs(data);
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

    return {
      today: todayJobs.length,
      active: active.length,
      completed: completed.length,
      total: jobs.length,
    };
  }, [jobs]);

  const activeJobs = jobs.filter((job) => job.status !== "completed" && job.status !== "cancelled");
  const completedJobs = jobs.filter((job) => job.status === "completed").slice(0, 5);

  return (
    <main className="min-h-screen bg-slate-950 text-white" dir="rtl">
      <section className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <div className="mb-6 rounded-3xl border border-amber-400/20 bg-gradient-to-l from-slate-900 via-slate-900 to-amber-950/30 p-5 shadow-2xl shadow-black/30">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-amber-300">پنل سرویس‌کار Carrtell</p>
              <h1 className="mt-2 text-2xl font-black sm:text-3xl">مأموریت‌های امروز و عملیات سرویس</h1>
              <p className="mt-2 text-sm text-slate-300">وضعیت سرویس‌ها را مرحله‌به‌مرحله ثبت کن تا دفترچه سرویس مشتری و گزارش عملیات به‌روزرسانی شود.</p>
            </div>
            <button onClick={load} className="rounded-2xl border border-amber-400/40 bg-amber-400 px-5 py-3 font-bold text-slate-950 transition hover:bg-amber-300">
              بروزرسانی
            </button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="امروز" value={stats.today} />
          <StatCard label="فعال" value={stats.active} />
          <StatCard label="تکمیل‌شده" value={stats.completed} />
          <StatCard label="کل مأموریت‌ها" value={stats.total} />
        </div>

        {loading && <StateBox text="در حال دریافت مأموریت‌ها..." />}
        {error && <StateBox danger text={error} />}

        {!loading && !error && (
          <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
            <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-black">مأموریت‌های فعال</h2>
                <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs text-amber-300">{activeJobs.length} مورد</span>
              </div>

              {activeJobs.length === 0 ? (
                <Empty text="فعلاً مأموریت فعالی نداری." />
              ) : (
                <div className="space-y-3">
                  {activeJobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              )}
            </section>

            <aside className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
              <h2 className="mb-4 text-lg font-black">آخرین سرویس‌های انجام‌شده</h2>
              {completedJobs.length === 0 ? (
                <Empty text="هنوز سرویس تکمیل‌شده‌ای ثبت نشده." />
              ) : (
                <div className="space-y-3">
                  {completedJobs.map((job) => (
                    <Link key={job.id} to={`/driver/jobs/${job.id}`} className="block rounded-2xl border border-slate-800 bg-slate-950/70 p-3 transition hover:border-amber-400/40">
                      <div className="font-bold">{job.customer_name || "مشتری"}</div>
                      <div className="mt-1 text-xs text-slate-400">{job.car_name || "خودرو ثبت نشده"}</div>
                      <div className="mt-2 text-xs text-emerald-300">تکمیل شده در کیلومتر {job.final_km?.toLocaleString("fa-IR") || "-"}</div>
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

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4 text-center shadow-lg shadow-black/20">
      <div className="text-2xl font-black text-amber-300">{value.toLocaleString("fa-IR")}</div>
      <div className="mt-1 text-xs text-slate-400">{label}</div>
    </div>
  );
}

function JobCard({ job }: { job: DriverJob }) {
  return (
    <Link to={`/driver/jobs/${job.id}`} className="block rounded-3xl border border-slate-800 bg-slate-950/70 p-4 transition hover:border-amber-400/50 hover:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-black">{job.customer_name || "مشتری بدون نام"}</h3>
          <p className="mt-1 text-sm text-slate-400">{job.car_name || "خودرو ثبت نشده"}</p>
        </div>
        <span className="shrink-0 rounded-full bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-300">
          {driverStatusLabels[String(job.status)] || job.status || "جدید"}
        </span>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
        <span>📞 {job.customer_phone || "بدون شماره"}</span>
        <span>🧭 {job.address_text || "آدرس ثبت نشده"}</span>
        <span>🔢 کیلومتر: {job.current_km?.toLocaleString("fa-IR") || "-"}</span>
        <span>⏱ زمان: {formatDate(job.scheduled_at || job.created_at)}</span>
      </div>
    </Link>
  );
}

function StateBox({ text, danger = false }: { text: string; danger?: boolean }) {
  return <div className={`rounded-3xl border p-4 ${danger ? "border-red-500/30 bg-red-950/30 text-red-200" : "border-slate-800 bg-slate-900 text-slate-300"}`}>{text}</div>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/60 p-6 text-center text-sm text-slate-400">{text}</div>;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value;
  }
}
