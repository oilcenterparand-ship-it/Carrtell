import { supabase } from '../../lib/supabase';

export type CustomerReview = {
  id: string;
  order_id?: string | null;
  product_id?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at?: string;
  experience_label?: string | null;
};

export async function createCustomerReview(input: Omit<CustomerReview, 'id' | 'is_approved' | 'created_at'>) {
  const { data, error } = await supabase
    .from('customer_reviews')
    .insert({ ...input, is_approved: false })
    .select('*')
    .single();
  if (error) throw error;
  return data as CustomerReview;
}

export async function getCustomerReviews() {
  const { data, error } = await supabase
    .from('customer_reviews')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as CustomerReview[];
}

export async function updateCustomerReviewApproval(id: string, is_approved: boolean) {
  const { data, error } = await supabase
    .from('customer_reviews')
    .update({ is_approved })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as CustomerReview;
}

export async function deleteCustomerReview(id: string) {
  const { error } = await supabase.from('customer_reviews').delete().eq('id', id);
  if (error) throw error;
}


export async function getApprovedCustomerReviews(limit = 6) {
  const { data, error } = await supabase
    .from('customer_reviews')
    .select('*')
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  const reviews = (data || []) as CustomerReview[];
  const productIds = [...new Set(reviews.map((review) => review.product_id).filter(Boolean))] as string[];
  const orderIds = [...new Set(reviews.map((review) => review.order_id).filter(Boolean))] as string[];

  const [productsResult, ordersResult, servicesResult] = await Promise.all([
    productIds.length ? supabase.from('products').select('id,name').in('id', productIds) : Promise.resolve({ data: [], error: null }),
    orderIds.length ? supabase.from('orders').select('id,items').in('id', orderIds) : Promise.resolve({ data: [], error: null }),
    orderIds.length ? supabase.from('service_requests').select('order_id,service_title,service_items').in('order_id', orderIds) : Promise.resolve({ data: [], error: null }),
  ]);

  const productNames = new Map((productsResult.data || []).map((row: any) => [String(row.id), String(row.name || '')]));
  const orderLabels = new Map<string, string>();
  for (const row of ordersResult.data || []) {
    const names = (Array.isArray((row as any).items) ? (row as any).items : [])
      .map((item: any) => String(item.product_name || item.name || '').trim()).filter(Boolean).slice(0, 2);
    if (names.length) orderLabels.set(String((row as any).id), names.join('، '));
  }
  for (const row of servicesResult.data || []) {
    const names = (Array.isArray((row as any).service_items) ? (row as any).service_items : [])
      .map((item: any) => String(item.title || item.name || '').trim()).filter(Boolean).slice(0, 2);
    const label = names.join('، ') || String((row as any).service_title || '').trim();
    if (label) orderLabels.set(String((row as any).order_id), label);
  }

  return reviews.map((review) => ({
    ...review,
    experience_label: (review.product_id && productNames.get(review.product_id)) || (review.order_id && orderLabels.get(review.order_id)) || 'خرید یا سرویس از Carrtell',
  }));
}


export type ProductReviewSummary = {
  average: number;
  count: number;
};

export async function getApprovedProductReviews(productId: string, limit = 6) {
  if (!productId) return [] as CustomerReview[];
  const { data, error } = await supabase
    .from('customer_reviews')
    .select('*')
    .eq('is_approved', true)
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as CustomerReview[];
}

export async function getApprovedProductReviewSummaries() {
  const { data, error } = await supabase
    .from('customer_reviews')
    .select('product_id,rating')
    .eq('is_approved', true)
    .not('product_id', 'is', null);
  if (error) throw error;

  const totals: Record<string, { total: number; count: number }> = {};
  for (const row of data || []) {
    const productId = String(row.product_id || '');
    if (!productId) continue;
    const current = totals[productId] || { total: 0, count: 0 };
    current.total += Number(row.rating || 0);
    current.count += 1;
    totals[productId] = current;
  }

  return Object.fromEntries(Object.entries(totals).map(([productId, value]) => [productId, {
    average: value.count ? value.total / value.count : 0,
    count: value.count,
  }])) as Record<string, ProductReviewSummary>;
}
