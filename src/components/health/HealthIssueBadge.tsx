import React from 'react';
import { Link } from 'react-router-dom';

export default function HealthIssueBadge({ count = 0 }: { count?: number }) {
  if (!count) return null;
  return (
    <Link
      to="/admin/system-health"
      className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-200 hover:bg-red-500/20"
    >
      ⚠️ {count} هشدار سیستم
    </Link>
  );
}
