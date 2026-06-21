import { useState, useEffect, lazy, Suspense } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InvoiceForm } from '@/components/fiscal/InvoiceForm';
import { InvoiceList } from '@/components/fiscal/InvoiceList';
import { InvoiceViewer } from '@/components/fiscal/InvoiceViewer';
import { InvoiceAuthDialog } from '@/components/fiscal/InvoiceAuthDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Invoice, InvoiceFormData } from '@/types/invoice';
import { fiscalApi, nfseApi } from '@/lib/api';
import { resolveUiError } from '@/lib/error-utils';
import { toast } from 'sonner';
import { FileText, List, Receipt } from 'lucide-react';

const NfseInvoiceFormEmbed = lazy(() =>
  import('@/components/fiscal/NfseInvoiceFormEmbed').then((m) => ({
    default: m.NfseInvoiceFormEmbed,
  })),
);

const NfseInvoicesEmbed = lazy(() =>
  import('@/components/fiscal/NfseInvoicesEmbed').then((m) => ({
    default: m.NfseInvoicesEmbed,
  })),
);

type AuthMode = 'CREATE_AND_AUTHORIZE' | 'AUTHORIZE_EXISTING' | 'REPROCESS_AUTHORIZE';

const PASSWORD_MIN_LENGTH = 4;

export default function InvoiceEmission() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [editingDraft, setEditingDraft] = useState<Invoice | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [invoiceToCancel, setInvoiceToCancel] = useState<Invoice | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelReasonTouched, setCancelReasonTouched] = useState(false);
  const [activeTab, setActiveTab] = useState('new');
  const [nfseSubTab, setNfseSubTab] = useState<'emitir' | 'historico'>('emitir');
  const [nfseEnabled, setNfseEnabled] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [pendingInvoiceData, setPendingInvoiceData] = useState<InvoiceFormData | null>(null);
  const [invoiceToReprocess, setInvoiceToReprocess] = useState<Invoice | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('CREATE_AND_AUTHORIZE');
  const [certificatePassword, setCertificatePassword] = useState('');
  const [certificatePasswordTouched, setCertificatePasswordTouched] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const isCertificatePasswordValid =
    certificatePassword.trim().length >= PASSWORD_MIN_LENGTH;

  useEffect(() => {
    void loadInvoices();
    void (async () => {
      try {
        await nfseApi.getConfig('PRODUCAO');
        setNfseEnabled(true);
      } catch {
        // config nao encontrada — NFS-e nao habilitado para este tenant
        try {
          await nfseApi.getConfig('HOMOLOGACAO');
          setNfseEnabled(true);
        } catch {
          setNfseEnabled(false);
        }
      }
    })();
  }, []);

  useEffect(() => {
    if (activeTab === 'list') void loadInvoices();
  }, [activeTab]);

  const loadInvoices = async () => {
    try {
      const response = await fiscalApi.listInvoices({ page: 1, pageSize: 100 });
      setInvoices(
        response.items.sort(
          (a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime(),
        ),
      );
    } catch (error) {
      toast.error(resolveUiError(error, 'Erro ao carregar notas fiscais').message);
    }
  };

  const resetAuthDialog = () => {
    setPendingInvoiceData(null);
    setInvoiceToReprocess(null);
    setCertificatePassword('');
    setCertificatePasswordTouched(false);
  };

  const openAuthDialog = (
    mode: AuthMode,
    invoiceData: InvoiceFormData | null,
    invoice: Invoice | null,
  ) => {
    setPendingInvoiceData(invoiceData);
    setInvoiceToReprocess(invoice);
    setAuthMode(mode);
    setCertificatePassword('');
    setCertificatePasswordTouched(false);
    setAuthDialogOpen(true);
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
        }
        return;
      }
      openAuthDialog('AUTHORIZE_EXISTING', formData, editingDraft);
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
      }
      return;
    }

    openAuthDialog('CREATE_AND_AUTHORIZE', formData, null);
  };

  const handleAuthorizeEmission = async () => {
    if (!isCertificatePasswordValid) {
      setCertificatePasswordTouched(true);
      toast.error(`Senha do certificado deve ter ao menos ${PASSWORD_MIN_LENGTH} caracteres.`);
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
        const createdInvoice = await fiscalApi.createInvoice({
          ...pendingInvoiceData,
          status: 'ISSUED',
        });
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
        invoice =
          authMode === 'REPROCESS_AUTHORIZE'
            ? await fiscalApi.reprocessAuthorizeInvoice(
                invoiceToReprocess.id,
                certificatePassword.trim(),
              )
            : await fiscalApi.authorizeInvoice(
                invoiceToReprocess.id,
                certificatePassword.trim(),
              );
      }
      await loadInvoices();
      toast.success(`Nota fiscal ${invoice.number} autorizada com sucesso!`, {
        description: 'A nota esta disponivel para DANFE.',
      });
      setSelectedInvoice(invoice);
      setIsViewerOpen(true);
      setActiveTab('list');
      setAuthDialogOpen(false);
      setEditingDraft(null);
      resetAuthDialog();
    } catch (error) {
      toast.error(resolveUiError(error, 'Erro ao processar nota fiscal').message);
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
      while (attempts < 30) {
        const status = await fiscalApi.getInvoicePdfJobStatus(invoice.id, job.jobId);
        if (status.status === 'DONE') {
          if (status.downloadConsumed) {
            toast.warning('DANFE ja foi baixado anteriormente e removido por seguranca.', {
              id: toastId,
            });
            return;
          }
          if (status.downloadAvailable === false) {
            toast.warning('DANFE expirado (24h) e removido do storage.', { id: toastId });
            return;
          }
          const blob = await fiscalApi.downloadInvoicePdfJob(invoice.id, job.jobId);
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
          setTimeout(() => URL.revokeObjectURL(url), 10000);
          toast.success('DANFE gerado com sucesso.', { id: toastId });
          return;
        }
        if (status.status === 'ERROR') {
          toast.error(status.errorMessage || 'Falha ao gerar DANFE.', { id: toastId });
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
      toast.info(
        resolveUiError(
          error,
          'PDF indisponivel no servidor, exibindo detalhes da nota.',
        ).message,
        { id: toastId },
      );
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
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Emissao de Notas Fiscais</h1>
          <p className="text-muted-foreground mt-2">
            Emita NF-e, NFC-e e NFS-e para seus servicos prestados
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`grid w-full ${nfseEnabled ? 'max-w-lg grid-cols-3' : 'max-w-md grid-cols-2'}`}>
            <TabsTrigger value="new" className="gap-2">
              <FileText className="w-4 h-4" />
              Nova Nota
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <List className="w-4 h-4" />
              Historico ({invoices.length})
            </TabsTrigger>
            {nfseEnabled ? (
              <TabsTrigger value="nfse" className="gap-2">
                <Receipt className="w-4 h-4" />
                NFS-e
              </TabsTrigger>
            ) : null}
          </TabsList>

          <TabsContent value="new" className="mt-6">
            {editingDraft ? (
              <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm flex items-center justify-between gap-3">
                <span>
                  Editando rascunho <strong>{editingDraft.number}</strong>.
                </span>
                <Button variant="outline" size="sm" onClick={() => setEditingDraft(null)}>
                  Cancelar edicao
                </Button>
              </div>
            ) : null}
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
              onReprocessAuthorize={(invoice) => {
                openAuthDialog('REPROCESS_AUTHORIZE', null, invoice);
              }}
              onAuthorizeDraft={(invoice) => {
                openAuthDialog('AUTHORIZE_EXISTING', null, invoice);
              }}
              onEditDraft={(invoice) => {
                setEditingDraft(invoice);
                setActiveTab('new');
              }}
              onRefresh={() => void loadInvoices()}
            />
          </TabsContent>

          {nfseEnabled ? (
            <TabsContent value="nfse" className="mt-6 space-y-4">
              <div className="flex gap-2 border-b pb-3">
                <Button
                  variant={nfseSubTab === 'emitir' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNfseSubTab('emitir')}
                >
                  Emitir NFS-e
                </Button>
                <Button
                  variant={nfseSubTab === 'historico' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNfseSubTab('historico')}
                >
                  Historico NFS-e
                </Button>
              </div>
              <Suspense fallback={<div className="py-8 text-center text-sm text-muted-foreground">Carregando...</div>}>
                {nfseSubTab === 'emitir' ? (
                  <NfseInvoiceFormEmbed
                    onSaved={() => setNfseSubTab('historico')}
                  />
                ) : (
                  <NfseInvoicesEmbed
                    onNewNfse={() => setNfseSubTab('emitir')}
                  />
                )}
              </Suspense>
            </TabsContent>
          ) : null}
        </Tabs>

        {/* Invoice viewer dialog */}
        <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
          <DialogContent className="max-w-4xl mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes da Nota Fiscal</DialogTitle>
              <DialogDescription>
                Visualizacao completa da nota fiscal emitida
              </DialogDescription>
            </DialogHeader>
            {selectedInvoice ? <InvoiceViewer invoice={selectedInvoice} /> : null}
          </DialogContent>
        </Dialog>

        {/* Cancel dialog */}
        <ConfirmationDialog
          open={!!invoiceToCancel}
          title="Cancelar Nota Fiscal?"
          description={`Tem certeza que deseja cancelar a nota fiscal ${invoiceToCancel?.number}? Esta acao nao pode ser desfeita.`}
          cancelLabel="Nao, manter nota"
          confirmLabel="Sim, cancelar nota"
          confirmDisabled={!cancelReason.trim()}
          confirmClassName="bg-red-600 hover:bg-red-700"
          onOpenChange={(open) => {
            if (!open) {
              setInvoiceToCancel(null);
              setCancelReason('');
              setCancelReasonTouched(false);
            }
          }}
          onConfirm={() => void handleCancelConfirm()}
        >
          <div className="space-y-2">
            <Input
              placeholder="Motivo do cancelamento"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              onBlur={() => setCancelReasonTouched(true)}
            />
            {cancelReasonTouched && !cancelReason.trim() ? (
              <p className="text-xs text-red-600">Motivo do cancelamento e obrigatorio.</p>
            ) : null}
          </div>
        </ConfirmationDialog>

        {/* Authorization dialog */}
        <InvoiceAuthDialog
          open={authDialogOpen}
          onOpenChange={(open) => {
            setAuthDialogOpen(open);
            if (!open) resetAuthDialog();
          }}
          authMode={authMode}
          certificatePassword={certificatePassword}
          certificatePasswordTouched={certificatePasswordTouched}
          isCertificatePasswordValid={isCertificatePasswordValid}
          isAuthorizing={isAuthorizing}
          passwordMinLength={PASSWORD_MIN_LENGTH}
          onPasswordChange={setCertificatePassword}
          onPasswordBlur={() => setCertificatePasswordTouched(true)}
          onCancel={() => {
            setAuthDialogOpen(false);
            setEditingDraft(null);
            resetAuthDialog();
          }}
          onConfirm={() => void handleAuthorizeEmission()}
        />
      </div>
    </MainLayout>
  );
}
