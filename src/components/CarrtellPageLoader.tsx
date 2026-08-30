import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function CarrtellPageLoader() {
  const location = useLocation();
  const firstRender = useRef(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 520);
    return () => window.clearTimeout(timer);
  }, [location.pathname, location.search]);

  if (!visible) return null;

  return (
    <div className="ct-carrtell-page-loader" role="status" aria-live="polite" aria-label="در حال آماده‌سازی صفحه">
      <div className="ct-carrtell-loader-mark">
        <span className="ct-carrtell-loader-ring" aria-hidden="true" />
        <span className="ct-carrtell-loader-logo-wrap">
          <img src="/brand/logo.png" alt="Carrtell" />
        </span>
      </div>
      <strong>کارتل در حال آماده‌سازی صفحه است</strong>
      <small>چند لحظه همراه ما بمانید...</small>
    </div>
  );
}
