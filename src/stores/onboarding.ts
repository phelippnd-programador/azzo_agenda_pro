import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WorkingHoursDraft = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isWorking: boolean;
};

export type ProfessionalDraft = {
  id?: string;
  /** Usuario vinculado. Permite saber se o dono ja se cadastrou como profissional. */
  userId?: string;
  name: string;
  email: string;
  phone: string;
  specialties: string[];
  workingHours: WorkingHoursDraft[];
};

export type ServiceDraft = {
  id?: string;
  name: string;
  durationMinutes: number;
  price: number;
  description?: string;
  category: string;
  professionalIds: string[];
};

export type SalonDraft = {
  name: string;
  type: string;
  phone: string;
  city: string;
  state: string;
  email?: string;
  logoUrl?: string;
};

type OnboardingStore = {
  currentStep: number;
  salonData: SalonDraft | null;
  professionals: ProfessionalDraft[];
  services: ServiceDraft[];
  setStep: (step: number) => void;
  setSalonData: (data: SalonDraft) => void;
  addProfessional: (p: ProfessionalDraft) => void;
  updateProfessional: (index: number, p: ProfessionalDraft) => void;
  removeProfessional: (index: number) => void;
  addService: (s: ServiceDraft) => void;
  updateService: (index: number, s: ServiceDraft) => void;
  removeService: (index: number) => void;
  /** Substitui as listas locais pelo que existe de fato no backend (retomada em outro dispositivo/sessao). */
  hydrateFromServer: (data: { professionals: ProfessionalDraft[]; services: ServiceDraft[] }) => void;
  reset: () => void;
};

const initialState = {
  currentStep: 0,
  salonData: null,
  professionals: [],
  services: [],
};

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      ...initialState,
      setStep: (step) => set({ currentStep: step }),
      setSalonData: (data) => set({ salonData: data }),
      addProfessional: (p) =>
        set((state) => ({ professionals: [...state.professionals, p] })),
      updateProfessional: (index, p) =>
        set((state) => {
          const updated = [...state.professionals];
          updated[index] = p;
          return { professionals: updated };
        }),
      removeProfessional: (index) =>
        set((state) => ({
          professionals: state.professionals.filter((_, i) => i !== index),
        })),
      addService: (s) =>
        set((state) => ({ services: [...state.services, s] })),
      updateService: (index, s) =>
        set((state) => {
          const updated = [...state.services];
          updated[index] = s;
          return { services: updated };
        }),
      removeService: (index) =>
        set((state) => ({
          services: state.services.filter((_, i) => i !== index),
        })),
      hydrateFromServer: ({ professionals, services }) => set({ professionals, services }),
      reset: () => set(initialState),
    }),
    {
      name: "azzo:onboarding:draft",
      // v2: ServiceDraft/ProfessionalDraft mudaram de forma (category/
      // professionalIds; email/phone/specialties/workingHours) para bater
      // com o cadastro real. Rascunhos salvos com a forma antiga quebravam
      // as novas telas (ex.: p.specialties.map em profissional sem esse
      // campo) ao avancar de etapa. Como esses dados nunca foram
      // persistidos de verdade no backend (o wizard antigo nao chamava
      // nenhuma API real), e seguro descartar e comecar do zero.
      version: 2,
      migrate: () => ({ ...initialState }),
    }
  )
);
