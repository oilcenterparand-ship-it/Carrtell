import { supabase } from '../../lib/supabase';
import { PRODUCT_CATEGORIES } from '../../config/productCategories';

export type ProductCategory = {
  id?: string;
  title: string;
  slug: string;
  description?: string;
  image_url?: string | null;
  icon_emoji?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
};

function makeSlug(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-آ-ی]/gi, '') || `category-${Date.now()}`;
}

function fallbackCategories(): ProductCategory[] {
  return PRODUCT_CATEGORIES.map((item, index) => ({
    title: item.label,
    slug: item.value,
    description: '',
    sort_order: index + 1,
    is_active: true,
  }));
}

export async function getProductCategories() {
  const { data, error } = await supabase
    .from('product_categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.warn('product_categories not ready, using fallback categories', error);
    return fallbackCategories();
  }

  const categories = (data || []) as ProductCategory[];
  return categories.length ? categories : fallbackCategories();
}

export async function createProductCategory(category: ProductCategory) {
  const payload = {
    title: category.title.trim(),
    slug: category.slug?.trim() || makeSlug(category.title),
    description: category.description || '',
    sort_order: Number(category.sort_order || 0),
    icon_emoji: category.icon_emoji?.trim() || null,
    is_active: category.is_active !== false,
  };

  const { data, error } = await supabase.from('product_categories').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateProductCategory(id: string, category: Partial<ProductCategory>) {
  const payload = {
    ...(category.title !== undefined ? { title: category.title.trim() } : {}),
    ...(category.slug !== undefined ? { slug: category.slug.trim() || makeSlug(category.title || 'category') } : {}),
    ...(category.description !== undefined ? { description: category.description || '' } : {}),
    ...(category.sort_order !== undefined ? { sort_order: Number(category.sort_order || 0) } : {}),
    ...(category.icon_emoji !== undefined ? { icon_emoji: category.icon_emoji?.trim() || null } : {}),
    ...(category.is_active !== undefined ? { is_active: category.is_active !== false } : {}),
  };

  const { data, error } = await supabase.from('product_categories').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteProductCategory(id: string) {
  const { error } = await supabase.from('product_categories').delete().eq('id', id);
  if (error) throw error;
  return true;
}
