import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PointsEvent } from '@/hooks/usePointsHistory';

const EVENT_BADGE: Record<string, { label: string; class: string }> = {
  indicado: { label: 'Nova indicação', class: 'bg-info text-info-foreground' },
  qualificado: { label: 'Qualificou', class: 'bg-warning text-warning-foreground' },
  inscrito: { label: 'Inscreveu', class: 'bg-success text-success-foreground' },
  nao_convertido: { label: 'Não convertido', class: 'bg-destructive/80 text-destructive-foreground' },
  nao_qualificado: { label: 'Não qualificado', class: 'bg-destructive text-destructive-foreground' },
};

function getEventLabel(e: PointsEvent) {
  if (e.new_status === 'indicado' && !e.old_status) return EVENT_BADGE.indicado;
  return EVENT_BADGE[e.new_status] ?? { label: e.new_status, class: 'bg-muted text-muted-foreground' };
}

interface Props {
  events: PointsEvent[];
  maxItems?: number;
  showReferralName?: boolean;
}

export function PointsTimeline({ events, maxItems, showReferralName = true }: Props) {
  const items = maxItems ? events.slice(0, maxItems) : events;

  if (items.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-card p-6 text-center">
        <p className="text-sm text-muted-foreground">Nenhuma atividade neste período.</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Atividades do Período</h2>
      </div>
      <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
        {items.map((e) => {
          const badge = getEventLabel(e);
          return (
            <div key={e.id} className="px-5 py-3 flex items-center gap-3">
              <div className="text-xs text-muted-foreground w-[70px] shrink-0">
                {format(new Date(e.changed_at), 'dd/MM/yy', { locale: ptBR })}
              </div>
              {showReferralName && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{e.referred_name}</p>
                </div>
              )}
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.class}`}>
                {badge.label}
              </span>
              <span className={`text-sm font-bold shrink-0 ${e.pontos_gerados > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                {e.pontos_gerados > 0 ? `+${e.pontos_gerados}` : '0'} pts
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
