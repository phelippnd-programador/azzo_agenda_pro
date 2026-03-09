import { useEffect, useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { billingApi, configApi, systemAdminApi, usersApi } from "@/lib/api";
import { toast } from "sonner";
import type {
  AdminTenantItem,
  CommercialOverview,
  GlobalAuditDetail,
  GlobalAuditItem,
  MenuConfigScope,
  MenuRoleRouteItem,
  SessionItem,
  SystemAdminRole,
} from "@/types/system-admin";
import type { BillingPaymentItem } from "@/types/billing";
import { useAuth } from "@/contexts/AuthContext";
import { Eye } from "lucide-react";

const ROLES: SystemAdminRole[] = ["ADMIN", "OWNER", "PROFESSIONAL"];
const AUDIT_MODULE_OPTIONS = ["", "AUTH", "RBAC", "FINANCE", "FISCAL", "SYSTEM"];
const AUDIT_STATUS_OPTIONS = ["", "SUCCESS", "ERROR", "DENIED"];
const AUDIT_CHANNEL_OPTIONS = ["", "API", "WEBHOOK", "SCHEDULER", "SYSTEM"];

export default function SystemAdminPage() {
  const { user } = useAuth();
  const [role, setRole] = useState<SystemAdminRole>("OWNER");
  const [menuScope, setMenuScope] = useState<MenuConfigScope>("TENANT");
  const [routes, setRoutes] = useState<MenuRoleRouteItem[]>([]);
  const [search, setSearch] = useState("");
  const [reason, setReason] = useState("Ajuste administrativo de permissoes.");
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [isSavingRoutes, setIsSavingRoutes] = useState(false);

  const [payments, setPayments] = useState<BillingPaymentItem[]>([]);
  const [activeTenants, setActiveTenants] = useState<AdminTenantItem[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);
  const [isChangingLicense, setIsChangingLicense] = useState(false);
  const [commercialOverview, setCommercialOverview] = useState<CommercialOverview | null>(null);
  const [isLoadingCommercial, setIsLoadingCommercial] = useState(false);
  const [globalAudits, setGlobalAudits] = useState<GlobalAuditItem[]>([]);
  const [isAuditDetailOpen, setIsAuditDetailOpen] = useState(false);
  const [auditDetail, setAuditDetail] = useState<GlobalAuditDetail | null>(null);
  const [isLoadingAuditDetail, setIsLoadingAuditDetail] = useState(false);
  const [auditFilters, setAuditFilters] = useState({
    tenantId: "",
    module: "",
    action: "",
    status: "",
    sourceChannel: "",
    entityType: "",
    actorUserId: "",
    requestId: "",
    text: "",
    from: "",
    to: "",
    limit: 50,
  });
  const [isLoadingGlobalAudits, setIsLoadingGlobalAudits] = useState(false);
  const [sessionUserId, setSessionUserId] = useState("");
  const [sessionItems, setSessionItems] = useState<SessionItem[]>([]);
  const [includeRevokedSessions, setIncludeRevokedSessions] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isRevokingSessions, setIsRevokingSessions] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminCurrentPassword, setAdminCurrentPassword] = useState("");
  const [adminNewPassword, setAdminNewPassword] = useState("");
  const [adminConfirmPassword, setAdminConfirmPassword] = useState("");
  const [isSavingCredentials, setIsSavingCredentials] = useState(false);

  const filteredRoutes = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return routes;
    return routes.filter((item) => item.route.toLowerCase().includes(term));
  }, [routes, search]);

  const pendingPayments = useMemo(
    () => payments.filter((item) => String(item.status || "").toUpperCase() === "PENDING"),
    [payments]
  );

  const loadRoutes = async (nextRole: SystemAdminRole, scope: MenuConfigScope, tenantId?: string) => {
    if (scope === "TENANT" && !tenantId) {
      setRoutes([]);
      return;
    }
    setIsLoadingRoutes(true);
    try {
      const response = await configApi.getRoleRoutes(nextRole, scope, tenantId);
      setRoutes(response.items || []);
    } catch (error) {
      toast.error("Nao foi possivel carregar rotas do perfil.");
      setRoutes([]);
    } finally {
      setIsLoadingRoutes(false);
    }
  };

  const loadPayments = async (tenantId: string) => {
    if (!tenantId) {
      setPayments([]);
      return;
    }
    setIsLoadingPayments(true);
    try {
      const response = await billingApi.adminGetTenantPayments(tenantId);
      setPayments(response.items || []);
    } catch {
      toast.error("Nao foi possivel carregar pagamentos.");
      setPayments([]);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  const loadActiveTenants = async () => {
    setIsLoadingTenants(true);
    try {
      const response = await billingApi.adminListActiveTenants();
      const items = response.items || [];
      setActiveTenants(items);
      setSelectedTenantId((current) => current || items[0]?.tenantId || "");
    } catch {
      toast.error("Nao foi possivel carregar tenants.");
      setActiveTenants([]);
      setSelectedTenantId("");
    } finally {
      setIsLoadingTenants(false);
    }
  };

  const loadCommercialOverview = async () => {
    setIsLoadingCommercial(true);
    try {
      const response = await systemAdminApi.getCommercialOverview();
      setCommercialOverview(response);
    } catch {
      toast.error("Nao foi possivel carregar analise comercial.");
      setCommercialOverview(null);
    } finally {
      setIsLoadingCommercial(false);
    }
  };

  const loadGlobalAudits = async (filters?: Partial<typeof auditFilters>) => {
    const payload = { ...auditFilters, ...(filters || {}) };
    setIsLoadingGlobalAudits(true);
    try {
      const response = await systemAdminApi.getGlobalAudits({
        tenantId: payload.tenantId || undefined,
        module: payload.module || undefined,
        action: payload.action || undefined,
        status: payload.status || undefined,
        sourceChannel: payload.sourceChannel || undefined,
        entityType: payload.entityType || undefined,
        actorUserId: payload.actorUserId || undefined,
        requestId: payload.requestId || undefined,
        text: payload.text?.trim() || undefined,
        from: payload.from ? new Date(payload.from).toISOString() : undefined,
        to: payload.to ? new Date(payload.to).toISOString() : undefined,
        limit: payload.limit,
      });
      setGlobalAudits(response.items || []);
    } catch {
      toast.error("Nao foi possivel carregar auditoria global.");
      setGlobalAudits([]);
    } finally {
      setIsLoadingGlobalAudits(false);
    }
  };

  const loadSessions = async (tenantId?: string) => {
    setIsLoadingSessions(true);
    try {
      const response = await systemAdminApi.listSessions({
        tenantId: tenantId || undefined,
        includeRevoked: includeRevokedSessions,
        limit: 100,
      });
      setSessionItems(response.items || []);
    } catch {
      toast.error("Nao foi possivel carregar sessoes.");
      setSessionItems([]);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const openAuditDetail = async (id: string) => {
    setIsLoadingAuditDetail(true);
    setIsAuditDetailOpen(true);
    try {
      const detail = await systemAdminApi.getGlobalAuditDetail(id);
      setAuditDetail(detail);
    } catch {
      toast.error("Nao foi possivel carregar detalhe da auditoria.");
      setAuditDetail(null);
    } finally {
      setIsLoadingAuditDetail(false);
    }
  };

  const revokeSessions = async () => {
    if (!selectedTenantId && !sessionUserId.trim()) {
      toast.error("Informe tenant ou userId para revogar sessoes.");
      return;
    }
    setIsRevokingSessions(true);
    try {
      const response = await systemAdminApi.revokeSessions({
        tenantId: selectedTenantId || undefined,
        userId: sessionUserId.trim() || undefined,
      });
      toast.success(response.message || `Sessoes revogadas: ${response.revokedCount}`);
      await loadSessions(selectedTenantId);
    } catch {
      toast.error("Falha ao revogar sessoes.");
    } finally {
      setIsRevokingSessions(false);
    }
  };

  const revokeSingleSession = async (refreshTokenId: string) => {
    setIsRevokingSessions(true);
    try {
      const response = await systemAdminApi.revokeSessionToken({
        refreshTokenId,
        tenantId: selectedTenantId || undefined,
      });
      toast.success(response.message || `Sessoes revogadas: ${response.revokedCount}`);
      await loadSessions(selectedTenantId);
    } catch {
      toast.error("Falha ao revogar sessao.");
    } finally {
      setIsRevokingSessions(false);
    }
  };

  useEffect(() => {
    if (menuScope === "TENANT" && !selectedTenantId) return;
    loadRoutes(role, menuScope, selectedTenantId);
  }, [role, menuScope, selectedTenantId]);

  useEffect(() => {
    loadActiveTenants();
    loadCommercialOverview();
    loadGlobalAudits({});
  }, []);

  useEffect(() => {
    if (!selectedTenantId) return;
    loadPayments(selectedTenantId);
    loadSessions(selectedTenantId);
  }, [selectedTenantId]);

  useEffect(() => {
    loadSessions(selectedTenantId);
  }, [includeRevokedSessions]);

  useEffect(() => {
    setAdminName(user?.name || "");
    setAdminEmail(user?.email || "");
  }, [user?.name, user?.email]);

  const toggleRoute = (route: string, enabled: boolean) => {
    setRoutes((prev) =>
      prev.map((item) =>
        item.route === route
          ? { ...item, enabled, overridden: true, reason: reason || item.reason }
          : item
      )
    );
  };

  const saveRoutes = async () => {
    if (menuScope === "TENANT" && !selectedTenantId) {
      toast.error("Selecione um tenant.");
      return;
    }
    setIsSavingRoutes(true);
    try {
      await configApi.applyMenuOverridesBulk({
        scope: menuScope,
        tenantId: menuScope === "TENANT" ? selectedTenantId : undefined,
        role,
        reason,
        items: routes.map((item) => ({ route: item.route, enabled: item.enabled })),
      });
      toast.success("Permissoes do menu atualizadas.");
      await loadRoutes(role, menuScope, selectedTenantId);
    } catch {
      toast.error("Falha ao salvar permissoes do menu.");
    } finally {
      setIsSavingRoutes(false);
    }
  };

  const forceExpired = async () => {
    setIsChangingLicense(true);
    try {
      if (!selectedTenantId) {
        toast.error("Selecione um tenant.");
        return;
      }
      const result = await billingApi.adminExpireLicense(selectedTenantId, 5);
      toast.success(result.message || "Plano marcado como vencido.");
      await loadCommercialOverview();
    } catch {
      toast.error("Falha ao marcar plano como vencido.");
    } finally {
      setIsChangingLicense(false);
    }
  };

  const releaseLicense = async () => {
    setIsChangingLicense(true);
    try {
      if (!selectedTenantId) {
        toast.error("Selecione um tenant.");
        return;
      }
      const result = await billingApi.adminReleaseLicense({ tenantId: selectedTenantId, validityDays: 30 });
      toast.success(result.message || "Licenca liberada.");
      await loadPayments(selectedTenantId);
      await loadCommercialOverview();
    } catch {
      toast.error("Falha ao liberar licenca.");
    } finally {
      setIsChangingLicense(false);
    }
  };

  const markPaymentReceived = async (paymentId: string) => {
    setIsChangingLicense(true);
    try {
      if (!selectedTenantId) {
        toast.error("Selecione um tenant.");
        return;
      }
      const result = await billingApi.adminMarkPaymentReceived(selectedTenantId, paymentId, 30);
      toast.success(result.message || "Pagamento liberado e licenca atualizada.");
      await loadPayments(selectedTenantId);
      await loadCommercialOverview();
    } catch {
      toast.error("Falha ao liberar pagamento.");
    } finally {
      setIsChangingLicense(false);
    }
  };

  const saveAdminProfile = async () => {
    if (!adminName.trim() || !adminEmail.trim()) {
      toast.error("Nome e usuario (email) sao obrigatorios.");
      return;
    }
    setIsSavingCredentials(true);
    try {
      await usersApi.updateMe({
        name: adminName.trim(),
        email: adminEmail.trim(),
        phone: user?.phone ?? "",
      });
      toast.success("Usuario administrativo atualizado.");
    } catch {
      toast.error("Falha ao atualizar usuario administrativo.");
    } finally {
      setIsSavingCredentials(false);
    }
  };

  const saveAdminPassword = async () => {
    if (!adminCurrentPassword || !adminNewPassword || !adminConfirmPassword) {
      toast.error("Preencha todos os campos de senha.");
      return;
    }
    setIsSavingCredentials(true);
    try {
      await usersApi.updatePassword({
        currentPassword: adminCurrentPassword,
        newPassword: adminNewPassword,
        confirmPassword: adminConfirmPassword,
      });
      setAdminCurrentPassword("");
      setAdminNewPassword("");
      setAdminConfirmPassword("");
      toast.success("Senha administrativa atualizada.");
    } catch {
      toast.error("Falha ao atualizar senha administrativa.");
    } finally {
      setIsSavingCredentials(false);
    }
  };

  return (
    <MainLayout
      title="Administrador do Sistema"
      subtitle="Gerencie menus por role, simule plano vencido e libere pagamentos para testes."
    >
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
                    {tenant.name} [{tenant.planStatus || "N/A"}]
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analise Comercial</CardTitle>
            <CardDescription>Visao executiva de cadastro, conversao, pagamentos e inadimplencia.</CardDescription>
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
                    <p className="text-xl font-semibold">{commercialOverview.conversionRatePercent.toFixed(1)}%</p>
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
                      R$ {(commercialOverview.revenueReceived30dCents / 100).toFixed(2)}
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

        <Card>
          <CardHeader>
            <CardTitle>Auditoria Completa</CardTitle>
            <CardDescription>Eventos globais de todos os tenants, incluindo modulo SYSTEM.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-4">
              <Select
                value={auditFilters.tenantId || "ALL"}
                onValueChange={(value) =>
                  setAuditFilters((prev) => ({ ...prev, tenantId: value === "ALL" ? "" : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tenant (todos)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tenant: Todos</SelectItem>
                  {activeTenants.map((tenant) => (
                    <SelectItem key={tenant.tenantId} value={tenant.tenantId}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={auditFilters.module || "ALL"}
                onValueChange={(value) =>
                  setAuditFilters((prev) => ({ ...prev, module: value === "ALL" ? "" : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Modulo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Modulo: Todos</SelectItem>
                  {AUDIT_MODULE_OPTIONS.filter((item) => item).map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={auditFilters.status || "ALL"}
                onValueChange={(value) =>
                  setAuditFilters((prev) => ({ ...prev, status: value === "ALL" ? "" : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Status: Todos</SelectItem>
                  {AUDIT_STATUS_OPTIONS.filter((item) => item).map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={auditFilters.sourceChannel || "ALL"}
                onValueChange={(value) =>
                  setAuditFilters((prev) => ({ ...prev, sourceChannel: value === "ALL" ? "" : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Canal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Canal: Todos</SelectItem>
                  {AUDIT_CHANNEL_OPTIONS.filter((item) => item).map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="Acao exata"
                value={auditFilters.action}
                onChange={(event) => setAuditFilters((prev) => ({ ...prev, action: event.target.value }))}
              />
              <Input
                placeholder="Entity type"
                value={auditFilters.entityType}
                onChange={(event) => setAuditFilters((prev) => ({ ...prev, entityType: event.target.value }))}
              />
              <Input
                placeholder="Actor user id"
                value={auditFilters.actorUserId}
                onChange={(event) => setAuditFilters((prev) => ({ ...prev, actorUserId: event.target.value }))}
              />
              <Input
                placeholder="Request ID"
                value={auditFilters.requestId}
                onChange={(event) => setAuditFilters((prev) => ({ ...prev, requestId: event.target.value }))}
              />

              <Input
                type="datetime-local"
                value={auditFilters.from}
                onChange={(event) => setAuditFilters((prev) => ({ ...prev, from: event.target.value }))}
              />
              <Input
                type="datetime-local"
                value={auditFilters.to}
                onChange={(event) => setAuditFilters((prev) => ({ ...prev, to: event.target.value }))}
              />
              <Input
                placeholder="Buscar por acao, modulo, request id, tenant..."
                value={auditFilters.text}
                onChange={(event) => setAuditFilters((prev) => ({ ...prev, text: event.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => loadGlobalAudits({})}
                disabled={isLoadingGlobalAudits}
              >
                Aplicar filtros
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  const reset = {
                    tenantId: "",
                    module: "",
                    action: "",
                    status: "",
                    sourceChannel: "",
                    entityType: "",
                    actorUserId: "",
                    requestId: "",
                    text: "",
                    from: "",
                    to: "",
                    limit: 50,
                  };
                  setAuditFilters(reset);
                  loadGlobalAudits(reset);
                }}
                disabled={isLoadingGlobalAudits}
              >
                Limpar
              </Button>
            </div>

            <div className="rounded-md border">
              <div className="max-h-[360px] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left">Data</th>
                      <th className="px-3 py-2 text-left">Tenant</th>
                      <th className="px-3 py-2 text-left">Modulo</th>
                      <th className="px-3 py-2 text-left">Acao</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Request ID</th>
                      <th className="px-3 py-2 text-left">Detalhe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {globalAudits.map((event) => (
                      <tr key={event.id} className="border-t">
                        <td className="px-3 py-2 whitespace-nowrap">
                          {event.createdAt ? new Date(event.createdAt).toLocaleString("pt-BR") : "-"}
                        </td>
                        <td className="px-3 py-2">{event.tenantName || event.tenantId || "-"}</td>
                        <td className="px-3 py-2">{event.module || "-"}</td>
                        <td className="px-3 py-2">{event.action || "-"}</td>
                        <td className="px-3 py-2">{event.status || "-"}</td>
                        <td className="px-3 py-2 font-mono text-xs">{event.requestId || "-"}</td>
                        <td className="px-3 py-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => openAuditDetail(event.id)}
                            title="Ver detalhe"
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {!isLoadingGlobalAudits && globalAudits.length === 0 ? (
                      <tr>
                        <td className="px-3 py-4 text-muted-foreground" colSpan={7}>
                          Nenhum evento encontrado.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isAuditDetailOpen} onOpenChange={setIsAuditDetailOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Detalhe da Auditoria</DialogTitle>
            </DialogHeader>
            {isLoadingAuditDetail ? (
              <p className="text-sm text-muted-foreground">Carregando detalhe...</p>
            ) : !auditDetail ? (
              <p className="text-sm text-muted-foreground">Nenhum detalhe encontrado.</p>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="grid gap-2 md:grid-cols-2">
                  <p><strong>Tenant:</strong> {auditDetail.tenantName || auditDetail.tenantId || "-"}</p>
                  <p><strong>Data:</strong> {auditDetail.createdAt ? new Date(auditDetail.createdAt).toLocaleString("pt-BR") : "-"}</p>
                  <p><strong>Modulo:</strong> {auditDetail.module || "-"}</p>
                  <p><strong>Acao:</strong> {auditDetail.action || "-"}</p>
                  <p><strong>Status:</strong> {auditDetail.status || "-"}</p>
                  <p><strong>Canal:</strong> {auditDetail.sourceChannel || "-"}</p>
                  <p><strong>Actor:</strong> {auditDetail.actorUserId || "-"} ({auditDetail.actorRole || "-"})</p>
                  <p><strong>Request ID:</strong> {auditDetail.requestId || "-"}</p>
                </div>
                <Separator />
                <p><strong>Error:</strong> {auditDetail.errorCode || "-"} {auditDetail.errorMessage ? `- ${auditDetail.errorMessage}` : ""}</p>
                <p><strong>IP:</strong> {auditDetail.ipAddress || "-"}</p>
                <p><strong>User-Agent:</strong> {auditDetail.userAgent || "-"}</p>
                <p><strong>Hash:</strong> {auditDetail.eventHash || "-"}</p>
                <p><strong>Hash anterior:</strong> {auditDetail.prevEventHash || "-"}</p>
                <p><strong>Campos alterados:</strong> {auditDetail.changedFieldsJson || "-"}</p>
                <div>
                  <p className="font-medium mb-1">Before</p>
                  <pre className="rounded border p-2 text-xs whitespace-pre-wrap">{auditDetail.beforeJson || "{}"}</pre>
                </div>
                <div>
                  <p className="font-medium mb-1">After</p>
                  <pre className="rounded border p-2 text-xs whitespace-pre-wrap">{auditDetail.afterJson || "{}"}</pre>
                </div>
                <div>
                  <p className="font-medium mb-1">Metadata</p>
                  <pre className="rounded border p-2 text-xs whitespace-pre-wrap">{auditDetail.metadataJson || "{}"}</pre>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle>Sessoes</CardTitle>
            <CardDescription>
              Revoga refresh tokens para encerrar sessoes de um tenant inteiro ou de um usuario especifico.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              O access token atual expira naturalmente; a revogacao bloqueia renovacao e efetiva logout.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={includeRevokedSessions ? "outline" : "default"}
                onClick={() => setIncludeRevokedSessions(false)}
              >
                Ativas
              </Button>
              <Button
                variant={includeRevokedSessions ? "default" : "outline"}
                onClick={() => setIncludeRevokedSessions(true)}
              >
                Todas
              </Button>
              <Button
                variant="outline"
                onClick={() => loadSessions(selectedTenantId)}
                disabled={isLoadingSessions}
              >
                Atualizar lista
              </Button>
            </div>
            <Input
              placeholder="User ID (opcional) para revogar apenas esse usuario"
              value={sessionUserId}
              onChange={(event) => setSessionUserId(event.target.value)}
            />
            <Button onClick={revokeSessions} disabled={isRevokingSessions}>
              {isRevokingSessions ? "Revogando..." : "Revogar sessoes"}
            </Button>

            <div className="rounded-md border">
              <div className="max-h-[260px] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left">Usuario</th>
                      <th className="px-3 py-2 text-left">Role</th>
                      <th className="px-3 py-2 text-left">Criado</th>
                      <th className="px-3 py-2 text-left">Expira</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Acao</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionItems.map((session) => (
                      <tr key={session.refreshTokenId} className="border-t">
                        <td className="px-3 py-2">
                          <div className="flex flex-col">
                            <span>{session.userName || session.userEmail || session.userId || "-"}</span>
                            <span className="text-xs text-muted-foreground">{session.userEmail || session.userId}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2">{session.userRole || "-"}</td>
                        <td className="px-3 py-2">
                          {session.createdAt ? new Date(session.createdAt).toLocaleString("pt-BR") : "-"}
                        </td>
                        <td className="px-3 py-2">
                          {session.expiresAt ? new Date(session.expiresAt).toLocaleString("pt-BR") : "-"}
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant={session.active ? "default" : "secondary"}>
                            {session.active ? "ATIVA" : "INATIVA"}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!session.active || isRevokingSessions}
                            onClick={() => revokeSingleSession(session.refreshTokenId)}
                          >
                            Revogar
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {!isLoadingSessions && sessionItems.length === 0 ? (
                      <tr>
                        <td className="px-3 py-4 text-muted-foreground" colSpan={6}>
                          Nenhuma sessao encontrada.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Menus e rotas por perfil</CardTitle>
            <CardDescription>Defina quais rotas ficam visiveis para OWNER e PROFESSIONAL.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Perfil</Label>
                <div className="flex gap-2">
                  {ROLES.map((option) => (
                    <Button
                      key={option}
                      type="button"
                      variant={role === option ? "default" : "outline"}
                      onClick={() => setRole(option)}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Escopo</Label>
                <Select value={menuScope} onValueChange={(value) => setMenuScope(value as MenuConfigScope)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GLOBAL">Global (todas as empresas)</SelectItem>
                    <SelectItem value="TENANT">Por tenant (empresa especifica)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Motivo da alteracao</Label>
                <Input value={reason} onChange={(event) => setReason(event.target.value)} />
              </div>
            </div>

            {menuScope === "TENANT" ? (
              <p className="text-xs text-muted-foreground">
                Aplicando no tenant selecionado: {selectedTenantId || "nenhum"}.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Aplicando globalmente por role para todos os tenants.
              </p>
            )}

            <div className="space-y-2">
              <Label>Buscar rota</Label>
              <Input
                placeholder="Ex.: /configuracoes/fiscal/nfse"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="rounded-md border">
              <div className="max-h-[420px] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left">Rota</th>
                      <th className="px-3 py-2 text-left">Habilitada</th>
                      <th className="px-3 py-2 text-left">Origem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoutes.map((item) => (
                      <tr key={item.route} className="border-t">
                        <td className="px-3 py-2 font-mono text-xs">{item.route}</td>
                        <td className="px-3 py-2">
                          <Checkbox
                            checked={item.enabled}
                            onCheckedChange={(checked) => toggleRoute(item.route, Boolean(checked))}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant={item.overridden ? "default" : "secondary"}>
                            {item.overridden ? "Override" : "Padrao"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {!isLoadingRoutes && filteredRoutes.length === 0 ? (
                      <tr>
                        <td className="px-3 py-4 text-muted-foreground" colSpan={3}>
                          Nenhuma rota encontrada.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>

            <Button
              onClick={saveRoutes}
              disabled={isLoadingRoutes || isSavingRoutes || (menuScope === "TENANT" && !selectedTenantId)}
            >
              {isSavingRoutes ? "Salvando..." : "Salvar permissoes"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Controle de licenca e pagamentos</CardTitle>
            <CardDescription>Ferramentas administrativas para testes de fluxo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={forceExpired} disabled={isChangingLicense || !selectedTenantId}>
                Forcar plano vencido
              </Button>
              <Button onClick={releaseLicense} disabled={isChangingLicense || !selectedTenantId}>
                Liberar licenca (30 dias)
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="font-medium">Pagamentos pendentes</h3>
              {isLoadingPayments ? (
                <p className="text-sm text-muted-foreground">Carregando pagamentos...</p>
              ) : pendingPayments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum pagamento pendente.</p>
              ) : (
                <div className="space-y-2">
                  {pendingPayments.map((payment) => (
                    <div
                      key={payment.id || payment.asaasPaymentId}
                      className="rounded-md border p-3 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {payment.asaasPaymentId} - {payment.billingType}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Valor: R$ {(Number(payment.amountCents || 0) / 100).toFixed(2)} | Vencimento:{" "}
                          {payment.dueDate || "-"}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => markPaymentReceived(payment.asaasPaymentId)}
                        disabled={isChangingLicense}
                      >
                        Liberar pagamento
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Credenciais do administrador</CardTitle>
            <CardDescription>
              Altere o usuario (email) e a senha da conta administrativa do sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={adminName} onChange={(event) => setAdminName(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Usuario (email)</Label>
                <Input value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} />
              </div>
            </div>
            <Button variant="outline" onClick={saveAdminProfile} disabled={isSavingCredentials}>
              Salvar usuario
            </Button>

            <Separator />

            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Senha atual</Label>
                <Input
                  type="password"
                  value={adminCurrentPassword}
                  onChange={(event) => setAdminCurrentPassword(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Nova senha</Label>
                <Input
                  type="password"
                  value={adminNewPassword}
                  onChange={(event) => setAdminNewPassword(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Confirmar senha</Label>
                <Input
                  type="password"
                  value={adminConfirmPassword}
                  onChange={(event) => setAdminConfirmPassword(event.target.value)}
                />
              </div>
            </div>
            <Button onClick={saveAdminPassword} disabled={isSavingCredentials}>
              Atualizar senha
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
