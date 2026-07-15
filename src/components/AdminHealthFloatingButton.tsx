import React from 'react';

export default function AdminHealthFloatingButton() {
  const path = typeof window !== 'undefined' ? window.location.pathname : '';

  if (!path.startsWith('/admin')) return null;

  return (
    <a
      href="/admin/navigation-audit"
      title="تست سلامت مسیرها"
      className="fixed bottom-5 left-5 z-[9999] flex items-center gap-2 rounded-2xl border border-amber-400/40 bg-slate-950/95 px-4 py-3 text-sm font-bold text-amber-200 shadow-2xl shadow-black/30 backdrop-blur transition hover:-translate-y-0.5 hover:bg-slate-900 hover:text-amber-100"
      style={{ direction: 'rtl' }}
    >
      <span className="text-lg">🛠</span>
      <span>تست سلامت مسیرها</span>
    </a>
  );
}
