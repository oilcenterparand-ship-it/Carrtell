import { useEffect, useState } from 'react';
import { CalendarClock, Plus, Save, Trash2, Wrench } from 'lucide-react';
import {
  deleteBookingService,
  deleteBookingSlot,
  getAllBookingSlots,
  getBookingServices,
  getServicePricingSettings,
  saveBookingService,
  saveBookingSlot,
  saveServicePricingSettings,
  type BookingService,
  type BookingSlot,
  type ServicePricingSettings,
} from '../../customer/services/serviceBookingApi';

const emptyService = (): BookingService => ({ id: crypto.randomUUID(), title: '', description: '', icon: '🔧', base_labor_fee: 0, estimated_minutes: 30, is_active: true, sort_order: 99, recommended_categories: [] });
const emptySlot = (): BookingSlot => ({ id: crypto.randomUUID(), label: '', start_time: '09:00', end_time: '11:00', capacity: 2, remaining: 2, is_active: true });

export default function ServiceBookingSettings() {
  const [services, setServices] = useState<BookingService[]>([]);
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [pricing, setPricing] = useState<ServicePricingSettings>({ travel_fee: 0, night_fee: 0, holiday_fee: 0, out_of_area_fee: 0, night_start_hour: 18, club_discount_percent: 0, service_area_cities: [] });
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([getBookingServices(), getAllBookingSlots(), getServicePricingSettings()]).then(([serviceItems, slotItems, pricingSettings]) => {
      setServices(serviceItems);
      setSlots(slotItems);
      setPricing(pricingSettings);
    });
  }, []);

  const inputClass = 'w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-400';

  return (
    <div className="space-y-6 text-white" dir="rtl">
      <header className="rounded-3xl border border-amber-400/20 bg-gradient-to-l from-amber-500/15 via-slate-900 to-slate-950 p-6">
        <div className="flex items-center gap-3"><Wrench className="h-7 w-7 text-amber-300" /><div><h1 className="text-2xl font-black">تنظیمات رزرو هوشمند سرویس</h1><p className="mt-1 text-sm text-slate-400">خدمات، ظرفیت زمانی و قواعد قیمت‌گذاری را مدیریت کن.</p></div></div>
      </header>
      {message && <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4 text-emerald-100">{message}</div>}

      <section className="rounded-3xl border border-slate-700 bg-slate-900/75 p-5">
        <div className="mb-4 flex items-center justify-between"><h2 className="font-black">خدمات قابل رزرو</h2><button onClick={() => setServices((items) => [...items, emptyService()])} className="flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-sm font-black text-slate-950"><Plus className="h-4 w-4" /> افزودن خدمت</button></div>
        <div className="space-y-3">
          {services.map((service, index) => <div key={service.id} className="grid gap-3 rounded-2xl border border-slate-700 bg-slate-950/70 p-4 lg:grid-cols-[70px_1.2fr_1.5fr_160px_130px_100px]">
            <input className={inputClass} value={service.icon || ''} onChange={(e) => setServices((items) => items.map((x, i) => i === index ? { ...x, icon: e.target.value } : x))} />
            <input className={inputClass} value={service.title} placeholder="عنوان خدمت" onChange={(e) => setServices((items) => items.map((x, i) => i === index ? { ...x, title: e.target.value } : x))} />
            <input className={inputClass} value={service.description || ''} placeholder="توضیح کوتاه" onChange={(e) => setServices((items) => items.map((x, i) => i === index ? { ...x, description: e.target.value } : x))} />
            <input className={inputClass} type="number" value={service.base_labor_fee} onChange={(e) => setServices((items) => items.map((x, i) => i === index ? { ...x, base_labor_fee: Number(e.target.value) } : x))} />
            <input className={inputClass} type="number" value={service.estimated_minutes} onChange={(e) => setServices((items) => items.map((x, i) => i === index ? { ...x, estimated_minutes: Number(e.target.value) } : x))} />
            <div className="flex gap-2"><button onClick={async () => { await saveBookingService(service); setMessage('خدمت ذخیره شد.'); }} className="rounded-xl bg-emerald-500/20 p-2 text-emerald-200"><Save className="h-4 w-4" /></button><button onClick={async () => { await deleteBookingService(service.id); setServices((items) => items.filter((x) => x.id !== service.id)); }} className="rounded-xl bg-rose-500/20 p-2 text-rose-200"><Trash2 className="h-4 w-4" /></button></div>
          </div>)}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-700 bg-slate-900/75 p-5">
        <div className="mb-4 flex items-center justify-between"><h2 className="flex items-center gap-2 font-black"><CalendarClock className="h-5 w-5 text-amber-300" /> بازه‌های زمانی و ظرفیت</h2><button onClick={() => setSlots((items) => [...items, emptySlot()])} className="flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-sm font-black text-slate-950"><Plus className="h-4 w-4" /> افزودن بازه</button></div>
        <div className="space-y-3">{slots.map((slot, index) => <div key={slot.id} className="grid gap-3 rounded-2xl border border-slate-700 bg-slate-950/70 p-4 md:grid-cols-[1fr_150px_150px_120px_100px]">
          <input className={inputClass} value={slot.label} placeholder="مثلاً ۹ تا ۱۱" onChange={(e) => setSlots((items) => items.map((x, i) => i === index ? { ...x, label: e.target.value } : x))} />
          <input className={inputClass} type="time" value={slot.start_time} onChange={(e) => setSlots((items) => items.map((x, i) => i === index ? { ...x, start_time: e.target.value } : x))} />
          <input className={inputClass} type="time" value={slot.end_time} onChange={(e) => setSlots((items) => items.map((x, i) => i === index ? { ...x, end_time: e.target.value } : x))} />
          <input className={inputClass} type="number" min="1" value={slot.capacity} onChange={(e) => setSlots((items) => items.map((x, i) => i === index ? { ...x, capacity: Number(e.target.value), remaining: Number(e.target.value) } : x))} />
          <div className="flex gap-2"><button onClick={async () => { await saveBookingSlot(slot); setMessage('بازه ذخیره شد.'); }} className="rounded-xl bg-emerald-500/20 p-2 text-emerald-200"><Save className="h-4 w-4" /></button><button onClick={async () => { await deleteBookingSlot(slot.id); setSlots((items) => items.filter((x) => x.id !== slot.id)); }} className="rounded-xl bg-rose-500/20 p-2 text-rose-200"><Trash2 className="h-4 w-4" /></button></div>
        </div>)}</div>
      </section>

      <section className="rounded-3xl border border-slate-700 bg-slate-900/75 p-5">
        <h2 className="mb-4 font-black">قیمت‌گذاری داینامیک</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[['travel_fee','هزینه ایاب‌وذهاب'],['night_fee','هزینه شب'],['holiday_fee','هزینه تعطیلات'],['out_of_area_fee','هزینه خارج محدوده'],['night_start_hour','شروع ساعت شب'],['club_discount_percent','تخفیف باشگاه (درصد)']].map(([key,label]) => <label key={key} className="space-y-2 text-sm text-slate-300"><span>{label}</span><input className={inputClass} type="number" value={pricing[key as keyof ServicePricingSettings] as number} onChange={(e) => setPricing((old) => ({ ...old, [key]: Number(e.target.value) }))} /></label>)}
          <label className="space-y-2 text-sm text-slate-300 md:col-span-2 lg:col-span-3"><span>شهرهای داخل محدوده (با ویرگول)</span><input className={inputClass} value={pricing.service_area_cities.join('، ')} onChange={(e) => setPricing((old) => ({ ...old, service_area_cities: e.target.value.split(/[،,]/).map((x) => x.trim()).filter(Boolean) }))} /></label>
        </div>
        <button onClick={async () => { await saveServicePricingSettings(pricing); setMessage('تنظیمات قیمت ذخیره شد.'); }} className="mt-5 flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 font-black text-slate-950"><Save className="h-4 w-4" /> ذخیره قیمت‌گذاری</button>
      </section>
    </div>
  );
}
