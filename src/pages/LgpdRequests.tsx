import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatDateTime } from "@/lib/format";
import { MainLayout } from "@/components/layout/MainLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  ENCERRADO: "bg-slate-500/10 text-slate-700 border-slate-600/30",
};

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

  const [statusFilter, setStatusFilter] = useState("");
  const [requestTypeFilter, setRequestTypeFilter] = useState("");
  const [limitFilter, setLimitFilter] = useState("50");

  const [createForm, setCreateForm] = useState<CreateLgpdRequestPayload>(EMPTY_CREATE_FORM);
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

  const fetchList = async () => {
    try {
      setIsLoading(true);
      const data = await lgpdApi.list({
        status: statusFilter || undefined,
        requestType: requestTypeFilter || undefined,
        limit: Number(limitFilter) > 0 ? Number(limitFilter) : undefined,
      });
      setItems(data);
      setError(null);
    } catch (err) {
      setError(resolveUiError(err, "Erro ao carregar solicitacoes LGPD.").message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        resolveUiError(err, "Erro ao carregar detalhe da solicitacao.").message,
      );
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const onCreate = async () => {
    if (!createForm.requesterName.trim() || !createForm.requesterEmail.trim()) {
      setError("Preencha nome e email do titular.");
      return;
    }
    try {
      setIsCreating(true);
      const created = await lgpdApi.create({
        ...createForm,
        requestType: createForm.requestType.trim().toUpperCase(),
      });
      setCreateForm(EMPTY_CREATE_FORM);
      await fetchList();
      await fetchDetailById(created.id);
    } catch (err) {
      setError(resolveUiError(err, "Erro ao criar solicitacao LGPD.").message);
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
        resolveUiError(err, "Erro ao atualizar status da solicitacao.").message,
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
      setDetailError(resolveUiError(err, "Protocolo LGPD nao encontrado.").message);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  return (
    <MainLayout
      title="LGPD - Direitos do Titular"
      subtitle="Controle de solicitacoes com protocolo, status e historico auditavel."
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/auditoria">Voltar para Auditoria</Link>
          </Button>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {/* Create form */}
        <Card>
          <CardHeader>
            <CardTitle>Criar solicitacao LGPD</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Input
                placeholder="Tipo (ex.: ACESSO, ELIMINACAO)"
                value={createForm.requestType}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, requestType: e.target.value }))
                }
              />
              <Input
                placeholder="Nome do titular"
                value={createForm.requesterName}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, requesterName: e.target.value }))
                }
              />
              <Input
                placeholder="Email do titular"
                value={createForm.requesterEmail}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, requesterEmail: e.target.value }))
                }
              />
              <Input
                placeholder="Documento (opcional)"
                value={createForm.requesterDocument || ""}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, requesterDocument: e.target.value }))
                }
              />
            </div>
            <Textarea
              placeholder="Descricao da solicitacao"
              value={createForm.description || ""}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, description: e.target.value }))
              }
            />
            <Button onClick={() => void onCreate()} disabled={isCreating}>
              {isCreating ? "Criando..." : "Criar solicitacao"}
            </Button>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros e busca por protocolo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Todos os status</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <Input
                placeholder="Tipo (ACESSO, ELIMINACAO...)"
                value={requestTypeFilter}
                onChange={(e) => setRequestTypeFilter(e.target.value)}
              />
              <Input
                placeholder="Limite"
                value={limitFilter}
                onChange={(e) => setLimitFilter(e.target.value)}
              />
              <Button variant="outline" onClick={() => void fetchList()}>
                Aplicar filtros
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <Input
                placeholder="Buscar por protocolo (LGPD-YYYYMMDD-XXXXXXXX)"
                value={protocolLookup}
                onChange={(e) => setProtocolLookup(e.target.value)}
              />
              <Button variant="outline" onClick={() => void onLookupProtocol()}>
                Buscar protocolo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* List + detail panel */}
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Solicitacoes</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : !items.length ? (
                <p className="text-sm text-muted-foreground">Nenhuma solicitacao encontrada.</p>
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
                          {item.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.requestType}</p>
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
    </MainLayout>
  );
}
