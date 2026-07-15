import { CheckCircle2, Circle, Clock } from 'lucide-react';

const steps = [
  { key: 'pending_review', label: 'ثبت سفارش' },
  { key: 'paid', label: 'پرداخت' },
  { key: 'dispatch_pending', label: 'مرکز اعزام' },
  { key: 'assigned', label: 'اختصاص سرویس‌کار' },
  { key: 'on_way', label: 'در مسیر' },
  { key: 'working', label: 'در حال انجام' },
  { key: 'completed', label: 'تکمیل شده' },
];

export default function OrderTimeline({ status = 'pending_review', events = [] }: { status?: string; events?: any[] }) {
  const currentIndex = Math.max(0, steps.findIndex((s) => s.key === status));

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 text-white">
      <div className="mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5 text-yellow-400" />
        <h3 className="font-bold">وضعیت سفارش</h3>
      </div>
      <div className="grid gap-3 md:grid-cols-7">
        {steps.map((step, index) => {
          const done = index <= currentIndex;
          return (
            <div key={step.key} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-3">
              {done ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <Circle className="h-5 w-5 text-slate-500" />}
              <span className={done ? 'text-sm text-white' : 'text-sm text-slate-400'}>{step.label}</span>
            </div>
          );
        })}
      </div>
      {events.length > 0 && (
        <div className="mt-5 space-y-2 border-t border-white/10 pt-4">
          {events.map((event) => (
            <div key={event.id ?? `${event.status}-${event.created_at}`} className="text-sm text-slate-300">
              <span className="font-bold text-white">{event.title ?? event.status}</span>
              {event.description ? <span className="text-slate-400"> — {event.description}</span> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
