export type InvoiceType = 'NFE' | 'NFCE';
export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'CANCELLED';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  cfop: string;
  cst: string;
}

export interface InvoiceCustomer {
  type: 'CPF' | 'CNPJ';
  document: string;
  name: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

export interface Invoice {
  id: string;
  number: string;
  series: string;
  type: InvoiceType;
  status: InvoiceStatus;
  customer: InvoiceCustomer;
  items: InvoiceItem[];
  operationNature: string;
  issueDate: string;
  totalValue: number;
  taxBreakdown: {
    icms: number;
    pis: number;
    cofins: number;
  };
  notes?: string;
  appointmentId?: string;
  accessKey?: string;
  authorizationProtocol?: string;
}

export interface InvoiceFormData {
  type: InvoiceType;
  customer: InvoiceCustomer;
  items: InvoiceItem[];
  operationNature: string;
  notes?: string;
  appointmentId?: string;
}