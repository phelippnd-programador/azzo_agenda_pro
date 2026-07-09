import { request } from "./core";

export type GroupDashboard = {
  totalUnidades: number;
  faturamentoTotal: number;
  atendimentosTotal: number;
  npsMedio: number;
  ranking: Array<{
    tenantId: string;
    nomeSalao: string;
    faturamento: number;
    atendimentos: number;
    nps: number;
  }>;
};

export const groupsApi = {
  dashboard: () => request<GroupDashboard>("/group/dashboard"),
};
