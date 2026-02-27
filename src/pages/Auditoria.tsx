import { useEffect, useMemo, useState } from "react";
import { Download, RefreshCw, Search } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { auditoriaApi } from "@/lib/api";
import { useAuditEventDetail } from "@/hooks/useAuditEventDetail";
import { useAuditEvents } from "@/hooks/useAuditEvents";
import { useAuditExport } from "@/hooks/useAuditExport";
import type {
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

const statusBadgeVariant: Record<AuditStatus, string> = {
  SUCCESS: "bg-emerald-100 text-emerald-700 border-emerald-200",
  ERROR: "bg-red-100 text-red-700 border-red-200",
  DENIED: "bg-amber-100 text-amber-700 border-amber-200",
};

const maskIpAddress = (ipAddress: string | null) => {
  if (!ipAddress) return "-";
  const chunks = ipAddress.split(".");
  if (chunks.length !== 4) return ipAddress;
  return `${chunks[0]}.${chunks[1]}.***.***`;
};

export default function Auditoria() {
  const {
    filters,
    applyFilters,
    items,
    aggregations,
    hasNext,
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
  const { eventDetail, isLoading: isLoadingDetail, error: detailError } =
    useAuditEventDetail(selectedEventId);

  const [fromInput, setFromInput] = useState(toDateTimeLocal(filters.from));
  const [toInput, setToInput] = useState(toDateTimeLocal(filters.to));
  const [moduleInput, setModuleInput] = useState("");
  const [statusInput, setStatusInput] = useState("");
  const [requestIdInput, setRequestIdInput] = useState("");
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const options = await auditoriaApi.getFilterOptions(filters.from, filters.to);
        setFilterOptions(options);
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
        setRetentionEvents(response.items);
      } catch {
        setRetentionEvents([]);
      }
    };
    void loadRetentionEvents();
  }, [filters.from, filters.to]);

  useEffect(() => {
    if (!items.length) {
      setSelectedEventId(null);
      return;
    }
    if (selectedEventId && items.some((item) => item.id === selectedEventId)) return;
    setSelectedEventId(items[0].id);
  }, [items, selectedEventId]);

  const aggregationCards = useMemo(
    () => [
      {
        title: "Modulos mais frequentes",
        items: aggregations.byModule.slice(0, 3),
      },
      {
        title: "Status dos eventos",
        items: aggregations.byStatus.slice(0, 3),
      },
      {
        title: "Acoes mais executadas",
        items: aggregations.byAction.slice(0, 3),
      },
    ],
    [aggregations]
  );

  const onApplyFilters = () => {
    const nextFilters: AuditSearchQueryDto = {
      ...filters,
      from: new Date(fromInput).toISOString(),
      to: new Date(toInput).toISOString(),
      modules: moduleInput ? [moduleInput] : undefined,
      statuses: statusInput ? [statusInput as AuditStatus] : undefined,
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
    <MainLayout title="Auditoria" subtitle="Trilha de eventos com filtros e paginação por cursor.">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Filtros de consulta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
                      {module}
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
              <Alert className="border-emerald-200 bg-emerald-50">
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
                      <span>{item.key}</span>
                      <span className="font-medium">{item.count}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {error ? (
          <Alert className="border-red-200 bg-red-50">
            <AlertTitle>Erro ao consultar auditoria</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
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
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="py-2">Data</th>
                          <th className="py-2">Modulo</th>
                          <th className="py-2">Acao</th>
                          <th className="py-2">Entidade</th>
                          <th className="py-2">Status</th>
                          <th className="py-2">Ator</th>
                          <th className="py-2">Request ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr
                            key={item.id}
                            className={`border-b cursor-pointer hover:bg-muted/60 ${selectedEventId === item.id ? "bg-muted/80" : ""}`}
                            onClick={() => setSelectedEventId(item.id)}
                          >
                            <td className="py-2">{formatDateTime(item.createdAt)}</td>
                            <td className="py-2">{item.module}</td>
                            <td className="py-2">{item.action}</td>
                            <td className="py-2">{item.entityType || "-"}</td>
                            <td className="py-2">
                              <Badge className={statusBadgeVariant[item.status]}>{item.status}</Badge>
                            </td>
                            <td className="py-2">{item.actorName || "-"}</td>
                            <td className="py-2 font-mono text-xs">{item.requestId}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {hasNext ? (
                    <Button variant="outline" onClick={() => void fetchNextPage()} disabled={isLoadingMore}>
                      {isLoadingMore ? "Carregando..." : "Carregar mais"}
                    </Button>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalhe do evento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {isLoadingDetail ? (
                <p className="text-muted-foreground">Carregando detalhe...</p>
              ) : detailError ? (
                <p className="text-red-600">{detailError}</p>
              ) : !eventDetail ? (
                <p className="text-muted-foreground">Selecione um evento para visualizar detalhes.</p>
              ) : (
                <>
                  <div className="space-y-1">
                    <p><span className="font-medium">Request ID:</span> <span className="font-mono">{eventDetail.requestId}</span></p>
                    <p><span className="font-medium">Canal:</span> {eventDetail.sourceChannel}</p>
                    <p><span className="font-medium">IP:</span> {maskIpAddress(eventDetail.ipAddress)}</p>
                    <p><span className="font-medium">Hash:</span> <span className="font-mono text-xs">{eventDetail.eventHash}</span></p>
                    <p><span className="font-medium">Hash anterior:</span> <span className="font-mono text-xs">{eventDetail.prevEventHash || "-"}</span></p>
                    <p><span className="font-medium">Cadeia valida:</span> {eventDetail.chainValid ? "Sim" : "Nao"}</p>
                  </div>

                  {eventDetail.errorCode || eventDetail.errorMessage ? (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertTitle>Erro tecnico</AlertTitle>
                      <AlertDescription className="space-y-1">
                        <p>Codigo: {eventDetail.errorCode || "-"}</p>
                        <p>Mensagem: {eventDetail.errorMessage || "-"}</p>
                      </AlertDescription>
                    </Alert>
                  ) : null}

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
                </>
              )}
            </CardContent>
          </Card>
        </div>

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
                    <p><span className="font-medium">Policy version:</span> {event.policyVersion}</p>
                    <p><span className="font-medium">Janela:</span> {formatDateTime(event.windowStart)} ate {formatDateTime(event.windowEnd)}</p>
                    <p><span className="font-medium">Linhas afetadas:</span> {event.affectedRows}</p>
                    <p><span className="font-medium">Execution ID:</span> <span className="font-mono text-xs">{event.executionId}</span></p>
                    <p><span className="font-medium">Evidence hash:</span> <span className="font-mono text-xs">{event.evidenceHash}</span></p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
