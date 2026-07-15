import type { LoyaltyTier } from '../../services/loyaltyApi';

const labels: Record<LoyaltyTier, string> = {
  bronze: 'برنزی',
  silver: 'نقره‌ای',
  gold: 'طلایی',
  vip: 'VIP',
};

export default function LoyaltyBadge({ tier }: { tier?: LoyaltyTier | null }) {
  const value = tier || 'bronze';
  return (
    <span className="inline-flex items-center rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-200">
      سطح {labels[value]}
    </span>
  );
}
