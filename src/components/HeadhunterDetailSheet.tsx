import { useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/StatusBadge';
import { useHeadhunterReferrals } from '@/hooks/useReferrals';
import { useHeadhunterPointsHistory, computeBreakdown } from '@/hooks/usePointsHistory';
import { ReferralStatus, POINTS_CONFIG } from '@/types/referral';
import { PointsBreakdownCard } from '@/components/PointsBreakdownCard';
import { PointsTimeline } from '@/components/PointsTimeline';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Users, UserCheck, GraduationCap, TrendingUp, Target } from 'lucide-react';

const STATUS_SORT_ORDER: Record<string, number> = {
  inscrito: 0,
  qualificado: 1,
  indicado: 2,
  nao_qualificado: 3,
  nao_convertido: 4,
};

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

interface HeadhunterDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month?: number;
  year?: number;
  user: {
    headhunter_id?: string;
    name: string;
    referrals: number;
    enrolled: number;
    qualified: number;
    points: number;
    avatar_url: string | null;
    rank: number;
  } | null;
}

export function HeadhunterDetailSheet({ open, onOpenChange, user, month, year }: HeadhunterDetailSheetProps) {
  const { data: referralsList = [], isLoading } = useHeadhunterReferrals(user?.name ?? null);
  const { data: pointsEvents = [] } = useHeadhunterPointsHistory(user?.headhunter_id ?? null, month, year);

  const breakdown = useMemo(() => computeBreakdown(pointsEvents), [pointsEvents]);

  const monthLabel = month && year ? `${MONTHS[month - 1]} ${year}` : undefined;

  const sortedReferrals = useMemo(() => {
    return [...referralsList].sort((a, b) => {
      const dateCompare = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (dateCompare !== 0) return dateCompare;
      const aOrder = STATUS_SORT_ORDER[a.status] ?? 99;
      const bOrder = STATUS_SORT_ORDER[b.status] ?? 99;
      return aOrder - bOrder;
    });
  }, [referralsList]);

  if (!user) return null;

  const initials = user.name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() ?? '?';
  const convRate = user.referrals > 0 ? Math.round((user.enrolled / user.referrals) * 100) : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-14 h-14 ring-2 ring-primary/20">
              {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.name} />}
              <AvatarFallback className="text-lg font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-lg">{user.name}</SheetTitle>
              <p className="text-sm text-muted-foreground">#{user.rank} no ranking</p>
            </div>
          </div>
        </SheetHeader>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <Users className="w-4 h-4 mx-auto text-info mb-1" />
            <p className="text-xl font-bold text-foreground">{user.referrals}</p>
            <p className="text-xs text-muted-foreground">Indicações</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <UserCheck className="w-4 h-4 mx-auto text-warning mb-1" />
            <p className="text-xl font-bold text-foreground">{user.qualified}</p>
            <p className="text-xs text-muted-foreground">Qualificados</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <GraduationCap className="w-4 h-4 mx-auto text-success mb-1" />
            <p className="text-xl font-bold text-foreground">{user.enrolled}</p>
            <p className="text-xs text-muted-foreground">Inscritos</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <TrendingUp className="w-4 h-4 mx-auto text-primary mb-1" />
            <p className="text-xl font-bold text-foreground">{convRate}%</p>
            <p className="text-xs text-muted-foreground">Conversão</p>
          </div>
        </div>

        {/* Points Breakdown */}
        <div className="mb-6">
          <PointsBreakdownCard breakdown={breakdown} monthLabel={monthLabel} />
        </div>

        {/* Points Timeline */}
        {pointsEvents.length > 0 && (
          <div className="mb-6">
            <PointsTimeline events={pointsEvents} />
          </div>
        )}

        {/* Referral History */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Histórico de Indicações</h3>
          {isLoading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : sortedReferrals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma indicação encontrada</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {sortedReferrals.map(r => (
                <div key={r.id} className="bg-muted/30 rounded-lg p-3 border border-border">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-foreground">{r.referred_name}</p>
                    <StatusBadge status={r.status as ReferralStatus} />
                  </div>
                  <p className="text-xs text-muted-foreground">{r.course}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(r.created_at), "dd MMM yyyy", { locale: ptBR })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
