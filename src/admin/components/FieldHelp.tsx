import { HelpCircle } from 'lucide-react';

export default function FieldHelp({ title, children }: { title: string; children: string }) {
  return (
    <div className="mb-2">
      <div className="flex items-center gap-1.5 text-xs font-black text-slate-200"><span>{title}</span><HelpCircle className="h-3.5 w-3.5 text-amber-300" /></div>
      <p className="mt-1 text-[11px] leading-5 text-slate-500">{children}</p>
    </div>
  );
}
