import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ApuracaoImposto, TipoImposto } from '@/types/apuracao';
import { formatCurrency } from '@/lib/tax-calculator';
import { Receipt } from 'lucide-react';

interface ApuracaoImpostoListProps {
  impostos: ApuracaoImposto[];
  showZeroValues?: boolean;
}

// Cores por tipo de imposto
const IMPOSTO_COLORS: Record<TipoImposto, string> = {
  [TipoImposto.ICMS]: 'bg-blue-100 text-blue-800',
  [TipoImposto.PIS]: 'bg-green-100 text-green-800',
  [TipoImposto.COFINS]: 'bg-purple-100 text-purple-800',
  [TipoImposto.ISS]: 'bg-orange-100 text-orange-800',
  [TipoImposto.IRPJ]: 'bg-red-100 text-red-800',
  [TipoImposto.CSLL]: 'bg-pink-100 text-pink-800',
  [TipoImposto.DAS]: 'bg-violet-100 text-violet-800',
};

export function ApuracaoImpostoList({
  impostos,
  showZeroValues = false,
}: ApuracaoImpostoListProps) {
  // Filtrar impostos com valor zero se não for para mostrar
  const impostosFiltrados = showZeroValues
    ? impostos
    : impostos.filter((imp) => imp.valorApurado > 0 || imp.baseCalculo > 0);

  // Calcular total
  const totalImpostos = impostosFiltrados.reduce((sum, imp) => sum + imp.valorApurado, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Receipt className="h-5 w-5 text-violet-600" />
          Discriminação por Imposto
        </CardTitle>
      </CardHeader>
      <CardContent>
        {impostosFiltrados.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum imposto apurado no período</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Imposto</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Base de Cálculo</TableHead>
                <TableHead className="text-right">Alíquota</TableHead>
                <TableHead className="text-right">Valor Apurado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {impostosFiltrados.map((imposto) => (
                <TableRow key={imposto.id}>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        IMPOSTO_COLORS[imposto.tipoImposto]
                      }`}
                    >
                      {imposto.tipoImposto}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm">
                    {imposto.descricao}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(imposto.baseCalculo)}
                  </TableCell>
                  <TableCell className="text-right">
                    {(imposto.aliquota * 100).toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(imposto.valorApurado)}
                  </TableCell>
                </TableRow>
              ))}
              {/* Linha de total */}
              <TableRow className="bg-gray-50 font-semibold">
                <TableCell colSpan={4} className="text-right">
                  Total a Pagar:
                </TableCell>
                <TableCell className="text-right text-red-600">
                  {formatCurrency(totalImpostos)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}