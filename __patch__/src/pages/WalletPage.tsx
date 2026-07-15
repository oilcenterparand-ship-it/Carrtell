import { useEffect, useState } from 'react';
import { Copy, Gift, History, Wallet } from 'lucide-react';
import LoyaltyBadge from '../components/loyalty/LoyaltyBadge';
import { CustomerWallet, WalletTransaction, formatToman, getMyWalletTransactions, getOrCreateMyWallet } from '../services/loyaltyApi';

export default function WalletPage() {
  const [wallet, setWallet] = useState<CustomerWallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const w = await getOrCreateMyWallet();
      setWallet(w);
      const tx = await getMyWalletTransactions(w.user_id || undefined);
      setTransactions(tx);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const copyCode = async () => {
    if (!wallet?.referral_code) return;
    await navigator.clipboard.writeText(wallet.referral_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (loading) return <div className="min-h-screen bg-slate-950 p-6 text-white">در حال بارگذاری کیف پول...</div>;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl border border-white/10 bg-gradient-to-l from-slate-900 to-slate-800 p-6 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-300">باشگاه مشتریان Carrtell</p>
              <h1 className="mt-2 text-2xl font-black">کیف پول و امتیاز کارتل</h1>
            </div>
            <LoyaltyBadge tier={wallet?.tier} />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-5">
              <Wallet className="mb-3 text-yellow-300" />
              <p className="text-sm text-yellow-100/80">اعتبار هدیه</p>
              <p className="mt-2 text-2xl font-black text-yellow-200">{formatToman(wallet?.credit_toman)}</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-5">
              <Gift className="mb-3 text-cyan-300" />
              <p className="text-sm text-cyan-100/80">امتیاز کارتل</p>
              <p className="mt-2 text-2xl font-black text-cyan-200">{Number(wallet?.points || 0).toLocaleString('fa-IR')}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-300">کد معرفی شما</p>
              <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-slate-950 px-3 py-3">
                <span className="font-black tracking-widest text-white">{wallet?.referral_code || 'CARRTELL'}</span>
                <button onClick={copyCode} className="rounded-lg bg-yellow-400 px-3 py-2 text-sm font-bold text-slate-950">
                  <Copy size={16} />
                </button>
              </div>
              {copied && <p className="mt-2 text-xs text-green-300">کپی شد</p>}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-900 p-6">
          <div className="mb-4 flex items-center gap-2">
            <History className="text-yellow-300" />
            <h2 className="text-xl font-black">تاریخچه تراکنش‌ها</h2>
          </div>
          {transactions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-slate-400">
              هنوز تراکنشی ثبت نشده است.
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950 p-4">
                  <div>
                    <p className="font-bold">{tx.title || tx.type}</p>
                    <p className="text-sm text-slate-400">{tx.description}</p>
                  </div>
                  <div className="text-left">
                    <p className={tx.points_delta >= 0 ? 'text-green-300' : 'text-red-300'}>{tx.points_delta.toLocaleString('fa-IR')} امتیاز</p>
                    <p className={tx.credit_delta >= 0 ? 'text-green-300' : 'text-red-300'}>{formatToman(tx.credit_delta)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
