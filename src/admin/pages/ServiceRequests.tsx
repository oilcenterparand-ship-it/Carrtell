import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Car, Loader2, MapPin, PhoneCall, RefreshCw, Search, UserRound, Wrench } from 'lucide-react';
import { assignServiceRequest, getFleetVehicles } from '../services/dispatchApi';
import {
  getDriverUsers,
  getServiceRequests,
  getServiceRequestStatusLabel,
  updateServiceRequestStatus,
  type DriverUser,
  type ServiceRequest,
  type ServiceRequestStatus,
} from '../services/serviceRequestsApi';

const statuses: ServiceRequestStatus[] = ['pending_review', 'confirmed', 'assigned', 'accepted', 'dispatching', 'en_route', 'arrived', 'in_progress', 'completed', 'cancelled'];
const operationStatuses: ServiceRequestStatus[] = ['pending_review', 'confirmed', 'assigned', 'accepted', 'dispatching', 'en_route', 'arrived', 'in_progress', 'completed', 'cancelled'];

function statusClass(status: ServiceRequestStatus) {
  switch (status) {
    case 'confirmed': return 'border-sky-400/30 bg-sky-500/10 text-sky-100';
    case 'assigned': return 'border-cyan-400/30 bg-cyan-500/10 text-cyan-100';
    case 'dispatching': return 'border-amber-400/30 bg-amber-500/10 text-amber-100';
    case 'en_route': return 'border-blue-400/30 bg-blue-500/10 text-blue-100';
    case 'arrived': return 'border-violet-400/30 bg-violet-500/10 text-violet-100';
    case 'in_progress': return 'border-orange-400/30 bg-orange-500/10 text-orange-100';
    case 'completed': return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100';
    case 'cancelled': return 'border-red-500/30 bg-red-500/10 text-red-100';
    default: return 'border-slate-500/30 bg-slate-500/10 text-slate-100';
  }
}

function formatNumber(value?: number | null) {
  return Number(value || 0).toLocaleString('fa-IR');
}

function buildMapLink(request: ServiceRequest) {
  if (request.latitude && request.longitude) return `https://www.google.com/maps?q=${request.latitude},${request.longitude}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(request.address_text || '')}`;
}

export default function ServiceRequests() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [drivers, setDrivers] = useState<DriverUser[]>([]);
  const [fleet, setFleet] = useState<Record<string, any>[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Record<string, string>>({});
  const [selectedFleet, setSelectedFleet] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ServiceRequestStatus>('all');
  const [cityFilter, setCityFilter] = useState('');
  const [message, setMessage] = useState('');

  async function loadRequests() {
    setLoading(true);
    try {
      const [serviceItems, driverItems, fleetItems] = await Promise.all([getServiceRequests(), getDriverUsers(), getFleetVehicles()]);
      setRequests(serviceItems);
      setDrivers(driverItems);
      setFleet(fleetItems);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRequests();
  }, []);

  const cities = useMemo(() => {
    const allCities = requests
      .map((item) => item.address_text?.split('،')?.[0]?.trim())
      .filter(Boolean) as string[];
    return Array.from(new Set(allCities));
  }, [requests]);

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return requests.filter((request) => {
      const matchesText = !text || [
        request.request_number,
        request.customer_name,
        request.customer_phone,
        request.vehicle_title,
        request.address_text,
        request.assigned_driver_name,
      ].some((item) => String(item || '').toLowerCase().includes(text));
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      const matchesCity = !cityFilter || request.address_text?.includes(cityFilter);
      return matchesText && matchesStatus && matchesCity;
    });
  }, [requests, query, statusFilter, cityFilter]);

  async function changeStatus(request: ServiceRequest, status: ServiceRequestStatus) {
    setSavingId(request.id);
    setMessage('');
    try {
      const updated = await updateServiceRequestStatus(request.id, status, request.assigned_driver_name || request.technician_name || null);
      setRequests((items) => items.map((item) => (item.id === request.id ? updated : item)));
      setMessage('وضعیت درخواست بروزرسانی شد.');
    } finally {
      setSavingId('');
    }
  }

  async function assignDriver(request: ServiceRequest) {
    const driverId = selectedDriver[request.id] || request.assigned_driver_id || '';
    if (!driverId) return setMessage('ابتدا سرویس‌کار را انتخاب کن.');
    const driver = drivers.find((item) => item.id === driverId);
    if (!driver) return setMessage('سرویس‌کار انتخاب‌شده پیدا نشد.');

    setSavingId(request.id);
    setMessage('');
    try {
      const updated = await assignServiceRequest(
        request.id,
        driver.id,
        selectedFleet[request.id] || undefined,
        request.preferred_date && request.preferred_time ? `${request.preferred_date}T${request.preferred_time}` : undefined,
      );
      setRequests((items) => items.map((item) => (item.id === request.id ? { ...item, ...updated } as ServiceRequest : item)));
      setMessage(`مأموریت به ${driver.full_name} تخصیص داده شد و در پنل سرویس‌کار نمایش داده می‌شود.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تخصیص سرویس‌کار انجام نشد.');
    } finally {
      setSavingId('');
    }
  }

  return (
    <div className="space-y-6 text-white" dir="rtl">
      <div className="flex flex-col gap-4 rounded-[2rem] border border-amber-400/20 bg-gradient-to-l from-amber-500/15 via-slate-900 to-slate-950 p-5 shadow-xl shadow-black/20 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-slate-950">
            <Wrench className="h-4 w-4" /> عملیات سرویس در محل
          </div>
          <h1 className="text-2xl font-black">تخصیص سرویس‌کار و مدیریت درخواست‌ها</h1>
          <p className="mt-2 text-sm text-slate-300">درخواست‌ها را بررسی کن، سرویس‌کار انتخاب کن و وضعیت عملیات را مرحله‌به‌مرحله تغییر بده.</p>
        </div>
        <button onClick={loadRequests} className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-black text-slate-100 hover:border-amber-400 hover:text-amber-200">
          <RefreshCw className="h-4 w-4" /> بروزرسانی
        </button>
      </div>

      {message && <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-100">{message}</div>}

      <div className="grid gap-3 rounded-3xl border border-slate-700 bg-slate-900/70 p-4 lg:grid-cols-[1fr_220px_220px]">
        <label className="relative block">
          <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-3 pl-4 pr-11 text-white outline-none placeholder:text-slate-500 focus:border-amber-400"
            placeholder="جستجو نام، موبایل، خودرو، سرویس‌کار یا شماره درخواست"
          />
        </label>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | ServiceRequestStatus)} className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400">
          <option value="all">همه وضعیت‌ها</option>
          {statuses.map((status) => <option key={status} value={status}>{getServiceRequestStatusLabel(status)}</option>)}
        </select>
        <select value={cityFilter} onChange={(event) => setCityFilter(event.target.value)} className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400">
          <option value="">همه شهرها</option>
          {cities.map((city) => <option key={city} value={city}>{city}</option>)}
        </select>
      </div>

      {drivers.length === 0 && (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
          هنوز سرویس‌کاری تعریف نشده است. <a className="font-black underline" href="/admin/technicians">تعریف سرویس‌کار</a>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-64 items-center justify-center rounded-3xl border border-slate-700 bg-slate-900/70"><Loader2 className="h-8 w-8 animate-spin text-amber-300" /></div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((request) => (
            <article key={request.id} className="rounded-3xl border border-slate-700 bg-slate-900/80 p-5 shadow-xl shadow-black/10">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusClass(request.status)}`}>{getServiceRequestStatusLabel(request.status)}</span>
                    <span className="rounded-full bg-slate-950 px-3 py-1 text-xs text-slate-300">{request.request_number}</span>
                    <span className="rounded-full bg-slate-950 px-3 py-1 text-xs text-slate-300"><CalendarClock className="ml-1 inline h-3 w-3" />{request.preferred_date} - {request.preferred_time}</span>
                    {request.assigned_driver_name && <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-100">سرویس‌کار: {request.assigned_driver_name}</span>}
                  </div>

                  <h2 className="flex items-center gap-2 text-xl font-black"><Car className="h-5 w-5 text-amber-300" />{request.vehicle_title}</h2>
                  <p className="mt-1 text-sm text-slate-400">{request.service_title}</p>

                  <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                      <UserRound className="mb-2 h-4 w-4 text-amber-300" />
                      <b className="text-white">{request.customer_name}</b><br />
                      <a href={`tel:${request.customer_phone}`} className="inline-flex items-center gap-1 pt-1 text-amber-200"><PhoneCall className="h-3 w-3" />{request.customer_phone}</a>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">کیلومتر فعلی<br /><b className="text-white">{formatNumber(request.current_km)}</b></div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">سرویس بعدی<br /><b className="text-amber-300">{formatNumber(request.next_service_km)}</b></div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">دوره سرویس<br /><b className="text-white">{formatNumber(request.service_interval_km)}</b></div>
                  </div>

                  <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-300">
                    <MapPin className="mb-2 h-4 w-4 text-amber-300" />
                    {request.address_text}
                    <a href={buildMapLink(request)} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-xl bg-amber-400 px-3 py-2 text-xs font-black text-slate-950 hover:bg-amber-300">باز کردن مسیر</a>
                  </div>

                  {request.note && <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-400">{request.note}</p>}
                  {request.completion_note && <p className="mt-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">گزارش پایان سرویس: {request.completion_note}</p>}
                </div>

                <div className="w-full space-y-3 xl:w-80">
                  <div className="rounded-2xl border-2 border-amber-400/30 bg-amber-500/5 p-3">
                    <div className="mb-3 font-black text-amber-200">تخصیص سریع مأموریت</div>
                    <label className="mb-1 block text-xs font-bold text-slate-400">سرویس‌کار</label>
                    <select
                      value={selectedDriver[request.id] ?? request.assigned_driver_id ?? ''}
                      onChange={(event) => setSelectedDriver((prev) => ({ ...prev, [request.id]: event.target.value }))}
                      disabled={savingId === request.id || drivers.length === 0}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white outline-none focus:border-amber-400 disabled:opacity-60"
                    >
                      <option value="">انتخاب سرویس‌کار</option>
                      {drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.full_name}{driver.phone ? ` - ${driver.phone}` : ''}</option>)}
                    </select>
                    <label className="mb-1 mt-3 block text-xs font-bold text-slate-400">خودروی سرویس (اختیاری)</label>
                    <select
                      value={selectedFleet[request.id] ?? ''}
                      onChange={(event) => setSelectedFleet((prev) => ({ ...prev, [request.id]: event.target.value }))}
                      disabled={savingId === request.id}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white outline-none focus:border-amber-400 disabled:opacity-60"
                    >
                      <option value="">بدون خودرو / انتخاب بعداً</option>
                      {fleet.map((item) => <option key={item.id} value={item.id}>{item.title || item.plate_number || item.id}</option>)}
                    </select>
                    <button type="button" onClick={() => void assignDriver(request)} disabled={savingId === request.id || drivers.length === 0 || !(selectedDriver[request.id] || request.assigned_driver_id)} className="mt-3 w-full rounded-xl bg-amber-400 px-4 py-3 font-black text-slate-950 disabled:opacity-40">{request.assigned_driver_id ? 'بروزرسانی تخصیص' : 'تخصیص و ارسال به سرویس‌کار'}</button>
                    <div className="mt-2 flex gap-2 text-xs"><a href="/admin/technicians" className="text-amber-200 underline">مدیریت سرویس‌کارها</a><span className="text-slate-600">•</span><a href="/admin/service-fleet" className="text-cyan-200 underline">مدیریت خودروها</a></div>
                  </div>

                  <label className="block text-xs font-bold text-slate-400">وضعیت عملیات</label>
                  <select
                    value={request.status}
                    onChange={(event) => void changeStatus(request, event.target.value as ServiceRequestStatus)}
                    disabled={savingId === request.id}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400 disabled:opacity-60"
                  >
                    {operationStatuses.map((status) => <option key={status} value={status}>{getServiceRequestStatusLabel(status)}</option>)}
                  </select>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-400">
                    شروع: {request.started_at ? new Date(request.started_at).toLocaleString('fa-IR') : '—'}<br />
                    رسیدن: {request.arrived_at ? new Date(request.arrived_at).toLocaleString('fa-IR') : '—'}<br />
                    تکمیل: {request.completed_at ? new Date(request.completed_at).toLocaleString('fa-IR') : '—'}
                  </div>

                  {savingId === request.id && <div className="flex items-center gap-2 text-xs text-amber-300"><Loader2 className="h-4 w-4 animate-spin" /> در حال ذخیره...</div>}
                </div>
              </div>
            </article>
          ))}
          {!filtered.length && <div className="rounded-3xl border border-slate-700 bg-slate-900/70 p-8 text-center text-slate-400">درخواستی پیدا نشد.</div>}
        </div>
      )}
    </div>
  );
}
