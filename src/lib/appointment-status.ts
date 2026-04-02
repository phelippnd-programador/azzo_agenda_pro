export const appointmentStatusCardToneMap: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-900 border border-amber-200 border-l-4 border-l-amber-500',
  CONFIRMED: 'bg-sky-50 text-sky-900 border border-sky-200 border-l-4 border-l-sky-500',
  IN_PROGRESS: 'bg-primary/10 text-primary border border-primary/20 border-l-4 border-l-primary',
  COMPLETED: 'bg-green-50 text-green-900 border border-green-200 border-l-4 border-l-green-500',
  CANCELLED: 'bg-red-50 text-red-900 border border-red-200 border-l-4 border-l-red-500',
  NO_SHOW: 'bg-slate-100 text-slate-600 border border-slate-200 border-l-4 border-l-slate-400',
};

export const appointmentStatusBadgeToneMap: Record<string, string> = {
  PENDING: 'border-amber-200 bg-amber-100 text-amber-700',
  CONFIRMED: 'border-sky-200 bg-sky-100 text-sky-700',
  IN_PROGRESS: 'border-primary/20 bg-primary/10 text-primary',
  COMPLETED: 'border-green-200 bg-green-100 text-green-700',
  CANCELLED: 'border-red-200 bg-red-100 text-red-700',
  NO_SHOW: 'border-slate-200 bg-slate-100 text-slate-600',
};

export const appointmentStatusLabelMap: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  IN_PROGRESS: 'Em atendimento',
  COMPLETED: 'Concluido',
  CANCELLED: 'Cancelado',
  NO_SHOW: 'Nao compareceu',
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
      totalPrice: Number(appointment.totalPrice || 0),
    },
  ];
};
