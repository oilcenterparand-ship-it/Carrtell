import { supabase } from '../../lib/supabase';

export type BlogStatus = 'draft' | 'published';

export interface BlogCategory {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  is_active?: boolean;
  sort_order?: number;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  cover_image_url?: string | null;
  category_id?: string | null;
  category?: BlogCategory | null;
  tags?: string[] | null;
  status: BlogStatus;
  is_featured?: boolean;
  related_product_category?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  published_at?: string | null;
  created_at?: string;
}

const fallbackCategories: BlogCategory[] = [
  { id: 'engine-oil', title: 'روغن موتور', slug: 'engine-oil', is_active: true },
  { id: 'filters', title: 'فیلترها', slug: 'filters', is_active: true },
  { id: 'periodic-service', title: 'سرویس دوره‌ای', slug: 'periodic-service', is_active: true },
];

const fallbackPosts: BlogPost[] = [
  {
    id: 'demo-engine-oil',
    title: 'چه زمانی روغن موتور را تعویض کنیم؟',
    slug: 'when-change-engine-oil',
    excerpt: 'راهنمای ساده Carrtell برای تشخیص زمان تعویض روغن بر اساس کیلومتر و شرایط رانندگی.',
    content: 'در Carrtell ملاک اصلی سرویس بعدی خودرو کیلومتر است، نه فقط تاریخ. اگر خودرو در ترافیک، گرما یا مسیرهای کوتاه استفاده می‌شود، بازه تعویض روغن می‌تواند کوتاه‌تر شود.',
    status: 'published',
    is_featured: true,
    tags: ['روغن موتور', 'سرویس دوره‌ای'],
    created_at: new Date().toISOString(),
  },
];

export async function getBlogCategories(): Promise<BlogCategory[]> {
  const { data, error } = await supabase.from('blog_categories').select('*').order('sort_order', { ascending: true });
  if (error) return fallbackCategories;
  return data ?? fallbackCategories;
}

export async function getAdminBlogPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*, category:blog_categories(*)')
    .order('created_at', { ascending: false });
  if (error) return fallbackPosts;
  return (data as BlogPost[]) ?? [];
}

export async function getPublishedBlogPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*, category:blog_categories(*)')
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  if (error || !data?.length) return fallbackPosts;
  return data as BlogPost[];
}

export async function getFeaturedBlogPosts(limit = 3): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*, category:blog_categories(*)')
    .eq('status', 'published')
    .eq('is_featured', true)
    .limit(limit);
  if (error || !data?.length) return fallbackPosts.slice(0, limit);
  return data as BlogPost[];
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  if (slug === 'when-change-engine-oil') return fallbackPosts[0];
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*, category:blog_categories(*)')
    .eq('slug', slug)
    .maybeSingle();
  if (error) return null;
  return data as BlogPost | null;
}

export async function saveBlogPost(input: Partial<BlogPost>) {
  const payload = {
    ...input,
    slug: input.slug || makeSlug(input.title || 'post'),
    published_at: input.status === 'published' ? input.published_at || new Date().toISOString() : input.published_at,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { data, error } = await supabase.from('blog_posts').update(payload).eq('id', input.id).select().single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase.from('blog_posts').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function deleteBlogPost(id: string) {
  const { error } = await supabase.from('blog_posts').delete().eq('id', id);
  if (error) throw error;
}

export function makeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9\u0600-\u06FF-]/g, '')
    .replace(/-+/g, '-');
}
