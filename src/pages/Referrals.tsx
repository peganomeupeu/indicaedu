import { AppLayout } from '@/components/AppLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { mockReferrals } from '@/data/mockData';
import { INTEREST_LABELS } from '@/types/referral';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Referrals = () => {
  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Minhas Indicações</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhe o status de todas as suas indicações
          </p>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Indicado</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Curso</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Interesse</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Data</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mockReferrals.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-foreground">{r.referred_name}</p>
                      <p className="text-xs text-muted-foreground">{r.referred_company} · {r.referred_position}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-foreground">{r.course}</td>
                    <td className="px-5 py-3.5 text-sm text-foreground">{INTEREST_LABELS[r.interest_level]}</td>
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

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {mockReferrals.map((r) => (
            <div key={r.id} className="bg-card rounded-xl border border-border shadow-card p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{r.referred_name}</p>
                  <p className="text-xs text-muted-foreground">{r.referred_company}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
              <p className="text-xs text-muted-foreground mb-1">{r.course}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(r.created_at), "dd MMM yyyy", { locale: ptBR })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Referrals;
