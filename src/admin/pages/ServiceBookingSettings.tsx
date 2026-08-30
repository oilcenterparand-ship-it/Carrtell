import { useEffect, useState } from 'react';
import { CalendarClock, Plus, Save, Trash2, Wrench } from 'lucide-react';
import ImageUploader from '../components/ImageUploader';
import FieldHelp from '../components/FieldHelp';
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
  const [pricing, setPricing] = useState<ServicePricingSettings>({ travel_fee: 200000, travel_per_km_fee: 10000, travel_origin_latitude: 35.6505318, travel_origin_longitude: 51.2740074, service_center_latitude: 35.6892, service_center_longitude: 51.389, service_radius_km: 40, traffic_zone_surcharge_percent: 30, traffic_zone_polygon: [[35.6595,51.3819],[35.7218,51.3892],[35.723,51.407],[35.7212,51.426],[35.7188,51.443],[35.704,51.447],[35.688,51.449],[35.674,51.447],[35.66,51.444]], night_fee: 0, holiday_fee: 0, out_of_area_fee: 0, night_start_hour: 18, club_discount_percent: 0, service_area_cities: [] });
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
          {services.map((service, index) => <div key={service.id} className="grid gap-4 rounded-2xl border border-slate-700 bg-slate-950/70 p-4 lg:grid-cols-2 xl:grid-cols-[260px_1fr_1.4fr_180px_170px_100px]">
            <ImageUploader label="آیکون خدمت" folder="service-icons" value={service.icon || ''} onChange={(icon) => setServices((items) => items.map((x, i) => i === index ? { ...x, icon } : x))} />
            <label><FieldHelp title="عنوان خدمت">نام کامل خدمتی که مشتری در مرحله اول رزرو می‌بیند.</FieldHelp><textarea rows={3} className={`${inputClass} resize-y leading-6`} value={service.title} placeholder="عنوان کامل خدمت" onChange={(e) => setServices((items) => items.map((x, i) => i === index ? { ...x, title: e.target.value } : x))} /></label>
            <label><FieldHelp title="توضیحات خدمت">شرح دقیق کارهایی که در این خدمت انجام می‌شود و زیر عنوان به مشتری نمایش داده می‌شود.</FieldHelp><textarea rows={3} className={`${inputClass} resize-y leading-6`} value={service.description || ''} placeholder="توضیحات کامل خدمت" onChange={(e) => setServices((items) => items.map((x, i) => i === index ? { ...x, description: e.target.value } : x))} /></label>
            <label><FieldHelp title="اجرت پایه (تومان)">فقط دستمزد همین خدمت؛ قیمت محصولات و ایاب‌وذهاب جداگانه محاسبه می‌شوند.</FieldHelp><input className={inputClass} type="number" min="0" value={service.base_labor_fee} onChange={(e) => setServices((items) => items.map((x, i) => i === index ? { ...x, base_labor_fee: Number(e.target.value) } : x))} /></label>
            <label><FieldHelp title="زمان تقریبی (دقیقه)">همان عدد آخر هر خدمت است؛ برای برنامه‌ریزی بازه و جلوگیری از تداخل مأموریت‌ها استفاده می‌شود.</FieldHelp><input className={inputClass} type="number" min="5" step="5" value={service.estimated_minutes} onChange={(e) => setServices((items) => items.map((x, i) => i === index ? { ...x, estimated_minutes: Number(e.target.value) } : x))} /></label>
            <div className="flex items-end gap-2"><button title="ذخیره این خدمت" onClick={async () => { await saveBookingService(service); setMessage('خدمت ذخیره شد.'); }} className="rounded-xl bg-emerald-500/20 p-3 text-emerald-200"><Save className="h-4 w-4" /></button><button title="حذف این خدمت" onClick={async () => { await deleteBookingService(service.id); setServices((items) => items.filter((x) => x.id !== service.id)); }} className="rounded-xl bg-rose-500/20 p-3 text-rose-200"><Trash2 className="h-4 w-4" /></button></div>
          </div>)}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-700 bg-slate-900/75 p-5">
        <div className="mb-4 flex items-center justify-between"><h2 className="flex items-center gap-2 font-black"><CalendarClock className="h-5 w-5 text-amber-300" /> بازه‌های زمانی و ظرفیت</h2><button onClick={() => setSlots((items) => [...items, emptySlot()])} className="flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-sm font-black text-slate-950"><Plus className="h-4 w-4" /> افزودن بازه</button></div>
        <div className="space-y-3">{slots.map((slot, index) => <div key={slot.id} className="grid gap-3 rounded-2xl border border-slate-700 bg-slate-950/70 p-4 md:grid-cols-[1fr_150px_150px_120px_100px]">
          <label><FieldHelp title="نام بازه">متنی که مشتری می‌بیند؛ مثل «صبح ۹ تا ۱۱».</FieldHelp><input className={inputClass} value={slot.label} placeholder="مثلاً ۹ تا ۱۱" onChange={(e) => setSlots((items) => items.map((x, i) => i === index ? { ...x, label: e.target.value } : x))} /></label>
          <label><FieldHelp title="ساعت شروع">ابتدای زمانی که مشتری می‌تواند انتخاب کند.</FieldHelp><input className={inputClass} type="time" value={slot.start_time} onChange={(e) => setSlots((items) => items.map((x, i) => i === index ? { ...x, start_time: e.target.value } : x))} /></label>
          <label><FieldHelp title="ساعت پایان">انتهای این بازه رزرو.</FieldHelp><input className={inputClass} type="time" value={slot.end_time} onChange={(e) => setSlots((items) => items.map((x, i) => i === index ? { ...x, end_time: e.target.value } : x))} /></label>
          <label><FieldHelp title="ظرفیت بازه">حداکثر تعداد رزروی که هم‌زمان در این بازه پذیرفته می‌شود.</FieldHelp><input className={inputClass} type="number" min="1" value={slot.capacity} onChange={(e) => setSlots((items) => items.map((x, i) => i === index ? { ...x, capacity: Number(e.target.value), remaining: Number(e.target.value) } : x))} /></label>
          <div className="flex gap-2"><button onClick={async () => { await saveBookingSlot(slot); setMessage('بازه ذخیره شد.'); }} className="rounded-xl bg-emerald-500/20 p-2 text-emerald-200"><Save className="h-4 w-4" /></button><button onClick={async () => { await deleteBookingSlot(slot.id); setSlots((items) => items.filter((x) => x.id !== slot.id)); }} className="rounded-xl bg-rose-500/20 p-2 text-rose-200"><Trash2 className="h-4 w-4" /></button></div>
        </div>)}</div>
      </section>

      <section className="rounded-3xl border border-slate-700 bg-slate-900/75 p-5">
        <h2 className="mb-2 font-black">قیمت‌گذاری داینامیک</h2>
        <p className="mb-4 text-xs leading-6 text-slate-400">مبدأ فعلی: تقاطع آزادگان و بزرگراه ساوه. مبلغ پایه تا این نقطه محاسبه شده و فاصله مسیر از این نقطه تا مشتری با نشان محاسبه می‌شود.</p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            ['travel_fee','کرایه پایه (تومان)','مبلغ ثابت شروع ایاب‌وذهاب که برای هر رزرو محاسبه می‌شود.'],
            ['travel_per_km_fee','کرایه هر کیلومتر اضافه','هزینه هر کیلومتر مسیر نشان از مبدأ تعیین‌شده تا مشتری.'],
            ['service_radius_km','شعاع مجاز از مرکز تهران (کیلومتر)','مقصد خارج از این شعاع برای رزرو عادی مجاز نیست.'],
            ['traffic_zone_surcharge_percent','افزایش محدوده طرح ترافیک (درصد)','درصدی که فقط برای مقصد داخل محدوده طرح به کرایه افزوده می‌شود.'],
            ['travel_origin_latitude','عرض جغرافیایی مبدأ کرایه','مختصات شمالی مبدأ حرکت؛ فقط هنگام تغییر محل اعزام ویرایش شود.'],
            ['travel_origin_longitude','طول جغرافیایی مبدأ کرایه','مختصات شرقی مبدأ حرکت؛ همراه عرض جغرافیایی استفاده می‌شود.'],
            ['service_center_latitude','عرض جغرافیایی مرکز محدوده','مرکز محاسبه شعاع مجاز خدمات.'],
            ['service_center_longitude','طول جغرافیایی مرکز محدوده','مختصات دوم مرکز محاسبه شعاع.'],
            ['night_fee','هزینه شب','افزایش ثابت رزرو شب؛ عدد صفر یعنی غیرفعال.'],
            ['holiday_fee','هزینه تعطیلات','افزایش ثابت روز تعطیل؛ عدد صفر یعنی غیرفعال.'],
            ['out_of_area_fee','هزینه خارج محدوده','هزینه ثابت اضافه در صورت اجازه دستی به مقصد خارج محدوده.'],
            ['night_start_hour','شروع ساعت شب','از این ساعت به بعد رزرو شب محسوب می‌شود؛ عدد بین ۰ تا ۲۳.'],
            ['club_discount_percent','تخفیف باشگاه (درصد)','درصد تخفیف مشتری عضو باشگاه از هزینه‌های مشمول.'],
          ].map(([key,label,help]) => <label key={key} className="text-sm text-slate-300"><FieldHelp title={label}>{help}</FieldHelp><input className={inputClass} type="number" step={key.includes('latitude') || key.includes('longitude') ? '0.0000001' : '1'} value={pricing[key as keyof ServicePricingSettings] as number} onChange={(e) => setPricing((old) => ({ ...old, [key]: Number(e.target.value) }))} /></label>)}
          <label className="space-y-2 text-sm text-slate-300 md:col-span-2 lg:col-span-3"><span>شهرهای داخل محدوده (با ویرگول)</span><input className={inputClass} value={pricing.service_area_cities.join('، ')} onChange={(e) => setPricing((old) => ({ ...old, service_area_cities: e.target.value.split(/[،,]/).map((x) => x.trim()).filter(Boolean) }))} /></label>
          <label className="space-y-2 text-sm text-slate-300 md:col-span-2 lg:col-span-3"><span>مرز محدوده طرح ترافیک (JSON پیشرفته)</span><textarea rows={4} dir="ltr" className={`${inputClass} font-mono text-xs`} value={JSON.stringify(pricing.traffic_zone_polygon)} onChange={(e) => { try { const value = JSON.parse(e.target.value); if (Array.isArray(value)) setPricing((old) => ({ ...old, traffic_zone_polygon: value })); } catch { /* keep last valid polygon while typing */ } }} /><small className="block text-slate-500">هر نقطه به‌شکل [عرض جغرافیایی، طول جغرافیایی] ثبت می‌شود. فقط در صورت تغییر رسمی محدوده ویرایش شود.</small></label>
        </div>
        <button onClick={async () => { try { await saveServicePricingSettings(pricing); setMessage('تنظیمات قیمت با موفقیت در سرور ذخیره شد.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'ذخیره قیمت‌گذاری انجام نشد.'); } }} className="mt-5 flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 font-black text-slate-950"><Save className="h-4 w-4" /> ذخیره قیمت‌گذاری</button>
      </section>
    </div>
  );
}
