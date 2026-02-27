import { useState } from 'react';
import { Trophy, Medal, Award } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { useRanking } from '@/hooks/useReferrals';
import { POINTS_CONFIG } from '@/types/referral';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

const podiumIcons = [Trophy, Medal, Award];

const Ranking = () => {
  const [month, setMonth] = useState<number>(currentMonth);
  const [year, setYear] = useState<number>(currentYear);
  const { data: ranking = [], isLoading } = useRanking(month, year);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Ranking de Indicações</h1>
          <p className="text-sm text-muted-foreground mt-1">Os melhores headhunters da Audens Edu</p>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
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
              <span className="text-sm text-muted-foreground">Indicação: <strong className="text-foreground">{POINTS_CONFIG.indicado} pts</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-warning" />
              <span className="text-sm text-muted-foreground">Inscrição: <strong className="text-foreground">{POINTS_CONFIG.inscrito} pts</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-sm text-muted-foreground">Matrícula: <strong className="text-foreground">{POINTS_CONFIG.matriculado} pts</strong></span>
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
            {ranking.length >= 3 && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                {ranking.slice(0, 3).map((user, i) => {
                  const Icon = podiumIcons[i];
                  const order = i === 0 ? 'order-2' : i === 1 ? 'order-1' : 'order-3';
                  return (
                    <div key={user.rank} className={`${order} bg-card rounded-xl border border-border shadow-card p-4 text-center ${i === 0 ? 'ring-2 ring-primary shadow-elevated' : ''}`}>
                      <div className={`mx-auto flex items-center justify-center w-12 h-12 rounded-full mb-3 ${i === 0 ? 'gradient-primary' : 'bg-muted'}`}>
                        <Icon className={`w-5 h-5 ${i === 0 ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                      </div>
                      <p className="text-xs text-muted-foreground">#{user.rank}</p>
                      <p className="text-sm font-bold text-foreground mt-1 truncate">{user.name}</p>
                      <p className="text-xl font-bold text-primary mt-1">{user.points}</p>
                      <p className="text-xs text-muted-foreground">pontos</p>
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground">{user.referrals} indicações · {user.enrolled} matrículas</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">Ranking Completo</h2>
              </div>
              <div className="divide-y divide-border">
                {ranking.map((user) => (
                  <div key={user.rank} className="px-5 py-3.5 flex items-center gap-4">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold shrink-0 ${user.rank <= 3 ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {user.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.referrals} indicações · {user.enrolled} matrículas</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">{user.points}</p>
                      <p className="text-xs text-muted-foreground">pontos</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Ranking;
