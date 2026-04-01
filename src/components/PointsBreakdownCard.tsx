import { Target } from 'lucide-react';
import { PointsBreakdown } from '@/hooks/usePointsHistory';
import { POINTS_CONFIG } from '@/types/referral';

const EVENT_STYLES = [
  { key: 'indicado' as const, label: 'Novas indicações', color: 'bg-info', dotColor: 'bg-info' },
  { key: 'qualificado' as const, label: 'Qualificações', color: 'bg-warning', dotColor: 'bg-warning' },
  { key: 'inscrito' as const, label: 'Inscrições', color: 'bg-success', dotColor: 'bg-success' },
];

interface Props {
  breakdown: PointsBreakdown;
  monthLabel?: string;
}

export function PointsBreakdownCard({ breakdown, monthLabel }: Props) {
  const maxPoints = Math.max(breakdown.indicado.points, breakdown.qualificado.points, breakdown.inscrito.points, 1);

  return (
    <div className="bg-card rounded-xl border border-border shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground">
          {monthLabel ? `Pontuação — ${monthLabel}` : 'Pontuação do Período'}
        </h2>
        <div className="flex items-center gap-1.5">
          <Target className="w-4 h-4 text-primary" />
          <span className="text-2xl font-extrabold text-primary">{breakdown.total}</span>
          <span className="text-xs text-muted-foreground">pts</span>
        </div>
      </div>

      <div className="space-y-3">
        {EVENT_STYLES.map(({ key, label, dotColor }) => {
          const item = breakdown[key];
          const ptsPerEvent = POINTS_CONFIG[key] ?? 0;
          const barWidth = maxPoints > 0 ? (item.points / maxPoints) * 100 : 0;

          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                  <span className="text-sm text-foreground">{label}</span>
                </div>
                <span className="text-sm font-bold text-foreground">{item.points} pts</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${dotColor} rounded-full transition-all duration-500`} style={{ width: `${barWidth}%` }} />
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {item.count} × {ptsPerEvent} pts
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
