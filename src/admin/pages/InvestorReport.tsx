import { useEffect, useState } from 'react';
import { Download, RefreshCw, TrendingUp, Truck, Users, Wallet } from 'lucide-react';
import { getInvestorReportData } from '../services/dashboardApi';

const money = (value: number) => new Intl.NumberFormat('fa-IR').format(Math.round(value || 0)) + ' تومان';

export default function InvestorReport() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setData(await getInvestorReportData());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const exportText = () => {
    const text = `گزارش سرمایه‌گذار Carrtell\n\nکل سرویس‌ها: ${data?.totalServices ?? 0}\nسرویس‌های تکمیل‌شده: ${data?.completedServices ?? 0}\nکل سفارش‌ها: ${data?.totalOrders ?? 0}\nسفارش‌های پرداخت‌شده: ${data?.paidOrders ?? 0}\nفروش کل: ${money(data?.totalSales ?? 0)}\nمشتریان: ${data?.customers ?? 0}\nسرویس‌کارها: ${data?.drivers ?? 0}`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'carrtell-investor-report.txt';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-6 p-4 md:p-6 text-white" dir="rtl">
      <div className="rounded-3xl border border-yellow-400/30 bg-gradient-to-br from-yellow-400/20 via-slate-900 to-slate-950 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black">گزارش سرمایه‌گذار Carrtell</h1>
            <p className="text-slate-300 mt-2">نمای مدیریتی برای رشد سرویس در محل، فروش و ظرفیت فرانچایز</p>
          </div>
          <div className="flex gap-3">
            <button onClick={load} className="rounded-2xl border border-slate-700 px-4 py-3 font-bold hover:bg-slate-800"><RefreshCw className={loading ? 'animate-spin' : ''} /></button>
            <button onClick={exportText} className="inline-flex items-center gap-2 rounded-2xl bg-yellow-400 text-slate-950 px-5 py-3 font-bold"><Download size={18}/> خروجی گزارش</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Metric icon={<Truck />} title="کل سرویس‌ها" value={data?.totalServices ?? 0} />
        <Metric icon={<TrendingUp />} title="سرویس تکمیل‌شده" value={data?.completedServices ?? 0} />
        <Metric icon={<Wallet />} title="فروش پرداخت‌شده" value={money(data?.totalSales ?? 0)} />
        <Metric icon={<Users />} title="مشتریان" value={data?.customers ?? 0} />
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
        <h2 className="text-xl font-black mb-4">شاخص‌های قابل ارائه</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <Info label="نرخ تکمیل سرویس" value={`${data?.totalServices ? Math.round((data.completedServices / data.totalServices) * 100) : 0}%`} />
          <Info label="نسبت سفارش پرداخت‌شده" value={`${data?.totalOrders ? Math.round((data.paidOrders / data.totalOrders) * 100) : 0}%`} />
          <Info label="تعداد سرویس‌کار فعال" value={data?.drivers ?? 0} />
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
        <h2 className="text-xl font-black mb-4">آخرین درخواست‌های سرویس</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="text-slate-400"><tr><th className="py-3">مشتری</th><th>خودرو</th><th>وضعیت</th><th>کیلومتر</th></tr></thead>
            <tbody>
              {(data?.recentServices ?? []).map((s:any) => <tr key={s.id} className="border-t border-slate-800"><td className="py-3">{s.customer_name ?? '-'}</td><td>{s.car_name ?? '-'}</td><td>{s.status ?? '-'}</td><td>{s.current_km ?? '-'}</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Metric({ icon, title, value }: any) {
  return <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl"><div className="text-yellow-300 mb-3">{icon}</div><p className="text-slate-400 text-sm">{title}</p><p className="text-2xl font-black mt-2">{value}</p></div>;
}
function Info({ label, value }: any) { return <div className="rounded-2xl bg-slate-950/50 border border-slate-800 p-4"><p className="text-slate-400">{label}</p><b className="block mt-2 text-yellow-300 text-xl">{value}</b></div>; }
