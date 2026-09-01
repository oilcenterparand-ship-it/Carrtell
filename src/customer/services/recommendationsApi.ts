import { supabase } from '../../lib/supabase';
import type { Product } from '../../admin/services/productsApi';
import { getProducts } from '../../admin/services/productsApi';
import type { Car } from '../../admin/services/carsApi';
import { getCars, getCarTitle } from '../../admin/services/carsApi';
import { getCarPackages, type CarPackage } from '../../admin/services/packagesApi';
import type { SelectedCustomerCar } from './selectedCar';

export type RecommendationBucket = 'essential' | 'carrtell_pick' | 'next_service' | 'package';

export type RecommendedProduct = Product & {
  recommendation_bucket: RecommendationBucket;
  recommendation_reason: string;
  matches_selected_car: boolean;
  priority_score: number;
};

export type RecommendedPackage = CarPackage & {
  recommendation_reason: string;
  available_items_count: number;
  total_items_count: number;
};

export type RecommendationSettings = {
  id?: string;
  is_enabled: boolean;
  only_in_stock: boolean;
  show_unmatched_warning: boolean;
  essential_categories: string[];
  carrtell_pick_categories: string[];
  next_service_categories: string[];
  created_at?: string;
  updated_at?: string;
};

export type MyCarRecommendations = {
  selectedCar: SelectedCustomerCar | null;
  adminCar: Car | null;
  products: RecommendedProduct[];
  packages: RecommendedPackage[];
  essential: RecommendedProduct[];
  carrtellPicks: RecommendedProduct[];
  nextService: RecommendedProduct[];
  warnings: string[];
};

export const defaultRecommendationSettings: RecommendationSettings = {
  is_enabled: true,
  only_in_stock: true,
  show_unmatched_warning: true,
  essential_categories: ['oil', 'engine_oil', 'oil_filter', 'air_filter', 'cabin_filter'],
  carrtell_pick_categories: ['coolant', 'antifreeze', 'brake_fluid', 'cleaner', 'additive'],
  next_service_categories: ['gear_oil', 'transmission_oil', 'hydraulic_oil'],
};

function normalize(value?: string | null) {
  return String(value || '').trim().toLowerCase();
}

export function isProductAvailable(product: Product) {
  return product.is_active !== false && product.is_out_of_stock !== true && Number(product.stock || 0) > 0;
}

export function productMatchesSelectedCar(product: Product, selectedCar?: SelectedCustomerCar | null) {
  if (!selectedCar?.id) return false;
  if (product.compatible_all_cars) return true;
  return (product.compatible_car_ids || []).includes(selectedCar.id);
}

export function productMatchesTransmission(product: Product, selectedCar?: SelectedCustomerCar | null) {
  const productTransmissions = product.compatible_transmissions || [];
  if (!productTransmissions.length) return true;
  const selectedTransmission = normalize(selectedCar?.transmission_type);
  if (!selectedTransmission) return true;
  return productTransmissions.some((item) => normalize(item) === selectedTransmission || normalize(item).includes(selectedTransmission) || selectedTransmission.includes(normalize(item)));
}

function getProductCategory(product: Product) {
  return normalize(product.category);
}

function getBucket(product: Product, settings: RecommendationSettings): RecommendationBucket {
  const category = getProductCategory(product);
  if (settings.essential_categories.map(normalize).includes(category)) return 'essential';
  if (settings.next_service_categories.map(normalize).includes(category)) return 'next_service';
  return 'carrtell_pick';
}

function getReason(product: Product, bucket: RecommendationBucket, selectedCar?: SelectedCustomerCar | null) {
  const carTitle = selectedCar?.title || 'خودروی انتخابی شما';
  if (bucket === 'essential') return `جزو اقلام ضروری سرویس ${carTitle} است و با خودروی شما سازگار شده.`;
  if (bucket === 'next_service') return `برای سرویس بعدی ${carTitle} پیشنهاد می‌شود.`;
  if (product.compatible_all_cars) return 'برای همه خودروها فعال شده و موجودی قابل فروش دارد.';
  return `پیشنهاد کارتل برای ${carTitle} بر اساس سازگاری محصول و موجودی انبار.`;
}

function scoreProduct(product: Product, bucket: RecommendationBucket, selectedCar?: SelectedCustomerCar | null) {
  let score = 0;
  if (bucket === 'essential') score += 80;
  if (bucket === 'next_service') score += 60;
  if (bucket === 'carrtell_pick') score += 40;
  if (productMatchesSelectedCar(product, selectedCar)) score += 40;
  if (product.is_best_seller) score += 15;
  if (product.is_featured) score += 12;
  if (product.compatible_all_cars) score += 5;
  score += Math.min(Number(product.stock || 0), 20);
  return score;
}

export async function getRecommendationSettings(): Promise<RecommendationSettings> {
  const { data, error } = await supabase
    .from('recommendation_settings')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error || !data) return defaultRecommendationSettings;
  return {
    ...defaultRecommendationSettings,
    ...data,
    essential_categories: data.essential_categories || defaultRecommendationSettings.essential_categories,
    carrtell_pick_categories: data.carrtell_pick_categories || defaultRecommendationSettings.carrtell_pick_categories,
    next_service_categories: data.next_service_categories || defaultRecommendationSettings.next_service_categories,
  };
}

export async function getMyCarRecommendations(selectedCar: SelectedCustomerCar | null): Promise<MyCarRecommendations> {
  const warnings: string[] = [];
  const [settings, productsData, carsData, packagesData] = await Promise.all([
    getRecommendationSettings(),
    getProducts(),
    getCars().catch(() => [] as Car[]),
    getCarPackages().catch(() => [] as CarPackage[]),
  ]);

  const adminCar = selectedCar?.id ? (carsData || []).find((car) => car.id === selectedCar.id) || null : null;
  if (!selectedCar?.id) warnings.push('برای دریافت پیشنهاد دقیق، ابتدا خودروی خود را از هدر یا پروفایل انتخاب کنید.');
  if (selectedCar?.id && !adminCar) warnings.push('خودروی انتخاب‌شده در لیست خودروهای پنل مدیریت پیدا نشد.');

  const sourceProducts = (productsData || []) as Product[];
  const matchedProducts = sourceProducts
    .filter((product) => settings.only_in_stock ? isProductAvailable(product) : product.is_active !== false)
    .filter((product) => selectedCar?.id ? productMatchesSelectedCar(product, selectedCar) : false)
    .filter((product) => productMatchesTransmission(product, selectedCar))
    .map((product) => {
      const bucket = getBucket(product, settings);
      return {
        ...product,
        recommendation_bucket: bucket,
        recommendation_reason: getReason(product, bucket, selectedCar),
        matches_selected_car: productMatchesSelectedCar(product, selectedCar),
        priority_score: scoreProduct(product, bucket, selectedCar),
      } as RecommendedProduct;
    })
    .sort((a, b) => b.priority_score - a.priority_score);

  const recommendedPackages: RecommendedPackage[] = (packagesData || [])
    .filter((pkg) => pkg.is_active !== false)
    .filter((pkg) => selectedCar?.id ? (!pkg.car_id || pkg.car_id === selectedCar.id) : false)
    .map((pkg) => {
      const items = pkg.items || [];
      const availableItems = items.filter((item) => item.product && isProductAvailable(item.product));
      return {
        ...pkg,
        available_items_count: availableItems.length,
        total_items_count: items.length,
        recommendation_reason: pkg.car_id ? `پکیج آماده مدیر برای ${selectedCar?.title || getCarTitle(adminCar as Car)}` : 'پکیج عمومی آماده مدیر که برای خودروی انتخابی قابل پیشنهاد است.',
      } as RecommendedPackage;
    })
    .filter((pkg) => pkg.available_items_count > 0 || (pkg.items || []).length === 0)
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));

  return {
    selectedCar,
    adminCar,
    products: matchedProducts,
    packages: recommendedPackages,
    essential: matchedProducts.filter((item) => item.recommendation_bucket === 'essential'),
    carrtellPicks: matchedProducts.filter((item) => item.recommendation_bucket === 'carrtell_pick'),
    nextService: matchedProducts.filter((item) => item.recommendation_bucket === 'next_service'),
    warnings,
  };
}
