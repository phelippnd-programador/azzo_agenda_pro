export interface TimeSlotResponse {
  startTime: string;
  endTime: string;
  optimizationScore: number;
}

export interface AppointmentConflictSummary {
  appointmentId: string;
  clientId?: string;
  clientName?: string;
  serviceId?: string;
  serviceName?: string;
  startTime: string;
  endTime: string;
  status?: string;
}

export interface AppointmentConflictDetails {
  requestedDate?: string;
  requestedStartTime?: string;
  requestedEndTime?: string;
  origin?: string;
  canOverride?: boolean;
  allowConflictingAppointmentsOnManualScheduling?: boolean;
  conflicts?: AppointmentConflictSummary[];
}

export interface ManualTimeSlotResponse extends TimeSlotResponse {
  conflicting?: boolean;
  slotType?: "AVAILABLE" | "CONFLICT";
  badge?: string | null;
  conflicts?: AppointmentConflictSummary[];
}

export interface AppointmentSchedulingSettings {
  allowConflictingAppointmentsOnManualScheduling: boolean;
  updatedAt?: string;
}

export interface AvailableSlotsParams {
  professionalId: string;
  date: string;
  serviceDurationMinutes?: number;
  serviceIds?: string[];
  bufferMinutes?: number;
}
