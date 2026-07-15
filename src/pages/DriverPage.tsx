import { useEffect, useMemo, useState } from 'react';
import { Camera, CheckCircle2, ChevronDown, ChevronUp, Gauge, History, Save, Wrench } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { completeServiceRequest, dispatchStatusLabels, getDriverTasks, updateServiceStatus } from '../admin/services/dispatchApi';
import { getServiceCatalogItems, getServiceHistory, saveServiceHistory, type ServiceCatalogItem, type ServiceHistoryRecord } from '../customer/services/serviceHistoryApi';
import { getCustomerVehicles, updateVehicleKilometers } from '../customer/services/garageApi';

const field = 'w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-amber-400';

type Draft = {
  finalKm: string;
  nextKm: string;
  serviceDate: string;
  serviceType: string;
  notes: string;
  warnings: string;
  products: string;
  changedIds: string[];
  odometerImage: string;
  beforeImage: string;
  afterImage: string;
  invoiceImage: string;
};

function emptyDraft(task?: any): Draft {
  const current = Number(task?.current_km || task?.final_km || 0);
  const interval = Number(task?.service_interval_km || 5000);
  return {
    finalKm: current ? String(current) : '',
    nextKm: current ? String(current + interval) : '',
    serviceDate: new Date().toISOString().slice(0, 10),
    serviceType: task?.service_title || 'سرویس دوره‌ای روغن و فیلتر',
    notes: '', warnings: '', products: '', changedIds: [],
    odometerImage: '', beforeImage: '', afterImage: '', invoiceImage: '',
  };
}

export default function DriverPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [catalog, setCatalog] = useState<ServiceCatalogItem[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [openId, setOpenId] = useState('');
  const [savingId, setSavingId] = useState('');
  const [history, setHistory] = useState<Record<string, ServiceHistoryRecord[]>>({});

  async function load() {
    setLoading(true);
    try {
      const [taskRows, itemRows] = await Promise.all([getDriverTasks(user?.id), getServiceCatalogItems()]);
      setTasks(taskRows);
      setCatalog(itemRows);
      setDrafts(current => {
        const next = { ...current };
        taskRows.forEach((task: any) => { if (!next[task.id]) next[task.id] = emptyDraft(task); });
        return next;
      });
    } finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [user?.id]);

  async function toggleDetails(task: any) {
    const next = openId === task.id ? '' : task.id;
    setOpenId(next);
    if (next && !history[task.id] && task.customer_phone) {
      const rows = await getServiceHistory(task.customer_phone, task.customer_vehicle_id || task.vehicle_id || null);
      setHistory(prev => ({ ...prev, [task.id]: rows.slice(0, 5) }));
    }
  }

  function updateDraft(id: string, patch: Partial<Draft>) {
    setDrafts(prev => ({ ...prev, [id]: { ...(prev[id] || emptyDraft()), ...patch } }));
  }

  function toggleChanged(id: string, itemId: string) {
    const selected = drafts[id]?.changedIds || [];
    updateDraft(id, { changedIds: selected.includes(itemId) ? selected.filter(x => x !== itemId) : [...selected, itemId] });
  }

  async function finish(task: any) {
    const draft = drafts[task.id] || emptyDraft(task);
    const finalKm = Number(draft.finalKm || 0);
    const nextKm = Number(draft.nextKm || 0);
    if (!finalKm) return alert('کیلومتر فعلی خودرو را وارد کن.');
    if (nextKm && nextKm <= finalKm) return alert('کیلومتر سرویس بعدی باید بیشتر از کیلومتر فعلی باشد.');
    setSavingId(task.id);
    try {
      const changedItems = catalog.filter(item => draft.changedIds.includes(item.id)).map(item => ({ id: item.id, title: item.title, emoji: item.emoji || '🔧' }));
      await completeServiceRequest(task.id, { final_km: finalKm, driver_notes: draft.notes, used_products: draft.products.split(',').map(x => x.trim()).filter(Boolean) });
      await saveServiceHistory({
        customer_phone: task.customer_phone || '',
        vehicle_id: task.customer_vehicle_id || task.vehicle_id || null,
        vehicle_title: task.vehicle_title || task.car_name || null,
        service_request_id: task.id,
        source: 'carrtell',
        performed_by_name: (user as any)?.user_metadata?.full_name || task.assigned_driver_name || 'سرویس‌کار Carrtell',
        service_type: draft.serviceType,
        service_date: draft.serviceDate,
        service_km: finalKm,
        next_service_km: nextKm || null,
        changed_items: changedItems,
        products_used: draft.products.split(',').map(x => x.trim()).filter(Boolean),
        notes: draft.notes,
        warning_notes: draft.warnings,
        odometer_image_url: draft.odometerImage || null,
        before_image_url: draft.beforeImage || null,
        after_image_url: draft.afterImage || null,
        invoice_image_url: draft.invoiceImage || null,
      });
      const vehicles = await getCustomerVehicles(task.customer_phone || '');
      const vehicle = vehicles.find(v => v.id === (task.customer_vehicle_id || task.vehicle_id)) || vehicles.find(v => v.is_default) || vehicles[0];
      if (vehicle) await updateVehicleKilometers(vehicle, finalKm, finalKm);
      alert('اطلاعات کامل سرویس در پرونده خودرو ثبت شد.');
      await load();
    } catch (error: any) { alert(error?.message || 'ثبت پایان سرویس انجام نشد.'); }
    finally { setSavingId(''); }
  }

  return (
    <main className="min-h-screen bg-slate-950 p-4 pt-32 text-white md:p-6 md:pt-32" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between gap-3 rounded-3xl border border-amber-400/20 bg-gradient-to-l from-amber-500/15 via-slate-900 to-slate-950 p-5">
          <div><h1 className="text-2xl font-black">پنل سرویس‌کار کارتل</h1><p className="mt-1 text-sm text-slate-400">ثبت عملیات و تکمیل پرونده سلامت خودرو پس از پایان سرویس</p></div>
          <button onClick={load} className="rounded-xl bg-amber-400 px-4 py-2 font-bold text-slate-950">بروزرسانی</button>
        </div>

        {loading && <div className="text-slate-300">در حال بارگذاری...</div>}
        <div className="grid gap-4">
          {tasks.map(task => {
            const draft = drafts[task.id] || emptyDraft(task);
            const previous = history[task.id] || [];
            return <section key={task.id} className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/90 shadow-xl">
              <div className="p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div><div className="text-lg font-black">{task.customer_name || 'مشتری'} — {task.vehicle_title || task.car_name || 'خودرو نامشخص'}</div><div className="mt-1 text-sm text-slate-400">{task.customer_phone} • کیلومتر ثبت‌شده: {task.current_km?.toLocaleString('fa-IR') || '-'}</div><div className="mt-3 rounded-2xl bg-slate-950 p-3 text-sm text-slate-300">{task.address_text || 'آدرس ثبت نشده'}</div></div>
                  <span className="w-fit rounded-full bg-amber-400/10 px-3 py-1 text-sm text-amber-200">{dispatchStatusLabels[task.status as keyof typeof dispatchStatusLabels] || task.status}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => updateServiceStatus(task.id, 'en_route').then(load)} className="rounded-xl bg-white/10 px-3 py-2 text-sm font-bold">شروع حرکت</button>
                  <button onClick={() => updateServiceStatus(task.id, 'arrived').then(load)} className="rounded-xl bg-white/10 px-3 py-2 text-sm font-bold">رسیدم به محل</button>
                  <button onClick={() => updateServiceStatus(task.id, 'in_progress').then(load)} className="rounded-xl bg-white/10 px-3 py-2 text-sm font-bold">شروع سرویس</button>
                  <button onClick={() => toggleDetails(task)} className="mr-auto flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-sm font-bold text-amber-100"><Wrench size={17}/> ثبت اطلاعات سرویس {openId===task.id?<ChevronUp size={16}/>:<ChevronDown size={16}/>}</button>
                </div>
              </div>

              {openId === task.id && <div className="border-t border-white/10 bg-slate-950/45 p-5">
                {previous.length > 0 && <div className="mb-5 rounded-3xl border border-cyan-400/15 bg-cyan-400/5 p-4"><div className="mb-3 flex items-center gap-2 font-black text-cyan-100"><History size={18}/> آخرین سوابق این خودرو</div><div className="grid gap-2 md:grid-cols-2">{previous.map(row=><div key={row.id} className="rounded-2xl bg-slate-950 p-3 text-sm text-slate-300"><b className="text-white">{row.service_type}</b><div className="mt-1">کیلومتر: {Number(row.service_km||0).toLocaleString('fa-IR')} — بعدی: {Number(row.next_service_km||0).toLocaleString('fa-IR')}</div>{row.changed_items?.length?<div className="mt-1 text-xs text-cyan-200">{row.changed_items.map(x=>`${x.emoji||'🔧'} ${x.title}`).join('، ')}</div>:null}</div>)}</div></div>}

                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  <label className="text-xs text-slate-400">تاریخ سرویس<input type="date" value={draft.serviceDate} onChange={e=>updateDraft(task.id,{serviceDate:e.target.value})} className={`mt-1 ${field}`}/></label>
                  <label className="text-xs text-slate-400">کیلومتر فعلی<input inputMode="numeric" value={draft.finalKm} onChange={e=>{const v=e.target.value; const interval=Number(task.service_interval_km||5000);updateDraft(task.id,{finalKm:v,nextKm:v?String(Number(v)+interval):''});}} className={`mt-1 ${field}`}/></label>
                  <label className="text-xs text-slate-400">کیلومتر سرویس بعدی<input inputMode="numeric" value={draft.nextKm} onChange={e=>updateDraft(task.id,{nextKm:e.target.value})} className={`mt-1 ${field}`}/></label>
                  <label className="text-xs text-slate-400">عنوان سرویس<input value={draft.serviceType} onChange={e=>updateDraft(task.id,{serviceType:e.target.value})} className={`mt-1 ${field}`}/></label>
                </div>

                <div className="mt-5"><div className="mb-3 flex items-center gap-2 font-black"><CheckCircle2 className="text-emerald-300" size={19}/> اقلام تعویض‌شده</div><div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">{catalog.map(item=>{const active=draft.changedIds.includes(item.id);return <button type="button" key={item.id} onClick={()=>toggleChanged(task.id,item.id)} className={`rounded-2xl border p-3 text-right text-sm transition ${active?'border-emerald-400 bg-emerald-400/15 text-emerald-100':'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'}`}><span className="ml-2">{item.emoji||'🔧'}</span>{item.title}</button>})}</div></div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <textarea value={draft.products} onChange={e=>updateDraft(task.id,{products:e.target.value})} className={field} rows={3} placeholder="محصولات مصرف‌شده؛ نام‌ها را با کاما جدا کن"/>
                  <textarea value={draft.notes} onChange={e=>updateDraft(task.id,{notes:e.target.value})} className={field} rows={3} placeholder="توضیحات سرویس‌کار"/>
                  <textarea value={draft.warnings} onChange={e=>updateDraft(task.id,{warnings:e.target.value})} className={`md:col-span-2 ${field}`} rows={2} placeholder="هشدار یا موردی که در سرویس بعدی باید بررسی شود"/>
                </div>

                <div className="mt-5"><div className="mb-3 flex items-center gap-2 font-black"><Camera size={19} className="text-amber-300"/> لینک تصاویر سرویس</div><div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4"><input value={draft.odometerImage} onChange={e=>updateDraft(task.id,{odometerImage:e.target.value})} className={field} placeholder="لینک عکس کیلومترشمار"/><input value={draft.beforeImage} onChange={e=>updateDraft(task.id,{beforeImage:e.target.value})} className={field} placeholder="لینک عکس قبل سرویس"/><input value={draft.afterImage} onChange={e=>updateDraft(task.id,{afterImage:e.target.value})} className={field} placeholder="لینک عکس بعد سرویس"/><input value={draft.invoiceImage} onChange={e=>updateDraft(task.id,{invoiceImage:e.target.value})} className={field} placeholder="لینک عکس فاکتور"/></div></div>

                <button disabled={savingId===task.id} onClick={()=>finish(task)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-4 font-black text-slate-950 disabled:opacity-60"><Save size={19}/>{savingId===task.id?'در حال ثبت...':'ثبت پایان سرویس و بروزرسانی پرونده خودرو'}</button>
              </div>}
            </section>;
          })}
          {!tasks.length && !loading && <div className="rounded-2xl border border-white/10 bg-slate-900 p-8 text-center text-slate-400">مأموریت فعالی برای شما ثبت نشده است.</div>}
        </div>
      </div>
    </main>
  );
}
