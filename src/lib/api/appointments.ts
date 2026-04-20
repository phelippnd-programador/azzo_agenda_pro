import type {
  Appointment,
  AppointmentCustomerNote,
  AppointmentCreateItemInput,
  AppointmentDetailResponse,
  AppointmentManagementReportResponse,
  NoShowReportPageResponse,
} from "@/types";
import type {
  AppointmentSchedulingSettings,
  AvailableSlotsParams,
  ManualTimeSlotResponse,
  TimeSlotResponse,
} from "@/types/available-slots";
import type { AppointmentsListParams, ListResponse, NoShowReportParams } from "./contracts";
import { buildListQuery, request, requestBlob } from "./core";

export type AppointmentCreateRequest = {
  clientId: string;
  professionalId: string;
  date: string;
  startTime: string;
  endTime?: string;
  status?: Appointment["status"];
  notes?: string;
  serviceId?: string;
  totalPrice?: number;
  items?: AppointmentCreateItemInput[];
  origin?: string;
  allowConflict?: boolean;
  conflictAcknowledged?: boolean;
};

export type AppointmentCustomerNoteRequest = {
  serviceExecutionNotes?: string;
  clientFeedbackNotes?: string;
  internalFollowupNotes?: string;
};

export type AppointmentMonthlyMetric = {
  dia: number;
  mes: number;
  quantidadeAgendamentos: number;
};

export type AppointmentManagementReportParams = {
  from?: string;
  to?: string;
  professionalId?: string;
  serviceId?: string;
  status?: string;
  limit?: number;
};

export const appointmentsApi = {
  getAll: (params?: AppointmentsListParams) => {
    const query = buildListQuery(params);
    if (params?.date) query.set("date", params.date);
    if (params?.professionalId && params.professionalId !== "all") {
      query.set("professionalId", params.professionalId);
    }
    if (params?.status && params.status !== "all") {
      query.set("status", params.status);
    }
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<ListResponse<Appointment>>(`/appointments${suffix}`);
  },
  getById: (id: string) => request<AppointmentDetailResponse>(`/appointments/${id}`),
  create: (data: AppointmentCreateRequest) =>
    request<Appointment>("/appointments", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getAvailableSlots: (params: AvailableSlotsParams) => {
    const query = new URLSearchParams({
      professionalId: params.professionalId,
      date: params.date,
      bufferMinutes: String(params.bufferMinutes ?? 0),
    });
    if (params.serviceIds?.length) {
      query.set("serviceIds", params.serviceIds.join(","));
    } else if (params.serviceDurationMinutes && params.serviceDurationMinutes > 0) {
      query.set("serviceDurationMinutes", String(params.serviceDurationMinutes));
    }
    return request<TimeSlotResponse[]>(`/appointments/available-slots?${query.toString()}`);
  },
  getManualSlots: (params: AvailableSlotsParams) => {
    const query = new URLSearchParams({
      professionalId: params.professionalId,
      date: params.date,
      bufferMinutes: String(params.bufferMinutes ?? 0),
    });
    if (params.serviceIds?.length) {
      query.set("serviceIds", params.serviceIds.join(","));
    } else if (params.serviceDurationMinutes && params.serviceDurationMinutes > 0) {
      query.set("serviceDurationMinutes", String(params.serviceDurationMinutes));
    }
    return request<ManualTimeSlotResponse[]>(`/appointments/manual-slots?${query.toString()}`);
  },
  getSettings: () => request<AppointmentSchedulingSettings>("/appointments/settings"),
  updateSettings: (payload: Partial<AppointmentSchedulingSettings>) =>
    request<AppointmentSchedulingSettings>("/appointments/settings", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  getMonthlyMetric: (mes: number, ano: number) =>
    request<AppointmentMonthlyMetric[]>(`/appointments/metric?mes=${mes}&ano=${ano}`),
  getManagementReport: (params?: AppointmentManagementReportParams) => {
    const query = new URLSearchParams();
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    if (params?.professionalId && params.professionalId !== "all") {
      query.set("professionalId", params.professionalId);
    }
    if (params?.serviceId && params.serviceId !== "all") {
      query.set("serviceId", params.serviceId);
    }
    if (params?.status && params.status !== "all") {
      query.set("status", params.status);
    }
    if (params?.limit) query.set("limit", String(params.limit));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<AppointmentManagementReportResponse>(`/appointments/management-report${suffix}`);
  },
  exportManagementReport: (params?: AppointmentManagementReportParams) => {
    const query = new URLSearchParams();
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    if (params?.professionalId && params.professionalId !== "all") {
      query.set("professionalId", params.professionalId);
    }
    if (params?.serviceId && params.serviceId !== "all") {
      query.set("serviceId", params.serviceId);
    }
    if (params?.status && params.status !== "all") {
      query.set("status", params.status);
    }
    if (params?.limit) query.set("limit", String(params.limit));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return requestBlob(`/appointments/management-report/export${suffix}`);
  },
  getNoShowReport: (params?: NoShowReportParams) => {
    const query = new URLSearchParams();
    if (params?.afterId) query.set("afterId", params.afterId);
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    if (params?.professionalId && params.professionalId !== "all") {
      query.set("professionalId", params.professionalId);
    }
    if (params?.serviceId && params.serviceId !== "all") {
      query.set("serviceId", params.serviceId);
    }
    if (params?.clientIds?.length) query.set("clientIds", params.clientIds.join(","));
    if (params?.clientQuery?.trim()) query.set("clientQuery", params.clientQuery.trim());
    if (params?.groupBy) query.set("groupBy", params.groupBy);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<NoShowReportPageResponse>(`/appointments/no-show${suffix}`);
  },
  exportNoShowReport: (params?: Omit<NoShowReportParams, "afterId" | "limit">) => {
    const query = new URLSearchParams();
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    if (params?.professionalId && params.professionalId !== "all") {
      query.set("professionalId", params.professionalId);
    }
    if (params?.serviceId && params.serviceId !== "all") {
      query.set("serviceId", params.serviceId);
    }
    if (params?.clientIds?.length) query.set("clientIds", params.clientIds.join(","));
    if (params?.clientQuery?.trim()) query.set("clientQuery", params.clientQuery.trim());
    if (params?.groupBy) query.set("groupBy", params.groupBy);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return requestBlob(`/appointments/no-show/export${suffix}`);
  },
  updateStatus: (id: string, status: string) =>
    request<Appointment>(`/appointments/${id}/status?value=${status}`, {
      method: "PATCH",
    }),
  addCustomerNote: (appointmentId: string, payload: AppointmentCustomerNoteRequest) =>
    request<AppointmentCustomerNote>(`/appointments/${appointmentId}/customer-notes`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateCustomerNote: (
    appointmentId: string,
    noteId: string,
    payload: AppointmentCustomerNoteRequest
  ) =>
    request<AppointmentCustomerNote>(`/appointments/${appointmentId}/customer-notes/${noteId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  reassignProfessional: (appointmentId: string, professionalId: string) =>
    request<Appointment>(
      `/appointments/${appointmentId}/reassign-professional?professionalId=${encodeURIComponent(professionalId)}`,
      {
        method: "PATCH",
      }
    ),
  delete: (id: string) =>
    request<void>(`/appointments/${id}`, {
      method: "DELETE",
    }),
};
