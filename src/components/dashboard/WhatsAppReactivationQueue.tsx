import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  CalendarClock,
  Filter,
  MessageSquareText,
  RefreshCcw,
  Search,
  UserRound,
} from "lucide-react";
import { reportsApi } from "@/lib/api";
import { formatDateOnly, formatDateTime } from "@/lib/format";
import type {
  DashboardWhatsAppReactivationQueueItem,
  DashboardWhatsAppReactivationQueueResponse,
} from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_OPTIONS = [
  { label: "Todos os status", value: "ALL" },
  { label: "Ativos", value: "ACTIVE" },
  { label: "Reativados", value: "REACTIVATED" },
  { label: "Convertidos", value: "CONVERTED" },
  { label: "Cancelados", value: "CANCELLED" },
  { label: "Encerrados", value: "EXHAUSTED" },
] as const;

const STAGE_OPTIONS = [
  { label: "Todas as etapas", value: "ALL" },
  { label: "Servico", value: "SERVICE_SELECTION" },
  { label: "Profissional", value: "PROFESSIONAL_SELECTION" },
  { label: "Horario", value: "TIME_SELECTION" },
  { label: "Revisao final", value: "FINAL_REVIEW" },
] as const;

const PAGE_SIZE_OPTIONS = [
  { label: "12 por pagina", value: "12" },
  { label: "24 por pagina", value: "24" },
  { label: "50 por pagina", value: "50" },
] as const;

const emptyQueue: DashboardWhatsAppReactivationQueueResponse = {
  startDate: "",
  endDate: "",
  statusFilter: "ALL",
  stageFilter: "ALL",
  searchTerm: "",
  limit: 12,
  pageIndex: 0,
  pageSize: 12,
  totalItems: 0,
  totalPages: 0,
  items: [],
  exceptionItems: [],
};

const toInputDate = (value: Date) => value.toISOString().split("T")[0];

const createDefaultDateRange = () => {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - 29);
  return {
    from: toInputDate(start),
    to: toInputDate(end),
  };
};

const maskPhone = (value?: string | null) => {
  if (!value) return "-";
  const digits = value.replace(/\D/g, "");
  if (digits.length < 8) return value;
  return digits.replace(/(\d{2})(\d{2,3})(\d{0,3})(\d{4})$/, (_m, ddi, ddd, prefix, suffix) => {
    const maskedPrefix = prefix ? `${prefix[0]}${"*".repeat(Math.max(prefix.length - 1, 0))}` : "";
    return `+${ddi} (${ddd}) ${maskedPrefix}-${suffix}`;
  });
};

const getStatusBadgeClass = (status?: string | null) => {
  switch (status) {
    case "ACTIVE":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "REACTIVATED":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "CONVERTED":
      return "border-blue-200 bg-blue-50 text-blue-800";
    case "CANCELLED":
      return "border-rose-200 bg-rose-50 text-rose-800";
    case "EXHAUSTED":
      return "border-slate-200 bg-slate-100 text-slate-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
};

const getStageBadgeClass = (stage?: string | null) => {
  switch (stage) {
    case "SERVICE_SELECTION":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "PROFESSIONAL_SELECTION":
      return "border-orange-200 bg-orange-50 text-orange-800";
    case "TIME_SELECTION":
      return "border-blue-200 bg-blue-50 text-blue-800";
    case "FINAL_REVIEW":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
};

const buildContextSummary = (item: DashboardWhatsAppReactivationQueueItem) => {
  const parts = [item.lastServiceName, item.lastProfessionalName, item.lastRequestedDate ? formatDateOnly(item.lastRequestedDate) : null, item.lastRequestedTime]
    .filter(Boolean);
  return parts.length > 0 ? parts.join(" • ") : "Contexto ainda incompleto";
};

const getManualInterventionLabel = (reason?: string | null) => {
  switch (reason) {
    case "STAGE_RETRY_LIMIT":
      return "Fluxo travado";
    default:
      return "Intervencao manual";
  }
};

export function WhatsAppReactivationQueue() {
  const defaultRange = useMemo(() => createDefaultDateRange(), []);
  const [fromInput, setFromInput] = useState(defaultRange.from);
  const [toInput, setToInput] = useState(defaultRange.to);
  const [statusInput, setStatusInput] = useState("ALL");
  const [stageInput, setStageInput] = useState("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [pageSizeInput, setPageSizeInput] = useState("12");
  const [activeFilters, setActiveFilters] = useState({
    from: defaultRange.from,
    to: defaultRange.to,
    status: "ALL",
    stage: "ALL",
    search: "",
    pageIndex: 0,
    pageSize: 12,
  });
  const [queue, setQueue] = useState<DashboardWhatsAppReactivationQueueResponse>(emptyQueue);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    reportsApi
      .getAbandonment({
        from: activeFilters.from,
        to: activeFilters.to,
        status: activeFilters.status,
        stage: activeFilters.stage,
        search: activeFilters.search,
        pageIndex: activeFilters.pageIndex,
        pageSize: activeFilters.pageSize,
      })
      .then((data) => {
        if (!mounted) return;
        setQueue(data);
        setHasError(false);
      })
      .catch(() => {
        if (!mounted) return;
        setQueue(emptyQueue);
        setHasError(true);
      })
      .finally(() => {
        if (!mounted) return;
        setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [activeFilters]);

  const totalPages = Math.max(queue.totalPages ?? 0, 0);
  const currentPage = (queue.pageIndex ?? activeFilters.pageIndex) + 1;
  const hasItems = queue.items.length > 0;

  const applyFilters = () => {
    setActiveFilters({
      from: fromInput,
      to: toInput,
      status: statusInput,
      stage: stageInput,
      search: searchInput.trim(),
      pageIndex: 0,
      pageSize: Number(pageSizeInput),
    });
  };

  const clearFilters = () => {
    const resetRange = createDefaultDateRange();
    setFromInput(resetRange.from);
    setToInput(resetRange.to);
    setStatusInput("ALL");
    setStageInput("ALL");
    setSearchInput("");
    setPageSizeInput("12");
    setActiveFilters({
      from: resetRange.from,
      to: resetRange.to,
      status: "ALL",
      stage: "ALL",
      search: "",
      pageIndex: 0,
      pageSize: 12,
    });
  };

  const reloadPage = () => {
    setActiveFilters((current) => ({ ...current }));
  };

  const handlePreviousPage = () => {
    setActiveFilters((current) => ({
      ...current,
      pageIndex: Math.max(current.pageIndex - 1, 0),
    }));
  };

  const handleNextPage = () => {
    setActiveFilters((current) => ({
      ...current,
      pageIndex: totalPages > 0 ? Math.min(current.pageIndex + 1, totalPages - 1) : current.pageIndex + 1,
    }));
  };

  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <MessageSquareText className="h-5 w-5 text-slate-700" />
              Fila operacional de abandonos
            </CardTitle>
            <CardDescription>
              Casos recentes para o time acompanhar, reativar ou assumir manualmente no chat.
            </CardDescription>
          </div>

          <div className="text-sm text-muted-foreground lg:text-right">
            <div>
              {queue.totalItems ?? 0} ciclo(s) encontrado(s)
            </div>
            <div>
              Pagina {Math.max(currentPage, 1)} de {Math.max(totalPages, 1)}
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Data inicial</p>
            <Input type="date" value={fromInput} onChange={(event) => setFromInput(event.target.value)} />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Data final</p>
            <Input type="date" value={toInput} onChange={(event) => setToInput(event.target.value)} />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Status</p>
            <Select value={statusInput} onValueChange={setStatusInput}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Etapa</p>
            <Select value={stageInput} onValueChange={setStageInput}>
              <SelectTrigger>
                <SelectValue placeholder="Etapa" />
              </SelectTrigger>
              <SelectContent>
                {STAGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Busca</p>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Cliente, telefone, servico..."
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Pagina</p>
            <Select value={pageSizeInput} onValueChange={setPageSizeInput}>
              <SelectTrigger>
                <SelectValue placeholder="Tamanho" />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={applyFilters}>
            <Filter className="mr-2 h-4 w-4" />
            Aplicar filtros
          </Button>
          <Button variant="outline" onClick={clearFilters}>
            Limpar filtros
          </Button>
          <Button variant="outline" onClick={reloadPage} disabled={isLoading}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="rounded-xl border p-4">
                <Skeleton className="mb-3 h-5 w-48" />
                <Skeleton className="mb-2 h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : queue.items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-10 text-center">
            <RefreshCcw className="mx-auto mb-3 h-8 w-8 text-slate-500" />
            <p className="font-medium text-foreground">Nenhum ciclo encontrado neste filtro</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ajuste periodo, busca, etapa ou status para revisar outros abandonos do WhatsApp.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {queue.exceptionItems.length > 0 ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                <div className="mb-3 flex items-start gap-3">
                  <div className="rounded-xl bg-white/80 p-2">
                    <AlertCircle className="h-5 w-5 text-amber-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-950">Excecoes que exigem acao humana</p>
                    <p className="text-xs text-amber-800">
                      Falhas recentes de envio, destinos invalidos ou fluxos travados que precisam de conferencia manual.
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 xl:grid-cols-2">
                  {queue.exceptionItems.map((item) => (
                    <div key={`exception-${item.cycleId}`} className="rounded-xl border border-amber-200 bg-white/90 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-900">{item.customerName || "Cliente nao identificado"}</p>
                        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">
                          {Boolean(item.manualInterventionSuggested)
                            ? getManualInterventionLabel(item.manualInterventionReason)
                            : item.cancelReason === "INVALID_DESTINATION"
                            ? "Destino invalido"
                            : item.latestAttemptStatusLabel || "Excecao"}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-slate-700">{buildContextSummary(item)}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {Boolean(item.manualInterventionSuggested)
                          ? `Usuario preso no mesmo passo${item.manualInterventionAttempts ? ` (${item.manualInterventionAttempts} tentativas)` : ""}.`
                          : item.latestAttemptError || item.cancelReason || "Sem detalhe tecnico"}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.clientId ? (
                          <Button asChild size="sm" variant="outline">
                            <Link to={`/clientes/${item.clientId}`}>Abrir cliente</Link>
                          </Button>
                        ) : null}
                        {item.conversationId ? (
                          <Button asChild size="sm">
                            <Link to={`/chat/${item.conversationId}`}>Assumir no chat</Link>
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {queue.items.map((item) => (
              <div
                key={item.cycleId}
                className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/70 p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-foreground">
                        {item.customerName || "Cliente nao identificado"}
                      </p>
                      <Badge variant="outline" className={getStatusBadgeClass(item.status)}>
                        {item.statusLabel || item.status || "Indefinido"}
                      </Badge>
                      <Badge variant="outline" className={getStageBadgeClass(item.lastStage)}>
                        {item.lastStageLabel || item.lastStage || "Etapa nao identificada"}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <UserRound className="h-4 w-4" />
                        {maskPhone(item.userIdentifier)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarClock className="h-4 w-4" />
                        Abandonado em {formatDateTime(item.abandonedAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {item.clientId ? (
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/clientes/${item.clientId}`}>Abrir cliente</Link>
                      </Button>
                    ) : null}
                    {item.conversationId ? (
                      <Button asChild size="sm">
                        <Link to={`/chat/${item.conversationId}`}>Abrir conversa</Link>
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
                  <div className="space-y-3">
                    <div className="rounded-xl border border-slate-200 bg-white/80 px-3 py-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Contexto salvo</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">{buildContextSummary(item)}</p>
                      {Boolean(item.manualInterventionSuggested) ? (
                        <div className="mt-2">
                          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">
                            {getManualInterventionLabel(item.manualInterventionReason)}
                          </Badge>
                        </div>
                      ) : null}
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {item.nextAttemptAt ? (
                          <span>
                            Proxima tentativa #{item.nextAttemptNumber ?? "-"} em {formatDateTime(item.nextAttemptAt)}
                          </span>
                        ) : item.latestAttemptAt ? (
                          <span>
                            Ultima tentativa #{item.latestAttemptNumber ?? "-"} em {formatDateTime(item.latestAttemptAt)}
                          </span>
                        ) : (
                          <span>Sem tentativa registrada ainda</span>
                        )}
                        {item.latestAttemptStatusLabel ? (
                          <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                            {item.latestAttemptStatusLabel}
                          </Badge>
                        ) : null}
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 bg-white/80 px-3 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Ultima mensagem do cliente
                        </p>
                        <p className="mt-2 text-sm text-slate-800">
                          {item.customerLastMessage || "Nao capturada"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white/80 px-3 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Ultimo contexto do assistente
                        </p>
                        <p className="mt-2 text-sm text-slate-800">
                          {item.assistantLastPrompt || "Nao capturado"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Sinais operacionais</p>
                      <div className="mt-2 space-y-2 text-sm text-slate-700">
                        <div className="flex items-center justify-between gap-3">
                          <span>Servico</span>
                          <span className="font-medium text-slate-900">{item.lastServiceName || "-"}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span>Profissional</span>
                          <span className="font-medium text-slate-900">{item.lastProfessionalName || "-"}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span>Data pretendida</span>
                          <span className="font-medium text-slate-900">
                            {item.lastRequestedDate ? formatDateOnly(item.lastRequestedDate) : "-"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span>Horario pretendido</span>
                          <span className="font-medium text-slate-900">{item.lastRequestedTime || "-"}</span>
                        </div>
                      </div>
                    </div>

                    {item.cancelReason || item.latestAttemptError ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-3 text-sm text-amber-900">
                        <div className="mb-1 flex items-center gap-2 font-medium">
                          <AlertCircle className="h-4 w-4" />
                          Sinal de atencao operacional
                        </div>
                        {item.cancelReason ? <p>Cancelamento: {item.cancelReason}</p> : null}
                        {item.latestAttemptError ? <p>Ultimo erro: {item.latestAttemptError}</p> : null}
                      </div>
                    ) : null}

                    {Boolean(item.manualInterventionSuggested) ? (
                      <div className="rounded-xl border border-orange-200 bg-orange-50/80 px-3 py-3 text-sm text-orange-950">
                        <div className="mb-1 flex items-center gap-2 font-medium">
                          <AlertCircle className="h-4 w-4" />
                          Intervencao manual necessaria
                        </div>
                        <p>
                          O assistente identificou travamento no fluxo
                          {item.manualInterventionAttempts ? ` apos ${item.manualInterventionAttempts} tentativas` : ""}.
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}

            {hasError ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Nao foi possivel atualizar a fila agora. Os dados exibidos podem estar defasados.
              </div>
            ) : null}
          </div>
        )}

        {!isLoading && hasItems ? (
          <PaginationControls
            page={Math.max(currentPage, 1)}
            totalPages={Math.max(totalPages, 1)}
            isLoading={isLoading}
            onPrevious={handlePreviousPage}
            onNext={handleNextPage}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
