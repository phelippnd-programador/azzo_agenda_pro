import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageEmptyState, PageListLoadingState } from '@/components/ui/page-states';
import { toast } from 'sonner';
import { posApi, type Comanda, type ComandaStatus } from '@/lib/api/pos';
import { resolveUiError } from '@/lib/error-utils';
import { formatCurrency } from '@/lib/format';

const STATUS_LABEL: Record<ComandaStatus, string> = {
  ABERTA: 'Abertas',
  FECHADA: 'Fechadas',
  CANCELADA: 'Canceladas',
};

/** F01 — lista de comandas (POS). */
export default function PosPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<ComandaStatus>('ABERTA');
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const load = useCallback(async (s: ComandaStatus) => {
    setIsLoading(true);
    try {
      setComandas(await posApi.listar(s));
    } catch (error) {
      toast.error(resolveUiError(error, 'Nao foi possivel carregar as comandas.').message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load(status);
  }, [status, load]);

  const novaComandaAvulsa = async () => {
    setIsCreating(true);
    try {
      const comanda = await posApi.abrir({});
      navigate(`/pos/${comanda.id}`);
    } catch (error) {
      toast.error(resolveUiError(error, 'Nao foi possivel abrir a comanda.').message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <MainLayout title="Comandas" subtitle="Fechamento de conta: servicos, produtos, desconto e pagamentos">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={status} onValueChange={(v) => setStatus(v as ComandaStatus)}>
            <TabsList>
              {(Object.keys(STATUS_LABEL) as ComandaStatus[]).map((s) => (
                <TabsTrigger key={s} value={s}>
                  {STATUS_LABEL[s]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Button onClick={novaComandaAvulsa} disabled={isCreating}>
            <Plus className="mr-2 h-4 w-4" />
            Nova comanda avulsa
          </Button>
        </div>

        {isLoading ? (
          <PageListLoadingState metricCount={0} itemCount={6} itemHeightClassName="h-28" />
        ) : comandas.length === 0 ? (
          <PageEmptyState
            title={`Nenhuma comanda ${STATUS_LABEL[status].toLowerCase()} no momento`}
            description="Abra uma comanda avulsa ou a partir de um agendamento na Agenda."
            action={{
              label: 'Nova comanda avulsa',
              onClick: () => void novaComandaAvulsa(),
              disabled: isCreating,
            }}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {comandas.map((comanda) => (
              <Card
                key={comanda.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => navigate(`/pos/${comanda.id}`)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <span>{comanda.appointmentId ? 'Atendimento' : 'Avulsa'}</span>
                    <Badge variant={comanda.status === 'ABERTA' ? 'default' : 'outline'}>
                      {comanda.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Itens</span>
                    <span>{comanda.itens.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-semibold">{formatCurrency(comanda.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pago</span>
                    <span>{formatCurrency(comanda.totalPago)}</span>
                  </div>
                  {comanda.openedAt && (
                    <p className="pt-1 text-xs text-muted-foreground">
                      Aberta em {new Date(comanda.openedAt).toLocaleString('pt-BR')}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
