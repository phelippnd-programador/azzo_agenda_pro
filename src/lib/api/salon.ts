import { request } from "./core";

export type SalonBusinessHours = {
  day: string;
  enabled: boolean;
  open: string;
  close: string;
};

export type SalonSpecialClosureDate = {
  date: string;
  reason?: string | null;
};

export type SalonProfile = {
  salonName: string;
  salonSlug: string;
  publicBookingUrl?: string | null;
  logo?: string | null;
  logoUrl?: string | null;
  salonDescription?: string | null;
  salonPhone?: string | null;
  salonWhatsapp?: string | null;
  salonCpfCnpj?: string | null;
  salonEmail?: string | null;
  salonWebsite?: string | null;
  salonInstagram?: string | null;
  salonFacebook?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  businessHours: SalonBusinessHours[];
  specialClosureDates: SalonSpecialClosureDate[];
};

export type AddressLookup = {
  cep: string;
  street: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  source?: string | null;
};

export const salonApi = {
  getProfile: () => request<SalonProfile>("/salon/profile"),
  updateProfile: (data: Partial<SalonProfile>) =>
    request<SalonProfile>("/salon/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  uploadLogo: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<SalonProfile>("/salon/profile/logo", {
      method: "POST",
      body: formData,
    });
  },
  removeLogo: () =>
    request<SalonProfile>("/salon/profile/logo", {
      method: "DELETE",
    }),
  getPublicBySlug: (slug: string) =>
    request<Partial<SalonProfile> & { logo?: string | null; logoUrl?: string | null }>(
      `/public/salons/${slug}`
    ),
};

export const utilsApi = {
  getAddressByCep: (cep: string) => request<AddressLookup>(`/utils/addresses/${cep}`),
};
