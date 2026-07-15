import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  DriverJob,
  completeDriverJob,
  driverStatusLabels,
  getDriverActionLabel,
  getDriverJobById,
  getNextDriverAction,
  updateDriverJobStatus,
} from "../services/driverJobsApi";

export default function DriverJobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<DriverJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finalKm, setFinalKm] = useState("");
  const [usedProducts, setUsedProducts] = useState("");
  const [notes, setNotes] = useState("");

  async function load() {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getDriverJobById(id);
      setJob(data);
      setFinalKm(data.final_km ? String(data.final_km) : data.current_km ? String(data.current_km) : "");
      setNotes(data.driver_notes || "");
      if (Array.isArray(data.used_products)) {
        setUsedProducts(data.used_products.map((item: any) => `${item.name || "محصول"} * ${item.quantity || 1}`).join("\n"));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در دریافت جزئیات مأموریت");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  const nextStatus = useMemo(() => getNextDriverAction(job?.status), [job?.status]);

  async function handleNextStatus() {
    if (!id || !nextStatus) return;
    try {
      setSaving(true);
      const updated = await updateDriverJobStatus(id, nextStatus);
      setJob(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در تغییر وضعیت");
    } finally {
      setSaving(false);
    }
  }

  async function handleComplete(event: FormEvent) {
    event.preventDefault();
    if (!id) return;
    const km = Number(finalKm);
    if (!km || km < 1) {
      setError("کیلومتر پایان سرویس را درست وارد کن.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const updated = await completeDriverJob(id, { finalKm: km, usedProducts, notes });
      setJob(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ثبت پایان سرویس");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <PageShell><div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 text-slate-300">در حال دریافت اطلاعات مأموریت...</div></PageShell>;
  }

  if (error && !job) {
    return <PageShell><ErrorBox text={error} /></PageShell>;
  }

  if (!job) {
    return <PageShell><ErrorBox text="مأموریت پیدا نشد." /></PageShell>;
  }

  const completed = job.status === "completed";

  return (
    <PageShell>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link to="/driver/dashboard" className="rounded-2xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-amber-400/40">بازگشت</Link>
        <button onClick={() => navigate("/driver")} className="rounded-2xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-amber-400/40">پنل قبلی</button>
      </div>

      <section className="rounded-3xl border border-amber-400/20 bg-gradient-to-l from-slate-900 to-amber-950/20 p-5 shadow-2xl shadow-black/30">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-amber-300">جزئیات مأموریت</p>
            <h1 className="mt-2 text-2xl font-black">{job.customer_name || "مشتری"}</h1>
            <p className="mt-2 text-slate-300">{job.car_name || "خودرو ثبت نشده"}</p>
          </div>
          <span className="w-fit rounded-full bg-amber-400/10 px-4 py-2 text-sm font-bold text-amber-300">
            {driverStatusLabels[String(job.status)] || job.status || "جدید"}
          </span>
        </div>
      </section>

      {error && <ErrorBox text={error} />}

      <section className="mt-5 grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <InfoPanel title="اطلاعات مشتری و خودرو">
            <InfoRow label="نام مشتری" value={job.customer_name || "-"} />
            <InfoRow label="شماره تماس" value={job.customer_phone || "-"} href={job.customer_phone ? `tel:${job.customer_phone}` : undefined} />
            <InfoRow label="خودرو" value={job.car_name || "-"} />
            <InfoRow label="کیلومتر ثبت‌شده" value={job.current_km?.toLocaleString("fa-IR") || "-"} />
            <InfoRow label="کیلومتر سرویس بعدی" value={job.next_service_km?.toLocaleString("fa-IR") || "-"} />
          </InfoPanel>

          <InfoPanel title="آدرس سرویس">
            <p className="text-sm leading-7 text-slate-300">{job.address_text || "آدرس ثبت نشده"}</p>
            {job.latitude && job.longitude && (
              <p className="mt-3 rounded-2xl bg-slate-950/70 p-3 text-xs text-slate-400">مختصات: {job.latitude}, {job.longitude}</p>
            )}
          </InfoPanel>

          <InfoPanel title="ثبت پایان سرویس">
            <form onSubmit={handleComplete} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">کیلومتر فعلی خودرو</span>
                <input value={finalKm} onChange={(e) => setFinalKm(e.target.value)} inputMode="numeric" className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400" placeholder="مثلاً ۵۲۰۰۰" />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">محصولات مصرف‌شده</span>
                <textarea value={usedProducts} onChange={(e) => setUsedProducts(e.target.value)} rows={4} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400" placeholder={"هر خط یک محصول\nروغن موتور بهران 10W40 * 1\nفیلتر روغن سرکان * 1"} />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">توضیحات سرویس‌کار</span>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400" placeholder="توضیحات وضعیت خودرو، نشتی، پیشنهاد سرویس بعدی و..." />
              </label>

              <button disabled={saving || completed} className="w-full rounded-2xl bg-emerald-400 px-5 py-4 font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60">
                {completed ? "سرویس تکمیل شده" : saving ? "در حال ثبت..." : "ثبت پایان سرویس"}
              </button>
            </form>
          </InfoPanel>
        </div>

        <aside className="space-y-4">
          <InfoPanel title="عملیات سریع">
            {nextStatus ? (
              <button disabled={saving} onClick={handleNextStatus} className="w-full rounded-2xl bg-amber-400 px-5 py-4 font-black text-slate-950 transition hover:bg-amber-300 disabled:opacity-60">
                {saving ? "در حال ثبت..." : getDriverActionLabel(job.status)}
              </button>
            ) : (
              <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4 text-center text-sm text-slate-400">مرحله سریع دیگری وجود ندارد.</div>
            )}

            <a href={job.customer_phone ? `tel:${job.customer_phone}` : undefined} className="mt-3 block rounded-2xl border border-slate-700 px-5 py-4 text-center font-bold text-slate-200 hover:border-amber-400/40">
              تماس با مشتری
            </a>
          </InfoPanel>

          <InfoPanel title="مسیر عملیات">
            <Step active={Boolean(job.status)} done={true} label="اختصاص داده‌شده" />
            <Step active={job.status === "en_route"} done={["en_route", "arrived", "in_progress", "completed"].includes(String(job.status))} label="در مسیر مشتری" />
            <Step active={job.status === "arrived"} done={["arrived", "in_progress", "completed"].includes(String(job.status))} label="رسیده به محل" />
            <Step active={job.status === "in_progress"} done={["in_progress", "completed"].includes(String(job.status))} label="در حال انجام" />
            <Step active={job.status === "completed"} done={job.status === "completed"} label="تکمیل شده" />
          </InfoPanel>
        </aside>
      </section>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-950 text-white" dir="rtl">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">{children}</div>
    </main>
  );
}

function InfoPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg shadow-black/20">
      <h2 className="mb-4 font-black text-white">{title}</h2>
      {children}
    </div>
  );
}

function InfoRow({ label, value, href }: { label: string; value: string; href?: string }) {
  const content = <span className="font-bold text-slate-100">{value}</span>;
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-800 py-3 text-sm last:border-b-0">
      <span className="text-slate-400">{label}</span>
      {href ? <a href={href} className="text-amber-300">{content}</a> : content}
    </div>
  );
}

function ErrorBox({ text }: { text: string }) {
  return <div className="my-4 rounded-3xl border border-red-500/30 bg-red-950/30 p-4 text-red-200">{text}</div>;
}

function Step({ label, active, done }: { label: string; active?: boolean; done?: boolean }) {
  return (
    <div className="mb-3 flex items-center gap-3 last:mb-0">
      <span className={`h-4 w-4 rounded-full border ${done ? "border-emerald-300 bg-emerald-400" : active ? "border-amber-300 bg-amber-400" : "border-slate-600 bg-slate-800"}`} />
      <span className={done || active ? "text-slate-100" : "text-slate-500"}>{label}</span>
    </div>
  );
}
