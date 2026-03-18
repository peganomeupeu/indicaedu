import { useState } from 'react';
import { Trophy } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { useRanking } from '@/hooks/useReferrals';
import { POINTS_CONFIG } from '@/types/referral';
import { HeadhunterDetailSheet } from '@/components/HeadhunterDetailSheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

const PODIUM_STYLES = [
  {
    border: 'border-[hsl(45,93%,47%)]',
    bg: 'bg-[hsl(45,93%,97%)]',
    label: '🥇',
    shadow: 'shadow-[0_4px_20px_-4px_hsl(45,93%,47%,0.3)]',
    avatarRing: 'ring-2 ring-[hsl(45,93%,47%)]',
  },
  {
    border: 'border-[hsl(0,0%,70%)]',
    bg: 'bg-[hsl(0,0%,97%)]',
    label: '🥈',
    shadow: 'shadow-[0_4px_16px_-4px_hsl(0,0%,50%,0.2)]',
    avatarRing: 'ring-2 ring-[hsl(0,0%,75%)]',
  },
  {
    border: 'border-[hsl(25,60%,52%)]',
    bg: 'bg-[hsl(25,60%,97%)]',
    label: '🥉',
    shadow: 'shadow-[0_4px_16px_-4px_hsl(25,60%,52%,0.2)]',
    avatarRing: 'ring-2 ring-[hsl(25,60%,52%)]',
  },
];

const getInitials = (name: string) =>
  name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() ?? '?';

const Ranking = () => {
  const [month, setMonth] = useState<string>(String(currentMonth));
  const [year, setYear] = useState<string>(String(currentYear));
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const monthNum = month === 'all' ? undefined : Number(month);
  const yearNum = year === 'all' ? undefined : Number(year);

  const { data: ranking = [], isLoading } = useRanking(monthNum, yearNum);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Ranking de Indicações</h1>
          <p className="text-sm text-muted-foreground mt-1">Os melhores headhunters da Audens Edu</p>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os meses</SelectItem>
              {MONTHS.map((m, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {YEARS.map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-card p-5 mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">Como funcionam os pontos</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-info" />
              <span className="text-sm text-muted-foreground">Indicado: <strong className="text-foreground">{POINTS_CONFIG.indicado} pts</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-warning" />
              <span className="text-sm text-muted-foreground">Qualificado: <strong className="text-foreground">{POINTS_CONFIG.qualificado} pts</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-sm text-muted-foreground">Inscrito: <strong className="text-foreground">{POINTS_CONFIG.inscrito} pts</strong></span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : ranking.length === 0 ? (
          <div className="bg-card rounded-xl border border-border shadow-card p-8 text-center">
            <p className="text-muted-foreground">Nenhuma indicação registrada neste período.</p>
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {ranking.length >= 3 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[1, 0, 2].map((idx) => {
                  const user = ranking[idx];
                  if (!user) return null;
                  const style = PODIUM_STYLES[idx];
                  const initials = getInitials(user.name);
                  const isFirst = idx === 0;

                  return (
                    <div
                      key={user.rank}
                      onClick={() => setSelectedUser(user)}
                      className={`
                        relative rounded-xl border-2 ${style.border} ${style.bg} ${style.shadow}
                        p-5 text-center transition-all duration-300 hover:scale-[1.02] cursor-pointer
                        animate-fade-in
                        ${isFirst ? 'sm:order-2 sm:-mt-2' : idx === 1 ? 'sm:order-1' : 'sm:order-3'}
                      `}
                    >
                      {isFirst && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl animate-scale-in">
                          👑
                        </div>
                      )}
                      <div className="flex flex-col items-center gap-3 mt-1">
                        <Avatar className={`w-16 h-16 ${style.avatarRing}`}>
                          {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.name} />}
                          <AvatarFallback className="text-lg font-bold bg-muted text-muted-foreground">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-base font-bold text-foreground truncate max-w-[160px]">{user.name}</p>
                          <p className="text-2xl font-extrabold text-primary mt-1">{user.points}</p>
                          <p className="text-xs text-muted-foreground">pontos</p>
                        </div>
                        <div className="w-full pt-3 border-t border-border/50 flex justify-center gap-4">
                          <div className="text-center">
                            <p className="text-sm font-semibold text-foreground">{user.referrals}</p>
                            <p className="text-xs text-muted-foreground">indicações</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-semibold text-foreground">{user.qualified}</p>
                            <p className="text-xs text-muted-foreground">qualificados</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-semibold text-foreground">{user.enrolled}</p>
                            <p className="text-xs text-muted-foreground">inscritos</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Full Ranking List */}
            <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">Ranking Completo</h2>
              </div>
              <div className="divide-y divide-border">
                {ranking.map((user) => {
                  const initials = getInitials(user.name);
                  return (
                    <div
                      key={user.rank}
                      onClick={() => setSelectedUser(user)}
                      className="px-5 py-3.5 flex items-center gap-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    >
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold shrink-0 ${user.rank <= 3 ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        {user.rank}
                      </div>
                      <Avatar className="w-8 h-8 shrink-0">
                        {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.name} />}
                        <AvatarFallback className="text-xs font-medium">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.referrals} indicações · {user.qualified} qualificados · {user.enrolled} inscritos</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">{user.points}</p>
                        <p className="text-xs text-muted-foreground">pontos</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      <HeadhunterDetailSheet
        open={!!selectedUser}
        onOpenChange={(open) => { if (!open) setSelectedUser(null); }}
        user={selectedUser}
      />
    </AppLayout>
  );
};

export default Ranking;
