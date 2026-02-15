'use client';

import { TaxCalculation } from '@/types/fiscal';
import { formatCurrency } from '@/lib/tax-calculator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface TaxPreviewProps {
  calculation?: TaxCalculation;
  regime: string;
}

// Default calculation values
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
  // Use default values if calculation is undefined
  const calc = calculation ?? defaultCalculation;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalhamento de Impostos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Valor do Serviço</span>
            <span className="font-semibold">{formatCurrency(calc.serviceValue)}</span>
          </div>

          <Separator />

          <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
            <h4 className="font-semibold text-sm text-gray-700">Impostos Calculados</h4>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Base de Cálculo ICMS</span>
              <span>{formatCurrency(calc.icmsBase)}</span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">ICMS ({regime})</span>
              <span className="text-blue-600 font-medium">{formatCurrency(calc.icmsValue)}</span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">PIS</span>
              <span className="text-blue-600 font-medium">{formatCurrency(calc.pisValue)}</span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">COFINS</span>
              <span className="text-blue-600 font-medium">{formatCurrency(calc.cofinsValue)}</span>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-700">Total de Impostos</span>
            <span className="font-bold text-red-600">{formatCurrency(calc.totalTaxes)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-700">Valor Líquido</span>
            <span className="font-bold text-green-600 text-lg">{formatCurrency(calc.netValue)}</span>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs text-amber-800">
            <strong>Nota:</strong> Este é um pré-cálculo para referência. Os valores finais podem variar conforme 
            legislação vigente e configurações específicas da empresa.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}