import { Users, UserCheck, GraduationCap, TrendingUp, Trophy, Target } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { mockReferrals, mockStats, mockRanking } from '@/data/mockData';

const Dashboard = () => {
  const recentReferrals = mockReferrals.slice(0, 3);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhe suas indicações e sua posição no ranking
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatCard
            title="Total de Indicações"
            value={mockStats.total_referrals}
            icon={Users}
          />
          <StatCard
            title="Inscritos"
            value={mockStats.total_inscribed}
            subtitle={`${mockStats.conversion_rate}% de conversão`}
            icon={UserCheck}
          />
          <StatCard
            title="Matriculados"
            value={mockStats.total_enrolled}
            icon={GraduationCap}
          />
          <StatCard
            title="Taxa de Conversão"
            value={`${mockStats.conversion_rate}%`}
            icon={TrendingUp}
          />
          <StatCard
            title="Pontuação"
            value={mockStats.points}
            subtitle="pts acumulados"
            icon={Target}
            highlight
          />
          <StatCard
            title="Sua Posição"
            value={`#${mockStats.rank}`}
            subtitle="no ranking geral"
            icon={Trophy}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent referrals */}
          <div className="bg-card rounded-xl border border-border shadow-card">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Indicações Recentes</h2>
            </div>
            <div className="divide-y divide-border">
              {recentReferrals.map((referral) => (
                <div key={referral.id} className="px-5 py-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{referral.referred_name}</p>
                    <p className="text-xs text-muted-foreground">{referral.course}</p>
                  </div>
                  <StatusBadge status={referral.status} />
                </div>
              ))}
            </div>
          </div>

          {/* Mini ranking */}
          <div className="bg-card rounded-xl border border-border shadow-card">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Top 5 Headhunters</h2>
            </div>
            <div className="divide-y divide-border">
              {mockRanking.map((user) => (
                <div key={user.rank} className="px-5 py-3.5 flex items-center gap-4">
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold
                    ${user.rank <= 3 ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                  `}>
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
