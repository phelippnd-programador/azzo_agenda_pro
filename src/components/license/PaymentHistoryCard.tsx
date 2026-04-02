import { useState } from 'react';
import { Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { PixPaymentView } from '@/components/billing/PixPaymentView';
import { BoletoPaymentView } from '@/components/billing/BoletoPaymentView';
import type { BillingPaymentItem } from '@/types/billing';
import {
  BILLING_TYPE_LABELS, PAYMENT_STATUS_LABELS,
  formatCurrency, formatDate, formatReferenceMonth,
} from '@/lib/billing-helpers';
import { toast } from 'sonner';

interface PaymentHistoryCardProps {
  paymentHistory: BillingPaymentItem[];
  historyError: string | null;
}

export function PaymentHistoryCard({ paymentHistory, historyError }: PaymentHistoryCardProps) {
  const [selectedPayment, setSelectedPayment] = useState<BillingPaymentItem | null>(null);

  const orderedHistory = [...paymentHistory].sort(
    (a, b) =>
      new Date(b.createdAt || b.updatedAt || b.dueDate || 0).getTime() -
      new Date(a.createdAt || a.updatedAt || a.dueDate || 0).getTime()
  );

  const handleCopyText = async (value?: string | null, label = 'Codigo') => {
    if (!value) { toast.error(`${label} indisponivel.`); return; }
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copiado.`);
    } catch {
      toast.error('Nao foi possivel copiar automaticamente.');
    }
  };

  return (
    <>
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Historico de pagamentos</CardTitle>
          <CardDescription>
            Consulte os pagamentos gerados e abra detalhes para pagar quando necessario.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {historyError ? (
            <Alert className="border-red-200 bg-red-50">
              <AlertTitle>Nao foi possivel carregar o historico</AlertTitle>
              <AlertDescription>{historyError}</AlertDescription>
            </Alert>
          ) : null}
          {!orderedHistory.length ? (
            <p className="text-sm text-muted-foreground">Nenhum pagamento registrado ainda.</p>
          ) : (
            orderedHistory.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between gap-2 rounded-lg border p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {formatCurrency(payment.amountCents)}  -  {BILLING_TYPE_LABELS[payment.billingType] ?? payment.billingType}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Status: {PAYMENT_STATUS_LABELS[payment.status] ?? payment.status}  -  Competencia:{' '}
                    {formatReferenceMonth(payment.referenceMonth)}  -  Vencimento:{' '}
                    {formatDate(payment.dueDate)}
                  </p>
                </div>
                <Button
                  type="button" variant="outline" size="icon"
                  onClick={() => setSelectedPayment(payment)}
                  aria-label="Ver detalhes do pagamento"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedPayment} onOpenChange={(open) => { if (!open) setSelectedPayment(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do pagamento</DialogTitle>
            <DialogDescription>
              Acompanhe os dados de cobranca e use os atalhos para concluir o pagamento.
            </DialogDescription>
          </DialogHeader>
          {selectedPayment ? (
            <div className="space-y-4">
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <p><strong>Valor:</strong> {formatCurrency(selectedPayment.amountCents)}</p>
                <p><strong>Metodo:</strong> {BILLING_TYPE_LABELS[selectedPayment.billingType] ?? selectedPayment.billingType}</p>
                <p><strong>Status:</strong> {PAYMENT_STATUS_LABELS[selectedPayment.status] ?? selectedPayment.status}</p>
                <p><strong>ID pagamento:</strong> {selectedPayment.asaasPaymentId || selectedPayment.id}</p>
                <p><strong>Vencimento:</strong> {formatDate(selectedPayment.dueDate)}</p>
                <p><strong>Competencia:</strong> {formatReferenceMonth(selectedPayment.referenceMonth)}</p>
                <p><strong>Gerado em:</strong> {formatDate(selectedPayment.createdAt || selectedPayment.updatedAt)}</p>
              </div>

              {selectedPayment.billingType === 'PIX' ? (
                <PixPaymentView
                  pixQrCodeBase64={selectedPayment.pixQrCodeBase64}
                  pixPayload={selectedPayment.pixPayload}
                  onCopyPix={() => handleCopyText(selectedPayment.pixPayload, 'Codigo PIX')}
                />
              ) : null}

              {selectedPayment.billingType === 'BOLETO' ? (
                <BoletoPaymentView
                  bankSlipUrl={selectedPayment.bankSlipUrl}
                  boletoIdentificationField={selectedPayment.boletoIdentificationField}
                  boletoBarCode={selectedPayment.boletoBarCode}
                  boletoNossoNumero={selectedPayment.boletoNossoNumero}
                />
              ) : null}

              {selectedPayment.invoiceUrl ? (
                <Button type="button" variant="outline" asChild>
                  <a href={selectedPayment.invoiceUrl} target="_blank" rel="noreferrer">Abrir fatura</a>
                </Button>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
