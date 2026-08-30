import { supabase } from '../../lib/supabase';
import { PRODUCT_CATEGORIES } from '../../config/productCategories';

export type ProductCategory = {
  id?: string;
  parent_id?: string | null;
  title: string;
  slug: string;
  description?: string;
  image_url?: string | null;
  icon_emoji?: string | null;
  landing_url?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
};

export type ProductCategoryNode = ProductCategory & { children: ProductCategoryNode[] };

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
    parent_id: null,
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
    parent_id: category.parent_id || null,
    image_url: category.image_url?.trim() || null,
    sort_order: Number(category.sort_order || 0),
    icon_emoji: category.icon_emoji?.trim() || null,
    landing_url: category.landing_url?.trim() || '',
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
    ...(category.parent_id !== undefined ? { parent_id: category.parent_id || null } : {}),
    ...(category.image_url !== undefined ? { image_url: category.image_url?.trim() || null } : {}),
    ...(category.sort_order !== undefined ? { sort_order: Number(category.sort_order || 0) } : {}),
    ...(category.icon_emoji !== undefined ? { icon_emoji: category.icon_emoji?.trim() || null } : {}),
    ...(category.landing_url !== undefined ? { landing_url: category.landing_url?.trim() || '' } : {}),
    ...(category.is_active !== undefined ? { is_active: category.is_active !== false } : {}),
  };

  const { data, error } = await supabase.from('product_categories').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export function getCategoryDestination(category: Pick<ProductCategory, 'slug' | 'landing_url'>, fallback: 'shop' | 'journey' = 'shop') {
  const configuredDestination = category.landing_url?.trim();
  if (configuredDestination) return configuredDestination;
  return fallback === 'journey'
    ? `/category/${encodeURIComponent(category.slug)}`
    : `/shop?category=${encodeURIComponent(category.slug)}`;
}

export function buildCategoryTree(categories: ProductCategory[]): ProductCategoryNode[] {
  const nodes = new Map<string, ProductCategoryNode>();
  categories.forEach((category) => {
    if (category.id) nodes.set(category.id, { ...category, children: [] });
  });

  const roots: ProductCategoryNode[] = [];
  nodes.forEach((node) => {
    const parent = node.parent_id ? nodes.get(node.parent_id) : undefined;
    if (parent && parent.id !== node.id) parent.children.push(node);
    else roots.push(node);
  });

  const sort = (items: ProductCategoryNode[]) => {
    items.sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title, 'fa'));
    items.forEach((item) => sort(item.children));
  };
  sort(roots);
  return roots;
}

export function getCategoryDescendantIds(categories: ProductCategory[], rootId: string) {
  const result = new Set<string>([rootId]);
  let changed = true;
  while (changed) {
    changed = false;
    categories.forEach((category) => {
      if (category.id && category.parent_id && result.has(category.parent_id) && !result.has(category.id)) {
        result.add(category.id);
        changed = true;
      }
    });
  }
  return [...result];
}

export function getCategoryPath(categories: ProductCategory[], categoryId?: string | null) {
  if (!categoryId) return [];
  const byId = new Map(categories.filter((item) => item.id).map((item) => [item.id as string, item]));
  const path: ProductCategory[] = [];
  const visited = new Set<string>();
  let current = byId.get(categoryId);
  while (current?.id && !visited.has(current.id)) {
    visited.add(current.id);
    path.unshift(current);
    current = current.parent_id ? byId.get(current.parent_id) : undefined;
  }
  return path;
}

export function getCategoryLabelPath(categories: ProductCategory[], categoryId?: string | null) {
  return getCategoryPath(categories, categoryId).map((item) => item.title).join(' ← ');
}

export async function deleteProductCategory(id: string) {
  const { error } = await supabase.from('product_categories').delete().eq('id', id);
  if (error) throw error;
  return true;
}
