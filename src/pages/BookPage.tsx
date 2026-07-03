import { useState, useMemo } from 'react';
import {
  Car, Droplets, Calendar, Clock, MapPin, CreditCard,
  ChevronLeft, ChevronRight, CheckCircle2, Filter,
  Star, Shield, Info, Navigation, Truck
} from 'lucide-react';
import { vehicles, products, formatPrice } from '../data/products';

type Step = 1 | 2 | 3 | 4 | 5;

const timeSlots = [
  '۰۸:۰۰', '۰۸:۳۰', '۰۹:۰۰', '۰۹:۳۰', '۱۰:۰۰', '۱۰:۳۰',
  '۱۱:۰۰', '۱۱:۳۰', '۱۲:۰۰', '۱۳:۰۰', '۱۳:۳۰', '۱۴:۰۰',
  '۱۴:۳۰', '۱۵:۰۰', '۱۵:۳۰', '۱۶:۰۰', '۱۶:۳۰', '۱۷:۰۰',
];

export default function BookPage() {
  const [step, setStep] = useState<Step>(1);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedOil, setSelectedOil] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [location, setLocation] = useState('');
  const [distance, setDistance] = useState(0);

  const vehicle = vehicles.find(v => v.id === selectedVehicle);
  const oil = products.find(p => p.id === selectedOil);
  const filter = products.find(p => p.id === selectedFilter);

  const serviceFee = useMemo(() => {
    const baseFee = 50000;
    const distFee = distance * 2000;
    return baseFee + distFee;
  }, [distance]);

  const totalPrice = useMemo(() => {
    let total = serviceFee;
    if (oil) total += oil.price;
    if (filter) total += filter.price;
    return total;
  }, [oil, filter, serviceFee]);

  const recommendedOils = useMemo(() => {
    if (!vehicle) return products.filter(p => p.category === 'engine-oil').slice(0, 4);
    return products.filter(p => p.category === 'engine-oil' && p.viscosity === vehicle.recommendedOil);
  }, [vehicle]);

  const compatibleFilters = useMemo(() => {
    if (!vehicle) return products.filter(p => p.category === 'oil-filter').slice(0, 3);
    return products.filter(p => p.category === 'oil-filter' && p.compatibleVehicles.some(v => vehicle.model.includes(v) || v.includes(vehicle.model)));
  }, [vehicle]);

  const steps = [
    { num: 1, icon: Car, label: 'خودرو' },
    { num: 2, icon: Droplets, label: 'روغن و فیلتر' },
    { num: 3, icon: Calendar, label: 'زمان' },
    { num: 4, icon: MapPin, label: 'مکان' },
    { num: 5, icon: CreditCard, label: 'پرداخت' },
  ];

  const canProceed = () => {
    switch (step) {
      case 1: return !!selectedVehicle;
      case 2: return !!selectedOil;
      case 3: return !!selectedDate && !!selectedTime;
      case 4: return !!location;
      case 5: return true;
      default: return false;
    }
  };

  const simulateDistance = () => {
    const d = Math.floor(Math.random() * 15) + 2;
    setDistance(d);
  };

  return (
    <main className="pt-24 pb-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="section-title !text-3xl md:!text-4xl mb-3">
            رزرو <span className="gold-gradient-text">تعویض روغن</span>
          </h1>
          <p className="text-white/50 text-lg">
            در ۵ مرحله ساده، تعویض روغن در محل خود را رزرو کنید
          </p>
        </div>

        {/* Step Progress */}
        <div className="flex items-center justify-between mb-12 px-4">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div className={`flex flex-col items-center gap-2 ${
                step >= s.num ? 'text-gold-500' : 'text-white/30'
              }`}>
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all ${
                  step > s.num
                    ? 'bg-gold-500 text-navy-950'
                    : step === s.num
                    ? 'bg-gold-500/10 border border-gold-500/30 text-gold-500'
                    : 'bg-white/5 border border-white/10 text-white/30'
                }`}>
                  {step > s.num ? <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" /> : <s.icon className="w-5 h-5 md:w-6 md:h-6" />}
                </div>
                <span className="text-xs font-medium hidden md:block">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 md:w-16 h-0.5 mx-1 md:mx-3 rounded transition-colors ${
                  step > s.num ? 'bg-gold-500' : 'bg-white/10'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="glass-card min-h-[400px]">
          {/* Step 1: Vehicle Selection */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold mb-2">خودروی خود را انتخاب کنید</h2>
              <p className="text-white/50 text-sm mb-6">مدل خودروی خود را انتخاب تا روغن مناسب را پیشنهاد دهیم</p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {vehicles.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVehicle(v.id === selectedVehicle ? '' : v.id)}
                    className={`p-4 rounded-xl border text-right transition-all ${
                      selectedVehicle === v.id
                        ? 'border-gold-500 bg-gold-500/10'
                        : 'border-white/10 bg-white/[0.02] hover:bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="font-bold text-sm mb-1">{v.model}</div>
                    <div className="text-white/40 text-xs">{v.brand} - {v.engineType}</div>
                    <div className="mt-2 text-xs">
                      <span className="text-white/30">ویسکوزیته پیشنهادی: </span>
                      <span className="text-gold-500 font-medium">{v.recommendedOil}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Oil & Filter Selection */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold mb-2">روغن و فیلتر را انتخاب کنید</h2>
              <p className="text-white/50 text-sm mb-6">
                {vehicle ? `روغن پیشنهادی برای ${vehicle.model}: ${vehicle.recommendedOil}` : 'ابتدا خودرو را انتخاب کنید'}
              </p>

              <div className="mb-8">
                <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-gold-500" />
                  روغن موتور
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {recommendedOils.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedOil(p.id === selectedOil ? '' : p.id)}
                      className={`p-4 rounded-xl border text-right transition-all flex items-center gap-4 ${
                        selectedOil === p.id
                          ? 'border-gold-500 bg-gold-500/10'
                          : 'border-white/10 bg-white/[0.02] hover:bg-white/5'
                      }`}
                    >
                      <img src={p.image} alt={p.name} className="w-16 h-16 rounded-lg object-cover opacity-70" />
                      <div className="flex-1">
                        <div className="font-bold text-sm">{p.name}</div>
                        <div className="text-white/40 text-xs mt-0.5">{p.brand} - {p.viscosity}</div>
                        <div className="flex items-center gap-1 mt-1.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < Math.floor(p.rating) ? 'fill-gold-500 text-gold-500' : 'text-white/20'}`} />
                          ))}
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="font-extrabold text-sm gold-gradient-text">{formatPrice(p.price)}</div>
                        <div className="text-white/30 text-xs">تومان</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gold-500" />
                  فیلتر روغن
                  <span className="text-white/30 text-xs font-normal">(اختیاری)</span>
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {compatibleFilters.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedFilter(p.id === selectedFilter ? '' : p.id)}
                      className={`p-4 rounded-xl border text-right transition-all flex items-center gap-4 ${
                        selectedFilter === p.id
                          ? 'border-gold-500 bg-gold-500/10'
                          : 'border-white/10 bg-white/[0.02] hover:bg-white/5'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="font-bold text-sm">{p.name}</div>
                        <div className="text-white/40 text-xs mt-0.5">{p.brand}</div>
                      </div>
                      <div className="text-left">
                        <div className="font-extrabold text-sm gold-gradient-text">{formatPrice(p.price)}</div>
                        <div className="text-white/30 text-xs">تومان</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Date & Time */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold mb-2">زمان سرویس را انتخاب کنید</h2>
              <p className="text-white/50 text-sm mb-6">تاریخ و ساعت دلخواه خود را برگزینید</p>

              <div className="mb-8">
                <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gold-500" />
                  تاریخ
                </h3>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {Array.from({ length: 10 }).map((_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() + i + 1);
                    const dateStr = d.toLocaleDateString('fa-IR', { month: 'long', day: 'numeric' });
                    const weekday = d.toLocaleDateString('fa-IR', { weekday: 'short' });
                    const val = d.toISOString().split('T')[0];
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedDate(val === selectedDate ? '' : val)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          selectedDate === val
                            ? 'border-gold-500 bg-gold-500/10'
                            : 'border-white/10 bg-white/[0.02] hover:bg-white/5'
                        }`}
                      >
                        <div className="text-xs text-white/40 mb-1">{weekday}</div>
                        <div className="font-bold text-sm">{dateStr}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gold-500" />
                  ساعت
                </h3>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                  {timeSlots.map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTime(t === selectedTime ? '' : t)}
                      className={`py-2.5 rounded-lg border text-sm font-medium transition-all ${
                        selectedTime === t
                          ? 'border-gold-500 bg-gold-500/10 text-gold-500'
                          : 'border-white/10 bg-white/[0.02] text-white/60 hover:bg-white/5'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Location */}
          {step === 4 && (
            <div>
              <h2 className="text-xl font-bold mb-2">مکان سرویس</h2>
              <p className="text-white/50 text-sm mb-6">آدرس محل خود را وارد کنید یا روی نقشه کلیک کنید</p>

              <div className="relative aspect-video bg-navy-800 rounded-xl overflow-hidden mb-6 border border-white/10">
                <img
                  src="https://images.pexels.com/photos/2036869/pexels-photo-2036869.jpeg?auto=compress&cs=tinysrgb&w=1200"
                  alt="Map"
                  className="w-full h-full object-cover opacity-20"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-gold-500 mx-auto mb-3 animate-bounce" />
                    <p className="text-sm text-white/60">روی نقشه کلیک کنید یا آدرس را وارد کنید</p>
                  </div>
                </div>
                <div className="absolute top-3 left-3 flex gap-2">
                  <button
                    onClick={simulateDistance}
                    className="bg-navy-950/80 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-xs font-medium flex items-center gap-2 hover:bg-white/5 transition-colors"
                  >
                    <Navigation className="w-4 h-4 text-gold-500" />
                    محاسبه فاصله
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">آدرس کامل</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="مثال: پردیس، فاز ۴، بلوار نور، پلاک ۱۲"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder:text-white/30 focus:outline-none focus:border-gold-500/40 transition-colors"
                  />
                </div>

                {distance > 0 && (
                  <div className="glass-card !p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Truck className="w-5 h-5 text-gold-500" />
                      <span className="text-sm">فاصله از انبار</span>
                    </div>
                    <span className="font-bold text-sm">{distance} کیلومتر</span>
                  </div>
                )}

                <div className="glass-card !p-4 flex items-center gap-3">
                  <Info className="w-5 h-5 text-accent-400 shrink-0" />
                  <p className="text-white/40 text-xs leading-6">
                    هزینه سرویس بر اساس فاصله از انبار محاسبه می‌شود. پایه: ۵۰,۰۰۰ تومان + ۲,۰۰۰ تومان به ازای هر کیلومتر
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Payment */}
          {step === 5 && (
            <div>
              <h2 className="text-xl font-bold mb-2">خلاصه و پرداخت</h2>
              <p className="text-white/50 text-sm mb-6">اطلاعات سفارش خود را بررسی و پرداخت کنید</p>

              <div className="space-y-3 mb-6">
                {vehicle && (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="flex items-center gap-3">
                      <Car className="w-5 h-5 text-gold-500" />
                      <span className="text-sm">خودرو</span>
                    </div>
                    <span className="font-bold text-sm">{vehicle.model} ({vehicle.brand})</span>
                  </div>
                )}
                {oil && (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="flex items-center gap-3">
                      <Droplets className="w-5 h-5 text-gold-500" />
                      <span className="text-sm">روغن موتور</span>
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-sm">{oil.name}</div>
                      <div className="text-white/40 text-xs">{formatPrice(oil.price)} تومان</div>
                    </div>
                  </div>
                )}
                {filter && (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="flex items-center gap-3">
                      <Filter className="w-5 h-5 text-gold-500" />
                      <span className="text-sm">فیلتر روغن</span>
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-sm">{filter.name}</div>
                      <div className="text-white/40 text-xs">{formatPrice(filter.price)} تومان</div>
                    </div>
                  </div>
                )}
                {selectedDate && selectedTime && (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gold-500" />
                      <span className="text-sm">زمان</span>
                    </div>
                    <span className="font-bold text-sm">
                      {new Date(selectedDate).toLocaleDateString('fa-IR', { month: 'long', day: 'numeric' })} ساعت {selectedTime}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center gap-3">
                    <Truck className="w-5 h-5 text-gold-500" />
                    <span className="text-sm">هزینه سرویس</span>
                  </div>
                  <span className="font-bold text-sm">{formatPrice(serviceFee)} تومان</span>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-gold-500/5 border border-gold-500/20 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold">مبلغ کل</span>
                  <span className="text-2xl font-extrabold gold-gradient-text">{formatPrice(totalPrice)} تومان</span>
                </div>
              </div>

              <div className="glass-card !p-4 flex items-center gap-3 mb-6">
                <Shield className="w-5 h-5 text-green-400 shrink-0" />
                <p className="text-white/40 text-xs">پرداخت امن از طریق درگاه بانکی. اطلاعات شما محرمانه می‌ماند.</p>
              </div>

              <button className="btn-primary w-full text-lg flex items-center justify-center gap-2">
                <CreditCard className="w-5 h-5" />
                پرداخت آنلاین
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={() => setStep(Math.max(1, step - 1) as Step)}
            className={`btn-ghost flex items-center gap-2 ${step === 1 ? 'invisible' : ''}`}
          >
            <ChevronRight className="w-5 h-5" />
            مرحله قبل
          </button>

          <span className="text-white/30 text-sm">مرحله {step} از ۵</span>

          <button
            onClick={() => step < 5 && canProceed() && setStep((step + 1) as Step)}
            disabled={!canProceed() || step === 5}
            className={`btn-primary flex items-center gap-2 ${
              !canProceed() || step === 5 ? 'opacity-40 pointer-events-none' : ''
            }`}
          >
            مرحله بعد
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      </div>
    </main>
  );
}
