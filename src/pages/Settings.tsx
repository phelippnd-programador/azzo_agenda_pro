import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PlugZap, Building2, ShieldCheck, Receipt, Boxes } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useMenuPermissions } from '@/contexts/MenuPermissionsContext';
import { SettingsNotificationsTab } from '@/components/settings/SettingsNotificationsTab';
import { SettingsAccountTab } from '@/components/settings/SettingsAccountTab';
import { AppointmentConflictSettingsCard } from '@/components/settings/AppointmentConflictSettingsCard';

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'notifications');
  const { user } = useAuth();
  const { allowedRoutes, canAccess } = useMenuPermissions();

  const hasExactRoute = (route: string) => (allowedRoutes ?? []).includes(route);
  const canAccessWhatsAppIntegration = hasExactRoute('/configuracoes/integracoes/whatsapp');
  const canAccessStockSettings = hasExactRoute('/configuracoes/estoque');
  const canAccessTaxSettings = hasExactRoute('/configuracoes/fiscal/impostos');
  const canAccessCertificates = hasExactRoute('/configuracoes/fiscal/certificados');
  const canAccessNfseSettings = hasExactRoute('/configuracoes/fiscal/nfse');
  const canAccessNfseModule = hasExactRoute('/fiscal/nfse');
  const canAccessSalonProfile = canAccess('/perfil-salao');

  const visibleTabs = useMemo(() => {
    const tabs = ['notifications', 'account'];
    if (canAccessWhatsAppIntegration || canAccessStockSettings) tabs.push('integrations');
    if (canAccessTaxSettings || canAccessCertificates || canAccessNfseSettings || canAccessNfseModule)
      tabs.push('fiscal');
    if (canAccessSalonProfile) tabs.push('salon');
    return tabs;
  }, [
    canAccessWhatsAppIntegration, canAccessStockSettings,
    canAccessTaxSettings, canAccessCertificates, canAccessNfseSettings, canAccessNfseModule,
    canAccessSalonProfile,
  ]);

  useEffect(() => {
    const tab = searchParams.get('tab') || 'notifications';
    setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    if (visibleTabs.includes(activeTab)) return;
    const fallback = visibleTabs[0] || 'notifications';
    setActiveTab(fallback);
    const next = new URLSearchParams(searchParams);
    next.set('tab', fallback);
    setSearchParams(next, { replace: true });
  }, [activeTab, searchParams, setSearchParams, visibleTabs]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    setSearchParams(next, { replace: true });
  };

  return (
    <MainLayout
      title="Configuracoes"
      subtitle="Gerencie conta, notificacoes e integracoes. Dados do salao ficam em Perfil do Salao."
    >
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 gap-2 h-auto">
          {visibleTabs.includes('notifications') ? (
            <TabsTrigger value="notifications">Notificacoes</TabsTrigger>
          ) : null}
          {visibleTabs.includes('account') ? (
            <TabsTrigger value="account">Conta</TabsTrigger>
          ) : null}
          {visibleTabs.includes('integrations') ? (
            <TabsTrigger value="integrations">Integracoes</TabsTrigger>
          ) : null}
          {visibleTabs.includes('fiscal') ? (
            <TabsTrigger value="fiscal">Fiscal</TabsTrigger>
          ) : null}
          {visibleTabs.includes('salon') ? (
            <TabsTrigger value="salon">Perfil do Salao</TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="notifications">
          <SettingsNotificationsTab />
        </TabsContent>

        <TabsContent value="account">
          <SettingsAccountTab
            userName={user?.name || ''}
            userEmail={user?.email || ''}
            userRole={user?.role}
          />
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Integracoes</CardTitle>
              <CardDescription>Configure integracoes externas da sua operacao.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {canAccessWhatsAppIntegration ? (
                <div className="rounded-lg border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      <PlugZap className="h-4 w-4 text-primary" />
                      WhatsApp Cloud API
                    </p>
                    <p className="text-sm text-muted-foreground">Defina credenciais por tenant e valide conexao.</p>
                  </div>
                  <Button asChild>
                    <Link to="/configuracoes/integracoes/whatsapp">Abrir configuracao</Link>
                  </Button>
                </div>
              ) : null}
              {canAccessStockSettings ? (
                <div className="rounded-lg border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      <Boxes className="h-4 w-4 text-primary" />
                      Estoque
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Parametros de alerta e politicas operacionais de estoque.
                    </p>
                  </div>
                  <Button asChild variant="outline">
                    <Link to="/configuracoes/estoque">Abrir configuracao</Link>
                  </Button>
                </div>
              ) : null}
              {user?.role === 'OWNER' ? <AppointmentConflictSettingsCard /> : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fiscal">
          <Card>
            <CardHeader>
              <CardTitle>Configuracoes Fiscais</CardTitle>
              <CardDescription>Toda configuracao fiscal deve ser acessada a partir desta aba.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {canAccessTaxSettings ? (
                <div className="rounded-lg border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-primary" />
                      Configuracao de Impostos
                    </p>
                    <p className="text-sm text-muted-foreground">Defina regime, aliquotas e parametros fiscais.</p>
                  </div>
                  <Button asChild><Link to="/configuracoes/fiscal/impostos">Abrir configuracao</Link></Button>
                </div>
              ) : null}
              {canAccessCertificates ? (
                <div className="rounded-lg border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      Certificados Fiscais
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Gerencie upload, ativacao e remocao de certificado A1 do tenant.
                    </p>
                  </div>
                  <Button asChild variant="outline">
                    <Link to="/configuracoes/fiscal/certificados">Abrir certificados</Link>
                  </Button>
                </div>
              ) : null}
              {canAccessNfseSettings ? (
                <div className="rounded-lg border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-primary" />
                      Configuracao NFS-e
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Configure emissao de servicos (municipio, provedor, RPS e capacidades).
                    </p>
                  </div>
                  <Button asChild variant="outline">
                    <Link to="/configuracoes/fiscal/nfse">Abrir NFS-e</Link>
                  </Button>
                </div>
              ) : null}
              {canAccessNfseModule ? (
                <div className="rounded-lg border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-primary" />
                      Modulo NFS-e
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Gerencie rascunhos, autorizacoes, cancelamentos e PDF da NFS-e.
                    </p>
                  </div>
                  <Button asChild variant="outline">
                    <Link to="/fiscal/nfse">Abrir modulo</Link>
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salon">
          <Card>
            <CardHeader>
              <CardTitle>Perfil do Salao</CardTitle>
              <CardDescription>
                Dados do salao, endereco, slug e horarios ficam centralizados em uma unica pagina.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {canAccessSalonProfile ? (
                <Button asChild className="gap-2">
                  <Link to="/perfil-salao">
                    <Building2 className="h-4 w-4" />
                    Abrir Perfil do Salao
                  </Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
