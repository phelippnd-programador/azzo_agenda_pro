import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { billingApi } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import type { AdminTenantItem } from '@/types/system-admin';
import { AdminContextoTab } from '@/components/system-admin/AdminContextoTab';
import { AdminMonitoramentoTab } from '@/components/system-admin/AdminMonitoramentoTab';
import { AdminEmailsTab } from '@/components/system-admin/AdminEmailsTab';
import { AdminMenusTab } from '@/components/system-admin/AdminMenusTab';
import { AdminFinanceiroTab } from '@/components/system-admin/AdminFinanceiroTab';
import { AdminAcessoTab } from '@/components/system-admin/AdminAcessoTab';

export default function SystemAdminPage() {
  const { user } = useAuth();
  const [activeTenants, setActiveTenants] = useState<AdminTenantItem[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);

  const loadActiveTenants = async () => {
    setIsLoadingTenants(true);
    try {
      const response = await billingApi.adminListActiveTenants();
      const items = response.items || [];
      setActiveTenants(items);
      setSelectedTenantId((current) => current || items[0]?.tenantId || '');
    } catch {
      toast.error('Nao foi possivel carregar tenants.');
      setActiveTenants([]);
      setSelectedTenantId('');
    } finally {
      setIsLoadingTenants(false);
    }
  };

  useEffect(() => {
    loadActiveTenants();
  }, []);

  return (
    <MainLayout
      title="Administrador do Sistema"
      subtitle="Gerencie menus por role, simule plano vencido e libere pagamentos para testes."
    >
      <div className="space-y-6">
        <Tabs defaultValue="contexto" className="space-y-4">
          <TabsList className="flex h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
            <TabsTrigger value="contexto">Contexto</TabsTrigger>
            <TabsTrigger value="monitoramento">Monitoramento</TabsTrigger>
            <TabsTrigger value="emails">Templates de Email</TabsTrigger>
            <TabsTrigger value="menus">Menus</TabsTrigger>
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            <TabsTrigger value="acesso">Acesso</TabsTrigger>
          </TabsList>

          <TabsContent value="contexto" className="space-y-6">
            <AdminContextoTab
              selectedTenantId={selectedTenantId}
              setSelectedTenantId={setSelectedTenantId}
              activeTenants={activeTenants}
              isLoadingTenants={isLoadingTenants}
            />
          </TabsContent>

          <TabsContent value="monitoramento" className="space-y-6">
            <AdminMonitoramentoTab activeTenants={activeTenants} />
          </TabsContent>

          <TabsContent value="emails" className="space-y-6">
            <AdminEmailsTab />
          </TabsContent>

          <TabsContent value="menus" className="space-y-6">
            <AdminMenusTab />
          </TabsContent>

          <TabsContent value="financeiro" className="space-y-6">
            <AdminFinanceiroTab selectedTenantId={selectedTenantId} />
          </TabsContent>

          <TabsContent value="acesso" className="space-y-6">
            <AdminAcessoTab
              selectedTenantId={selectedTenantId}
              userName={user?.name || ''}
              userEmail={user?.email || ''}
              userPhone={user?.phone}
            />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
