import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Crosshair, Info, Loader2, MapPin, Search } from 'lucide-react';

declare global {
  interface Window { L?: any; }
}

type PickedLocation = { latitude: number; longitude: number; address?: string };

type Props = {
  initialLatitude?: number | null;
  initialLongitude?: number | null;
  onConfirm: (location: PickedLocation) => void;
};

const DEFAULT_LOCATION = { latitude: 35.4819, longitude: 51.0832 };
const LEAFLET_CSS_ID = 'carrtell-leaflet-css';
const LEAFLET_SCRIPT_ID = 'carrtell-leaflet-script';
const NESHAN_MAP_KEY = String(import.meta.env.VITE_NESHAN_MAP_KEY || '').trim();
const NESHAN_SERVICE_KEY = String(import.meta.env.VITE_NESHAN_SERVICE_KEY || '').trim();

function loadLeaflet(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('مرورگر در دسترس نیست.'));
  if (window.L) return Promise.resolve(window.L);
  return new Promise((resolve, reject) => {
    if (!document.getElementById(LEAFLET_CSS_ID)) {
      const link = document.createElement('link');
      link.id = LEAFLET_CSS_ID;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    const existing = document.getElementById(LEAFLET_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(window.L));
      existing.addEventListener('error', () => reject(new Error('نقشه بارگذاری نشد.')));
      return;
    }
    const script = document.createElement('script');
    script.id = LEAFLET_SCRIPT_ID;
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error('نقشه بارگذاری نشد.'));
    document.body.appendChild(script);
  });
}

async function reverseGeocode(latitude: number, longitude: number) {
  if (!NESHAN_SERVICE_KEY) return '';
  const response = await fetch(`https://api.neshan.org/v5/reverse?lat=${latitude}&lng=${longitude}`, {
    headers: { 'Api-Key': NESHAN_SERVICE_KEY },
  });
  if (!response.ok) return '';
  const data = await response.json();
  return String(data?.formatted_address || data?.address || '').trim();
}

async function searchAddress(term: string) {
  if (!NESHAN_SERVICE_KEY) return [] as Array<{ title: string; address: string; latitude: number; longitude: number }>;
  const response = await fetch(`https://api.neshan.org/v1/search?term=${encodeURIComponent(term)}&lat=${DEFAULT_LOCATION.latitude}&lng=${DEFAULT_LOCATION.longitude}`, {
    headers: { 'Api-Key': NESHAN_SERVICE_KEY },
  });
  if (!response.ok) throw new Error('جست‌وجوی آدرس انجام نشد.');
  const data = await response.json();
  return (Array.isArray(data?.items) ? data.items : []).slice(0, 6).map((item: any) => ({
    title: String(item?.title || 'موقعیت'),
    address: String(item?.address || ''),
    latitude: Number(item?.location?.y),
    longitude: Number(item?.location?.x),
  })).filter((item: any) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude));
}

export default function MapLocationPicker({ initialLatitude, initialLongitude, onConfirm }: Props) {
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [mapError, setMapError] = useState('');
  const [address, setAddress] = useState('');
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Array<{ title: string; address: string; latitude: number; longitude: number }>>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [selected, setSelected] = useState(() => ({
    latitude: initialLatitude || DEFAULT_LOCATION.latitude,
    longitude: initialLongitude || DEFAULT_LOCATION.longitude,
  }));

  const initialCenter = useMemo(() => ({
    latitude: initialLatitude || DEFAULT_LOCATION.latitude,
    longitude: initialLongitude || DEFAULT_LOCATION.longitude,
  }), [initialLatitude, initialLongitude]);

  const updatePoint = async (latitude: number, longitude: number, emit = true) => {
    const next = { latitude: Number(latitude.toFixed(7)), longitude: Number(longitude.toFixed(7)) };
    setSelected(next);
    setConfirmed(false);
    mapRef.current?.setView([next.latitude, next.longitude], 17);
    markerRef.current?.setLatLng([next.latitude, next.longitude]);
    let resolvedAddress = '';
    try { resolvedAddress = await reverseGeocode(next.latitude, next.longitude); } catch { resolvedAddress = ''; }
    setAddress(resolvedAddress);
    if (emit) onConfirm({ ...next, address: resolvedAddress || undefined });
  };

  useEffect(() => { setSelected(initialCenter); }, [initialCenter.latitude, initialCenter.longitude]);

  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !mapEl.current) return;
      if (!mapRef.current) {
        mapRef.current = L.map(mapEl.current, { zoomControl: true, attributionControl: false }).setView([initialCenter.latitude, initialCenter.longitude], 16);
        const tileUrl = NESHAN_MAP_KEY
          ? `https://static.neshan.org/sdk/leaflet/1.4.0/standard-day/{z}/{x}/{y}.jpg?key=${encodeURIComponent(NESHAN_MAP_KEY)}`
          : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(mapRef.current);
        markerRef.current = L.marker([initialCenter.latitude, initialCenter.longitude], { draggable: true }).addTo(mapRef.current);
        markerRef.current.on('dragend', () => {
          const pos = markerRef.current.getLatLng();
          void updatePoint(pos.lat, pos.lng);
        });
        mapRef.current.on('click', (event: any) => void updatePoint(event.latlng.lat, event.latlng.lng));
      }
      window.setTimeout(() => mapRef.current?.invalidateSize(), 180);
      void updatePoint(initialCenter.latitude, initialCenter.longitude, false);
    }).catch((error) => setMapError(error?.message || 'نقشه بارگذاری نشد.'));
    return () => { cancelled = true; };
  }, [initialCenter.latitude, initialCenter.longitude]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return setMapError('مرورگر دریافت موقعیت مکانی را پشتیبانی نمی‌کند.');
    setGeoLoading(true);
    setMapError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void updatePoint(position.coords.latitude, position.coords.longitude);
        setGeoLoading(false);
      },
      () => {
        setGeoLoading(false);
        setMapError('اجازه موقعیت مکانی داده نشد. نقطه را روی نقشه انتخاب کن.');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  };

  const runSearch = async () => {
    if (!query.trim()) return;
    if (!NESHAN_SERVICE_KEY) {
      setMapError('جست‌وجوی متنی آدرس بعد از اتصال سرویس نشان فعال می‌شود. فعلاً نقطه را روی نقشه انتخاب کن یا آدرس را دستی بنویس.');
      return;
    }
    setSearching(true);
    setMapError('');
    try { setResults(await searchAddress(query.trim())); }
    catch (error: any) { setMapError(error?.message || 'جست‌وجوی آدرس انجام نشد.'); }
    finally { setSearching(false); }
  };

  const confirmLocation = () => {
    setConfirmed(true);
    onConfirm({ ...selected, address: address || undefined });
  };

  return (
    <section className="mt-4 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm" dir="rtl">
      {!NESHAN_SERVICE_KEY && (
        <div className="m-4 mb-0 flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-800">
          <Info size={19} className="mt-0.5 shrink-0" />
          <div><b className="block">حالت موقت بدون سرویس نشان</b>نقشه رایگان نمایش داده می‌شود و انتخاب نقطه یا موقعیت فعلی کار می‌کند؛ جست‌وجوی نام خیابان و تبدیل خودکار نقطه به آدرس فعلاً غیرفعال است. نوشتن آدرس دستی کافی است.</div>
        </div>
      )}

      <div className="border-b border-slate-100 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-50 text-amber-500"><MapPin size={22} /></span>
            <div>
              <h3 className="font-black text-slate-900">انتخاب موقعیت دقیق</h3>
              <p className="mt-1 text-xs leading-6 text-slate-500">نقشه را جابه‌جا کن یا موقعیت فعلی را بزن.</p>
            </div>
          </div>
          <button type="button" onClick={useCurrentLocation} disabled={geoLoading} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 disabled:opacity-60">
            {geoLoading ? <Loader2 size={17} className="animate-spin" /> : <Crosshair size={17} />}
            {geoLoading ? 'در حال دریافت...' : 'موقعیت فعلی من'}
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input disabled={!NESHAN_SERVICE_KEY} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), void runSearch())} placeholder={NESHAN_SERVICE_KEY ? 'جست‌وجوی محله، خیابان یا مکان...' : 'پس از اتصال نشان فعال می‌شود'} className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-4 pr-11 text-sm text-slate-900 outline-none focus:border-amber-400 focus:bg-white" />
          </div>
          <button type="button" onClick={runSearch} disabled={searching || !NESHAN_SERVICE_KEY} className="rounded-2xl bg-slate-900 px-5 text-sm font-black text-white disabled:opacity-60">
            {searching ? <Loader2 size={18} className="animate-spin" /> : 'جست‌وجو'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {results.map((item, index) => (
              <button key={`${item.latitude}-${item.longitude}-${index}`} type="button" onClick={() => { setResults([]); setQuery(item.title); setAddress(item.address); void updatePoint(item.latitude, item.longitude); }} className="flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-right last:border-0 hover:bg-slate-50">
                <MapPin size={17} className="mt-1 shrink-0 text-amber-500" />
                <span><b className="block text-sm text-slate-900">{item.title}</b><small className="mt-1 block text-xs text-slate-500">{item.address}</small></span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 sm:p-4">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
          <div ref={mapEl} className="h-[330px] w-full" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-[400] -translate-x-1/2 -translate-y-full">
            <MapPin size={38} className="fill-amber-400 text-amber-600 drop-shadow-lg" />
          </div>
        </div>

        {mapError && <p className="mt-3 rounded-2xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{mapError}</p>}

        <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-500">موقعیت انتخابی</p>
            <p className="mt-1 text-sm font-bold text-slate-800">{address || `${selected.latitude}، ${selected.longitude}`}</p>
          </div>
          <button type="button" onClick={confirmLocation} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-6 font-black transition ${confirmed ? 'bg-emerald-600 text-white' : 'bg-amber-400 text-slate-950 hover:bg-amber-300'}`}>
            <Check size={19} /> {confirmed ? 'موقعیت ثبت شد' : 'تأیید این موقعیت'}
          </button>
        </div>
      </div>
    </section>
  );
}
