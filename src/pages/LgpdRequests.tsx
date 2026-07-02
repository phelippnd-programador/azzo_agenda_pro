import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { MainLayout } from "@/components/layout/MainLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageEmptyState } from "@/components/ui/page-states";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LgpdRequestDetailPanel } from "@/components/lgpd/LgpdRequestDetailPanel";
import { lgpdApi } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import type {
  CreateLgpdRequestPayload,
  LgpdRequestDetail,
  LgpdRequestItem,
  LgpdRequestStatus,
  UpdateLgpdRequestStatusPayload,
} from "@/types/lgpd";
import { formatLgpdStatus, formatLgpdRequestType, LGPD_REQUEST_TYPES } from "@/lib/lgpd-formatters";

const STATUS_OPTIONS: LgpdRequestStatus[] = [
  "ABERTO",
  "EM_VALIDACAO",
  "RESPONDIDO",
  "ENCERRADO",
];

const STATUS_BADGE: Record<string, string> = {
  ABERTO: "bg-muted text-foreground border-border",
  EM_VALIDACAO: "bg-primary/10 text-primary border-primary/40",
  RESPONDIDO: "bg-emerald-500/10 text-emerald-700 border-emerald-600/30",
  ENCERRADO: "bg-slate-500/10 text-slate-700 border-slate-600/30 dark:bg-slate-700/40 dark:text-slate-200 dark:border-slate-500/40",
};

const ALL_FILTER = "ALL";
const PAGE_SIZE_OPTIONS = ["25", "50", "100"] as const;

const EMPTY_CREATE_FORM: CreateLgpdRequestPayload = {
  requestType: "ACESSO",
  requesterName: "",
  requesterEmail: "",
  requesterDocument: "",
  description: "",
};

export default function LgpdRequests() {
  const [items, setItems] = useState<LgpdRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState(ALL_FILTER);
  const [requestTypeFilter, setRequestTypeFilter] = useState(ALL_FILTER);
  const [limitFilter, setLimitFilter] = useState("50");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateLgpdRequestPayload>(EMPTY_CREATE_FORM);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<LgpdRequestDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [protocolLookup, setProtocolLookup] = useState("");

  const [updateStatus, setUpdateStatus] = useState<LgpdRequestStatus>("EM_VALIDACAO");
  const [updateNote, setUpdateNote] = useState("");
  const [updateSummary, setUpdateSummary] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchList = async (filters?: {
    status?: string;
    requestType?: string;
    limit?: string;
  }) => {
    const status = filters?.status ?? statusFilter;
    const requestType = filters?.requestType ?? requestTypeFilter;
    const limit = filters?.limit ?? limitFilter;
    try {
      setIsLoading(true);
      const data = await lgpdApi.list({
        status: status !== ALL_FILTER ? status : undefined,
        requestType: requestType !== ALL_FILTER ? requestType : undefined,
        limit: Number(limit) > 0 ? Number(limit) : undefined,
      });
      setItems(data);
      setError(null);
    } catch (err) {
      setError(resolveUiError(err, "Erro ao carregar solicitações LGPD.").message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtros de select aplicam imediatamente, sem botao extra
  const onChangeStatusFilter = (value: string) => {
    setStatusFilter(value);
    void fetchList({ status: value });
  };

  const onChangeTypeFilter = (value: string) => {
    setRequestTypeFilter(value);
    void fetchList({ requestType: value });
  };

  const onChangeLimitFilter = (value: string) => {
    setLimitFilter(value);
    void fetchList({ limit: value });
  };

  const fetchDetailById = async (id: string) => {
    try {
      setIsLoadingDetail(true);
      const data = await lgpdApi.detailById(id);
      setDetail(data);
      setSelectedId(id);
      setDetailError(null);
      setUpdateStatus((data.request.status as LgpdRequestStatus) || "EM_VALIDACAO");
      setUpdateSummary(data.request.responseSummary || "");
      setUpdateNote("");
    } catch (err) {
      setDetailError(
        resolveUiError(err, "Erro ao carregar detalhe da solicitação.").message,
      );
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const openCreateDialog = () => {
    setCreateForm(EMPTY_CREATE_FORM);
    setCreateError(null);
    setIsCreateOpen(true);
  };

  const onCreate = async () => {
    if (!createForm.requesterName.trim() || !createForm.requesterEmail.trim()) {
      setCreateError("Preencha nome e email do titular.");
      return;
    }
    try {
      setIsCreating(true);
      const created = await lgpdApi.create({
        ...createForm,
        requestType: createForm.requestType.trim().toUpperCase(),
      });
      setCreateForm(EMPTY_CREATE_FORM);
      setCreateError(null);
      setIsCreateOpen(false);
      await fetchList();
      await fetchDetailById(created.id);
    } catch (err) {
      setCreateError(resolveUiError(err, "Erro ao criar solicitação LGPD.").message);
    } finally {
      setIsCreating(false);
    }
  };

  const onUpdateStatus = async () => {
    if (!selectedId) return;
    try {
      setIsUpdatingStatus(true);
      const payload: UpdateLgpdRequestStatusPayload = {
        status: updateStatus,
        note: updateNote || undefined,
        responseSummary: updateSummary || undefined,
      };
      await lgpdApi.updateStatus(selectedId, payload);
      await fetchList();
      await fetchDetailById(selectedId);
    } catch (err) {
      setDetailError(
        resolveUiError(err, "Erro ao atualizar status da solicitação.").message,
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const onLookupProtocol = async () => {
    if (!protocolLookup.trim()) return;
    try {
      setIsLoadingDetail(true);
      const data = await lgpdApi.detailByProtocol(protocolLookup.trim().toUpperCase());
      setDetail(data);
      setSelectedId(data.request.id);
      setDetailError(null);
      setUpdateStatus((data.request.status as LgpdRequestStatus) || "EM_VALIDACAO");
      setUpdateSummary(data.request.responseSummary || "");
      setUpdateNote("");
    } catch (err) {
      setDetailError(resolveUiError(err, "Protocolo LGPD não encontrado.").message);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const hasActiveFilters = statusFilter !== ALL_FILTER || requestTypeFilter !== ALL_FILTER;

  return (
    <MainLayout
      title="LGPD - Direitos do Titular"
      subtitle="Controle de solicitações com protocolo, status e histórico auditável."
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button asChild variant="outline">
            <Link to="/auditoria">Voltar para Auditoria</Link>
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Nova solicitação
          </Button>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros e busca por protocolo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="lgpd-filter-status">Status</Label>
                <Select value={statusFilter} onValueChange={onChangeStatusFilter}>
                  <SelectTrigger id="lgpd-filter-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_FILTER}>Todos os status</SelectItem>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {formatLgpdStatus(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lgpd-filter-type">Tipo</Label>
                <Select value={requestTypeFilter} onValueChange={onChangeTypeFilter}>
                  <SelectTrigger id="lgpd-filter-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_FILTER}>Todos os tipos</SelectItem>
                    {LGPD_REQUEST_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lgpd-filter-page-size">Itens por página</Label>
                <Select value={limitFilter} onValueChange={onChangeLimitFilter}>
                  <SelectTrigger id="lgpd-filter-page-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size} por página
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="space-y-1.5">
                <Label htmlFor="lgpd-protocol-lookup">Buscar por protocolo</Label>
                <Input
                  id="lgpd-protocol-lookup"
                  placeholder="ex.: LGPD-20260702-A1B2C3D4"
                  value={protocolLookup}
                  onChange={(e) => setProtocolLookup(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void onLookupProtocol();
                  }}
                />
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={() => void onLookupProtocol()}>
                  Buscar protocolo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* List + detail panel */}
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Solicitações</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : !items.length ? (
                hasActiveFilters ? (
                  <PageEmptyState
                    title="Nenhuma solicitação encontrada"
                    description="Nenhum resultado com os filtros atuais. Ajuste os filtros ou limpe a seleção."
                    action={{
                      label: "Limpar filtros",
                      variant: "outline",
                      onClick: () => {
                        setStatusFilter(ALL_FILTER);
                        setRequestTypeFilter(ALL_FILTER);
                        void fetchList({ status: ALL_FILTER, requestType: ALL_FILTER });
                      },
                    }}
                  />
                ) : (
                  <PageEmptyState
                    title="Nenhuma solicitação registrada"
                    description="Quando um titular exercer um direito LGPD (acesso, correção, eliminação...), registre aqui para gerar protocolo e manter o histórico auditável."
                    action={{
                      label: "Nova solicitação",
                      onClick: openCreateDialog,
                    }}
                  />
                )
              ) : (
                <div className="space-y-2">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`w-full rounded-md border p-3 text-left hover:bg-muted/50 ${
                        selectedId === item.id ? "border-primary" : "border-border"
                      }`}
                      onClick={() => void fetchDetailById(item.id)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">{item.protocolCode}</p>
                        <Badge className={STATUS_BADGE[item.status] || STATUS_BADGE.ABERTO}>
                          {formatLgpdStatus(item.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{formatLgpdRequestType(item.requestType)}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.requesterName} · {item.requesterEmail}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Criado em {formatDateTime(item.createdAt)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <LgpdRequestDetailPanel
            detail={detail}
            detailError={detailError}
            isLoadingDetail={isLoadingDetail}
            updateStatus={updateStatus}
            updateNote={updateNote}
            updateSummary={updateSummary}
            isUpdatingStatus={isUpdatingStatus}
            onUpdateStatus={() => void onUpdateStatus()}
            onChangeStatus={setUpdateStatus}
            onChangeNote={setUpdateNote}
            onChangeSummary={setUpdateSummary}
          />
        </div>
      </div>

      {/* Create dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Criar solicitação LGPD</DialogTitle>
            <DialogDescription>
              Registre o pedido do titular para gerar um protocolo de atendimento.
            </DialogDescription>
          </DialogHeader>
          {createError ? (
            <Alert variant="destructive">
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{createError}</AlertDescription>
            </Alert>
          ) : null}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="lgpd-create-type">Tipo</Label>
              <Select
                value={createForm.requestType}
                onValueChange={(value) =>
                  setCreateForm((prev) => ({ ...prev, requestType: value }))
                }
              >
                <SelectTrigger id="lgpd-create-type">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {LGPD_REQUEST_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="lgpd-create-name">Nome do titular</Label>
                <Input
                  id="lgpd-create-name"
                  placeholder="ex.: Maria da Silva"
                  value={createForm.requesterName}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, requesterName: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lgpd-create-email">Email do titular</Label>
                <Input
                  id="lgpd-create-email"
                  type="email"
                  placeholder="ex.: maria@email.com"
                  value={createForm.requesterEmail}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, requesterEmail: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lgpd-create-document">Documento (opcional)</Label>
              <Input
                id="lgpd-create-document"
                placeholder="ex.: CPF"
                value={createForm.requesterDocument || ""}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, requesterDocument: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lgpd-create-description">Descrição da solicitação</Label>
              <Textarea
                id="lgpd-create-description"
                placeholder="Descreva o pedido do titular"
                value={createForm.description || ""}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isCreating}>
              Cancelar
            </Button>
            <Button onClick={() => void onCreate()} disabled={isCreating}>
              {isCreating ? "Criando..." : "Criar solicitação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
