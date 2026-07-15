import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { createCar, deleteCar, getCars, getCarTitle, updateCar, TRANSMISSION_TYPES, type Car } from '../services/carsApi';
import { getOilSpecs, type OilSpec } from '../services/oilSpecsApi';

const emptyForm: Car = {
  brand: '',
  model: '',
  trim: '',
  engine: '',
  transmission_type: '',
  start_year: null,
  oil_viscosity: '',
  recommended_oil_grades: [],
  recommended_quality_levels: [],
  oil_capacity_liters: null,
  service_interval_km: 5000,
  is_active: true,
  notes: '',
};

function toggleValue(list: string[] = [], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function faSort(a: string | undefined, b: string | undefined) {
  return (a || '').localeCompare(b || '', 'fa');
}

const inputClass = 'w-full rounded-xl bg-slate-800 p-3 text-white outline-none focus:ring-2 focus:ring-yellow-400/40 placeholder:text-slate-500';

function Cars() {
  const [cars, setCars] = useState<Car[]>([]);
  const [oilSpecs, setOilSpecs] = useState<OilSpec[]>([]);
  const [form, setForm] = useState<Car>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  async function loadCars() {
    const data = await getCars();
    setCars(data);
  }

  async function loadOilSpecs() {
    const data = await getOilSpecs();
    setOilSpecs(data.filter((item) => item.is_active !== false));
  }

  useEffect(() => {
    loadCars();
    loadOilSpecs();
  }, []);

  const oilGrades = useMemo(() => oilSpecs.filter((item) => item.type === 'grade'), [oilSpecs]);
  const qualityLevels = useMemo(() => oilSpecs.filter((item) => item.type === 'quality'), [oilSpecs]);
  const manufacturers = useMemo(() => Array.from(new Set(cars.map((car) => car.brand).filter(Boolean))).sort(faSort), [cars]);
  const modelSuggestions = useMemo(() => Array.from(new Set(cars.filter((car) => !form.brand || car.brand === form.brand).map((car) => car.model).filter(Boolean))).sort(faSort), [cars, form.brand]);
  const trimSuggestions = useMemo(() => Array.from(new Set(cars.filter((car) => (!form.brand || car.brand === form.brand) && (!form.model || car.model === form.model)).map((car) => car.trim).filter(Boolean))).sort(faSort), [cars, form.brand, form.model]);
  const engineSuggestions = useMemo(() => Array.from(new Set(cars.filter((car) => (!form.brand || car.brand === form.brand) && (!form.model || car.model === form.model)).map((car) => car.engine).filter(Boolean))).sort(faSort), [cars, form.brand, form.model]);
  const productionYears = useMemo(() => Array.from({ length: 1410 - 1360 + 1 }, (_, index) => 1410 - index), []);

  const groupedCars = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = cars.filter((car) => {
      const title = `${getCarTitle(car)} ${car.transmission_type || ''} ${car.notes || ''} ${car.oil_viscosity || ''}`.toLowerCase();
      return !q || title.includes(q);
    });

    return filtered.reduce<Record<string, Car[]>>((groups, car) => {
      const manufacturer = car.brand || 'بدون شرکت سازنده';
      groups[manufacturer] = [...(groups[manufacturer] || []), car];
      return groups;
    }, {});
  }, [cars, search]);

  async function saveCar() {
    if (!form.brand.trim() || !form.model.trim()) {
      alert('شرکت سازنده و مدل خودرو الزامی است');
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        await updateCar(editingId, { ...form, end_year: null });
        alert('خودرو ویرایش شد ✅');
      } else {
        await createCar({ ...form, end_year: null });
        alert('خودرو ذخیره شد ✅');
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadCars();
    } finally {
      setLoading(false);
    }
  }

  function startEdit(car: Car) {
    setEditingId(car.id || null);
    setForm({
      ...emptyForm,
      ...car,
      start_year: car.start_year || null,
      transmission_type: car.transmission_type || '',
      recommended_oil_grades: car.recommended_oil_grades || [],
      recommended_quality_levels: car.recommended_quality_levels || [],
      end_year: null,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function remove(id?: string) {
    if (!id) return;
    if (!confirm('این خودرو حذف شود؟')) return;
    await deleteCar(id);
    loadCars();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">مدیریت خودروها</h1>
        <p className="mt-2 text-sm text-slate-400">خودروها پایه فیلتر فروشگاه، گاراژ مشتری و پیشنهاد هوشمند محصول هستند.</p>
      </div>

      <div className="rounded-2xl bg-slate-900 p-5 ring-1 ring-white/10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-white">{editingId ? 'ویرایش خودرو' : 'افزودن خودرو جدید'}</h2>
            <p className="mt-1 text-xs text-slate-500">فیلدها داینامیک هستند و از خودروهای قبلی پیشنهاد می‌گیرند.</p>
          </div>
          {editingId && <button onClick={() => { setEditingId(null); setForm(emptyForm); }} className="rounded-xl bg-slate-700 px-4 py-2 text-sm text-white">لغو ویرایش</button>}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Field label="شرکت سازنده" hint="مثال: ایران‌خودرو، سایپا، مدیران خودرو">
            <input list="car-manufacturers" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value, model: '' })} className={inputClass} />
            <datalist id="car-manufacturers">{manufacturers.map((item) => <option key={item} value={item} />)}</datalist>
          </Field>

          <Field label="مدل خودرو" hint="مثال: پژو 206، دنا پلاس، MVM X33">
            <input list="car-models" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className={inputClass} />
            <datalist id="car-models">{modelSuggestions.map((item) => <option key={item} value={item} />)}</datalist>
          </Field>

          <Field label="تیپ / نسخه" hint="مثال: تیپ 5، معمولی، توربو">
            <input list="car-trims" value={form.trim || ''} onChange={(e) => setForm({ ...form, trim: e.target.value })} className={inputClass} />
            <datalist id="car-trims">{trimSuggestions.map((item) => <option key={item} value={item} />)}</datalist>
          </Field>

          <Field label="کد موتور" hint="مثال: TU5، EF7، M13">
            <input list="car-engines" value={form.engine || ''} onChange={(e) => setForm({ ...form, engine: e.target.value })} className={inputClass} />
            <datalist id="car-engines">{engineSuggestions.map((item) => <option key={item} value={item} />)}</datalist>
          </Field>

          <Field label="سال تولید / شروع تولید" hint="سال پایان تولید حذف شد؛ فقط سال شروع یا مدل مرجع را وارد کن.">
            <select value={form.start_year || ''} onChange={(e) => setForm({ ...form, start_year: e.target.value ? +e.target.value : null, end_year: null })} className={inputClass}>
              <option value="">انتخاب سال</option>
              {productionYears.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </Field>

          <Field label="نوع گیربکس" hint="نوع گیربکس برای پیشنهاد روغن گیربکس و سرویس دقیق‌تر استفاده می‌شود.">
            <select value={form.transmission_type || ''} onChange={(e) => setForm({ ...form, transmission_type: e.target.value })} className={inputClass}>
              <option value="">انتخاب نوع گیربکس</option>
              {TRANSMISSION_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </Field>

          <div className="rounded-2xl bg-slate-800 p-3 md:col-span-2">
            <label className="mb-2 block text-xs text-slate-400">گریدهای روغن مناسب این خودرو</label>
            <div className="flex flex-wrap gap-2">
              {oilGrades.map((grade) => (
                <button key={grade.id || grade.title} type="button" onClick={() => {
                  const next = toggleValue(form.recommended_oil_grades || [], grade.title);
                  setForm({ ...form, recommended_oil_grades: next, oil_viscosity: next.join(' / ') });
                }} className={`rounded-xl px-3 py-2 text-xs font-bold ${form.recommended_oil_grades?.includes(grade.title) ? 'bg-yellow-400 text-slate-950' : 'bg-slate-700 text-slate-300'}`}>
                  {grade.title}
                </button>
              ))}
            </div>
            <input placeholder="یا دستی بنویس، مثال: 5W-30 / 10W-40" value={form.oil_viscosity || ''} onChange={(e) => setForm({ ...form, oil_viscosity: e.target.value })} className={`${inputClass} mt-3`} />
          </div>

          <div className="rounded-2xl bg-slate-800 p-3 md:col-span-2">
            <label className="mb-2 block text-xs text-slate-400">سطح کیفی مناسب این خودرو</label>
            <div className="flex flex-wrap gap-2">
              {qualityLevels.map((level) => (
                <button key={level.id || level.title} type="button" onClick={() => setForm({ ...form, recommended_quality_levels: toggleValue(form.recommended_quality_levels || [], level.title) })} className={`rounded-xl px-3 py-2 text-xs font-bold ${form.recommended_quality_levels?.includes(level.title) ? 'bg-yellow-400 text-slate-950' : 'bg-slate-700 text-slate-300'}`}>
                  {level.title}
                </button>
              ))}
            </div>
          </div>

          <Field label="حجم روغن با فیلتر" hint="مثال: 3.75 لیتر">
            <input type="number" step="0.1" value={form.oil_capacity_liters || ''} onChange={(e) => setForm({ ...form, oil_capacity_liters: e.target.value ? +e.target.value : null })} className={inputClass} />
          </Field>

          <Field label="فاصله سرویس بعدی براساس کیلومتر" hint="مثال: 5000">
            <input type="number" value={form.service_interval_km || ''} onChange={(e) => setForm({ ...form, service_interval_km: e.target.value ? +e.target.value : null })} className={inputClass} />
          </Field>

          <textarea placeholder="یادداشت فنی خودرو" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={`${inputClass} min-h-[90px] md:col-span-2`} />
          <label className="flex items-center gap-2 text-sm text-white md:col-span-2"><input type="checkbox" checked={form.is_active !== false} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> فعال باشد</label>
          <button disabled={loading} onClick={saveCar} className="rounded-xl bg-yellow-400 px-5 py-3 font-black text-slate-950 disabled:opacity-60 md:col-span-2">{editingId ? 'ذخیره ویرایش خودرو' : 'افزودن خودرو'}</button>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-900 p-5 ring-1 ring-white/10">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجوی خودرو برای ویرایش..." className="mb-4 w-full rounded-xl bg-slate-800 p-3 text-white outline-none" />
        <div className="space-y-5">
          {Object.entries(groupedCars).map(([brand, items]) => (
            <section key={brand}>
              <h3 className="mb-3 rounded-xl bg-slate-800 px-4 py-2 text-sm font-black text-yellow-300">{brand}</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {items.map((car) => (
                  <article key={car.id} className="rounded-2xl bg-slate-800 p-4 ring-1 ring-white/5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-black text-white">{getCarTitle(car)}</h4>
                        <p className="mt-1 text-xs text-slate-400">سال: {car.start_year || '-'} | گیربکس: {car.transmission_type || 'ثبت نشده'}</p>
                        <p className="mt-1 text-xs text-slate-500">روغن: {car.oil_viscosity || '-'}</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${car.is_active === false ? 'bg-red-500/15 text-red-300' : 'bg-emerald-500/15 text-emerald-300'}`}>{car.is_active === false ? 'غیرفعال' : 'فعال'}</span>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => startEdit(car)} className="flex-1 rounded-xl bg-blue-500 px-4 py-2 text-sm font-black text-white">ویرایش</button>
                      <button onClick={() => remove(car.id)} className="rounded-xl bg-red-500/15 px-4 py-2 text-sm font-black text-red-300">حذف</button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <div><label className="mb-1 block text-xs font-bold text-slate-300">{label}</label>{children}{hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}</div>;
}

export default Cars;
