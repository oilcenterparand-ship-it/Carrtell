import { useEffect, useMemo, useState } from 'react';
import { addSupportMessage, createSupportTicket, getMySupportTickets, getSupportMessages, SupportMessage, SupportTicket } from '../services/supportApi';
import { supabase } from '../lib/supabase';

const categories = [
  ['order', 'سفارش'], ['payment', 'پرداخت'], ['service', 'سرویس در محل'], ['product', 'محصول'], ['warranty', 'گارانتی / مرجوعی'], ['general', 'عمومی']
];

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ subject: '', category: 'order', customer_name: '', customer_phone: '', message: '' });
  const [reply, setReply] = useState('');

  async function load() {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    const rows = await getMySupportTickets(u.user?.id);
    setTickets(rows);
    setLoading(false);
  }

  useEffect(() => { load().catch(console.error); }, []);
  useEffect(() => {
    if (!selected) return setMessages([]);
    getSupportMessages(selected.id).then(setMessages).catch(console.error);
  }, [selected?.id]);

  const statusText = useMemo(() => ({ open: 'باز', reviewing: 'در حال بررسی', answered: 'پاسخ داده شده', closed: 'بسته شده' } as Record<string,string>), []);

  async function submitTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) return alert('موضوع و متن پیام الزامی است.');
    const t = await createSupportTicket(form);
    setForm({ subject: '', category: 'order', customer_name: '', customer_phone: '', message: '' });
    await load();
    setSelected(t);
  }

  async function submitReply() {
    if (!selected || !reply.trim()) return;
    await addSupportMessage(selected.id, reply, 'customer');
    setReply('');
    setMessages(await getSupportMessages(selected.id));
    await load();
  }

  return <main className="min-h-screen bg-slate-950 text-white pt-28 px-4 pb-16" dir="rtl">
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
        <h1 className="text-2xl font-black">پشتیبانی Carrtell</h1>
        <p className="mt-2 text-sm text-slate-300">درخواست پشتیبانی سفارش، پرداخت، سرویس در محل یا محصول را ثبت و پیگیری کن.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <h2 className="mb-4 font-bold">ثبت تیکت جدید</h2>
          <form onSubmit={submitTicket} className="space-y-3">
            <input className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white" placeholder="موضوع" value={form.subject} onChange={e=>setForm({...form, subject:e.target.value})}/>
            <select className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white" value={form.category} onChange={e=>setForm({...form, category:e.target.value})}>{categories.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>
            <input className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white" placeholder="نام" value={form.customer_name} onChange={e=>setForm({...form, customer_name:e.target.value})}/>
            <input className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white" placeholder="شماره تماس" value={form.customer_phone} onChange={e=>setForm({...form, customer_phone:e.target.value})}/>
            <textarea className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white" placeholder="متن پیام" value={form.message} onChange={e=>setForm({...form, message:e.target.value})}/>
            <button className="w-full rounded-2xl bg-amber-400 px-4 py-3 font-black text-slate-950 hover:bg-amber-300">ثبت تیکت</button>
          </form>
        </section>
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <h2 className="mb-4 font-bold">تیکت‌های من</h2>
          {loading ? <p>در حال بارگذاری...</p> : tickets.length === 0 ? <p className="text-slate-400">هنوز تیکتی ثبت نکرده‌ای.</p> : <div className="grid gap-3 md:grid-cols-2">{tickets.map(t=><button key={t.id} onClick={()=>setSelected(t)} className="rounded-2xl border border-white/10 bg-slate-900 p-4 text-right hover:border-amber-400/60"><div className="font-bold">{t.subject}</div><div className="mt-2 text-xs text-slate-400">{statusText[t.status] ?? t.status}</div><p className="mt-2 line-clamp-2 text-sm text-slate-300">{t.last_message}</p></button>)}</div>}
          {selected && <div className="mt-6 rounded-3xl border border-white/10 bg-slate-900 p-4"><h3 className="font-black">{selected.subject}</h3><div className="mt-4 space-y-3">{messages.map(m=><div key={m.id} className={`rounded-2xl p-3 ${m.sender_role==='admin'?'bg-amber-400/15 border border-amber-400/20':'bg-white/5'}`}><div className="text-xs text-slate-400">{m.sender_role === 'admin' ? 'پشتیبانی' : 'شما'}</div><div className="mt-1 text-sm">{m.body}</div></div>)}</div><div className="mt-4 flex gap-2"><input className="flex-1 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white" value={reply} onChange={e=>setReply(e.target.value)} placeholder="پاسخ شما"/><button onClick={submitReply} className="rounded-2xl bg-amber-400 px-5 font-black text-slate-950">ارسال</button></div></div>}
        </section>
      </div>
    </div>
  </main>;
}
