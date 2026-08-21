import { Headphones } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function WhatsAppButton() {
  return (
    <Link
      to="/profile/support"
      className="ct-support-button fixed bottom-[calc(6.4rem+env(safe-area-inset-bottom))] left-3 z-40 grid h-12 w-12 place-items-center rounded-full border border-amber-300/40 bg-slate-950/95 text-amber-300 shadow-xl shadow-black/30 backdrop-blur transition hover:scale-105 hover:bg-slate-900 md:bottom-6 md:left-6 md:h-14 md:w-14"
      aria-label="پشتیبانی"
      title="پشتیبانی Carrtell"
    >
      <Headphones className="h-6 w-6 md:h-7 md:w-7" aria-hidden="true" />
    </Link>
  );
}
