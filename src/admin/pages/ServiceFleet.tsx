import { useEffect, useMemo, useState } from "react";
import { CarFront, Edit3, Plus, RefreshCcw, Search, Trash2 } from "lucide-react";
import { getActiveBranches, Branch } from "../services/branchesApi";
import { ServiceFleetInput, ServiceFleetVehicle, deleteServiceFleetVehicle, getServiceFleet, saveServiceFleetVehicle } from "../services/serviceFleetApi";

const emptyForm: ServiceFleetInput = {
  title: "",
  plate_number: "",
  driver_name: "",
  driver_phone: "",
  service_area: "",
  branch_id: "",
  status: "active",
  notes: "",
};

const statusLabel: Record<string, string> = {
  active: "فعال",
  busy: "مشغول",
  maintenance: "خارج سرویس",
  inactive: "غیرفعال",
};

export default function ServiceFleet() {
  const [items, setItems] = useState<ServiceFleetVehicle[]>([]);
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
      const [fleet, branchList] = await Promise.all([getServiceFleet(), getActiveBranches()]);
      setItems(fleet);
      setBranches(branchList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در دریافت ناوگان");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      [item.title, item.plate_number, item.driver_name, item.driver_phone, item.service_area]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    );
  }, [items, query]);

  const branchName = (id?: string | null) => branches.find((branch) => branch.id === id)?.name || "بدون شعبه";

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const startEdit = (item: ServiceFleetVehicle) => {
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
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("این خودرو سرویس حذف شود؟")) return;
    setError(null);
    try {
      await deleteServiceFleetVehicle(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در حذف خودرو سرویس");
    }
  };

  return (
    <div className="space-y-6 text-slate-100" dir="rtl">
      <div className="rounded-3xl border border-cyan-400/20 bg-gradient-to-l from-slate-950 via-slate-900 to-cyan-950/30 p-5 shadow-xl shadow-black/20">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-cyan-300">Carrtell Service Fleet</p>
            <h1 className="mt-1 text-2xl font-black text-white">ناوگان سرویس در محل</h1>
            <p className="mt-2 text-sm text-slate-300">مدیریت خودروهای سرویس، راننده، شعبه، محدوده فعالیت و وضعیت عملیاتی.</p>
          </div>
          <button onClick={load} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm hover:bg-white/15">
            <RefreshCcw className="h-4 w-4" /> بروزرسانی
          </button>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-400/30 bg-red-950/40 p-4 text-sm text-red-100">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <form onSubmit={submit} className="rounded-3xl border border-white/10 bg-slate-950/80 p-5 shadow-xl shadow-black/20">
          <div className="mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-cyan-300" />
            <h2 className="font-bold text-white">{editingId ? "ویرایش خودرو سرویس" : "ثبت خودرو سرویس"}</h2>
          </div>
          <div className="space-y-3">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="عنوان مثل وانت سرویس پرند ۱" className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none" />
            <input value={form.plate_number || ""} onChange={(e) => setForm({ ...form, plate_number: e.target.value })} placeholder="پلاک خودرو" className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none" />
            <select value={form.branch_id || ""} onChange={(e) => setForm({ ...form, branch_id: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none">
              <option value="">بدون شعبه</option>
              {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
            </select>
            <input value={form.driver_name || ""} onChange={(e) => setForm({ ...form, driver_name: e.target.value })} placeholder="نام سرویس‌کار/راننده" className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none" />
            <input value={form.driver_phone || ""} onChange={(e) => setForm({ ...form, driver_phone: e.target.value })} placeholder="شماره سرویس‌کار" className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none" />
            <textarea value={form.service_area || ""} onChange={(e) => setForm({ ...form, service_area: e.target.value })} placeholder="محدوده سرویس‌دهی" rows={2} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none" />
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ServiceFleetInput["status"] })} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none">
              <option value="active">فعال</option>
              <option value="busy">مشغول</option>
              <option value="maintenance">خارج سرویس</option>
              <option value="inactive">غیرفعال</option>
            </select>
            <textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="توضیحات" rows={2} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none" />
          </div>
          <div className="mt-5 flex gap-2">
            <button disabled={saving || !form.title.trim()} className="flex-1 rounded-2xl bg-cyan-300 px-4 py-3 font-bold text-slate-950 disabled:opacity-50">{saving ? "در حال ذخیره..." : "ذخیره"}</button>
            {editingId && <button type="button" onClick={resetForm} className="rounded-2xl border border-white/10 px-4 py-3 text-slate-200">انصراف</button>}
          </div>
        </form>

        <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-5 shadow-xl shadow-black/20">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="font-bold text-white">لیست ناوگان</h2>
            <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900 px-3 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جستجو..." className="bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
            </label>
          </div>
          {loading ? (
            <div className="rounded-2xl bg-white/5 p-8 text-center text-slate-300">در حال دریافت...</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl bg-white/5 p-8 text-center text-slate-300">خودرو سرویس ثبت نشده است.</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-xl bg-cyan-400/15 p-2 text-cyan-300"><CarFront className="h-5 w-5" /></span>
                      <div>
                        <h3 className="font-bold text-white">{item.title}</h3>
                        <p className="text-xs text-slate-400">{item.plate_number || "بدون پلاک"}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs ${item.status === "active" ? "bg-emerald-400/15 text-emerald-300" : item.status === "busy" ? "bg-amber-400/15 text-amber-300" : "bg-slate-500/20 text-slate-300"}`}>{statusLabel[item.status] || item.status}</span>
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-slate-300">
                    <p>شعبه: {branchName(item.branch_id)}</p>
                    <p>راننده: {item.driver_name || "-"}</p>
                    <p>تماس: {item.driver_phone || "-"}</p>
                    <p>محدوده: {item.service_area || "-"}</p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => startEdit(item)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm hover:bg-white/15"><Edit3 className="h-4 w-4" /> ویرایش</button>
                    <button onClick={() => remove(item.id)} className="rounded-xl bg-red-500/15 px-3 py-2 text-red-200 hover:bg-red-500/25"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
