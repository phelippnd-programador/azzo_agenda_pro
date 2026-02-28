import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ApuracaoMensal, MESES_PT, STATUS_COLORS, STATUS_LABELS } from '@/types/apuracao';
import { formatCurrency } from '@/lib/tax-calculator';
import { FileText, TrendingUp, Calculator, Calendar } from 'lucide-react';

interface ApuracaoCardProps {
  apuracao: ApuracaoMensal;
  showDetails?: boolean;
}

export function ApuracaoCard({ apuracao, showDetails = true }: ApuracaoCardProps) {
  const toSafeNumber = (value: unknown) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const valorTotalServicos = toSafeNumber(apuracao.valorTotalServicos);
  const valorTotalImpostos = toSafeNumber(apuracao.valorTotalImpostos);
  const quantidadeDocumentos = toSafeNumber(apuracao.quantidadeDocumentos);

  const statusColor =
    STATUS_COLORS[apuracao.status] ?? {
      bg: 'bg-muted/40',
      text: 'text-foreground',
      border: 'border-border',
    };
  const statusLabel = STATUS_LABELS[apuracao.status] ?? apuracao.status ?? 'Desconhecido';
  const mesNome = MESES_PT[apuracao.mes] ?? `Mes ${apuracao.mes}`;
  const regimeLabel = apuracao.regimeTributario
    ? apuracao.regimeTributario.replaceAll('_', ' ')
    : 'Nao informado';

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {mesNome} {apuracao.ano}
          </CardTitle>
          <Badge className={`${statusColor.bg} ${statusColor.text} ${statusColor.border} border`}>
            {statusLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total de Servicos */}
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
            <div className="p-2 bg-blue-100 rounded-full">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Servicos</p>
              <p className="text-lg font-semibold text-blue-700">
                {formatCurrency(valorTotalServicos)}
              </p>
            </div>
          </div>

          {/* Total de Impostos */}
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
            <div className="p-2 bg-red-100 rounded-full">
              <Calculator className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total a Pagar</p>
              <p className="text-lg font-semibold text-red-700">
                {formatCurrency(valorTotalImpostos)}
              </p>
            </div>
          </div>

          {/* Quantidade de Documentos */}
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
            <div className="p-2 bg-green-100 rounded-full">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Notas Emitidas</p>
              <p className="text-lg font-semibold text-green-700">
                {quantidadeDocumentos}
              </p>
            </div>
          </div>
        </div>

        {showDetails && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Regime: <strong>{regimeLabel}</strong>
              </span>
              {apuracao.dataFechamento && (
                <span>
                  Fechado em:{' '}
                  <strong>
                    {new Date(apuracao.dataFechamento).toLocaleDateString('pt-BR')}
                  </strong>
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


