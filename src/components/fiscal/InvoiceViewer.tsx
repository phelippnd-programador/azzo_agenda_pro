import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Invoice, InvoiceStatus } from '@/types/invoice';
import { FileText, User, Calendar, DollarSign, Hash } from 'lucide-react';

interface InvoiceViewerProps {
  invoice: Invoice;
}

const getStatusColor = (status: InvoiceStatus) => {
  const colors = {
    ISSUED: 'bg-green-100 text-green-700 border-green-200',
    DRAFT: 'bg-amber-100 text-amber-700 border-amber-200',
    GENERATED: 'bg-blue-100 text-blue-700 border-blue-200',
    SIGNED: 'bg-blue-100 text-blue-700 border-blue-200',
    SUBMITTED: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    CONTINGENCY_PENDING: 'bg-orange-100 text-orange-700 border-orange-200',
    REJECTED: 'bg-red-100 text-red-700 border-red-200',
    CANCEL_PENDING: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    CANCELLED: 'bg-red-100 text-red-700 border-red-200',
    INUTILIZED: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    ERROR_FINAL: 'bg-rose-100 text-rose-700 border-rose-200',
  };
  return colors[status] || 'bg-zinc-100 text-zinc-700 border-zinc-200';
};

const getStatusLabel = (status: InvoiceStatus) => {
  const labels = {
    ISSUED: 'Emitida',
    DRAFT: 'Rascunho',
    GENERATED: 'Gerada',
    SIGNED: 'Assinada',
    SUBMITTED: 'Enviada',
    CONTINGENCY_PENDING: 'Contingencia',
    REJECTED: 'Rejeitada',
    CANCEL_PENDING: 'Canc. pendente',
    CANCELLED: 'Cancelada',
    INUTILIZED: 'Inutilizada',
    ERROR_FINAL: 'Erro final',
  };
  return labels[status] || status;
};

export function InvoiceViewer({ invoice }: InvoiceViewerProps) {
  const fiscalNumber = invoice.status === 'DRAFT' || !(invoice.number || '').trim()
    ? '—'
    : invoice.number;
  const fiscalSeries = invoice.status === 'DRAFT' || !(invoice.series || '').trim()
    ? '—'
    : invoice.series;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {invoice.type === 'NFE' ? 'NF-e - Modelo 55' : 'NFC-e - Modelo 65'}
            </CardTitle>
            <Badge className={getStatusColor(invoice.status)}>
              {getStatusLabel(invoice.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Numero</p>
              <p className="font-medium">{fiscalNumber}</p>
              {invoice.status === 'DRAFT' && (
                <p className="text-xs text-muted-foreground">
                  Sera definido na emissao/autorizacao
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Serie</p>
              <p className="font-medium">{fiscalSeries}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data de Emissao</p>
              <p className="font-medium">{formatDate(invoice.issueDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Natureza da Operacao</p>
              <p className="font-medium">{invoice.operationNature}</p>
            </div>
          </div>
          {invoice.accessKey && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Chave de Acesso</p>
                <p className="font-mono text-sm break-all">{invoice.accessKey}</p>
              </div>
            </>
          )}
          {invoice.authorizationProtocol && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Protocolo de Autorizacao</p>
              <p className="font-mono text-sm">{invoice.authorizationProtocol}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Dados do Tomador
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nome/Razao Social</p>
              <p className="font-medium">{invoice.customer.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{invoice.customer.type}</p>
              <p className="font-medium">{invoice.customer.document}</p>
            </div>
          </div>
          {(invoice.customer.email || invoice.customer.phone) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {invoice.customer.email && (
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{invoice.customer.email}</p>
                </div>
              )}
              {invoice.customer.phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium">{invoice.customer.phone}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Servicos Prestados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {invoice.items.map((item, index) => (
              <div key={item.id} className="p-4 bg-muted/40 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="font-medium">{item.description}</p>
                    <p className="text-sm text-muted-foreground">
                      CFOP: {item.cfop} | CST: {item.cst}
                    </p>
                  </div>
                  <Badge variant="outline">Item {index + 1}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Quantidade</p>
                    <p className="font-medium">{item.quantity}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Valor Unitario</p>
                    <p className="font-medium">{formatCurrency(item.unitPrice)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-medium">{formatCurrency(item.totalPrice)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tax Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Tributos e Totais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-muted-foreground mb-1">ICMS</p>
              <p className="font-bold text-blue-700">{formatCurrency(invoice.taxBreakdown.icms)}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-muted-foreground mb-1">PIS</p>
              <p className="font-bold text-green-700">{formatCurrency(invoice.taxBreakdown.pis)}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="text-muted-foreground mb-1">COFINS</p>
              <p className="font-bold text-purple-700">{formatCurrency(invoice.taxBreakdown.cofins)}</p>
            </div>
          </div>
          <Separator />
          <div className="bg-gradient-to-r from-primary/10 to-accent p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">Valor Total da Nota:</span>
              <span className="text-3xl font-bold text-primary">
                {formatCurrency(invoice.totalValue)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Observacoes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground whitespace-pre-wrap">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

