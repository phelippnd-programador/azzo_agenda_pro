import { formatDateTime } from "@/lib/format";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AuditEventDetailDto } from "@/types/auditoria";
import { actionMeta, entityMeta, maskIpAddress, moduleLabel } from "@/lib/audit-helpers";

interface DiffEntry {
  key: string;
  previous: unknown;
  current: unknown;
}

interface AuditEventDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventDetail: AuditEventDetailDto | null;
  isLoadingDetail: boolean;
  detailError: string | null;
  diffEntries: DiffEntry[];
}

export function AuditEventDetailDialog({
  open,
  onOpenChange,
  eventDetail,
  isLoadingDetail,
  detailError,
  diffEntries,
}: AuditEventDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              <p>
                <span className="font-medium">Data/hora do evento:</span>{" "}
                {formatDateTime(eventDetail.createdAt)}
              </p>
              <p>
                <span className="font-medium">Modulo:</span> {moduleLabel(eventDetail.module)}
              </p>
              <p>
                <span className="font-medium">Acao:</span>{" "}
                {actionMeta(eventDetail.action).label}
              </p>
              <p>
                <span className="font-medium">Registro afetado:</span>{" "}
                {entityMeta(eventDetail.entityType).label}
              </p>
              <p>
                <span className="font-medium">Request ID:</span>{" "}
                <span className="font-mono">{eventDetail.requestId}</span>
              </p>
              <p>
                <span className="font-medium">Canal:</span> {eventDetail.sourceChannel}
              </p>
              <p>
                <span className="font-medium">IP:</span>{" "}
                {maskIpAddress(eventDetail.ipAddress)}
              </p>
              <p>
                <span className="font-medium">Hash:</span>{" "}
                <span className="font-mono text-xs">{eventDetail.eventHash}</span>
              </p>
              <p>
                <span className="font-medium">Hash anterior:</span>{" "}
                <span className="font-mono text-xs">
                  {eventDetail.prevEventHash || "-"}
                </span>
              </p>
              <p>
                <span className="font-medium">Cadeia valida:</span>{" "}
                {eventDetail.chainValid ? "Sim" : "Nao"}
              </p>
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
                <p className="text-muted-foreground">
                  Sem diferencas entre before e after.
                </p>
              ) : (
                <div className="space-y-2">
                  {diffEntries.map((entry) => (
                    <div key={entry.key} className="rounded-md border p-2">
                      <p className="font-medium">{entry.key}</p>
                      <p className="text-xs text-muted-foreground">
                        Antes: {JSON.stringify(entry.previous)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Depois: {JSON.stringify(entry.current)}
                      </p>
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
  );
}
