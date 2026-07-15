import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

type Campaign = {
  id: string;
  title: string;
  subtitle?: string | null;
  banner_url?: string | null;
  link_url?: string | null;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  starts_at?: string | null;
  ends_at?: string | null;
  is_active: boolean;
  priority: number;
  created_at?: string;
};

type Product = {
  id: string;
  name?: string | null;
  title?: string | null;
  brand?: string | null;
  price?: number | null;
  inventory?: number | null;
  stock?: number | null;
  is_active?: boolean | null;
};

type CampaignProduct = {
  id: string;
  campaign_id: string;
  product_id: string;
  special_price?: number | null;
  sort_order?: number | null;
};

const emptyForm = {
  title: '',
  subtitle: '',
  banner_url: '',
  link_url: '',
  discount_type: 'percent' as 'percent' | 'fixed',
  discount_value: 0,
  starts_at: '',
  ends_at: '',
  is_active: true,
  priority: 10,
};

const inputClass = 'w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-amber-400';
const labelClass = 'mb-2 block text-xs font-bold text-slate-300';

function toDatetimeLocal(value?: string | null) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toDbDatetime(value: string) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function getProductName(product?: Product) {
  if (!product) return 'محصول نامشخص';
  return product.name || product.title || product.brand || 'محصول بدون نام';
}

export default function AdminDiscountsCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [campaignProducts, setCampaignProducts] = useState<CampaignProduct[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [specialPrice, setSpecialPrice] = useState<string>('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const productMap = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach((p) => map.set(p.id, p));
    return map;
  }, [products]);

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const [campaignRes, productRes, relationRes] = await Promise.all([
        supabase.from('campaigns').select('*').order('priority', { ascending: true }).order('created_at', { ascending: false }),
        supabase.from('products').select('*').limit(200),
        supabase.from('campaign_products').select('*').order('sort_order', { ascending: true }),
      ]);

      if (campaignRes.error) throw campaignRes.error;
      if (relationRes.error) throw relationRes.error;

      setCampaigns((campaignRes.data || []) as Campaign[]);
      setCampaignProducts((relationRes.data || []) as CampaignProduct[]);
      if (productRes.error) {
        setProducts([]);
        setMessage('جدول محصولات خوانده نشد؛ مدیریت کمپین فعال است اما انتخاب محصول فعلاً خالی می‌ماند.');
      } else {
        setProducts((productRes.data || []) as Product[]);
      }
    } catch (err: any) {
      setError(err?.message || 'خطا در دریافت اطلاعات کمپین‌ها. مطمئن شو SQL کمپین اجرا شده باشد.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function editCampaign(campaign: Campaign) {
    setEditingId(campaign.id);
    setForm({
      title: campaign.title || '',
      subtitle: campaign.subtitle || '',
      banner_url: campaign.banner_url || '',
      link_url: campaign.link_url || '',
      discount_type: campaign.discount_type || 'percent',
      discount_value: Number(campaign.discount_value || 0),
      starts_at: toDatetimeLocal(campaign.starts_at),
      ends_at: toDatetimeLocal(campaign.ends_at),
      is_active: Boolean(campaign.is_active),
      priority: Number(campaign.priority || 10),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveCampaign() {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      if (!form.title.trim()) throw new Error('عنوان کمپین الزامی است.');
      const payload = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        banner_url: form.banner_url.trim() || null,
        link_url: form.link_url.trim() || null,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value || 0),
        starts_at: toDbDatetime(form.starts_at),
        ends_at: toDbDatetime(form.ends_at),
        is_active: form.is_active,
        priority: Number(form.priority || 10),
        updated_at: new Date().toISOString(),
      };

      const res = editingId
        ? await supabase.from('campaigns').update(payload).eq('id', editingId)
        : await supabase.from('campaigns').insert(payload);

      if (res.error) throw res.error;
      setMessage(editingId ? 'کمپین ویرایش شد.' : 'کمپین ساخته شد.');
      resetForm();
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'خطا در ذخیره کمپین.');
    } finally {
      setSaving(false);
    }
  }

  async function removeCampaign(id: string) {
    if (!confirm('این کمپین حذف شود؟')) return;
    setError('');
    const res = await supabase.from('campaigns').delete().eq('id', id);
    if (res.error) setError(res.error.message);
    else {
      setMessage('کمپین حذف شد.');
      await loadAll();
    }
  }

  async function toggleCampaign(campaign: Campaign) {
    const res = await supabase.from('campaigns').update({ is_active: !campaign.is_active, updated_at: new Date().toISOString() }).eq('id', campaign.id);
    if (res.error) setError(res.error.message);
    else await loadAll();
  }

  async function addProductToCampaign() {
    setError('');
    setMessage('');
    try {
      if (!selectedCampaignId) throw new Error('کمپین را انتخاب کن.');
      if (!selectedProductId) throw new Error('محصول را انتخاب کن.');
      const res = await supabase.from('campaign_products').upsert({
        campaign_id: selectedCampaignId,
        product_id: selectedProductId,
        special_price: specialPrice ? Number(specialPrice) : null,
        sort_order: 10,
      }, { onConflict: 'campaign_id,product_id' });
      if (res.error) throw res.error;
      setSelectedProductId('');
      setSpecialPrice('');
      setMessage('محصول به کمپین اضافه شد.');
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'خطا در اتصال محصول به کمپین.');
    }
  }

  async function removeCampaignProduct(id: string) {
    const res = await supabase.from('campaign_products').delete().eq('id', id);
    if (res.error) setError(res.error.message);
    else await loadAll();
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 p-4 text-white md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold text-amber-300">🎯 مرکز فروش ویژه Carrtell</p>
              <h1 className="mt-2 text-2xl font-black md:text-3xl">مدیریت تخفیف‌ها و کمپین‌ها</h1>
              <p className="mt-2 text-sm text-slate-400">ساخت جشنواره، اتصال محصول، زمان‌بندی فروش ویژه و مدیریت بنر کمپین‌ها.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <a href="/admin/quick-links" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10">مرکز مسیرها</a>
              <a href="/admin/navigation-audit" className="rounded-2xl bg-amber-400 px-4 py-2 font-bold text-slate-950 hover:bg-amber-300">تست سلامت</a>
            </div>
          </div>
        </div>

        {(message || error) && (
          <div className={`rounded-2xl border px-4 py-3 text-sm ${error ? 'border-red-400/30 bg-red-500/10 text-red-100' : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'}`}>
            {error || message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
            <h2 className="text-xl font-black">{editingId ? 'ویرایش کمپین' : 'ساخت کمپین جدید'}</h2>
            <div className="mt-5 space-y-4">
              <div>
                <label className={labelClass}>عنوان کمپین</label>
                <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثلاً جشنواره روغن موتور" />
              </div>
              <div>
                <label className={labelClass}>زیرعنوان</label>
                <input className={inputClass} value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="توضیح کوتاه کمپین" />
              </div>
              <div>
                <label className={labelClass}>آدرس تصویر بنر</label>
                <input className={inputClass} value={form.banner_url} onChange={(e) => setForm({ ...form, banner_url: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <label className={labelClass}>لینک بنر</label>
                <input className={inputClass} value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="/shop یا /admin/discounts" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>نوع تخفیف</label>
                  <select className={inputClass} value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value as 'percent' | 'fixed' })}>
                    <option value="percent">درصدی</option>
                    <option value="fixed">مبلغ ثابت</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>مقدار تخفیف</label>
                  <input className={inputClass} type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>شروع</label>
                  <input className={inputClass} type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>پایان</label>
                  <input className={inputClass} type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>اولویت نمایش</label>
                  <input className={inputClass} type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} />
                </div>
                <label className="flex items-end gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm font-bold">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                  فعال باشد
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={saveCampaign} disabled={saving} className="flex-1 rounded-2xl bg-amber-400 px-5 py-3 font-black text-slate-950 hover:bg-amber-300 disabled:opacity-60">
                  {saving ? 'در حال ذخیره...' : editingId ? 'ذخیره ویرایش' : 'ساخت کمپین'}
                </button>
                {editingId && <button onClick={resetForm} className="rounded-2xl border border-white/10 px-5 py-3 font-bold hover:bg-white/10">لغو</button>}
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-end">
                <div className="flex-1">
                  <label className={labelClass}>انتخاب کمپین</label>
                  <select className={inputClass} value={selectedCampaignId} onChange={(e) => setSelectedCampaignId(e.target.value)}>
                    <option value="">کمپین را انتخاب کن</option>
                    {campaigns.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className={labelClass}>انتخاب محصول</label>
                  <select className={inputClass} value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}>
                    <option value="">محصول را انتخاب کن</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{getProductName(p)}</option>)}
                  </select>
                </div>
                <div className="w-full md:w-40">
                  <label className={labelClass}>قیمت ویژه</label>
                  <input className={inputClass} type="number" value={specialPrice} onChange={(e) => setSpecialPrice(e.target.value)} placeholder="اختیاری" />
                </div>
                <button onClick={addProductToCampaign} className="rounded-2xl bg-sky-400 px-5 py-3 font-black text-slate-950 hover:bg-sky-300">افزودن محصول</button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-black">لیست کمپین‌ها</h2>
                <button onClick={loadAll} className="rounded-xl border border-white/10 px-3 py-2 text-xs hover:bg-white/10">بروزرسانی</button>
              </div>
              {loading ? (
                <div className="rounded-2xl bg-slate-950/60 p-6 text-center text-slate-400">در حال دریافت اطلاعات...</div>
              ) : campaigns.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/60 p-8 text-center text-slate-400">هنوز کمپینی ثبت نشده است.</div>
              ) : (
                <div className="space-y-4">
                  {campaigns.map((campaign) => {
                    const related = campaignProducts.filter((cp) => cp.campaign_id === campaign.id);
                    return (
                      <div key={campaign.id} className="rounded-3xl border border-white/10 bg-slate-950/60 p-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-black">{campaign.title}</h3>
                              <span className={`rounded-full px-3 py-1 text-xs font-bold ${campaign.is_active ? 'bg-emerald-400/15 text-emerald-200' : 'bg-slate-700 text-slate-300'}`}>{campaign.is_active ? 'فعال' : 'غیرفعال'}</span>
                              <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs text-amber-200">{campaign.discount_type === 'percent' ? `${campaign.discount_value}%` : `${Number(campaign.discount_value).toLocaleString('fa-IR')} تومان`}</span>
                            </div>
                            {campaign.subtitle && <p className="text-sm text-slate-400">{campaign.subtitle}</p>}
                            <div className="text-xs text-slate-500">اولویت: {campaign.priority} | محصولات: {related.length}</div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => toggleCampaign(campaign)} className="rounded-xl border border-white/10 px-3 py-2 text-xs hover:bg-white/10">{campaign.is_active ? 'غیرفعال' : 'فعال'}</button>
                            <button onClick={() => editCampaign(campaign)} className="rounded-xl bg-sky-400 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-sky-300">ویرایش</button>
                            <button onClick={() => removeCampaign(campaign.id)} className="rounded-xl bg-red-500/20 px-3 py-2 text-xs font-bold text-red-100 hover:bg-red-500/30">حذف</button>
                          </div>
                        </div>
                        {related.length > 0 && (
                          <div className="mt-4 grid gap-2 md:grid-cols-2">
                            {related.map((cp) => (
                              <div key={cp.id} className="flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-sm">
                                <span className="truncate">{getProductName(productMap.get(cp.product_id))}</span>
                                <div className="flex items-center gap-2">
                                  {cp.special_price ? <span className="text-xs text-amber-200">{Number(cp.special_price).toLocaleString('fa-IR')}</span> : null}
                                  <button onClick={() => removeCampaignProduct(cp.id)} className="rounded-lg px-2 py-1 text-red-200 hover:bg-red-500/20">حذف</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
