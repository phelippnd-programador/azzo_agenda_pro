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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Invoice, InvoiceFormData } from '@/types/invoice';
import { fiscalApi } from '@/lib/api';
import { resolveUiError } from '@/lib/error-utils';
import { toast } from 'sonner';
import { FileText, List } from 'lucide-react';

export default function InvoiceEmission() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [editingDraft, setEditingDraft] = useState<Invoice | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [invoiceToCancel, setInvoiceToCancel] = useState<Invoice | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelReasonTouched, setCancelReasonTouched] = useState(false);
  const [activeTab, setActiveTab] = useState('new');
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [pendingInvoiceData, setPendingInvoiceData] = useState<InvoiceFormData | null>(null);
  const [invoiceToReprocess, setInvoiceToReprocess] = useState<Invoice | null>(null);
  const [authMode, setAuthMode] = useState<
    'CREATE_AND_AUTHORIZE' | 'AUTHORIZE_EXISTING' | 'REPROCESS_AUTHORIZE'
  >('CREATE_AND_AUTHORIZE');
  const [certificatePassword, setCertificatePassword] = useState('');
  const [certificatePasswordTouched, setCertificatePasswordTouched] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const passwordMinLength = 4;
  const isCertificatePasswordValid = certificatePassword.trim().length >= passwordMinLength;

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    if (activeTab === 'list') {
      void loadInvoices();
    }
  }, [activeTab]);

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
    if (editingDraft) {
      if (isDraft) {
        try {
          const updated = await fiscalApi.updateInvoice(editingDraft.id, {
            ...formData,
            status: 'DRAFT',
          });
          await loadInvoices();
          toast.success('Rascunho atualizado com sucesso!');
          setSelectedInvoice(updated);
          setActiveTab('list');
          setEditingDraft(null);
        } catch (error) {
          toast.error(resolveUiError(error, 'Erro ao atualizar rascunho').message);
          console.error(error);
        }
        return;
      }

      setPendingInvoiceData(formData);
      setInvoiceToReprocess(editingDraft);
      setAuthMode('AUTHORIZE_EXISTING');
      setCertificatePassword('');
      setCertificatePasswordTouched(false);
      setAuthDialogOpen(true);
      return;
    }

    if (isDraft) {
      try {
        const invoice = await fiscalApi.createInvoice({ ...formData, status: 'DRAFT' });
        await loadInvoices();
        toast.success('Rascunho salvo com sucesso!');
        setSelectedInvoice(invoice);
        setActiveTab('list');
      } catch (error) {
        toast.error(resolveUiError(error, 'Erro ao salvar rascunho').message);
        console.error(error);
      }
      return;
    }

    setPendingInvoiceData(formData);
    setInvoiceToReprocess(null);
    setAuthMode('CREATE_AND_AUTHORIZE');
    setCertificatePassword('');
    setCertificatePasswordTouched(false);
    setAuthDialogOpen(true);
  };

  const handleAuthorizeEmission = async () => {
    if (!isCertificatePasswordValid) {
      setCertificatePasswordTouched(true);
      toast.error(`Senha do certificado deve ter ao menos ${passwordMinLength} caracteres.`);
      return;
    }

    setIsAuthorizing(true);
    try {
      let invoice: Invoice;
      if (authMode === 'CREATE_AND_AUTHORIZE') {
        if (!pendingInvoiceData) {
          toast.error('Dados da nota fiscal nao encontrados para autorizacao.');
          return;
        }
        const createdInvoice = await fiscalApi.createInvoice({ ...pendingInvoiceData, status: 'ISSUED' });
        invoice = await fiscalApi.authorizeInvoice(createdInvoice.id, certificatePassword.trim());
      } else {
        if (!invoiceToReprocess) {
          toast.error('Nota fiscal nao encontrada para autorizacao.');
          return;
        }
        if (pendingInvoiceData) {
          await fiscalApi.updateInvoice(invoiceToReprocess.id, {
            ...pendingInvoiceData,
            status: 'DRAFT',
          });
        }
        if (authMode === 'REPROCESS_AUTHORIZE') {
          invoice = await fiscalApi.reprocessAuthorizeInvoice(
            invoiceToReprocess.id,
            certificatePassword.trim()
          );
        } else {
          invoice = await fiscalApi.authorizeInvoice(
            invoiceToReprocess.id,
            certificatePassword.trim()
          );
        }
      }
      await loadInvoices();

      toast.success(`Nota fiscal ${invoice.number} autorizada com sucesso!`, {
        description: 'A nota esta disponivel para DANFE.',
      });
      setSelectedInvoice(invoice);
      setIsViewerOpen(true);
      setActiveTab('list');
      setAuthDialogOpen(false);
      setPendingInvoiceData(null);
      setInvoiceToReprocess(null);
      setEditingDraft(null);
      setCertificatePassword('');
      setCertificatePasswordTouched(false);
    } catch (error) {
      toast.error(resolveUiError(error, 'Erro ao processar nota fiscal').message);
      console.error(error);
    } finally {
      setIsAuthorizing(false);
    }
  };

  const handleView = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsViewerOpen(true);
  };

  const handlePrint = async (invoice: Invoice) => {
    const toastId = toast.loading('Gerando DANFE em segundo plano...');

    try {
      const job = await fiscalApi.requestInvoicePdfJob(invoice.id);
      let attempts = 0;
      const maxAttempts = 30;

      while (attempts < maxAttempts) {
        const status = await fiscalApi.getInvoicePdfJobStatus(invoice.id, job.jobId);

        if (status.status === 'DONE') {
          if (status.downloadConsumed) {
            toast.warning('DANFE ja foi baixado anteriormente e removido por seguranca.', {
              id: toastId,
            });
            return;
          }
          if (status.downloadAvailable === false) {
            toast.warning('DANFE expirado (24h) e removido do storage.', {
              id: toastId,
            });
            return;
          }
          const blob = await fiscalApi.downloadInvoicePdfJob(invoice.id, job.jobId);
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
          setTimeout(() => URL.revokeObjectURL(url), 10000);
          toast.success('DANFE gerado com sucesso.', {
            id: toastId,
          });
          return;
        }

        if (status.status === 'ERROR') {
          toast.error(status.errorMessage || 'Falha ao gerar DANFE.', {
            id: toastId,
          });
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
        attempts += 1;
      }

      toast.warning('Geracao do DANFE ainda em andamento. Tente novamente em instantes.', {
        id: toastId,
      });
    } catch (error) {
      handleView(invoice);
      toast.info(resolveUiError(error, 'PDF indisponivel no servidor, exibindo detalhes da nota.').message, {
        id: toastId,
      });
    }
  };

  const handleCancelRequest = (invoice: Invoice) => {
    if (invoice.status !== 'ISSUED') {
      toast.error('Somente notas emitidas/autorizadas podem ser canceladas.');
      return;
    }
    setInvoiceToCancel(invoice);
    setCancelReason('');
    setCancelReasonTouched(false);
  };

  const handleReprocessAuthorizeRequest = (invoice: Invoice) => {
    setInvoiceToReprocess(invoice);
    setPendingInvoiceData(null);
    setAuthMode('REPROCESS_AUTHORIZE');
    setCertificatePassword('');
    setCertificatePasswordTouched(false);
    setAuthDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!invoiceToCancel) return;
    if (!cancelReason.trim()) {
      setCancelReasonTouched(true);
      toast.error('Informe o motivo do cancelamento.');
      return;
    }

    try {
      await fiscalApi.cancelInvoice(invoiceToCancel.id, cancelReason.trim());
      await loadInvoices();
      toast.success(`Nota fiscal ${invoiceToCancel.number} cancelada com sucesso`);
      setInvoiceToCancel(null);
      setCancelReason('');
      setCancelReasonTouched(false);
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
            {editingDraft && (
              <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm flex items-center justify-between gap-3">
                <span>
                  Editando rascunho <strong>{editingDraft.number}</strong>.
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingDraft(null)}
                >
                  Cancelar edicao
                </Button>
              </div>
            )}
            <InvoiceForm
              key={editingDraft?.id || 'new-invoice'}
              initialData={
                editingDraft
                  ? {
                      type: editingDraft.type,
                      customer: editingDraft.customer,
                      items: editingDraft.items,
                      operationNature: editingDraft.operationNature,
                      notes: editingDraft.notes || '',
                      appointmentId: editingDraft.appointmentId,
                    }
                  : undefined
              }
              onSubmit={handleSubmit}
            />
          </TabsContent>

          <TabsContent value="list" className="mt-6">
            <InvoiceList
              invoices={invoices}
              onView={handleView}
              onPrint={handlePrint}
              onCancel={handleCancelRequest}
              onReprocessAuthorize={handleReprocessAuthorizeRequest}
              onAuthorizeDraft={(invoice) => {
                setPendingInvoiceData(null);
                setInvoiceToReprocess(invoice);
                setAuthMode('AUTHORIZE_EXISTING');
                setCertificatePassword('');
                setCertificatePasswordTouched(false);
                setAuthDialogOpen(true);
              }}
              onEditDraft={(invoice) => {
                setEditingDraft(invoice);
                setActiveTab('new');
              }}
              onRefresh={() => {
                void loadInvoices();
              }}
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

        <AlertDialog
          open={!!invoiceToCancel}
          onOpenChange={(open) => {
            if (!open) {
              setInvoiceToCancel(null);
              setCancelReason('');
              setCancelReasonTouched(false);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancelar Nota Fiscal?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja cancelar a nota fiscal {invoiceToCancel?.number}? Esta acao nao pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              <Input
                placeholder="Motivo do cancelamento"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                onBlur={() => setCancelReasonTouched(true)}
              />
              {cancelReasonTouched && !cancelReason.trim() && (
                <p className="text-xs text-red-600">Motivo do cancelamento e obrigatorio.</p>
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Nao, manter nota</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelConfirm}
                className="bg-red-600 hover:bg-red-700"
                disabled={!cancelReason.trim()}
              >
                Sim, cancelar nota
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog
          open={authDialogOpen}
          onOpenChange={(open) => {
            if (!isAuthorizing) {
              setAuthDialogOpen(open);
              if (!open) {
                setPendingInvoiceData(null);
                setInvoiceToReprocess(null);
                setCertificatePassword('');
                setCertificatePasswordTouched(false);
              }
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Autorizar Nota Fiscal</DialogTitle>
              <DialogDescription>
                {authMode === 'REPROCESS_AUTHORIZE'
                  ? 'Informe a senha do certificado digital para reprocessar a autorizacao da nota.'
                  : authMode === 'AUTHORIZE_EXISTING'
                  ? 'Informe a senha do certificado digital para autorizar o rascunho selecionado.'
                  : 'Informe a senha do certificado digital para concluir a autorizacao da nota.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Senha do certificado"
                value={certificatePassword}
                onChange={(e) => setCertificatePassword(e.target.value)}
                onBlur={() => setCertificatePasswordTouched(true)}
                autoFocus
              />
              {certificatePasswordTouched && !isCertificatePasswordValid && (
                <p className="text-xs text-red-600">
                  Informe uma senha com pelo menos {passwordMinLength} caracteres.
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setAuthDialogOpen(false);
                  setPendingInvoiceData(null);
                  setInvoiceToReprocess(null);
                  setEditingDraft(null);
                  setCertificatePassword('');
                  setCertificatePasswordTouched(false);
                }}
                disabled={isAuthorizing}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAuthorizeEmission}
                disabled={isAuthorizing || !isCertificatePasswordValid}
              >
                {isAuthorizing
                  ? 'Processando...'
                  : authMode === 'REPROCESS_AUTHORIZE'
                  ? 'Reprocessar Autorizacao'
                  : authMode === 'AUTHORIZE_EXISTING'
                  ? 'Emitir Rascunho'
                  : 'Autorizar Nota'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
