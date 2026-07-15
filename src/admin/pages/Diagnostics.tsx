import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clipboard, Database, Loader2, RefreshCw, ShieldAlert, Terminal, XCircle } from 'lucide-react';
import { DiagnosticCheck, DiagnosticsResult, getDiagnosticsSqlBundle, runDiagnostics } from '../services/diagnosticsApi';

const statusConfig = {
  healthy: {
    label: 'سالم',
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    icon: CheckCircle2,
  },
  warning: {
    label: 'نیاز به بررسی',
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
    icon: AlertTriangle,
  },
  error: {
    label: 'خطا',
    className: 'border-rose-500/30 bg-rose-500/10 text-rose-200',
    icon: XCircle,
  },
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

function StatusBadge({ status }: { status: DiagnosticCheck['status'] }) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${config.className}`}>
      <Icon className="h-4 w-4" />
      {config.label}
    </span>
  );
}

function CheckCard({ check }: { check: DiagnosticCheck }) {
  const [copied, setCopied] = useState(false);

  async function copySql() {
    if (!check.sqlHint) return;
    await navigator.clipboard.writeText(check.sqlHint);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="rounded-3xl border border-slate-700/70 bg-slate-900/80 p-5 shadow-xl shadow-black/20">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-extrabold text-white">{check.title}</h3>
            {check.tableName && <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">{check.tableName}</span>}
          </div>
          <p className="text-sm leading-7 text-slate-300">{check.description}</p>
        </div>
        <StatusBadge status={check.status} />
      </div>

      <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
        <p className="text-sm font-bold text-slate-100">{check.message}</p>
        {typeof check.count === 'number' && <p className="mt-2 text-xs text-slate-400">تعداد تقریبی رکوردها: {check.count.toLocaleString('fa-IR')}</p>}
        {check.details && <p className="mt-2 break-words text-xs leading-6 text-slate-400">{check.details}</p>}
      </div>

      {check.sqlHint && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
              <Terminal className="h-4 w-4 text-yellow-300" />
              SQL پیشنهادی
            </div>
            <button
              type="button"
              onClick={copySql}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200 hover:border-yellow-400 hover:text-yellow-200"
            >
              <Clipboard className="h-4 w-4" />
              {copied ? 'کپی شد' : 'کپی SQL'}
            </button>
          </div>
          <pre className="max-h-64 overflow-auto p-4 text-left text-xs leading-6 text-slate-200" dir="ltr">{check.sqlHint}</pre>
        </div>
      )}
    </div>
  );
}

function Diagnostics() {
  const [result, setResult] = useState<DiagnosticsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedBundle, setCopiedBundle] = useState(false);

  async function loadDiagnostics() {
    setLoading(true);
    setError(null);
    try {
      const diagnostics = await runDiagnostics();
      setResult(diagnostics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطای نامشخص هنگام اجرای تست سلامت');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const sqlBundle = useMemo(() => (result ? getDiagnosticsSqlBundle(result.checks) : ''), [result]);

  async function copySqlBundle() {
    if (!sqlBundle) return;
    await navigator.clipboard.writeText(sqlBundle);
    setCopiedBundle(true);
    window.setTimeout(() => setCopiedBundle(false), 1600);
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="overflow-hidden rounded-3xl border border-slate-700 bg-gradient-to-l from-slate-900 via-slate-900 to-slate-800 p-6 shadow-2xl shadow-black/20">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-xs font-bold text-yellow-200">
              <Database className="h-4 w-4" />
              Diagnostics / سلامت پروژه
            </div>
            <h1 className="text-2xl font-extrabold text-white md:text-3xl">تست سلامت Carrtell</h1>
            <p className="max-w-3xl text-sm leading-7 text-slate-300">
              این صفحه اتصال Supabase، جدول‌های اصلی و بخش‌های حساس پروژه را بررسی می‌کند تا سریع مشخص شود مشکل از دیتابیس است یا کد.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadDiagnostics}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-extrabold text-slate-950 shadow-lg shadow-yellow-500/20 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              اجرای تست سریع
            </button>
            {sqlBundle && (
              <button
                type="button"
                onClick={copySqlBundle}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-600 bg-slate-900 px-5 py-3 text-sm font-bold text-slate-100 transition hover:border-yellow-400 hover:text-yellow-200"
              >
                <Clipboard className="h-4 w-4" />
                {copiedBundle ? 'SQLها کپی شد' : 'کپی SQL خطاها'}
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-5 text-rose-100">
          <div className="flex items-center gap-2 font-extrabold">
            <ShieldAlert className="h-5 w-5" />
            خطا در اجرای تست
          </div>
          <p className="mt-2 text-sm leading-7">{error}</p>
        </div>
      )}

      {loading && !result ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-3xl border border-slate-700 bg-slate-900/70">
          <div className="flex items-center gap-3 text-slate-200">
            <Loader2 className="h-5 w-5 animate-spin text-yellow-300" />
            در حال اجرای تست سلامت...
          </div>
        </div>
      ) : result ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-3xl border border-slate-700 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">کل تست‌ها</p>
              <p className="mt-2 text-3xl font-black text-white">{result.summary.total.toLocaleString('fa-IR')}</p>
            </div>
            <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-5">
              <p className="text-sm text-emerald-200">سالم</p>
              <p className="mt-2 text-3xl font-black text-emerald-100">{result.summary.healthy.toLocaleString('fa-IR')}</p>
            </div>
            <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5">
              <p className="text-sm text-amber-200">نیاز به بررسی</p>
              <p className="mt-2 text-3xl font-black text-amber-100">{result.summary.warning.toLocaleString('fa-IR')}</p>
            </div>
            <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-5">
              <p className="text-sm text-rose-200">خطا</p>
              <p className="mt-2 text-3xl font-black text-rose-100">{result.summary.error.toLocaleString('fa-IR')}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-700 bg-slate-900/70 p-4 text-sm text-slate-300">
            آخرین بررسی: <span className="font-bold text-slate-100">{formatDate(result.checkedAt)}</span>
          </div>

          <div className="grid gap-5">
            {result.checks.map((check) => (
              <CheckCard key={check.key} check={check} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

export default Diagnostics;
