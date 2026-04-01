import { useState, useMemo } from 'react';
import { Download, Target, Users, UserCheck, GraduationCap, ChevronDown, ChevronUp } from 'lucide-react';
import { useAllPointsHistory, computeBreakdown, PointsEvent } from '@/hooks/usePointsHistory';

import { PointsBreakdownCard } from '@/components/PointsBreakdownCard';
import { PointsTimeline } from '@/components/PointsTimeline';
import { StatCard } from '@/components/StatCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

type SortKey = 'total' | 'indicado' | 'qualificado' | 'inscrito' | 'referrals';

interface UserProfile {
  id: string;
  full_name: string;
  avatar_url?: string | null;
}

interface Props {
  profiles: UserProfile[];
}

export function AdminPointsDashboard({ profiles }: Props) {
  const [month, setMonth] = useState<string>(String(currentMonth));
  const [year, setYear] = useState<string>(String(currentYear));
  const [sortBy, setSortBy] = useState<SortKey>('total');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showCrossMonth, setShowCrossMonth] = useState(false);

  const monthNum = month === 'all' ? undefined : Number(month);
  const yearNum = year === 'all' ? undefined : Number(year);

  const { data: allEvents = [], isLoading } = useAllPointsHistory(monthNum, yearNum);
  

  const monthLabel = monthNum && yearNum ? `${MONTHS[monthNum - 1]} ${yearNum}` : 'Todos os períodos';

  // Global breakdown
  const globalBreakdown = useMemo(() => computeBreakdown(allEvents), [allEvents]);

  // Per-user breakdown
  const perUser = useMemo(() => {
    const map = new Map<string, PointsEvent[]>();
    for (const e of allEvents) {
      if (!map.has(e.headhunter_id)) map.set(e.headhunter_id, []);
      map.get(e.headhunter_id)!.push(e);
    }

    return Array.from(map.entries()).map(([id, events]) => {
      const bd = computeBreakdown(events);
      const profileInfo = profiles.find(p => p.id === id);
      const name = profileInfo?.full_name ?? id;
      const avatar_url = profileInfo?.avatar_url ?? null;

      return { headhunter_id: id, name, avatar_url, breakdown: bd, events };
    });
  }, [allEvents, profiles]);

  // Sort
  const sorted = useMemo(() => {
    const arr = [...perUser];
    arr.sort((a, b) => {
      let av = 0, bv = 0;
      if (sortBy === 'total') { av = a.breakdown.total; bv = b.breakdown.total; }
      else if (sortBy === 'indicado') { av = a.breakdown.indicado.points; bv = b.breakdown.indicado.points; }
      else if (sortBy === 'qualificado') { av = a.breakdown.qualificado.points; bv = b.breakdown.qualificado.points; }
      else if (sortBy === 'inscrito') { av = a.breakdown.inscrito.points; bv = b.breakdown.inscrito.points; }
      else if (sortBy === 'referrals') { av = a.breakdown.indicado.count; bv = b.breakdown.indicado.count; }
      return sortAsc ? av - bv : bv - av;
    });
    return arr;
  }, [perUser, sortBy, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortAsc(!sortAsc);
    else { setSortBy(key); setSortAsc(false); }
  };

  const selectedUserData = selectedUserId ? perUser.find(u => u.headhunter_id === selectedUserId) : null;

  const handleExportPoints = () => {
    const headers = ['Posição', 'Usuário', 'Indicações (pts)', 'Indicações (qtd)', 'Qualificações (pts)', 'Qualificações (qtd)', 'Inscrições (pts)', 'Inscrições (qtd)', 'Total'];
    const rows = sorted.map((u, i) => [
      i + 1, u.name,
      u.breakdown.indicado.points, u.breakdown.indicado.count,
      u.breakdown.qualificado.points, u.breakdown.qualificado.count,
      u.breakdown.inscrito.points, u.breakdown.inscrito.count,
      u.breakdown.total,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ranking_pontos_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('Ranking exportado!');
  };

  const SortIcon = ({ field }: { field: SortKey }) => {
    if (sortBy !== field) return null;
    return sortAsc ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-bold text-foreground">Dashboard de Pontuação</h2>
        <div className="flex flex-wrap gap-2">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-[150px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os meses</SelectItem>
              {MONTHS.map((m, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[110px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {YEARS.map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="gap-1" onClick={handleExportPoints}>
            <Download className="w-4 h-4" /> Exportar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Total de Pontos" value={globalBreakdown.total} subtitle="pts" icon={Target} highlight />
        <StatCard title="Indicações" value={`${globalBreakdown.indicado.points} pts`} subtitle={`${globalBreakdown.indicado.count} eventos`} icon={Users} />
        <StatCard title="Qualificações" value={`${globalBreakdown.qualificado.points} pts`} subtitle={`${globalBreakdown.qualificado.count} eventos`} icon={UserCheck} />
        <StatCard title="Inscrições" value={`${globalBreakdown.inscrito.points} pts`} subtitle={`${globalBreakdown.inscrito.count} eventos`} icon={GraduationCap} />
      </div>

      {/* Detailed Ranking Table */}
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Ranking Detalhado — {monthLabel}</h3>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
        ) : sorted.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground text-center">Nenhuma atividade neste período.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 w-12">#</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Usuário</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground px-4 py-3 cursor-pointer hover:text-foreground" onClick={() => handleSort('indicado')}>
                    🔵 Indicações <SortIcon field="indicado" />
                  </th>
                  <th className="text-center text-xs font-semibold text-muted-foreground px-4 py-3 cursor-pointer hover:text-foreground" onClick={() => handleSort('qualificado')}>
                    🟡 Qualificações <SortIcon field="qualificado" />
                  </th>
                  <th className="text-center text-xs font-semibold text-muted-foreground px-4 py-3 cursor-pointer hover:text-foreground" onClick={() => handleSort('inscrito')}>
                    🟢 Inscrições <SortIcon field="inscrito" />
                  </th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3 cursor-pointer hover:text-foreground" onClick={() => handleSort('total')}>
                    Total <SortIcon field="total" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sorted.map((u, i) => {
                  const initials = u.name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() ?? '?';
                  return (
                    <tr
                      key={u.headhunter_id}
                      onClick={() => setSelectedUserId(selectedUserId === u.headhunter_id ? null : u.headhunter_id)}
                      className={`cursor-pointer transition-colors ${selectedUserId === u.headhunter_id ? 'bg-primary/5' : 'hover:bg-muted/30'}`}
                    >
                      <td className="px-4 py-3">
                        <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${i < 3 ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                          {i + 1}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-7 h-7 shrink-0">
                            {u.avatar_url && <AvatarImage src={u.avatar_url} alt={u.name} />}
                            <AvatarFallback className="text-[10px] font-medium">{initials}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium text-foreground truncate">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-bold text-foreground">{u.breakdown.indicado.points} pts</span>
                        <span className="text-xs text-muted-foreground ml-1">({u.breakdown.indicado.count})</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-bold text-foreground">{u.breakdown.qualificado.points} pts</span>
                        <span className="text-xs text-muted-foreground ml-1">({u.breakdown.qualificado.count})</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-bold text-foreground">{u.breakdown.inscrito.points} pts</span>
                        <span className="text-xs text-muted-foreground ml-1">({u.breakdown.inscrito.count})</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-lg font-bold text-primary">{u.breakdown.total}</span>
                        <span className="text-xs text-muted-foreground ml-1">pts</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Detail Panel */}
      {selectedUserData && (
        <div className="bg-card rounded-xl border border-primary/20 shadow-card p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                {selectedUserData.avatar_url && <AvatarImage src={selectedUserData.avatar_url} alt={selectedUserData.name} />}
                <AvatarFallback className="text-sm font-bold">
                  {selectedUserData.name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-sm font-bold text-foreground">{selectedUserData.name}</h3>
                <p className="text-xs text-muted-foreground">Detalhamento — {monthLabel}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold text-primary">{selectedUserData.breakdown.total}</p>
              <p className="text-xs text-muted-foreground">pontos no período</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PointsBreakdownCard breakdown={selectedUserData.breakdown} monthLabel={monthLabel} />
            <PointsTimeline events={selectedUserData.events} maxItems={15} />
          </div>
        </div>
      )}

      {/* Cross-month referrals */}
      {monthNum && yearNum && (
        <Collapsible open={showCrossMonth} onOpenChange={setShowCrossMonth}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full flex items-center justify-between h-10">
              <span className="text-sm font-semibold">Indicações entre meses</span>
              {showCrossMonth ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <CrossMonthView events={allEvents} month={monthNum} year={yearNum} />
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

function CrossMonthView({ events, month, year }: { events: PointsEvent[]; month: number; year: number }) {
  const startOfMonth = new Date(year, month - 1, 1);

  // Events this month from referrals created in previous months
  const fromPreviousMonths = events.filter(e => {
    // We don't have referral created_at directly, but creation events have old_status = null
    // For non-creation events (qualificado/inscrito), the referral was likely created earlier
    return e.old_status !== null; // status change events (not creation)
  });

  // Creation events this month (new referrals)
  const newThisMonth = events.filter(e => !e.old_status && e.new_status === 'indicado');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-card rounded-xl border border-border shadow-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          📥 Pontos de indicações anteriores
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Mudanças de status ocorridas em {MONTHS[month - 1]} para indicações de meses anteriores.
        </p>
        {fromPreviousMonths.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">Nenhum evento encontrado.</p>
        ) : (
          <div className="space-y-2 max-h-[250px] overflow-y-auto">
            {fromPreviousMonths.map(e => (
              <div key={e.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{e.referred_name}</p>
                  <p className="text-xs text-muted-foreground">{e.old_status} → {e.new_status}</p>
                </div>
                <span className={`text-sm font-bold ${e.pontos_gerados > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                  +{e.pontos_gerados} pts
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-card rounded-xl border border-border shadow-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          📤 Novas indicações de {MONTHS[month - 1]}
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Indicações criadas neste mês que podem gerar mais pontos nos próximos meses.
        </p>
        {newThisMonth.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">Nenhuma indicação nova.</p>
        ) : (
          <div className="space-y-2 max-h-[250px] overflow-y-auto">
            {newThisMonth.map(e => (
              <div key={e.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                <p className="text-sm font-medium text-foreground truncate">{e.referred_name}</p>
                <span className="text-sm font-bold text-primary">+{e.pontos_gerados} pts</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const MONTHS_REF = MONTHS;
