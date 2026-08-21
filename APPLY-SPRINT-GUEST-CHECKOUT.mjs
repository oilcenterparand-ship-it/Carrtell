import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2];
if (!root) throw new Error('Project root argument is required.');

const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const write = (rel, text) => fs.writeFileSync(path.join(root, rel), text, 'utf8');

function replaceExact(text, oldText, newText, label) {
  if (!text.includes(oldText)) {
    throw new Error(`Patch marker not found: ${label}`);
  }
  return text.replace(oldText, newText);
}

function replaceRegexOne(text, regex, replacement, label) {
  const matches = [...text.matchAll(regex)];
  if (matches.length !== 1) {
    throw new Error(`Expected exactly one match for ${label}; found ${matches.length}`);
  }
  return text.replace(regex, replacement);
}

// ------------------------------------------------------------
// Layout.tsx
// ------------------------------------------------------------
{
  const rel = 'src/components/Layout.tsx';
  let t = read(rel);

  t = replaceExact(
    t,
    "  const [vehicleSearch, setVehicleSearch] = useState('');\n  const [vehiclePickerOpen, setVehiclePickerOpen] = useState(false);",
    "  const [vehicleSearch, setVehicleSearch] = useState('');\n  const [vehicleBrand, setVehicleBrand] = useState('');\n  const [vehiclePickerOpen, setVehiclePickerOpen] = useState(false);",
    'Layout vehicleBrand state',
  );

  t = replaceExact(
    t,
`  const searchedProducts = useMemo(() => {
    if (!normalizedSearch) return [];
    return products.filter((product) => {
      const haystack = [
        product.name,
        product.brand,
        product.category,
        product.oil_grade,
        product.quality_level,
        product.transmission_type,
        product.description,
        product.card_features,
      ].filter(Boolean).join(' ').toLocaleLowerCase('fa');
      return haystack.includes(normalizedSearch);
    });
  }, [normalizedSearch, products]);
`,
`  const searchedProducts = useMemo(() => {
    if (!normalizedSearch) return [];

    const scoreProduct = (product: Product) => {
      const name = String(product.name || '').toLocaleLowerCase('fa');
      const brand = String(product.brand || '').toLocaleLowerCase('fa');
      const category = String(product.category || '').toLocaleLowerCase('fa');
      const grade = String(product.oil_grade || '').toLocaleLowerCase('fa');
      const quality = String(product.quality_level || '').toLocaleLowerCase('fa');
      const transmission = String(product.transmission_type || '').toLocaleLowerCase('fa');
      const description = String(product.description || '').toLocaleLowerCase('fa');
      const features = String(product.card_features || '').toLocaleLowerCase('fa');

      if (name === normalizedSearch) return 1000;
      if (name.startsWith(normalizedSearch)) return 900;
      if (brand === normalizedSearch) return 850;
      if (brand.startsWith(normalizedSearch)) return 800;
      if (name.includes(normalizedSearch)) return 700;
      if (brand.includes(normalizedSearch)) return 650;
      if (grade.startsWith(normalizedSearch) || quality.startsWith(normalizedSearch)) return 550;
      if (category.includes(normalizedSearch)) return 450;
      if (transmission.includes(normalizedSearch)) return 350;
      if (description.includes(normalizedSearch) || features.includes(normalizedSearch)) return 200;
      return 0;
    };

    return products
      .map((product) => ({ product, score: scoreProduct(product) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || String(a.product.name || '').localeCompare(String(b.product.name || ''), 'fa'))
      .map((entry) => entry.product);
  }, [normalizedSearch, products]);
`,
    'Layout ranked product search',
  );

  t = replaceExact(
    t,
`  const filteredCars = allCars.filter((car) => {
    const query = vehicleSearch.trim().toLocaleLowerCase('fa');
    if (!query) return true;
    return \`${'${car.brand} ${car.model} ${car.trim || \'\'} ${car.engine || \'\'}'}\`.toLocaleLowerCase('fa').includes(query);
  });
`,
`  const vehicleBrands = useMemo(
    () => Array.from(new Set(allCars.map((car) => String(car.brand || '').trim()).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b, 'fa')),
    [allCars],
  );

  const filteredCars = useMemo(() => {
    const query = vehicleSearch.trim().toLocaleLowerCase('fa');
    const brandQuery = vehicleBrand.trim().toLocaleLowerCase('fa');

    return allCars
      .filter((car) => !brandQuery || String(car.brand || '').trim().toLocaleLowerCase('fa') === brandQuery)
      .map((car) => {
        const title = getCarTitle(car).toLocaleLowerCase('fa');
        const brand = String(car.brand || '').toLocaleLowerCase('fa');
        const model = String(car.model || '').toLocaleLowerCase('fa');
        const trim = String(car.trim || '').toLocaleLowerCase('fa');
        const engine = String(car.engine || '').toLocaleLowerCase('fa');

        let score = 1;
        if (query) {
          if (title === query) score = 1000;
          else if (model === query) score = 950;
          else if (model.startsWith(query)) score = 900;
          else if (title.startsWith(query)) score = 850;
          else if (brand.startsWith(query)) score = 800;
          else if (title.includes(query)) score = 700;
          else if (trim.includes(query) || engine.includes(query)) score = 500;
          else score = 0;
        }

        return { car, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || getCarTitle(a.car).localeCompare(getCarTitle(b.car), 'fa'))
      .map((entry) => entry.car);
  }, [allCars, vehicleBrand, vehicleSearch]);
`,
    'Layout ranked vehicle search',
  );

  t = replaceExact(
    t,
    "onClick={() => setVehiclePickerOpen((value) => !value)}",
    "onClick={() => { setVehiclePickerOpen((value) => !value); setVehicleSearch(''); setVehicleBrand(''); }}",
    'Layout vehicle picker open',
  );

  t = replaceExact(
    t,
`                  <div className="ct-new-vehicle-search">
                    <Search className="h-4 w-4" />
                    <input value={vehicleSearch} onChange={(event) => setVehicleSearch(event.target.value)} placeholder="جستجوی برند یا مدل خودرو..." />
                  </div>
`,
`                  <div className="ct-new-vehicle-brand-step">
                    <label htmlFor="ct-header-vehicle-brand">۱. شرکت سازنده</label>
                    <select
                      id="ct-header-vehicle-brand"
                      value={vehicleBrand}
                      onChange={(event) => {
                        setVehicleBrand(event.target.value);
                        setVehicleSearch('');
                      }}
                    >
                      <option value="">انتخاب سازنده</option>
                      {vehicleBrands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
                    </select>
                  </div>
                  <div className="ct-new-vehicle-search">
                    <Search className="h-4 w-4" />
                    <input
                      value={vehicleSearch}
                      onChange={(event) => setVehicleSearch(event.target.value)}
                      placeholder={vehicleBrand ? \`۲. جستجو بین خودروهای \${vehicleBrand}...\` : 'ابتدا سازنده را انتخاب کن...'}
                      disabled={!vehicleBrand}
                    />
                  </div>
`,
    'Layout two-step vehicle picker',
  );

  write(rel, t);
}

// ------------------------------------------------------------
// BookPage.tsx
// ------------------------------------------------------------
{
  const rel = 'src/pages/BookPage.tsx';
  let t = read(rel);

  t = replaceExact(
    t,
    "import { useLocation, useNavigate } from 'react-router-dom';",
    "import { useNavigate } from 'react-router-dom';",
    'BookPage useLocation import',
  );

  t = replaceExact(
    t,
    "  const navigate = useNavigate();\n  const location = useLocation();\n  const { user, loading: authLoading } = useAuth();",
    "  const navigate = useNavigate();\n  const { user, loading: authLoading } = useAuth();",
    'BookPage location state',
  );

  t = replaceExact(
    t,
    "  const [carSearch, setCarSearch] = useState('');\n  const [pendingCarId, setPendingCarId] = useState(selectedCarId);",
    "  const [carSearch, setCarSearch] = useState('');\n  const [carBrand, setCarBrand] = useState('');\n  const [pendingCarId, setPendingCarId] = useState(selectedCarId);",
    'BookPage carBrand state',
  );

  t = replaceExact(
    t,
`  const filteredCars = useMemo(() => {
    const query = carSearch.trim().toLocaleLowerCase('fa');
    if (!query) return cars;
    return cars.filter((car) => getCarTitle(car).toLocaleLowerCase('fa').includes(query));
  }, [cars, carSearch]);
`,
`  const carBrands = useMemo(
    () => Array.from(new Set(cars.map((car) => String(car.brand || '').trim()).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b, 'fa')),
    [cars],
  );

  const filteredCars = useMemo(() => {
    const query = carSearch.trim().toLocaleLowerCase('fa');
    const brandQuery = carBrand.trim().toLocaleLowerCase('fa');

    return cars
      .filter((car) => !brandQuery || String(car.brand || '').trim().toLocaleLowerCase('fa') === brandQuery)
      .map((car) => {
        const title = getCarTitle(car).toLocaleLowerCase('fa');
        const model = String(car.model || '').toLocaleLowerCase('fa');
        let score = 1;
        if (query) {
          if (title === query) score = 1000;
          else if (model === query) score = 950;
          else if (model.startsWith(query)) score = 900;
          else if (title.startsWith(query)) score = 850;
          else if (title.includes(query)) score = 700;
          else score = 0;
        }
        return { car, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || getCarTitle(a.car).localeCompare(getCarTitle(b.car), 'fa'))
      .map((entry) => entry.car);
  }, [cars, carBrand, carSearch]);
`,
    'BookPage vehicle filter',
  );

  const forcedLogin = /  useEffect\(\(\) => \{\n    if \(authLoading\) return;\n    if \(!user\) \{\n      const returnTo = `\$\{location\.pathname\}\$\{location\.search\}\$\{location\.hash\}`;\n      navigate\(`\/login-otp\?returnTo=\$\{encodeURIComponent\(returnTo\)\}`, \{ replace: true \}\);\n      return;\n    \}\n    setCustomerPhone\(user\.phone\?\.replace\(\/\^\\\+98\/, '0'\) \|\| ''\);\n    setCustomerName\(user\.fullName \|\| ''\);\n  \}, \[authLoading, location\.hash, location\.pathname, location\.search, navigate, user\]\);\n/g;
  t = replaceRegexOne(
    t,
    forcedLogin,
`  useEffect(() => {
    if (authLoading || !user) return;
    setCustomerPhone(user.phone?.replace(/^\\+98/, '0') || '');
    setCustomerName(user.fullName || '');
  }, [authLoading, user]);
`,
    'BookPage forced login effect',
  );

  t = replaceExact(
    t,
    '  if (loading || authLoading || !user) return <main className="min-h-screen bg-slate-100 pt-32 text-slate-900" dir="rtl"><Loader2 className="mx-auto h-9 w-9 animate-spin" /></main>;',
    '  if (loading || authLoading) return <main className="min-h-screen bg-slate-100 pt-32 text-slate-900" dir="rtl"><Loader2 className="mx-auto h-9 w-9 animate-spin" /></main>;',
    'BookPage guest render',
  );

  t = replaceExact(
    t,
    "onClick={() => { setPendingCarId(selectedCarId); setCarSearch(''); setCarPickerOpen(true); }}",
    "onClick={() => { setPendingCarId(selectedCarId); setCarSearch(''); setCarBrand(selectedCar?.brand || ''); setCarPickerOpen(true); }}",
    'BookPage car modal open',
  );

  t = replaceExact(
    t,
`          <div className="p-3">
            <label className="flex h-12 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3"><Search className="h-5 w-5 text-amber-300" /><input autoFocus value={carSearch} onChange={(event) => setCarSearch(event.target.value)} placeholder="جستجوی خودرو..." className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-white/35" /></label>
          </div>
`,
`          <div className="grid gap-2 p-3">
            <label className="grid gap-1 text-xs font-bold text-white/70">
              <span>۱. شرکت سازنده</span>
              <select value={carBrand} onChange={(event) => { setCarBrand(event.target.value); setCarSearch(''); setPendingCarId(''); }} className="h-12 rounded-xl border border-white/15 bg-slate-900 px-3 text-base text-white outline-none">
                <option value="">انتخاب سازنده</option>
                {carBrands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
              </select>
            </label>
            <label className="flex h-12 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3">
              <Search className="h-5 w-5 text-amber-300" />
              <input value={carSearch} disabled={!carBrand} onChange={(event) => setCarSearch(event.target.value)} placeholder={carBrand ? \`۲. جستجو بین خودروهای \${carBrand}...\` : 'ابتدا سازنده را انتخاب کن'} className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-white/35 disabled:opacity-50" />
            </label>
          </div>
`,
    'BookPage maker-model UI',
  );

  write(rel, t);
}

// ------------------------------------------------------------
// CartPage.tsx
// ------------------------------------------------------------
{
  const rel = 'src/pages/CartPage.tsx';
  let t = read(rel);

  t = replaceExact(
    t,
`    if (!isAuthenticated) {
      navigate('/login-otp?returnTo=%2Fcart');
      return;
    }
    setStep('info');
`,
`    setStep('info');
`,
    'Cart begin checkout login gate',
  );

  t = replaceExact(
    t,
`  async function createOrder() {
    if (!isAuthenticated) {
      navigate('/login-otp?returnTo=%2Fcart');
      return;
    }
`,
`  async function createOrder() {
`,
    'Cart create order login gate',
  );

  t = replaceRegexOne(
    t,
    /  useEffect\(\(\) => \{\n    if \(authLoading\) return;\n\n    \/\/ کاربر مهمان هرگز نباید خارج از مرحله سبد خرید باقی بماند\.[\s\S]*?  \}, \[authLoading, isAuthenticated, items\.length, step\]\);\n/g,
`  useEffect(() => {
    if (authLoading) return;
    if (!items.length && step !== 'cart') setStep('cart');
    sessionStorage.removeItem('carrtell_checkout_resume');
  }, [authLoading, items.length, step]);
`,
    'Cart guest step reset effect',
  );

  // Keep the old login-only JSX in source but make it unreachable.
  // This avoids a fragile large multilingual regex deletion.
  const loginWallMarker = `  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-900" dir="rtl">`;
  t = replaceExact(
    t,
    loginWallMarker,
    `  if (false && !isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-900" dir="rtl">`,
    'Cart login wall',
  );

  write(rel, t);
}

// ------------------------------------------------------------
// serviceRequestsApi.ts
// ------------------------------------------------------------
{
  const rel = 'src/customer/services/serviceRequestsApi.ts';
  let t = read(rel);

  t = replaceExact(
    t,
    "  customer_user_id?: string | null;\n  payment_status?: 'pending' | 'paid' | 'failed';",
    "  customer_user_id?: string | null;\n  guest_token?: string | null;\n  payment_status?: 'pending' | 'paid' | 'failed';",
    'ServiceRequest guest_token type',
  );

  t = replaceExact(
    t,
    "    customer_user_id: row.customer_user_id || null,\n    payment_status:",
    "    customer_user_id: row.customer_user_id || null,\n    guest_token: row.guest_token || null,\n    payment_status:",
    'ServiceRequest normalize guest token',
  );

  t = replaceExact(
    t,
    "  const { id: _id, created_at: _createdAt, ...insertPayload } = payload;",
    "  const { created_at: _createdAt, ...insertPayload } = payload;",
    'ServiceRequest keep explicit id',
  );

  t = replaceRegexOne(
    t,
    /export async function createServiceRequest\(input: CreateServiceRequestInput\): Promise<ServiceRequest> \{[\s\S]*?\n\}\n\nexport async function getServiceRequests\(\)/g,
`export async function createServiceRequest(input: CreateServiceRequestInput): Promise<ServiceRequest> {
  const cleanPhone = input.customer_phone.trim();
  if (!cleanPhone) throw new Error('شماره موبایل الزامی است.');
  if (!input.vehicle_title.trim()) throw new Error('انتخاب خودرو الزامی است.');
  if (!input.address_text.trim()) throw new Error('انتخاب آدرس الزامی است.');

  const { data: authData } = await supabase.auth.getUser();
  const currentUser = authData.user;
  const guestToken = currentUser ? null : crypto.randomUUID();

  const payload = normalizeRequest({
    ...input,
    id: crypto.randomUUID(),
    customer_user_id: currentUser?.id || input.customer_user_id || null,
    guest_token: guestToken,
    customer_phone: cleanPhone,
    request_number: makeRequestNumber(),
    next_service_km: calcNextServiceKm(input.last_service_km, input.service_interval_km),
    status: 'pending_review',
    payment_status: 'pending',
  });

  const { error } = await supabase
    .from('service_requests')
    .insert(publicRequestPayload(payload));

  if (!error) {
    if (guestToken) sessionStorage.setItem(\`carrtell:service-guest-token:\${payload.id}\`, guestToken);

    if (input.booking_slot_id) {
      const { data: reservation, error: reservationError } = await supabase.rpc('reserve_booking_slot', {
        p_slot_id: input.booking_slot_id,
        p_booking_date: input.preferred_date,
        p_service_request_id: payload.id,
      });
      const result = Array.isArray(reservation) ? reservation[0] : reservation;
      if (reservationError || !result?.success) {
        throw new Error(result?.message || 'ظرفیت این بازه زمانی تکمیل شده است؛ بازه دیگری را انتخاب کنید.');
      }
    }
    return payload;
  }

  const localRequest = normalizeRequest(payload);
  writeLocal([localRequest, ...readLocal()]);
  if (guestToken) sessionStorage.setItem(\`carrtell:service-guest-token:\${localRequest.id}\`, guestToken);
  return localRequest;
}

export async function getServiceRequests()`,
    'ServiceRequest guest create',
  );

  t = replaceRegexOne(
    t,
    /export async function getServiceRequestById\(id: string\): Promise<ServiceRequest> \{[\s\S]*?\n\}/g,
`export async function getServiceRequestById(id: string): Promise<ServiceRequest> {
  const { data, error } = await supabase.from('service_requests').select('*').eq('id', id).maybeSingle();
  if (!error && data) return normalizeRequest(data as ServiceRequest);

  const guestToken = sessionStorage.getItem(\`carrtell:service-guest-token:\${id}\`);
  if (guestToken) {
    const { data: guestData, error: guestError } = await supabase.rpc('get_service_request_guest', {
      p_request_id: id,
      p_guest_token: guestToken,
    });
    const row = Array.isArray(guestData) ? guestData[0] : guestData;
    if (!guestError && row) return normalizeRequest(row as ServiceRequest);
  }

  const local = readLocal().find((item) => item.id === id);
  if (local) return normalizeRequest(local);
  throw error || new Error('درخواست سرویس پیدا نشد.');
}`,
    'ServiceRequest guest read',
  );

  t = replaceRegexOne(
    t,
    /export async function payServiceRequestTest\(id: string\): Promise<ServiceRequest> \{[\s\S]*?\n\}/g,
`export async function payServiceRequestTest(id: string): Promise<ServiceRequest> {
  const { data, error } = await supabase.rpc('pay_service_request_test', { p_request_id: id });
  const row = Array.isArray(data) ? data[0] : data;
  if (!error && row) return normalizeRequest(row as ServiceRequest);

  const guestToken = sessionStorage.getItem(\`carrtell:service-guest-token:\${id}\`);
  if (guestToken) {
    const { data: guestData, error: guestError } = await supabase.rpc('pay_service_request_guest_test', {
      p_request_id: id,
      p_guest_token: guestToken,
    });
    const guestRow = Array.isArray(guestData) ? guestData[0] : guestData;
    if (!guestError && guestRow) return normalizeRequest(guestRow as ServiceRequest);
  }

  const reference = \`TEST-\${Date.now()}\`;
  return updateLocalRequest(id, { payment_status: 'paid', payment_reference: reference, paid_at: nowIso() });
}`,
    'ServiceRequest guest payment',
  );

  write(rel, t);
}

// ------------------------------------------------------------
// ServicePaymentPage.tsx
// ------------------------------------------------------------
{
  const rel = 'src/pages/ServicePaymentPage.tsx';
  let t = read(rel);

  t = replaceExact(
    t,
`              <button type="button" onClick={() => navigate('/dashboard#orders', { replace: true })} className="mt-5 w-full rounded-2xl bg-emerald-400 px-5 py-3.5 font-black text-slate-950">
                مشاهده وضعیت سفارش در پروفایل
              </button>
`,
`              {request.customer_user_id ? (
                <button type="button" onClick={() => navigate('/dashboard#orders', { replace: true })} className="mt-5 w-full rounded-2xl bg-emerald-400 px-5 py-3.5 font-black text-slate-950">
                  مشاهده وضعیت سفارش در پروفایل
                </button>
              ) : (
                <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-sm font-bold text-white">مایل هستید با همین شماره برایتان حساب کاربری ساخته شود؟</p>
                  <p className="mt-1 text-xs leading-6 text-slate-400">اختیاری است؛ سفارش و پرداخت شما بدون ساخت حساب هم ثبت شده است.</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Link
                      to={\`/login-otp?phone=\${encodeURIComponent(request.customer_phone)}&returnTo=\${encodeURIComponent('/dashboard#orders')}\`}
                      className="rounded-xl bg-emerald-400 px-3 py-3 text-center text-sm font-black text-slate-950"
                    >
                      بله، ساخت حساب
                    </Link>
                    <Link to="/" className="rounded-xl border border-white/10 px-3 py-3 text-center text-sm font-bold text-slate-300">
                      فعلاً نه
                    </Link>
                  </div>
                </div>
              )}
`,
    'Optional account prompt',
  );

  write(rel, t);
}

// ------------------------------------------------------------
// OTP phone prefill
// ------------------------------------------------------------
{
  const rel = 'src/pages/OtpLoginPage.tsx';
  let t = read(rel);
  t = replaceExact(
    t,
    "  const [phone, setPhone] = useState('');",
    "  const [phone, setPhone] = useState(params.get('phone') || '');",
    'OTP phone prefill',
  );
  write(rel, t);
}

// ------------------------------------------------------------
// CSS
// ------------------------------------------------------------
{
  const rel = 'src/index.css';
  let t = read(rel);

  t = replaceExact(
    t,
    'grid-template-columns: repeat(5, minmax(0, 1fr));',
    'grid-template-columns: repeat(4, minmax(0, 1fr));',
    'Bottom nav base 4 columns',
  );

  const marker = '/* SPRINT-GUEST-CHECKOUT-SEARCH-CAR-PICKER-V2 */';
  if (!t.includes(marker)) {
    t += `

${marker}
@media (max-width: 767px) {
  .ct-mobile-bottom-nav {
    grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
    gap: 0 !important;
    padding-inline: 6px !important;
  }
  .ct-mobile-bottom-nav > a {
    width: 100% !important;
    min-width: 0 !important;
    justify-self: stretch !important;
  }

  .ct-new-access-vehicle .ct-new-vehicle-picker {
    top: max(92px, env(safe-area-inset-top)) !important;
    right: 12px !important;
    left: 12px !important;
    width: auto !important;
    max-height: min(62dvh, 520px) !important;
    border-radius: 18px !important;
    padding-bottom: 4px;
  }
  .ct-new-vehicle-picker-list {
    max-height: 34dvh !important;
    padding-bottom: calc(18px + env(safe-area-inset-bottom)) !important;
  }
  .ct-new-vehicle-brand-step {
    display: grid;
    gap: 5px;
    padding: 10px 12px 4px;
  }
  .ct-new-vehicle-brand-step label {
    color: var(--ct-muted);
    font-size: 11px;
    font-weight: 900;
  }
  .ct-new-vehicle-brand-step select {
    width: 100%;
    min-height: 42px;
    border: 1px solid var(--ct-border);
    border-radius: 12px;
    background: var(--ct-surface-2);
    color: var(--ct-text);
    padding: 0 10px;
    outline: none;
  }
  .ct-new-vehicle-search input:disabled {
    opacity: .55;
  }

  .ct-book-car-modal-backdrop {
    align-items: center !important;
    padding: 12px !important;
  }
  .ct-book-car-modal {
    width: min(94vw, 460px) !important;
    max-height: min(68dvh, 560px) !important;
    margin-bottom: calc(72px + env(safe-area-inset-bottom)) !important;
  }
}
`;
  }

  write(rel, t);
}

console.log('Node patcher finished successfully.');
