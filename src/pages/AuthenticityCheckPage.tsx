import { useState } from 'react';
import { checkAuthenticityCode, AuthenticityCode } from '../services/authenticityReturnsApi';

export default function AuthenticityCheckPage() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<AuthenticityCode | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try { setResult(await checkAuthenticityCode(code)); }
    finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white" dir="rtl">
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-400/15 to-slate-900 p-6">
          <p className="text-sm text-amber-200">Carrtell Authenticity</p>
          <h1 className="mt-2 text-3xl font-black">بررسی اصالت کالا</h1>
          <p className="mt-2 text-slate-300">کد رهگیری Carrtell را وارد کن تا وضعیت محصول بررسی شود.</p>
        </section>
        <form onSubmit={submit} className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-6 sm:flex-row">
          <input value={code} onChange={e => setCode(e.target.value)} placeholder="مثلاً CART-123456" className="flex-1 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400" required />
          <button className="rounded-2xl bg-amber-400 px-6 py-3 font-bold text-slate-950">{loading ? 'در حال بررسی...' : 'بررسی'}</button>
        </form>
        {result === null && <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-6 text-red-100">کدی با این مشخصات پیدا نشد یا نیاز به بررسی دارد.</div>}
        {result && (
          <div className="rounded-3xl border border-emerald-400/30 bg-emerald-500/10 p-6">
            <h2 className="text-xl font-bold text-emerald-200">کد معتبر است</h2>
            <p className="mt-2">محصول: {result.product_name || 'ثبت نشده'}</p>
            <p className="mt-1 text-sm text-slate-300">وضعیت: {result.status}</p>
            <p className="mt-1 text-sm text-slate-300">تعداد بررسی: {result.checked_count ?? 0}</p>
          </div>
        )}
      </div>
    </main>
  );
}
