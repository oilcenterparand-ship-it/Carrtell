import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Crosshair, Info, Loader2, MapPin } from 'lucide-react';
import maplibregl from '@neshan-maps-platform/maplibre-sdk';
import '@neshan-maps-platform/maplibre-sdk/style.css';
import { supabase } from '../lib/supabase';

type PickedLocation = { latitude: number; longitude: number; address?: string };
type Props = {
  initialLatitude?: number | null;
  initialLongitude?: number | null;
  onConfirm: (location: PickedLocation) => void;
};

const DEFAULT_LOCATION = { latitude: 35.4819, longitude: 51.0832 };
const NESHAN_WEB_API_KEY = String(import.meta.env.VITE_NESHAN_WEB_API_KEY || '').trim();
const NESHAN_STYLE = 'https://static.neshan.org/sdk/maplibre/styles/light.json';

function normalizePoint(latitude: number, longitude: number) {
  return {
    latitude: Number(latitude.toFixed(7)),
    longitude: Number(longitude.toFixed(7)),
  };
}

async function reverseGeocode(latitude: number, longitude: number) {
  const { data, error } = await supabase.functions.invoke('neshan-reverse-geocode', {
    body: { latitude, longitude },
  });

  if (error) throw new Error(error.message || 'تبدیل موقعیت به آدرس انجام نشد.');
  if (!data?.ok) throw new Error(String(data?.error || 'تبدیل موقعیت به آدرس انجام نشد.'));
  return String(data?.address || '').trim();
}

export default function MapLocationPicker({ initialLatitude, initialLongitude, onConfirm }: Props) {
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const reverseRequestId = useRef(0);
  const reverseTimer = useRef<number | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [mapError, setMapError] = useState('');
  const [address, setAddress] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [selected, setSelected] = useState(() => ({
    latitude: initialLatitude || DEFAULT_LOCATION.latitude,
    longitude: initialLongitude || DEFAULT_LOCATION.longitude,
  }));

  const initialCenter = useMemo(() => ({
    latitude: initialLatitude || DEFAULT_LOCATION.latitude,
    longitude: initialLongitude || DEFAULT_LOCATION.longitude,
  }), [initialLatitude, initialLongitude]);

  const resolveAddress = useCallback(async (latitude: number, longitude: number) => {
    const requestId = ++reverseRequestId.current;
    setAddressLoading(true);
    try {
      const resolved = await reverseGeocode(latitude, longitude);
      if (requestId !== reverseRequestId.current) return;
      setAddress(resolved);
      setMapError('');
    } catch (error) {
      if (requestId !== reverseRequestId.current) return;
      setAddress('');
      setMapError(error instanceof Error ? error.message : 'تبدیل موقعیت به آدرس انجام نشد.');
    } finally {
      if (requestId === reverseRequestId.current) setAddressLoading(false);
    }
  }, []);

  const selectPoint = useCallback((latitude: number, longitude: number, shouldResolve = true) => {
    const next = normalizePoint(latitude, longitude);
    setSelected(next);
    setConfirmed(false);
    if (shouldResolve) {
      if (reverseTimer.current) window.clearTimeout(reverseTimer.current);
      reverseTimer.current = window.setTimeout(() => void resolveAddress(next.latitude, next.longitude), 450);
    }
  }, [resolveAddress]);

  useEffect(() => {
    setSelected(initialCenter);
  }, [initialCenter]);

  useEffect(() => {
    if (!mapEl.current || mapRef.current || !NESHAN_WEB_API_KEY) return;

    try {
      const map = new maplibregl.Map({
        container: mapEl.current,
        style: NESHAN_STYLE,
        center: [initialCenter.longitude, initialCenter.latitude],
        zoom: 16,
        apiKey: NESHAN_WEB_API_KEY,
        attributionControl: false,
      });

      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');

      map.on('load', () => {
        map.resize();
        selectPoint(initialCenter.latitude, initialCenter.longitude, true);
      });

      map.on('move', () => {
        setConfirmed(false);
        setAddressLoading(true);
      });

      map.on('moveend', () => {
        const center = map.getCenter();
        selectPoint(center.lat, center.lng, true);
      });

      map.on('error', () => {
        setMapError('نقشه نشان بارگذاری نشد. اتصال اینترنت و کلید نقشه وب را بررسی کن.');
      });
    } catch (error) {
      setMapError(error instanceof Error ? error.message : 'نقشه نشان بارگذاری نشد.');
    }

    return () => {
      reverseRequestId.current += 1;
      if (reverseTimer.current) window.clearTimeout(reverseTimer.current);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [initialCenter.latitude, initialCenter.longitude, selectPoint]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const center = map.getCenter();
    const changed = Math.abs(center.lat - initialCenter.latitude) > 0.000001
      || Math.abs(center.lng - initialCenter.longitude) > 0.000001;
    if (changed) map.jumpTo({ center: [initialCenter.longitude, initialCenter.latitude] });
  }, [initialCenter]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMapError('مرورگر دریافت موقعیت مکانی را پشتیبانی نمی‌کند.');
      return;
    }

    setGeoLoading(true);
    setMapError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        mapRef.current?.flyTo({ center: [longitude, latitude], zoom: 17, essential: true });
        selectPoint(latitude, longitude, true);
        setGeoLoading(false);
      },
      () => {
        setGeoLoading(false);
        setMapError('اجازه موقعیت مکانی داده نشد. نقشه را روی محل سرویس قرار بده.');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  };

  const confirmLocation = () => {
    setConfirmed(true);
    onConfirm({ ...selected, address: address || undefined });
  };

  return (
    <section className="mt-4 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm" dir="rtl">
      {!NESHAN_WEB_API_KEY && (
        <div className="m-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">
          <Info size={19} className="mt-0.5 shrink-0" />
          <div>
            <b className="block">کلید نقشه نشان تنظیم نشده است</b>
            مقدار <code>VITE_NESHAN_WEB_API_KEY</code> را در فایل محیطی پروژه تنظیم کن و دوباره Build بگیر.
          </div>
        </div>
      )}

      <div className="flex justify-center p-3 sm:p-4">
        <button type="button" onClick={useCurrentLocation} disabled={geoLoading || !NESHAN_WEB_API_KEY} className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 shadow-sm transition hover:border-amber-300 hover:bg-amber-50 disabled:opacity-60">
          {geoLoading ? <Loader2 size={17} className="animate-spin" /> : <Crosshair size={17} />}
          {geoLoading ? 'در حال دریافت...' : 'موقعیت فعلی من'}
        </button>
      </div>

      <div className="p-3 sm:p-4">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
          <div ref={mapEl} className="h-[330px] w-full" aria-label="نقشه انتخاب موقعیت سرویس" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-full">
            <MapPin size={40} className="fill-amber-400 text-amber-600 drop-shadow-lg" />
          </div>
          {addressLoading && NESHAN_WEB_API_KEY && (
            <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-slate-950/80 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
              در حال دریافت آدرس...
            </div>
          )}
        </div>

        {mapError && <p className="mt-3 rounded-2xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{mapError}</p>}

        <div className="mt-3 flex justify-end">
          <button type="button" onClick={confirmLocation} disabled={!NESHAN_WEB_API_KEY || addressLoading} className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-6 font-black transition sm:w-auto disabled:cursor-not-allowed disabled:opacity-60 ${confirmed ? 'bg-emerald-600 text-white' : 'bg-amber-400 text-slate-950 hover:bg-amber-300'}`}>
            <Check size={19} /> {confirmed ? 'موقعیت ثبت شد' : 'تأیید این موقعیت'}
          </button>
        </div>
      </div>
    </section>
  );
}
