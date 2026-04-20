import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  Boxes,
  Building2,
  CheckCircle2,
  CircleAlert,
  PlugZap,
  Receipt,
  ShieldCheck,
  User,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useMenuPermissions } from '@/contexts/MenuPermissionsContext';
import { SettingsNotificationsTab } from '@/components/settings/SettingsNotificationsTab';
import { SettingsAccountTab } from '@/components/settings/SettingsAccountTab';
import { AppointmentConflictSettingsCard } from '@/components/settings/AppointmentConflictSettingsCard';

function SettingsDomainCard({
  icon: Icon,
  title,
  description,
  statusLabel,
  statusTone = 'default',
  actionLabel,
  onAction,
}: {
  icon: typeof PlugZap;
  title: string;
  description: string;
  statusLabel: string;
  statusTone?: 'default' | 'warning' | 'success';
  actionLabel: string;
  onAction: () => void;
}) {
  const badgeClassName =
    statusTone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : statusTone === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-800'
        : 'border-border bg-muted text-muted-foreground';

  return (
    <Card className="border-border/60">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-foreground">{title}</p>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          <Badge variant="outline" className={badgeClassName}>
            {statusLabel}
          </Badge>
        </div>

        <Button variant="outline" className="w-full justify-between" onClick={onAction}>
          {actionLabel}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

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

  const domainCards = useMemo(() => {
    const cards = [
      {
        key: 'notifications',
        icon: Bell,
        title: 'Notificacoes',
        description: 'Lembretes, reativacao e preferencia de contato.',
        statusLabel: 'Em uso',
        statusTone: 'success' as const,
        actionLabel: 'Revisar notificacoes',
        onAction: () => handleTabChange('notifications'),
      },
      {
        key: 'account',
        icon: User,
        title: 'Conta',
        description: 'Dados do usuario, senha e MFA.',
        statusLabel: 'Ativo',
        statusTone: 'success' as const,
        actionLabel: 'Abrir conta',
        onAction: () => handleTabChange('account'),
      },
    ];

    if (visibleTabs.includes('integrations')) {
      cards.push({
        key: 'integrations',
        icon: PlugZap,
        title: 'Integracoes',
        description: 'WhatsApp, estoque e regras operacionais externas.',
        statusLabel: canAccessWhatsAppIntegration ? 'Revisar' : 'Parcial',
        statusTone: 'warning' as const,
        actionLabel: 'Abrir integracoes',
        onAction: () => handleTabChange('integrations'),
      });
    }

    if (visibleTabs.includes('fiscal')) {
      cards.push({
        key: 'fiscal',
        icon: Receipt,
        title: 'Fiscal',
        description: 'Impostos, certificados e emissao NFS-e.',
        statusLabel: 'Atencao',
        statusTone: 'warning' as const,
        actionLabel: 'Abrir fiscal',
        onAction: () => handleTabChange('fiscal'),
      });
    }

    if (visibleTabs.includes('salon')) {
      cards.push({
        key: 'salon',
        icon: Building2,
        title: 'Perfil do Salao',
        description: 'Dados principais, endereco, slug e horarios.',
        statusLabel: 'Centralizado',
        statusTone: 'default' as const,
        actionLabel: 'Abrir perfil do salao',
        onAction: () => handleTabChange('salon'),
      });
    }

    return cards;
  }, [
    canAccessWhatsAppIntegration,
    visibleTabs,
  ]);

  const pendingItems = useMemo(() => {
    const items = [
      {
        title: 'Revisar notificacoes e reativacao',
        description: 'Confirme se canais e janelas de disparo ainda refletem a operacao atual.',
        actionLabel: 'Abrir notificacoes',
        onAction: () => handleTabChange('notifications'),
      },
    ];

    if (canAccessWhatsAppIntegration) {
      items.push({
        title: 'Conferir integracao do WhatsApp',
        description: 'Valide credenciais, webhook e capacidade operacional do canal.',
        actionLabel: 'Abrir integracoes',
        onAction: () => handleTabChange('integrations'),
      });
    }

    if (canAccessNfseSettings || canAccessCertificates || canAccessTaxSettings) {
      items.push({
        title: 'Revisar setup fiscal',
        description: 'Garanta consistencia entre impostos, certificado e configuracao NFS-e.',
        actionLabel: 'Abrir fiscal',
        onAction: () => handleTabChange('fiscal'),
      });
    }

    if (canAccessSalonProfile) {
      items.push({
        title: 'Validar dados do salao',
        description: 'Slug, endereco e horarios precisam permanecer corretos para os fluxos publicos.',
        actionLabel: 'Abrir perfil',
        onAction: () => handleTabChange('salon'),
      });
    }

    return items.slice(0, 4);
  }, [
    canAccessCertificates,
    canAccessNfseSettings,
    canAccessSalonProfile,
    canAccessTaxSettings,
    canAccessWhatsAppIntegration,
  ]);

  return (
    <MainLayout
      title="Configuracoes"
      subtitle="Centro de controle para conta, operacao, integracoes e configuracoes fiscais."
    >
      <div className="space-y-6">
        <Card className="border-border/60 bg-gradient-to-r from-background via-muted/30 to-background">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Centro de controle
              </p>
              <p className="text-sm font-medium text-foreground">
                Comece pelo dominio que exige atencao agora e depois aprofunde nas abas de detalhe.
              </p>
              <p className="text-xs text-muted-foreground">
                A pagina agora organiza status atual, pendencias e atalhos prioritarios no mesmo lugar.
              </p>
            </div>
            <Badge variant="outline" className="w-fit bg-background/80">
              {domainCards.length} dominios disponiveis
            </Badge>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">Status por dominio</h2>
              <p className="text-sm text-muted-foreground">
                Use estes cards para identificar rapidamente onde revisar configuracoes da operacao.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {domainCards.map(({ key, ...cardProps }) => (
                <SettingsDomainCard key={key} {...cardProps} />
              ))}
            </div>
          </div>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <CircleAlert className="h-4 w-4 text-amber-600" />
                Pendencias prioritarias
              </CardTitle>
              <CardDescription>
                Atalhos para os ajustes mais prováveis antes de mexer no restante da configuracao.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingItems.map((item) => (
                <div key={item.title} className="rounded-xl border bg-muted/20 p-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <Button variant="link" className="h-auto px-0" onClick={item.onAction}>
                        {item.actionLabel}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

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
              <CardDescription>
                Acompanhe o estado das integracoes operacionais e entre direto no ponto certo para ajuste.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
              {canAccessWhatsAppIntegration ? (
                <div className="rounded-xl border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        <PlugZap className="h-4 w-4 text-primary" />
                        WhatsApp Cloud API
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Credenciais por tenant, webhook e teste operacional do canal.
                      </p>
                    </div>
                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">
                      Revisar
                    </Badge>
                  </div>
                  <div className="rounded-lg bg-muted/20 p-3 text-sm text-muted-foreground">
                    Prioridade: validar conexao, token e webhook antes de depender do canal em producao.
                  </div>
                  <Button asChild className="w-full justify-between">
                    <Link to="/configuracoes/integracoes/whatsapp">
                      Abrir configuracao
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ) : null}
              {canAccessStockSettings ? (
                <div className="rounded-xl border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        <Boxes className="h-4 w-4 text-primary" />
                        Estoque
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Alertas, políticas e parâmetros operacionais do módulo de estoque.
                      </p>
                    </div>
                    <Badge variant="outline">Operacional</Badge>
                  </div>
                  <div className="rounded-lg bg-muted/20 p-3 text-sm text-muted-foreground">
                    Prioridade: ajustar alertas e políticas antes de escalar o uso de compras, transferências e inventário.
                  </div>
                  <Button asChild variant="outline" className="w-full justify-between">
                    <Link to="/configuracoes/estoque">
                      Abrir configuracao
                      <ArrowRight className="h-4 w-4" />
                    </Link>
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
              <CardTitle>Fiscal</CardTitle>
              <CardDescription>
                Trate esta aba como checkpoint único para setup tributário, certificado e emissão.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
              {canAccessTaxSettings ? (
                <div className="rounded-xl border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-primary" />
                        Configuracao de Impostos
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Regime, alíquotas e regras fiscais do tenant.
                      </p>
                    </div>
                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">
                      Revisar
                    </Badge>
                  </div>
                  <Button asChild className="w-full justify-between">
                    <Link to="/configuracoes/fiscal/impostos">
                      Abrir configuracao
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ) : null}
              {canAccessCertificates ? (
                <div className="rounded-xl border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        Certificados Fiscais
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Upload, ativacao e remocao do certificado A1 do tenant.
                      </p>
                    </div>
                    <Badge variant="outline">Seguranca</Badge>
                  </div>
                  <Button asChild variant="outline" className="w-full justify-between">
                    <Link to="/configuracoes/fiscal/certificados">
                      Abrir certificados
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ) : null}
              {canAccessNfseSettings ? (
                <div className="rounded-xl border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-primary" />
                        Configuracao NFS-e
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Municipio, provedor, RPS e capacidades da emissao.
                      </p>
                    </div>
                    <Badge variant="outline">Setup</Badge>
                  </div>
                  <Button asChild variant="outline" className="w-full justify-between">
                    <Link to="/configuracoes/fiscal/nfse">
                      Abrir NFS-e
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ) : null}
              {canAccessNfseModule ? (
                <div className="rounded-xl border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-primary" />
                        Modulo NFS-e
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Rascunhos, autorizacoes, cancelamentos e PDF da nota.
                      </p>
                    </div>
                    <Badge variant="outline">Operacional</Badge>
                  </div>
                  <Button asChild variant="outline" className="w-full justify-between">
                    <Link to="/fiscal/nfse">
                      Abrir modulo
                      <ArrowRight className="h-4 w-4" />
                    </Link>
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
                Dados do salao, endereco, slug e horarios ficam centralizados em uma unica pagina operacional.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
                Use este atalho quando precisar revisar dados que impactam a pagina publica, agenda online e identidade do tenant.
              </div>
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
      </div>
    </MainLayout>
  );
}
