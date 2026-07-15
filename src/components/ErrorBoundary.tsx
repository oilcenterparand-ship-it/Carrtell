import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Home, RotateCcw, Copy, AlertTriangle } from 'lucide-react';

type Props = {
  children: ReactNode;
  title?: string;
};

type State = {
  hasError: boolean;
  errorMessage: string;
  errorStack: string;
};

export default class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    errorMessage: '',
    errorStack: '',
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      errorMessage: error?.message || 'خطای نامشخص در اجرای سایت',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const stack = `${error?.stack || error?.message || ''}\n\n${info.componentStack || ''}`.trim();
    this.setState({ errorStack: stack });
    console.error('[Carrtell ErrorBoundary]', error, info);
  }

  private copyError = async () => {
    const text = this.state.errorStack || this.state.errorMessage || 'Carrtell error';
    try {
      await navigator.clipboard.writeText(text);
      alert('متن خطا کپی شد.');
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('متن خطا کپی شد.');
    }
  };

  private reload = () => window.location.reload();
  private goHome = () => { window.location.href = '/'; };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main dir="rtl" className="min-h-screen bg-[var(--page-bg,#020617)] px-4 py-16 text-[var(--text-primary,#fff)]">
        <section className="mx-auto max-w-2xl overflow-hidden rounded-[2rem] border border-red-400/20 bg-slate-950/95 shadow-2xl shadow-black/40">
          <div className="border-b border-white/10 bg-gradient-to-l from-red-500/20 via-amber-400/10 to-transparent p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-red-300/20 bg-red-500/15 text-red-200">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-200">Carrtell System Guard</p>
                <h1 className="text-2xl font-black">{this.props.title || 'یک خطا در سایت رخ داد'}</h1>
              </div>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              صفحه سفید نمی‌شود؛ خطا توسط سیستم محافظ کارتل گرفته شد. متن خطا را کپی کن تا در پچ بعدی دقیق اصلاح شود.
            </p>
          </div>

          <div className="space-y-4 p-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="mb-2 text-sm font-bold text-slate-200">متن خطا</p>
              <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-black/40 p-4 text-left text-xs leading-6 text-red-100" dir="ltr">
                {this.state.errorMessage || 'Unknown error'}
              </pre>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <button onClick={this.reload} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-3 font-black text-slate-950 transition hover:bg-amber-300">
                <RotateCcw className="h-4 w-4" /> تلاش مجدد
              </button>
              <button onClick={this.goHome} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 font-bold text-white transition hover:bg-white/15">
                <Home className="h-4 w-4" /> صفحه اصلی
              </button>
              <button onClick={this.copyError} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 font-bold text-white transition hover:bg-white/15">
                <Copy className="h-4 w-4" /> کپی خطا
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }
}
