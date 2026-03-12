import { useState, useRef } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { useAllReferrals, useRanking, useUpdateReferralStatus, useUpdateReferralAttendedBy, useToggleRdStation } from '@/hooks/useReferrals';
import { useCourses, useAllCourses, useCreateCourse, useToggleCourse, useDeleteCourse } from '@/hooks/useCourses';
import { useAllUsers, useDeleteUser, useDeleteReferralsByDateRange, useToggleUserRole, useResetUserPassword } from '@/hooks/useAdmin';
import { useAdminUploadAvatar } from '@/hooks/useProfile';
import { STATUS_LABELS, ReferralStatus } from '@/types/referral';
import { Users, UserCheck, GraduationCap, BarChart3, Download, Plus, Trash2, AlertTriangle, Camera, Shield, KeyRound, ChevronDown, ChevronUp, Send, CheckCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

const Admin = () => {
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [newCourseName, setNewCourseName] = useState('');
  const [deleteStartDate, setDeleteStartDate] = useState('');
  const [deleteEndDate, setDeleteEndDate] = useState('');
  const adminAvatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarTargetUser, setAvatarTargetUser] = useState<string | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<{ userId: string; name: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const { data: referrals = [], isLoading } = useAllReferrals();
  const { data: ranking = [] } = useRanking();
  const { data: activeCourses = [] } = useCourses();
  const { data: allCourses = [] } = useAllCourses();
  const { data: allUsers = [] } = useAllUsers();
  const updateStatus = useUpdateReferralStatus();
  const updateAttendedBy = useUpdateReferralAttendedBy();
  const toggleRdStation = useToggleRdStation();
  const createCourse = useCreateCourse();
  const toggleCourse = useToggleCourse();
  const deleteCourse = useDeleteCourse();
  const deleteUser = useDeleteUser();
  const deleteReferralsByRange = useDeleteReferralsByDateRange();
  const adminUploadAvatar = useAdminUploadAvatar();
  const toggleRole = useToggleUserRole();
  const resetPassword = useResetUserPassword();

  const adminUsers = allUsers.filter(u => u.role === 'admin');

  const filtered = referrals.filter(r => {
    if (filterCourse !== 'all' && r.course !== filterCourse) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (filterUser !== 'all' && r.headhunter_name !== filterUser) return false;
    if (filterMonth !== 'all' || filterYear !== 'all') {
      const d = new Date(r.created_at);
      if (filterMonth !== 'all' && d.getMonth() + 1 !== Number(filterMonth)) return false;
      if (filterYear !== 'all' && d.getFullYear() !== Number(filterYear)) return false;
    }
    return true;
  });

  const totalReferrals = referrals.length;
  const totalQualified = referrals.filter(r => r.status === 'qualificado' || r.status === 'inscrito' || r.status === 'nao_convertido').length;
  const totalEnrolled = referrals.filter(r => r.status === 'inscrito').length;

  const toggleExpand = (id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(r => r.id)));
    }
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    updateStatus.mutate(
      { id, status: newStatus },
      {
        onSuccess: () => toast.success('Status atualizado!'),
        onError: (err) => toast.error('Erro: ' + (err as Error).message),
      }
    );
  };

  const handleAttendedByChange = (id: string, profileId: string) => {
    updateAttendedBy.mutate(
      { id, attended_by: profileId === 'none' ? null : profileId },
      {
        onSuccess: () => toast.success('Atendente atualizado!'),
        onError: (err) => toast.error('Erro: ' + (err as Error).message),
      }
    );
  };

  const handleToggleRdStation = (id: string, current: boolean) => {
    toggleRdStation.mutate(
      { id, rd_station_sent: !current },
      {
        onSuccess: () => toast.success(!current ? 'Marcado como enviado ao RD Station' : 'Desmarcado do RD Station'),
        onError: (err) => toast.error('Erro: ' + (err as Error).message),
      }
    );
  };

  const handleExport = () => {
    const exportData = selectedIds.size > 0 ? filtered.filter(r => selectedIds.has(r.id)) : filtered;
    const headers = ['Nome', 'Email', 'Telefone', 'Empresa', 'Cargo', 'Curso', 'Status', 'Headhunter', 'Data', 'RD Station'];
    const rows = exportData.map(r => [
      r.referred_name, r.referred_email, r.referred_phone, r.referred_company,
      r.referred_position, r.course, STATUS_LABELS[r.status as ReferralStatus],
      r.headhunter_name || '', r.created_at, r.rd_station_sent ? 'Sim' : 'Não',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `indicacoes_audens_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success(`${exportData.length} registro(s) exportado(s)`);
  };

  const handleDeleteByDateRange = () => {
    if (!deleteStartDate || !deleteEndDate) { toast.error('Selecione data inicial e final.'); return; }
    deleteReferralsByRange.mutate(
      { startDate: deleteStartDate, endDate: deleteEndDate },
      {
        onSuccess: () => { toast.success('Registros removidos!'); setDeleteStartDate(''); setDeleteEndDate(''); },
        onError: (err) => toast.error('Erro: ' + (err as Error).message),
      }
    );
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    deleteUser.mutate(userId, {
      onSuccess: () => toast.success(`Usuário "${userName}" removido.`),
      onError: (err) => toast.error('Erro: ' + (err as Error).message),
    });
  };

  const handleAdminAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !avatarTargetUser) return;
    adminUploadAvatar.mutate(
      { targetUserId: avatarTargetUser, file },
      { onSuccess: () => toast.success('Avatar atualizado!'), onError: (err) => toast.error('Erro: ' + (err as Error).message) }
    );
    setAvatarTargetUser(null);
  };

  const handleToggleRole = (userId: string, currentRole: string, userName: string) => {
    const newRole = currentRole === 'admin' ? 'headhunter' : 'admin';
    toggleRole.mutate(
      { userId, newRole },
      {
        onSuccess: () => toast.success(`${userName} agora é ${newRole === 'admin' ? 'Admin' : 'Headhunter'}.`),
        onError: (err) => toast.error('Erro: ' + (err as Error).message),
      }
    );
  };

  const handleResetPassword = () => {
    if (!resetPasswordUser || !newPassword || newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.'); return;
    }
    resetPassword.mutate(
      { userId: resetPasswordUser.userId, password: newPassword },
      {
        onSuccess: () => { toast.success(`Senha redefinida com sucesso.`); setResetPasswordUser(null); setNewPassword(''); },
        onError: (err) => toast.error('Erro: ' + (err as Error).message),
      }
    );
  };

  const uniqueHeadhunters = [...new Set(referrals.map(r => r.headhunter_name).filter(Boolean))];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Painel Administrativo</h1>
            <p className="text-sm text-muted-foreground mt-1">Hub de Indicações da Audens Edu</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExport} variant="outline" className="gap-2 shrink-0">
              <Download className="w-4 h-4" />
              Exportar CSV {selectedIds.size > 0 && `(${selectedIds.size})`}
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard title="Total Indicações" value={totalReferrals} icon={Users} />
          <StatCard title="Qualificados" value={totalQualified} icon={UserCheck} />
          <StatCard title="Inscritos" value={totalEnrolled} icon={GraduationCap} highlight />
          <StatCard title="Conversão" value={`${totalReferrals > 0 ? Math.round((totalEnrolled / totalReferrals) * 100) : 0}%`} icon={BarChart3} />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="w-[140px] h-9 text-sm"><SelectValue placeholder="Mês" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os meses</SelectItem>
              {MONTHS.map((m, i) => (<SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="w-[100px] h-9 text-sm"><SelectValue placeholder="Ano" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {YEARS.map(y => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={filterCourse} onValueChange={setFilterCourse}>
            <SelectTrigger className="w-[180px] h-9 text-sm"><SelectValue placeholder="Curso" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os cursos</SelectItem>
              {activeCourses.map(c => (<SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px] h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {(Object.entries(STATUS_LABELS) as [ReferralStatus, string][]).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterUser} onValueChange={setFilterUser}>
            <SelectTrigger className="w-[180px] h-9 text-sm"><SelectValue placeholder="Headhunter" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {uniqueHeadhunters.map(name => (<SelectItem key={name} value={name!}>{name}</SelectItem>))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 ml-auto">
            <Button variant={viewMode === 'cards' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('cards')}>Cards</Button>
            <Button variant={viewMode === 'table' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('table')}>Tabela</Button>
          </div>
        </div>

        {/* Select all */}
        <div className="flex items-center gap-3 mb-3">
          <Checkbox
            checked={selectedIds.size === filtered.length && filtered.length > 0}
            onCheckedChange={toggleSelectAll}
          />
          <span className="text-xs text-muted-foreground">
            {selectedIds.size > 0 ? `${selectedIds.size} selecionado(s)` : 'Selecionar todos'}
          </span>
          <span className="text-xs text-muted-foreground ml-auto">{filtered.length} registro(s)</span>
        </div>

        {/* Referrals */}
        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
            {filtered.map(r => {
              const isExpanded = expandedCards.has(r.id);
              const isSelected = selectedIds.has(r.id);
              const attendedUser = adminUsers.find(u => u.id === (r as any).attended_by);
              return (
                <div key={r.id} className={`bg-card rounded-xl border shadow-card transition-all duration-200 ${isSelected ? 'border-primary ring-1 ring-primary/20' : 'border-border'}`}>
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(r.id)} className="mt-1" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold text-foreground truncate">{r.referred_name}</p>
                          <StatusBadge status={r.status as ReferralStatus} />
                        </div>
                        <p className="text-xs text-muted-foreground">{r.referred_position}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>📌 {r.headhunter_name}</span>
                          <span>📅 {format(new Date(r.created_at), "dd/MM/yy", { locale: ptBR })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Expandable details */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-border space-y-3 animate-fade-in">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><span className="text-muted-foreground">Email:</span> <span className="text-foreground">{r.referred_email}</span></div>
                          <div><span className="text-muted-foreground">Telefone:</span> <span className="text-foreground">{r.referred_phone}</span></div>
                          <div><span className="text-muted-foreground">Empresa:</span> <span className="text-foreground">{r.referred_company}</span></div>
                          <div><span className="text-muted-foreground">Curso:</span> <span className="text-foreground">{r.course}</span></div>
                        </div>
                        {r.notes && <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2">{r.notes}</p>}
                        
                        <div className="flex flex-wrap gap-2">
                          <Select value={r.status} onValueChange={(v) => handleStatusChange(r.id, v)}>
                            <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {(Object.entries(STATUS_LABELS) as [ReferralStatus, string][]).map(([key, label]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={(r as any).attended_by || 'none'} onValueChange={(v) => handleAttendedByChange(r.id, v)}>
                            <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder="Atendido por" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sem atendente</SelectItem>
                              {adminUsers.map(u => (<SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant={(r as any).rd_station_sent ? 'default' : 'outline'}
                            size="sm"
                            className="h-8 text-xs gap-1"
                            onClick={() => handleToggleRdStation(r.id, (r as any).rd_station_sent ?? false)}
                          >
                            {(r as any).rd_station_sent ? <CheckCircle className="w-3 h-3" /> : <Send className="w-3 h-3" />}
                            RD Station
                          </Button>
                        </div>
                      </div>
                    )}

                    <button onClick={() => toggleExpand(r.id)} className="flex items-center gap-1 mt-2 text-xs text-primary hover:underline">
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {isExpanded ? 'Recolher' : 'Detalhes'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-3 py-3 w-8"><Checkbox checked={selectedIds.size === filtered.length && filtered.length > 0} onCheckedChange={toggleSelectAll} /></th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-3 py-3">Indicado</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-3 py-3">Curso</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-3 py-3">Headhunter</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-3 py-3">Data</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-3 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-3 py-3">RD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((r) => (
                    <tr key={r.id} className={`hover:bg-muted/30 transition-colors ${selectedIds.has(r.id) ? 'bg-primary/5' : ''}`}>
                      <td className="px-3 py-3"><Checkbox checked={selectedIds.has(r.id)} onCheckedChange={() => toggleSelect(r.id)} /></td>
                      <td className="px-3 py-3">
                        <p className="text-sm font-medium text-foreground">{r.referred_name}</p>
                        <p className="text-xs text-muted-foreground">{r.referred_email}</p>
                      </td>
                      <td className="px-3 py-3 text-sm text-foreground max-w-[150px] truncate">{r.course}</td>
                      <td className="px-3 py-3 text-sm text-foreground">{r.headhunter_name}</td>
                      <td className="px-3 py-3 text-sm text-muted-foreground">{format(new Date(r.created_at), "dd/MM/yy")}</td>
                      <td className="px-3 py-3">
                        <Select value={r.status} onValueChange={(v) => handleStatusChange(r.id, v)}>
                          <SelectTrigger className="w-[140px] h-8 text-xs"><StatusBadge status={r.status as any} /></SelectTrigger>
                          <SelectContent>
                            {(Object.entries(STATUS_LABELS) as [ReferralStatus, string][]).map(([key, label]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-3 py-3">
                        <button onClick={() => handleToggleRdStation(r.id, (r as any).rd_station_sent ?? false)} className="text-xs">
                          {(r as any).rd_station_sent
                            ? <CheckCircle className="w-4 h-4 text-success" />
                            : <Send className="w-4 h-4 text-muted-foreground hover:text-primary" />}
                        </button>
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
                <Input type="date" value={deleteStartDate} onChange={(e) => setDeleteStartDate(e.target.value)} className="w-[170px]" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Data final</label>
                <Input type="date" value={deleteEndDate} onChange={(e) => setDeleteEndDate(e.target.value)} className="w-[170px]" />
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-1" disabled={!deleteStartDate || !deleteEndDate || deleteReferralsByRange.isPending}>
                    <Trash2 className="w-4 h-4" /> Excluir registros
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-destructive" />Confirmar exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Todos os registros entre <strong>{deleteStartDate}</strong> e <strong>{deleteEndDate}</strong> serão removidos permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteByDateRange} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Sim, excluir</AlertDialogAction>
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
            <form className="flex gap-2" onSubmit={(e) => {
              e.preventDefault();
              if (!newCourseName.trim()) return;
              createCourse.mutate(newCourseName.trim(), {
                onSuccess: () => { toast.success('Curso adicionado!'); setNewCourseName(''); },
                onError: (err) => toast.error('Erro: ' + (err as Error).message),
              });
            }}>
              <Input placeholder="Nome do novo curso" value={newCourseName} onChange={(e) => setNewCourseName(e.target.value)} className="flex-1" />
              <Button type="submit" size="sm" className="gap-1 shrink-0" disabled={createCourse.isPending}>
                <Plus className="w-4 h-4" /> Adicionar
              </Button>
            </form>
            <div className="divide-y divide-border">
              {allCourses.map((course) => (
                <div key={course.id} className="flex items-center gap-3 py-3">
                  <Switch checked={course.active} onCheckedChange={(checked) =>
                    toggleCourse.mutate({ id: course.id, active: checked }, { onSuccess: () => toast.success(checked ? 'Curso ativado' : 'Curso desativado') })
                  } />
                  <span className={`flex-1 text-sm ${course.active ? 'text-foreground' : 'text-muted-foreground line-through'}`}>{course.name}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() =>
                    deleteCourse.mutate(course.id, { onSuccess: () => toast.success('Curso removido'), onError: (err) => toast.error('Erro: ' + (err as Error).message) })
                  }><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Management */}
        <input ref={adminAvatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAdminAvatarUpload} />
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden mb-8">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Gerenciar Usuários</h2>
          </div>
          <div className="divide-y divide-border">
            {allUsers.map((u) => {
              const userInitials = u.full_name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() ?? '?';
              return (
                <div key={u.id} className="px-5 py-3.5 flex items-center gap-4">
                  <div className="relative group">
                    <Avatar className="w-8 h-8">
                      {u.avatar_url && <AvatarImage src={u.avatar_url} alt={u.full_name} />}
                      <AvatarFallback className="text-xs font-medium">{userInitials}</AvatarFallback>
                    </Avatar>
                    <button
                      onClick={() => { setAvatarTargetUser(u.user_id); adminAvatarInputRef.current?.click(); }}
                      className="absolute inset-0 flex items-center justify-center bg-foreground/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    ><Camera className="w-3 h-3 text-primary-foreground" /></button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{u.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {u.role === 'admin' ? 'Admin' : 'Headhunter'}
                  </span>
                  <div className="flex items-center gap-1">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className={`h-8 w-8 ${u.role === 'admin' ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`} title={u.role === 'admin' ? 'Remover admin' : 'Tornar admin'}>
                          <Shield className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-primary" />Alterar função</AlertDialogTitle>
                          <AlertDialogDescription>
                            {u.role === 'admin'
                              ? <>Remover <strong>Admin</strong> de <strong>{u.full_name}</strong>?</>
                              : <>Tornar <strong>{u.full_name}</strong> <strong>Admin</strong>?</>}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleToggleRole(u.user_id, u.role, u.full_name)}>Sim, alterar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Resetar senha" onClick={() => setResetPasswordUser({ userId: u.user_id, name: u.full_name })}>
                      <KeyRound className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-destructive" />Excluir usuário</AlertDialogTitle>
                          <AlertDialogDescription>O usuário <strong>{u.full_name}</strong> será removido permanentemente.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteUser(u.user_id, u.full_name)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Sim, excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Password Reset Dialog */}
        <AlertDialog open={!!resetPasswordUser} onOpenChange={(open) => { if (!open) { setResetPasswordUser(null); setNewPassword(''); } }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2"><KeyRound className="w-5 h-5 text-primary" />Resetar senha</AlertDialogTitle>
              <AlertDialogDescription>Defina uma nova senha para <strong>{resetPasswordUser?.name}</strong>.</AlertDialogDescription>
            </AlertDialogHeader>
            <Input type="password" placeholder="Nova senha (mín. 6 caracteres)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-2" />
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetPassword} disabled={newPassword.length < 6 || resetPassword.isPending}>Redefinir senha</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Ranking */}
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
                  <p className="text-xs text-muted-foreground">inscritos</p>
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
