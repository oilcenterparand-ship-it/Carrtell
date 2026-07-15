import { useEffect, useState } from 'react';
import { getAllSupportTickets } from '../services/supportAdminApi';
import { addSupportMessage, getSupportMessages, updateSupportTicketStatus, SupportMessage, SupportTicket } from '../../services/supportApi';

const statuses = [['all','همه'],['open','باز'],['reviewing','در حال بررسی'],['answered','پاسخ داده شده'],['closed','بسته شده']];

export default function AdminSupport() {
  const [status, setStatus] = useState('all');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [reply, setReply] = useState('');

  async function load() { setTickets(await getAllSupportTickets(status)); }
  useEffect(()=>{ load().catch(console.error); }, [status]);
  useEffect(()=>{ if(selected) getSupportMessages(selected.id).then(setMessages).catch(console.error); }, [selected?.id]);

  async function changeStatus(next: string) {
    if (!selected) return;
    const t = await updateSupportTicketStatus(selected.id, next);
    setSelected(t);
    await load();
  }

  async function sendReply() {
    if (!selected || !reply.trim()) return;
    await addSupportMessage(selected.id, reply, 'admin');
    setReply('');
    setMessages(await getSupportMessages(selected.id));
    await load();
  }

  return <main className="min-h-screen bg-slate-950 p-6 text-white" dir="rtl">
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"><h1 className="text-2xl font-black">مدیریت پشتیبانی</h1><p className="mt-2 text-sm text-slate-400">مشاهده، پاسخ و تغییر وضعیت تیکت‌های مشتریان</p></div>
      <div className="flex flex-wrap gap-2">{statuses.map(([v,l])=><button key={v} onClick={()=>setStatus(v)} className={`rounded-2xl px-4 py-2 ${status===v?'bg-amber-400 text-slate-950':'bg-white/10'}`}>{l}</button>)}</div>
      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"><div className="space-y-3">{tickets.map(t=><button key={t.id} onClick={()=>setSelected(t)} className="w-full rounded-2xl border border-white/10 bg-slate-900 p-4 text-right hover:border-amber-400/50"><div className="flex items-center justify-between gap-3"><b>{t.subject}</b><span className="rounded-full bg-white/10 px-3 py-1 text-xs">{t.status}</span></div><div className="mt-2 text-xs text-slate-400">{t.customer_name || 'بدون نام'} - {t.customer_phone || 'بدون شماره'}</div><p className="mt-2 line-clamp-2 text-sm text-slate-300">{t.last_message}</p></button>)}</div></section>
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">{!selected ? <p className="text-slate-400">یک تیکت را انتخاب کن.</p> : <><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-black">{selected.subject}</h2><select className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-2 text-white" value={selected.status} onChange={e=>changeStatus(e.target.value)}>{statuses.filter(s=>s[0] !== 'all').map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div><div className="mt-4 space-y-3">{messages.map(m=><div key={m.id} className={`rounded-2xl p-3 ${m.sender_role==='admin'?'bg-amber-400/15':'bg-slate-900'}`}><div className="text-xs text-slate-400">{m.sender_role==='admin'?'پشتیبانی':'مشتری'}</div><div className="mt-1 text-sm">{m.body}</div></div>)}</div><div className="mt-5 flex gap-2"><input value={reply} onChange={e=>setReply(e.target.value)} className="flex-1 rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white" placeholder="پاسخ پشتیبانی"/><button onClick={sendReply} className="rounded-2xl bg-amber-400 px-6 font-black text-slate-950">ارسال پاسخ</button></div></>}</section>
      </div>
    </div>
  </main>;
}
