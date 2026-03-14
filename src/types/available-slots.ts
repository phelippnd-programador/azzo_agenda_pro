export interface TimeSlotResponse {
  startTime: string;
  endTime: string;
  optimizationScore: number;
}

export interface AvailableSlotsParams {
  professionalId: string;
  date: string;
  serviceDurationMinutes?: number;
  serviceIds?: string[];
  bufferMinutes?: number;
}
