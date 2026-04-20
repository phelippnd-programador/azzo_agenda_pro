import type {
  ClientImportErrorLine,
  ClientImportJob,
  ClientImportMode,
  ClientImportTemplateFormat,
} from "@/types/client-import";
import type {
  ServiceImportErrorLine,
  ServiceImportJob,
  ServiceImportMode,
  ServiceImportTemplateFormat,
} from "@/types/service-import";
import type {
  CreateStockInventoryRequest,
  CreateStockItemRequest,
  CreateStockMovementRequest,
  CreateStockPurchaseOrderRequest,
  CreateStockSupplierRequest,
  CreateStockTransferRequest,
  ReceiveStockPurchaseOrderRequest,
  StockDashboardResponse,
  StockImportErrorLine,
  StockImportJob,
  StockImportTemplateFormat,
  StockImportType,
  StockInventory,
  StockInventoryCountRequest,
  StockItem,
  StockMovement,
  StockPurchaseOrder,
  StockSettings,
  StockSupplier,
  StockTransfer,
} from "@/types/stock";
import type { ListQueryParams, ListResponse } from "./contracts";
import { buildListQuery, request, requestBlob } from "./core";

export const stockApi = {
  getItems: (
    params?: ListQueryParams & {
      ativo?: boolean;
      abaixoMinimo?: boolean;
      cursorCreatedAt?: string;
      cursorId?: string;
    }
  ) => {
    const query = buildListQuery(params);
    if (params?.cursorCreatedAt) query.set("cursorCreatedAt", params.cursorCreatedAt);
    if (params?.cursorId) query.set("cursorId", params.cursorId);
    if (typeof params?.ativo === "boolean") query.set("ativo", String(params.ativo));
    if (typeof params?.abaixoMinimo === "boolean") {
      query.set("abaixoMinimo", String(params.abaixoMinimo));
    }
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<ListResponse<StockItem>>(`/estoque/itens${suffix}`);
  },
  getItemById: (id: string) => request<StockItem>(`/estoque/itens/${id}`),
  createItem: (payload: CreateStockItemRequest) =>
    request<StockItem>("/estoque/itens", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateItem: (id: string, payload: Partial<CreateStockItemRequest>) =>
    request<StockItem>(`/estoque/itens/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  getMovements: (
    params?: ListQueryParams & {
      itemId?: string;
      tipo?: string;
      cursorCreatedAt?: string;
      cursorId?: string;
    }
  ) => {
    const query = buildListQuery(params);
    if (params?.cursorCreatedAt) query.set("cursorCreatedAt", params.cursorCreatedAt);
    if (params?.cursorId) query.set("cursorId", params.cursorId);
    if (params?.itemId) query.set("itemId", params.itemId);
    if (params?.tipo) query.set("tipo", params.tipo);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<ListResponse<StockMovement>>(`/estoque/movimentacoes${suffix}`);
  },
  createMovement: (payload: CreateStockMovementRequest) =>
    request<StockMovement>("/estoque/movimentacoes", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getDashboard: (params?: { inicio?: string; fim?: string; serviceId?: string; itemId?: string }) => {
    const query = new URLSearchParams();
    if (params?.inicio) query.set("inicio", params.inicio);
    if (params?.fim) query.set("fim", params.fim);
    if (params?.serviceId) query.set("serviceId", params.serviceId);
    if (params?.itemId) query.set("itemId", params.itemId);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<StockDashboardResponse>(`/estoque/dashboard${suffix}`);
  },
  listInventories: (params?: ListQueryParams & { cursorCreatedAt?: string; cursorId?: string }) => {
    const query = buildListQuery(params);
    if (params?.cursorCreatedAt) query.set("cursorCreatedAt", params.cursorCreatedAt);
    if (params?.cursorId) query.set("cursorId", params.cursorId);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<StockInventory[]>(`/estoque/inventarios${suffix}`);
  },
  createInventory: (payload: CreateStockInventoryRequest) =>
    request<StockInventory>("/estoque/inventarios", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getInventoryById: (id: string) => request<StockInventory>(`/estoque/inventarios/${id}`),
  registerInventoryCount: (id: string, payload: StockInventoryCountRequest) =>
    request<StockInventory>(`/estoque/inventarios/${id}/contagens`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  closeInventory: (id: string) =>
    request<StockInventory>(`/estoque/inventarios/${id}/fechamento`, {
      method: "POST",
    }),
  listSuppliers: (params?: ListQueryParams & { cursorCreatedAt?: string; cursorId?: string }) => {
    const query = buildListQuery(params);
    if (params?.cursorCreatedAt) query.set("cursorCreatedAt", params.cursorCreatedAt);
    if (params?.cursorId) query.set("cursorId", params.cursorId);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<StockSupplier[]>(`/estoque/fornecedores${suffix}`);
  },
  createSupplier: (payload: CreateStockSupplierRequest) =>
    request<StockSupplier>("/estoque/fornecedores", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateSupplier: (id: string, payload: Partial<CreateStockSupplierRequest>) =>
    request<StockSupplier>(`/estoque/fornecedores/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  listPurchaseOrders: (
    params?: ListQueryParams & { cursorCreatedAt?: string; cursorId?: string }
  ) => {
    const query = buildListQuery(params);
    if (params?.cursorCreatedAt) query.set("cursorCreatedAt", params.cursorCreatedAt);
    if (params?.cursorId) query.set("cursorId", params.cursorId);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<StockPurchaseOrder[]>(`/estoque/pedidos-compra${suffix}`);
  },
  createPurchaseOrder: (payload: CreateStockPurchaseOrderRequest) =>
    request<StockPurchaseOrder>("/estoque/pedidos-compra", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getPurchaseOrderById: (id: string) => request<StockPurchaseOrder>(`/estoque/pedidos-compra/${id}`),
  receivePurchaseOrder: (id: string, payload: ReceiveStockPurchaseOrderRequest) =>
    request<StockPurchaseOrder>(`/estoque/pedidos-compra/${id}/recebimento`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listTransfers: (params?: ListQueryParams & { cursorCreatedAt?: string; cursorId?: string }) => {
    const query = buildListQuery(params);
    if (params?.cursorCreatedAt) query.set("cursorCreatedAt", params.cursorCreatedAt);
    if (params?.cursorId) query.set("cursorId", params.cursorId);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<StockTransfer[]>(`/estoque/transferencias${suffix}`);
  },
  createTransfer: (payload: CreateStockTransferRequest) =>
    request<StockTransfer>("/estoque/transferencias", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  sendTransfer: (id: string) =>
    request<StockTransfer>(`/estoque/transferencias/${id}/enviar`, {
      method: "POST",
    }),
  receiveTransfer: (id: string) =>
    request<StockTransfer>(`/estoque/transferencias/${id}/receber`, {
      method: "POST",
    }),
  getSettings: () => request<StockSettings>("/estoque/configuracoes"),
  updateSettings: (payload: Partial<StockSettings>) =>
    request<StockSettings>("/estoque/configuracoes", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  listImportJobs: () => request<StockImportJob[]>("/estoque/importacoes"),
  downloadImportTemplate: (params: {
    tipoImportacao: StockImportType;
    formato?: StockImportTemplateFormat;
  }) => {
    const query = new URLSearchParams();
    query.set("tipoImportacao", params.tipoImportacao);
    query.set("formato", params.formato ?? "xlsx");
    return requestBlob(`/estoque/importacoes/modelo?${query.toString()}`);
  },
  createImportJob: (params: { arquivo: File; tipoImportacao: StockImportType; dryRun?: boolean }) => {
    const query = new URLSearchParams();
    query.set("tipoImportacao", params.tipoImportacao);
    if (typeof params.dryRun === "boolean") query.set("dryRun", String(params.dryRun));
    const formData = new FormData();
    formData.append("arquivo", params.arquivo);
    return request<StockImportJob>(`/estoque/importacoes?${query.toString()}`, {
      method: "POST",
      body: formData,
    });
  },
  getImportJobById: (jobId: string) => request<StockImportJob>(`/estoque/importacoes/${jobId}`),
  getImportErrors: (jobId: string) =>
    request<StockImportErrorLine[]>(`/estoque/importacoes/${jobId}/erros`),
  getImportResultFile: (jobId: string) =>
    request<{ downloadUrl: string; expiresAt: string }>(
      `/estoque/importacoes/${jobId}/arquivo-resultado`
    ),
  cancelImportJob: (jobId: string) =>
    request<StockImportJob>(`/estoque/importacoes/${jobId}/cancelar`, {
      method: "POST",
    }),
};

export const clientImportApi = {
  listImportJobs: () => request<ClientImportJob[]>("/clients/importacoes"),
  downloadImportTemplate: (params?: { formato?: ClientImportTemplateFormat }) => {
    const query = new URLSearchParams();
    query.set("formato", params?.formato ?? "xlsx");
    return requestBlob(`/clients/importacoes/modelo?${query.toString()}`);
  },
  createImportJob: (params: { arquivo: File; modoImportacao: ClientImportMode; dryRun?: boolean }) => {
    const formData = new FormData();
    formData.append("arquivo", params.arquivo);
    formData.append("modoImportacao", params.modoImportacao);
    if (typeof params.dryRun === "boolean") formData.append("dryRun", String(params.dryRun));
    return request<ClientImportJob>("/clients/importacoes", {
      method: "POST",
      body: formData,
    });
  },
  getImportJobById: (jobId: string) => request<ClientImportJob>(`/clients/importacoes/${jobId}`),
  getImportErrors: (jobId: string) =>
    request<ClientImportErrorLine[]>(`/clients/importacoes/${jobId}/erros`),
  cancelImportJob: (jobId: string) =>
    request<ClientImportJob>(`/clients/importacoes/${jobId}/cancelar`, {
      method: "POST",
    }),
};

export const serviceImportApi = {
  listImportJobs: () => request<ServiceImportJob[]>("/services/importacoes"),
  downloadImportTemplate: (params?: { formato?: ServiceImportTemplateFormat }) => {
    const query = new URLSearchParams();
    query.set("formato", params?.formato ?? "xlsx");
    return requestBlob(`/services/importacoes/modelo?${query.toString()}`);
  },
  createImportJob: (params: { arquivo: File; modoImportacao: ServiceImportMode; dryRun?: boolean }) => {
    const formData = new FormData();
    formData.append("arquivo", params.arquivo);
    formData.append("modoImportacao", params.modoImportacao);
    if (typeof params.dryRun === "boolean") formData.append("dryRun", String(params.dryRun));
    return request<ServiceImportJob>("/services/importacoes", {
      method: "POST",
      body: formData,
    });
  },
  getImportJobById: (jobId: string) => request<ServiceImportJob>(`/services/importacoes/${jobId}`),
  getImportErrors: (jobId: string) =>
    request<ServiceImportErrorLine[]>(`/services/importacoes/${jobId}/erros`),
  cancelImportJob: (jobId: string) =>
    request<ServiceImportJob>(`/services/importacoes/${jobId}/cancelar`, {
      method: "POST",
    }),
};
