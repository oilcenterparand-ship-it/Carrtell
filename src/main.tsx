import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './auth/AuthProvider';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import './styles/advanced-theme-studio.css';
import { initializeCarrtellAppearance } from './lib/appearanceThemes';

initializeCarrtellAppearance();

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
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>
);
