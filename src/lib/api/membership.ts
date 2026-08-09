import { request } from "./core";

export type MembershipBenefit = {
  serviceId: string;
  quantidadeMensal: number;
};

export type MembershipPlan = {
  id: string;
  nome: string;
  descricao?: string | null;
  precoMensal: number;
  cumulativo: boolean;
  ativo: boolean;
  beneficios: MembershipBenefit[];
};

export type MembershipPlanRequest = {
  nome: string;
  descricao?: string;
  precoMensal: number;
  cumulativo: boolean;
  ativo: boolean;
  beneficios: MembershipBenefit[];
};

export type ClientMembership = {
  id: string;
  planId: string;
  planNome: string;
  status: "ATIVA" | "INADIMPLENTE" | "SUSPENSA" | "CANCELADA";
  periodStart?: string | null;
  periodEnd?: string | null;
  cancelAtPeriodEnd: boolean;
  saldos: Array<{
    serviceId: string;
    quantidadeMensal: number;
    usadasNoPeriodo: number;
    disponivel: number;
  }>;
};

export const membershipApi = {
  listarPlanos: () => request<MembershipPlan[]>("/membership-plans"),
  obterPlano: (id: string) => request<MembershipPlan>(`/membership-plans/${id}`),
  criarPlano: (data: MembershipPlanRequest) =>
    request<MembershipPlan>("/membership-plans", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  atualizarPlano: (id: string, data: MembershipPlanRequest) =>
    request<MembershipPlan>(`/membership-plans/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  listarDoCliente: (clientId: string) =>
    request<ClientMembership[]>(`/clients/${clientId}/memberships`),
  aderir: (clientId: string, planId: string) =>
    request<ClientMembership>(`/clients/${clientId}/memberships`, {
      method: "POST",
      body: JSON.stringify({ planId }),
    }),
  cancelar: (id: string, imediato = false) =>
    request<ClientMembership>(`/memberships/${id}/cancelar`, {
      method: "POST",
      body: JSON.stringify({ imediato }),
    }),
};
