import { useEffect, useMemo, useState } from 'react';
import {
  assignServiceRequest,
  dispatchStatusLabels,
  getAvailableDrivers,
  getDispatchRequests,
  getFleetVehicles,
  updateServiceStatus,
  type DispatchStatus,
} from '../services/dispatchApi';

type Row = Record<string, any>;

export default function Dispatch() {
  const [rows, setRows] = useState<Row[]>([]);
  const [drivers, setDrivers] = useState<Row[]>([]);
  const [fleet, setFleet] = useState<Row[]>([]);
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selectedFleet, setSelectedFleet] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [requests, driverList, fleetList] = await Promise.all([
        getDispatchRequests(status),
        getAvailableDrivers(),
        getFleetVehicles(),
      ]);
      setRows(requests);
      setDrivers(driverList);
      setFleet(fleetList);
    } catch (e: any) {
      setError(e?.message || 'خطا در دریافت اطلاعات عملیات');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [status]);

  const summary = useMemo(() => ({
    pending: rows.filter((r) => r.status === 'pending_review').length,
    assigned: rows.filter((r) => r.status === 'assigned').length,
    active: rows.filter((r) => ['en_route', 'arrived', 'in_progress'].includes(r.status)).length,
    completed: rows.filter((r) => r.status === 'completed').length,
  }), [rows]);

  async function handleAssign(row: Row, driverId: string) {
    if (!driverId) return;
    setSavingId(row.id);
    setError('');
    setMessage('');
    try {
      await assignServiceRequest(row.id, driverId, selectedFleet[row.id] || row.fleet_vehicle_id || undefined, row.scheduled_at || undefined);
      setMessage('سرویس‌کار با موفقیت تخصیص داده شد.');
      await load();
    } catch (e: any) {
      setError(e?.message || 'خطا در تخصیص سرویس‌کار');
    } finally {
      setSavingId('');
    }
  }

  async function changeStatus(row: Row, next: DispatchStatus) {
    setSavingId(row.id);
    setError('');
    setMessage('');
    try {
      await updateServiceStatus(row.id, next);
      setMessage(`وضعیت به «${dispatchStatusLabels[next]}» تغییر کرد.`);
      await load();
    } catch (e: any) {
      setError(e?.message || 'خطا در تغییر وضعیت');
    } finally {
      setSavingId('');
    }
  }

  return (
    <div className="space-y-6 p-4 text-white md:p-6" dir="rtl">
      <div className="flex flex-col gap-4 rounded-3xl border border-amber-400/20 bg-gradient-to-l from-amber-500/10 via-slate-900 to-slate-950 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black">مرکز عملیات سرویس در محل</h1>
          <p className="mt-1 text-sm text-slate-400">تأیید درخواست، تخصیص سرویس‌کار و پیگیری مرحله‌به‌مرحله مأموریت</p>
        </div>
        <button onClick={() => void load()} className="rounded-xl bg-amber-400 px-4 py-2 font-bold text-slate-950">بروزرسانی</button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat title="در انتظار بررسی" value={summary.pending} />
        <Stat title="اختصاص داده‌شده" value={summary.assigned} />
        <Stat title="مأموریت فعال" value={summary.active} />
        <Stat title="تکمیل‌شده" value={summary.completed} />
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white outline-none focus:border-amber-400 md:w-72">
          <option value="all">همه وضعیت‌ها</option>
          {Object.entries(dispatchStatusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
      </div>

      {message && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-200">{message}</div>}
      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-red-200">{error}</div>}
      {loading && <div className="text-slate-300">در حال بارگذاری...</div>}

      <div className="grid gap-4">
        {rows.map((row) => (
          <article key={row.id} className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 shadow-xl shadow-black/10">
            <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-200">{dispatchStatusLabels[row.status as DispatchStatus] || row.status}</span>
                  {row.request_number && <span className="rounded-full bg-slate-950 px-3 py-1 text-xs text-slate-400">{row.request_number}</span>}
                </div>
                <h2 className="mt-3 text-xl font-black">{row.customer_name || 'بدون نام'}</h2>
                <p className="mt-1 text-sm text-slate-400">{row.customer_phone || 'بدون شماره'} · {row.vehicle_title || row.car_name || 'خودرو ثبت نشده'}</p>
                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <Info label="کیلومتر فعلی" value={formatNumber(row.current_km)} />
                  <Info label="سرویس بعدی" value={formatNumber(row.next_service_km)} accent />
                  <Info label="تاریخ ترجیحی" value={row.preferred_date || '-'} />
                  <Info label="ساعت ترجیحی" value={row.preferred_time || '-'} />
                </div>
                <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-300">{row.address_text || 'آدرس ثبت نشده'}</div>
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <label className="block text-xs font-bold text-slate-400">خودروی سرویس</label>
                <select
                  value={selectedFleet[row.id] ?? row.fleet_vehicle_id ?? ''}
                  onChange={(e) => setSelectedFleet((prev) => ({ ...prev, [row.id]: e.target.value }))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                >
                  <option value="">بدون انتخاب</option>
                  {fleet.map((item) => <option key={item.id} value={item.id}>{item.title || item.name || item.plate_number || item.id}</option>)}
                </select>

                <label className="block text-xs font-bold text-slate-400">سرویس‌کار</label>
                <select
                  value={row.assigned_driver_id || row.driver_id || ''}
                  onChange={(e) => void handleAssign(row, e.target.value)}
                  disabled={savingId === row.id}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white disabled:opacity-60"
                >
                  <option value="">انتخاب سرویس‌کار</option>
                  {drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.full_name || driver.phone || driver.id}</option>)}
                </select>

                <label className="block text-xs font-bold text-slate-400">وضعیت مأموریت</label>
                <select
                  value={row.status}
                  onChange={(e) => void changeStatus(row, e.target.value as DispatchStatus)}
                  disabled={savingId === row.id}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white disabled:opacity-60"
                >
                  {Object.entries(dispatchStatusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>

                <a href={`/driver/jobs/${row.id}`} className="block rounded-xl border border-amber-400/30 px-3 py-2 text-center text-sm font-bold text-amber-200 hover:bg-amber-400 hover:text-slate-950">مشاهده مأموریت سرویس‌کار</a>
                {savingId === row.id && <div className="text-xs text-amber-300">در حال ذخیره...</div>}
              </div>
            </div>
          </article>
        ))}
        {!rows.length && !loading && <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-8 text-center text-slate-400">درخواستی یافت نشد.</div>}
      </div>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return <div className="rounded-2xl border border-white/10 bg-slate-900 p-4"><div className="text-sm text-slate-400">{title}</div><div className="mt-2 text-2xl font-black text-amber-300">{value.toLocaleString('fa-IR')}</div></div>;
}

function Info({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3"><div className="text-xs text-slate-500">{label}</div><div className={`mt-1 font-bold ${accent ? 'text-amber-300' : 'text-white'}`}>{value}</div></div>;
}

function formatNumber(value: unknown) {
  const number = Number(value || 0);
  return number > 0 ? number.toLocaleString('fa-IR') : '-';
}
