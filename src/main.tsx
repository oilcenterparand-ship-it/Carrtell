import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './auth/AuthProvider';
import { AdminAuthProvider } from './admin/auth/AdminAuthProvider';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import './styles/advanced-theme-studio.css';
import './styles/mobile-rc106a.css';
import { initializeCarrtellAppearance } from './lib/appearanceThemes';

initializeCarrtellAppearance();

function upsertMeta(name: string, content: string) {
  let meta = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = name;
    document.head.appendChild(meta);
  }
  meta.content = content;
}

function upsertAppleTouchIcon(href: string) {
  let link = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'apple-touch-icon';
    document.head.appendChild(link);
  }
  link.href = href;
}

function selectCarrtellManifest() {
  if (typeof document === 'undefined') return;
  const driverMode = window.location.pathname.startsWith('/driver');
  let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'manifest';
    document.head.appendChild(link);
  }

  upsertMeta('mobile-web-app-capable', 'yes');
  upsertMeta('apple-mobile-web-app-capable', 'yes');
  upsertMeta('apple-mobile-web-app-status-bar-style', 'black-translucent');

  if (driverMode) {
    link.setAttribute('href', '/driver.webmanifest');
    document.title = 'Carrtell Driver';
    upsertMeta('apple-mobile-web-app-title', 'Carrtell Driver');
    upsertAppleTouchIcon('/brand/driver-192.png');
    return;
  }

  link.setAttribute('href', '/manifest.webmanifest');
  upsertMeta('apple-mobile-web-app-title', 'Carrtell');
  upsertAppleTouchIcon('/brand/app-192.png');
}


selectCarrtellManifest();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('Carrtell service worker registration failed:', error);
    });
  });
}


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary title="خطای اجرای Carrtell">
      <AuthProvider>
        <AdminAuthProvider>
          <App />
        </AdminAuthProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>
);
