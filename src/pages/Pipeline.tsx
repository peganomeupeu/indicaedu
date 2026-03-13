import { useState, DragEvent, useMemo } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useAllReferrals, useUpdateReferralStatus } from '@/hooks/useReferrals';
import { useAllUsers } from '@/hooks/useAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { ReferralStatus, STATUS_LABELS, PIPELINE_ORDER, PIPELINE_COLORS } from '@/types/referral';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { GripVertical, User, Building, Calendar, UserCheck } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Pipeline = () => {
  const { isAdmin } = useAuth();
  const { data: referrals = [], isLoading } = useAllReferrals();
  const { data: allUsers = [] } = useAllUsers();
  const updateStatus = useUpdateReferralStatus();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [filterHeadhunter, setFilterHeadhunter] = useState<string>('all');
  const [filterAttendant, setFilterAttendant] = useState<string>('all');

  const adminUsers = allUsers.filter(u => u.role === 'admin');
  const uniqueHeadhunters = useMemo(
    () => [...new Set(referrals.map(r => r.headhunter_name).filter(Boolean))],
    [referrals]
  );

  const filtered = useMemo(() => {
    return referrals.filter(r => {
      if (filterHeadhunter !== 'all' && r.headhunter_name !== filterHeadhunter) return false;
      if (filterAttendant !== 'all') {
        if (filterAttendant === 'none') {
          if ((r as any).attended_by) return false;
        } else {
          if ((r as any).attended_by !== filterAttendant) return false;
        }
      }
      return true;
    });
  }, [referrals, filterHeadhunter, filterAttendant]);

  const columns = PIPELINE_ORDER.map(status => ({
    status,
    label: STATUS_LABELS[status],
    items: filtered.filter(r => r.status === status),
  }));

  const handleDragStart = (e: DragEvent, id: string) => {
    if (!isAdmin) return;
    e.dataTransfer.setData('text/plain', id);
    setDraggedId(id);
  };

  const handleDragOver = (e: DragEvent, status: string) => {
    if (!isAdmin) return;
    e.preventDefault();
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: DragEvent, newStatus: string) => {
    if (!isAdmin) return;
    e.preventDefault();
    setDragOverColumn(null);
    setDraggedId(null);
    const id = e.dataTransfer.getData('text/plain');
    const referral = referrals.find(r => r.id === id);
    if (!referral || referral.status === newStatus) return;
    updateStatus.mutate(
      { id, status: newStatus },
      {
        onSuccess: () => toast.success(`Status atualizado para "${STATUS_LABELS[newStatus as ReferralStatus]}"`),
        onError: (err) => toast.error('Erro: ' + (err as Error).message),
      }
    );
  };

  return (
    <AppLayout>
      <div className="max-w-full mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Pipeline de Indicações</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAdmin ? 'Arraste os cards para atualizar o status' : 'Visualize o funil de indicações'}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Select value={filterHeadhunter} onValueChange={setFilterHeadhunter}>
            <SelectTrigger className="w-[200px] h-9 text-sm"><SelectValue placeholder="Headhunter" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os headhunters</SelectItem>
              {uniqueHeadhunters.map(name => (
                <SelectItem key={name} value={name!}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterAttendant} onValueChange={setFilterAttendant}>
            <SelectTrigger className="w-[200px] h-9 text-sm"><SelectValue placeholder="Atendente" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os atendentes</SelectItem>
              <SelectItem value="none">Sem atendente</SelectItem>
              {adminUsers.map(u => (
                <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-200px)]">
            {columns.map(col => (
              <div
                key={col.status}
                className={`
                  flex-shrink-0 w-[280px] bg-muted/30 rounded-xl border border-border
                  transition-all duration-200
                  ${dragOverColumn === col.status ? 'bg-primary/5 border-primary/30 scale-[1.01]' : ''}
                `}
                onDragOver={(e) => handleDragOver(e, col.status)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.status)}
              >
                <div className={`px-4 py-3 border-b border-border border-t-4 rounded-t-xl ${PIPELINE_COLORS[col.status as ReferralStatus]}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
                    <span className="text-xs font-bold bg-card text-muted-foreground px-2 py-0.5 rounded-full border border-border">
                      {col.items.length}
                    </span>
                  </div>
                </div>
                <div className="p-2 space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
                  {col.items.map(referral => (
                    <div
                      key={referral.id}
                      draggable={isAdmin}
                      onDragStart={(e) => handleDragStart(e, referral.id)}
                      className={`
                        bg-card rounded-lg border border-border p-3 shadow-card
                        transition-all duration-200 hover:shadow-elevated
                        ${isAdmin ? 'cursor-grab active:cursor-grabbing' : ''}
                        ${draggedId === referral.id ? 'opacity-40 scale-95' : ''}
                        animate-fade-in
                      `}
                    >
                      <div className="flex items-start gap-2">
                        {isAdmin && <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 mt-0.5 shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{referral.referred_name}</p>
                          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                            <Building className="w-3 h-3 shrink-0" />
                            <span className="truncate">{referral.referred_position}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                            <User className="w-3 h-3 shrink-0" />
                            <span className="truncate">{referral.headhunter_name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3 shrink-0" />
                            <span>{format(new Date(referral.created_at), "dd MMM yyyy", { locale: ptBR })}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                            <UserCheck className="w-3 h-3 shrink-0" />
                            <span className="truncate">{referral.course}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {col.items.length === 0 && (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      Nenhuma indicação
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Pipeline;
