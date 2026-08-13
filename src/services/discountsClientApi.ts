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

  const { data, error } = await supabase.rpc("carrtell_validate_discount", {
    p_code: code,
    p_subtotal: Math.max(0, Number(params.total || 0)),
    p_user_id: params.userId || null,
  });

  if (error) throw error;
  const result = (data || {}) as Partial<DiscountCheckResult>;
  return {
    ok: Boolean(result.ok),
    code: result.code,
    discountId: result.discountId,
    amount: Math.max(0, Number(result.amount || 0)),
    message: String(result.message || (result.ok ? "کد تخفیف اعمال شد." : "کد تخفیف معتبر نیست.")),
  };
}

// مصرف کد تخفیف فقط داخل RPC اتمیک ثبت سفارش ثبت می‌شود.
// این تابع برای سازگاری با کدهای قدیمی نگه داشته شده و عمداً عملیات جداگانه انجام نمی‌دهد.
export async function registerDiscountUsage() {
  return true;
}
