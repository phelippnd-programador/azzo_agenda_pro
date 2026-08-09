import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Boxes,
  Building2,
  CalendarRange,
  CreditCard,
  PlugZap,
  Receipt,
  Send,
  ShieldCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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
import { ReminderSettingsCard } from '@/components/settings/ReminderSettingsCard';
import { LoyaltySettingsCard } from '@/components/settings/LoyaltySettingsCard';
import { SettingsBusinessHoursTab } from '@/components/settings/SettingsBusinessHoursTab';
import { SettingsClosuresTab } from '@/components/settings/SettingsClosuresTab';
import { SettingsLgpdTab } from '@/components/settings/SettingsLgpdTab';

type SettingsLinkCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  to: string;
  actionLabel: string;
  variant?: 'default' | 'outline';
};

function SettingsLinkCard({
  icon: Icon,
  title,
  description,
  to,
  actionLabel,
  variant = 'default',
}: SettingsLinkCardProps) {
  return (
    <Card className="h-full border-border/70 bg-card/95 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-panel">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant={variant} className="w-full justify-between">
          <Link to={to}>
            {actionLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

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
    if (isOwner) tabs.push('lgpd');
    if (canAccessWhatsApp || canAccessStock || isOwner) tabs.push('integrations');
    if (canAccessTax || canAccessCerts || canAccessNfseConfig || canAccessNfseModule) tabs.push('fiscal');
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
    lgpd:         'LGPD',
    integrations: 'Integrações',
    fiscal:       'Fiscal',
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
              <SettingsLinkCard
                icon={Building2}
                title="Perfil do Salão"
                description="Nome, endereço, slug, foto e dados públicos do estabelecimento."
                to="/perfil-salao"
                actionLabel="Abrir perfil do salão"
              />
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
                <ReminderSettingsCard />
                <LoyaltySettingsCard />
              </div>
            </TabsContent>
          )}

          {/* ── LGPD ── contato DPO */}
          {isOwner && (
            <TabsContent value="lgpd">
              <SettingsLgpdTab />
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
                <SettingsLinkCard
                  icon={PlugZap}
                  title="WhatsApp Business"
                  description="Credenciais, webhook e teste do canal de mensagens."
                  to="/configuracoes/integracoes/whatsapp"
                  actionLabel="Configurar WhatsApp"
                />
              )}
              {isOwner && (
                <SettingsLinkCard
                  icon={Send}
                  title="Telegram"
                  description="Bot do Telegram, webhook e teste do canal de mensagens."
                  to="/configuracoes/integracoes/telegram"
                  actionLabel="Configurar Telegram"
                />
              )}
              {isOwner && (
                <SettingsLinkCard
                  icon={CreditCard}
                  title="Pagamentos (Asaas)"
                  description="Conta de recebimento do salão para sinal, comandas e assinaturas."
                  to="/configuracoes/integracoes/pagamentos"
                  actionLabel="Configurar pagamentos"
                />
              )}
              {canAccessStock && (
                <SettingsLinkCard
                  icon={Boxes}
                  title="Estoque"
                  description="Alertas de estoque mínimo e parâmetros operacionais."
                  to="/configuracoes/estoque"
                  actionLabel="Configurar estoque"
                  variant="outline"
                />
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
                <SettingsLinkCard
                  icon={Receipt}
                  title="Impostos"
                  description="Regime, alíquotas e regras fiscais do salão."
                  to="/configuracoes/fiscal/impostos"
                  actionLabel="Abrir impostos"
                />
              )}
              {canAccessCerts && (
                <SettingsLinkCard
                  icon={ShieldCheck}
                  title="Certificado Digital"
                  description="Upload e ativação do certificado A1."
                  to="/configuracoes/fiscal/certificados"
                  actionLabel="Abrir certificados"
                  variant="outline"
                />
              )}
              {canAccessNfseConfig && (
                <SettingsLinkCard
                  icon={Receipt}
                  title="Configuração NFS-e"
                  description="Município, provedor, RPS e parâmetros de emissão."
                  to="/configuracoes/fiscal/nfse"
                  actionLabel="Configurar NFS-e"
                  variant="outline"
                />
              )}
              {canAccessNfseModule && (
                <SettingsLinkCard
                  icon={CalendarRange}
                  title="Módulo NFS-e"
                  description="Emitir, cancelar e consultar notas fiscais."
                  to="/fiscal/nfse"
                  actionLabel="Abrir módulo"
                  variant="outline"
                />
              )}
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </MainLayout>
  );
}
