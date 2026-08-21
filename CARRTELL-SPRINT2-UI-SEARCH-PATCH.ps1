$ErrorActionPreference = "Stop"

$root = "D:\carrtell\Carrtell-v0.2-current\project"
Set-Location $root

$expectedBranch = "sprint/guest-checkout-search-car-picker"
$currentBranch = (git branch --show-current).Trim()
if ($currentBranch -ne $expectedBranch) {
    throw "Wrong branch. Expected '$expectedBranch' but current branch is '$currentBranch'."
}

$utf8 = New-Object System.Text.UTF8Encoding($false)

function Read-Utf8([string]$path) {
    return [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
}
function Write-Utf8([string]$path, [string]$content) {
    [System.IO.File]::WriteAllText($path, $content, $utf8)
}
function Replace-Exact([string]$text, [string]$old, [string]$new, [string]$label) {
    if (-not $text.Contains($old)) {
        throw "PATCH STOPPED: expected block not found: $label"
    }
    return $text.Replace($old, $new)
}

$layoutPath = Join-Path $root "src\components\Layout.tsx"
$bookPath   = Join-Path $root "src\pages\BookPage.tsx"
$cssPath    = Join-Path $root "src\styles\mobile-rc106a.css"

Copy-Item $layoutPath "$layoutPath.sprint2-ui.bak" -Force
Copy-Item $bookPath "$bookPath.sprint2-ui.bak" -Force
Copy-Item $cssPath "$cssPath.sprint2-ui.bak" -Force

# ---------------- Layout.tsx ----------------
$layout = Read-Utf8 $layoutPath

$layout = Replace-Exact $layout `
"  const [vehicleSearch, setVehicleSearch] = useState('');`n  const [vehiclePickerOpen, setVehiclePickerOpen] = useState(false);" `
"  const [vehicleSearch, setVehicleSearch] = useState('');`n  const [vehicleMaker, setVehicleMaker] = useState('');`n  const [vehiclePickerOpen, setVehiclePickerOpen] = useState(false);" `
"Layout vehicle maker state"

$oldSearch = @'
  const normalizedSearch = searchText.trim().toLocaleLowerCase('fa');
  const searchedProducts = useMemo(() => {
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

  const groupedSearchResults = useMemo(() => {
'@
$newSearch = @'
  const normalizedSearch = searchText.trim().toLocaleLowerCase('fa');
  const searchedProducts = useMemo(() => {
    if (!normalizedSearch) return [];
    const scoreText = (value?: string | null, weight = 1) => {
      const text = String(value || '').toLocaleLowerCase('fa');
      if (!text) return 0;
      if (text === normalizedSearch) return 120 * weight;
      if (text.startsWith(normalizedSearch)) return 80 * weight;
      const wordStart = text.split(/\s+/).some((word) => word.startsWith(normalizedSearch));
      if (wordStart) return 55 * weight;
      if (text.includes(normalizedSearch)) return 30 * weight;
      return 0;
    };

    return products
      .map((product) => {
        const score =
          scoreText(product.name, 5) +
          scoreText(product.brand, 4) +
          scoreText(product.category, 3) +
          scoreText(product.oil_grade, 2) +
          scoreText(product.quality_level, 2) +
          scoreText(product.transmission_type, 1) +
          scoreText(product.description, 1) +
          scoreText(product.card_features, 1);
        return { product, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || String(a.product.name || '').localeCompare(String(b.product.name || ''), 'fa'))
      .map((item) => item.product);
  }, [normalizedSearch, products]);

  const searchCategorySuggestions = useMemo(() => {
    if (!normalizedSearch) return [];
    return categories
      .filter((item) => item.title.toLocaleLowerCase('fa').includes(normalizedSearch))
      .sort((a, b) => {
        const aa = a.title.toLocaleLowerCase('fa').startsWith(normalizedSearch) ? 0 : 1;
        const bb = b.title.toLocaleLowerCase('fa').startsWith(normalizedSearch) ? 0 : 1;
        return aa - bb || a.title.localeCompare(b.title, 'fa');
      })
      .slice(0, 5);
  }, [categories, normalizedSearch]);

  const searchBrandSuggestions = useMemo(() => {
    if (!normalizedSearch) return [];
    return Array.from(new Set(products.map((item) => String(item.brand || '').trim()).filter(Boolean)))
      .filter((brand) => brand.toLocaleLowerCase('fa').includes(normalizedSearch))
      .sort((a, b) => {
        const aa = a.toLocaleLowerCase('fa').startsWith(normalizedSearch) ? 0 : 1;
        const bb = b.toLocaleLowerCase('fa').startsWith(normalizedSearch) ? 0 : 1;
        return aa - bb || a.localeCompare(b, 'fa');
      })
      .slice(0, 5);
  }, [normalizedSearch, products]);

  const groupedSearchResults = useMemo(() => {
'@
$layout = Replace-Exact $layout $oldSearch $newSearch "Layout ranked live search"

$oldCars = @'
  const filteredCars = allCars.filter((car) => {
    const query = vehicleSearch.trim().toLocaleLowerCase('fa');
    if (!query) return true;
    return `${car.brand} ${car.model} ${car.trim || ''} ${car.engine || ''}`.toLocaleLowerCase('fa').includes(query);
  });
'@
$newCars = @'
  const vehicleMakers = useMemo(
    () => Array.from(new Set(allCars.map((car) => String(car.brand || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'fa')),
    [allCars],
  );

  const filteredCars = useMemo(() => {
    const query = vehicleSearch.trim().toLocaleLowerCase('fa');
    return allCars
      .filter((car) => !vehicleMaker || String(car.brand || '') === vehicleMaker)
      .map((car) => {
        const title = `${car.brand} ${car.model} ${car.trim || ''} ${car.engine || ''}`.trim().toLocaleLowerCase('fa');
        const model = `${car.model || ''} ${car.trim || ''}`.trim().toLocaleLowerCase('fa');
        let score = 1;
        if (query) {
          if (model.startsWith(query)) score = 100;
          else if (title.startsWith(query)) score = 90;
          else if (model.split(/\s+/).some((word) => word.startsWith(query))) score = 75;
          else if (title.split(/\s+/).some((word) => word.startsWith(query))) score = 65;
          else if (title.includes(query)) score = 40;
          else score = 0;
        }
        return { car, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || getCarTitle(a.car).localeCompare(getCarTitle(b.car), 'fa'))
      .map((item) => item.car);
  }, [allCars, vehicleMaker, vehicleSearch]);
'@
$layout = Replace-Exact $layout $oldCars $newCars "Layout vehicle filtering"

$oldSearchBody = @'
                    <div className="ct-new-search-results-body">
                      {groupedSearchResults.map(([categoryTitle, items]) => (
'@
$newSearchBody = @'
                    <div className="ct-new-search-results-body">
                      {(searchCategorySuggestions.length > 0 || searchBrandSuggestions.length > 0) && (
                        <div className="ct-new-search-suggestions">
                          {searchCategorySuggestions.length > 0 && (
                            <section>
                              <b>دسته‌بندی‌ها</b>
                              <div>
                                {searchCategorySuggestions.map((item) => (
                                  <Link key={item.slug} to={`/shop?category=${item.slug}`} onClick={() => { setSearchOpen(false); setSearchText(''); }}>
                                    {item.title}
                                  </Link>
                                ))}
                              </div>
                            </section>
                          )}
                          {searchBrandSuggestions.length > 0 && (
                            <section>
                              <b>برندها</b>
                              <div>
                                {searchBrandSuggestions.map((brand) => (
                                  <Link key={brand} to={`/shop?q=${encodeURIComponent(brand)}`} onClick={() => { setSearchOpen(false); setSearchText(''); }}>
                                    {brand}
                                  </Link>
                                ))}
                              </div>
                            </section>
                          )}
                        </div>
                      )}
                      {groupedSearchResults.map(([categoryTitle, items]) => (
'@
$layout = Replace-Exact $layout $oldSearchBody $newSearchBody "Layout search suggestion UI"

$oldPickerOpen = @'
                onClick={() => setVehiclePickerOpen((value) => !value)}
'@
$newPickerOpen = @'
                onClick={() => {
                  setVehicleMaker(selectedCustomerCar?.brand || '');
                  setVehicleSearch('');
                  setVehiclePickerOpen((value) => !value);
                }}
'@
$layout = Replace-Exact $layout $oldPickerOpen $newPickerOpen "Layout picker open"

$oldPickerSearch = @'
                  <div className="ct-new-vehicle-search">
                    <Search className="h-4 w-4" />
                    <input value={vehicleSearch} onChange={(event) => setVehicleSearch(event.target.value)} placeholder="جستجوی برند یا مدل خودرو..." />
                  </div>
'@
$newPickerSearch = @'
                  <div className="ct-new-vehicle-maker-filter">
                    <label htmlFor="ct-store-vehicle-maker">شرکت سازنده</label>
                    <select id="ct-store-vehicle-maker" value={vehicleMaker} onChange={(event) => { setVehicleMaker(event.target.value); setVehicleSearch(''); }}>
                      <option value="">همه شرکت‌ها</option>
                      {vehicleMakers.map((maker) => <option key={maker} value={maker}>{maker}</option>)}
                    </select>
                  </div>
                  <div className="ct-new-vehicle-search">
                    <Search className="h-4 w-4" />
                    <input value={vehicleSearch} onChange={(event) => setVehicleSearch(event.target.value)} placeholder={vehicleMaker ? `جستجو بین خودروهای ${vehicleMaker}...` : 'نام مدل خودرو را تایپ کن...'} />
                  </div>
'@
$layout = Replace-Exact $layout $oldPickerSearch $newPickerSearch "Layout maker select"

# body class while store vehicle picker is open
$hook = @'
  useEffect(() => {
    const unsubscribe = onSelectedCustomerCarChange(() => setSelectedCustomerCar(readSelectedCustomerCar()));
    return unsubscribe;
  }, []);
'@
$hookNew = @'
  useEffect(() => {
    const unsubscribe = onSelectedCustomerCarChange(() => setSelectedCustomerCar(readSelectedCustomerCar()));
    return unsubscribe;
  }, []);

  useEffect(() => {
    document.body.classList.toggle('ct-store-vehicle-picker-open', vehiclePickerOpen);
    return () => document.body.classList.remove('ct-store-vehicle-picker-open');
  }, [vehiclePickerOpen]);
'@
$layout = Replace-Exact $layout $hook $hookNew "Layout picker body class"

Write-Utf8 $layoutPath $layout

# ---------------- BookPage.tsx ----------------
$book = Read-Utf8 $bookPath

$book = Replace-Exact $book `
"  const [carSearch, setCarSearch] = useState('');`n  const [pendingCarId, setPendingCarId] = useState(selectedCarId);" `
"  const [carSearch, setCarSearch] = useState('');`n  const [carMaker, setCarMaker] = useState('');`n  const [pendingCarId, setPendingCarId] = useState(selectedCarId);" `
"Book maker state"

$oldBookFilter = @'
  const filteredCars = useMemo(() => {
    const query = carSearch.trim().toLocaleLowerCase('fa');
    if (!query) return cars;
    return cars.filter((car) => getCarTitle(car).toLocaleLowerCase('fa').includes(query));
  }, [cars, carSearch]);
'@
$newBookFilter = @'
  const carMakers = useMemo(
    () => Array.from(new Set(cars.map((car) => String(car.brand || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'fa')),
    [cars],
  );

  const filteredCars = useMemo(() => {
    const query = carSearch.trim().toLocaleLowerCase('fa');
    return cars
      .filter((car) => !carMaker || String(car.brand || '') === carMaker)
      .map((car) => {
        const title = getCarTitle(car).toLocaleLowerCase('fa');
        const model = `${car.model || ''} ${car.trim || ''}`.trim().toLocaleLowerCase('fa');
        let score = 1;
        if (query) {
          if (model.startsWith(query)) score = 100;
          else if (title.startsWith(query)) score = 90;
          else if (model.split(/\s+/).some((word) => word.startsWith(query))) score = 75;
          else if (title.split(/\s+/).some((word) => word.startsWith(query))) score = 65;
          else if (title.includes(query)) score = 40;
          else score = 0;
        }
        return { car, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || getCarTitle(a.car).localeCompare(getCarTitle(b.car), 'fa'))
      .map((item) => item.car);
  }, [cars, carMaker, carSearch]);
'@
$book = Replace-Exact $book $oldBookFilter $newBookFilter "Book ranked car search"

$book = Replace-Exact $book `
"onClick={() => { setPendingCarId(selectedCarId); setCarSearch(''); setCarPickerOpen(true); }}" `
"onClick={() => { setPendingCarId(selectedCarId); setCarMaker(selectedCar?.brand || ''); setCarSearch(''); setCarPickerOpen(true); }}" `
"Book picker open"

$book = Replace-Exact $book `
"className={`rounded-2xl border p-4 text-right transition `${active ? 'border-amber-400 bg-amber-50 shadow-md' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}" `
"className={`ct-book-service-option relative rounded-2xl border p-4 text-right text-white transition `${active ? 'is-selected border-emerald-500 bg-slate-950' : 'border-slate-700 bg-slate-950 hover:border-slate-500'}`}" `
"Book service selected style"

$oldActions = @'
        <div className="ct-book-actions sticky bottom-[72px] z-30 -mx-4 mt-7 flex items-center justify-between gap-2 border-t border-slate-200 bg-white/95 px-4 pb-2 pt-4 backdrop-blur sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-5"><button disabled={step===1} onClick={()=>setStep((x)=>Math.max(1,x-1))} className="min-h-12 rounded-xl border border-slate-200 px-4 py-3 font-bold disabled:opacity-40 sm:px-5">مرحله قبل</button>{step<4?<button onClick={next} className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-black text-white sm:flex-none sm:px-6">ادامه <ChevronLeft className="h-4 w-4"/></button>:<button onClick={submit} disabled={submitting} className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 font-black text-slate-950 disabled:opacity-60 sm:flex-none sm:px-6">{submitting?<Loader2 className="h-4 w-4 animate-spin"/>:<CheckCircle2 className="h-4 w-4"/>} ثبت نهایی رزرو</button>}</div>
'@
$newActions = @'
        <div className="ct-book-actions mt-7 flex items-center justify-between gap-3">
          <button disabled={step===1} onClick={()=>setStep((x)=>Math.max(1,x-1))} className="ct-book-back-btn min-h-12 basis-[38%] rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 font-bold text-white disabled:opacity-30">بازگشت</button>
          {step<4
            ? <button onClick={next} className="ct-book-next-btn flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 font-black text-slate-950">ادامه <ChevronLeft className="h-4 w-4"/></button>
            : <button onClick={submit} disabled={submitting} className="ct-book-next-btn flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 font-black text-slate-950 disabled:opacity-60">{submitting?<Loader2 className="h-4 w-4 animate-spin"/>:<CheckCircle2 className="h-4 w-4"/>} ثبت نهایی رزرو</button>}
        </div>
'@
$book = Replace-Exact $book $oldActions $newActions "Book action bar"

$oldBookPickerSearch = @'
          <div className="p-3">
            <label className="flex h-12 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3"><Search className="h-5 w-5 text-amber-300" /><input autoFocus value={carSearch} onChange={(event) => setCarSearch(event.target.value)} placeholder="جستجوی خودرو..." className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-white/35" /></label>
          </div>
'@
$newBookPickerSearch = @'
          <div className="space-y-2 p-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-white/60">۱. شرکت سازنده</span>
              <select value={carMaker} onChange={(event) => { setCarMaker(event.target.value); setCarSearch(''); }} className="h-12 w-full rounded-xl border border-white/15 bg-slate-900 px-3 text-base text-white outline-none focus:border-amber-400">
                <option value="">همه شرکت‌ها</option>
                {carMakers.map((maker) => <option key={maker} value={maker}>{maker}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-white/60">۲. مدل خودرو</span>
              <span className="flex h-12 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3"><Search className="h-5 w-5 text-amber-300" /><input autoFocus value={carSearch} onChange={(event) => setCarSearch(event.target.value)} placeholder={carMaker ? `مثلاً پراید، پژو...` : 'نام مدل خودرو را تایپ کن...'} className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-white/35" /></span>
            </label>
          </div>
'@
$book = Replace-Exact $book $oldBookPickerSearch $newBookPickerSearch "Book maker select"

Write-Utf8 $bookPath $book

# ---------------- mobile CSS ----------------
$css = Read-Utf8 $cssPath
$marker = "/* Sprint 2 UI/Search mobile polish */"
if (-not $css.Contains($marker)) {
$css += @'

/* Sprint 2 UI/Search mobile polish */
@media (max-width: 767px) {
  /* promo text must be fully visible */
  .ct-new-promo-row {
    height: 34px !important;
    min-height: 34px !important;
    display: flex !important;
    align-items: center !important;
    overflow: hidden !important;
  }
  .ct-new-promo-row * {
    line-height: 1.35 !important;
  }
  .ct-new-promo-link {
    display: flex !important;
    width: 100% !important;
    min-height: 34px !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 3px 10px !important;
    white-space: normal !important;
    text-align: center !important;
  }
  .ct-site-content { padding-top: 134px !important; }
  html.ct-shop-route .ct-site-content { padding-top: 128px !important; }

  /* Khanoumi-like live search suggestions */
  .ct-new-search-results {
    top: 142px !important;
    right: 8px !important;
    left: 8px !important;
    max-height: min(64dvh, 560px) !important;
    border-radius: 18px !important;
  }
  .ct-new-search-suggestions {
    display: grid !important;
    gap: 10px !important;
    padding: 10px 12px !important;
    border-bottom: 1px solid rgba(255,255,255,.08) !important;
  }
  .ct-new-search-suggestions section > b {
    display: block !important;
    margin-bottom: 6px !important;
    font-size: 12px !important;
  }
  .ct-new-search-suggestions section > div {
    display: flex !important;
    gap: 7px !important;
    overflow-x: auto !important;
    scrollbar-width: none !important;
  }
  .ct-new-search-suggestions section > div::-webkit-scrollbar { display: none !important; }
  .ct-new-search-suggestions a {
    flex: 0 0 auto !important;
    border: 1px solid rgba(255,255,255,.12) !important;
    border-radius: 999px !important;
    padding: 7px 10px !important;
    font-size: 11px !important;
  }

  /* Compact store vehicle picker. Header search is hidden while choosing a car. */
  body.ct-store-vehicle-picker-open .ct-mobile-bottom-nav { display: none !important; }
  body.ct-store-vehicle-picker-open .ct-new-search-wrap { visibility: hidden !important; pointer-events: none !important; }
  .ct-new-access-vehicle .ct-new-vehicle-picker {
    position: fixed !important;
    top: calc(50% + 18px) !important;
    right: 14px !important;
    bottom: auto !important;
    left: 14px !important;
    width: auto !important;
    max-height: min(62dvh, 520px) !important;
    transform: translateY(-50%) !important;
    border-radius: 20px !important;
    overflow: hidden !important;
  }
  .ct-new-vehicle-picker-head { padding: 10px 12px !important; }
  .ct-new-vehicle-picker-title span { font-size: 10px !important; }
  .ct-new-vehicle-maker-filter {
    flex: 0 0 auto !important;
    padding: 0 10px 8px !important;
  }
  .ct-new-vehicle-maker-filter label {
    display: block !important;
    margin-bottom: 5px !important;
    font-size: 11px !important;
    font-weight: 800 !important;
  }
  .ct-new-vehicle-maker-filter select {
    width: 100% !important;
    height: 42px !important;
    border: 1px solid var(--ct-border,#334155) !important;
    border-radius: 12px !important;
    background: #0b1427 !important;
    color: #fff !important;
    padding-inline: 10px !important;
    font-size: 14px !important;
  }
  .ct-new-vehicle-search { margin-bottom: 6px !important; }
  .ct-new-vehicle-picker-list {
    min-height: 0 !important;
    max-height: min(34dvh, 290px) !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch !important;
    overscroll-behavior: contain !important;
    padding-bottom: 12px !important;
  }
  .ct-new-vehicle-picker-list > button {
    min-height: 50px !important;
    padding-block: 8px !important;
  }

  /* Booking cards keep the dark theme after selection. */
  .ct-book-service-option {
    background: #0b1427 !important;
    color: #f8fafc !important;
    border-color: #2d3b55 !important;
    -webkit-tap-highlight-color: transparent !important;
  }
  .ct-book-service-option.is-selected {
    background: #0b1427 !important;
    color: #f8fafc !important;
    border-color: #10b981 !important;
    box-shadow: 0 0 0 1px rgba(16,185,129,.22) !important;
  }
  .ct-book-service-option.is-selected::after {
    content: "✓";
    position: absolute;
    left: 10px;
    bottom: 9px;
    display: grid;
    width: 22px;
    height: 22px;
    place-items: center;
    border-radius: 999px;
    background: #10b981;
    color: #04130e;
    font-size: 14px;
    font-weight: 900;
  }

  /* Remove the white sticky action slab. */
  .ct-book-actions {
    position: static !important;
    margin-inline: 0 !important;
    padding: 4px 0 0 !important;
    border: 0 !important;
    background: transparent !important;
    backdrop-filter: none !important;
  }
  .ct-book-back-btn,
  .ct-book-next-btn {
    min-height: 50px !important;
    border-radius: 14px !important;
  }

  /* Smaller and truly scrollable booking car modal. */
  .ct-book-car-modal-backdrop {
    align-items: center !important;
    padding: 14px !important;
  }
  .ct-book-car-modal {
    width: 100% !important;
    max-width: 430px !important;
    max-height: min(68dvh, 560px) !important;
    margin: 0 !important;
    border-radius: 20px !important;
  }
  .ct-book-car-modal > header { padding: 10px 12px !important; }
  .ct-book-car-modal > .min-h-0 {
    min-height: 120px !important;
    max-height: min(30dvh, 260px) !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch !important;
    overscroll-behavior: contain !important;
  }
  .ct-book-car-modal footer {
    position: static !important;
    padding: 10px !important;
    padding-bottom: 10px !important;
  }
}
'@
}
Write-Utf8 $cssPath $css

# Documentation for this delivery
$readme = @'
# Sprint 2 - اصلاح UI موبایل، جستجو و انتخاب خودرو

این مرحله فقط UI و رفتار جستجو/انتخاب خودرو را تغییر می‌دهد.

## تغییرات
- سرچ اصلی: رتبه‌بندی نتایج از اولین حروف + پیشنهاد دسته‌بندی و برند.
- تبلیغ بالای هدر: ارتفاع و وسط‌چینی اصلاح شد.
- انتخاب خودرو فروشگاه: پنجره کوچک‌تر، فیلتر سازنده، جستجوی مدل و اسکرول داخلی.
- انتخاب خودرو رزرو: فیلتر سازنده + سرچ مدل + اسکرول داخلی.
- کارت سرویس انتخاب‌شده: پس‌زمینه تیره باقی می‌ماند؛ حاشیه و تیک سبز اضافه می‌شود.
- نوار سفید ادامه/بازگشت حذف و دکمه‌های هماهنگ با تم جایگزین شد.

## SQL
در این مرحله SQL ندارد.

## تست
npm run typecheck
npm run build
git diff --check

بعد از Deploy روی موبایل:
1. سرچ «فیلتر پ» و «پارس» را تست کن.
2. پنجره انتخاب خودرو را باز کن و سازنده را انتخاب کن.
3. با یک حرف مثل «پ» مدل‌ها باید همان لحظه فیلتر شوند.
4. لیست خودرو باید روان اسکرول شود.
5. سرویس را انتخاب کن؛ کارت نباید سفید شود.
6. دکمه ادامه و بازگشت نباید داخل نوار سفید باشند.
'@
Write-Utf8 (Join-Path $root "README-SPRINT2-UI-SEARCH-FA.md") $readme

$manifest = @'
# PATCH MANIFEST - Sprint 2 UI/Search

Branch: sprint/guest-checkout-search-car-picker

Changed:
- src/components/Layout.tsx
- src/pages/BookPage.tsx
- src/styles/mobile-rc106a.css
- README-SPRINT2-UI-SEARCH-FA.md
- PATCH-MANIFEST-SPRINT2-UI-SEARCH.md

SQL: none in this sub-step.
Secrets: none.
Next sub-step: guest booking / guest checkout + RLS SQL.
'@
Write-Utf8 (Join-Path $root "PATCH-MANIFEST-SPRINT2-UI-SEARCH.md") $manifest

Write-Host ""
Write-Host "PATCH APPLIED. Running verification..." -ForegroundColor Green
npm run typecheck
if ($LASTEXITCODE -ne 0) { throw "Typecheck failed. Restore .sprint2-ui.bak files before continuing." }

npm run build
if ($LASTEXITCODE -ne 0) { throw "Build failed. Restore .sprint2-ui.bak files before continuing." }

git diff --check
if ($LASTEXITCODE -ne 0) { throw "git diff --check failed." }

Write-Host ""
Write-Host "DONE - DO NOT COMMIT YET. Test the site first." -ForegroundColor Green
git status --short
