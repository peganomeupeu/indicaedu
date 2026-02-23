import { ReferralStatus, STATUS_LABELS, STATUS_COLORS } from '@/types/referral';

export function StatusBadge({ status }: { status: ReferralStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
