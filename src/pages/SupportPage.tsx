import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Clock3, MessageSquarePlus, Plus, RefreshCw, TicketCheck, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { addSupportMessage, createSupportTicket, getMySupportTickets, getSupportMessages, SupportMessage, SupportTicket } from '../services/supportApi';
import { supabase } from '../lib/supabase';

const categories = [
  ['order', 'سفارش'], ['payment', 'پرداخت'], ['service', 'سرویس در محل'], ['product', 'محصول'], ['warranty', 'گارانتی / مرجوعی'], ['general', 'عمومی'],
];

const statusText: Record<string, string> = { open: 'باز', reviewing: 'در حال بررسی', answered: 'پاسخ داده شده', closed: 'بسته شده' };
const statusClass: Record<string, string> = {
  open: 'border-sky-400/30 bg-sky-400/10 text-sky-200',
  reviewing: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
  answered: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  closed: 'border-slate-400/30 bg-slate-400/10 text-slate-300',
};

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'tickets' | 'new'>(() => typeof window !== 'undefined' && window.location.hash === '#contact' ? 'new' : 'tickets');
  const [form, setForm] = useState({ subject: '', category: 'order', customer_name: '', customer_phone: '', message: '' });
  const [reply, setReply] = useState('');
  const selectedTicketId = selected?.id;

  async function load() {
    setLoading(true);
    try {
      const { data: authResult } = await supabase.auth.getUser();
      setTickets(await getMySupportTickets(authResult.user?.id));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load().catch(console.error); }, []);
  useEffect(() => {
    if (!selectedTicketId) return setMessages([]);
    getSupportMessages(selectedTicketId).then(setMessages).catch(console.error);
  }, [selectedTicketId]);

  const openCount = useMemo(() => tickets.filter((ticket) => ticket.status !== 'closed').length, [tickets]);

  async function submitTicket(event: React.FormEvent) {
    event.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) return alert('موضوع و متن پیام الزامی است.');
    const ticket = await createSupportTicket(form);
    setForm({ subject: '', category: 'order', customer_name: '', customer_phone: '', message: '' });
    await load();
    setSelected(ticket);
    setActiveView('tickets');
  }

  async function submitReply() {
    if (!selected || !reply.trim()) return;
    await addSupportMessage(selected.id, reply, 'customer');
    setReply('');
    setMessages(await getSupportMessages(selected.id));
    await load();
  }

  return (
    <main className="ct-support-page min-h-screen bg-slate-950 px-4 pb-28 pt-24 text-white" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="rounded-3xl border border-white/10 bg-slate-900/90 p-5 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black text-amber-300">مرکز پشتیبانی Carrtell</p>
              <h1 className="mt-1 text-2xl font-black">تیکت‌های پشتیبانی</h1>
              <p className="mt-2 text-sm leading-7 text-slate-300">درخواست جدید ثبت کن یا وضعیت و پاسخ تیکت‌های قبلی را ببین.</p>
            </div>
            <Link to="/" className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black hover:border-amber-400/50" aria-label="خروج از صفحه پشتیبانی">
              <ArrowRight className="h-4 w-4" /> خروج
            </Link>
          </div>
        </header>

        <nav className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-slate-900 p-1.5" aria-label="بخش‌های پشتیبانی">
          <button type="button" onClick={() => setActiveView('tickets')} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-black ${activeView === 'tickets' ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:bg-white/5'}`}>
            <TicketCheck className="h-5 w-5" /> تیکت‌های من {openCount > 0 && <span className="rounded-full bg-slate-950 px-2 py-0.5 text-[10px] text-white">{openCount.toLocaleString('fa-IR')}</span>}
          </button>
          <button type="button" onClick={() => { setSelected(null); setActiveView('new'); }} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-black ${activeView === 'new' ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:bg-white/5'}`}>
            <Plus className="h-5 w-5" /> تیکت جدید
          </button>
        </nav>

        {activeView === 'new' ? (
          <section id="contact" className="scroll-mt-24 rounded-3xl border border-white/10 bg-slate-900/80 p-5">
            <div className="mb-5 flex items-center gap-2"><MessageSquarePlus className="text-amber-300" /><h2 className="text-lg font-black">ثبت تیکت جدید</h2></div>
            <form onSubmit={submitTicket} className="grid gap-3 md:grid-cols-2">
              <input className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400" placeholder="موضوع (اجباری)" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} />
              <select className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
              <input className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400" placeholder="نام" value={form.customer_name} onChange={(event) => setForm({ ...form, customer_name: event.target.value })} />
              <input className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400" placeholder="شماره تماس" value={form.customer_phone} onChange={(event) => setForm({ ...form, customer_phone: event.target.value })} />
              <textarea className="min-h-32 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400 md:col-span-2" placeholder="متن پیام (اجباری)" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} />
              <button className="w-full rounded-2xl bg-amber-400 px-4 py-3 font-black text-slate-950 hover:bg-amber-300 md:col-span-2">ثبت تیکت</button>
            </form>
          </section>
        ) : (
          <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-5" data-testid="support-ticket-history">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div><h2 className="font-black">وضعیت تیکت‌های قبلی</h2><p className="mt-1 text-xs text-slate-400">برای دیدن گفتگو روی هر تیکت بزن.</p></div>
              <button type="button" onClick={() => void load()} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10" aria-label="بروزرسانی تیکت‌ها"><RefreshCw className="h-4 w-4" /></button>
            </div>

            {loading ? <p className="rounded-2xl bg-white/5 p-4 text-slate-300">در حال بارگذاری...</p> : tickets.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950/60 p-6 text-center">
                <TicketCheck className="mx-auto h-9 w-9 text-slate-500" /><p className="mt-3 text-slate-300">هنوز تیکتی ثبت نکرده‌ای.</p>
                <button type="button" onClick={() => setActiveView('new')} className="mt-4 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-black text-slate-950">ثبت اولین تیکت</button>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {tickets.map((ticket) => (
                  <button key={ticket.id} onClick={() => setSelected(ticket)} className={`rounded-2xl border p-4 text-right transition ${selected?.id === ticket.id ? 'border-amber-400 bg-amber-400/10' : 'border-white/10 bg-slate-950 hover:border-amber-400/40'}`}>
                    <div className="flex items-start justify-between gap-2"><b>{ticket.subject}</b><span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-black ${statusClass[ticket.status] || statusClass.open}`}>{statusText[ticket.status] || ticket.status}</span></div>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">{ticket.last_message}</p>
                    <div className="mt-3 flex items-center gap-1 text-[10px] text-slate-500"><Clock3 className="h-3.5 w-3.5" />{ticket.updated_at || ticket.created_at ? new Date(ticket.updated_at || ticket.created_at || '').toLocaleString('fa-IR') : 'بدون تاریخ'}</div>
                  </button>
                ))}
              </div>
            )}

            {selected && (
              <div className="mt-5 rounded-3xl border border-white/10 bg-slate-950 p-4">
                <div className="flex items-center justify-between gap-3"><div><h3 className="font-black">{selected.subject}</h3><span className="mt-1 block text-xs text-slate-400">وضعیت: {statusText[selected.status] || selected.status}</span></div><button type="button" onClick={() => setSelected(null)} className="grid h-9 w-9 place-items-center rounded-xl border border-white/10" aria-label="بستن گفتگوی تیکت"><X className="h-4 w-4" /></button></div>
                <div className="mt-4 max-h-80 space-y-3 overflow-y-auto">{messages.map((message) => <div key={message.id} className={`rounded-2xl p-3 ${message.sender_role === 'admin' ? 'border border-amber-400/20 bg-amber-400/15' : 'bg-white/5'}`}><div className="text-xs text-slate-400">{message.sender_role === 'admin' ? 'پشتیبانی' : 'شما'}</div><div className="mt-1 text-sm leading-7">{message.body}</div></div>)}</div>
                {selected.status !== 'closed' && <div className="mt-4 flex gap-2"><input className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-amber-400" value={reply} onChange={(event) => setReply(event.target.value)} placeholder="پاسخ شما" /><button type="button" onClick={submitReply} className="rounded-2xl bg-amber-400 px-5 font-black text-slate-950">ارسال</button></div>}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
