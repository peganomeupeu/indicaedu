import { Clock } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { ReferralStatus } from '@/types/referral';

interface PendingReferral {
  id: string;
  referred_name: string;
  status: string;
  course: string;
}

interface Props {
  referrals: PendingReferral[];
}

export function PendingReferralsCard({ referrals }: Props) {
  if (referrals.length === 0) return null;

  return (
    <div className="bg-card rounded-xl border border-border shadow-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-warning" />
        <h2 className="text-sm font-semibold text-foreground">Indicações em Andamento</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Você tem <strong className="text-foreground">{referrals.length}</strong> indicação(ões) de meses anteriores que ainda podem gerar pontos.
      </p>
      <div className="space-y-2 max-h-[200px] overflow-y-auto">
        {referrals.map((r) => (
          <div key={r.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{r.referred_name}</p>
              <p className="text-xs text-muted-foreground truncate">{r.course}</p>
            </div>
            <StatusBadge status={r.status as ReferralStatus} />
          </div>
        ))}
      </div>
    </div>
  );
}
