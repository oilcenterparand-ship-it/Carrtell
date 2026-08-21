import type { Product } from '../admin/services/productsApi';

export type CartItem = { product: Product; quantity: number };
export type CartMap = Record<string, CartItem>;

export const CART_STORAGE_KEY = 'carrtell_cart_v1';
const LEGACY_CART_KEYS = ['cart', 'carrtell_cart', 'cart_items'];

export function readCart(): CartMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.sessionStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const source = Array.isArray(parsed)
      ? Object.fromEntries(parsed.map((entry: any, index: number) => [String(entry?.product?.id || entry?.id || index), entry]))
      : parsed;
    if (!source || typeof source !== 'object') return {};

    const normalized: CartMap = {};
    Object.entries(source as Record<string, any>).forEach(([key, entry]) => {
      const product = entry?.product || entry;
      const id = String(product?.id || entry?.product_id || key || '').trim();
      if (!id || !product || typeof product !== 'object') return;
      const rawQuantity = Number(entry?.quantity ?? entry?.qty ?? 1);
      const quantity = Number.isFinite(rawQuantity) && rawQuantity > 0 ? Math.floor(rawQuantity) : 1;
      normalized[id] = { product: { ...product, id }, quantity };
    });
    return normalized;
  } catch {
    return {};
  }
}

export function writeCart(cart: CartMap) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent('carrtell-cart-updated', { detail: cart }));
}

export function getCartCount(cart: CartMap = readCart()) {
  return Object.values(cart).reduce((sum, item) => { const q = Number(item?.quantity); return sum + (Number.isFinite(q) && q > 0 ? q : 0); }, 0);
}

export function getCartTotal(cart: CartMap = readCart(), getPrice?: (product: Product) => number) {
  return Object.values(cart).reduce((sum, item) => {
    const price = getPrice ? getPrice(item.product) : Number(item.product.price || 0);
    return sum + price * Number(item.quantity || 0);
  }, 0);
}

export function isProductAvailableForCart(product: Product, currentQuantity = 0) {
  if (!product?.id) return false;
  if (product.is_active === false || product.is_out_of_stock === true) return false;
  return Number(product.stock || 0) > currentQuantity;
}

export function addProductToCart(product: Product, quantity = 1) {
  if (!product?.id) return { ok: false, message: 'شناسه محصول معتبر نیست.' };
  const cart = readCart();
  const currentRaw = Number(cart[product.id]?.quantity);
  const current = Number.isFinite(currentRaw) && currentRaw > 0 ? currentRaw : 0;
  const stock = Number(product.stock || 0);

  if (product.is_active === false || product.is_out_of_stock === true || stock <= 0) {
    return { ok: false, message: 'این محصول ناموجود است.' };
  }

  if (current + quantity > stock) {
    return { ok: false, message: 'موجودی این محصول کافی نیست.' };
  }

  cart[product.id] = {
    product,
    quantity: current + quantity,
  };
  writeCart(cart);
  return { ok: true, message: 'محصول به سبد خرید اضافه شد.', cart };
}

export function changeCartQuantity(product: Product, delta: number) {
  if (!product?.id) return readCart();
  const cart = readCart();
  const current = cart[product.id];
  if (!current) return cart;

  const currentQuantity = Number(current.quantity);
  const safeCurrentQuantity = Number.isFinite(currentQuantity) && currentQuantity > 0 ? currentQuantity : 1;
  const nextQuantity = safeCurrentQuantity + delta;
  if (nextQuantity <= 0) {
    delete cart[product.id];
  } else {
    cart[product.id] = {
      ...current,
      quantity: Math.min(nextQuantity, Number(product.stock || nextQuantity)),
    };
  }
  writeCart(cart);
  return cart;
}

export function removeProductFromCart(productId?: string) {
  const cart = readCart();
  if (productId) delete cart[productId];
  writeCart(cart);
  return cart;
}

export function clearCart() {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(CART_STORAGE_KEY);
  window.localStorage.removeItem(CART_STORAGE_KEY);
  LEGACY_CART_KEYS.forEach((key) => window.localStorage.removeItem(key));
  window.dispatchEvent(new CustomEvent('carrtell-cart-updated', { detail: {} }));
  window.dispatchEvent(new Event('cart:updated'));
}

export function clearLegacyPersistentCart() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(CART_STORAGE_KEY);
  LEGACY_CART_KEYS.forEach((key) => window.localStorage.removeItem(key));
}
