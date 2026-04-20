import type { ApuracaoMensal, ApuracaoResumo } from "@/types/apuracao";
import type { TaxRegime } from "@/types/fiscal";
import type { Invoice, InvoiceFormData } from "@/types/invoice";
import { request, requestBlob } from "./core";

export type TaxConfig = {
  regime: TaxRegime;
  icmsRate: number;
  pisRate: number;
  cofinsRate: number;
  issuerRazaoSocial?: string;
  issuerNomeFantasia?: string;
  issuerCnpj?: string;
  issuerIe?: string;
  issuerIm?: string;
  issuerPhone?: string;
  issuerEmail?: string;
  issuerStreet?: string;
  issuerNumber?: string;
  issuerComplement?: string;
  issuerNeighborhood?: string;
  issuerCity?: string;
  issuerState?: string;
  issuerZipCode?: string;
  issuerUfCode?: string;
  nfceCscHomologation?: string;
  nfceCscIdTokenHomologation?: string;
  nfceCscProduction?: string;
  nfceCscIdTokenProduction?: string;
};

export type DanfeJobResponse = {
  jobId: string;
  invoiceId: string;
  status: "QUEUED" | "PROCESSING" | "DONE" | "ERROR";
  downloadUrl?: string;
  downloadAvailable?: boolean;
  downloadConsumed?: boolean;
  downloadExpiresAt?: string;
  errorCode?: string;
  errorMessage?: string;
  requestedAt?: string;
  finishedAt?: string;
};

export type FiscalCertificateResponse = {
  id: string;
  thumbprint: string;
  subjectName: string;
  validTo: string;
  status: "ACTIVE" | "INACTIVE" | "DELETED" | string;
  createdAt: string;
};

export type NfseConfig = {
  ambiente: "HOMOLOGACAO" | "PRODUCAO";
  municipioCodigoIbge: string;
  provedor: string;
  serieRps: string;
  aliquotaIssPadrao: number;
  itemListaServicoPadrao: string;
  codigoTributacaoMunicipio?: string;
  emissionMode: "MANUAL" | "ASK_ON_CLOSE" | "AUTO_ON_CLOSE";
  emitForCpfMode: "ALWAYS" | "ASK" | "NEVER_AUTO";
  autoIssueOnAppointmentClose: boolean;
};

export type NfseFiscalState = {
  codigoIbge: string;
  uf: string;
  nome: string;
  regiaoSigla?: string;
  regiaoNome?: string;
};

export type NfseFiscalMunicipality = {
  codigoIbge: string;
  nome: string;
  stateCodigoIbge: string;
  stateUf: string;
  stateNome: string;
  codigoTom?: string;
  codigoTomDv?: string;
  codigoTomComDv?: string;
};

export type NfseInvoiceCustomer = {
  type: "CPF" | "CNPJ" | "EXTERIOR";
  document?: string;
  countryCode?: string;
  documentType?: string;
  name: string;
  email?: string;
  phone?: string;
};

export type NfseInvoiceItem = {
  lineNumber: number;
  descricaoServico: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  itemListaServico: string;
  codigoTributacaoMunicipio?: string;
  aliquotaIss: number;
  valorIss: number;
};

export type NfseInvoice = {
  id: string;
  appointmentId?: string;
  ambiente: "HOMOLOGACAO" | "PRODUCAO";
  municipioCodigoIbge: string;
  provedor: string;
  fiscalStatus: string;
  operationalStatus?: string;
  numeroRps: number;
  serieRps: string;
  numeroNfse?: string;
  codigoVerificacao?: string;
  protocolo?: string;
  dataCompetencia: string;
  dataEmissao?: string;
  naturezaOperacao: string;
  itemListaServico: string;
  codigoTributacaoMunicipio?: string;
  valorServicos: number;
  valorDeducoes: number;
  valorIss: number;
  aliquotaIss: number;
  issRetido: boolean;
  notes?: string;
  customer: NfseInvoiceCustomer;
  items: NfseInvoiceItem[];
  createdAt?: string;
  updatedAt?: string;
};

export type NfseInvoiceListResponse = {
  items: NfseInvoice[];
  total: number;
  page: number;
  pageSize: number;
};

export type NfsePdfJobResponse = {
  jobId: string;
  invoiceId: string;
  status: "QUEUED" | "PROCESSING" | "DONE" | "ERROR";
  errorCode?: string;
  errorMessage?: string;
  requestedAt?: string;
  finishedAt?: string;
  downloadAvailable?: boolean;
  downloadConsumed?: boolean;
  downloadExpiresAt?: string;
};

export type NfseCertificateUnlockStatus = {
  active: boolean;
  unlockTokenId?: string;
  issuedAt?: string;
  expiresAt?: string;
  status: string;
};

export type NfseProviderCapabilities = {
  municipioCodigoIbge: string;
  provedor: string;
  layoutVersion: string;
  cancelSupported: boolean;
  cancelWindowHours?: number;
  cancelMode: "SYNC" | "ASYNC";
  acceptedCancelReasonCodes?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type NfseTomadorLookupAddress = {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
};

export type NfseTomadorLookupResponse = {
  document: string;
  name: string;
  tradeName?: string;
  email?: string;
  phone?: string;
  source?: string;
  status?: string;
  active?: boolean;
  address?: NfseTomadorLookupAddress;
};

export type NfseAccountingExportFormat = "CSV" | "XLSX" | "ZIP_XML";

const generateIdempotencyKey = (prefix: string) => {
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${randomPart}`;
};

const withIdempotencyHeader = (prefix: string) => ({
  "X-Idempotency-Key": generateIdempotencyKey(prefix),
});

type FiscalInvoiceApi = Partial<Invoice> & {
  numeroNf?: string;
  serieNf?: string;
  totalAmount?: number;
  createdAt?: string;
  status?: string;
  type?: string;
  items?: Array<{
    id?: string;
    description?: string;
    quantity?: number;
    unitPrice?: number;
    totalPrice?: number;
    cfop?: string;
    cst?: string;
  }>;
};

const mapInvoiceStatusToUi = (status?: string): Invoice["status"] => {
  const normalized = (status || "").toUpperCase();
  if (normalized === "AUTHORIZED" || normalized === "ISSUED") return "ISSUED";
  if (normalized === "GENERATED") return "GENERATED";
  if (normalized === "SIGNED") return "SIGNED";
  if (normalized === "SUBMITTED") return "SUBMITTED";
  if (normalized === "CONTINGENCY_PENDING") return "CONTINGENCY_PENDING";
  if (normalized === "REJECTED") return "REJECTED";
  if (normalized === "CANCEL_PENDING") return "CANCEL_PENDING";
  if (normalized === "CANCELLED") return "CANCELLED";
  if (normalized === "INUTILIZED") return "INUTILIZED";
  if (normalized === "ERROR_FINAL") return "ERROR_FINAL";
  return "DRAFT";
};

const mapInvoiceTypeToUi = (type?: string): Invoice["type"] => {
  const normalized = (type || "").toUpperCase();
  if (normalized === "NFCE" || normalized === "65") return "NFCE";
  return "NFE";
};

const mapInvoiceStatusToApiFilter = (status?: "DRAFT" | "ISSUED" | "CANCELLED") => {
  if (!status) return undefined;
  if (status === "ISSUED") return "AUTHORIZED";
  return status;
};

const mapFiscalInvoiceToUi = (invoice: FiscalInvoiceApi): Invoice => {
  const items = Array.isArray(invoice.items)
    ? invoice.items.map((item, index) => ({
        id: item.id || String(index + 1),
        description: item.description || "Item fiscal",
        quantity: Number(item.quantity || 1),
        unitPrice: Number(item.unitPrice || 0),
        totalPrice: Number(item.totalPrice || 0),
        cfop: item.cfop || "",
        cst: item.cst || "",
      }))
    : [];

  const totalValue =
    typeof invoice.totalValue === "number"
      ? invoice.totalValue
      : typeof invoice.totalAmount === "number"
        ? invoice.totalAmount
        : items.reduce((sum, item) => sum + item.totalPrice, 0);

  return {
    id: invoice.id || "",
    number: invoice.number || invoice.numeroNf || "-",
    series: invoice.series || invoice.serieNf || "1",
    type: mapInvoiceTypeToUi(invoice.type),
    status: mapInvoiceStatusToUi(invoice.status),
    customer: invoice.customer || {
      type: "CPF",
      document: "",
      name: "Cliente",
    },
    items,
    operationNature: invoice.operationNature || "Prestacao de servicos",
    issueDate: invoice.issueDate || invoice.createdAt || new Date().toISOString(),
    totalValue,
    taxBreakdown: invoice.taxBreakdown || {
      icms: 0,
      pis: 0,
      cofins: 0,
    },
    notes: invoice.notes,
    appointmentId: invoice.appointmentId,
    accessKey: invoice.accessKey,
    authorizationProtocol: invoice.authorizationProtocol,
  };
};

export const fiscalApi = {
  getTaxConfig: () => request<TaxConfig>("/fiscal/tax-config"),
  updateTaxConfig: (data: TaxConfig) =>
    request<TaxConfig>("/fiscal/tax-config", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  listInvoices: (params?: {
    status?: "DRAFT" | "ISSUED" | "CANCELLED";
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const query = new URLSearchParams();
    const mappedStatus = mapInvoiceStatusToApiFilter(params?.status);
    if (mappedStatus) query.set("status", mappedStatus);
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    if (params?.page) query.set("page", String(params.page));
    if (params?.pageSize) query.set("pageSize", String(params.pageSize));
    const suffix = query.toString() ? `?${query}` : "";
    return request<{ items: FiscalInvoiceApi[]; total: number; page: number; pageSize: number }>(
      `/fiscal/invoices${suffix}`
    ).then((response) => ({
      ...response,
      items: (response.items || []).map(mapFiscalInvoiceToUi),
    }));
  },
  getInvoice: (id: string) =>
    request<FiscalInvoiceApi>(`/fiscal/invoices/${id}`).then(mapFiscalInvoiceToUi),
  createInvoice: (data: InvoiceFormData & { status?: "DRAFT" | "ISSUED" }) =>
    request<FiscalInvoiceApi>("/fiscal/invoices", {
      method: "POST",
      headers: withIdempotencyHeader("fiscal-create-invoice"),
      body: JSON.stringify(data),
    }).then(mapFiscalInvoiceToUi),
  updateInvoice: (id: string, data: InvoiceFormData & { status?: "DRAFT" | "ISSUED" }) =>
    request<FiscalInvoiceApi>(`/fiscal/invoices/${id}`, {
      method: "PATCH",
      headers: withIdempotencyHeader(`fiscal-update-${id}`),
      body: JSON.stringify(data),
    }).then(mapFiscalInvoiceToUi),
  cancelInvoice: (id: string, reason?: string) =>
    request<FiscalInvoiceApi>(`/fiscal/invoices/${id}/cancel`, {
      method: "PATCH",
      headers: withIdempotencyHeader(`fiscal-cancel-${id}`),
      body: JSON.stringify(reason ? { reason } : {}),
    }).then(mapFiscalInvoiceToUi),
  authorizeInvoice: (id: string, certificatePassword?: string) =>
    request<FiscalInvoiceApi>(`/fiscal/invoices/${id}/authorize`, {
      method: "POST",
      headers: withIdempotencyHeader(`fiscal-authorize-${id}`),
      body: JSON.stringify({ certificatePassword }),
    }).then(mapFiscalInvoiceToUi),
  reprocessAuthorizeInvoice: (id: string, certificatePassword?: string) =>
    request<FiscalInvoiceApi>(`/fiscal/invoices/${id}/reprocess-authorize`, {
      method: "POST",
      headers: withIdempotencyHeader(`fiscal-reprocess-authorize-${id}`),
      body: JSON.stringify({ certificatePassword }),
    }).then(mapFiscalInvoiceToUi),
  listCertificates: () => request<FiscalCertificateResponse[]>("/fiscal/certificates"),
  uploadCertificate: (pfxBase64: string, password: string) =>
    request<FiscalCertificateResponse>("/fiscal/certificates", {
      method: "POST",
      body: JSON.stringify({ pfxBase64, password }),
    }),
  activateCertificate: (id: string) =>
    request<FiscalCertificateResponse>(`/fiscal/certificates/${id}/activate`, {
      method: "POST",
    }),
  deleteCertificate: (id: string) =>
    request<void>(`/fiscal/certificates/${id}/delete`, {
      method: "PATCH",
    }),
  requestInvoicePdfJob: (id: string) =>
    request<DanfeJobResponse>(`/fiscal/invoices/${id}/pdf/jobs`, {
      method: "POST",
    }),
  getInvoicePdfJobStatus: (id: string, jobId: string) =>
    request<DanfeJobResponse>(`/fiscal/invoices/${id}/pdf/jobs/${jobId}`),
  downloadInvoicePdfJob: (id: string, jobId: string) =>
    requestBlob(`/fiscal/invoices/${id}/pdf/jobs/${jobId}/download`),
  getInvoicePdf: (id: string) => requestBlob(`/fiscal/invoices/${id}/pdf`),
  getCurrentApuracao: () => request<ApuracaoMensal>("/fiscal/apuracoes/current"),
  getApuracaoByPeriodo: (ano: number, mes: number) =>
    request<ApuracaoMensal>(`/fiscal/apuracoes/${ano}/${mes}`),
  recalculateApuracao: (ano: number, mes: number) =>
    request<ApuracaoMensal>(`/fiscal/apuracoes/${ano}/${mes}/recalculate`, {
      method: "POST",
    }),
  getHistoricoApuracoes: (limite = 12) =>
    request<ApuracaoResumo[]>(`/fiscal/apuracoes/historico?limite=${limite}`),
  getResumoAnual: (ano: number) =>
    request<{
      totalServicos: number;
      totalImpostos: number;
      totalDocumentos: number;
      meses: ApuracaoResumo[];
    }>(`/fiscal/apuracoes/resumo-anual?ano=${ano}`),
};

export const nfseApi = {
  listStates: () => request<NfseFiscalState[]>("/fiscal/nfse/states"),
  listMunicipalities: (params?: { stateUf?: string; search?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.stateUf) query.set("stateUf", params.stateUf);
    if (params?.search) query.set("search", params.search);
    if (params?.limit) query.set("limit", String(params.limit));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<NfseFiscalMunicipality[]>(`/fiscal/nfse/municipalities${suffix}`);
  },
  getConfig: (ambiente: "HOMOLOGACAO" | "PRODUCAO" = "HOMOLOGACAO") =>
    request<NfseConfig>(`/fiscal/nfse/config?ambiente=${ambiente}`),
  saveConfig: (data: NfseConfig) =>
    request<NfseConfig>("/fiscal/nfse/config", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  listInvoices: (params?: { status?: string; page?: number; pageSize?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.page) query.set("page", String(params.page));
    if (params?.pageSize) query.set("pageSize", String(params.pageSize));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<NfseInvoiceListResponse>(`/fiscal/nfse/invoices${suffix}`);
  },
  getInvoice: (id: string) => request<NfseInvoice>(`/fiscal/nfse/invoices/${id}`),
  createInvoice: (payload: Omit<NfseInvoice, "id" | "fiscalStatus">) =>
    request<NfseInvoice>("/fiscal/nfse/invoices", {
      method: "POST",
      headers: withIdempotencyHeader("nfse-create-invoice"),
      body: JSON.stringify(payload),
    }),
  updateInvoice: (id: string, payload: Omit<NfseInvoice, "id" | "fiscalStatus">) =>
    request<NfseInvoice>(`/fiscal/nfse/invoices/${id}`, {
      method: "PUT",
      headers: withIdempotencyHeader(`nfse-update-${id}`),
      body: JSON.stringify(payload),
    }),
  authorizeInvoice: (id: string, payload: { certificatePassword?: string; unlockTokenId?: string }) =>
    request<NfseInvoice>(`/fiscal/nfse/invoices/${id}/authorize`, {
      method: "POST",
      headers: withIdempotencyHeader(`nfse-authorize-${id}`),
      body: JSON.stringify(payload),
    }),
  cancelInvoice: (id: string, reason: string) =>
    request<NfseInvoice>(`/fiscal/nfse/invoices/${id}/cancel`, {
      method: "POST",
      headers: withIdempotencyHeader(`nfse-cancel-${id}`),
      body: JSON.stringify({ reason }),
    }),
  requestInvoicePdfJob: (id: string) =>
    request<NfsePdfJobResponse>(`/fiscal/nfse/invoices/${id}/pdf/jobs`, {
      method: "POST",
      headers: withIdempotencyHeader(`nfse-pdf-job-${id}`),
    }),
  getInvoicePdfJobStatus: (id: string, jobId: string) =>
    request<NfsePdfJobResponse>(`/fiscal/nfse/invoices/${id}/pdf/jobs/${jobId}`),
  downloadInvoicePdfJob: (id: string, jobId: string) =>
    requestBlob(`/fiscal/nfse/invoices/${id}/pdf/jobs/${jobId}/download`),
  createCertificateUnlock: (certificatePassword: string) =>
    request<NfseCertificateUnlockStatus>("/fiscal/nfse/certificate-unlock", {
      method: "POST",
      body: JSON.stringify({ certificatePassword }),
    }),
  getCertificateUnlockStatus: () =>
    request<NfseCertificateUnlockStatus>("/fiscal/nfse/certificate-unlock"),
  revokeCertificateUnlock: () =>
    request<void>("/fiscal/nfse/certificate-unlock", {
      method: "DELETE",
    }),
  listProviderCapabilities: (params?: { municipioCodigoIbge?: string; provedor?: string }) => {
    const query = new URLSearchParams();
    if (params?.municipioCodigoIbge) query.set("municipioCodigoIbge", params.municipioCodigoIbge);
    if (params?.provedor) query.set("provedor", params.provedor);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<NfseProviderCapabilities[]>(`/fiscal/nfse/provider-capabilities${suffix}`);
  },
  saveProviderCapabilities: (payload: NfseProviderCapabilities) =>
    request<NfseProviderCapabilities>("/fiscal/nfse/provider-capabilities", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  lookupTomadorByCnpj: (cnpj: string) =>
    request<NfseTomadorLookupResponse>(`/fiscal/nfse/tomador/cnpj/${encodeURIComponent(cnpj)}`),
  downloadAccountingExport: (params: {
    from: string;
    to: string;
    status?: string;
    format?: NfseAccountingExportFormat;
  }) => {
    const query = new URLSearchParams();
    query.set("from", params.from);
    query.set("to", params.to);
    if (params.status?.trim()) query.set("status", params.status.trim());
    if (params.format) query.set("format", params.format);
    return requestBlob(`/fiscal/nfse/invoices/accounting-export?${query.toString()}`);
  },
};
