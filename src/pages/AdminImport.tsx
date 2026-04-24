import { useState, useCallback, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileSpreadsheet, Loader2, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { parseWorkbook, type ParsedWorkbook } from "@/lib/campaign/parser";
import { computeForMonth, type ConsultantMeta, type ConsultantPoints } from "@/lib/campaign/calculator";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function AdminImport() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedWorkbook | null>(null);
  const [parsing, setParsing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const queryClient = useQueryClient();

  const { data: metas = [], isLoading: loadingMetas } = useQuery({
    queryKey: ["campaign-consultants"],
    queryFn: async () => {
      const { data, error } = await supabase.from("campaign_consultants").select("*").order("consultant_name");
      if (error) throw error;
      return data as ConsultantMeta[];
    },
  });

  const computed = useMemo(() => {
    if (!parsed) return null;
    return computeForMonth(parsed, metas, month);
  }, [parsed, metas, month]);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.xlsx?$/i)) {
      toast.error("Selecione um arquivo .xlsx ou .xls");
      return;
    }
    setParsing(true);
    setFileName(file.name);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const result = parseWorkbook(wb);
      setParsed(result);
      result.warnings.forEach(w => toast.warning(w));
      toast.success(`Planilha "${file.name}" carregada`);
    } catch (err) {
      toast.error("Erro ao ler planilha: " + (err as Error).message);
      setParsed(null);
    } finally {
      setParsing(false);
    }
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const reset = () => {
    setFileName(null);
    setParsed(null);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!computed) throw new Error("Nada para salvar");
      const rows = computed.rows.filter(r => r.matched && r.profileId);

      // Wipe existing rows for the month/year, then insert fresh
      const tables = [
        "campaign_productivity",
        "campaign_revenue",
        "campaign_deadline_bonus",
        "campaign_cancellations",
      ] as const;
      for (const t of tables) {
        const { error } = await supabase.from(t).delete().eq("month", month).eq("year", year);
        if (error) throw error;
      }

      const prodPayload = rows.map(r => ({
        headhunter_id: r.profileId!,
        month, year,
        meta_percentage: r.productivity.metaPercentage,
        points: r.productivity.points,
      }));
      const revPayload = rows.map(r => ({
        headhunter_id: r.profileId!,
        month, year,
        revenue_audens: r.revenue.revenueAudens,
        revenue_one_outsourcing: r.revenue.revenueOne,
        points: r.revenue.points,
      }));
      const dlPayload = rows.map(r => ({
        headhunter_id: r.profileId!,
        month, year,
        vacancies_on_time: r.deadline.vacanciesOnTime,
        points: r.deadline.points,
      }));
      const cancPayload = rows.map(r => ({
        headhunter_id: r.profileId!,
        month, year,
        cancellations_as_responsible: r.cancellations.asResponsible,
        cancellations_as_finder: r.cancellations.asFinder,
        points: r.cancellations.points,
      }));

      if (prodPayload.length) {
        const { error } = await supabase.from("campaign_productivity").insert(prodPayload);
        if (error) throw error;
      }
      if (revPayload.length) {
        const { error } = await supabase.from("campaign_revenue").insert(revPayload);
        if (error) throw error;
      }
      if (dlPayload.length) {
        const { error } = await supabase.from("campaign_deadline_bonus").insert(dlPayload);
        if (error) throw error;
      }
      if (cancPayload.length) {
        const { error } = await supabase.from("campaign_cancellations").insert(cancPayload);
        if (error) throw error;
      }
      return rows.length;
    },
    onSuccess: (n) => {
      toast.success(`${n} consultores salvos para ${MONTHS[month - 1]}/${year}`);
      queryClient.invalidateQueries({ queryKey: ["campaign-ranking"] });
      queryClient.invalidateQueries({ queryKey: ["my-campaign"] });
      reset();
    },
    onError: (err) => toast.error("Erro: " + (err as Error).message),
  });

  const years = [year - 1, year, year + 1];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Importar Dados da Campanha</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Faça upload da planilha <strong>BASE DE DADOS.xlsx</strong> para calcular os indicadores do mês.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mês de referência</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (
                  <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {!parsed && (
          <Card>
            <CardContent className="pt-6">
              <label
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-lg p-12 cursor-pointer transition-colors ${
                  dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40"
                }`}
              >
                {parsing ? (
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                ) : (
                  <Upload className="w-10 h-10 text-muted-foreground" />
                )}
                <p className="text-sm font-medium text-foreground">
                  {parsing ? "Processando..." : "Arraste a planilha aqui ou clique para selecionar"}
                </p>
                <p className="text-xs text-muted-foreground">Formato: .xlsx · Processado localmente, não enviado ao servidor</p>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  disabled={parsing}
                />
              </label>
            </CardContent>
          </Card>
        )}

        {parsed && computed && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">{fileName}</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={reset}>
                  <X className="w-4 h-4" />
                  Trocar arquivo
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <Stat label="Consultores" value={computed.rows.length} />
                  <Stat label="Entrevistas" value={parsed.interviews.filter(r => r.mes === month).length} />
                  <Stat label="Faturamento" value={parsed.revenue.filter(r => r.mes === month).length} />
                  <Stat label="Placements" value={parsed.placements.filter(r => r.mes === month).length} />
                  <Stat label="Cancelamentos" value={parsed.cancellations.filter(r => r.mes === month).length} />
                </div>
              </CardContent>
            </Card>

            {computed.unknownNames.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertTitle>Consultores não cadastrados ({computed.unknownNames.length})</AlertTitle>
                <AlertDescription>
                  Estes nomes aparecem na planilha mas não estão na tabela de consultores. Não serão salvos:
                  <ul className="mt-2 list-disc pl-5 text-xs">
                    {computed.unknownNames.map(n => <li key={n}>{n}</li>)}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pré-visualização — {MONTHS[month - 1]}/{year}</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Consultor</TableHead>
                      <TableHead className="text-right">Produtiv.</TableHead>
                      <TableHead className="text-right">Faturam.</TableHead>
                      <TableHead className="text-right">Prazo</TableHead>
                      <TableHead className="text-right">Cancel.</TableHead>
                      <TableHead className="text-right font-bold">Total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {computed.rows.map((r) => (
                      <TableRow key={r.consultantName}>
                        <TableCell className="font-medium">{r.consultantName}</TableCell>
                        <TableCell className="text-right">{r.productivity.points}</TableCell>
                        <TableCell className="text-right">{r.revenue.points}</TableCell>
                        <TableCell className="text-right">{r.deadline.points}</TableCell>
                        <TableCell className="text-right text-destructive">-{r.cancellations.points}</TableCell>
                        <TableCell className="text-right font-bold">{r.total}</TableCell>
                        <TableCell>
                          {r.matched ? (
                            <Badge className="bg-success text-success-foreground gap-1"><CheckCircle2 className="w-3 h-3" /> OK</Badge>
                          ) : (
                            <Badge variant="destructive">não cadastrado</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={reset}>Cancelar</Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || loadingMetas}
                className="bg-primary hover:bg-primary/90"
              >
                {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirmar e Salvar
              </Button>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
