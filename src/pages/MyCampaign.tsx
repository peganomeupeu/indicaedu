import { useState } from 'react';
import { Trophy, Target, DollarSign, Clock, XCircle, Users } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { useMyCampaign } from '@/hooks/useCampaign';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

const ORDINALS = ['', '1º', '2º', '3º', '4º', '5º', '6º', '7º', '8º', '9º', '10º'];

interface IndicatorDetailProps {
  title: string;
  icon: React.ReactNode;
  color: string;
  points: number;
  maxPoints: number;
  children: React.ReactNode;
}

function IndicatorDetail({ title, icon, color, points, maxPoints, children }: IndicatorDetailProps) {
  const pct = maxPoints > 0 ? Math.min(100, Math.max(0, (Math.abs(points) / maxPoints) * 100)) : 0;
  const isNegative = points < 0;

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
            {icon}
          </div>
          {title}
          <span className={`ml-auto text-lg font-bold ${isNegative ? 'text-destructive' : 'text-primary'}`}>
            {isNegative ? '' : '+'}{points} pts
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={pct} className="h-2" />
        <div className="text-sm text-muted-foreground space-y-1">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

const MyCampaign = () => {
  const [month, setMonth] = useState(String(currentMonth));
  const [year, setYear] = useState(String(currentYear));

  const monthNum = Number(month);
  const yearNum = Number(year);

  const { data, isLoading } = useMyCampaign(monthNum, yearNum);

  const indicators = data ? [
    { label: 'Produtividade', pts: data.productivity?.points ?? 0, color: 'hsl(var(--primary))' },
    { label: 'Faturamento', pts: data.revenue?.points ?? 0, color: 'hsl(var(--success))' },
    { label: 'Prazo', pts: data.deadline?.points ?? 0, color: 'hsl(var(--info))' },
    { label: 'Cancelamentos', pts: data.cancellations?.points ?? 0, color: 'hsl(var(--destructive))' },
    { label: 'Indicações', pts: Number(data.referral_points), color: 'hsl(var(--warning))' },
  ] : [];

  const totalAbsolute = indicators.reduce((s, i) => s + Math.abs(i.pts), 0);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Trophy className="w-6 h-6 text-primary" />
            Minha Campanha
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Seus indicadores de performance na campanha</p>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {YEARS.map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : !data ? (
          <div className="bg-card rounded-xl border border-border shadow-card p-8 text-center">
            <p className="text-muted-foreground">Nenhum dado registrado para este período.</p>
          </div>
        ) : (
          <>
            {/* Main rank card */}
            <Card className="shadow-card mb-6 bg-gradient-to-br from-card to-secondary/30">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-2xl font-bold mx-auto">
                      {data.rank > 0 ? (ORDINALS[data.rank] ?? `${data.rank}º`) : '—'}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Sua posição</p>
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <p className="text-4xl font-extrabold text-primary">{data.total_points}</p>
                    <p className="text-sm text-muted-foreground">pontos totais em {MONTHS[monthNum - 1]} {yearNum}</p>
                  </div>
                </div>

                {/* Stacked bar */}
                {totalAbsolute > 0 && (
                  <div className="mt-6">
                    <p className="text-xs text-muted-foreground mb-2">Composição dos pontos</p>
                    <div className="flex rounded-full overflow-hidden h-4">
                      {indicators.filter(i => i.pts > 0).map((i) => (
                        <div
                          key={i.label}
                          style={{ width: `${(i.pts / totalAbsolute) * 100}%`, backgroundColor: i.color }}
                          className="transition-all duration-500"
                          title={`${i.label}: ${i.pts} pts`}
                        />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {indicators.map(i => (
                        <div key={i.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: i.color }} />
                          {i.label}: <span className="font-medium text-foreground">{i.pts} pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Indicator detail cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <IndicatorDetail
                title="Produtividade"
                icon={<Target className="w-4 h-4 text-primary-foreground" />}
                color="bg-primary"
                points={data.productivity?.points ?? 0}
                maxPoints={300}
              >
                <p>Meta atingida: <strong className="text-foreground">{data.productivity?.meta_percentage ?? 0}%</strong></p>
                <p className="text-xs">Proporcional de 200 pts para 100% da meta (máx. 300 pts)</p>
              </IndicatorDetail>

              <IndicatorDetail
                title="Faturamento"
                icon={<DollarSign className="w-4 h-4 text-primary-foreground" />}
                color="bg-success"
                points={data.revenue?.points ?? 0}
                maxPoints={150}
              >
                <p>Receita Audens: <strong className="text-foreground">R$ {(data.revenue?.revenue_audens ?? 0).toLocaleString('pt-BR')}</strong></p>
                <p>Receita One/Outsourcing: <strong className="text-foreground">R$ {(data.revenue?.revenue_one_outsourcing ?? 0).toLocaleString('pt-BR')}</strong></p>
              </IndicatorDetail>

              <IndicatorDetail
                title="Vagas no Prazo"
                icon={<Clock className="w-4 h-4 text-primary-foreground" />}
                color="bg-info"
                points={data.deadline?.points ?? 0}
                maxPoints={200}
              >
                <p>Vagas fechadas no prazo: <strong className="text-foreground">{data.deadline?.vacancies_on_time ?? 0}</strong></p>
                <p className="text-xs">Cada vaga no prazo = 20 pontos</p>
              </IndicatorDetail>

              <IndicatorDetail
                title="Cancelamentos"
                icon={<XCircle className="w-4 h-4 text-destructive-foreground" />}
                color="bg-destructive"
                points={data.cancellations?.points ?? 0}
                maxPoints={50}
              >
                <p>Como responsável: <strong className="text-foreground">{data.cancellations?.cancellations_as_responsible ?? 0}</strong> (−6 pts cada)</p>
                <p>Como finder: <strong className="text-foreground">{data.cancellations?.cancellations_as_finder ?? 0}</strong> (−4 pts cada)</p>
              </IndicatorDetail>

              <IndicatorDetail
                title="Indicações"
                icon={<Users className="w-4 h-4 text-primary-foreground" />}
                color="bg-warning"
                points={Number(data.referral_points)}
                maxPoints={100}
              >
                <p>Pontos gerados pelas suas indicações neste mês</p>
                <p className="text-xs">Indicado: 10 pts · Qualificado: +20 pts · Inscrito: +20 pts</p>
              </IndicatorDetail>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default MyCampaign;
