import { useEffect, useState } from 'react';
import { Copy, Gift, History, PlusCircle, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LoyaltyBadge from '../components/loyalty/LoyaltyBadge';
import { createWalletTopupOrder, CustomerWallet, WalletTransaction, formatToman, getMyWalletTransactions, getOrCreateMyWallet } from '../services/loyaltyApi';

export default function WalletPage() {
  const [wallet, setWallet] = useState<CustomerWallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [topupAmount, setTopupAmount] = useState(500000);
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupError, setTopupError] = useState('');
  const navigate = useNavigate();

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

  async function startTopup() {
    setTopupError('');
    try {
      setTopupLoading(true);
      const order = await createWalletTopupOrder(topupAmount);
      navigate(`/payment?orderId=${encodeURIComponent(order.id)}`);
    } catch (error) {
      setTopupError(error instanceof Error ? error.message : 'ساخت پرداخت شارژ کیف پول انجام نشد.');
    } finally { setTopupLoading(false); }
  }

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

        <section className="rounded-3xl border border-amber-400/20 bg-slate-900 p-6">
          <div className="flex items-center gap-2"><PlusCircle className="text-amber-300" /><h2 className="text-xl font-black">شارژ کیف پول</h2></div>
          <p className="mt-2 text-sm leading-7 text-slate-400">مبلغ دلخواه را وارد کن. پس از پرداخت موفق درگاه، اعتبار به‌صورت خودکار به کیف پول اضافه و در تاریخچه ثبت می‌شود.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <label><span className="mb-2 block text-xs font-bold text-slate-300">مبلغ شارژ (تومان)</span><input type="number" min="50000" max="50000000" step="50000" value={topupAmount} onChange={(event) => setTopupAmount(Number(event.target.value))} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400" /></label>
            <button type="button" disabled={topupLoading || topupAmount < 50000} onClick={() => void startTopup()} className="self-end rounded-2xl bg-amber-400 px-6 py-3 font-black text-slate-950 disabled:opacity-50">{topupLoading ? 'در حال انتقال...' : 'پرداخت و شارژ'}</button>
          </div>
          {topupError ? <p className="mt-3 rounded-xl bg-rose-500/10 p-3 text-sm text-rose-200">{topupError}</p> : null}
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
