import type { Client, Professional, Service } from "@/lib/api";
import type {
  AppointmentConflictDetails,
  AppointmentConflictSummary,
} from "@/types/available-slots";

export type CreateAppointmentPayload = {
  clientId: string;
  professionalId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "PENDING";
  totalPrice: number;
  items: Array<{
    serviceId: string;
    durationMinutes: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  origin?: string;
  allowConflict?: boolean;
  conflictAcknowledged?: boolean;
};

export interface NewAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDate: Date;
  isProfessionalUser: boolean;
  loggedProfessional: Professional | null;
  activeProfessionals: Professional[];
  createAppointment: (payload: CreateAppointmentPayload) => Promise<void>;
}

export const stepItems = [
  { number: 1, title: "Cliente" },
  { number: 2, title: "Servico" },
  { number: 3, title: "Profissional" },
  { number: 4, title: "Data e horario" },
  { number: 5, title: "Revisao" },
] as const;

export type NewAppointmentClient = Client;
export type NewAppointmentService = Service;
export type NewAppointmentProfessional = Professional;

export const serviceHasAssignedProfessionals = (
  professionalIds?: string[] | null,
) => Array.isArray(professionalIds) && professionalIds.length > 0;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const calculateEndTime = (startTime: string, durationMinutes: number) => {
  const [hours, minutes] = startTime.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes) || durationMinutes <= 0) {
    return "";
  }

  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const normalizedHours = Math.floor(totalMinutes / 60) % 24;
  const normalizedMinutes = totalMinutes % 60;

  return `${String(normalizedHours).padStart(2, "0")}:${String(
    normalizedMinutes,
  ).padStart(2, "0")}`;
};

export const extractConflictDetails = (
  value: unknown,
): AppointmentConflictDetails | null => {
  if (!isObject(value)) return null;

  const candidate = isObject(value.details) ? value.details : value;
  if (!isObject(candidate)) return null;

  return {
    requestedDate:
      typeof candidate.requestedDate === "string"
        ? candidate.requestedDate
        : undefined,
    requestedStartTime:
      typeof candidate.requestedStartTime === "string"
        ? candidate.requestedStartTime
        : undefined,
    requestedEndTime:
      typeof candidate.requestedEndTime === "string"
        ? candidate.requestedEndTime
        : undefined,
    origin: typeof candidate.origin === "string" ? candidate.origin : undefined,
    canOverride:
      typeof candidate.canOverride === "boolean"
        ? candidate.canOverride
        : undefined,
    allowConflictingAppointmentsOnManualScheduling:
      typeof candidate.allowConflictingAppointmentsOnManualScheduling ===
      "boolean"
        ? candidate.allowConflictingAppointmentsOnManualScheduling
        : undefined,
    conflicts: Array.isArray(candidate.conflicts)
      ? (candidate.conflicts as AppointmentConflictSummary[])
      : [],
  };
};

export const buildConflictDetailsFromSlot = (
  slot: {
    startTime: string;
    endTime: string;
    conflicts?: AppointmentConflictSummary[];
  },
  date: string,
): AppointmentConflictDetails => ({
  requestedDate: date,
  requestedStartTime: String(slot.startTime).slice(0, 5),
  requestedEndTime: String(slot.endTime).slice(0, 5),
  canOverride: true,
  allowConflictingAppointmentsOnManualScheduling: true,
  conflicts: slot.conflicts || [],
});

export const getConflictBlockedMessage = (
  details: AppointmentConflictDetails | null,
) => {
  if (!details) {
    return "Este estabelecimento nao permite criar agendamento em horario ja ocupado para o mesmo profissional.";
  }

  return details.allowConflictingAppointmentsOnManualScheduling === false
    ? "Este estabelecimento esta com o conflito manual desativado. Ajuste a configuracao da agenda para permitir agendamento em horario ja ocupado."
    : "Este horario nao pode ser assumido manualmente na configuracao atual do estabelecimento.";
};
