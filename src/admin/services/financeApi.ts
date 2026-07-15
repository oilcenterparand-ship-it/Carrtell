import { supabase } from "../../lib/supabase";

export type ExpenseCategory = "rent" | "salary" | "fuel" | "maintenance" | "ads" | "tools" | "other";
export type FinanceRange = "7d" | "30d" | "month";

export interface FinanceExpense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  expense_date: string;
  notes?: string | null;
  created_at?: string;
}

export interface FinanceSummary {
  todaySales: number;
  periodSales: number;
  paidOrdersCount: number;
  averageOrderValue: number;
  totalExpenses: number;
  productRevenue: number;
  serviceRevenue: number;
  costOfGoods: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
}

export interface FinanceChartPoint {
  date: string;
  label: string;
  sales: number;
  expenses: number;
  profit: number;
}

export interface FinanceReport {
  summary: FinanceSummary;
  chart: FinanceChartPoint[];
}

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

function getRangeStart(range: FinanceRange): Date {
  const now = new Date();
  const result = new Date(now);
  result.setHours(0, 0, 0, 0);
  if (range === "7d") result.setDate(result.getDate() - 6);
  if (range === "30d") result.setDate(result.getDate() - 29);
  if (range === "month") result.setDate(1);
  return result;
}

function getOrderTotal(order: any): number {
  return Number(order?.total_amount ?? order?.total ?? order?.amount ?? order?.final_amount ?? 0) || 0;
}

function getServiceRevenue(order: any): number {
  return Number(order?.service_fee ?? order?.delivery_fee ?? 0) || 0;
}

function dateKey(value: string | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function persianDayLabel(value: Date): string {
  return new Intl.DateTimeFormat("fa-IR", { month: "short", day: "numeric" }).format(value);
}

function buildDateRows(start: Date): FinanceChartPoint[] {
  const rows: FinanceChartPoint[] = [];
  const cursor = new Date(start);
  const end = startOfToday();
  while (cursor <= end) {
    rows.push({ date: dateKey(cursor), label: persianDayLabel(cursor), sales: 0, expenses: 0, profit: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return rows;
}

export async function getFinanceReport(range: FinanceRange = "month"): Promise<FinanceReport> {
  const rangeStart = getRangeStart(range);
  const rangeStartIso = rangeStart.toISOString();
  const todayStart = startOfToday();

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("*")
    .gte("created_at", rangeStartIso)
    .in("payment_status", ["paid", "success", "completed"]);

  if (ordersError) throw ordersError;

  const { data: expenses, error: expensesError } = await supabase
    .from("finance_expenses")
    .select("*")
    .gte("expense_date", dateKey(rangeStart));

  if (expensesError && expensesError.code !== "42P01") throw expensesError;

  const paidOrders = orders ?? [];
  const periodSales = paidOrders.reduce((sum: number, order: any) => sum + getOrderTotal(order), 0);
  const todaySales = paidOrders
    .filter((order: any) => new Date(order.created_at) >= todayStart)
    .reduce((sum: number, order: any) => sum + getOrderTotal(order), 0);
  const paidOrdersCount = paidOrders.length;
  const averageOrderValue = paidOrdersCount ? Math.round(periodSales / paidOrdersCount) : 0;
  const serviceRevenue = paidOrders.reduce((sum: number, order: any) => sum + getServiceRevenue(order), 0);
  const productRevenue = Math.max(0, periodSales - serviceRevenue);
  const costOfGoods = paidOrders.reduce((sum: number, order: any) => sum + Number(order?.cost_total || 0), 0);
  const totalExpenses = (expenses ?? []).reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
  const grossProfit = Math.max(0, periodSales - costOfGoods);
  const netProfit = grossProfit - totalExpenses;
  const profitMargin = periodSales ? Math.round((netProfit / periodSales) * 1000) / 10 : 0;

  const chart = buildDateRows(rangeStart);
  const chartMap = new Map(chart.map((item) => [item.date, item]));

  paidOrders.forEach((order: any) => {
    const row = chartMap.get(dateKey(order.created_at));
    if (!row) return;
    const sales = getOrderTotal(order);
    const cost = Number(order?.cost_total || 0);
    row.sales += sales;
    row.profit += Math.max(0, sales - cost);
  });

  (expenses ?? []).forEach((expense: any) => {
    const row = chartMap.get(String(expense.expense_date).slice(0, 10));
    if (!row) return;
    const amount = Number(expense.amount || 0);
    row.expenses += amount;
    row.profit -= amount;
  });

  return {
    summary: {
      todaySales,
      periodSales,
      paidOrdersCount,
      averageOrderValue,
      totalExpenses,
      productRevenue,
      serviceRevenue,
      costOfGoods,
      grossProfit,
      netProfit,
      profitMargin,
    },
    chart,
  };
}

export async function getExpenses(range: FinanceRange = "month"): Promise<FinanceExpense[]> {
  const { data, error } = await supabase
    .from("finance_expenses")
    .select("*")
    .gte("expense_date", dateKey(getRangeStart(range)))
    .order("expense_date", { ascending: false });

  if (error) {
    if (error.code === "42P01") return [];
    throw error;
  }
  return (data ?? []) as FinanceExpense[];
}

export async function createExpense(input: Omit<FinanceExpense, "id" | "created_at">): Promise<FinanceExpense> {
  const { data, error } = await supabase.from("finance_expenses").insert(input).select("*").single();
  if (error) throw error;
  return data as FinanceExpense;
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from("finance_expenses").delete().eq("id", id);
  if (error) throw error;
}

export function formatMoney(value: number): string {
  return `${Math.round(Number(value || 0)).toLocaleString("fa-IR")} تومان`;
}
