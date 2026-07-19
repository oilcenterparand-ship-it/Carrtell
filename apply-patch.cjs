const fs = require('fs');
const path = require('path');

function read(rel) {
  const file = path.join(process.cwd(), rel);
  if (!fs.existsSync(file)) {
    console.error('❌ فایل پیدا نشد:', file);
    process.exit(1);
  }
  return { file, source: fs.readFileSync(file, 'utf8') };
}

function save(file, source, tag) {
  const backup = `${file}.bak-${tag}-${Date.now()}`;
  fs.copyFileSync(file, backup);
  fs.writeFileSync(file, source, 'utf8');
  console.log('✅ اصلاح شد:', path.relative(process.cwd(), file));
  console.log('   بکاپ:', backup);
}

function replaceRequired(source, search, replacement, label) {
  if (!source.includes(search)) {
    console.error(`❌ الگوی «${label}» پیدا نشد.`);
    process.exit(2);
  }
  return source.replace(search, replacement);
}

// -----------------------------------------------------------------------------
// 1) Clear cart on success/invoice pages as a final safety net.
// -----------------------------------------------------------------------------
{
  const { file, source: original } = read('src/pages/OrderSuccessPage.tsx');
  let source = original;

  if (!source.includes("import { clearCart } from '../lib/cart';")) {
    source = source.replace(
      "import { downloadInvoicePdf } from '../utils/invoicePdf';",
      "import { downloadInvoicePdf } from '../utils/invoicePdf';\nimport { clearCart } from '../lib/cart';"
    );
  }

  const marker = `  useEffect(() => {
    if (!orderId) {`;

  if (!source.includes("clearCart();\n  }, []);")) {
    source = replaceRequired(
      source,
      marker,
      `  useEffect(() => {
    // پرداخت موفق انجام شده؛ سبد خرید باید قطعی پاک شود.
    clearCart();
  }, []);

${marker}`,
      'پاک‌سازی سبد در صفحه موفقیت'
    );
  }

  save(file, source, 'clear-cart-success');
}

{
  const { file, source: original } = read('src/pages/InvoicePage.tsx');
  let source = original;

  if (!source.includes("import { clearCart } from '../lib/cart';")) {
    source = source.replace(
      "import { downloadInvoicePdf } from '../utils/invoicePdf';",
      "import { downloadInvoicePdf } from '../utils/invoicePdf';\nimport { clearCart } from '../lib/cart';"
    );
  }

  const marker = `  useEffect(() => {
    if (!orderId) return;`;

  if (!source.includes("clearCart();\n  }, []);")) {
    source = replaceRequired(
      source,
      marker,
      `  useEffect(() => {
    // ورود به فاکتور بعد از پرداخت نیز نباید سبد قبلی را نگه دارد.
    clearCart();
  }, []);

${marker}`,
      'پاک‌سازی سبد در فاکتور'
    );
  }

  save(file, source, 'clear-cart-invoice');
}

// -----------------------------------------------------------------------------
// 2) Login redirect: normal login => homepage.
// Checkout resume only when returnTo=/cart AND cart actually has products.
// -----------------------------------------------------------------------------
{
  const { file, source: original } = read('src/pages/OtpLoginPage.tsx');
  let source = original;

  if (!source.includes("import { getCartCount, readCart } from '../lib/cart';")) {
    source = source.replace(
      "import { emitAuthChanged } from '../auth/authApi';",
      "import { emitAuthChanged } from '../auth/authApi';\nimport { getCartCount, readCart } from '../lib/cart';"
    );
  }

  source = source.replace(
    "const returnTo = params.get('returnTo') || '/dashboard';",
    "const requestedReturnTo = params.get('returnTo') || '/';"
  );

  source = replaceRequired(
    source,
    `      emitAuthChanged();
      sessionStorage.setItem('carrtell_checkout_resume', 'info');
      setMsg('ورود با موفقیت انجام شد.');
      window.setTimeout(() => navigate(returnTo, { replace: true }), 250);`,
    `      emitAuthChanged();

      const hasCartItems = getCartCount(readCart()) > 0;
      const shouldResumeCheckout =
        requestedReturnTo.startsWith('/cart') && hasCartItems;

      if (shouldResumeCheckout) {
        sessionStorage.setItem('carrtell_checkout_resume', 'info');
      } else {
        sessionStorage.removeItem('carrtell_checkout_resume');
      }

      setMsg('ورود با موفقیت انجام شد.');
      window.setTimeout(
        () => navigate(shouldResumeCheckout ? '/cart' : '/', { replace: true }),
        250,
      );`,
    'ریدایرکت ورود'
  );

  save(file, source, 'login-home');
}

// Cart must never jump to checkout when cart is empty.
{
  const { file, source: original } = read('src/pages/CartPage.tsx');
  let source = original;

  source = source.replace(
    `    if (isAuthenticated && sessionStorage.getItem('carrtell_checkout_resume') === 'info') {`,
    `    if (
      isAuthenticated &&
      items.length > 0 &&
      sessionStorage.getItem('carrtell_checkout_resume') === 'info'
    ) {`
  );

  // ---------------------------------------------------------------------------
  // 3) Dynamic labor fees by vehicle group.
  // ---------------------------------------------------------------------------
  source = source.replace(
    `  const [serviceLaborFee, setServiceLaborFee] = useState(200000);`,
    `  const [serviceLaborFees, setServiceLaborFees] = useState({
    defaultIranian: 200000,
    pride: 200000,
    peugeot: 200000,
    foreign: 350000,
  });`
  );

  source = source.replace(
    `  const subtotal = useMemo(() => items.reduce((sum, item) => sum + getItemPrice(item) * getItemQty(item), 0), [items]);
  const serviceFee = deliveryMode === 'service' ? dispatchFee + serviceLaborFee : 0;`,
    `  const subtotal = useMemo(() => items.reduce((sum, item) => sum + getItemPrice(item) * getItemQty(item), 0), [items]);

  const serviceLaborFee = useMemo(() => {
    const title = carTitle.toLowerCase();

    const prideKeywords = ['پراید', 'pride', 'سایپا 111', 'سایپا 131', 'سایپا 132', 'سایپا 141'];
    const peugeotKeywords = ['پژو', 'peugeot', '206', '207', '405', 'پارس', 'سمند'];
    const iranianKeywords = [
      'سایپا', 'ایران خودرو', 'iran khodro', 'saipa', 'دنا', 'رانا',
      'تیبا', 'کوییک', 'شاهین', 'تارا', 'سورن', 'آریسان',
    ];

    if (prideKeywords.some((keyword) => title.includes(keyword))) {
      return serviceLaborFees.pride;
    }

    if (peugeotKeywords.some((keyword) => title.includes(keyword))) {
      return serviceLaborFees.peugeot;
    }

    if (title && !iranianKeywords.some((keyword) => title.includes(keyword))) {
      return serviceLaborFees.foreign;
    }

    return serviceLaborFees.defaultIranian;
  }, [carTitle, serviceLaborFees]);

  const serviceFee = deliveryMode === 'service' ? dispatchFee + serviceLaborFee : 0;`
  );

  source = replaceRequired(
    source,
    `.in('setting_key', ['base_dispatch_fee', 'base_service_fee', 'service_fee']);`,
    `.in('setting_key', [
          'base_dispatch_fee',
          'base_service_fee',
          'service_fee',
          'service_labor_fee_pride',
          'service_labor_fee_peugeot',
          'service_labor_fee_foreign',
        ]);`,
    'خواندن تنظیمات اجرت'
  );

  source = replaceRequired(
    source,
    `      const dispatch = data.find((row: any) => row.setting_key === 'base_dispatch_fee');
      const labor = data.find((row: any) => row.setting_key === 'base_service_fee' || row.setting_key === 'service_fee');
      if (dispatch && toNumber(dispatch.setting_value) > 0) setDispatchFee(toNumber(dispatch.setting_value));
      if (labor && toNumber(labor.setting_value) > 0) setServiceLaborFee(toNumber(labor.setting_value));`,
    `      const dispatch = data.find((row: any) => row.setting_key === 'base_dispatch_fee');
      const labor = data.find((row: any) => row.setting_key === 'base_service_fee' || row.setting_key === 'service_fee');
      const pride = data.find((row: any) => row.setting_key === 'service_labor_fee_pride');
      const peugeot = data.find((row: any) => row.setting_key === 'service_labor_fee_peugeot');
      const foreign = data.find((row: any) => row.setting_key === 'service_labor_fee_foreign');

      if (dispatch && toNumber(dispatch.setting_value) > 0) {
        setDispatchFee(toNumber(dispatch.setting_value));
      }

      setServiceLaborFees((previous) => ({
        defaultIranian:
          labor && toNumber(labor.setting_value) > 0
            ? toNumber(labor.setting_value)
            : previous.defaultIranian,
        pride:
          pride && toNumber(pride.setting_value) > 0
            ? toNumber(pride.setting_value)
            : previous.pride,
        peugeot:
          peugeot && toNumber(peugeot.setting_value) > 0
            ? toNumber(peugeot.setting_value)
            : previous.peugeot,
        foreign:
          foreign && toNumber(foreign.setting_value) > 0
            ? toNumber(foreign.setting_value)
            : previous.foreign,
      }));`,
    'اعمال اجرت خودرو'
  );

  save(file, source, 'cart-login-labor');
}

// Admin settings fields.
{
  const { file, source: original } = read('src/admin/pages/Settings.tsx');
  let source = original;

  const oldFields = `  { group: "service", key: "base_dispatch_fee", label: "هزینه پایه ایاب و ذهاب", type: "number" },
  { group: "service", key: "base_service_fee", label: "هزینه پایه سرویس", type: "number" },`;

  const newFields = `  { group: "service", key: "base_dispatch_fee", label: "هزینه پایه ایاب و ذهاب", type: "number" },
  { group: "service", key: "base_service_fee", label: "اجرت سایر خودروهای ایرانی", type: "number" },
  { group: "service", key: "service_labor_fee_pride", label: "اجرت پراید", type: "number" },
  { group: "service", key: "service_labor_fee_peugeot", label: "اجرت پژو", type: "number" },
  { group: "service", key: "service_labor_fee_foreign", label: "اجرت خودروهای خارجی", type: "number" },`;

  source = replaceRequired(source, oldFields, newFields, 'فیلدهای اجرت پنل مدیریت');
  save(file, source, 'admin-labor-fields');
}

// Defaults in settings API.
{
  const { file, source: original } = read('src/admin/services/settingsApi.ts');
  let source = original;

  source = replaceRequired(
    source,
    `  service: {
    enabled: true,
    base_service_fee: '0',
    price_per_km: '0',`,
    `  service: {
    enabled: true,
    base_dispatch_fee: '150000',
    base_service_fee: '200000',
    service_labor_fee_pride: '200000',
    service_labor_fee_peugeot: '250000',
    service_labor_fee_foreign: '350000',
    price_per_km: '0',`,
    'مقادیر پیش‌فرض اجرت'
  );

  save(file, source, 'settings-defaults');
}

console.log('\n✅ تمام اصلاحات با موفقیت اعمال شدند.');
