export const PRODUCT_CATEGORIES = [
  { value: 'engine-oil', label: 'روغن موتور' },
  { value: 'oil-filter', label: 'فیلتر روغن' },
  { value: 'air-filter', label: 'فیلتر هوا' },
  { value: 'cabin-filter', label: 'فیلتر کابین' },
  { value: 'gear-oil', label: 'واسکازین / روغن گیربکس' },
  { value: 'hydraulic-oil', label: 'روغن هیدرولیک' },
  { value: 'antifreeze', label: 'ضدیخ' },
  { value: 'additive', label: 'مکمل' },
] as const;

export type ProductCategoryValue = (typeof PRODUCT_CATEGORIES)[number]['value'];

export function getProductCategoryLabel(category?: string | null) {
  return PRODUCT_CATEGORIES.find((item) => item.value === category)?.label || 'محصول خودرو';
}

export function getCategoryLabel(category?: string | null) {
  return getProductCategoryLabel(category);
}
