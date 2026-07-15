import { useState } from "react";
import { validateDiscountCode, type DiscountCheckResult } from "../../services/discountsClientApi";

interface Props {
  total: number;
  userId?: string | null;
  userLevel?: string | null;
  onApplied: (result: DiscountCheckResult) => void;
}

export default function DiscountCodeBox({ total, userId, userLevel, onApplied }: Props) {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const apply = async () => {
    setLoading(true);
    try {
      const result = await validateDiscountCode({ code, total, userId, userLevel });
      setMessage(result.message);
      if (result.ok) onApplied(result);
    } catch (err: any) {
      setMessage(err?.message || "خطا در بررسی کد تخفیف");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-lg">
      <div className="mb-2 text-sm font-bold text-white">کد تخفیف</div>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="مثلاً CARTELL"
          className="flex-1 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white outline-none focus:border-amber-400"
        />
        <button
          type="button"
          onClick={apply}
          disabled={loading}
          className="rounded-xl bg-amber-400 px-4 py-2 font-bold text-slate-950 disabled:opacity-60"
        >
          {loading ? "..." : "اعمال"}
        </button>
      </div>
      {message && <p className="mt-2 text-xs text-slate-300">{message}</p>}
    </div>
  );
}
