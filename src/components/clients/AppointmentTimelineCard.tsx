import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import type { AppointmentTimelineEvent } from "@/types";

export const appointmentStatusLabels: Record<string, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  IN_PROGRESS: "Em atendimento",
  COMPLETED: "Concluido",
  CANCELLED: "Cancelado",
  NO_SHOW: "Nao compareceu",
};

export const formatStatusLabel = (status?: string): string => {
  if (!status) return "-";
  return appointmentStatusLabels[status] || status;
};

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toDisplayValue = (value: unknown): string => {
  if (value == null || value === "") return "-";
  if (typeof value === "boolean") return value ? "Sim" : "Nao";
  if (Array.isArray(value)) {
    return value.length ? value.map((item) => String(item)).join(", ") : "-";
  }
  if (typeof value === "object") {
    return "Atualizacao estrutural";
  }
  if (typeof value === "string" && appointmentStatusLabels[value]) {
    return formatStatusLabel(value);
  }
  return String(value);
};

const humanizeFieldName = (field: string): string =>
  field
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[._-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (letter) => letter.toUpperCase());

const getObjectValue = (payload: unknown, field: string): unknown => {
  if (!isObjectRecord(payload)) return undefined;
  return payload[field];
};

interface AppointmentTimelineCardProps {
  event: AppointmentTimelineEvent;
}

export function AppointmentTimelineCard({ event }: AppointmentTimelineCardProps) {
  const changedFields = event.changedFields?.length
    ? event.changedFields
    : [
        ...new Set([
          ...Object.keys(isObjectRecord(event.before) ? event.before : {}),
          ...Object.keys(isObjectRecord(event.after) ? event.after : {}),
        ]),
      ];

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="font-medium">{event.actionLabel || event.action}</p>
          <p className="text-sm text-muted-foreground">
            {formatDateTime(event.createdAt)}
            {event.actorName ? ` - ${event.actorName}` : ""}
            {event.actorRole ? ` (${event.actorRole})` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {event.status ? <Badge variant="outline">{formatStatusLabel(event.status)}</Badge> : null}
          {event.sourceChannel ? <Badge variant="secondary">{event.sourceChannel}</Badge> : null}
        </div>
      </div>

      {changedFields.length ? (
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Mudancas registradas</p>
          <div className="grid gap-3">
            {changedFields.map((field) => (
              <div key={field} className="rounded-lg border bg-muted/20 p-4">
                <p className="text-sm font-medium">{humanizeFieldName(field)}</p>
                <div className="mt-3 grid gap-2 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
                  <div className="rounded-md border bg-background p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Antes</p>
                    <p className="mt-1 text-sm">{toDisplayValue(getObjectValue(event.before, field))}</p>
                  </div>
                  <div className="flex items-center justify-center text-muted-foreground">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                  <div className="rounded-md border bg-background p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Depois</p>
                    <p className="mt-1 text-sm">{toDisplayValue(getObjectValue(event.after, field))}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {(event.actorRole || (isObjectRecord(event.metadata) && Object.keys(event.metadata).length > 0)) ? (
        <div className="flex flex-wrap gap-2">
          {event.actorRole ? <Badge variant="outline">{event.actorRole}</Badge> : null}
          {isObjectRecord(event.metadata)
            ? Object.entries(event.metadata).map(([key, value]) => (
                <Badge key={key} variant="secondary" className="max-w-full">
                  {humanizeFieldName(key)}: {toDisplayValue(value)}
                </Badge>
              ))
            : null}
        </div>
      ) : null}
    </div>
  );
}
