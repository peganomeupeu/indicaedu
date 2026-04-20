import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plug, CheckCircle2, XCircle, Loader2, RefreshCw, PlayCircle } from "lucide-react";
import { useSyncLog, useTriggerSync, type SyncType } from "@/hooks/useSalesforceSync";
import { toast } from "sonner";

type ConnStatus = "unknown" | "connected" | "disconnected";

const indicatorButtons: Array<{ key: SyncType; label: string }> = [
  { key: "productivity", label: "Produtividade" },
  { key: "revenue", label: "Faturamento" },
  { key: "deadline", label: "Prazo" },
  { key: "cancellations", label: "Cancelamentos" },
];

const typeLabels: Record<string, string> = {
  productivity: "Produtividade",
  revenue: "Faturamento",
  deadline: "Prazo",
  cancellations: "Cancelamentos",
  test: "Teste de conexão",
  all: "Todos",
};

export default function AdminIntegrations() {
  const [connStatus, setConnStatus] = useState<ConnStatus>("unknown");
  const [testing, setTesting] = useState(false);
  const { data: logs = [], isLoading: loadingLogs, refetch } = useSyncLog();
  const triggerSync = useTriggerSync();

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await triggerSync.mutateAsync("test");
      if (res.ok) {
        setConnStatus("connected");
        toast.success("Conexão com Salesforce OK");
      } else {
        setConnStatus("disconnected");
        toast.error(res.error ?? "Falha ao conectar com Salesforce");
      }
    } catch (err) {
      setConnStatus("disconnected");
      toast.error("Erro: " + (err as Error).message);
    } finally {
      setTesting(false);
    }
  };

  const handleSync = async (type: SyncType) => {
    try {
      const res = await triggerSync.mutateAsync(type);
      if (res.ok) {
        toast.success(`Sincronização (${typeLabels[type] ?? type}) concluída`);
      } else {
        toast.error(res.error ?? `Falha em ${type}`);
      }
    } catch (err) {
      toast.error("Erro: " + (err as Error).message);
    }
  };

  const StatusBadge = () => {
    if (connStatus === "connected") {
      return (
        <Badge className="bg-success text-success-foreground gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> Conectado
        </Badge>
      );
    }
    if (connStatus === "disconnected") {
      return (
        <Badge variant="destructive" className="gap-1.5">
          <XCircle className="w-3.5 h-3.5" /> Desconectado
        </Badge>
      );
    }
    return <Badge variant="secondary">Não verificado</Badge>;
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Integrações</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie conexões com sistemas externos da Audens.
          </p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Plug className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Salesforce</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  OAuth 2.0 Password Flow · API v59.0
                </p>
              </div>
            </div>
            <StatusBadge />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleTest} disabled={testing} variant="outline">
                {testing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <PlayCircle className="w-4 h-4" />
                )}
                Testar Conexão
              </Button>
              <Button
                onClick={() => handleSync("all")}
                disabled={triggerSync.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {triggerSync.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Sincronizar Todos
              </Button>
            </div>

            <div>
              <p className="text-sm font-medium mb-2 text-foreground">Sincronização manual por indicador</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {indicatorButtons.map((b) => (
                  <Button
                    key={b.key}
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSync(b.key)}
                    disabled={triggerSync.isPending}
                  >
                    {b.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="text-xs text-muted-foreground bg-muted/50 rounded-md p-3">
              <strong>Configuração necessária:</strong> adicione os secrets{" "}
              <code className="text-foreground">SALESFORCE_CLIENT_ID</code>,{" "}
              <code className="text-foreground">SALESFORCE_CLIENT_SECRET</code>,{" "}
              <code className="text-foreground">SALESFORCE_USERNAME</code>,{" "}
              <code className="text-foreground">SALESFORCE_PASSWORD</code> e (opcional){" "}
              <code className="text-foreground">SALESFORCE_LOGIN_URL</code> nas Edge Functions.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Histórico de sincronizações</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </Button>
          </CardHeader>
          <CardContent>
            {loadingLogs ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma sincronização registrada ainda.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Registros</TableHead>
                      <TableHead>Erro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {new Date(l.started_at).toLocaleString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-sm">
                          {typeLabels[l.sync_type] ?? l.sync_type}
                        </TableCell>
                        <TableCell>
                          {l.status === "success" ? (
                            <Badge className="bg-success text-success-foreground">Sucesso</Badge>
                          ) : l.status === "error" ? (
                            <Badge variant="destructive">Erro</Badge>
                          ) : (
                            <Badge variant="secondary">{l.status}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm">{l.records_synced}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                          {l.error_message ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
