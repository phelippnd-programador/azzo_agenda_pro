import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { formatDateTime } from "@/lib/format";
import { Download, Eye, RefreshCw, Search } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { auditoriaApi } from "@/lib/api";
import { useAuditEventDetail } from "@/hooks/useAuditEventDetail";
import { useAuditEvents } from "@/hooks/useAuditEvents";
import { useAuditExport } from "@/hooks/useAuditExport";
import {
  actionMeta,
  buildDiffEntries,
  entityMeta,
  maskIpAddress,
  moduleLabel,
  statusBadgeClass,
  statusLabel,
  toDateTimeLocal,
} from "@/lib/audit-helpers";
import { AuditEventDetailDialog } from "@/components/auditoria/AuditEventDetailDialog";
import { AUDIT_MODULES, AUDIT_STATUSES } from "@/types/auditoria";
import type {
  AuditFiltersOptionsDto,
  AuditModule,
  AuditRetentionEventDto,
  AuditSearchQueryDto,
  AuditStatus,
} from "@/types/auditoria";
import { getEnv } from "@/config/env";

const isAuditModule = (value: string): value is AuditModule =>
  (AUDIT_MODULES as readonly string[]).includes(value);

const isAuditStatus = (value: string): value is AuditStatus =>
  (AUDIT_STATUSES as readonly string[]).includes(value);

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
  const [moduleInput, setModuleInput] = useState<AuditModule | "">("");
  const [statusInput, setStatusInput] = useState<AuditStatus | "">("");
  const [actionInput, setActionInput] = useState("");
  const [entityTypeInput, setEntityTypeInput] = useState("");
  const [requestIdInput, setRequestIdInput] = useState("");
  const [ipInput, setIpInput] = useState("");
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
    [aggregations],
  );

  const diffEntries = useMemo(() => buildDiffEntries(eventDetail), [eventDetail]);

  const openEventDetail = (eventId: string) => {
    setSelectedEventId(eventId);
    setIsDetailOpen(true);
  };

  const onApplyFilters = () => {
    const fromDate = new Date(fromInput);
    const toDate = new Date(toInput);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) return;
    const nextFilters: AuditSearchQueryDto = {
      ...filters,
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      modules: moduleInput ? [moduleInput] : undefined,
      statuses: statusInput ? [statusInput] : undefined,
      actions: actionInput ? [actionInput] : undefined,
      entityTypes: entityTypeInput ? [entityTypeInput] : undefined,
      requestId: requestIdInput || undefined,
      ip: ipInput || undefined,
      text: searchInput || undefined,
      cursor: undefined,
    };
    applyFilters(nextFilters);
  };

  const onExport = async (format: "CSV" | "JSON") => {
    await exportEvents({ ...filters, format });
  };

  return (
    <MainLayout title="Auditoria" subtitle="Trilha de eventos com paginacao por cursor (keyset).">
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button asChild variant="outline">
            <Link to="/auditoria/lgpd">Abrir painel LGPD</Link>
          </Button>
        </div>

        {/* Filter card */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros de consulta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Periodo inicial</p>
                <Input
                  type="datetime-local"
                  value={fromInput}
                  onChange={(e) => setFromInput(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Periodo final</p>
                <Input
                  type="datetime-local"
                  value={toInput}
                  onChange={(e) => setToInput(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Modulo</p>
                <Select
                  value={moduleInput || "all"}
                  onValueChange={(value) => setModuleInput(value === "all" || isAuditModule(value) ? (value === "all" ? "" : value) : "")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {filterOptions?.modules.map((module) => (
                      <SelectItem key={module} value={module}>
                        {moduleLabel(module)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Status</p>
                <Select
                  value={statusInput || "all"}
                  onValueChange={(value) => setStatusInput(value === "all" || isAuditStatus(value) ? (value === "all" ? "" : value) : "")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {filterOptions?.statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Acao</p>
                <Select value={actionInput || "all"} onValueChange={(value) => setActionInput(value === "all" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {filterOptions?.actions.map((action) => (
                      <SelectItem key={action} value={action}>
                        {actionMeta(action).label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Registro afetado</p>
                <Select value={entityTypeInput || "all"} onValueChange={(value) => setEntityTypeInput(value === "all" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {filterOptions?.entityTypes.map((entityType) => (
                      <SelectItem key={entityType} value={entityType}>
                        {entityMeta(entityType).label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Input
                placeholder="Filtrar por request_id"
                value={requestIdInput}
                onChange={(e) => setRequestIdInput(e.target.value)}
              />
              <Input
                placeholder="Filtrar por IP (ex: 192.168)"
                value={ipInput}
                onChange={(e) => setIpInput(e.target.value)}
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
                <AlertDescription className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <a
                      href={`${(getEnv("VITE_API_URL") || import.meta.env.VITE_API_URL as string | undefined)?.trim().replace(/\/$/, "") || "http://localhost:8080/api/v1"}${auditoriaApi.downloadExport(lastExport.exportId)}`}
                      download
                      className="inline-flex items-center gap-1 rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      <Download className="h-3 w-3" />
                      Baixar arquivo ({lastExport.format})
                    </a>
                  </div>
                  <p>Expira em: {formatDateTime(lastExport.expiresAt)}</p>
                  <p className="break-all">
                    Checksum: <span className="font-mono">{lastExport.checksumSha256}</span>
                  </p>
                </AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>

        {/* Aggregation cards */}
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

        {/* Events table */}
        <Card>
          <CardHeader>
            <CardTitle>Eventos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando eventos...</p>
            ) : !items.length ? (
              <p className="text-sm text-muted-foreground">
                Nenhum evento encontrado no periodo informado.
              </p>
            ) : (
              <TooltipProvider delayDuration={150}>
                <div className="space-y-2 md:hidden">
                  {items.map((item) => (
                    <div key={item.id} className="rounded-xl border border-border/70 bg-card p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 space-y-0.5">
                          <p className="text-sm font-medium text-foreground">
                            {actionMeta(item.action).label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {moduleLabel(item.module)} • {formatDateTime(item.createdAt)}
                          </p>
                        </div>
                        <Badge className={statusBadgeClass[item.status]}>
                          {statusLabel(item.status)}
                        </Badge>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <p className="truncate">Registro: {entityMeta(item.entityType).label}</p>
                        <p className="truncate">Ator: {item.actorName || item.actorUserId || "-"}</p>
                        <p className="truncate font-mono">IP: {maskIpAddress(item.ipAddress)}</p>
                        <p className="truncate font-mono">Req: {item.requestId}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 gap-1.5"
                        onClick={() => openEventDetail(item.id)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Ver detalhe
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <table className="min-w-[1100px] w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="py-2">Data</th>
                        <th className="py-2">Modulo</th>
                        <th className="py-2">Acao</th>
                        <th className="py-2">Registro afetado</th>
                        <th className="py-2">Status</th>
                        <th className="py-2">Ator</th>
                        <th className="py-2">IP</th>
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
                            <Badge className={statusBadgeClass[item.status]}>
                              {statusLabel(item.status)}
                            </Badge>
                          </td>
                          <td className="py-2">{item.actorName || item.actorUserId || "-"}</td>
                          <td className="py-2 font-mono text-xs text-muted-foreground">
                            {maskIpAddress(item.ipAddress)}
                          </td>
                          <td className="py-2 font-mono text-xs">{item.requestId}</td>
                          <td className="py-2 text-right">
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-primary hover:bg-primary/8"
                              onClick={() => openEventDetail(item.id)}
                              aria-label="Ver detalhe do evento"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Paginacao por cursor: {hasNext ? "ha proxima pagina" : "fim da listagem"}
                    </p>
                    <p className="break-all font-mono text-xs text-muted-foreground">
                      cursor: {nextCursor || "-"}
                    </p>
                  </div>
                  {hasNext ? (
                    <Button
                      variant="outline"
                      onClick={() => void fetchNextPage()}
                      disabled={isLoadingMore}
                      className="w-full sm:w-auto"
                    >
                      {isLoadingMore ? "Carregando..." : "Carregar mais"}
                    </Button>
                  ) : null}
                </div>
              </TooltipProvider>
            )}
          </CardContent>
        </Card>

        {/* Retention events */}
        <Card>
          <CardHeader>
            <CardTitle>Eventos de retencao e expurgo</CardTitle>
          </CardHeader>
          <CardContent>
            {!retentionEvents.length ? (
              <p className="text-sm text-muted-foreground">
                Nenhum evento de retencao no periodo.
              </p>
            ) : (
              <div className="space-y-2">
                {retentionEvents.map((event) => (
                  <div key={event.id} className="rounded-md border p-3 text-sm">
                    <p>
                      <span className="font-medium">Versao da politica:</span>{" "}
                      {event.policyVersion}
                    </p>
                    <p>
                      <span className="font-medium">Janela:</span>{" "}
                      {formatDateTime(event.windowStart)} ate {formatDateTime(event.windowEnd)}
                    </p>
                    <p>
                      <span className="font-medium">Linhas afetadas:</span> {event.affectedRows}
                    </p>
                    <p>
                      <span className="font-medium">ID da execucao:</span>{" "}
                      <span className="font-mono text-xs">{event.executionId}</span>
                    </p>
                    <p>
                      <span className="font-medium">Hash da evidencia:</span>{" "}
                      <span className="font-mono text-xs">{event.evidenceHash}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AuditEventDetailDialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        eventDetail={eventDetail}
        isLoadingDetail={isLoadingDetail}
        detailError={detailError}
        diffEntries={diffEntries}
      />
    </MainLayout>
  );
}
