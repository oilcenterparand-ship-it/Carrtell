import React, { useEffect, useMemo, useState } from 'react';
import { addCustomerNote, exportCustomersCsv, getCrmCustomers, getCustomerNotes, getCustomerTags } from '../services/crmApi';

export default function CustomersCRM() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [note, setNote] = useState('');

  useEffect(() => {
    getCrmCustomers().then(setCustomers);
    getCustomerTags().then(setTags);
  }, []);

  useEffect(() => {
    if (selected?.id) getCustomerNotes(selected.id).then(setNotes);
  }, [selected?.id]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter((c) => `${c.full_name ?? ''} ${c.phone ?? ''} ${c.role ?? ''}`.toLowerCase().includes(term));
  }, [customers, q]);

  async function submitNote() {
    if (!selected?.id || !note.trim()) return;
    await addCustomerNote(selected.id, note.trim());
    setNote('');
    setNotes(await getCustomerNotes(selected.id));
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black">CRM مشتریان کارتل</h1>
            <p className="text-sm text-slate-300 mt-2">مدیریت مشتری‌ها، یادداشت داخلی، برچسب‌ها و خروجی کمپین</p>
          </div>
          <button onClick={() => exportCustomersCsv(filtered)} className="rounded-2xl bg-amber-500 text-slate-950 px-5 py-3 font-bold">خروجی CSV</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4"><div className="text-slate-400 text-sm">کل مشتری‌ها</div><div className="text-3xl font-black mt-2">{customers.length}</div></div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4"><div className="text-slate-400 text-sm">نتایج فیلتر</div><div className="text-3xl font-black mt-2">{filtered.length}</div></div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4"><div className="text-slate-400 text-sm">برچسب‌ها</div><div className="text-3xl font-black mt-2">{tags.length}</div></div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4"><div className="text-slate-400 text-sm">آماده کمپین</div><div className="text-3xl font-black mt-2">SMS</div></div>
        </div>

        <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="جستجوی نام، شماره، نقش..." className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 outline-none focus:border-amber-400" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/10 font-bold">لیست مشتری‌ها</div>
            <div className="divide-y divide-white/10">
              {filtered.map((c) => (
                <button key={c.id} onClick={()=>setSelected(c)} className="w-full text-right p-4 hover:bg-white/10 transition flex justify-between gap-4">
                  <div>
                    <div className="font-bold">{c.full_name || 'بدون نام'}</div>
                    <div className="text-sm text-slate-400">{c.phone || 'بدون شماره'} · {c.role || 'customer'}</div>
                  </div>
                  <span className="text-xs rounded-full bg-amber-500/10 text-amber-300 px-3 py-1 h-fit">مشاهده</span>
                </button>
              ))}
              {!filtered.length && <div className="p-6 text-slate-400">مشتری پیدا نشد.</div>}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 space-y-4">
            <h2 className="font-black text-xl">جزئیات مشتری</h2>
            {!selected ? <p className="text-slate-400">یک مشتری را انتخاب کن.</p> : <>
              <div className="rounded-2xl bg-slate-900 border border-white/10 p-4">
                <div className="font-bold">{selected.full_name || 'بدون نام'}</div>
                <div className="text-sm text-slate-400 mt-1">{selected.phone || 'بدون شماره'}</div>
                <div className="text-xs text-slate-500 mt-2">شناسه: {selected.id}</div>
              </div>
              <div>
                <div className="font-bold mb-2">یادداشت داخلی</div>
                <textarea value={note} onChange={(e)=>setNote(e.target.value)} className="w-full min-h-24 rounded-2xl bg-slate-900 border border-white/10 p-3 outline-none focus:border-amber-400" placeholder="مثلاً مشتری فقط روغن برند خاص می‌خواهد..." />
                <button onClick={submitNote} className="mt-2 w-full rounded-2xl bg-amber-500 text-slate-950 px-4 py-3 font-bold">ثبت یادداشت</button>
              </div>
              <div className="space-y-2">
                {notes.map((n) => <div key={n.id} className="rounded-2xl bg-slate-900 border border-white/10 p-3 text-sm">{n.note}<div className="text-xs text-slate-500 mt-2">{n.created_at ? new Date(n.created_at).toLocaleString('fa-IR') : ''}</div></div>)}
              </div>
            </>}
          </div>
        </div>
      </div>
    </div>
  );
}
