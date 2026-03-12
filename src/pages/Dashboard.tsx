import { useState } from 'react';
import { Users, UserCheck, GraduationCap, TrendingUp, Trophy, Target, ArrowRight, BarChart3 } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { useMyReferrals, useMyStats, useRanking } from '@/hooks/useReferrals';
import { useAuth } from '@/contexts/AuthContext';
import { POINTS_CONFIG, ReferralStatus } from '@/types/referral';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

function ConversionFunnel({ referrals }: { referrals: any[] }) {
  const indicado = referrals.length;
  const qualificado = referrals.filter(r => r.status === 'qualificado' || r.status === 'inscrito' || r.status === 'nao_convertido').length;
  const inscrito = referrals.filter(r => r.status === 'inscrito').length;

  const funnelSteps = [
    { label: 'Indicados', value: indicado, color: 'bg-info' },
    { label: 'Qualificados', value: qualificado, color: 'bg-warning' },
    { label: 'Inscritos', value: inscrito, color: 'bg-success' },
  ];

  return (
    <div className="bg-card rounded-xl border border-border shadow-card p-5">
      <h2 className="text-sm font-semibold text-foreground mb-4">Funil de Conversão</h2>
      <div className="flex items-center gap-2 justify-between">
        {funnelSteps.map((step, i) => (
          <div key={step.label} className="flex items-center gap-2 flex-1">
            <div className="text-center flex-1">
              <div className={`${step.color} text-primary-foreground rounded-lg py-3 px-2 mb-2`}>
                <p className="text-2xl font-bold">{step.value}</p>
              </div>
              <p className="text-xs font-medium text-muted-foreground">{step.label}</p>
              {i < funnelSteps.length - 1 && indicado > 0 && (
                <p className="text-xs text-primary font-semibold mt-1">
                  {Math.round(((i === 0 ? qualificado : inscrito) / indicado) * 100)}%
                </p>
              )}
            </div>
            {i < funnelSteps.length - 1 && (
              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PerPersonMetrics({ ranking }: { ranking: any[] }) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-card">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Performance por Pessoa</h2>
      </div>
      <div className="divide-y divide-border max-h-[300px] overflow-y-auto">
        {ranking.map((user) => {
          const convRate = user.referrals > 0 ? Math.round((user.enrolled / user.referrals) * 100) : 0;
          const initials = user.name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() ?? '?';
          return (
            <div key={user.rank} className="px-5 py-3 flex items-center gap-3">
              <Avatar className="w-7 h-7 shrink-0">
                {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.name} />}
                <AvatarFallback className="text-[10px] font-medium">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
              </div>
              <div className="flex gap-4 text-center shrink-0">
                <div>
                  <p className="text-sm font-bold text-foreground">{user.referrals}</p>
                  <p className="text-[10px] text-muted-foreground">Ind.</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{user.enrolled}</p>
                  <p className="text-[10px] text-muted-foreground">Insc.</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-primary">{convRate}%</p>
                  <p className="text-[10px] text-muted-foreground">Conv.</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const Dashboard = () => {
  const { profile } = useAuth();
  const [month, setMonth] = useState<string>(String(currentMonth));
  const [year, setYear] = useState<string>(String(currentYear));

  const monthNum = month === 'all' ? undefined : Number(month);
  const yearNum = year === 'all' ? undefined : Number(year);

  const { data: referrals = [] } = useMyReferrals();
  const { data: stats } = useMyStats(monthNum, yearNum);
  const { data: ranking = [] } = useRanking(monthNum, yearNum);

  const recentReferrals = referrals.slice(0, 5);
  const myRank = ranking.findIndex(r => r.name === profile?.full_name) + 1;

  // Monthly stats
  const now = new Date();
  const thisMonthReferrals = referrals.filter(r => {
    const d = new Date(r.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const thisMonthEnrolled = thisMonthReferrals.filter(r => r.status === 'inscrito').length;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Acompanhe suas indicações e sua posição no ranking
            </p>
          </div>
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
          </div>
        </div>

        {/* Main KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <StatCard title="Total Indicações" value={stats?.total_referrals ?? 0} icon={Users} />
          <StatCard title="Qualificados" value={stats?.total_inscribed ?? 0} icon={UserCheck} />
          <StatCard title="Inscritos" value={stats?.total_enrolled ?? 0} icon={GraduationCap} />
          <StatCard title="Conversão" value={`${stats?.conversion_rate ?? 0}%`} icon={TrendingUp} />
          <StatCard title="Pontuação" value={stats?.points ?? 0} subtitle="pts" icon={Target} highlight />
          <StatCard title="Sua Posição" value={myRank > 0 ? `#${myRank}` : '-'} subtitle="no ranking" icon={Trophy} />
        </div>

        {/* Monthly highlight + Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-card rounded-xl border border-border shadow-card p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3">Este Mês</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Indicações</span>
                <span className="text-lg font-bold text-foreground">{thisMonthReferrals.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Inscrições</span>
                <span className="text-lg font-bold text-success">{thisMonthEnrolled}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Taxa conv.</span>
                <span className="text-lg font-bold text-primary">
                  {thisMonthReferrals.length > 0 ? Math.round((thisMonthEnrolled / thisMonthReferrals.length) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2">
            <ConversionFunnel referrals={referrals} />
          </div>
        </div>

        {/* Recent referrals + Rankings + Per person */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-card rounded-xl border border-border shadow-card">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Indicações Recentes</h2>
            </div>
            <div className="divide-y divide-border">
              {recentReferrals.length === 0 && (
                <p className="px-5 py-6 text-sm text-muted-foreground text-center">Nenhuma indicação ainda</p>
              )}
              {recentReferrals.map((referral) => (
                <div key={referral.id} className="px-5 py-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{referral.referred_name}</p>
                    <p className="text-xs text-muted-foreground">{referral.course}</p>
                  </div>
                  <StatusBadge status={referral.status as any} />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-card">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Top 5 Headhunters</h2>
            </div>
            <div className="divide-y divide-border">
              {ranking.slice(0, 5).map((user) => {
                const initials = user.name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() ?? '?';
                return (
                  <div key={user.rank} className="px-5 py-3.5 flex items-center gap-3">
                    <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0
                      ${user.rank <= 3 ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {user.rank}
                    </div>
                    <Avatar className="w-7 h-7 shrink-0">
                      {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.name} />}
                      <AvatarFallback className="text-[10px] font-medium">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                    </div>
                    <p className="text-sm font-bold text-primary">{user.points} pts</p>
                  </div>
                );
              })}
            </div>
          </div>

          <PerPersonMetrics ranking={ranking} />
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
