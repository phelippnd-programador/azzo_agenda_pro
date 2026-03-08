import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Download, Eye, RefreshCw, Search } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { auditoriaApi } from "@/lib/api";
import { useAuditEventDetail } from "@/hooks/useAuditEventDetail";
import { useAuditEvents } from "@/hooks/useAuditEvents";
import { useAuditExport } from "@/hooks/useAuditExport";
import type {
  AuditEventDetailDto,
  AuditFiltersOptionsDto,
  AuditRetentionEventDto,
  AuditSearchQueryDto,
  AuditStatus,
} from "@/types/auditoria";

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));

const toDateTimeLocal = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hour = String(parsed.getHours()).padStart(2, "0");
  const minute = String(parsed.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
};

const statusBadgeClass: Record<AuditStatus, string> = {
  SUCCESS: "bg-primary/10 text-primary border-primary/30",
  ERROR: "bg-destructive/10 text-destructive border-destructive/30",
  DENIED: "bg-muted text-muted-foreground border-border",
};

const maskIpAddress = (ipAddress: string | null) => {
  if (!ipAddress) return "-";
  const chunks = ipAddress.split(".");
  if (chunks.length !== 4) return ipAddress;
  return `${chunks[0]}.${chunks[1]}.***.***`;
};

const toComparableString = (value: unknown) => JSON.stringify(value ?? null);

type AuditUiMeta = {
  label: string;
  description: string;
};

const ACTION_META: Record<string, AuditUiMeta> = {
  RBAC_PERMISSION_UPDATE: {
    label: "Permissao de acesso atualizada",
    description: "Uma permissao de acesso do sistema foi alterada.",
  },
  AUTH_LOGIN: { label: "Login", description: "Autenticacao de usuario no sistema." },
  AUTH_REFRESH: { label: "Renovacao de sessao", description: "Renovacao do token de acesso." },
  AUTH_LOGIN_MFA_REQUIRED: { label: "MFA obrigatorio", description: "Login bloqueado aguardando codigo MFA." },
  AUTH_LOGIN_MFA_DENIED: { label: "MFA recusado", description: "Codigo MFA invalido no login." },
  AUTH_MFA_ENABLE: { label: "MFA ativado", description: "Ativacao de autenticacao multifator." },
  AUTH_MFA_DISABLE: { label: "MFA desativado", description: "Desativacao de autenticacao multifator." },
  PROFESSIONAL_CREATE: { label: "Criacao de profissional", description: "Cadastro de novo profissional." },
  PROFESSIONAL_UPDATE: { label: "Atualizacao de profissional", description: "Edicao de dados do profissional." },
  PROFESSIONAL_DELETE: { label: "Remocao de profissional", description: "Exclusao de profissional." },
  PROFESSIONAL_PASSWORD_RESET: { label: "Reset de senha", description: "Geracao de senha temporaria para profissional." },
  CLIENT_CREATE: { label: "Criacao de cliente", description: "Cadastro de novo cliente." },
  CLIENT_UPDATE: { label: "Atualizacao de cliente", description: "Edicao de dados do cliente." },
  CLIENT_DELETE: { label: "Remocao de cliente", description: "Exclusao de cliente." },
  FINANCE_TRANSACTION_CREATE: {
    label: "Lancamento financeiro criado",
    description: "Um novo lancamento financeiro foi registrado.",
  },
  FINANCE_TRANSACTION_UPDATE: {
    label: "Lancamento financeiro atualizado",
    description: "Um lancamento financeiro foi alterado.",
  },
  FINANCE_TRANSACTION_DELETE: {
    label: "Lancamento financeiro removido",
    description: "Um lancamento financeiro foi removido.",
  },
  FISCAL_INVOICE_AUTHORIZE: {
    label: "Nota fiscal autorizada",
    description: "A nota fiscal foi enviada e autorizada pelo provedor fiscal.",
  },
  APPOINTMENT_CREATE: {
    label: "Agendamento criado",
    description: "Um novo agendamento foi criado.",
  },
  APPOINTMENT_UPDATE: {
    label: "Agendamento atualizado",
    description: "Um agendamento foi alterado.",
  },
  APPOINTMENT_CANCEL: {
    label: "Agendamento cancelado",
    description: "Um agendamento foi cancelado.",
  },
  APPOINTMENT_DELETE: {
    label: "Agendamento removido",
    description: "Um agendamento foi removido.",
  },
  LGPD_REQUEST_CREATE: { label: "Solicitacao LGPD criada", description: "Nova solicitacao de titular registrada." },
  LGPD_REQUEST_STATUS_UPDATE: { label: "Status LGPD atualizado", description: "Atualizacao de status de solicitacao LGPD." },
};

const MODULE_META: Record<string, string> = {
  RBAC: "Permissoes de acesso",
};

const ENTITY_META: Record<string, AuditUiMeta> = {
  ENTITY: { label: "Permissao/Menu", description: "Alteracao de permissao, menu ou configuracao de acesso." },
  USER_AUTH: { label: "Autenticacao", description: "Eventos de autenticacao de usuario." },
  PROFESSIONAL: { label: "Profissional", description: "Dados e operacoes de profissionais." },
  CLIENT: { label: "Cliente", description: "Dados e operacoes de clientes." },
  LGPD_REQUEST: { label: "Solicitacao LGPD", description: "Atendimento de requisicoes LGPD." },
  AUDIT_READ: { label: "Consulta de auditoria", description: "Acesso aos eventos e filtros da auditoria." },
  FINANCE_TRANSACTION: { label: "Lancamento financeiro", description: "Dados e operacoes de lancamentos financeiros." },
  APPOINTMENT: { label: "Agendamento", description: "Dados e operacoes de agendamentos." },
};

const humanizeToken = (value: string) =>
  value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const actionMeta = (action: string): AuditUiMeta =>
  ACTION_META[action] || {
    label: humanizeToken(action),
    description: "Evento registrado pelo sistema para controle e rastreabilidade.",
  };

const entityMeta = (entityType: string | null): AuditUiMeta => {
  if (!entityType) {
    return { label: "-", description: "Evento sem entidade vinculada." };
  }
  return ENTITY_META[entityType] || {
    label: humanizeToken(entityType),
    description: "Tipo de registro impactado por este evento.",
  };
};

const moduleLabel = (module: string) => MODULE_META[module] || humanizeToken(module);
const statusLabel = (status: string) =>
  ({
    SUCCESS: "Sucesso",
    ERROR: "Erro",
    DENIED: "Negado",
  }[status] || humanizeToken(status));

const buildDiffEntries = (detail: AuditEventDetailDto | null) => {
  if (!detail) return [];
  const before = detail.before ?? {};
  const after = detail.after ?? {};
  const allKeys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).sort();

  return allKeys
    .map((key) => {
      const previous = before[key];
      const current = after[key];
      const changed = toComparableString(previous) !== toComparableString(current);
      return {
        key,
        previous,
        current,
        changed,
      };
    })
    .filter((entry) => entry.changed);
};

export default function Auditoria() {
  const {
    filters,
    applyFilters,
    items,
    aggregations,
    hasNext,
    nextCursor,
    isLoading,
    isLoadingMore,
    error,
    fetchNextPage,
    refetch,
  } = useAuditEvents();
  const { isExporting, lastExport, exportEvents } = useAuditExport();

  const [filterOptions, setFilterOptions] = useState<AuditFiltersOptionsDto | null>(null);
  const [retentionEvents, setRetentionEvents] = useState<AuditRetentionEventDto[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { eventDetail, isLoading: isLoadingDetail, error: detailError } =
    useAuditEventDetail(selectedEventId);

  const [fromInput, setFromInput] = useState(toDateTimeLocal(filters.from));
  const [toInput, setToInput] = useState(toDateTimeLocal(filters.to));
  const [moduleInput, setModuleInput] = useState("");
  const [statusInput, setStatusInput] = useState("");
  const [actionInput, setActionInput] = useState("");
  const [entityTypeInput, setEntityTypeInput] = useState("");
  const [requestIdInput, setRequestIdInput] = useState("");
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const options = await auditoriaApi.getFilterOptions(filters.from, filters.to);
        setFilterOptions({
          modules: Array.isArray(options?.modules) ? options.modules : [],
          statuses: Array.isArray(options?.statuses) ? options.statuses : [],
          actions: Array.isArray(options?.actions) ? options.actions : [],
          entityTypes: Array.isArray(options?.entityTypes) ? options.entityTypes : [],
          sourceChannels: Array.isArray(options?.sourceChannels) ? options.sourceChannels : [],
        });
      } catch {
        setFilterOptions(null);
      }
    };
    void loadFilterOptions();
  }, [filters.from, filters.to]);

  useEffect(() => {
    const loadRetentionEvents = async () => {
      try {
        const response = await auditoriaApi.listRetentionEvents({
          from: filters.from,
          to: filters.to,
          limit: 20,
        });
        setRetentionEvents(Array.isArray(response?.items) ? response.items : []);
      } catch {
        setRetentionEvents([]);
      }
    };
    void loadRetentionEvents();
  }, [filters.from, filters.to]);

  const aggregationCards = useMemo(
    () => [
      {
        title: "Modulos mais frequentes",
        items: aggregations.byModule.slice(0, 3),
        formatLabel: (key: string) => moduleLabel(key),
      },
      {
        title: "Status dos eventos",
        items: aggregations.byStatus.slice(0, 3),
        formatLabel: (key: string) => statusLabel(key),
      },
      {
        title: "Acoes mais executadas",
        items: aggregations.byAction.slice(0, 3),
        formatLabel: (key: string) => actionMeta(key).label,
      },
    ],
    [aggregations]
  );

  const diffEntries = useMemo(() => buildDiffEntries(eventDetail), [eventDetail]);

  const openEventDetail = (eventId: string) => {
    setSelectedEventId(eventId);
    setIsDetailOpen(true);
  };

  const onApplyFilters = () => {
    const fromDate = new Date(fromInput);
    const toDate = new Date(toInput);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      return;
    }

    const nextFilters: AuditSearchQueryDto = {
      ...filters,
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      modules: moduleInput ? [moduleInput] : undefined,
      statuses: statusInput ? [statusInput as AuditStatus] : undefined,
      actions: actionInput ? [actionInput] : undefined,
      entityTypes: entityTypeInput ? [entityTypeInput] : undefined,
      requestId: requestIdInput || undefined,
      text: searchInput || undefined,
      cursor: undefined,
    };
    applyFilters(nextFilters);
  };

  const onExport = async (format: "CSV" | "JSON") => {
    await exportEvents({
      ...filters,
      format,
    });
  };

  return (
    <MainLayout title="Auditoria" subtitle="Trilha de eventos com paginacao por cursor (keyset).">
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button asChild variant="outline">
            <Link to="/auditoria/lgpd">Abrir painel LGPD</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros de consulta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Periodo inicial</p>
                <Input type="datetime-local" value={fromInput} onChange={(e) => setFromInput(e.target.value)} />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Periodo final</p>
                <Input type="datetime-local" value={toInput} onChange={(e) => setToInput(e.target.value)} />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Modulo</p>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={moduleInput}
                  onChange={(e) => setModuleInput(e.target.value)}
                >
                  <option value="">Todos</option>
                  {filterOptions?.modules.map((module) => (
                    <option key={module} value={module}>
                      {moduleLabel(module)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Status</p>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value)}
                >
                  <option value="">Todos</option>
                  {filterOptions?.statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Acao</p>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={actionInput}
                  onChange={(e) => setActionInput(e.target.value)}
                >
                  <option value="">Todas</option>
                  {filterOptions?.actions.map((action) => (
                    <option key={action} value={action}>
                      {actionMeta(action).label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Registro afetado</p>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={entityTypeInput}
                  onChange={(e) => setEntityTypeInput(e.target.value)}
                >
                  <option value="">Todas</option>
                  {filterOptions?.entityTypes.map((entityType) => (
                    <option key={entityType} value={entityType}>
                      {entityMeta(entityType).label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                placeholder="Filtrar por request_id"
                value={requestIdInput}
                onChange={(e) => setRequestIdInput(e.target.value)}
              />
              <Input
                placeholder="Busca textual (acao, erro, metadata)"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={onApplyFilters}>
                <Search className="w-4 h-4 mr-2" />
                Aplicar filtros
              </Button>
              <Button variant="outline" onClick={() => void refetch()} disabled={isLoading}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
              <Button variant="outline" onClick={() => void onExport("CSV")} disabled={isExporting}>
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
              <Button variant="outline" onClick={() => void onExport("JSON")} disabled={isExporting}>
                <Download className="w-4 h-4 mr-2" />
                Exportar JSON
              </Button>
            </div>
            {lastExport ? (
              <Alert>
                <AlertTitle>Exportacao pronta</AlertTitle>
                <AlertDescription className="text-xs">
                  <p>Download: {lastExport.downloadUrl}</p>
                  <p>Expira em: {formatDateTime(lastExport.expiresAt)}</p>
                  <p>Checksum: {lastExport.checksumSha256}</p>
                </AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-3 xl:grid-cols-3">
          {aggregationCards.map((card) => (
            <Card key={card.title}>
              <CardHeader>
                <CardTitle className="text-base">{card.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {!card.items.length ? (
                  <p className="text-sm text-muted-foreground">Sem dados no periodo.</p>
                ) : (
                  card.items.map((item) => (
                    <div key={item.key} className="flex items-center justify-between text-sm">
                      <span>{card.formatLabel(item.key)}</span>
                      <span className="font-medium">{item.count}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Erro ao consultar auditoria</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Eventos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando eventos...</p>
            ) : !items.length ? (
              <p className="text-sm text-muted-foreground">Nenhum evento encontrado no periodo informado.</p>
            ) : (
              <TooltipProvider delayDuration={150}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="py-2">Data</th>
                        <th className="py-2">Modulo</th>
                        <th className="py-2">Acao</th>
                        <th className="py-2">Registro afetado</th>
                        <th className="py-2">Status</th>
                        <th className="py-2">Ator</th>
                        <th className="py-2">Request ID</th>
                        <th className="py-2 text-right">Detalhe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} className="border-b hover:bg-muted/40">
                          <td className="py-2">{formatDateTime(item.createdAt)}</td>
                          <td className="py-2">{moduleLabel(item.module)}</td>
                          <td className="py-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help underline decoration-dotted underline-offset-2">
                                  {actionMeta(item.action).label}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>{actionMeta(item.action).description}</TooltipContent>
                            </Tooltip>
                          </td>
                          <td className="py-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help underline decoration-dotted underline-offset-2">
                                  {entityMeta(item.entityType).label}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>{entityMeta(item.entityType).description}</TooltipContent>
                            </Tooltip>
                          </td>
                          <td className="py-2">
                            <Badge className={statusBadgeClass[item.status]}>{item.status}</Badge>
                          </td>
                          <td className="py-2">{item.actorName || "-"}</td>
                          <td className="py-2 font-mono text-xs">{item.requestId}</td>
                          <td className="py-2 text-right">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => openEventDetail(item.id)}
                              aria-label="Ver detalhe do evento"
                              title="Ver detalhe"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    Paginacao por cursor: {hasNext ? "ha proxima pagina" : "fim da listagem"}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    cursor: {nextCursor || "-"}
                  </p>
                  {hasNext ? (
                    <Button variant="outline" onClick={() => void fetchNextPage()} disabled={isLoadingMore}>
                      {isLoadingMore ? "Carregando..." : "Carregar mais"}
                    </Button>
                  ) : null}
                </div>
              </TooltipProvider>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Eventos de retencao e expurgo</CardTitle>
          </CardHeader>
          <CardContent>
            {!retentionEvents.length ? (
              <p className="text-sm text-muted-foreground">Nenhum evento de retencao no periodo.</p>
            ) : (
              <div className="space-y-2">
                {retentionEvents.map((event) => (
                  <div key={event.id} className="rounded-md border p-3 text-sm">
                    <p><span className="font-medium">Versao da politica:</span> {event.policyVersion}</p>
                    <p><span className="font-medium">Janela:</span> {formatDateTime(event.windowStart)} ate {formatDateTime(event.windowEnd)}</p>
                    <p><span className="font-medium">Linhas afetadas:</span> {event.affectedRows}</p>
                    <p><span className="font-medium">ID da execucao:</span> <span className="font-mono text-xs">{event.executionId}</span></p>
                    <p><span className="font-medium">Hash da evidencia:</span> <span className="font-mono text-xs">{event.evidenceHash}</span></p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhe do evento</DialogTitle>
            <DialogDescription>
              Dados completos, metadados tecnicos e diff de alteracao.
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetail ? (
            <p className="text-sm text-muted-foreground">Carregando detalhe...</p>
          ) : detailError ? (
            <Alert variant="destructive">
              <AlertTitle>Erro ao carregar detalhe</AlertTitle>
              <AlertDescription>{detailError}</AlertDescription>
            </Alert>
          ) : !eventDetail ? (
            <p className="text-sm text-muted-foreground">Nenhum evento selecionado.</p>
          ) : (
            <div className="space-y-4 text-sm">
              <div className="grid gap-2 md:grid-cols-2">
                <p><span className="font-medium">Data/hora do evento:</span> {formatDateTime(eventDetail.createdAt)}</p>
                <p><span className="font-medium">Modulo:</span> {moduleLabel(eventDetail.module)}</p>
                <p><span className="font-medium">Acao:</span> {actionMeta(eventDetail.action).label}</p>
                <p><span className="font-medium">Registro afetado:</span> {entityMeta(eventDetail.entityType).label}</p>
                <p><span className="font-medium">Request ID:</span> <span className="font-mono">{eventDetail.requestId}</span></p>
                <p><span className="font-medium">Canal:</span> {eventDetail.sourceChannel}</p>
                <p><span className="font-medium">IP:</span> {maskIpAddress(eventDetail.ipAddress)}</p>
                <p><span className="font-medium">Hash:</span> <span className="font-mono text-xs">{eventDetail.eventHash}</span></p>
                <p><span className="font-medium">Hash anterior:</span> <span className="font-mono text-xs">{eventDetail.prevEventHash || "-"}</span></p>
                <p><span className="font-medium">Cadeia valida:</span> {eventDetail.chainValid ? "Sim" : "Nao"}</p>
              </div>

              {eventDetail.errorCode || eventDetail.errorMessage ? (
                <Alert variant="destructive">
                  <AlertTitle>Erro tecnico</AlertTitle>
                  <AlertDescription className="space-y-1">
                    <p>Codigo: {eventDetail.errorCode || "-"}</p>
                    <p>Mensagem: {eventDetail.errorMessage || "-"}</p>
                  </AlertDescription>
                </Alert>
              ) : null}

              <div>
                <p className="font-medium mb-2">Diff de alteracoes</p>
                {!diffEntries.length ? (
                  <p className="text-muted-foreground">Sem diferencas entre before e after.</p>
                ) : (
                  <div className="space-y-2">
                    {diffEntries.map((entry) => (
                      <div key={entry.key} className="rounded-md border p-2">
                        <p className="font-medium">{entry.key}</p>
                        <p className="text-xs text-muted-foreground">Antes: {JSON.stringify(entry.previous)}</p>
                        <p className="text-xs text-muted-foreground">Depois: {JSON.stringify(entry.current)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-3 lg:grid-cols-3">
                <div>
                  <p className="font-medium mb-1">Before</p>
                  <pre className="rounded-md bg-muted p-2 text-xs overflow-auto">
                    {JSON.stringify(eventDetail.before, null, 2)}
                  </pre>
                </div>
                <div>
                  <p className="font-medium mb-1">After</p>
                  <pre className="rounded-md bg-muted p-2 text-xs overflow-auto">
                    {JSON.stringify(eventDetail.after, null, 2)}
                  </pre>
                </div>
                <div>
                  <p className="font-medium mb-1">Metadata</p>
                  <pre className="rounded-md bg-muted p-2 text-xs overflow-auto">
                    {JSON.stringify(eventDetail.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
