import { useEffect, useState } from "react";
import { deleteDiscount, getDiscounts, saveDiscount, toggleDiscount, type Discount } from "../services/discountsApi";

const empty: Discount = {
  code: "",
  title: "",
  description: "",
  discount_type: "percent",
  value: 0,
  min_order_amount: 0,
  max_discount_amount: null,
  usage_limit: null,
  per_user_limit: 1,
  is_active: true,
  target_type: "all",
  target_ids: [],
};

export default function Discounts() {
  const [items, setItems] = useState<Discount[]>([]);
  const [form, setForm] = useState<Discount>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setItems(await getDiscounts()); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveDiscount(form);
      setForm(empty);
      await load();
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 p-4 text-white" dir="rtl">
      <div>
        <h1 className="text-2xl font-black">کد تخفیف و کمپین فروش</h1>
        <p className="text-sm text-slate-400">تعریف کدهای درصدی، مبلغ ثابت، VIP و کمپین‌های فروش.</p>
      </div>

      <form onSubmit={submit} className="grid gap-3 rounded-3xl border border-white/10 bg-slate-900/70 p-4 md:grid-cols-3">
        <input className="rounded-xl bg-slate-950 px-3 py-2" placeholder="کد تخفیف" value={form.code} onChange={e=>setForm({...form, code:e.target.value})}/>
        <input className="rounded-xl bg-slate-950 px-3 py-2" placeholder="عنوان" value={form.title} onChange={e=>setForm({...form, title:e.target.value})}/>
        <select className="rounded-xl bg-slate-950 px-3 py-2" value={form.discount_type} onChange={e=>setForm({...form, discount_type:e.target.value as any})}>
          <option value="percent">درصدی</option><option value="fixed">مبلغ ثابت</option>
        </select>
        <input type="number" className="rounded-xl bg-slate-950 px-3 py-2" placeholder="مقدار" value={form.value} onChange={e=>setForm({...form, value:Number(e.target.value)})}/>
        <input type="number" className="rounded-xl bg-slate-950 px-3 py-2" placeholder="حداقل خرید" value={form.min_order_amount ?? 0} onChange={e=>setForm({...form, min_order_amount:Number(e.target.value)})}/>
        <input type="number" className="rounded-xl bg-slate-950 px-3 py-2" placeholder="سقف تخفیف" value={form.max_discount_amount ?? ""} onChange={e=>setForm({...form, max_discount_amount:e.target.value?Number(e.target.value):null})}/>
        <select className="rounded-xl bg-slate-950 px-3 py-2" value={form.target_type} onChange={e=>setForm({...form, target_type:e.target.value as any})}>
          <option value="all">همه</option><option value="vip">مشتری ویژه</option><option value="product">محصول</option><option value="category">دسته‌بندی</option><option value="brand">برند</option><option value="service">سرویس در محل</option>
        </select>
        <input type="number" className="rounded-xl bg-slate-950 px-3 py-2" placeholder="محدودیت استفاده" value={form.usage_limit ?? ""} onChange={e=>setForm({...form, usage_limit:e.target.value?Number(e.target.value):null})}/>
        <button disabled={saving} className="rounded-xl bg-amber-400 px-4 py-2 font-black text-slate-950">{form.id ? "ذخیره تغییرات" : "ساخت کد"}</button>
      </form>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70">
        {loading ? <div className="p-4">در حال دریافت...</div> : (
          <table className="w-full text-sm">
            <thead className="bg-slate-950/70 text-slate-300"><tr><th className="p-3 text-right">کد</th><th>نوع</th><th>مقدار</th><th>مصرف</th><th>وضعیت</th><th>عملیات</th></tr></thead>
            <tbody>
              {items.map(d => <tr key={d.id} className="border-t border-white/10">
                <td className="p-3"><b>{d.code}</b><div className="text-xs text-slate-400">{d.title}</div></td>
                <td>{d.discount_type === "percent" ? "درصدی" : "ثابت"}</td>
                <td>{Number(d.value).toLocaleString("fa-IR")}</td>
                <td>{d.used_count ?? 0}/{d.usage_limit ?? "∞"}</td>
                <td>{d.is_active ? "فعال" : "غیرفعال"}</td>
                <td className="space-x-2 space-x-reverse p-3">
                  <button onClick={()=>setForm(d)} className="rounded-lg bg-slate-700 px-3 py-1">ویرایش</button>
                  <button onClick={()=>d.id && toggleDiscount(d.id, !d.is_active).then(load)} className="rounded-lg bg-blue-600 px-3 py-1">تغییر وضعیت</button>
                  <button onClick={()=>d.id && deleteDiscount(d.id).then(load)} className="rounded-lg bg-red-600 px-3 py-1">حذف</button>
                </td>
              </tr>)}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
