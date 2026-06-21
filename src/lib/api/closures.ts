import { request } from "./core";

export type ClosureType =
  | "HOLIDAY"
  | "VACATION"
  | "RECESS"
  | "INTERNAL_EVENT"
  | "MANUAL";

export interface SpecialClosure {
  id?: string;
  closureDate: string;
  closureType: ClosureType;
  allDay: boolean;
  startTime?: string;
  endTime?: string;
  reason?: string;
  professionalId?: string;
  professionalName?: string;
}

export interface AffectedAppointment {
  id: string;
  clientName: string;
  time: string;
  service: string;
}

export interface ClosureImpact {
  affectedAppointments: AffectedAppointment[];
  closure: SpecialClosure;
}

export const closuresApi = {
  list: (from: string, to: string, professionalId?: string): Promise<SpecialClosure[]> => {
    const params = new URLSearchParams({ from, to });
    if (professionalId) params.set("professionalId", professionalId);
    return request<SpecialClosure[]>(`/settings/closures?${params.toString()}`);
  },

  create: (data: SpecialClosure): Promise<ClosureImpact> =>
    request<ClosureImpact>("/settings/closures", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  confirm: (data: SpecialClosure): Promise<void> =>
    request<void>("/settings/closures/confirm", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: SpecialClosure): Promise<void> =>
    request<void>(`/settings/closures/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  remove: (id: string): Promise<void> =>
    request<void>(`/settings/closures/${id}`, {
      method: "DELETE",
    }),
};
