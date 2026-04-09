import { useState } from 'react';
import { Target, DollarSign, Clock, XCircle, Users, Trophy } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { useCampaignRanking, CampaignRankingEntry } from '@/hooks/useCampaign';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

const MEDALS = ['🥇', '🥈', '🥉'];

const getInitials = (name: string) =>
  name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() ?? '?';

const PODIUM_STYLES = [
  { border: 'border-[hsl(45,93%,47%)]', bg: 'bg-[hsl(45,93%,97%)]', shadow: 'shadow-[0_4px_20px_-4px_hsl(45,93%,47%,0.3)]', ring: 'ring-2 ring-[hsl(45,93%,47%)]' },
  { border: 'border-[hsl(0,0%,70%)]', bg: 'bg-[hsl(0,0%,97%)]', shadow: 'shadow-[0_4px_16px_-4px_hsl(0,0%,50%,0.2)]', ring: 'ring-2 ring-[hsl(0,0%,75%)]' },
  { border: 'border-[hsl(25,60%,52%)]', bg: 'bg-[hsl(25,60%,97%)]', shadow: 'shadow-[0_4px_16px_-4px_hsl(25,60%,52%,0.2)]', ring: 'ring-2 ring-[hsl(25,60%,52%)]' },
];

interface IndicatorCardProps {
  title: string;
  icon: React.ReactNode;
  color: string;
  entries: CampaignRankingEntry[];
  getValue: (e: CampaignRankingEntry) => number;
  renderDetail?: (e: CampaignRankingEntry) => string;
}

function IndicatorCard({ title, icon, color, entries, getValue, renderDetail }: IndicatorCardProps) {
  const sorted = [...entries].sort((a, b) => getValue(b) - getValue(a));

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
            {icon}
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {sorted.map((entry, idx) => {
            const pts = getValue(entry);
            return (
              <div key={entry.headhunter_id} className="flex items-center gap-2 text-sm">
                <span className="w-5 text-center text-xs font-bold text-muted-foreground">{idx + 1}º</span>
                <Avatar className="w-6 h-6">
                  {entry.avatar_url && <AvatarImage src={entry.avatar_url} />}
                  <AvatarFallback className="text-[10px]">{getInitials(entry.headhunter_name)}</AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate text-foreground">{entry.headhunter_name}</span>
                {renderDetail && (
                  <span className="text-xs text-muted-foreground hidden sm:inline">{renderDetail(entry)}</span>
                )}
                <span className={`font-bold ${pts < 0 ? 'text-destructive' : 'text-foreground'}`}>
                  {pts > 0 ? '+' : ''}{pts}
                </span>
              </div>
            );
          })}
          {sorted.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">Sem dados</p>}
        </div>
      </CardContent>
    </Card>
  );
}

const Campaign = () => {
  const [month, setMonth] = useState(String(currentMonth));
  const [year, setYear] = useState(String(currentYear));

  const monthNum = Number(month);
  const yearNum = Number(year);

  const { data: ranking = [], isLoading } = useCampaignRanking(monthNum, yearNum);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Trophy className="w-6 h-6 text-primary" />
            Dashboard da Campanha
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Ranking consolidado com todos os indicadores de performance</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {YEARS.map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : ranking.length === 0 ? (
          <div className="bg-card rounded-xl border border-border shadow-card p-8 text-center">
            <p className="text-muted-foreground">Nenhum dado registrado para este período.</p>
          </div>
        ) : (
          <>
            {/* Top 5 Podium */}
            <Card className="shadow-card mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Ranking Geral — {MONTHS[monthNum - 1]} {yearNum}</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Top 3 visual */}
                {ranking.length >= 3 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    {[1, 0, 2].map(idx => {
                      const entry = ranking[idx];
                      if (!entry) return null;
                      const style = PODIUM_STYLES[idx];
                      return (
                        <div
                          key={entry.headhunter_id}
                          className={`relative rounded-xl border-2 ${style.border} ${style.bg} ${style.shadow} p-4 text-center ${idx === 0 ? 'sm:order-2 sm:-mt-2' : idx === 1 ? 'sm:order-1' : 'sm:order-3'}`}
                        >
                          {idx === 0 && <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl">👑</div>}
                          <div className="flex flex-col items-center gap-2 mt-1">
                            <Avatar className={`w-14 h-14 ${style.ring}`}>
                              {entry.avatar_url && <AvatarImage src={entry.avatar_url} />}
                              <AvatarFallback className="text-lg font-bold bg-muted text-muted-foreground">{getInitials(entry.headhunter_name)}</AvatarFallback>
                            </Avatar>
                            <p className="text-sm font-bold text-foreground truncate max-w-[140px]">{entry.headhunter_name}</p>
                            <p className="text-2xl font-extrabold text-primary">{entry.total_points}</p>
                            <p className="text-xs text-muted-foreground">pontos totais</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Full list */}
                <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                  {ranking.map((entry, idx) => (
                    <div key={entry.headhunter_id} className="px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                      <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 ${idx < 3 ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        {idx < 3 ? MEDALS[idx] : idx + 1}
                      </div>
                      <Avatar className="w-7 h-7 shrink-0">
                        {entry.avatar_url && <AvatarImage src={entry.avatar_url} />}
                        <AvatarFallback className="text-[10px]">{getInitials(entry.headhunter_name)}</AvatarFallback>
                      </Avatar>
                      <span className="flex-1 text-sm font-medium text-foreground truncate">{entry.headhunter_name}</span>
                      <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground">
                        <span title="Produtividade">🎯 {entry.productivity_points}</span>
                        <span title="Faturamento">💰 {entry.revenue_points}</span>
                        <span title="Prazo">⏱️ {entry.deadline_points}</span>
                        <span title="Cancelamentos" className={entry.cancellation_points < 0 ? 'text-destructive' : ''}>❌ {entry.cancellation_points}</span>
                        <span title="Indicações">👥 {entry.referral_points}</span>
                      </div>
                      <span className="text-lg font-bold text-primary ml-2">{entry.total_points}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Indicator cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <IndicatorCard
                title="Produtividade"
                icon={<Target className="w-4 h-4 text-primary-foreground" />}
                color="bg-primary"
                entries={ranking}
                getValue={e => e.productivity_points}
              />
              <IndicatorCard
                title="Faturamento"
                icon={<DollarSign className="w-4 h-4 text-primary-foreground" />}
                color="bg-success"
                entries={ranking}
                getValue={e => e.revenue_points}
              />
              <IndicatorCard
                title="Vagas no Prazo"
                icon={<Clock className="w-4 h-4 text-primary-foreground" />}
                color="bg-info"
                entries={ranking}
                getValue={e => e.deadline_points}
              />
              <IndicatorCard
                title="Cancelamentos"
                icon={<XCircle className="w-4 h-4 text-destructive-foreground" />}
                color="bg-destructive"
                entries={ranking}
                getValue={e => e.cancellation_points}
              />
              <IndicatorCard
                title="Indicações"
                icon={<Users className="w-4 h-4 text-primary-foreground" />}
                color="bg-warning"
                entries={ranking}
                getValue={e => Number(e.referral_points)}
              />
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Campaign;
