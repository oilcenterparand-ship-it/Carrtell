import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const file = path.join(root, 'src/pages/CartPage.tsx');
if (!fs.existsSync(file)) {
  console.error('❌ فایل src/pages/CartPage.tsx پیدا نشد. اسکریپت را از ریشه پروژه اجرا کن.');
  process.exit(1);
}

let src = fs.readFileSync(file, 'utf8');
const backup = `${file}.bak-cart-storage-sync-${Date.now()}`;
fs.copyFileSync(file, backup);

const helperMarker = 'function readCheckoutCart()';
if (!src.includes(helperMarker)) {
  const anchor = `function writeCart(items: CartItem[]) {`;
  const helper = `function readCheckoutCart(): CartItem[] {\n  // سبد اصلی فروشگاه در carrtell_cart_v1 به‌صورت Map ذخیره می‌شود.\n  // نسخه‌های قدیمی‌تر آرایه را در کلیدهای دیگر ذخیره می‌کردند؛ هر دو فرمت پشتیبانی می‌شوند.\n  try {\n    const rawMap = localStorage.getItem('carrtell_cart_v1');\n    if (rawMap) {\n      const parsed = JSON.parse(rawMap);\n      if (parsed && !Array.isArray(parsed) && typeof parsed === 'object') {\n        const mapped = Object.values(parsed)\n          .map((entry: any) => {\n            const product = entry?.product || entry;\n            if (!product?.id) return null;\n            return {\n              ...product,\n              id: String(product.id),\n              product_id: String(product.id),\n              quantity: Math.max(1, Number(entry?.quantity || 1)),\n              qty: Math.max(1, Number(entry?.quantity || 1)),\n            } as CartItem;\n          })\n          .filter(Boolean) as CartItem[];\n        if (mapped.length) return mapped;\n      }\n    }\n  } catch {\n    // ادامه با فرمت‌های قدیمی\n  }\n\n  return readJson<CartItem[]>(['cart', 'carrtell_cart', 'cart_items'], []);\n}\n\n`;
  if (!src.includes(anchor)) {
    console.error('❌ محل مناسب برای افزودن همگام‌ساز سبد پیدا نشد. هیچ تغییری اعمال نشد.');
    fs.copyFileSync(backup, file);
    process.exit(1);
  }
  src = src.replace(anchor, helper + anchor);
}

const oldWrite = `function writeCart(items: CartItem[]) {\n  const normalized = items.map((item) => ({ ...item, quantity: getItemQty(item) }));\n  localStorage.setItem('cart', JSON.stringify(normalized));\n  localStorage.setItem('carrtell_cart', JSON.stringify(normalized));\n  window.dispatchEvent(new Event('cart:updated'));\n}`;
const newWrite = `function writeCart(items: CartItem[]) {\n  const normalized = items.map((item) => ({ ...item, quantity: getItemQty(item), qty: getItemQty(item) }));\n\n  // نگهداری فرمت قدیمی برای سازگاری صفحات قبلی\n  localStorage.setItem('cart', JSON.stringify(normalized));\n  localStorage.setItem('carrtell_cart', JSON.stringify(normalized));\n\n  // نگهداری فرمت اصلی فروشگاه و MiniCart\n  const canonicalCart = normalized.reduce<Record<string, { product: CartItem; quantity: number }>>((acc, item) => {\n    const id = getItemId(item);\n    acc[id] = {\n      product: { ...item, id, product_id: id },\n      quantity: getItemQty(item),\n    };\n    return acc;\n  }, {});\n  localStorage.setItem('carrtell_cart_v1', JSON.stringify(canonicalCart));\n\n  window.dispatchEvent(new Event('cart:updated'));\n  window.dispatchEvent(new CustomEvent('carrtell-cart-updated', { detail: canonicalCart }));\n}`;
if (src.includes(oldWrite)) {
  src = src.replace(oldWrite, newWrite);
} else if (!src.includes("localStorage.setItem('carrtell_cart_v1'")) {
  console.error('❌ تابع writeCart با ساختار مورد انتظار پیدا نشد. برای جلوگیری از خرابی، عملیات متوقف شد.');
  fs.copyFileSync(backup, file);
  process.exit(1);
}

src = src.replace(
  `setItems(readJson<CartItem[]>(['cart', 'carrtell_cart', 'cart_items'], []));`,
  `setItems(readCheckoutCart());`
);

// همگام‌سازی زنده با ProductCard و MiniCart
const effectAnchor = `  useEffect(() => {\n    setItems(readCheckoutCart());`;
if (src.includes(effectAnchor) && !src.includes("window.addEventListener('carrtell-cart-updated', syncCart)")) {
  const insertionPoint = `  }, []);\n\n  useEffect(() => {\n    const carId = selectedCar?.car_id || selectedCar?.id;`;
  const syncEffect = `  }, []);\n\n  useEffect(() => {\n    const syncCart = () => setItems(readCheckoutCart());\n    window.addEventListener('carrtell-cart-updated', syncCart);\n    window.addEventListener('cart:updated', syncCart);\n    window.addEventListener('storage', syncCart);\n    return () => {\n      window.removeEventListener('carrtell-cart-updated', syncCart);\n      window.removeEventListener('cart:updated', syncCart);\n      window.removeEventListener('storage', syncCart);\n    };\n  }, []);\n\n  useEffect(() => {\n    const carId = selectedCar?.car_id || selectedCar?.id;`;
  if (src.includes(insertionPoint)) src = src.replace(insertionPoint, syncEffect);
}

if (!src.includes('readCheckoutCart()') || !src.includes("'carrtell_cart_v1'")) {
  console.error('❌ اعتبارسنجی نهایی پچ ناموفق بود. فایل قبلی بازگردانده شد.');
  fs.copyFileSync(backup, file);
  process.exit(1);
}

fs.writeFileSync(file, src, 'utf8');
console.log('✅ همگام‌سازی سبد خرید با carrtell_cart_v1 انجام شد.');
console.log(`🛟 بکاپ: ${path.relative(root, backup)}`);
console.log('🔁 Vite را ری‌استارت کن و مسیر Shop → Cart را دوباره تست کن.');
