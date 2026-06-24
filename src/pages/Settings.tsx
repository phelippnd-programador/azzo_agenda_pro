import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Boxes,
  Building2,
  CalendarRange,
  PlugZap,
  Receipt,
  ShieldCheck,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useMenuPermissions } from '@/contexts/MenuPermissionsContext';
import { SettingsNotificationsTab } from '@/components/settings/SettingsNotificationsTab';
import { SettingsAccountTab } from '@/components/settings/SettingsAccountTab';
import { AppointmentConflictSettingsCard } from '@/components/settings/AppointmentConflictSettingsCard';
import { CancellationPolicyCard } from '@/components/settings/CancellationPolicyCard';
import { SettingsLgpdTab } from '@/components/settings/SettingsLgpdTab';
import { SettingsBusinessHoursTab } from '@/components/settings/SettingsBusinessHoursTab';
import { SettingsClosuresTab } from '@/components/settings/SettingsClosuresTab';

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'account');
  const { user } = useAuth();
  const { allowedRoutes, canAccess } = useMenuPermissions();
  const tabsRef = useRef<HTMLDivElement | null>(null);

  const hasExactRoute = (route: string) => (allowedRoutes ?? []).includes(route);
  const canAccessWhatsApp    = hasExactRoute('/configuracoes/integracoes/whatsapp');
  const canAccessStock       = hasExactRoute('/configuracoes/estoque');
  const canAccessTax         = hasExactRoute('/configuracoes/fiscal/impostos');
  const canAccessCerts       = hasExactRoute('/configuracoes/fiscal/certificados');
  const canAccessNfseConfig  = hasExactRoute('/configuracoes/fiscal/nfse');
  const canAccessNfseModule  = hasExactRoute('/fiscal/nfse');
  const canAccessSalon       = canAccess('/perfil-salao');

  const isOwner = user?.role === 'OWNER';

  const visibleTabs = useMemo(() => {
    const tabs: string[] = ['account', 'notifications'];
    if (canAccessSalon || isOwner) tabs.push('salon');
    if (isOwner) tabs.push('agenda');
    if (canAccessWhatsApp || canAccessStock) tabs.push('integrations');
    if (canAccessTax || canAccessCerts || canAccessNfseConfig || canAccessNfseModule) tabs.push('fiscal');
    if (isOwner) tabs.push('lgpd');
    return tabs;
  }, [canAccessSalon, isOwner, canAccessWhatsApp, canAccessStock, canAccessTax, canAccessCerts, canAccessNfseConfig, canAccessNfseModule]);

  useEffect(() => {
    const tab = searchParams.get('tab') || 'account';
    setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    if (visibleTabs.includes(activeTab)) return;
    const fallback = visibleTabs[0] ?? 'account';
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

  const TAB_LABELS: Record<string, string> = {
    account:      'Minha Conta',
    notifications:'Notificações',
    salon:        'Salão',
    agenda:       'Agenda',
    integrations: 'Integrações',
    fiscal:       'Fiscal',
    lgpd:         'LGPD',
  };

  return (
    <MainLayout
      title="Configurações"
      subtitle="Gerencie sua conta, o salão e as preferências do sistema."
    >
      <div ref={tabsRef} className="space-y-4">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <div className="overflow-x-auto">
            <TabsList className="flex h-auto w-max gap-1 rounded-xl border bg-muted/30 p-1">
              {visibleTabs.map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="shrink-0 whitespace-nowrap px-4 py-2 text-sm"
                >
                  {TAB_LABELS[tab]}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* ── Minha Conta ── */}
          <TabsContent value="account">
            <SettingsAccountTab
              userName={user?.name ?? ''}
              userEmail={user?.email ?? ''}
              userRole={user?.role}
            />
          </TabsContent>

          {/* ── Notificações ── */}
          <TabsContent value="notifications">
            <SettingsNotificationsTab />
          </TabsContent>

          {/* ── Salão ── perfil + horários + fechamentos */}
          <TabsContent value="salon" className="space-y-6">
            {canAccessSalon && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Perfil do Salão
                  </CardTitle>
                  <CardDescription>
                    Nome, endereço, slug, foto e dados públicos do estabelecimento.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="gap-2">
                    <Link to="/perfil-salao">
                      Abrir perfil do salão
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {isOwner && (
              <>
                <SettingsBusinessHoursTab />
                <SettingsClosuresTab />
              </>
            )}
          </TabsContent>

          {/* ── Agenda ── conflito + cancelamento */}
          {isOwner && (
            <TabsContent value="agenda" className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">Regras da Agenda</h2>
                <p className="text-sm text-muted-foreground">
                  Controle como conflitos e cancelamentos são tratados no seu salão.
                </p>
              </div>
              <Separator />
              <div className="grid gap-4 lg:grid-cols-2">
                <AppointmentConflictSettingsCard />
                <CancellationPolicyCard />
              </div>
            </TabsContent>
          )}

          {/* ── Integrações ── WhatsApp + Estoque */}
          <TabsContent value="integrations" className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">Integrações</h2>
              <p className="text-sm text-muted-foreground">
                Canais e módulos externos conectados ao seu salão.
              </p>
            </div>
            <Separator />
            <div className="grid gap-4 lg:grid-cols-2">
              {canAccessWhatsApp && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <PlugZap className="h-4 w-4 text-primary" />
                      WhatsApp Business
                    </CardTitle>
                    <CardDescription>
                      Credenciais, webhook e teste do canal de mensagens.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full justify-between">
                      <Link to="/configuracoes/integracoes/whatsapp">
                        Configurar WhatsApp
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
              {canAccessStock && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Boxes className="h-4 w-4 text-primary" />
                      Estoque
                    </CardTitle>
                    <CardDescription>
                      Alertas de estoque mínimo e parâmetros operacionais.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="outline" className="w-full justify-between">
                      <Link to="/configuracoes/estoque">
                        Configurar estoque
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ── Fiscal ── impostos + certificados + NFS-e */}
          <TabsContent value="fiscal" className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">Configurações Fiscais</h2>
              <p className="text-sm text-muted-foreground">
                Regime tributário, certificado digital e emissão de notas de serviço.
              </p>
            </div>
            <Separator />
            <div className="grid gap-4 lg:grid-cols-2">
              {canAccessTax && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Receipt className="h-4 w-4 text-primary" />
                      Impostos
                    </CardTitle>
                    <CardDescription>Regime, alíquotas e regras fiscais do salão.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full justify-between">
                      <Link to="/configuracoes/fiscal/impostos">
                        Abrir impostos
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
              {canAccessCerts && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      Certificado Digital
                    </CardTitle>
                    <CardDescription>Upload e ativação do certificado A1.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="outline" className="w-full justify-between">
                      <Link to="/configuracoes/fiscal/certificados">
                        Abrir certificados
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
              {canAccessNfseConfig && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Receipt className="h-4 w-4 text-primary" />
                      Configuração NFS-e
                    </CardTitle>
                    <CardDescription>Município, provedor, RPS e parâmetros de emissão.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="outline" className="w-full justify-between">
                      <Link to="/configuracoes/fiscal/nfse">
                        Configurar NFS-e
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
              {canAccessNfseModule && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <CalendarRange className="h-4 w-4 text-primary" />
                      Módulo NFS-e
                    </CardTitle>
                    <CardDescription>Emitir, cancelar e consultar notas fiscais.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="outline" className="w-full justify-between">
                      <Link to="/fiscal/nfse">
                        Abrir módulo
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ── LGPD ── */}
          {isOwner && (
            <TabsContent value="lgpd">
              <SettingsLgpdTab />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </MainLayout>
  );
}
