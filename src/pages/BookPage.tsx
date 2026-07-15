import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Car, Check, CheckCircle2, ChevronLeft, Clock3, Loader2, MapPin, PackageSearch, Phone, Sparkles, UserRound, WalletCards, Wrench } from 'lucide-react';
import { getActiveCarsForCustomer, getCarTitle, type Car as AdminCar } from '../admin/services/carsApi';
import { getProducts, type Product } from '../admin/services/productsApi';
import { formatCustomerAddress, getCustomerAddresses, type CustomerAddress } from '../customer/services/addressApi';
import { createServiceRequest } from '../customer/services/serviceRequestsApi';
import { readSelectedCustomerCar, saveSelectedCustomerCar } from '../customer/services/selectedCar';
import {
  calculateServicePricing,
  getBookingServices,
  getBookingSlots,
  getServicePricingSettings,
  type BookingService,
  type BookingSlot,
  type ServicePricingSettings,
} from '../customer/services/serviceBookingApi';

const money = (value: number) => `${Number(value || 0).toLocaleString('fa-IR')} تومان`;
const tomorrow = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); };

function getDateOptions() {
  return Array.from({ length: 10 }).map((_, index) => {
    const date = new Date(); date.setDate(date.getDate() + index + 1);
    const value = date.toISOString().slice(0, 10);
    return { value, label: new Intl.DateTimeFormat('fa-IR', { weekday: 'long', month: 'long', day: 'numeric' }).format(date) };
  });
}

export default function BookPage() {
  const [cars, setCars] = useState<AdminCar[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<BookingService[]>([]);
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [pricing, setPricing] = useState<ServicePricingSettings>({ travel_fee: 0, night_fee: 0, holiday_fee: 0, out_of_area_fee: 0, night_start_hour: 18, club_discount_percent: 0, service_area_cities: [] });
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [selectedCarId, setSelectedCarId] = useState(readSelectedCustomerCar()?.id || '');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [currentKm, setCurrentKm] = useState('');
  const [date, setDate] = useState(tomorrow());
  const [slotId, setSlotId] = useState('');
  const [addressId, setAddressId] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [city, setCity] = useState('پرند');
  const [note, setNote] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [requestNumber, setRequestNumber] = useState('');
  const [error, setError] = useState('');

  const selectedCar = useMemo(() => cars.find((item) => item.id === selectedCarId) || null, [cars, selectedCarId]);
  const selectedServices = useMemo(() => services.filter((item) => selectedServiceIds.includes(item.id)), [services, selectedServiceIds]);
  const selectedSlot = useMemo(() => slots.find((item) => item.id === slotId) || null, [slots, slotId]);
  const selectedAddress = useMemo(() => addresses.find((item) => item.id === addressId) || null, [addresses, addressId]);
  const dateOptions = useMemo(getDateOptions, []);

  const recommendedProducts = useMemo(() => {
    if (!selectedCar) return [];
    const categories = selectedServices.flatMap((item) => item.recommended_categories || []);
    return products.filter((product) => {
      if (product.is_active === false || Number(product.stock || 0) <= 0) return false;
      const compatible = product.compatible_all_cars || product.compatible_car_ids?.includes(selectedCar.id || '');
      const categoryMatch = categories.some((cat) => String(product.category || '').includes(cat) || cat.includes(String(product.category || '')));
      return compatible && (categoryMatch || categories.length === 0);
    }).slice(0, 8);
  }, [products, selectedCar, selectedServices]);

  const price = useMemo(() => calculateServicePricing({ services: selectedServices, pricing, date, slot: selectedSlot, city, isClubMember: true }), [selectedServices, pricing, date, selectedSlot, city]);

  useEffect(() => {
    Promise.all([getActiveCarsForCustomer(), getProducts().catch(() => []), getBookingServices(), getServicePricingSettings()]).then(([carItems, productItems, serviceItems, pricingSettings]) => {
      setCars(carItems); setProducts(productItems); setServices(serviceItems); setPricing(pricingSettings);
      if (!selectedCarId && carItems[0]?.id) setSelectedCarId(carItems[0].id);
      if (serviceItems[0]?.id) setSelectedServiceIds([serviceItems[0].id]);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { getBookingSlots(date).then((items) => { setSlots(items); if (!items.some((x) => x.id === slotId && x.remaining > 0)) setSlotId(items.find((x) => x.remaining > 0)?.id || ''); }); }, [date]);
  useEffect(() => { if (selectedCar) saveSelectedCustomerCar(selectedCar); }, [selectedCar]);
  useEffect(() => {
    if (customerPhone.trim().length < 10) { setAddresses([]); return; }
    getCustomerAddresses(customerPhone.trim()).then((items) => { setAddresses(items); const first = items.find((x) => x.is_default) || items[0]; if (first?.id) { setAddressId(first.id); setCity(first.city || city); } });
  }, [customerPhone]);

  function toggleService(id: string) { setSelectedServiceIds((items) => items.includes(id) ? items.filter((x) => x !== id) : [...items, id]); }
  function next() {
    setError('');
    if (step === 1 && (!selectedCar || !selectedServiceIds.length)) return setError('خودرو و حداقل یک خدمت را انتخاب کنید.');
    if (step === 2 && !date) return setError('روز و بازه زمانی را انتخاب کنید.');
    if (step === 3 && (!customerPhone.trim() || !(selectedAddress || manualAddress.trim()))) return setError('شماره موبایل و آدرس الزامی است.');
    setStep((value) => Math.min(4, value + 1));
  }

  async function submit() {
    if (!selectedCar || !selectedSlot || !selectedServices.length) return;
    setSubmitting(true); setError('');
    try {
      const addressText = selectedAddress ? formatCustomerAddress(selectedAddress) : manualAddress.trim();
      const request = await createServiceRequest({
        customer_name: customerName.trim() || 'مشتری کارتل', customer_phone: customerPhone.trim(),
        vehicle_id: selectedCar.id || null, vehicle_title: getCarTitle(selectedCar), current_km: Number(currentKm || 0),
        last_service_km: Number(currentKm || 0), service_interval_km: Number(selectedCar.service_interval_km || 5000),
        address_id: selectedAddress?.id || null, address_text: addressText, latitude: selectedAddress?.latitude || null, longitude: selectedAddress?.longitude || null,
        city, preferred_date: date, preferred_time: selectedSlot.start_time, booking_slot_id: selectedSlot.id, booking_slot_label: selectedSlot.label,
        service_title: selectedServices.map((item) => item.title).join(' + '), service_ids: selectedServiceIds,
        service_items: selectedServices.map((item) => ({ id: item.id, title: item.title, labor_fee: item.base_labor_fee, estimated_minutes: item.estimated_minutes })),
        suggested_product_ids: selectedProductIds, pricing_breakdown: price, estimated_total: price.total, note: note.trim() || null,
      });
      setRequestNumber(request.request_number);
    } catch (e) { setError(e instanceof Error ? e.message : 'ثبت رزرو انجام نشد.'); }
    finally { setSubmitting(false); }
  }

  if (loading) return <main className="min-h-screen bg-slate-100 pt-32 text-slate-900" dir="rtl"><Loader2 className="mx-auto h-9 w-9 animate-spin" /></main>;
  if (requestNumber) return <main className="min-h-screen bg-slate-100 px-4 pb-20 pt-32 text-slate-900" dir="rtl"><div className="mx-auto max-w-3xl rounded-[2rem] border border-emerald-200 bg-white p-8 text-center shadow-xl"><CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" /><h1 className="mt-5 text-3xl font-black">رزرو با موفقیت ثبت شد</h1><p className="mt-3 text-slate-500">شماره پیگیری: <b className="text-slate-900">{requestNumber}</b></p><div className="mt-8 grid grid-cols-5 gap-2 text-xs"><span className="rounded-xl bg-emerald-100 p-3 font-bold text-emerald-700">در انتظار تأیید</span><span className="rounded-xl bg-slate-100 p-3">تخصیص سرویس‌کار</span><span className="rounded-xl bg-slate-100 p-3">در مسیر</span><span className="rounded-xl bg-slate-100 p-3">در حال سرویس</span><span className="rounded-xl bg-slate-100 p-3">تکمیل</span></div></div></main>;

  return <main className="min-h-screen bg-slate-100 px-4 pb-20 pt-28 text-slate-900" dir="rtl"><div className="mx-auto max-w-6xl">
    <header className="mb-6 rounded-[2rem] bg-gradient-to-l from-slate-900 via-slate-800 to-amber-700 p-7 text-white shadow-xl"><div className="flex items-center gap-3"><Wrench className="h-8 w-8 text-amber-300" /><div><h1 className="text-3xl font-black">رزرو هوشمند سرویس در محل</h1><p className="mt-2 text-sm text-white/65">خدمت، زمان و آدرس را انتخاب کن؛ هزینه قبل از ثبت شفاف محاسبه می‌شود.</p></div></div></header>
    <div className="mb-6 grid grid-cols-4 gap-2">{['خدمت و خودرو','زمان','آدرس','تأیید نهایی'].map((label,index) => <div key={label} className={`rounded-2xl px-3 py-3 text-center text-sm font-bold ${step >= index+1 ? 'bg-amber-400 text-slate-950' : 'bg-white text-slate-400'}`}>{index+1}. {label}</div>)}</div>
    {error && <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div>}

    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        {step === 1 && <div className="space-y-6"><div><h2 className="mb-3 flex items-center gap-2 text-xl font-black"><Car className="h-5 w-5 text-amber-500" /> انتخاب خودرو</h2><select value={selectedCarId} onChange={(e) => setSelectedCarId(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 outline-none focus:border-amber-400">{cars.map((car) => <option key={car.id} value={car.id}>{getCarTitle(car)}</option>)}</select></div><div><h2 className="mb-3 text-xl font-black">خدمات موردنیاز</h2><div className="grid gap-3 md:grid-cols-2">{services.map((service) => { const active=selectedServiceIds.includes(service.id); return <button key={service.id} onClick={() => toggleService(service.id)} className={`rounded-2xl border p-4 text-right transition ${active ? 'border-amber-400 bg-amber-50 shadow-md' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}><div className="flex items-start gap-3"><span className="text-2xl">{service.icon}</span><div className="flex-1"><div className="flex items-center justify-between"><b>{service.title}</b>{active && <Check className="h-5 w-5 text-emerald-500" />}</div><p className="mt-1 text-xs leading-6 text-slate-500">{service.description}</p><div className="mt-2 text-sm font-bold text-amber-700">اجرت {money(service.base_labor_fee)}</div></div></div></button>})}</div></div></div>}
        {step === 2 && <div className="space-y-6"><h2 className="flex items-center gap-2 text-xl font-black"><CalendarDays className="h-5 w-5 text-amber-500" /> انتخاب روز و ظرفیت</h2><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{dateOptions.map((item) => <button key={item.value} onClick={() => setDate(item.value)} className={`rounded-2xl border p-3 text-sm font-bold ${date===item.value?'border-amber-400 bg-amber-50':'border-slate-200 bg-slate-50'}`}>{item.label}</button>)}</div><div className="grid gap-3 md:grid-cols-3">{slots.map((slot) => <button disabled={slot.remaining<=0} key={slot.id} onClick={() => setSlotId(slot.id)} className={`rounded-2xl border p-4 ${slotId===slot.id?'border-amber-400 bg-amber-50':'border-slate-200 bg-slate-50'} disabled:cursor-not-allowed disabled:opacity-45`}><Clock3 className="mx-auto mb-2 h-5 w-5"/><b>{slot.label}</b><p className={`mt-2 text-xs ${slot.remaining>1?'text-emerald-600':slot.remaining===1?'text-amber-600':'text-rose-600'}`}>{slot.remaining>0?`${slot.remaining.toLocaleString('fa-IR')} ظرفیت باقی‌مانده`:'تکمیل'}</p></button>)}</div></div>}
        {step === 3 && <div className="space-y-5"><h2 className="flex items-center gap-2 text-xl font-black"><MapPin className="h-5 w-5 text-amber-500" /> اطلاعات مشتری و آدرس</h2><div className="grid gap-4 md:grid-cols-2"><label className="space-y-2"><span className="text-sm font-bold">نام مشتری</span><div className="relative"><UserRound className="absolute right-4 top-4 h-4 w-4 text-slate-400"/><input value={customerName} onChange={(e)=>setCustomerName(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-4 pr-11 outline-none focus:border-amber-400"/></div></label><label className="space-y-2"><span className="text-sm font-bold">شماره موبایل</span><div className="relative"><Phone className="absolute right-4 top-4 h-4 w-4 text-slate-400"/><input value={customerPhone} onChange={(e)=>setCustomerPhone(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-4 pr-11 outline-none focus:border-amber-400"/></div></label><label className="space-y-2"><span className="text-sm font-bold">کیلومتر فعلی</span><input type="number" value={currentKm} onChange={(e)=>setCurrentKm(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-amber-400"/></label><label className="space-y-2"><span className="text-sm font-bold">شهر</span><input value={city} onChange={(e)=>setCity(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-amber-400"/></label></div>{addresses.length>0 && <div className="grid gap-2">{addresses.map((address)=><button key={address.id} onClick={()=>{setAddressId(address.id||'');setCity(address.city)}} className={`rounded-2xl border p-4 text-right ${addressId===address.id?'border-amber-400 bg-amber-50':'border-slate-200 bg-slate-50'}`}><b>{address.title}</b><p className="mt-1 text-xs text-slate-500">{formatCustomerAddress(address)}</p></button>)}</div>}<textarea value={manualAddress} onChange={(e)=>setManualAddress(e.target.value)} rows={3} placeholder="در صورت نداشتن آدرس ذخیره‌شده، آدرس دقیق را وارد کنید" className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 outline-none focus:border-amber-400"/><textarea value={note} onChange={(e)=>setNote(e.target.value)} rows={2} placeholder="توضیحات تکمیلی" className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 outline-none focus:border-amber-400"/></div>}
        {step === 4 && <div className="space-y-6"><h2 className="text-xl font-black">پیشنهاد اقلام مناسب خودروی شما</h2>{recommendedProducts.length ? <div className="grid gap-3 md:grid-cols-2">{recommendedProducts.map((product)=>{const active=selectedProductIds.includes(product.id||'');return <button key={product.id} onClick={()=>setSelectedProductIds((items)=>active?items.filter((x)=>x!==product.id):[...items,product.id||''])} className={`flex items-center gap-3 rounded-2xl border p-3 text-right ${active?'border-amber-400 bg-amber-50':'border-slate-200 bg-slate-50'}`}><div className="h-16 w-16 rounded-xl bg-white p-2"><img src={product.image_url} className="h-full w-full object-contain"/></div><div className="min-w-0 flex-1"><b className="line-clamp-2 text-sm">{product.name}</b><p className="mt-1 text-xs text-slate-500">{product.recommendation_reason || 'سازگار با خودروی انتخاب‌شده'}</p><span className="mt-2 block text-sm font-black text-amber-700">{money(product.price)}</span></div>{active&&<CheckCircle2 className="h-5 w-5 text-emerald-500"/>}</button>})}</div>:<div className="rounded-2xl bg-slate-50 p-5 text-slate-500"><PackageSearch className="mb-2 h-6 w-6"/>محصول مکمل مشخصی پیدا نشد؛ رزرو سرویس بدون انتخاب کالا هم امکان‌پذیر است.</div>}<div className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><h3 className="font-black">خلاصه رزرو</h3><div className="mt-3 grid gap-2 text-sm text-slate-600"><p>خودرو: <b className="text-slate-900">{selectedCar && getCarTitle(selectedCar)}</b></p><p>خدمات: <b className="text-slate-900">{selectedServices.map((x)=>x.title).join('، ')}</b></p><p>زمان: <b className="text-slate-900">{dateOptions.find((x)=>x.value===date)?.label} - {selectedSlot?.label}</b></p><p>آدرس: <b className="text-slate-900">{selectedAddress?formatCustomerAddress(selectedAddress):manualAddress}</b></p></div></div></div>}
        <div className="mt-7 flex items-center justify-between border-t border-slate-100 pt-5"><button disabled={step===1} onClick={()=>setStep((x)=>Math.max(1,x-1))} className="rounded-xl border border-slate-200 px-5 py-3 font-bold disabled:opacity-40">مرحله قبل</button>{step<4?<button onClick={next} className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-black text-white">ادامه <ChevronLeft className="h-4 w-4"/></button>:<button onClick={submit} disabled={submitting} className="flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 font-black text-slate-950 disabled:opacity-60">{submitting?<Loader2 className="h-4 w-4 animate-spin"/>:<CheckCircle2 className="h-4 w-4"/>} ثبت نهایی رزرو</button>}</div>
      </section>
      <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-28"><div className="mb-4 flex items-center gap-2"><WalletCards className="h-5 w-5 text-amber-500"/><h2 className="font-black">برآورد هزینه</h2></div><div className="space-y-3 text-sm"><div className="flex justify-between"><span>اجرت خدمات</span><b>{money(price.labor)}</b></div><div className="flex justify-between"><span>ایاب‌وذهاب</span><b>{money(price.travel)}</b></div>{price.night>0&&<div className="flex justify-between"><span>هزینه بازه شب</span><b>{money(price.night)}</b></div>}{price.holiday>0&&<div className="flex justify-between"><span>هزینه روز تعطیل</span><b>{money(price.holiday)}</b></div>}{price.outOfArea>0&&<div className="flex justify-between"><span>خارج از محدوده</span><b>{money(price.outOfArea)}</b></div>}{price.discount>0&&<div className="flex justify-between text-emerald-600"><span>تخفیف باشگاه</span><b>- {money(price.discount)}</b></div>}<div className="border-t border-slate-200 pt-4"><div className="flex items-center justify-between text-lg"><span className="font-black">جمع خدمات</span><b className="text-amber-700">{money(price.total)}</b></div><p className="mt-2 text-xs leading-6 text-slate-400">قیمت کالاهای انتخابی جداگانه به سبد خرید اضافه می‌شود.</p></div></div><div className="mt-5 rounded-2xl bg-amber-50 p-4 text-xs leading-6 text-amber-800"><Sparkles className="mb-2 h-5 w-5"/> نزدیک‌ترین سرویس‌کار فعال پس از تأیید مدیر به‌صورت خودکار تخصیص داده می‌شود.</div></aside>
    </div>
  </div></main>;
}
