import { request, requestBlob } from "./core";

export type EstoqueReportSummary = {
  totalEntradas: number;
  totalSaidas: number;
  totalAjustes: number;
  valorTotalEntradas: number;
  valorTotalSaidas: number;
  itensAbaixoMinimo: number;
};

export type EstoqueMovimentacaoItem = {
  id: string;
  tipo: "ENTRADA" | "SAIDA" | "AJUSTE";
  itemId: string;
  itemNome: string;
  unidadeMedida: string;
  quantidade: number;
  saldoAnterior: number;
  saldoPosterior: number;
  motivo: string | null;
  origem: string | null;
  valorUnitarioPago: number;
  valorTotalMovimentacao: number;
  createdAt: string;
};

export type EstoqueReportResponse = {
  summary: EstoqueReportSummary;
  items: EstoqueMovimentacaoItem[];
};

export type VendasServicoItem = {
  servicoId: string;
  servicoNome: string;
  totalAgendamentos: number;
  receitaTotal: number;
  ticketMedio: number;
};

export type VendasProfissionalItem = {
  profissionalId: string;
  profissionalNome: string;
  totalAgendamentos: number;
  receitaTotal: number;
  ticketMedio: number;
};

export type VendasReportResponse = {
  summary: {
    totalAgendamentos: number;
    receitaTotal: number;
    ticketMedio: number;
  };
  topServicos: VendasServicoItem[];
  topProfissionais: VendasProfissionalItem[];
};

export type ClienteReportItem = {
  clienteId: string;
  clienteNome: string;
  clientePhone: string | null;
  clienteEmail: string | null;
  totalVisitas: number;
  receitaTotal: number;
  ultimaVisita: string | null;
  diasSemVisita: number;
  inativo: boolean;
};

export type ClientesReportResponse = {
  summary: {
    totalClientes: number;
    clientesAtivos: number;
    clientesInativos: number;
    receitaTotal: number;
  };
  items: ClienteReportItem[];
};

export type GerencialReportResponse = {
  financeiro: {
    receitaTotal: number;
    despesaTotal: number;
    saldo: number;
  };
  agendamentos: {
    totalAgendamentos: number;
    agendamentosConcluidos: number;
    agendamentosCancelados: number;
    ticketMedio: number;
  };
  topServicos: VendasServicoItem[];
  topProfissionais: VendasProfissionalItem[];
  serieDiaria: Array<{ date: string; receita: number; despesa: number }>;
  occupancyRate?: number | null;
};

export type HeatmapCell = {
  diaSemana: number;
  hora: number;
  agendamentos: number;
  minutosOcupados: number;
  minutosDisponiveis: number;
  ocupacaoPercent: number | null;
};

export type HeatmapReportResponse = {
  dataInicio: string;
  dataFim: string;
  professionalId?: string | null;
  matrix: HeatmapCell[][];
};

export type CatalogReportResponse = {
  reportKey: string;
  title: string;
  dependencies: string[];
  columns: string[];
  rows: Array<Record<string, unknown>>;
  pageIndex: number;
  pageSize: number;
  hasMore: boolean;
};

export type LicencaTenantItem = {
  tenantId: string;
  tenantNome: string;
  tenantEmail: string | null;
  planStatus: string;
  billingType: string | null;
  validUntil: string | null;
  diasRestantes: number;
  vencido: boolean;
  createdAt: string;
};

export type LicencasAdminReportResponse = {
  totalTenants: number;
  ativosCount: number;
  trialCount: number;
  expiradosCount: number;
  bloqueadosCount: number;
  items: LicencaTenantItem[];
};

export const reportsApi = {
  getEstoque: (params?: { from?: string; to?: string; itemId?: string; tipo?: string }) => {
    const q = new URLSearchParams();
    if (params?.from) q.set("from", params.from);
    if (params?.to) q.set("to", params.to);
    if (params?.itemId) q.set("itemId", params.itemId);
    if (params?.tipo) q.set("tipo", params.tipo);
    const suffix = q.toString() ? `?${q.toString()}` : "";
    return request<EstoqueReportResponse>(`/reports/estoque${suffix}`);
  },
  getVendas: (params?: { from?: string; to?: string; professionalId?: string }) => {
    const q = new URLSearchParams();
    if (params?.from) q.set("from", params.from);
    if (params?.to) q.set("to", params.to);
    if (params?.professionalId) q.set("professionalId", params.professionalId);
    const suffix = q.toString() ? `?${q.toString()}` : "";
    return request<VendasReportResponse>(`/reports/vendas${suffix}`);
  },
  getClientes: (params?: { from?: string; to?: string; onlyInactive?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.from) q.set("from", params.from);
    if (params?.to) q.set("to", params.to);
    if (params?.onlyInactive) q.set("onlyInactive", "true");
    const suffix = q.toString() ? `?${q.toString()}` : "";
    return request<ClientesReportResponse>(`/reports/clientes${suffix}`);
  },
  getGerencial: (params?: { from?: string; to?: string }) => {
    const q = new URLSearchParams();
    if (params?.from) q.set("from", params.from);
    if (params?.to) q.set("to", params.to);
    const suffix = q.toString() ? `?${q.toString()}` : "";
    return request<GerencialReportResponse>(`/reports/gerencial${suffix}`);
  },
  getHeatmap: (params?: { dataInicio?: string; dataFim?: string; professionalId?: string }) => {
    const q = new URLSearchParams();
    if (params?.dataInicio) q.set("dataInicio", params.dataInicio);
    if (params?.dataFim) q.set("dataFim", params.dataFim);
    if (params?.professionalId) q.set("professionalId", params.professionalId);
    const suffix = q.toString() ? `?${q.toString()}` : "";
    return request<HeatmapReportResponse>(`/reports/heatmap${suffix}`);
  },
  getCatalog: (
    reportKey: string,
    params?: {
      dataInicio?: string;
      dataFim?: string;
      professionalId?: string;
      inactiveDays?: number;
      pageIndex?: number;
      pageSize?: number;
    }
  ) => {
    const q = new URLSearchParams();
    if (params?.dataInicio) q.set("dataInicio", params.dataInicio);
    if (params?.dataFim) q.set("dataFim", params.dataFim);
    if (params?.professionalId) q.set("professionalId", params.professionalId);
    if (typeof params?.inactiveDays === "number") q.set("inactiveDays", String(params.inactiveDays));
    if (typeof params?.pageIndex === "number") q.set("pageIndex", String(params.pageIndex));
    if (typeof params?.pageSize === "number") q.set("pageSize", String(params.pageSize));
    const suffix = q.toString() ? `?${q.toString()}` : "";
    return request<CatalogReportResponse>(`/reports/${reportKey}${suffix}`);
  },
  exportCatalog: (
    reportKey: string,
    params?: {
      dataInicio?: string;
      dataFim?: string;
      professionalId?: string;
      inactiveDays?: number;
      format?: "csv" | "xlsx";
    }
  ) => {
    const q = new URLSearchParams();
    if (params?.dataInicio) q.set("dataInicio", params.dataInicio);
    if (params?.dataFim) q.set("dataFim", params.dataFim);
    if (params?.professionalId) q.set("professionalId", params.professionalId);
    if (typeof params?.inactiveDays === "number") q.set("inactiveDays", String(params.inactiveDays));
    if (params?.format) q.set("format", params.format);
    const suffix = q.toString() ? `?${q.toString()}` : "";
    return requestBlob(`/reports/${reportKey}/export${suffix}`);
  },
  adminGetLicencas: () =>
    request<LicencasAdminReportResponse>("/billing/admin/reports/licencas"),
};
