import { useState } from 'react';
import { Users, UserCheck, GraduationCap, TrendingUp, Trophy, Target } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { useMyReferrals, useMyStats, useRanking } from '@/hooks/useReferrals';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

const Dashboard = () => {
  const { profile } = useAuth();
  const [month, setMonth] = useState<string>('all');
  const [year, setYear] = useState<string>('all');

  const monthNum = month === 'all' ? undefined : Number(month);
  const yearNum = year === 'all' ? undefined : Number(year);

  const { data: referrals = [] } = useMyReferrals();
  const { data: stats } = useMyStats(monthNum, yearNum);
  const { data: ranking = [] } = useRanking(monthNum, yearNum);

  const recentReferrals = referrals.slice(0, 3);
  const myRank = ranking.findIndex(r => r.name === profile?.full_name) + 1;

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatCard title="Total de Indicações" value={stats?.total_referrals ?? 0} icon={Users} />
          <StatCard title="Inscritos" value={stats?.total_inscribed ?? 0} subtitle={`${stats?.conversion_rate ?? 0}% de conversão`} icon={UserCheck} />
          <StatCard title="Matriculados" value={stats?.total_enrolled ?? 0} icon={GraduationCap} />
          <StatCard title="Taxa de Conversão" value={`${stats?.conversion_rate ?? 0}%`} icon={TrendingUp} />
          <StatCard title="Pontuação" value={stats?.points ?? 0} subtitle="pts acumulados" icon={Target} highlight />
          <StatCard title="Sua Posição" value={myRank > 0 ? `#${myRank}` : '-'} subtitle="no ranking geral" icon={Trophy} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              {ranking.slice(0, 5).map((user) => (
                <div key={user.rank} className="px-5 py-3.5 flex items-center gap-4">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold
                    ${user.rank <= 3 ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {user.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.referrals} indicações</p>
                  </div>
                  <p className="text-sm font-bold text-primary">{user.points} pts</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
