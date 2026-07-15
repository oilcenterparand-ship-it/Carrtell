import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminNavItems } from '../components/AdminTopBar';

export default function AdminQuickLinks() {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return adminNavItems.filter((item) => !q || [item.label, item.path, item.group].join(' ').toLowerCase().includes(q));
  }, [query]);
  const groups = Array.from(new Set(filtered.map((i) => i.group)));

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-slate-100 md:p-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
          <h1 className="text-2xl font-black">مرکز مسیرهای پنل مدیریت Carrtell</h1>
          <p className="mt-2 text-sm text-slate-400">همه مسیرهای ساخته‌شده پروژه در این صفحه دسته‌بندی شده‌اند.</p>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جستجو بین صفحات..." className="mt-4 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400" />
        </div>
        {groups.map((group) => (
          <section key={group} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="mb-4 text-lg font-bold text-amber-300">{group}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.filter((i) => i.group === group).map((item) => (
                <Link key={item.path} to={item.path} className="rounded-2xl border border-slate-800 bg-slate-950 p-4 transition hover:-translate-y-0.5 hover:border-amber-400 hover:bg-slate-900">
                  <div className="text-lg font-bold">{item.icon} {item.label}</div>
                  <div className="mt-2 text-xs text-slate-500 ltr:font-mono">{item.path}</div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
