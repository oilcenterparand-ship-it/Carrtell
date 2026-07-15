import { useEffect, useState } from 'react';
import { Gift, RefreshCcw, Save, Users, Wallet } from 'lucide-react';
import { formatToman, LoyaltySettings } from '../../services/loyaltyApi';
import { getAdminLoyaltyOverview, saveAdminLoyaltySettings } from '../services/loyaltyAdminApi';

type WalletRow = { id: string; user_id?: string; phone?: string; points: number; credit_toman: number; referral_code?: string; tier: string };

export default function LoyaltyAdminPage() {
  const [wallets, setWallets] = useState<WalletRow[]>([]);
  const [settings, setSettings] = useState<Partial<LoyaltySettings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await getAdminLoyaltyOverview();
      setWallets(data.wallets as WalletRow[]);
      setSettings(data.settings || {});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function save() {
    setSaving(true);
    try {
      await saveAdminLoyaltySettings(settings);
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-yellow-300">Carrtell Loyalty</p>
            <h1 className="text-2xl font-black">باشگاه مشتریان و کیف پول</h1>
          </div>
          <button onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-bold hover:bg-white/10">
            <RefreshCcw size={18} /> بروزرسانی
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
            <Users className="mb-3 text-cyan-300" />
            <p className="text-slate-400">اعضای باشگاه</p>
            <p className="mt-2 text-2xl font-black">{wallets.length.toLocaleString('fa-IR')}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
            <Gift className="mb-3 text-yellow-300" />
            <p className="text-slate-400">کل امتیازها</p>
            <p className="mt-2 text-2xl font-black">{wallets.reduce((s,w)=>s+Number(w.points||0),0).toLocaleString('fa-IR')}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
            <Wallet className="mb-3 text-green-300" />
            <p className="text-slate-400">کل اعتبار هدیه</p>
            <p className="mt-2 text-2xl font-black">{formatToman(wallets.reduce((s,w)=>s+Number(w.credit_toman||0),0))}</p>
          </div>
        </div>

        <section className="rounded-3xl border border-white/10 bg-slate-900 p-6">
          <h2 className="mb-5 text-xl font-black">تنظیمات امتیازدهی</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ['purchase_point_rate','نرخ امتیاز خرید'], ['point_to_toman','ارزش هر امتیاز'], ['review_points','امتیاز ثبت نظر'],
              ['referral_reward_toman','جایزه معرفی'], ['referred_discount_toman','تخفیف دوست معرفی‌شده'], ['silver_min','حداقل نقره‌ای'],
              ['gold_min','حداقل طلایی'], ['vip_min','حداقل VIP']
            ].map(([key,label]) => (
              <label key={key} className="block">
                <span className="mb-2 block text-sm text-slate-300">{label}</span>
                <input
                  type="number"
                  value={(settings as any)[key] ?? ''}
                  onChange={(e)=>setSettings(prev=>({...prev,[key]: Number(e.target.value)}))}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400"
                />
              </label>
            ))}
          </div>
          <button onClick={save} disabled={saving} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 font-black text-slate-950 disabled:opacity-60">
            <Save size={18} /> {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
          </button>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-900 p-6">
          <h2 className="mb-5 text-xl font-black">کیف پول مشتری‌ها</h2>
          {loading ? <p>در حال بارگذاری...</p> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-right text-sm">
                <thead className="text-slate-400"><tr><th className="p-3">مشتری</th><th className="p-3">کد معرفی</th><th className="p-3">سطح</th><th className="p-3">امتیاز</th><th className="p-3">اعتبار</th></tr></thead>
                <tbody>
                  {wallets.map(w => <tr key={w.id} className="border-t border-white/10"><td className="p-3">{w.phone || w.user_id || '-'}</td><td className="p-3 font-bold">{w.referral_code}</td><td className="p-3">{w.tier}</td><td className="p-3">{Number(w.points||0).toLocaleString('fa-IR')}</td><td className="p-3">{formatToman(w.credit_toman)}</td></tr>)}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
