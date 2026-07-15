import { supabase } from "../lib/supabase";

export interface DiscountCheckResult {
  ok: boolean;
  code?: string;
  discountId?: string;
  amount: number;
  message: string;
}

export async function validateDiscountCode(params: {
  code: string;
  total: number;
  userId?: string | null;
  userLevel?: string | null;
}): Promise<DiscountCheckResult> {
  const code = params.code.trim().toUpperCase();
  if (!code) return { ok: false, amount: 0, message: "کد تخفیف وارد نشده است." };

  const { data, error } = await supabase
    .from("discounts")
    .select("*")
    .eq("code", code)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { ok: false, amount: 0, message: "کد تخفیف معتبر نیست." };

  const now = new Date();
  if (data.starts_at && new Date(data.starts_at) > now) return { ok: false, amount: 0, message: "این کد هنوز فعال نشده است." };
  if (data.ends_at && new Date(data.ends_at) < now) return { ok: false, amount: 0, message: "مهلت استفاده از این کد تمام شده است." };
  if (data.usage_limit && data.used_count >= data.usage_limit) return { ok: false, amount: 0, message: "ظرفیت استفاده از این کد تمام شده است." };
  if (params.total < Number(data.min_order_amount ?? 0)) return { ok: false, amount: 0, message: `حداقل خرید برای این کد ${Number(data.min_order_amount).toLocaleString("fa-IR")} تومان است.` };
  if (data.target_type === "vip" && !["gold","vip"].includes(String(params.userLevel ?? "").toLowerCase())) return { ok: false, amount: 0, message: "این کد مخصوص مشتریان ویژه است." };

  let amount = data.discount_type === "percent"
    ? Math.floor(params.total * Number(data.value) / 100)
    : Number(data.value);

  if (data.max_discount_amount) amount = Math.min(amount, Number(data.max_discount_amount));
  amount = Math.max(0, Math.min(amount, params.total));

  return { ok: true, code, discountId: data.id, amount, message: "کد تخفیف اعمال شد." };
}

export async function registerDiscountUsage(params: {
  discountId: string;
  orderId?: string | null;
  userId?: string | null;
  code: string;
  amount: number;
}) {
  await supabase.from("discount_usages").insert({
    discount_id: params.discountId,
    order_id: params.orderId,
    user_id: params.userId,
    code: params.code,
    discount_amount: params.amount,
  });
  await supabase.rpc("increment_discount_usage", { discount_uuid: params.discountId });
}
