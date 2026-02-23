import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { mockReferrals, mockRanking } from '@/data/mockData';
import { COURSES, STATUS_LABELS, ReferralStatus } from '@/types/referral';
import { Users, UserCheck, GraduationCap, BarChart3, Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Admin = () => {
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filtered = mockReferrals.filter(r => {
    if (filterCourse !== 'all' && r.course !== filterCourse) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    return true;
  });

  const totalReferrals = mockReferrals.length;
  const totalInscribed = mockReferrals.filter(r => r.status === 'inscrito' || r.status === 'matriculado').length;
  const totalEnrolled = mockReferrals.filter(r => r.status === 'matriculado').length;

  const handleExport = () => {
    const headers = ['Nome', 'Email', 'Telefone', 'Empresa', 'Cargo', 'Curso', 'Status', 'Headhunter', 'Data'];
    const rows = filtered.map(r => [
      r.referred_name, r.referred_email, r.referred_phone, r.referred_company,
      r.referred_position, r.course, STATUS_LABELS[r.status], r.headhunter_name || '', r.created_at,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `indicacoes_audens_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Painel Administrativo</h1>
            <p className="text-sm text-muted-foreground mt-1">Visão geral da Audens Edu</p>
          </div>
          <Button 
            onClick={handleExport} 
            variant="outline" 
            className="gap-2 shrink-0"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Indicações" value={totalReferrals} icon={Users} />
          <StatCard title="Inscritos" value={totalInscribed} icon={UserCheck} />
          <StatCard title="Matriculados" value={totalEnrolled} icon={GraduationCap} highlight />
          <StatCard title="Conversão" value={`${totalReferrals > 0 ? Math.round((totalEnrolled / totalReferrals) * 100) : 0}%`} icon={BarChart3} />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <Select value={filterCourse} onValueChange={setFilterCourse}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por curso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os cursos</SelectItem>
              {COURSES.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {(Object.entries(STATUS_LABELS) as [ReferralStatus, string][]).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Indicado</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Curso</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Headhunter</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Data</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-foreground">{r.referred_name}</p>
                      <p className="text-xs text-muted-foreground">{r.referred_email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-foreground max-w-[200px] truncate">{r.course}</td>
                    <td className="px-5 py-3.5 text-sm text-foreground">{r.headhunter_name}</td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">
                      {format(new Date(r.created_at), "dd MMM yyyy", { locale: ptBR })}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ranking table */}
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Ranking de Headhunters</h2>
          </div>
          <div className="divide-y divide-border">
            {mockRanking.map((user) => (
              <div key={user.rank} className="px-5 py-3.5 flex items-center gap-4">
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold shrink-0
                  ${user.rank <= 3 ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                `}>
                  {user.rank}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">{user.referrals}</p>
                  <p className="text-xs text-muted-foreground">indicações</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">{user.enrolled}</p>
                  <p className="text-xs text-muted-foreground">matrículas</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{user.points}</p>
                  <p className="text-xs text-muted-foreground">pontos</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Admin;
