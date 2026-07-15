import { supabase } from "../../lib/supabase";

export type DiscountType = "percent" | "fixed";
export type DiscountTargetType = "all" | "product" | "category" | "brand" | "vip" | "service";

export interface Discount {
  id?: string;
  code: string;
  title: string;
  description?: string | null;
  discount_type: DiscountType;
  value: number;
  min_order_amount?: number;
  max_discount_amount?: number | null;
  starts_at?: string | null;
  ends_at?: string | null;
  usage_limit?: number | null;
  used_count?: number;
  per_user_limit?: number;
  is_active?: boolean;
  target_type?: DiscountTargetType;
  target_ids?: string[];
  created_at?: string;
}

export async function getDiscounts(): Promise<Discount[]> {
  const { data, error } = await supabase
    .from("discounts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Discount[];
}

export async function saveDiscount(input: Discount): Promise<Discount> {
  const payload = {
    ...input,
    code: input.code.trim().toUpperCase(),
    min_order_amount: Number(input.min_order_amount ?? 0),
    value: Number(input.value ?? 0),
    per_user_limit: Number(input.per_user_limit ?? 1),
    target_ids: input.target_ids ?? [],
  };

  const query = input.id
    ? supabase.from("discounts").update(payload).eq("id", input.id).select("*").single()
    : supabase.from("discounts").insert(payload).select("*").single();

  const { data, error } = await query;
  if (error) throw error;
  return data as Discount;
}

export async function deleteDiscount(id: string): Promise<void> {
  const { error } = await supabase.from("discounts").delete().eq("id", id);
  if (error) throw error;
}

export async function toggleDiscount(id: string, is_active: boolean): Promise<void> {
  const { error } = await supabase.from("discounts").update({ is_active }).eq("id", id);
  if (error) throw error;
}
