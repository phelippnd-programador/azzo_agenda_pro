import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, CalendarClock, MessageSquareText, RefreshCcw, UserRound } from "lucide-react";
import { dashboardApi } from "@/lib/api";
import { formatDateOnly, formatDateTime } from "@/lib/format";
import type {
  DashboardWhatsAppReactivationQueueItem,
  DashboardWhatsAppReactivationQueueResponse,
} from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const DAYS_OPTIONS = [
  { label: "7 dias", value: "7" },
  { label: "15 dias", value: "15" },
  { label: "30 dias", value: "30" },
] as const;

const STATUS_OPTIONS = [
  { label: "Todos os status", value: "ALL" },
  { label: "Ativos", value: "ACTIVE" },
  { label: "Reativados", value: "REACTIVATED" },
  { label: "Convertidos", value: "CONVERTED" },
  { label: "Cancelados", value: "CANCELLED" },
  { label: "Encerrados", value: "EXHAUSTED" },
] as const;

const emptyQueue: DashboardWhatsAppReactivationQueueResponse = {
  startDate: "",
  endDate: "",
  statusFilter: "ALL",
  limit: 12,
  items: [],
  exceptionItems: [],
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
  const [days, setDays] = useState("30");
  const [status, setStatus] = useState("ALL");
  const [queue, setQueue] = useState<DashboardWhatsAppReactivationQueueResponse>(emptyQueue);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    dashboardApi
      .getWhatsAppReactivationQueue({
        days: Number(days),
        status,
        limit: 12,
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
  }, [days, status]);

  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <MessageSquareText className="h-5 w-5 text-slate-700" />
              Fila operacional de abandonos
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Casos recentes para o time acompanhar, reativar ou assumir manualmente no chat.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Periodo" />
              </SelectTrigger>
              <SelectContent>
                {DAYS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full sm:w-[190px]">
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
        </div>
      </CardHeader>

      <CardContent>
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
              Ajuste o periodo ou o status para revisar outros abandonos do WhatsApp.
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
      </CardContent>
    </Card>
  );
}
