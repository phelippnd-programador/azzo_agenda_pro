import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { systemAdminApi } from '@/lib/api';
import { toast } from 'sonner';
import type { AdminTenantItem, CommercialOverview } from '@/types/system-admin';

interface AdminContextoTabProps {
  selectedTenantId: string;
  setSelectedTenantId: (id: string) => void;
  activeTenants: AdminTenantItem[];
  isLoadingTenants: boolean;
}

export function AdminContextoTab({
  selectedTenantId,
  setSelectedTenantId,
  activeTenants,
  isLoadingTenants,
}: AdminContextoTabProps) {
  const [commercialOverview, setCommercialOverview] = useState<CommercialOverview | null>(null);
  const [isLoadingCommercial, setIsLoadingCommercial] = useState(false);

  const loadCommercialOverview = async () => {
    setIsLoadingCommercial(true);
    try {
      const response = await systemAdminApi.getCommercialOverview();
      setCommercialOverview(response);
    } catch {
      toast.error('Nao foi possivel carregar analise comercial.');
      setCommercialOverview(null);
    } finally {
      setIsLoadingCommercial(false);
    }
  };

  useEffect(() => {
    loadCommercialOverview();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tenant alvo</CardTitle>
          <CardDescription>Selecione o tenant para aplicar configuracoes administrativas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label>Tenant</Label>
          <Select value={selectedTenantId} onValueChange={setSelectedTenantId} disabled={isLoadingTenants}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um tenant" />
            </SelectTrigger>
            <SelectContent>
              {activeTenants.map((tenant) => (
                <SelectItem key={tenant.tenantId} value={tenant.tenantId}>
                  {tenant.name} [{tenant.planStatus || 'N/A'}]
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Analise Comercial</CardTitle>
              <CardDescription>Visao executiva de cadastro, conversao, pagamentos e inadimplencia.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadCommercialOverview} disabled={isLoadingCommercial}>
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingCommercial ? (
            <p className="text-sm text-muted-foreground">Carregando analise comercial...</p>
          ) : !commercialOverview ? (
            <p className="text-sm text-muted-foreground">Nao foi possivel carregar a analise.</p>
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Tenants totais</p>
                  <p className="text-xl font-semibold">{commercialOverview.totalTenants}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Novos cadastros (30d)</p>
                  <p className="text-xl font-semibold">{commercialOverview.totalSignups30d}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Tenants pagantes</p>
                  <p className="text-xl font-semibold">{commercialOverview.payingTenants}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Conversao</p>
                  <p className="text-xl font-semibold">
                    {Number(commercialOverview.conversionRatePercent || 0).toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Ativos</p>
                  <p className="text-xl font-semibold">{commercialOverview.activeTenants}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Vencidos</p>
                  <p className="text-xl font-semibold">{commercialOverview.expiredTenants}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Suspensos</p>
                  <p className="text-xl font-semibold">{commercialOverview.suspendedTenants}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Recebido 30d</p>
                  <p className="text-xl font-semibold">
                    R$ {(Number(commercialOverview.revenueReceived30dCents || 0) / 100).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="rounded-md border p-3">
                <p className="text-sm font-medium mb-2">Distribuicao por status de plano</p>
                <div className="flex flex-wrap gap-2">
                  {commercialOverview.tenantsByPlanStatus.map((item) => (
                    <Badge key={item.planStatus} variant="secondary">
                      {item.planStatus}: {item.count}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
