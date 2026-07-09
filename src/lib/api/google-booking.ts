import { request } from "./core";

export type GoogleBookingConfig = {
  habilitado: boolean;
  placeId?: string | null;
  bookingLink?: string | null;
};

export const googleBookingApi = {
  obter: () => request<GoogleBookingConfig>("/settings/google-booking"),
  salvar: (data: { habilitado: boolean; placeId?: string | null }) =>
    request<GoogleBookingConfig>("/settings/google-booking", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};
