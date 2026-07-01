import type { Professional, Service } from "@/types";
import { request } from "./core";

export const publicBookingApi = {
  getServices: (slug: string) => request<Service[]>(`/public/salons/${slug}/services`),
  getProfessionals: (slug: string, serviceId?: string, serviceIds?: string[]) => {
    const query = new URLSearchParams();
    if (serviceId) query.set("serviceId", serviceId);
    if (serviceIds?.length) query.set("serviceIds", serviceIds.join(","));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<Professional[]>(`/public/salons/${slug}/professionals${suffix}`);
  },
  getAvailability: (params: {
    slug: string;
    date: string;
    serviceId?: string;
    serviceIds?: string[];
    professionalId?: string;
  }) => {
    const query = new URLSearchParams({ date: params.date });
    if (params.serviceId) query.set("serviceId", params.serviceId);
    if (params.serviceIds?.length) query.set("serviceIds", params.serviceIds.join(","));
    if (params.professionalId) query.set("professionalId", params.professionalId);
    return request<{ date: string; slots: Array<{ time: string; available: boolean }> }>(
      `/public/salons/${params.slug}/availability?${query.toString()}`
    );
  },
  createAppointment: (
    slug: string,
    data: {
      customerName: string;
      customerPhone: string;
      customerEmail?: string;
      professionalId: string;
      serviceId?: string;
      items?: Array<{
        serviceId: string;
        quantity?: number;
      }>;
      date: string;
      startTime: string;
    }
  ) =>
    request<{ appointmentId: string; status: string; message?: string }>(
      `/public/salons/${slug}/appointments`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    ),
};
