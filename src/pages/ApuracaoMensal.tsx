import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ApuracaoCard } from '@/components/fiscal/ApuracaoCard';
import { ApuracaoImpostoList } from '@/components/fiscal/ApuracaoImpostoList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fiscalApi } from '@/lib/api';
import { resolveUiError } from '@/lib/error-utils';
import { formatCurrency } from '@/lib/tax-calculator';
import { ApuracaoMensal as ApuracaoMensalType, ApuracaoResumo, MESES_PT } from '@/types/apuracao';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function ApuracaoMensal() {
  const [apuracaoAtual, setApuracaoAtual] = useState<ApuracaoMensalType | null>(null);
  const [apuracaoSelecionada, setApuracaoSelecionada] = useState<ApuracaoMensalType | null>(null);
  const [historico, setHistorico] = useState<ApuracaoResumo[]>([]);
  const [resumoAno, setResumoAno] = useState<{
    totalServicos: number;
    totalImpostos: number;
    totalDocumentos: number;
    meses: ApuracaoResumo[];
  } | null>(null);
  const [anoSelecionado, setAnoSelecionado] = useState<number>(new Date().getFullYear());
  const [mesSelecionado, setMesSelecionado] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadCurrent();
    loadHistorico();
  }, []);

  useEffect(() => {
    fiscalApi
      .getResumoAnual(anoSelecionado)
      .then(setResumoAno)
      .catch(() => setResumoAno(null));
  }, [anoSelecionado, historico.length]);

  useEffect(() => {
    if (mesSelecionado === null) return;
    fiscalApi
      .getApuracaoByPeriodo(anoSelecionado, mesSelecionado)
      .then(setApuracaoSelecionada)
      .catch((error) =>
        toast.error(resolveUiError(error, 'Erro ao carregar apuracao do periodo').message)
      );
  }, [anoSelecionado, mesSelecionado]);

  const loadCurrent = async () => {
    try {
      setIsLoading(true);
      const data = await fiscalApi.getCurrentApuracao();
      setApuracaoAtual(data);
    } catch (error) {
      toast.error(resolveUiError(error, 'Erro ao carregar apuracao atual').message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistorico = async () => {
    try {
      const data = await fiscalApi.getHistoricoApuracoes(12);
      setHistorico(data);
    } catch (error) {
      toast.error(resolveUiError(error, 'Erro ao carregar historico').message);
    }
  };

  const handleRecalculate = async () => {
    try {
      setIsLoading(true);
      const now = new Date();
      const data = await fiscalApi.recalculateApuracao(now.getFullYear(), now.getMonth() + 1);
      setApuracaoAtual(data);
      await loadHistorico();
      toast.success('Apuracao recalculada com sucesso');
    } catch (error) {
      toast.error(resolveUiError(error, 'Erro ao recalcular apuracao').message);
    } finally {
      setIsLoading(false);
    }
  };

  const apuracaoExibida = mesSelecionado === null ? apuracaoAtual : apuracaoSelecionada;
  const anosDisponiveis = [2024, 2025, 2026];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Apuracao Mensal de Impostos</h1>
          <Button onClick={handleRecalculate} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Recalcular
          </Button>
        </div>

        {apuracaoExibida && (
          <>
            <ApuracaoCard apuracao={apuracaoExibida} />
            <ApuracaoImpostoList impostos={apuracaoExibida.impostos} showZeroValues={true} />
          </>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Historico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-w-[180px]">
              <Select value={String(anoSelecionado)} onValueChange={(v) => setAnoSelecionado(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {anosDisponiveis.map((ano) => (
                    <SelectItem key={ano} value={String(ano)}>
                      {ano}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {historico
                .filter((item) => item.ano === anoSelecionado)
                .map((item) => (
                  <button
                    key={`${item.ano}-${item.mes}`}
                    onClick={() => setMesSelecionado(item.mes)}
                    className="text-left p-3 border rounded-lg hover:bg-muted/70"
                  >
                    <p className="font-medium">{MESES_PT[item.mes]}</p>
                    <p className="text-sm text-muted-foreground">Servicos: {formatCurrency(item.valorTotalServicos)}</p>
                    <p className="text-sm text-muted-foreground">Impostos: {formatCurrency(item.valorTotalImpostos)}</p>
                    <p className="text-sm text-muted-foreground">Notas: {item.quantidadeDocumentos}</p>
                  </button>
                ))}
            </div>
          </CardContent>
        </Card>

        {resumoAno && (
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Ano {anoSelecionado}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-primary/10 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Total de Servicos</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(resumoAno.totalServicos)}</p>
              </div>
              <div className="p-4 bg-destructive/10 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Total de Impostos</p>
                <p className="text-2xl font-bold text-destructive">{formatCurrency(resumoAno.totalImpostos)}</p>
              </div>
              <div className="p-4 bg-secondary rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Total de Notas</p>
                <p className="text-2xl font-bold text-secondary-foreground">{resumoAno.totalDocumentos}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
