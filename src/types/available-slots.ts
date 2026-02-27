export interface TimeSlotResponse {
  startTime: string;
  endTime: string;
  optimizationScore: number;
}

export interface AvailableSlotsParams {
  professionalId: string;
  date: string;
  serviceDurationMinutes: number;
  bufferMinutes?: number;
}
