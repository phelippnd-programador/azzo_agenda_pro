'use client';

import { TaxCalculation } from '@/types/fiscal';
import { formatCurrency } from '@/lib/tax-calculator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface TaxPreviewProps {
  calculation?: TaxCalculation;
  regime: string;
}

const defaultCalculation: TaxCalculation = {
  serviceValue: 0,
  icmsBase: 0,
  icmsValue: 0,
  pisValue: 0,
  cofinsValue: 0,
  totalTaxes: 0,
  netValue: 0,
};

export function TaxPreview({ calculation, regime }: TaxPreviewProps) {
  const calc = calculation ?? defaultCalculation;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalhamento de Impostos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Valor do Servico</span>
            <span className="font-semibold">{formatCurrency(calc.serviceValue)}</span>
          </div>

          <Separator />

          <div className="space-y-2 bg-muted/40 p-3 rounded-lg">
            <h4 className="font-semibold text-sm text-foreground">Impostos Calculados</h4>

            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Base de Calculo ICMS</span>
              <span>{formatCurrency(calc.icmsBase)}</span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">ICMS ({regime})</span>
              <span className="text-blue-600 font-medium">{formatCurrency(calc.icmsValue)}</span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">PIS</span>
              <span className="text-blue-600 font-medium">{formatCurrency(calc.pisValue)}</span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">COFINS</span>
              <span className="text-blue-600 font-medium">{formatCurrency(calc.cofinsValue)}</span>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <span className="font-semibold text-foreground">Total de Impostos</span>
            <span className="font-bold text-red-600">{formatCurrency(calc.totalTaxes)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="font-semibold text-foreground">Valor Liquido</span>
            <span className="font-bold text-green-600 text-lg">{formatCurrency(calc.netValue)}</span>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs text-amber-800">
            <strong>Nota:</strong> Este e um pre-calculo para referencia. Os valores finais podem variar conforme
            legislacao vigente e configuracoes especificas da empresa.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
