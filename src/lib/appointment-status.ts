export const appointmentStatusCardToneMap: Record<string, string> = {
  PENDING: 'bg-amber-50/90 text-amber-900 border border-amber-200/80 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-500/25',
  CONFIRMED: 'bg-primary/10 text-primary border border-primary/20',
  IN_PROGRESS: 'bg-primary/12 text-primary border border-primary/25',
  COMPLETED: 'bg-success/10 text-success border border-success/25',
  CANCELLED: 'bg-destructive/10 text-destructive border border-destructive/25',
  NO_SHOW: 'bg-muted/60 text-muted-foreground border border-border/70',
};

export const appointmentStatusBadgeToneMap: Record<string, string> = {
  PENDING: 'border-amber-300 bg-amber-100 text-amber-900',
  CONFIRMED: 'border-sky-300 bg-sky-100 text-sky-900',
  IN_PROGRESS: 'border-primary/30 bg-primary/12 text-primary',
  COMPLETED: 'border-green-300 bg-green-100 text-green-900',
  CANCELLED: 'border-red-300 bg-red-100 text-red-900',
  NO_SHOW: 'border-border bg-muted text-muted-foreground',
};

export const appointmentStatusLabelMap: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  IN_PROGRESS: 'Em atendimento',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
  NO_SHOW: 'Não compareceu',
};

export const getStatusColor = (status: string): string =>
  appointmentStatusCardToneMap[status] ?? appointmentStatusCardToneMap.PENDING;

export const getStatusBadgeColor = (status: string): string =>
  appointmentStatusBadgeToneMap[status] ?? appointmentStatusBadgeToneMap.PENDING;

export const getStatusLabel = (status: string): string =>
  appointmentStatusLabelMap[status] ?? status;

export const allowedTransitions: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED', 'NO_SHOW'],
  CONFIRMED: ['IN_PROGRESS', 'CANCELLED', 'NO_SHOW'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

const serviceFlowStatuses = ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'] as const;

export const getServiceFlowMeta = (status: string) => {
  const currentIndex = serviceFlowStatuses.findIndex((item) => item === status);
  if (currentIndex === -1) return null;

  const nextStatus = serviceFlowStatuses[currentIndex + 1];
  return {
    currentStep: currentIndex + 1,
    totalSteps: serviceFlowStatuses.length,
    currentLabel: getStatusLabel(status),
    nextLabel: nextStatus ? getStatusLabel(nextStatus) : null,
  };
};

export const getAppointmentItems = (appointment: {
  items?: Array<{
    serviceId: string;
    service?: { name?: string } | null;
    durationMinutes: number;
    unitPrice: number;
    grossAmount?: number;
    discountAmount?: number;
    totalPrice: number;
  }> | null;
  serviceId?: string | null;
  service?: { name?: string } | null;
  totalPrice?: number | string | null;
}) => {
  if (Array.isArray(appointment.items) && appointment.items.length > 0) {
    return appointment.items;
  }
  if (!appointment.serviceId) return [];
  return [
    {
      serviceId: appointment.serviceId,
      service: appointment.service,
      durationMinutes: 0,
      unitPrice: Number(appointment.totalPrice || 0),
      grossAmount: Number(appointment.totalPrice || 0),
      discountAmount: 0,
      totalPrice: Number(appointment.totalPrice || 0),
    },
  ];
};
