import { supabase } from '../../lib/supabase';

export type DiagnosticStatus = 'healthy' | 'warning' | 'error';

export type DiagnosticCheck = {
  key: string;
  title: string;
  description: string;
  tableName?: string;
  status: DiagnosticStatus;
  message: string;
  details?: string;
  sqlHint?: string;
  count?: number | null;
};

export type DiagnosticsSummary = {
  healthy: number;
  warning: number;
  error: number;
  total: number;
};

export type DiagnosticsResult = {
  checkedAt: string;
  supabaseUrlConfigured: boolean;
  checks: DiagnosticCheck[];
  summary: DiagnosticsSummary;
};

const requiredTables: Array<{
  key: string;
  tableName: string;
  title: string;
  description: string;
  sqlHint: string;
}> = [
  {
    key: 'products',
    tableName: 'products',
    title: 'محصولات',
    description: 'لیست محصولات فروشگاه، موجودی، قیمت و وضعیت فعال بودن.',
    sqlHint: `create table if not exists public.products (\n  id uuid primary key default gen_random_uuid(),\n  name text not null,\n  price numeric default 0,\n  stock integer default 0,\n  is_active boolean default true,\n  created_at timestamptz default now()\n);`,
  },
  {
    key: 'orders',
    tableName: 'orders',
    title: 'سفارش‌ها',
    description: 'سفارش‌های فروشگاهی، وضعیت پرداخت و وضعیت پردازش سفارش.',
    sqlHint: `create table if not exists public.orders (\n  id uuid primary key default gen_random_uuid(),\n  customer_name text,\n  customer_phone text,\n  total_amount numeric default 0,\n  status text default 'pending_review',\n  payment_status text default 'pending_payment',\n  created_at timestamptz default now()\n);`,
  },
  {
    key: 'service_requests',
    tableName: 'service_requests',
    title: 'درخواست‌های سرویس در محل',
    description: 'رزرو سرویس، آدرس، کیلومتر، سرویس‌کار و گردش عملیات.',
    sqlHint: `create table if not exists public.service_requests (\n  id uuid primary key default gen_random_uuid(),\n  customer_name text,\n  customer_phone text,\n  car_id uuid,\n  car_name text,\n  current_km integer,\n  next_service_km integer,\n  status text default 'pending',\n  driver_id uuid,\n  created_at timestamptz default now()\n);`,
  },
  {
    key: 'profiles',
    tableName: 'profiles',
    title: 'پروفایل و نقش کاربران',
    description: 'نقش‌های admin / driver / customer و اطلاعات پایه کاربر.',
    sqlHint: `create table if not exists public.profiles (\n  id uuid primary key references auth.users(id) on delete cascade,\n  full_name text,\n  phone text,\n  role text not null default 'customer' check (role in ('admin','driver','customer')),\n  created_at timestamptz default now(),\n  updated_at timestamptz default now()\n);`,
  },
  {
    key: 'sms_logs',
    tableName: 'sms_logs',
    title: 'لاگ پیامک‌ها',
    description: 'ثبت پیامک‌های سفارش، سرویس، نظرسنجی و ارسال مجدد.',
    sqlHint: `create table if not exists public.sms_logs (\n  id uuid primary key default gen_random_uuid(),\n  event_type text,\n  phone text,\n  message text,\n  status text default 'queued',\n  provider text,\n  error_message text,\n  created_at timestamptz default now()\n);`,
  },
  {
    key: 'payments',
    tableName: 'payments',
    title: 'پرداخت‌ها',
    description: 'پرداخت آزمایشی، زرین‌پال، authority، ref_id و رسید پرداخت.',
    sqlHint: `create table if not exists public.payments (\n  id uuid primary key default gen_random_uuid(),\n  order_id uuid,\n  amount numeric default 0,\n  provider text default 'test',\n  status text default 'pending',\n  authority text,\n  ref_id text,\n  created_at timestamptz default now()\n);`,
  },
  {
    key: 'app_settings',
    tableName: 'app_settings',
    title: 'تنظیمات یکپارچه',
    description: 'تنظیمات برند، پیامک، پرداخت، نقشه، سرویس و سفارش.',
    sqlHint: `create table if not exists public.app_settings (\n  key text primary key,\n  value jsonb not null default '{}'::jsonb,\n  updated_at timestamptz default now()\n);`,
  },
  {
    key: 'customer_reviews',
    tableName: 'customer_reviews',
    title: 'نظرات مشتریان',
    description: 'نظرات ثبت‌شده بعد از خرید/سرویس و نمایش بعد از تایید مدیر.',
    sqlHint: `create table if not exists public.customer_reviews (\n  id uuid primary key default gen_random_uuid(),\n  order_id uuid,\n  customer_name text,\n  rating integer default 5,\n  comment text,\n  is_approved boolean default false,\n  created_at timestamptz default now()\n);`,
  },
];

function summarize(checks: DiagnosticCheck[]): DiagnosticsSummary {
  return checks.reduce(
    (summary, check) => {
      summary[check.status] += 1;
      summary.total += 1;
      return summary;
    },
    { healthy: 0, warning: 0, error: 0, total: 0 } as DiagnosticsSummary
  );
}

function getErrorCode(error: unknown) {
  return (error as { code?: string })?.code || '';
}

function getErrorMessage(error: unknown) {
  return (error as { message?: string })?.message || 'خطای نامشخص';
}

export async function checkSupabaseConnection(): Promise<DiagnosticCheck> {
  const hasUrl = Boolean(import.meta.env.VITE_SUPABASE_URL);
  const hasKey = Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY);

  if (!hasUrl || !hasKey) {
    return {
      key: 'supabase-env',
      title: 'اتصال Supabase',
      description: 'بررسی وجود VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY در فایل env.',
      status: 'error',
      message: 'کلیدهای اتصال Supabase در env کامل نیستند.',
      details: `VITE_SUPABASE_URL: ${hasUrl ? 'موجود' : 'ناموجود'} / VITE_SUPABASE_ANON_KEY: ${hasKey ? 'موجود' : 'ناموجود'}`,
      sqlHint: 'فایل .env.local را بررسی کن و بعد npm run dev را دوباره اجرا کن.',
    };
  }

  const { error } = await supabase.from('products').select('id', { count: 'exact', head: true });

  if (error && getErrorCode(error) !== '42P01') {
    return {
      key: 'supabase-connection',
      title: 'اتصال Supabase',
      description: 'بررسی پاسخ Supabase از سمت کلاینت.',
      status: 'warning',
      message: 'اتصال برقرار است ولی دسترسی یا RLS ممکن است محدود باشد.',
      details: `${getErrorCode(error)} - ${getErrorMessage(error)}`,
    };
  }

  return {
    key: 'supabase-connection',
    title: 'اتصال Supabase',
    description: 'بررسی پاسخ Supabase از سمت کلاینت.',
    status: 'healthy',
    message: 'اتصال Supabase برقرار است.',
  };
}

export async function checkTable(table: (typeof requiredTables)[number]): Promise<DiagnosticCheck> {
  const { count, error } = await supabase
    .from(table.tableName)
    .select('id', { count: 'exact', head: true });

  if (!error) {
    return {
      key: table.key,
      tableName: table.tableName,
      title: table.title,
      description: table.description,
      status: 'healthy',
      message: `جدول ${table.tableName} موجود است.`,
      count: count ?? null,
    };
  }

  const code = getErrorCode(error);
  const message = getErrorMessage(error);

  if (code === '42P01') {
    return {
      key: table.key,
      tableName: table.tableName,
      title: table.title,
      description: table.description,
      status: 'error',
      message: `جدول ${table.tableName} در دیتابیس وجود ندارد.`,
      details: `${code} - ${message}`,
      sqlHint: table.sqlHint,
    };
  }

  if (code === '42501' || message.toLowerCase().includes('permission') || message.toLowerCase().includes('policy')) {
    return {
      key: table.key,
      tableName: table.tableName,
      title: table.title,
      description: table.description,
      status: 'warning',
      message: `جدول ${table.tableName} وجود دارد ولی دسترسی/RLS اجازه تست کامل نمی‌دهد.`,
      details: `${code || 'RLS'} - ${message}`,
      sqlHint: `RLS یا policy جدول ${table.tableName} را بررسی کن.`,
    };
  }

  return {
    key: table.key,
    tableName: table.tableName,
    title: table.title,
    description: table.description,
    status: 'warning',
    message: `تست جدول ${table.tableName} با خطا برگشت.`,
    details: `${code || 'NO_CODE'} - ${message}`,
    sqlHint: table.sqlHint,
  };
}

export async function runDiagnostics(): Promise<DiagnosticsResult> {
  const connection = await checkSupabaseConnection();
  const tableChecks = await Promise.all(requiredTables.map(checkTable));
  const checks = [connection, ...tableChecks];

  return {
    checkedAt: new Date().toISOString(),
    supabaseUrlConfigured: Boolean(import.meta.env.VITE_SUPABASE_URL),
    checks,
    summary: summarize(checks),
  };
}

export function getDiagnosticsSqlBundle(checks: DiagnosticCheck[]) {
  return checks
    .filter((check) => check.status === 'error' && check.sqlHint)
    .map((check) => `-- ${check.title}\n${check.sqlHint}`)
    .join('\n\n');
}
