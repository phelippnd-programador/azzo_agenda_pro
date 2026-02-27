import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InvoiceForm } from '@/components/fiscal/InvoiceForm';
import { InvoiceList } from '@/components/fiscal/InvoiceList';
import { InvoiceViewer } from '@/components/fiscal/InvoiceViewer';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Invoice, InvoiceFormData } from '@/types/invoice';
import { fiscalApi } from '@/lib/api';
import { resolveUiError } from '@/lib/error-utils';
import { toast } from 'sonner';
import { FileText, List } from 'lucide-react';

export default function InvoiceEmission() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [invoiceToCancel, setInvoiceToCancel] = useState<Invoice | null>(null);
  const [activeTab, setActiveTab] = useState('new');

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const response = await fiscalApi.listInvoices({ page: 1, pageSize: 100 });
      setInvoices(
        response.items.sort(
          (a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()
        )
      );
    } catch (error) {
      toast.error(resolveUiError(error, 'Erro ao carregar notas fiscais').message);
    }
  };

  const handleSubmit = async (formData: InvoiceFormData, isDraft: boolean) => {
    try {
      const status = isDraft ? 'DRAFT' : 'ISSUED';
      const invoice = await fiscalApi.createInvoice({ ...formData, status });

      await loadInvoices();

      if (isDraft) {
        toast.success('Rascunho salvo com sucesso!');
      } else {
        toast.success(`Nota fiscal ${invoice.number} emitida com sucesso!`, {
          description: 'A nota foi registrada e esta disponivel para impressao.',
        });
        setSelectedInvoice(invoice);
        setIsViewerOpen(true);
      }

      setActiveTab('list');
    } catch (error) {
      toast.error(resolveUiError(error, 'Erro ao processar nota fiscal').message);
      console.error(error);
    }
  };

  const handleView = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsViewerOpen(true);
  };

  const handlePrint = async (invoice: Invoice) => {
    try {
      const blob = await fiscalApi.getInvoicePdf(invoice.id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch {
      handleView(invoice);
      toast.info('PDF indisponivel no servidor, exibindo detalhes da nota.');
    }
  };

  const handleCancelRequest = (invoice: Invoice) => {
    setInvoiceToCancel(invoice);
  };

  const handleCancelConfirm = async () => {
    if (!invoiceToCancel) return;

    try {
      await fiscalApi.cancelInvoice(invoiceToCancel.id);
      await loadInvoices();
      toast.success(`Nota fiscal ${invoiceToCancel.number} cancelada com sucesso`);
      setInvoiceToCancel(null);
    } catch (error) {
      toast.error(resolveUiError(error, 'Erro ao cancelar nota fiscal').message);
      console.error(error);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Emissao de Notas Fiscais</h1>
          <p className="text-muted-foreground mt-2">Emita NF-e e NFC-e para seus servicos prestados</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="new" className="gap-2">
              <FileText className="w-4 h-4" />
              Nova Nota
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <List className="w-4 h-4" />
              Historico ({invoices.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="mt-6">
            <InvoiceForm onSubmit={handleSubmit} />
          </TabsContent>

          <TabsContent value="list" className="mt-6">
            <InvoiceList
              invoices={invoices}
              onView={handleView}
              onPrint={handlePrint}
              onCancel={handleCancelRequest}
            />
          </TabsContent>
        </Tabs>

        <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
          <DialogContent className="max-w-4xl mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes da Nota Fiscal</DialogTitle>
              <DialogDescription>Visualizacao completa da nota fiscal emitida</DialogDescription>
            </DialogHeader>
            {selectedInvoice && <InvoiceViewer invoice={selectedInvoice} />}
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!invoiceToCancel} onOpenChange={() => setInvoiceToCancel(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancelar Nota Fiscal?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja cancelar a nota fiscal {invoiceToCancel?.number}? Esta acao nao pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Nao, manter nota</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancelConfirm} className="bg-red-600 hover:bg-red-700">
                Sim, cancelar nota
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
