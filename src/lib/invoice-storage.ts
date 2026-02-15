import { Invoice, InvoiceFormData } from '@/types/invoice';

const STORAGE_KEY = 'azzo_invoices';

export const invoiceStorage = {
  getAll(): Invoice[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  getById(id: string): Invoice | null {
    const invoices = this.getAll();
    return invoices.find(inv => inv.id === id) || null;
  },

  save(invoice: Invoice): void {
    const invoices = this.getAll();
    const index = invoices.findIndex(inv => inv.id === invoice.id);
    
    if (index >= 0) {
      invoices[index] = invoice;
    } else {
      invoices.push(invoice);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  },

  delete(id: string): void {
    const invoices = this.getAll().filter(inv => inv.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  },

  generateInvoiceNumber(): string {
    const invoices = this.getAll();
    const lastNumber = invoices.length > 0 
      ? Math.max(...invoices.map(inv => parseInt(inv.number) || 0))
      : 0;
    return String(lastNumber + 1).padStart(9, '0');
  },

  createInvoice(formData: InvoiceFormData, status: 'DRAFT' | 'ISSUED' = 'DRAFT'): Invoice {
    const totalValue = formData.items.reduce((sum, item) => sum + item.totalPrice, 0);
    
    // Mock tax calculation (should use tax-calculator.ts)
    const icms = totalValue * 0.06; // 6% for Simples Nacional
    const pis = totalValue * 0.0065;
    const cofins = totalValue * 0.03;

    const invoice: Invoice = {
      id: `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      number: this.generateInvoiceNumber(),
      series: '1',
      type: formData.type,
      status,
      customer: formData.customer,
      items: formData.items,
      operationNature: formData.operationNature,
      issueDate: new Date().toISOString(),
      totalValue,
      taxBreakdown: { icms, pis, cofins },
      notes: formData.notes,
      appointmentId: formData.appointmentId,
    };

    if (status === 'ISSUED') {
      // Mock authorization data
      invoice.accessKey = this.generateAccessKey();
      invoice.authorizationProtocol = `${Date.now()}`;
    }

    this.save(invoice);
    return invoice;
  },

  generateAccessKey(): string {
    // Mock 44-digit access key (chave de acesso)
    const digits = Array.from({ length: 44 }, () => Math.floor(Math.random() * 10));
    return digits.join('');
  },
};