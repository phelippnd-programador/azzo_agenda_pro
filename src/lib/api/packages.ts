import { request } from "./core";

// F04 — pacotes de servicos (venda antecipada de sessoes)

export type PackageItem = {
  serviceId: string;
  sessoes: number;
};

export type ServicePackage = {
  id: string;
  nome: string;
  descricao?: string | null;
  preco: number;
  validadeDias: number;
  ativo: boolean;
  itens: PackageItem[];
};

export type ServicePackageRequest = {
  nome: string;
  descricao?: string;
  preco: number;
  validadeDias: number;
  ativo?: boolean;
  itens: PackageItem[];
};

export type ClientPackageBalance = {
  serviceId: string;
  sessoesTotal: number;
  sessoesUsadas: number;
  sessoesDisponiveis: number;
};

export type ClientPackage = {
  id: string;
  packageId: string;
  nome: string;
  precoPago: number;
  status: "ATIVO" | "ESGOTADO" | "EXPIRADO" | "CANCELADO";
  expiresAt: string;
  saldos: ClientPackageBalance[];
};

export const packagesApi = {
  listar: () => request<ServicePackage[]>("/packages"),

  obter: (id: string) => request<ServicePackage>(`/packages/${id}`),

  criar: (data: ServicePackageRequest) =>
    request<ServicePackage>("/packages", { method: "POST", body: JSON.stringify(data) }),

  atualizar: (id: string, data: ServicePackageRequest) =>
    request<ServicePackage>(`/packages/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  listarDoCliente: (clientId: string) =>
    request<ClientPackage[]>(`/clients/${clientId}/packages`),

  vender: (clientId: string, data: { packageId: string; comandaId?: string; quantidade?: number }) =>
    request<{ comandaId: string }>(`/clients/${clientId}/packages`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
