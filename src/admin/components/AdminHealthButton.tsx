import { useLocation } from 'react-router-dom';

export default function AdminHealthButton() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  if (!isAdmin) return null;

  return (
    <a
      href="/admin/navigation-audit"
      title="تست سلامت مسیرها"
      style={{
        position: 'fixed',
        left: 16,
        bottom: 16,
        zIndex: 999999,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 14px',
        borderRadius: 999,
        background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
        color: '#fff',
        fontSize: 13,
        fontWeight: 800,
        textDecoration: 'none',
        boxShadow: '0 12px 32px rgba(0,0,0,.35)',
        border: '1px solid rgba(255,255,255,.25)',
      }}
    >
      <span>🛠</span>
      <span>تست سلامت مسیرها</span>
    </a>
  );
}
