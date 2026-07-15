import type { Product } from '../admin/services/productsApi';

export type CartItem = { product: Product; quantity: number };
export type CartMap = Record<string, CartItem>;

export const CART_STORAGE_KEY = 'carrtell_cart_v1';

export function readCart(): CartMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function writeCart(cart: CartMap) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent('carrtell-cart-updated', { detail: cart }));
}

export function getCartCount(cart: CartMap = readCart()) {
  return Object.values(cart).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
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
  const current = cart[product.id]?.quantity || 0;
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

  const nextQuantity = Number(current.quantity || 0) + delta;
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
  writeCart({});
}
