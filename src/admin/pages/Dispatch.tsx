import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  CarFront,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  RefreshCw,
  Route,
  UserRoundCheck,
  Wrench,
} from 'lucide-react';
import {
  assignServiceRequest,
  dispatchStatusLabels,
  getAvailableDrivers,
  getDispatchRequests,
  getFleetVehicles,
  moveServiceRequestInQueue,
  updateServiceStatus,
  type DispatchStatus,
} from '../services/dispatchApi';

type Row = Record<string, any>;

const tabs: Array<{ key: string; label: string; statuses?: DispatchStatus[] }> = [
  { key: 'action', label: 'پرداخت‌شده و آماده تخصیص', statuses: ['pending_review', 'confirmed'] },
  { key: 'assigned', label: 'ارسال‌شده برای سرویس‌کار', statuses: ['assigned'] },
  { key: 'all', label: 'همه موارد این صف' },
];

export default function Dispatch() {
  const [rows, setRows] = useState<Row[]>([]);
  const [drivers, setDrivers] = useState<Row[]>([]);
  const [fleet, setFleet] = useState<Row[]>([]);
  const [tab, setTab] = useState('action');
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selectedFleet, setSelectedFleet] = useState<Record<string, string>>({});
  const [selectedDriver, setSelectedDriver] = useState<Record<string, string>>({});
  const [advanced, setAdvanced] = useState<Record<string, boolean>>({});

  async function load() {
    setLoading(true); setError('');
    try {
      const [requests, driverList, fleetList] = await Promise.all([getDispatchRequests('all'), getAvailableDrivers(), getFleetVehicles()]);
      setRows(requests); setDrivers(driverList); setFleet(fleetList);
    } catch (e: any) { setError(e?.message || 'خطا در دریافت عملیات سرویس'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  const summary = useMemo(() => ({
    action: rows.filter((r) => ['pending_review','confirmed'].includes(r.status)).length,
    assigned: rows.filter((r) => r.status === 'assigned').length,
    active: rows.filter((r) => ['en_route','arrived','in_progress'].includes(r.status)).length,
    completed: rows.filter((r) => r.status === 'completed').length,
  }), [rows]);

  const visibleRows = useMemo(() => {
    const selected = tabs.find((item) => item.key === tab);
    const assignmentRows = rows.filter((row) => ['pending_review','confirmed','assigned'].includes(String(row.status)));
    const paidRows = assignmentRows.filter((row) => {
      const paymentStatus = String(row.payment_status || row.order?.payment_status || '').toLowerCase();
      return paymentStatus === 'paid';
    });
    if (tab === 'action') return paidRows.filter((row) => ['pending_review','confirmed'].includes(String(row.status)));
    if (tab === 'assigned') return assignmentRows.filter((row) => row.status === 'assigned');
    if (!selected?.statuses) return assignmentRows;
    return assignmentRows.filter((row) => selected.statuses!.includes(row.status as DispatchStatus));
  }, [rows, tab]);

  async function handleAssign(row: Row) {
    const driverId = selectedDriver[row.id] || row.assigned_driver_id || row.driver_id || '';
    if (!driverId) return setError('یک سرویس‌کار انتخاب کن.');
    if (!row.preferred_date || !row.preferred_time) return setError('تاریخ و ساعت رزرو این سفارش کامل نیست. قبل از اعزام اصلاحش کن.');
    setSavingId(row.id); setError(''); setMessage('');
    try {
      await assignServiceRequest(row.id, driverId, selectedFleet[row.id] || row.fleet_vehicle_id || undefined, row.scheduled_at || undefined);
      setMessage(`مأموریت برای ${drivers.find((d) => d.id === driverId)?.full_name || 'سرویس‌کار'} ارسال شد.`);
      await load();
    } catch (e: any) { setError(e?.message || 'تخصیص سرویس‌کار انجام نشد.'); }
    finally { setSavingId(''); }
  }

  async function moveQueue(row: Row, direction: 'up' | 'down') {
    setSavingId(row.id); setError('');
    try { await moveServiceRequestInQueue(row.id, direction); await load(); }
    catch (e: any) { setError(e?.message || 'تغییر ترتیب مأموریت انجام نشد.'); }
    finally { setSavingId(''); }
  }

  async function changeStatus(row: Row, next: DispatchStatus) {
    setSavingId(row.id); setError(''); setMessage('');
    try { await updateServiceStatus(row.id, next); setMessage(`وضعیت به «${dispatchStatusLabels[next]}» تغییر کرد.`); await load(); }
    catch (e: any) { setError(e?.message || 'تغییر وضعیت انجام نشد.'); }
    finally { setSavingId(''); }
  }

  return <div className="space-y-5" dir="rtl">
    <section className="rounded-[28px] border border-slate-800 bg-gradient-to-l from-amber-950/35 via-slate-900 to-slate-950 p-5 md:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div><div className="mb-2 flex items-center gap-2 text-xs font-black text-amber-300"><Wrench className="h-4 w-4" /> صف تخصیص سرویس‌کار</div><h1 className="text-2xl font-black text-white">فقط سفارش‌های پرداخت‌شده و آماده اعزام</h1><p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">اینجا فقط سفارش‌هایی را می‌بینی که پرداختشان قطعی شده. هر سفارش را باز کن، سرویس‌کار را انتخاب کن و ماموریت را ارسال کن. ادامه مسیر را از «روند مأموریت‌ها» ببین.</p></div>
        <button onClick={() => void load()} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm font-black text-slate-200"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> بروزرسانی</button>
      </div>
    </section>

    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat icon={<AlertTriangle />} title="نیازمند اقدام" value={summary.action} tone="amber" />
      <Stat icon={<UserRoundCheck />} title="تخصیص‌شده" value={summary.assigned} tone="sky" />
      <Stat icon={<Route />} title="مأموریت فعال" value={summary.active} tone="violet" />
      <Stat icon={<CheckCircle2 />} title="تکمیل‌شده" value={summary.completed} tone="emerald" />
    </section>

    <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-2">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between"><div className="flex gap-2 overflow-x-auto">{tabs.map((item) => <button key={item.key} onClick={() => setTab(item.key)} className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-black transition ${tab === item.key ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>{item.label}</button>)}</div><a href="/admin/service-operations" className="whitespace-nowrap rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-2.5 text-center text-xs font-black text-sky-200">مشاهده روند مأموریت‌ها ←</a></div>
    </section>

    {message && <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-200">{message}</div>}
    {error && <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm font-bold text-rose-200">{error}</div>}

    {!drivers.length && !loading && <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">هیچ سرویس‌کار فعالی پیدا نشد. از <a className="font-black underline" href="/admin/technicians">سرویس‌کاران</a> یک نفر بساز یا فعال کن.</div>}

    <div className="grid gap-4">
      {visibleRows.map((row) => {
        const unattendedMinutes = row.created_at ? Math.floor((Date.now() - new Date(row.created_at).getTime()) / 60000) : 0;
        const late = !row.assigned_driver_id && unattendedMinutes >= 10 && !['completed','cancelled'].includes(row.status);
        const orderItems = Array.isArray(row.order?.items) ? row.order.items : Array.isArray(row.service_items) ? row.service_items : [];
        const driverValue = selectedDriver[row.id] ?? row.assigned_driver_id ?? row.driver_id ?? '';
        return <article key={row.id} className="overflow-hidden rounded-[28px] border border-slate-800 bg-slate-900/80 shadow-xl shadow-black/10">
          {late && <div className="border-b border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs font-black text-rose-200">این سفارش بیش از {unattendedMinutes.toLocaleString('fa-IR')} دقیقه بدون سرویس‌کار مانده است.</div>}
          <div className="grid gap-0 xl:grid-cols-[1fr_380px]">
            <div className="p-5">
              <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-amber-400/10 px-3 py-1 text-[11px] font-black text-amber-200">{dispatchStatusLabels[row.status as DispatchStatus] || row.status}</span>{row.order?.payment_status && <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-black text-emerald-200">پرداخت: {row.order.payment_status}</span>}{row.request_number && <span className="rounded-full bg-slate-950 px-3 py-1 text-[11px] text-slate-500">{row.request_number}</span>}</div>
              <h2 className="mt-3 text-xl font-black text-white">{row.customer_name || 'مشتری بدون نام'}</h2>
              <p className="mt-1 text-sm text-slate-400">{row.customer_phone || 'بدون شماره'} · {row.vehicle_title || row.car_name || 'خودرو ثبت نشده'}</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><Info label="تاریخ" value={formatServiceDate(row.preferred_date)} accent /><Info label="ساعت" value={row.preferred_time || '-'} accent /><Info label="مبلغ" value={row.order?.total_amount ? `${Number(row.order.total_amount).toLocaleString('fa-IR')} تومان` : '-'} /><Info label="سرویس‌کار" value={row.assigned_driver_name || 'هنوز تخصیص ندارد'} /></div>
              <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/65 p-3 text-sm leading-7 text-slate-300">{row.address_text || 'آدرس ثبت نشده'}</div>
              <div className="mt-3"><div className="mb-2 text-[11px] font-black text-slate-500">اقلام و خدمات برای تحویل به سرویس‌کار</div>{orderItems.length ? <div className="flex flex-wrap gap-2">{orderItems.slice(0,12).map((item:any,index:number) => <span key={`${item.id || item.product_id || index}`} className="rounded-xl border border-slate-800 bg-slate-950/65 px-3 py-2 text-xs text-slate-300">{item.product_name || item.name || item.title || 'محصول'} × {Number(item.quantity || item.qty || 1).toLocaleString('fa-IR')}</span>)}</div> : <span className="text-xs text-slate-600">اقلام جداگانه ثبت نشده‌اند.</span>}</div>
            </div>

            <aside className="border-t border-slate-800 bg-slate-950/55 p-5 xl:border-r xl:border-t-0">
              {['pending_review','confirmed'].includes(row.status) ? <>
                <h3 className="mb-1 font-black text-white">تخصیص مأموریت</h3><p className="mb-4 text-xs leading-6 text-slate-500">فقط سرویس‌کار را انتخاب کن. خودرو اختیاری است.</p>
                <label className="mb-1 block text-[11px] font-black text-slate-500">سرویس‌کار</label>
                <select value={driverValue} onChange={(e) => setSelectedDriver((prev) => ({ ...prev, [row.id]: e.target.value }))} className="mb-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-amber-400"><option value="">انتخاب سرویس‌کار</option>{drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.full_name}{driver.phone ? ` · ${driver.phone}` : ''}</option>)}</select>
                <label className="mb-1 block text-[11px] font-black text-slate-500">خودروی سرویس (اختیاری)</label>
                <select value={selectedFleet[row.id] ?? row.fleet_vehicle_id ?? ''} onChange={(e) => setSelectedFleet((prev) => ({ ...prev, [row.id]: e.target.value }))} className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-amber-400"><option value="">بدون خودرو / بعداً انتخاب می‌کنم</option>{fleet.map((item) => <option key={item.id} value={item.id}>{item.title || item.plate_number || item.id}</option>)}</select>
                <button disabled={savingId === row.id || !driverValue} onClick={() => void handleAssign(row)} className="w-full rounded-xl bg-amber-400 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-40">{savingId === row.id ? 'در حال تخصیص...' : 'تخصیص و ارسال مأموریت'}</button>
              </> : <>
                <h3 className="font-black text-white">وضعیت مأموریت</h3><p className="mt-1 text-xs leading-6 text-slate-500">ادامه کار باید از پنل سرویس‌کار انجام شود.</p>
                <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><div className="text-xs text-slate-500">سرویس‌کار</div><b className="mt-1 block text-sm text-white">{row.assigned_driver_name || 'نامشخص'}</b>{row.queue_position && <div className="mt-3 text-xs text-amber-300">ترتیب مأموریت: {Number(row.queue_position).toLocaleString('fa-IR')}</div>}</div>
                <a href={`/driver/jobs/${row.id}`} className="mt-3 block rounded-xl border border-amber-400/30 px-3 py-3 text-center text-sm font-black text-amber-200 hover:bg-amber-400 hover:text-slate-950">مشاهده مأموریت</a>
              </>}

              <button onClick={() => setAdvanced((prev) => ({ ...prev, [row.id]: !prev[row.id] }))} className="mt-4 flex w-full items-center justify-between rounded-xl border border-slate-800 px-3 py-2.5 text-xs font-black text-slate-500"><span>تنظیمات پیشرفته</span>{advanced[row.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button>
              {advanced[row.id] && <div className="mt-3 space-y-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-3"><label className="block text-[10px] font-black text-slate-600">تغییر دستی وضعیت</label><select value={row.status} onChange={(e) => void changeStatus(row, e.target.value as DispatchStatus)} disabled={savingId === row.id} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white">{Object.entries(dispatchStatusLabels).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select><div className="grid grid-cols-2 gap-2"><button disabled={!row.assigned_driver_id || savingId === row.id} onClick={() => void moveQueue(row,'up')} className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-400 disabled:opacity-30">بالاتر</button><button disabled={!row.assigned_driver_id || savingId === row.id} onClick={() => void moveQueue(row,'down')} className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-400 disabled:opacity-30">پایین‌تر</button></div></div>}
            </aside>
          </div>
        </article>;
      })}
      {!visibleRows.length && !loading && <div className="rounded-[28px] border border-dashed border-slate-800 bg-slate-900/40 p-10 text-center"><CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" /><p className="mt-3 text-sm font-black text-slate-300">در این مرحله سفارشی وجود ندارد.</p></div>}
    </div>
  </div>;
}

function Stat({ icon, title, value, tone }: { icon: ReactNode; title: string; value: number; tone: 'amber'|'sky'|'violet'|'emerald' }) {
  const styles = { amber:'border-amber-500/20 bg-amber-500/10 text-amber-300', sky:'border-sky-500/20 bg-sky-500/10 text-sky-300', violet:'border-violet-500/20 bg-violet-500/10 text-violet-300', emerald:'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' }[tone];
  return <div className={`rounded-2xl border p-4 ${styles}`}><div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold text-slate-400">{title}</span>{icon}</div><b className="text-2xl text-white">{value.toLocaleString('fa-IR')}</b></div>;
}
function Info({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) { return <div className="rounded-xl border border-slate-800 bg-slate-950/55 p-3"><div className="text-[10px] font-bold text-slate-600">{label}</div><div className={`mt-1 truncate text-xs font-black ${accent ? 'text-amber-300' : 'text-slate-200'}`}>{value}</div></div>; }
function formatServiceDate(value?: string | null) { if (!value) return '-'; const date = new Date(`${value}T00:00:00`); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('fa-IR',{ month:'short', day:'numeric', weekday:'short' }).format(date); }
