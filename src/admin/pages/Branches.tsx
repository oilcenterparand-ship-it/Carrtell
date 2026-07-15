import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCcw, Search, Trash2, Edit3, Building2 } from "lucide-react";
import { Branch, BranchInput, deleteBranch, getBranches, saveBranch } from "../services/branchesApi";

const emptyForm: BranchInput = {
  name: "",
  city: "پرند",
  service_area: "",
  manager_name: "",
  manager_phone: "",
  address: "",
  status: "active",
};

export default function Branches() {
  const [items, setItems] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BranchInput>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await getBranches());
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در دریافت شعب");
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
      [item.name, item.city, item.service_area, item.manager_name, item.manager_phone]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    );
  }, [items, query]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const startEdit = (item: Branch) => {
    setEditingId(item.id);
    setForm({
      name: item.name || "",
      city: item.city || "",
      service_area: item.service_area || "",
      manager_name: item.manager_name || "",
      manager_phone: item.manager_phone || "",
      address: item.address || "",
      status: item.status || "active",
    });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await saveBranch(form, editingId || undefined);
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ذخیره شعبه");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("این شعبه حذف شود؟")) return;
    setError(null);
    try {
      await deleteBranch(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در حذف شعبه");
    }
  };

  return (
    <div className="space-y-6 text-slate-100" dir="rtl">
      <div className="rounded-3xl border border-amber-400/20 bg-gradient-to-l from-slate-950 via-slate-900 to-amber-950/30 p-5 shadow-xl shadow-black/20">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-amber-300">Carrtell Franchise</p>
            <h1 className="mt-1 text-2xl font-black text-white">مدیریت شعب</h1>
            <p className="mt-2 text-sm text-slate-300">تعریف شعبه، محدوده فعالیت، مدیر شعبه و آماده‌سازی برای فرانچایز.</p>
          </div>
          <button onClick={load} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm hover:bg-white/15">
            <RefreshCcw className="h-4 w-4" /> بروزرسانی
          </button>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-400/30 bg-red-950/40 p-4 text-sm text-red-100">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form onSubmit={submit} className="rounded-3xl border border-white/10 bg-slate-950/80 p-5 shadow-xl shadow-black/20">
          <div className="mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-amber-300" />
            <h2 className="font-bold text-white">{editingId ? "ویرایش شعبه" : "ثبت شعبه جدید"}</h2>
          </div>
          <div className="space-y-3">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="نام شعبه مثل شعبه پرند" className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none" />
            <input value={form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="شهر" className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none" />
            <textarea value={form.service_area || ""} onChange={(e) => setForm({ ...form, service_area: e.target.value })} placeholder="محدوده فعالیت مثل پرند، رباط کریم، تهرانسر" rows={3} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none" />
            <input value={form.manager_name || ""} onChange={(e) => setForm({ ...form, manager_name: e.target.value })} placeholder="مدیر شعبه" className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none" />
            <input value={form.manager_phone || ""} onChange={(e) => setForm({ ...form, manager_phone: e.target.value })} placeholder="شماره تماس مدیر" className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none" />
            <textarea value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="آدرس شعبه" rows={2} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none" />
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as BranchInput["status"] })} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white focus:border-amber-400 focus:outline-none">
              <option value="active">فعال</option>
              <option value="inactive">غیرفعال</option>
            </select>
          </div>
          <div className="mt-5 flex gap-2">
            <button disabled={saving || !form.name.trim()} className="flex-1 rounded-2xl bg-amber-400 px-4 py-3 font-bold text-slate-950 disabled:opacity-50">{saving ? "در حال ذخیره..." : "ذخیره"}</button>
            {editingId && <button type="button" onClick={resetForm} className="rounded-2xl border border-white/10 px-4 py-3 text-slate-200">انصراف</button>}
          </div>
        </form>

        <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-5 shadow-xl shadow-black/20">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="font-bold text-white">لیست شعب</h2>
            <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900 px-3 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جستجو..." className="bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
            </label>
          </div>
          {loading ? (
            <div className="rounded-2xl bg-white/5 p-8 text-center text-slate-300">در حال دریافت...</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl bg-white/5 p-8 text-center text-slate-300">شعبه‌ای ثبت نشده است.</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-xl bg-amber-400/15 p-2 text-amber-300"><Building2 className="h-5 w-5" /></span>
                      <div>
                        <h3 className="font-bold text-white">{item.name}</h3>
                        <p className="text-xs text-slate-400">{item.city || "بدون شهر"}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs ${item.status === "active" ? "bg-emerald-400/15 text-emerald-300" : "bg-slate-500/20 text-slate-300"}`}>{item.status === "active" ? "فعال" : "غیرفعال"}</span>
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-slate-300">
                    <p>محدوده: {item.service_area || "-"}</p>
                    <p>مدیر: {item.manager_name || "-"}</p>
                    <p>تماس: {item.manager_phone || "-"}</p>
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
