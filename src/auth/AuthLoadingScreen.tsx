import { Loader2, ShieldCheck } from 'lucide-react';

export default function AuthLoadingScreen() {
  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-white">
      <section className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-slate-900/95 p-8 text-center shadow-2xl shadow-black/40">
        <ShieldCheck className="mx-auto h-10 w-10 text-amber-400" />
        <Loader2 className="mx-auto mt-5 h-7 w-7 animate-spin text-slate-300" />
        <p className="mt-4 text-sm text-slate-300">در حال بررسی ورود و سطح دسترسی...</p>
      </section>
    </main>
  );
}
