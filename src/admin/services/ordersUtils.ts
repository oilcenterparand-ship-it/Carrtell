import type { Product } from './productsApi';

export function isAmazingActive(product: Product) {
  if (!product.is_featured || !product.amazing_price || !product.amazing_ends_at) return false;
  return new Date(product.amazing_ends_at).getTime() > Date.now();
}

export function getProductFinalPrice(product: Product) {
  return isAmazingActive(product) ? Number(product.amazing_price) : Number(product.price || 0);
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat('fa-IR').format(price || 0);
}
