import { formatDateTime } from "@/lib/format";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { LgpdRequestDetail, LgpdRequestStatus } from "@/types/lgpd";

const STATUS_OPTIONS: LgpdRequestStatus[] = [
  "ABERTO",
  "EM_VALIDACAO",
  "RESPONDIDO",
  "ENCERRADO",
];

interface LgpdRequestDetailPanelProps {
  detail: LgpdRequestDetail | null;
  detailError: string | null;
  isLoadingDetail: boolean;
  updateStatus: LgpdRequestStatus;
  updateNote: string;
  updateSummary: string;
  isUpdatingStatus: boolean;
  onUpdateStatus: () => void;
  onChangeStatus: (value: LgpdRequestStatus) => void;
  onChangeNote: (value: string) => void;
  onChangeSummary: (value: string) => void;
}

export function LgpdRequestDetailPanel({
  detail,
  detailError,
  isLoadingDetail,
  updateStatus,
  updateNote,
  updateSummary,
  isUpdatingStatus,
  onUpdateStatus,
  onChangeStatus,
  onChangeNote,
  onChangeSummary,
}: LgpdRequestDetailPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalhe e atualizacao de status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoadingDetail ? (
          <p className="text-sm text-muted-foreground">Carregando detalhe...</p>
        ) : detailError ? (
          <Alert variant="destructive">
            <AlertTitle>Erro no detalhe</AlertTitle>
            <AlertDescription>{detailError}</AlertDescription>
          </Alert>
        ) : !detail ? (
          <p className="text-sm text-muted-foreground">
            Selecione uma solicitacao para ver detalhes.
          </p>
        ) : (
          <>
            <div className="rounded-md border p-3 text-sm space-y-1">
              <p>
                <span className="font-medium">Protocolo:</span> {detail.request.protocolCode}
              </p>
              <p>
                <span className="font-medium">Status atual:</span> {detail.request.status}
              </p>
              <p>
                <span className="font-medium">Titular:</span> {detail.request.requesterName}
              </p>
              <p>
                <span className="font-medium">Email:</span> {detail.request.requesterEmail}
              </p>
              <p>
                <span className="font-medium">Descricao:</span>{" "}
                {detail.request.description || "-"}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={updateStatus}
                onChange={(e) => onChangeStatus(e.target.value as LgpdRequestStatus)}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <Input
                placeholder="Resumo de resposta (opcional)"
                value={updateSummary}
                onChange={(e) => onChangeSummary(e.target.value)}
              />
            </div>
            <Textarea
              placeholder="Nota da alteracao de status"
              value={updateNote}
              onChange={(e) => onChangeNote(e.target.value)}
            />
            <Button onClick={onUpdateStatus} disabled={isUpdatingStatus}>
              {isUpdatingStatus ? "Atualizando..." : "Atualizar status"}
            </Button>

            <div>
              <p className="text-sm font-medium mb-2">Historico de eventos</p>
              {!detail.events.length ? (
                <p className="text-sm text-muted-foreground">Sem eventos.</p>
              ) : (
                <div className="space-y-2">
                  {detail.events.map((event) => (
                    <div key={event.id} className="rounded-md border p-2 text-xs">
                      <p>
                        <span className="font-medium">{event.eventType}</span>{" "}
                        ({event.previousStatus || "-"} → {event.newStatus || "-"})
                      </p>
                      <p>{event.note || "-"}</p>
                      <p className="text-muted-foreground">
                        {formatDateTime(event.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
