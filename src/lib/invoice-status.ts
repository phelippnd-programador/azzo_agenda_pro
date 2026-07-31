import type { InvoiceStatus } from '@/types/invoice';

// Cores por grupo de significado (nunca por matiz proprio): sucesso, em
// andamento, atencao, erro/cancelado ou neutro/terminal-administrativo.
const STATUS_COLORS: Record<InvoiceStatus, string> = {
  ISSUED: 'bg-success/12 text-success border-success/25',
  DRAFT: 'bg-muted text-muted-foreground border-border/60',
  GENERATED: 'bg-primary/12 text-primary border-primary/25',
  SIGNED: 'bg-primary/12 text-primary border-primary/25',
  SUBMITTED: 'bg-warning/12 text-warning border-warning/25',
  CONTINGENCY_PENDING: 'bg-warning/12 text-warning border-warning/25',
  REJECTED: 'bg-destructive/12 text-destructive border-destructive/25',
  CANCEL_PENDING: 'bg-warning/12 text-warning border-warning/25',
  CANCELLED: 'bg-destructive/12 text-destructive border-destructive/25',
  INUTILIZED: 'bg-muted text-muted-foreground border-border/60',
  ERROR_FINAL: 'bg-destructive/12 text-destructive border-destructive/25',
};

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  ISSUED: 'Emitida',
  DRAFT: 'Rascunho',
  GENERATED: 'Gerada',
  SIGNED: 'Assinada',
  SUBMITTED: 'Enviada',
  CONTINGENCY_PENDING: 'Contingencia',
  REJECTED: 'Rejeitada',
  CANCEL_PENDING: 'Canc. pendente',
  CANCELLED: 'Cancelada',
  INUTILIZED: 'Inutilizada',
  ERROR_FINAL: 'Erro final',
};

export function getInvoiceStatusColor(status: InvoiceStatus): string {
  return STATUS_COLORS[status] ?? 'bg-muted text-muted-foreground border-border/60';
}

export function getInvoiceStatusLabel(status: InvoiceStatus): string {
  return STATUS_LABELS[status] ?? status;
}
