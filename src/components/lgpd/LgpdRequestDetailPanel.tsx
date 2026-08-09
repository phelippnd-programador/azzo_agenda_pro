import { formatDateTime } from "@/lib/format";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { LgpdRequestDetail, LgpdRequestStatus } from "@/types/lgpd";
import { formatLgpdStatus, formatLgpdEventType } from "@/lib/lgpd-formatters";

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
        <CardTitle>Detalhe e atualização de status</CardTitle>
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
            Selecione uma solicitação para ver detalhes.
          </p>
        ) : (
          <>
            <div className="rounded-md border p-3 text-sm space-y-1">
              <p>
                <span className="font-medium">Protocolo:</span> {detail.request.protocolCode}
              </p>
              <p>
                <span className="font-medium">Status atual:</span> {formatLgpdStatus(detail.request.status)}
              </p>
              <p>
                <span className="font-medium">Titular:</span> {detail.request.requesterName}
              </p>
              <p>
                <span className="font-medium">Email:</span> {detail.request.requesterEmail}
              </p>
              <p>
                <span className="font-medium">Descrição:</span>{" "}
                {detail.request.description || "-"}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="lgpd-detail-status">Status</Label>
                <Select
                  value={updateStatus}
                  onValueChange={(value) => onChangeStatus(value as LgpdRequestStatus)}
                >
                  <SelectTrigger id="lgpd-detail-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {formatLgpdStatus(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lgpd-detail-summary">Resumo de resposta (opcional)</Label>
                <Input
                  id="lgpd-detail-summary"
                  placeholder="ex.: dados enviados por email"
                  value={updateSummary}
                  onChange={(e) => onChangeSummary(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lgpd-detail-note">Nota da alteração de status</Label>
              <Textarea
                id="lgpd-detail-note"
                placeholder="Registre o motivo ou contexto da alteração"
                value={updateNote}
                onChange={(e) => onChangeNote(e.target.value)}
              />
            </div>
            <Button onClick={onUpdateStatus} disabled={isUpdatingStatus}>
              {isUpdatingStatus ? "Atualizando..." : "Atualizar status"}
            </Button>

            <div>
              <p className="text-sm font-medium mb-2">Histórico de eventos</p>
              {!detail.events.length ? (
                <p className="text-sm text-muted-foreground">Sem eventos.</p>
              ) : (
                <div className="space-y-2">
                  {detail.events.map((event) => (
                    <div key={event.id} className="rounded-md border p-2 text-xs">
                      <p>
                        <span className="font-medium">{formatLgpdEventType(event.eventType)}</span>{" "}
                        ({event.previousStatus ? formatLgpdStatus(event.previousStatus) : "-"} → {event.newStatus ? formatLgpdStatus(event.newStatus) : "-"})
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
