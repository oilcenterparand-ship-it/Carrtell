import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Car,
  Download,
  PackageCheck,
  Plus,
  ReceiptText,
  RefreshCw,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  createExpense,
  deleteExpense,
  FinanceChartPoint,
  FinanceExpense,
  FinanceRange,
  FinanceSummary,
  formatMoney,
  getExpenses,
  getFinanceReport,
} from "../services/financeApi";

const emptySummary: FinanceSummary = {
  todaySales: 0,
  periodSales: 0,
  paidOrdersCount: 0,
  averageOrderValue: 0,
  totalExpenses: 0,
  productRevenue: 0,
  serviceRevenue: 0,
  costOfGoods: 0,
  grossProfit: 0,
  netProfit: 0,
  profitMargin: 0,
};

const categoryLabels: Record<string, string> = {
  rent: "اجاره",
  salary: "حقوق",
  fuel: "سوخت",
  maintenance: "تعمیرات",
  ads: "تبلیغات",
  tools: "ابزار و تجهیزات",
  other: "سایر",
};

const rangeLabels: Record<FinanceRange, string> = {
  "7d": "۷ روز اخیر",
  "30d": "۳۰ روز اخیر",
  month: "ماه جاری",
};

export default function Finance() {
  const [summary, setSummary] = useState<FinanceSummary>(emptySummary);
  const [chart, setChart] = useState<FinanceChartPoint[]>([]);
  const [expenses, setExpenses] = useState<FinanceExpense[]>([]);
  const [range, setRange] = useState<FinanceRange>("month");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    title: "",
    category: "other" as FinanceExpense["category"],
    amount: "",
    expense_date: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const load = async (selectedRange = range) => {
    setLoading(true);
    setMessage("");
    try {
      const [report, expensesData] = await Promise.all([getFinanceReport(selectedRange), getExpenses(selectedRange)]);
      setSummary(report.summary);
      setChart(report.chart);
      setExpenses(expensesData);
    } catch (error) {
      console.error(error);
      setMessage("دریافت گزارش مالی با خطا مواجه شد. اتصال Supabase و جدول هزینه‌ها را بررسی کنید.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(range);
  }, [range]);

  const expenseByCategory = useMemo(() => {
    return expenses.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + Number(item.amount || 0);
      return acc;
    }, {});
  }, [expenses]);

  const chartMax = useMemo(
    () => Math.max(1, ...chart.flatMap((item) => [item.sales, item.expenses, Math.max(0, item.profit)])),
    [chart],
  );

  const addExpense = async () => {
    if (!form.title.trim() || !Number(form.amount)) {
      setMessage("عنوان و مبلغ هزینه را وارد کنید.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      await createExpense({
        title: form.title.trim(),
        category: form.category,
        amount: Number(form.amount),
        expense_date: form.expense_date,
        notes: form.notes || null,
      });
      setForm({ title: "", category: "other", amount: "", expense_date: new Date().toISOString().slice(0, 10), notes: "" });
      setMessage("هزینه با موفقیت ثبت شد.");
      await load();
    } catch (error) {
      console.error(error);
      setMessage("ثبت هزینه انجام نشد. ابتدا Migration این پچ را در Supabase اجرا کنید.");
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = () => {
    const rows = [
      ["گزارش مالی کارتل", rangeLabels[range]],
      ["فروش", String(summary.periodSales)],
      ["بهای تمام‌شده", String(summary.costOfGoods)],
      ["هزینه‌ها", String(summary.totalExpenses)],
      ["سود خالص", String(summary.netProfit)],
      [],
      ["عنوان هزینه", "دسته", "مبلغ", "تاریخ", "توضیحات"],
      ...expenses.map((e) => [e.title, categoryLabels[e.category] || e.category, String(e.amount), e.expense_date, e.notes || ""]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `carrtell-finance-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cards = [
    { title: "فروش امروز", value: formatMoney(summary.todaySales), icon: TrendingUp },
    { title: `فروش ${rangeLabels[range]}`, value: formatMoney(summary.periodSales), icon: Wallet },
    { title: "درآمد محصولات", value: formatMoney(summary.productRevenue), icon: PackageCheck },
    { title: "درآمد سرویس در محل", value: formatMoney(summary.serviceRevenue), icon: Car },
    { title: "بهای تمام‌شده", value: formatMoney(summary.costOfGoods), icon: ReceiptText },
    { title: "هزینه‌های ثبت‌شده", value: formatMoney(summary.totalExpenses), icon: TrendingDown },
    { title: "سود خالص", value: formatMoney(summary.netProfit), icon: TrendingUp },
    { title: "حاشیه سود", value: `${summary.profitMargin.toLocaleString("fa-IR")}٪`, icon: BarChart3 },
  ];

  return (
    <div className="space-y-6 text-white" dir="rtl">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black">گزارش‌ها و مدیریت مالی</h1>
          <p className="text-sm text-slate-400">تفکیک درآمد فروشگاه، سرویس در محل، هزینه و سود واقعی</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(rangeLabels) as FinanceRange[]).map((key) => (
            <button
              key={key}
              onClick={() => setRange(key)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition ${range === key ? "bg-yellow-400 text-slate-950" : "border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"}`}
            >
              {rangeLabels[key]}
            </button>
          ))}
          <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm hover:bg-slate-800">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> بروزرسانی
          </button>
          <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-yellow-300">
            <Download size={16} /> خروجی CSV
          </button>
        </div>
      </div>

      {message && <div className="rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-100">{message}</div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-lg shadow-black/20">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-300"><Icon size={22} /></div>
              <p className="text-sm text-slate-400">{card.title}</p>
              <strong className={`mt-2 block text-xl ${card.title === "سود خالص" && summary.netProfit < 0 ? "text-red-300" : "text-white"}`}>{loading ? "..." : card.value}</strong>
            </div>
          );
        })}
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black">روند فروش، هزینه و سود</h2>
            <p className="mt-1 text-xs text-slate-500">مقادیر بر اساس سفارش‌های پرداخت‌شده و هزینه‌های ثبت‌شده محاسبه می‌شوند.</p>
          </div>
          <div className="hidden items-center gap-4 text-xs md:flex">
            <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-yellow-400" /> فروش</span>
            <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-red-400" /> هزینه</span>
            <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> سود</span>
          </div>
        </div>
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-[720px] items-end gap-2" style={{ height: 250 }}>
            {chart.map((item) => (
              <div key={item.date} className="flex min-w-8 flex-1 flex-col items-center justify-end gap-2">
                <div className="flex h-48 w-full items-end justify-center gap-1 rounded-lg bg-slate-900/60 px-1">
                  <div title={`فروش: ${formatMoney(item.sales)}`} className="w-2 rounded-t bg-yellow-400" style={{ height: `${Math.max(item.sales ? 4 : 0, (item.sales / chartMax) * 100)}%` }} />
                  <div title={`هزینه: ${formatMoney(item.expenses)}`} className="w-2 rounded-t bg-red-400" style={{ height: `${Math.max(item.expenses ? 4 : 0, (item.expenses / chartMax) * 100)}%` }} />
                  <div title={`سود: ${formatMoney(item.profit)}`} className={`w-2 rounded-t ${item.profit < 0 ? "bg-orange-400" : "bg-emerald-400"}`} style={{ height: `${Math.max(item.profit ? 4 : 0, (Math.abs(item.profit) / chartMax) * 100)}%` }} />
                </div>
                <span className="whitespace-nowrap text-[10px] text-slate-500">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
          <h2 className="mb-4 text-lg font-black">ثبت هزینه جدید</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <input className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-yellow-400" placeholder="عنوان هزینه" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <select className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-yellow-400" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as FinanceExpense["category"] })}>
              {Object.entries(categoryLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
            <input className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-yellow-400" placeholder="مبلغ تومان" inputMode="numeric" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value.replace(/\D/g, "") })} />
            <input className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-yellow-400" type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} />
            <textarea className="min-h-24 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-yellow-400 md:col-span-2" placeholder="توضیحات" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <button onClick={() => void addExpense()} disabled={saving} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 font-bold text-slate-950 hover:bg-yellow-300 disabled:opacity-60">
            <Plus size={18} /> {saving ? "در حال ثبت..." : "ثبت هزینه"}
          </button>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
          <h2 className="mb-4 text-lg font-black">هزینه‌ها بر اساس دسته</h2>
          <div className="space-y-3">
            {Object.entries(categoryLabels).map(([key, label]) => {
              const value = expenseByCategory[key] || 0;
              const pct = summary.totalExpenses ? Math.min(100, Math.round((value / summary.totalExpenses) * 100)) : 0;
              return (
                <div key={key}>
                  <div className="mb-1 flex justify-between text-sm"><span>{label}</span><span>{formatMoney(value)}</span></div>
                  <div className="h-2 rounded-full bg-slate-800"><div className="h-2 rounded-full bg-yellow-400 transition-all" style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
        <h2 className="mb-4 text-lg font-black">لیست هزینه‌های {rangeLabels[range]}</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-right text-sm">
            <thead className="text-slate-400"><tr className="border-b border-slate-800"><th className="py-3">عنوان</th><th>دسته</th><th>مبلغ</th><th>تاریخ</th><th>توضیحات</th><th>عملیات</th></tr></thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id} className="border-b border-slate-900">
                  <td className="py-3 font-bold">{expense.title}</td>
                  <td>{categoryLabels[expense.category] || expense.category}</td>
                  <td>{formatMoney(expense.amount)}</td>
                  <td>{expense.expense_date}</td>
                  <td className="max-w-[240px] truncate text-slate-400">{expense.notes}</td>
                  <td><button onClick={async () => { await deleteExpense(expense.id); await load(); }} className="rounded-lg bg-red-500/10 p-2 text-red-300 hover:bg-red-500/20"><Trash2 size={16} /></button></td>
                </tr>
              ))}
              {!expenses.length && <tr><td colSpan={6} className="py-8 text-center text-slate-500">هزینه‌ای در این بازه ثبت نشده است.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
