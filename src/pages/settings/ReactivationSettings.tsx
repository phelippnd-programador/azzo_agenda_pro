import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Download,
  Loader2,
  MessageSquareDashed,
  RefreshCcw,
  Shield,
  XCircle,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { PageErrorState } from '@/components/ui/page-states';
import { reactivationApi } from '@/lib/api/reactivation';
import { resolveUiError } from '@/lib/error-utils';
import { formatDateTime } from '@/lib/format';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type {
  ReactivationConfig,
  ReactivationCycle,
  ReactivationCycleStatus,
  OptOutRecord,
  OptOutSource,
} from '@/types/reactivation';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_TEMPLATES: Record<1 | 2 | 3, string> = {
  1: 'Ola, {nome}! Notamos que voce nao concluiu seu agendamento. Podemos te ajudar a marcar um horario?',
  2: 'Oi, {nome}! Ainda temos horarios disponiveis para voce. Que tal agendar agora?',
  3: '{nome}, esta e nossa ultima mensagem. Ficamos a disposicao sempre que quiser agendar.',
};

const CYCLE_STATUS_LABELS: Record<ReactivationCycleStatus, string> = {
  ACTIVE: 'Ativo',
  REACTIVATED: 'Reativado',
  CONVERTED: 'Convertido',
  CANCELLED: 'Cancelado',
  EXHAUSTED: 'Esgotado',
};

const CYCLE_STATUS_BADGE_CLASS: Record<ReactivationCycleStatus, string> = {
  ACTIVE: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300',
  REACTIVATED: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
  CONVERTED: 'border-green-200 bg-green-50 text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300',
  CANCELLED: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-500/20 dark:bg-slate-500/10 dark:text-slate-300',
  EXHAUSTED: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
};

const STAGE_LABELS: Record<string, string> = {
  SERVICE_SELECTION: 'Selecao de servico',
  PROFESSIONAL_SELECTION: 'Selecao de profissional',
  TIME_SELECTION: 'Selecao de horario',
  FINAL_REVIEW: 'Revisao final',
};

const OPT_OUT_SOURCE_LABELS: Record<OptOutSource, string> = {
  WHATSAPP_REPLY: 'WhatsApp',
  OWNER: 'Proprietario',
  SYSTEM: 'Sistema',
};

// ---------------------------------------------------------------------------
// Sub-section: Config Tab
// ---------------------------------------------------------------------------

function ConfigSection({
  config,
  onChange,
  onSave,
  isSaving,
}: {
  config: ReactivationConfig;
  onChange: (partial: Partial<ReactivationConfig>) => void;
  onSave: () => void;
  isSaving: boolean;
}) {
  const attempts = [1, 2, 3] as const;

  return (
    <div className="space-y-6">
      {/* Secao 1 — Ativar/desativar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquareDashed className="h-4 w-4 text-primary" />
            Reativacao automatica via WhatsApp
          </CardTitle>
          <CardDescription>
            Envia mensagens automaticas para clientes que iniciaram agendamento via WhatsApp e nao
            concluiram.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <button
              type="button"
              role="switch"
              aria-checked={config.enabled}
              onClick={() => onChange({ enabled: !config.enabled })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                config.enabled ? 'bg-primary' : 'bg-input'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg transition-transform ${
                  config.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-sm font-medium text-foreground">
              {config.enabled ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Secao 2 — Tempo de abandono */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tempo de espera para considerar abandono</CardTitle>
          <CardDescription>
            Minutos de inatividade na conversa antes de iniciar o ciclo de reativacao.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Label htmlFor="abandonment-delay" className="w-48 shrink-0 text-sm">
              Considerar abandono apos
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="abandonment-delay"
                type="number"
                min={15}
                max={120}
                step={5}
                className="w-24"
                value={config.abandonmentDelayMinutes}
                onChange={(e) =>
                  onChange({
                    abandonmentDelayMinutes: Math.min(
                      120,
                      Math.max(15, Number(e.target.value))
                    ),
                  })
                }
              />
              <span className="text-sm text-muted-foreground">minutos de inatividade</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Minimo: 15 min — Maximo: 120 min</p>
        </CardContent>
      </Card>

      {/* Secao 3 — Tentativas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tentativas de reativacao</CardTitle>
          <CardDescription>
            Quantas mensagens enviar e com qual intervalo apos o abandono.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-3">
            <Label htmlFor="max-attempts" className="shrink-0 text-sm">
              Numero de tentativas
            </Label>
            <Select
              value={String(config.maxAttempts)}
              onValueChange={(val) =>
                onChange({ maxAttempts: Number(val) as 1 | 2 | 3 })
              }
            >
              <SelectTrigger id="max-attempts" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {attempts.slice(0, config.maxAttempts).map((n) => {
              const key = `attempt${n}DelayDays` as keyof ReactivationConfig;
              return (
                <div key={n} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 text-sm text-muted-foreground">
                    {n}ª mensagem:
                  </span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      className="w-20"
                      value={config[key] as number}
                      onChange={(e) =>
                        onChange({ [key]: Math.min(30, Math.max(1, Number(e.target.value))) })
                      }
                    />
                    <span className="text-sm text-muted-foreground">dias apos o abandono</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Secao 4 — Janela de envio */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Janela de envio</CardTitle>
          <CardDescription>
            Intervalo de horario em que as mensagens podem ser disparadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">Enviar somente entre</span>
            <Input
              type="time"
              className="w-32"
              value={config.sendWindowStart}
              onChange={(e) => onChange({ sendWindowStart: e.target.value })}
            />
            <span className="text-sm text-muted-foreground">e</span>
            <Input
              type="time"
              className="w-32"
              value={config.sendWindowEnd}
              onChange={(e) => onChange({ sendWindowEnd: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Secao 5 — Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Templates de mensagem</CardTitle>
          <CardDescription>
            Mensagem enviada em cada tentativa. Use{' '}
            <Badge variant="secondary" className="text-xs">{'{nome}'}</Badge> para personalizar com
            o nome do cliente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/20 dark:bg-amber-500/10">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Nao mencione servicos especificos ou valores financeiros nas mensagens.
            </p>
          </div>

          {([1, 2, 3] as const).slice(0, config.maxAttempts).map((n) => {
            const key = `templateAttempt${n}` as keyof ReactivationConfig;
            return (
              <div key={n} className="space-y-2">
                <Label htmlFor={`template-${n}`} className="text-sm">
                  Template da {n}ª mensagem
                </Label>
                <Textarea
                  id={`template-${n}`}
                  rows={3}
                  placeholder={DEFAULT_TEMPLATES[n]}
                  value={(config[key] as string | null) ?? ''}
                  onChange={(e) => onChange({ [key]: e.target.value || null })}
                />
                <p className="text-xs text-muted-foreground">
                  Deixe em branco para usar o template padrao do sistema.
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={isSaving} className="gap-2">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <RefreshCcw className="h-4 w-4" />
              Salvar configuracoes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-section: Cycles Tab
// ---------------------------------------------------------------------------

function CyclesSection() {
  const [cycles, setCycles] = useState<ReactivationCycle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ReactivationCycleStatus | 'ALL'>('ALL');
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const loadCycles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await reactivationApi.getCycles({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        size: 50,
      });
      setCycles(data.items);
    } catch (err) {
      setError(resolveUiError(err, 'Nao foi possivel carregar os ciclos.').message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCycles();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setIsCancelling(true);
    try {
      await reactivationApi.cancelCycle(cancelTarget);
      toast.success('Ciclo cancelado com sucesso.');
      setCancelTarget(null);
      void loadCycles();
    } catch (err) {
      toast.error(resolveUiError(err, 'Nao foi possivel cancelar o ciclo.').message);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Label className="text-sm">Filtrar por status</Label>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as ReactivationCycleStatus | 'ALL')}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value="ACTIVE">Ativo</SelectItem>
            <SelectItem value="REACTIVATED">Reativado</SelectItem>
            <SelectItem value="CONVERTED">Convertido</SelectItem>
            <SelectItem value="CANCELLED">Cancelado</SelectItem>
            <SelectItem value="EXHAUSTED">Esgotado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : error ? (
        <PageErrorState
          title="Nao foi possivel carregar os ciclos"
          description={error}
          action={{ label: 'Tentar novamente', onClick: loadCycles }}
        />
      ) : cycles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
          <MessageSquareDashed className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium text-foreground">Nenhum ciclo encontrado</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Os ciclos aparecem aqui assim que clientes abandonarem o fluxo de agendamento.
          </p>
        </div>
      ) : (
        <Card className="overflow-hidden border-border/60">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Etapa do abandono</TableHead>
                  <TableHead>Proxima tentativa</TableHead>
                  <TableHead className="text-center">Tentativa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {cycles.map((cycle) => (
                  <TableRow key={cycle.id}>
                    <TableCell className="font-medium">{cycle.clientName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {STAGE_LABELS[cycle.lastStage] ?? cycle.lastStage}
                    </TableCell>
                    <TableCell className="text-sm">
                      {cycle.nextAttemptAt ? formatDateTime(cycle.nextAttemptAt) : '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{cycle.nextAttemptNumber}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={CYCLE_STATUS_BADGE_CLASS[cycle.status]}
                      >
                        {CYCLE_STATUS_LABELS[cycle.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {cycle.status === 'ACTIVE' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 text-xs text-destructive hover:text-destructive"
                          onClick={() => setCancelTarget(cycle.id)}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Cancelar
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <AlertDialog open={!!cancelTarget} onOpenChange={(open) => { if (!open && !isCancelling) setCancelTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar ciclo de reativacao?</AlertDialogTitle>
            <AlertDialogDescription>
              Nenhuma mensagem adicional sera enviada para este cliente. Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              disabled={isCancelling}
              onClick={handleCancel}
            >
              {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Cancelar ciclo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-section: Opt-outs Tab
// ---------------------------------------------------------------------------

function OptOutsSection() {
  const [records, setRecords] = useState<OptOutRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOptOuts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await reactivationApi.getOptOuts(0, 100);
      setRecords(data.items);
    } catch (err) {
      setError(resolveUiError(err, 'Nao foi possivel carregar os opt-outs.').message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadOptOuts();
  }, []);

  const handleExportCsv = () => {
    if (records.length === 0) return;
    const header = 'Nome,Data do opt-out,Origem';
    const rows = records.map(
      (r) =>
        `"${r.clientNameMasked}","${formatDateTime(r.optOutAt)}","${OPT_OUT_SOURCE_LABELS[r.source]}"`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'opt-outs-whatsapp.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Clientes com opt-out</p>
          <p className="text-sm text-muted-foreground">
            Clientes que solicitaram nao receber mensagens. Apenas o proprio cliente pode reverter.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={records.length === 0}
          onClick={handleExportCsv}
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-500/20 dark:bg-blue-500/10">
        <div className="flex items-start gap-2">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-blue-700 dark:text-blue-300" />
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Os nomes estao mascarados por privacidade. Nenhuma mensagem sera enviada para clientes
            desta lista.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : error ? (
        <PageErrorState
          title="Nao foi possivel carregar os opt-outs"
          description={error}
          action={{ label: 'Tentar novamente', onClick: loadOptOuts }}
        />
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-10 text-center">
          <Shield className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium text-foreground">Nenhum opt-out registrado</p>
        </div>
      ) : (
        <Card className="overflow-hidden border-border/60">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Data do opt-out</TableHead>
                  <TableHead>Origem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.clientId}>
                    <TableCell className="font-medium">{record.clientNameMasked}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(record.optOutAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {OPT_OUT_SOURCE_LABELS[record.source]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: ReactivationConfig = {
  enabled: false,
  abandonmentDelayMinutes: 30,
  maxAttempts: 3,
  attempt1DelayDays: 2,
  attempt2DelayDays: 4,
  attempt3DelayDays: 7,
  sendWindowStart: '08:00',
  sendWindowEnd: '20:00',
  templateAttempt1: null,
  templateAttempt2: null,
  templateAttempt3: null,
};

export default function ReactivationSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [config, setConfig] = useState<ReactivationConfig>(DEFAULT_CONFIG);
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'OWNER') {
      navigate('/unauthorized', { replace: true });
      return;
    }

    const load = async () => {
      setIsConfigLoading(true);
      setConfigError(null);
      try {
        const data = await reactivationApi.getConfig();
        setConfig(data);
      } catch (err) {
        setConfigError(
          resolveUiError(err, 'Nao foi possivel carregar as configuracoes de reativacao.').message
        );
      } finally {
        setIsConfigLoading(false);
      }
    };

    void load();
  }, [user, navigate]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await reactivationApi.updateConfig(config);
      toast.success('Configuracoes de reativacao salvas com sucesso.');
    } catch (err) {
      toast.error(resolveUiError(err, 'Nao foi possivel salvar as configuracoes.').message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MainLayout
      title="Reativacao via WhatsApp"
      subtitle="Configure o fluxo automatico de reativacao de agendamentos abandonados no WhatsApp."
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge
            variant="outline"
            className={
              config.enabled
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300'
                : 'border-slate-200 bg-slate-50 text-slate-600'
            }
          >
            {config.enabled ? 'Reativacao ativa' : 'Reativacao inativa'}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Somente OWNER
          </Badge>
        </div>

        <Tabs defaultValue="config" className="space-y-6">
          <div className="-mx-1 overflow-x-auto pb-1">
            <TabsList className="flex h-auto min-w-max gap-2 rounded-2xl border bg-muted/30 p-1.5">
              <TabsTrigger value="config" className="shrink-0 whitespace-nowrap">
                Configuracoes
              </TabsTrigger>
              <TabsTrigger value="cycles" className="shrink-0 whitespace-nowrap">
                Ciclos Ativos
              </TabsTrigger>
              <TabsTrigger value="optouts" className="shrink-0 whitespace-nowrap">
                Opt-outs
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="config">
            {isConfigLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-48 w-full rounded-xl" />
              </div>
            ) : configError ? (
              <PageErrorState
                title="Nao foi possivel carregar as configuracoes"
                description={configError}
                action={{
                  label: 'Tentar novamente',
                  onClick: () => window.location.reload(),
                }}
              />
            ) : (
              <ConfigSection
                config={config}
                onChange={(partial) => setConfig((prev) => ({ ...prev, ...partial }))}
                onSave={handleSave}
                isSaving={isSaving}
              />
            )}
          </TabsContent>

          <TabsContent value="cycles">
            <CyclesSection />
          </TabsContent>

          <TabsContent value="optouts">
            <OptOutsSection />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
