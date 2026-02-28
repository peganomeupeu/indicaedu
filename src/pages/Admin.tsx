import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { useAllReferrals, useRanking, useUpdateReferralStatus } from '@/hooks/useReferrals';
import { useCourses, useAllCourses, useCreateCourse, useToggleCourse, useDeleteCourse } from '@/hooks/useCourses';
import { useAllUsers, useDeleteUser, useDeleteReferralsByDateRange } from '@/hooks/useAdmin';
import { STATUS_LABELS, ReferralStatus } from '@/types/referral';
import { Users, UserCheck, GraduationCap, BarChart3, Download, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const Admin = () => {
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [newCourseName, setNewCourseName] = useState('');
  const [deleteStartDate, setDeleteStartDate] = useState('');
  const [deleteEndDate, setDeleteEndDate] = useState('');
  const { data: referrals = [], isLoading } = useAllReferrals();
  const { data: ranking = [] } = useRanking();
  const { data: activeCourses = [] } = useCourses();
  const { data: allCourses = [] } = useAllCourses();
  const { data: allUsers = [] } = useAllUsers();
  const updateStatus = useUpdateReferralStatus();
  const createCourse = useCreateCourse();
  const toggleCourse = useToggleCourse();
  const deleteCourse = useDeleteCourse();
  const deleteUser = useDeleteUser();
  const deleteReferralsByRange = useDeleteReferralsByDateRange();

  const filtered = referrals.filter(r => {
    if (filterCourse !== 'all' && r.course !== filterCourse) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    return true;
  });

  const totalReferrals = referrals.length;
  const totalInscribed = referrals.filter(r => r.status === 'inscrito' || r.status === 'matriculado').length;
  const totalEnrolled = referrals.filter(r => r.status === 'matriculado').length;

  const handleStatusChange = (id: string, newStatus: string) => {
    updateStatus.mutate(
      { id, status: newStatus },
      {
        onSuccess: () => toast.success('Status atualizado!'),
        onError: (err) => toast.error('Erro: ' + (err as Error).message),
      }
    );
  };

  const handleExport = () => {
    const headers = ['Nome', 'Email', 'Telefone', 'Empresa', 'Cargo', 'Curso', 'Status', 'Headhunter', 'Data'];
    const rows = filtered.map(r => [
      r.referred_name, r.referred_email, r.referred_phone, r.referred_company,
      r.referred_position, r.course, STATUS_LABELS[r.status as ReferralStatus], r.headhunter_name || '', r.created_at,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `indicacoes_audens_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const handleDeleteByDateRange = () => {
    if (!deleteStartDate || !deleteEndDate) {
      toast.error('Selecione data inicial e final.');
      return;
    }
    deleteReferralsByRange.mutate(
      { startDate: deleteStartDate, endDate: deleteEndDate },
      {
        onSuccess: () => {
          toast.success('Registros removidos com sucesso!');
          setDeleteStartDate('');
          setDeleteEndDate('');
        },
        onError: (err) => toast.error('Erro: ' + (err as Error).message),
      }
    );
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    deleteUser.mutate(userId, {
      onSuccess: () => toast.success(`Usuário "${userName}" removido com sucesso.`),
      onError: (err) => toast.error('Erro: ' + (err as Error).message),
    });
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Painel Administrativo</h1>
            <p className="text-sm text-muted-foreground mt-1">Visão geral da Audens Edu</p>
          </div>
          <Button onClick={handleExport} variant="outline" className="gap-2 shrink-0">
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Indicações" value={totalReferrals} icon={Users} />
          <StatCard title="Inscritos" value={totalInscribed} icon={UserCheck} />
          <StatCard title="Matriculados" value={totalEnrolled} icon={GraduationCap} highlight />
          <StatCard title="Conversão" value={`${totalReferrals > 0 ? Math.round((totalEnrolled / totalReferrals) * 100) : 0}%`} icon={BarChart3} />
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <Select value={filterCourse} onValueChange={setFilterCourse}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filtrar por curso" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os cursos</SelectItem>
              {activeCourses.map(c => (<SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filtrar por status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {(Object.entries(STATUS_LABELS) as [ReferralStatus, string][]).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : (
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
                        <Select value={r.status} onValueChange={(v) => handleStatusChange(r.id, v)}>
                          <SelectTrigger className="w-[160px] h-8 text-xs">
                            <StatusBadge status={r.status as any} />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.entries(STATUS_LABELS) as [ReferralStatus, string][]).map(([key, label]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Delete Referrals by Date Range */}
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden mb-8">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Limpar Registros por Período</h2>
          </div>
          <div className="p-5">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Data inicial</label>
                <Input
                  type="date"
                  value={deleteStartDate}
                  onChange={(e) => setDeleteStartDate(e.target.value)}
                  className="w-[170px]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Data final</label>
                <Input
                  type="date"
                  value={deleteEndDate}
                  onChange={(e) => setDeleteEndDate(e.target.value)}
                  className="w-[170px]"
                />
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-1"
                    disabled={!deleteStartDate || !deleteEndDate || deleteReferralsByRange.isPending}
                  >
                    <Trash2 className="w-4 h-4" /> Excluir registros
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                      Confirmar exclusão
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Todos os registros de indicações entre <strong>{deleteStartDate}</strong> e <strong>{deleteEndDate}</strong> serão removidos permanentemente. Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteByDateRange} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Sim, excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {/* Course Management */}
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden mb-8">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Gerenciar Cursos</h2>
          </div>
          <div className="p-5 space-y-3">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!newCourseName.trim()) return;
                createCourse.mutate(newCourseName.trim(), {
                  onSuccess: () => { toast.success('Curso adicionado!'); setNewCourseName(''); },
                  onError: (err) => toast.error('Erro: ' + (err as Error).message),
                });
              }}
            >
              <Input
                placeholder="Nome do novo curso"
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="sm" className="gap-1 shrink-0" disabled={createCourse.isPending}>
                <Plus className="w-4 h-4" /> Adicionar
              </Button>
            </form>
            <div className="divide-y divide-border">
              {allCourses.map((course) => (
                <div key={course.id} className="flex items-center gap-3 py-3">
                  <Switch
                    checked={course.active}
                    onCheckedChange={(checked) =>
                      toggleCourse.mutate({ id: course.id, active: checked }, {
                        onSuccess: () => toast.success(checked ? 'Curso ativado' : 'Curso desativado'),
                      })
                    }
                  />
                  <span className={`flex-1 text-sm ${course.active ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                    {course.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() =>
                      deleteCourse.mutate(course.id, {
                        onSuccess: () => toast.success('Curso removido'),
                        onError: (err) => toast.error('Erro: ' + (err as Error).message),
                      })
                    }
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Management */}
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden mb-8">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Gerenciar Usuários</h2>
          </div>
          <div className="divide-y divide-border">
            {allUsers.map((u) => (
              <div key={u.id} className="px-5 py-3.5 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{u.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {u.role === 'admin' ? 'Admin' : 'Headhunter'}
                </span>
                {u.role !== 'admin' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-destructive" />
                          Excluir usuário
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          O usuário <strong>{u.full_name}</strong> ({u.email}) será removido permanentemente da plataforma. Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteUser(u.user_id, u.full_name)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Sim, excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Ranking de Headhunters</h2>
          </div>
          <div className="divide-y divide-border">
            {ranking.map((user) => (
              <div key={user.rank} className="px-5 py-3.5 flex items-center gap-4">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold shrink-0 ${user.rank <= 3 ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {user.rank}
                </div>
                <div className="flex-1"><p className="text-sm font-medium text-foreground">{user.name}</p></div>
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
