import { useEffect, useMemo, useState } from "react";
import { Activity, CarFront, CheckCircle2, Clock3, Edit3, MapPinned, Navigation, Phone, Plus, RefreshCcw, Search, Trash2, UserRoundCheck, Wrench } from "lucide-react";
import { getActiveBranches, Branch } from "../services/branchesApi";
import {
  FleetOperationalRow,
  FleetSummary,
  ServiceFleetInput,
  TechnicianOperationalStatus,
  deleteServiceFleetVehicle,
  getFleetOperationalDashboard,
  saveServiceFleetVehicle,
  updateTechnicianOperationalStatus,
} from "../services/serviceFleetApi";

const emptyForm: ServiceFleetInput = {
  title: "",
  plate_number: "",
  driver_name: "",
  driver_phone: "",
  service_area: "",
  branch_id: "",
  status: "active",
  operational_status: "available",
  notes: "",
};

const operationalLabels: Record<TechnicianOperationalStatus, string> = {
  available: "آماده دریافت مأموریت",
  en_route: "در مسیر مشتری",
  in_service: "در حال انجام سرویس",
  offline: "پایان شیفت / آفلاین",
};

const operationalStyles: Record<TechnicianOperationalStatus, string> = {
  available: "bg-emerald-400/15 text-emerald-300 border-emerald-400/20",
  en_route: "bg-blue-400/15 text-blue-300 border-blue-400/20",
  in_service: "bg-amber-400/15 text-amber-300 border-amber-400/20",
  offline: "bg-slate-500/20 text-slate-300 border-slate-500/20",
};

export default function ServiceFleet() {
  const [items, setItems] = useState<FleetOperationalRow[]>([]);
  const [summary, setSummary] = useState<FleetSummary>({ today: 0, unassigned: 0, active: 0, completed: 0 });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceFleetInput>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboard, branchList] = await Promise.all([getFleetOperationalDashboard(), getActiveBranches()]);
      setItems(dashboard.rows);
      setSummary(dashboard.summary);
      setBranches(branchList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در دریافت ناوگان");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => [item.title, item.plate_number, item.driver_name, item.driver_phone, item.service_area].filter(Boolean).some((value) => String(value).toLowerCase().includes(q)));
  }, [items, query]);

  const resetForm = () => { setEditingId(null); setForm(emptyForm); };
  const startEdit = (item: FleetOperationalRow) => {
    setEditingId(item.id);
    setForm({
      title: item.title || "",
      plate_number: item.plate_number || "",
      driver_name: item.driver_name || "",
      driver_phone: item.driver_phone || "",
      service_area: item.service_area || "",
      branch_id: item.branch_id || "",
      driver_id: item.driver_id || "",
      status: item.status || "active",
      operational_status: item.operational_status || "available",
      notes: item.notes || "",
    });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await saveServiceFleetVehicle(form, editingId || undefined);
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ذخیره خودرو سرویس");
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("این خودرو سرویس حذف شود؟")) return;
    try { await deleteServiceFleetVehicle(id); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "خطا در حذف خودرو سرویس"); }
  };

  const changeOperationalStatus = async (item: FleetOperationalRow, status: TechnicianOperationalStatus) => {
    if (status === "offline" && item.active_missions > 0) {
      setError("تا وقتی مأموریت فعال دارد، پایان شیفت ممکن نیست.");
      return;
    }
    try { await updateTechnicianOperationalStatus(item.id, status); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "خطا در تغییر وضعیت تکنسین"); }
  };

  return (
    <div className="space-y-6 text-slate-100" dir="rtl">
      <div className="rounded-3xl border border-cyan-400/20 bg-gradient-to-l from-slate-950 via-slate-900 to-cyan-950/30 p-5 shadow-xl shadow-black/20">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-cyan-300">Carrtell Fleet Operations</p>
            <h1 className="mt-1 text-2xl font-black text-white">مدیریت عملیاتی ناوگان</h1>
            <p className="mt-2 text-sm text-slate-300">وضعیت تکنسین‌ها، مأموریت‌های امروز، پایان شیفت و آمار روزانه در یک صفحه.</p>
          </div>
          <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm hover:bg-white/15"><RefreshCcw className="h-4 w-4" /> بروزرسانی</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryCard title="سرویس‌های امروز" value={summary.today} icon={<Clock3 className="h-5 w-5" />} />
        <SummaryCard title="در انتظار تخصیص" value={summary.unassigned} icon={<UserRoundCheck className="h-5 w-5" />} danger={summary.unassigned > 0} />
        <SummaryCard title="در حال انجام" value={summary.active} icon={<Activity className="h-5 w-5" />} />
        <SummaryCard title="تکمیل‌شده" value={summary.completed} icon={<CheckCircle2 className="h-5 w-5" />} />
      </div>

      {error && <div className="rounded-2xl border border-red-400/30 bg-red-950/40 p-4 text-sm text-red-100">{error}</div>}

      <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-5 shadow-xl shadow-black/20">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div><h2 className="font-bold text-white">وضعیت زنده تکنسین‌ها</h2><p className="mt-1 text-xs text-slate-400">موقعیت GPS در مرحله اتصال نقشه فعال می‌شود.</p></div>
          <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900 px-3 py-2"><Search className="h-4 w-4 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جستجوی تکنسین یا خودرو" className="bg-transparent text-sm text-white outline-none placeholder:text-slate-500" /></label>
        </div>

        {loading ? <div className="p-8 text-center text-slate-300">در حال دریافت...</div> : (
          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {filtered.map((item) => {
              const op = (item.operational_status || "available") as TechnicianOperationalStatus;
              return (
                <article key={item.id} className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3"><span className="rounded-2xl bg-cyan-400/15 p-3 text-cyan-300"><CarFront className="h-6 w-6" /></span><div><h3 className="font-black text-white">{item.driver_name || item.title}</h3><p className="text-xs text-slate-400">{item.title} · {item.plate_number || "بدون پلاک"}</p></div></div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${operationalStyles[op]}`}>{operationalLabels[op]}</span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <Metric label="ماموریت امروز" value={item.today_missions} />
                    <Metric label="فعال" value={item.active_missions} />
                    <Metric label="تکمیل" value={item.completed_today} />
                    <Metric label="لغو" value={item.cancelled_today} />
                  </div>

                  <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950 p-3 text-sm">
                    <div className="flex items-center justify-between"><span className="text-slate-400">ماموریت بعدی</span><strong className="text-cyan-300">{formatDateTime(item.next_mission_at)}</strong></div>
                    <div className="mt-2 flex items-center justify-between"><span className="text-slate-400">میانگین زمان سرویس</span><strong>{item.average_service_minutes ? `${item.average_service_minutes.toLocaleString("fa-IR")} دقیقه` : "-"}</strong></div>
                    <div className="mt-2 flex items-center justify-between"><span className="text-slate-400">مبلغ امروز</span><strong>{formatMoney(item.completed_amount_today)}</strong></div>
                  </div>

                  <select value={op} onChange={(e) => void changeOperationalStatus(item, e.target.value as TechnicianOperationalStatus)} className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white">
                    {Object.entries(operationalLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <a href={item.driver_phone ? `tel:${item.driver_phone}` : undefined} className="inline-flex items-center justify-center gap-1 rounded-xl bg-white/10 px-2 py-2 text-xs"><Phone className="h-4 w-4" /> تماس</a>
                    <a href={item.active_request_id ? `/admin/dispatch` : undefined} className="inline-flex items-center justify-center gap-1 rounded-xl bg-white/10 px-2 py-2 text-xs"><Navigation className="h-4 w-4" /> ماموریت</a>
                    <button onClick={() => startEdit(item)} className="inline-flex items-center justify-center gap-1 rounded-xl bg-white/10 px-2 py-2 text-xs"><Edit3 className="h-4 w-4" /> ویرایش</button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <form onSubmit={submit} className="rounded-3xl border border-white/10 bg-slate-950/80 p-5 shadow-xl shadow-black/20">
          <div className="mb-4 flex items-center gap-2"><Plus className="h-5 w-5 text-cyan-300" /><h2 className="font-bold text-white">{editingId ? "ویرایش ناوگان" : "ثبت خودرو و تکنسین"}</h2></div>
          <div className="space-y-3">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="عنوان خودرو سرویس" className="field" />
            <input value={form.plate_number || ""} onChange={(e) => setForm({ ...form, plate_number: e.target.value })} placeholder="پلاک خودرو" className="field" />
            <select value={form.branch_id || ""} onChange={(e) => setForm({ ...form, branch_id: e.target.value })} className="field"><option value="">بدون شعبه</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select>
            <input value={form.driver_name || ""} onChange={(e) => setForm({ ...form, driver_name: e.target.value })} placeholder="نام تکنسین" className="field" />
            <input value={form.driver_phone || ""} onChange={(e) => setForm({ ...form, driver_phone: e.target.value })} placeholder="شماره تکنسین" className="field" />
            <textarea value={form.service_area || ""} onChange={(e) => setForm({ ...form, service_area: e.target.value })} placeholder="محدوده سرویس‌دهی" rows={2} className="field" />
            <textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="توضیحات" rows={2} className="field" />
          </div>
          <div className="mt-5 flex gap-2"><button disabled={saving || !form.title.trim()} className="flex-1 rounded-2xl bg-cyan-300 px-4 py-3 font-bold text-slate-950 disabled:opacity-50">{saving ? "در حال ذخیره..." : "ذخیره"}</button>{editingId && <button type="button" onClick={resetForm} className="rounded-2xl border border-white/10 px-4 py-3">انصراف</button>}</div>
        </form>

        <section className="rounded-3xl border border-dashed border-cyan-400/20 bg-slate-950/60 p-5">
          <div className="flex items-center gap-2 text-cyan-300"><MapPinned className="h-5 w-5" /><h2 className="font-bold">نقشه زنده ناوگان</h2></div>
          <div className="mt-4 flex min-h-64 flex-col items-center justify-center rounded-2xl border border-white/10 bg-slate-900/70 text-center text-slate-400"><Navigation className="mb-3 h-10 w-10 text-cyan-300" /><p className="font-bold text-white">آماده اتصال به API نقشه</p><p className="mt-2 max-w-md text-sm">در مرحله اتصال نشان، موقعیت تکنسین‌ها، مشتری‌ها، مسیر و زمان تقریبی رسیدن در همین بخش نمایش داده می‌شود.</p></div>
          <div className="mt-4 flex flex-wrap gap-2">{items.map((item) => <button key={item.id} onClick={() => startEdit(item)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"><Wrench className="h-4 w-4 text-cyan-300" />{item.driver_name || item.title}<Trash2 onClick={(event) => { event.stopPropagation(); void remove(item.id); }} className="h-4 w-4 text-red-300" /></button>)}</div>
        </section>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, icon, danger = false }: { title: string; value: number; icon: React.ReactNode; danger?: boolean }) { return <div className={`rounded-2xl border p-4 ${danger ? "border-red-400/30 bg-red-500/10" : "border-white/10 bg-slate-900"}`}><div className="flex items-center justify-between text-sm text-slate-400"><span>{title}</span><span className={danger ? "text-red-300" : "text-cyan-300"}>{icon}</span></div><div className={`mt-2 text-2xl font-black ${danger ? "text-red-300" : "text-white"}`}>{value.toLocaleString("fa-IR")}</div></div>; }
function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-xl bg-white/5 p-2"><div className="text-xs text-slate-500">{label}</div><div className="mt-1 font-black text-white">{value.toLocaleString("fa-IR")}</div></div>; }
function formatDateTime(value?: string | null) { if (!value) return "-"; try { return new Intl.DateTimeFormat("fa-IR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value)); } catch { return value; } }
function formatMoney(value?: number) { return value ? `${Math.round(value).toLocaleString("fa-IR")} تومان` : "-"; }
