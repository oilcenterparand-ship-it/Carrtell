import { useEffect, useMemo, useState } from 'react';
import { Download, Smartphone } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

type Props = {
  label: string;
  manifestHref: string;
  className?: string;
  fallbackHref?: string;
};

function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function setManifest(href: string) {
  let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'manifest';
    document.head.appendChild(link);
  }
  if (link.getAttribute('href') !== href) link.setAttribute('href', href);
}

export default function PwaInstallButton({ label, manifestHref, className = '', fallbackHref }: Props) {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [message, setMessage] = useState('');
  const ios = useMemo(() => /iphone|ipad|ipod/i.test(navigator.userAgent), []);

  useEffect(() => {
    setManifest(manifestHref);
    setInstalled(isStandalone());
    const onInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
      setMessage('وب‌اپ Carrtell نصب شد.');
    };
    window.addEventListener('beforeinstallprompt', onInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [manifestHref]);

  async function install() {
    setManifest(manifestHref);
    if (installed) {
      setMessage('این وب‌اپ روی دستگاه نصب است.');
      return;
    }
    if (installEvent) {
      await installEvent.prompt();
      const result = await installEvent.userChoice;
      if (result.outcome === 'accepted') setMessage('در حال نصب وب‌اپ…');
      else setMessage('نصب لغو شد. هر زمان خواستی دوباره امتحان کن.');
      setInstallEvent(null);
      return;
    }
    if (fallbackHref) {
      window.location.assign(fallbackHref);
      return;
    }
    setMessage(ios
      ? 'در Safari دکمه Share را بزن و Add to Home Screen را انتخاب کن.'
      : 'از منوی مرورگر گزینه Install app / Add to Home screen را انتخاب کن.');
  }

  return <div>
    <button type="button" onClick={() => void install()} className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 font-black transition active:scale-[.99] ${className}`}>
      {installed ? <Smartphone className="h-5 w-5" /> : <Download className="h-5 w-5" />}
      {installed ? 'نصب شده' : label}
    </button>
    {message && <p className="mt-2 text-center text-xs leading-6 text-slate-400">{message}</p>}
  </div>;
}
