import { useEffect, useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { billingApi, configApi, systemAdminApi, usersApi } from "@/lib/api";
import { toast } from "sonner";
import type {
  AdminTenantItem,
  CommercialOverview,
  EmailTemplateDetailResponse,
  EmailTemplateSummaryItem,
  EmailTemplateUpsertRequest,
  GlobalAuditDetail,
  GlobalAuditItem,
  GlobalSuggestionItem,
  MenuCatalogItem,
  MenuCatalogItemRequest,
  SessionItem,
  SystemAdminRole,
  SystemPlanItem,
  SystemPlanUpsertRequest,
} from "@/types/system-admin";
import type { BillingPaymentItem } from "@/types/billing";
import { useAuth } from "@/contexts/AuthContext";
import { Eye } from "lucide-react";

const ROLES: SystemAdminRole[] = ["ADMIN", "OWNER", "PROFESSIONAL"];
const AUDIT_MODULE_OPTIONS = ["", "AUTH", "RBAC", "FINANCE", "FISCAL", "SYSTEM"];
const AUDIT_STATUS_OPTIONS = ["", "SUCCESS", "ERROR", "DENIED"];
const AUDIT_CHANNEL_OPTIONS = ["", "API", "WEBHOOK", "SCHEDULER", "SYSTEM"];
const SUGGESTION_CATEGORY_OPTIONS = ["", "BUG", "MELHORIA", "FUNCIONALIDADE", "USABILIDADE", "OUTRO"];

type EmailTemplateFormState = {
  templateType: string;
  label: string;
  configured: boolean;
  active: boolean;
  fromEmail: string;
  fromName: string;
  replyTo: string;
  subjectTemplate: string;
  htmlTemplate: string;
  placeholders: string[];
  sampleValues: Record<string, string>;
};

type MenuCatalogFormState = {
  id?: string;
  route: string;
  label: string;
  parentId: string;
  displayOrder: string;
  iconKey: string;
  active: boolean;
  roleVisibilities: Record<SystemAdminRole, boolean>;
};

type PlanFormState = {
  id?: string;
  name: string;
  description: string;
  currency: string;
  priceCents: string;
  validityMonths: string;
  validityDays: string;
  highlight: string;
  featuresJson: string;
  active: boolean;
  trial: boolean;
  priority: string;
  maxProfessionals: string;
};

const createEmptyMenuCatalogForm = (): MenuCatalogFormState => ({
  route: "",
  label: "",
  parentId: "",
  displayOrder: "0",
  iconKey: "",
  active: true,
  roleVisibilities: {
    ADMIN: true,
    OWNER: false,
    PROFESSIONAL: false,
  },
});

const createEmptyPlanForm = (): PlanFormState => ({
  name: "",
  description: "",
  currency: "BRL",
  priceCents: "0",
  validityMonths: "1",
  validityDays: "",
  highlight: "",
  featuresJson: "[]",
  active: true,
  trial: false,
  priority: "0",
  maxProfessionals: "",
});

const createEmptyEmailTemplateForm = (): EmailTemplateFormState => ({
  templateType: "PASSWORD_RESET",
  label: "Redefinicao de senha",
  configured: false,
  active: true,
  fromEmail: "",
  fromName: "",
  replyTo: "",
  subjectTemplate: "",
  htmlTemplate: "",
  placeholders: [],
  sampleValues: {},
});

export default function SystemAdminPage() {
  const { user } = useAuth();
  const [menuCatalogItems, setMenuCatalogItems] = useState<MenuCatalogItem[]>([]);
  const [isLoadingMenuCatalog, setIsLoadingMenuCatalog] = useState(false);
  const [isMenuCatalogDialogOpen, setIsMenuCatalogDialogOpen] = useState(false);
  const [isSavingMenuCatalog, setIsSavingMenuCatalog] = useState(false);
  const [menuCatalogForm, setMenuCatalogForm] = useState<MenuCatalogFormState>(createEmptyMenuCatalogForm);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplateSummaryItem[]>([]);
  const [selectedEmailTemplateType, setSelectedEmailTemplateType] = useState("PASSWORD_RESET");
  const [emailTemplateForm, setEmailTemplateForm] = useState<EmailTemplateFormState>(createEmptyEmailTemplateForm);
  const [isLoadingEmailTemplates, setIsLoadingEmailTemplates] = useState(false);
  const [isSavingEmailTemplate, setIsSavingEmailTemplate] = useState(false);

  const [payments, setPayments] = useState<BillingPaymentItem[]>([]);
  const [plans, setPlans] = useState<SystemPlanItem[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [planForm, setPlanForm] = useState<PlanFormState>(createEmptyPlanForm);
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
  const [globalSuggestions, setGlobalSuggestions] = useState<GlobalSuggestionItem[]>([]);
  const [isSuggestionDetailOpen, setIsSuggestionDetailOpen] = useState(false);
  const [isLoadingSuggestionDetail, setIsLoadingSuggestionDetail] = useState(false);
  const [isSavingSuggestionDetail, setIsSavingSuggestionDetail] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<GlobalSuggestionItem | null>(null);
  const [suggestionAdminResponse, setSuggestionAdminResponse] = useState("");
  const [suggestionFilters, setSuggestionFilters] = useState({
    tenantId: "",
    status: "",
    category: "",
    text: "",
    limit: 50,
  });
  const [isLoadingGlobalSuggestions, setIsLoadingGlobalSuggestions] = useState(false);
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

  const availableParentMenuItems = useMemo(
    () => menuCatalogItems.filter((item) => item.id !== menuCatalogForm.id),
    [menuCatalogItems, menuCatalogForm.id]
  );

  const pendingPayments = useMemo(
    () => payments.filter((item) => String(item.status || "").toUpperCase() === "PENDING"),
    [payments]
  );

  const applyEmailTemplatePreview = (template: string, values: Record<string, string>) => {
    let rendered = template || "";
    Object.entries(values || {}).forEach(([key, value]) => {
      rendered = rendered.replaceAll(`{{${key}}}`, value ?? "");
    });
    return rendered;
  };

  const emailTemplatePreviewSubject = useMemo(
    () => applyEmailTemplatePreview(emailTemplateForm.subjectTemplate, emailTemplateForm.sampleValues),
    [emailTemplateForm.subjectTemplate, emailTemplateForm.sampleValues]
  );

  const emailTemplatePreviewHtml = useMemo(
    () => applyEmailTemplatePreview(emailTemplateForm.htmlTemplate, emailTemplateForm.sampleValues),
    [emailTemplateForm.htmlTemplate, emailTemplateForm.sampleValues]
  );

  const buildEmailTemplatePayload = (): EmailTemplateUpsertRequest => ({
    active: emailTemplateForm.active,
    fromEmail: emailTemplateForm.fromEmail.trim() || undefined,
    fromName: emailTemplateForm.fromName.trim() || undefined,
    replyTo: emailTemplateForm.replyTo.trim() || undefined,
    subjectTemplate: emailTemplateForm.subjectTemplate,
    htmlTemplate: emailTemplateForm.htmlTemplate,
  });

  const loadMenuCatalog = async () => {
    setIsLoadingMenuCatalog(true);
    try {
      const response = await configApi.getMenuCatalog();
      setMenuCatalogItems(response.items || []);
    } catch {
      toast.error("Nao foi possivel carregar o catalogo de menus.");
      setMenuCatalogItems([]);
    } finally {
      setIsLoadingMenuCatalog(false);
    }
  };

  const openCreateMenuCatalogDialog = () => {
    setMenuCatalogForm(createEmptyMenuCatalogForm());
    setIsMenuCatalogDialogOpen(true);
  };

  const openEditMenuCatalogDialog = (item: MenuCatalogItem) => {
    const roleVisibilities = ROLES.reduce(
      (acc, roleOption) => {
        acc[roleOption] = item.roleVisibilities.some(
          (visibility) => visibility.role === roleOption && visibility.enabled
        );
        return acc;
      },
      {} as Record<SystemAdminRole, boolean>
    );
    setMenuCatalogForm({
      id: item.id,
      route: item.route,
      label: item.label,
      parentId: item.parentId || "",
      displayOrder: String(item.displayOrder ?? 0),
      iconKey: item.iconKey || "",
      active: item.active,
      roleVisibilities,
    });
    setIsMenuCatalogDialogOpen(true);
  };

  const setMenuCatalogRoleVisibility = (roleOption: SystemAdminRole, enabled: boolean) => {
    setMenuCatalogForm((prev) => ({
      ...prev,
      roleVisibilities: {
        ...prev.roleVisibilities,
        [roleOption]: enabled,
      },
    }));
  };

  const buildMenuCatalogPayload = (): MenuCatalogItemRequest => ({
    id: menuCatalogForm.id,
    route: menuCatalogForm.route.trim(),
    label: menuCatalogForm.label.trim(),
    parentId: menuCatalogForm.parentId || undefined,
    displayOrder: Number(menuCatalogForm.displayOrder || 0),
    iconKey: menuCatalogForm.iconKey.trim() || undefined,
    active: menuCatalogForm.active,
    roleVisibilities: ROLES.map((roleOption) => ({
      role: roleOption,
      enabled: Boolean(menuCatalogForm.roleVisibilities[roleOption]),
    })),
  });

  const saveMenuCatalogItem = async () => {
    if (!menuCatalogForm.route.trim() || !menuCatalogForm.label.trim()) {
      toast.error("Route e titulo sao obrigatorios.");
      return;
    }
    setIsSavingMenuCatalog(true);
    try {
      const payload = buildMenuCatalogPayload();
      if (menuCatalogForm.id) {
        await configApi.updateMenuCatalogItem(menuCatalogForm.id, payload);
      } else {
        await configApi.createMenuCatalogItem(payload);
      }
      toast.success(menuCatalogForm.id ? "Menu atualizado." : "Menu criado.");
      setIsMenuCatalogDialogOpen(false);
      setMenuCatalogForm(createEmptyMenuCatalogForm());
      await loadMenuCatalog();
    } catch {
      toast.error("Falha ao salvar catalogo de menus.");
    } finally {
      setIsSavingMenuCatalog(false);
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

  const loadPlans = async () => {
    setIsLoadingPlans(true);
    try {
      const response = await systemAdminApi.listPlans();
      setPlans(response.items || []);
    } catch {
      toast.error("Nao foi possivel carregar planos.");
      setPlans([]);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const openCreatePlanDialog = () => {
    setPlanForm(createEmptyPlanForm());
    setIsPlanDialogOpen(true);
  };

  const openEditPlanDialog = (plan: SystemPlanItem) => {
    setPlanForm({
      id: plan.id,
      name: plan.name || "",
      description: plan.description || "",
      currency: plan.currency || "BRL",
      priceCents: String(plan.priceCents ?? 0),
      validityMonths: String(plan.validityMonths ?? 1),
      validityDays: plan.validityDays != null ? String(plan.validityDays) : "",
      highlight: plan.highlight || "",
      featuresJson: plan.featuresJson || "[]",
      active: plan.active,
      trial: plan.trial,
      priority: String(plan.priority ?? 0),
      maxProfessionals: plan.maxProfessionals != null ? String(plan.maxProfessionals) : "",
    });
    setIsPlanDialogOpen(true);
  };

  const buildPlanPayload = (): SystemPlanUpsertRequest => ({
    name: planForm.name.trim(),
    description: planForm.description.trim() || undefined,
    currency: planForm.currency.trim().toUpperCase() || "BRL",
    priceCents: Number(planForm.priceCents || 0),
    validityMonths: Number(planForm.validityMonths || 1),
    validityDays: planForm.validityDays.trim() ? Number(planForm.validityDays) : undefined,
    highlight: planForm.highlight.trim() || undefined,
    featuresJson: planForm.featuresJson.trim() || "[]",
    active: planForm.active,
    trial: planForm.trial,
    priority: Number(planForm.priority || 0),
    maxProfessionals: planForm.maxProfessionals.trim() ? Number(planForm.maxProfessionals) : undefined,
  });

  const savePlan = async () => {
    if (!planForm.name.trim()) {
      toast.error("Nome do plano obrigatorio.");
      return;
    }
    setIsSavingPlan(true);
    try {
      const payload = buildPlanPayload();
      if (planForm.id) {
        await systemAdminApi.updatePlan(planForm.id, payload);
      } else {
        await systemAdminApi.createPlan(payload);
      }
      toast.success(planForm.id ? "Plano atualizado." : "Plano criado.");
      setIsPlanDialogOpen(false);
      setPlanForm(createEmptyPlanForm());
      await loadPlans();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao salvar plano.";
      toast.error(message);
    } finally {
      setIsSavingPlan(false);
    }
  };

  const togglePlanActive = async (plan: SystemPlanItem) => {
    try {
      await systemAdminApi.updatePlanActive(plan.id, !plan.active);
      toast.success(!plan.active ? "Plano ativado." : "Plano desativado.");
      await loadPlans();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao atualizar status do plano.";
      toast.error(message);
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

  const applyEmailTemplateDetail = (detail: EmailTemplateDetailResponse) => {
    setEmailTemplateForm({
      templateType: detail.templateType,
      label: detail.label,
      configured: detail.configured,
      active: detail.active,
      fromEmail: detail.fromEmail || "",
      fromName: detail.fromName || "",
      replyTo: detail.replyTo || "",
      subjectTemplate: detail.subjectTemplate || "",
      htmlTemplate: detail.htmlTemplate || "",
      placeholders: detail.placeholders || [],
      sampleValues: detail.sampleValues || {},
    });
  };

  const loadEmailTemplates = async (templateType?: string) => {
    setIsLoadingEmailTemplates(true);
    try {
      const response = await systemAdminApi.listEmailTemplates();
      const items = response.items || [];
      setEmailTemplates(items);
      const effectiveType = templateType || selectedEmailTemplateType || items[0]?.templateType || "PASSWORD_RESET";
      const detail = await systemAdminApi.getEmailTemplate(effectiveType);
      setSelectedEmailTemplateType(detail.templateType);
      applyEmailTemplateDetail(detail);
    } catch {
      toast.error("Nao foi possivel carregar templates de email.");
      setEmailTemplates([]);
      setEmailTemplateForm(createEmptyEmailTemplateForm());
    } finally {
      setIsLoadingEmailTemplates(false);
    }
  };

  const selectEmailTemplate = async (templateType: string) => {
    setSelectedEmailTemplateType(templateType);
    setIsLoadingEmailTemplates(true);
    try {
      const detail = await systemAdminApi.getEmailTemplate(templateType);
      applyEmailTemplateDetail(detail);
    } catch {
      toast.error("Nao foi possivel carregar o template selecionado.");
    } finally {
      setIsLoadingEmailTemplates(false);
    }
  };

  const saveEmailTemplate = async () => {
    if (!emailTemplateForm.subjectTemplate.trim() || !emailTemplateForm.htmlTemplate.trim()) {
      toast.error("Assunto e HTML sao obrigatorios.");
      return;
    }
    setIsSavingEmailTemplate(true);
    try {
      const saved = await systemAdminApi.updateEmailTemplate(selectedEmailTemplateType, buildEmailTemplatePayload());
      applyEmailTemplateDetail(saved);
      await loadEmailTemplates(saved.templateType);
      toast.success(emailTemplateForm.configured ? "Template atualizado com sucesso." : "Template criado com sucesso.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao salvar template.";
      toast.error(message);
    } finally {
      setIsSavingEmailTemplate(false);
    }
  };

  const createEmailTemplate = async () => {
    if (!emailTemplateForm.subjectTemplate.trim() || !emailTemplateForm.htmlTemplate.trim()) {
      toast.error("Assunto e HTML sao obrigatorios.");
      return;
    }
    setIsSavingEmailTemplate(true);
    try {
      const created = await systemAdminApi.updateEmailTemplate(selectedEmailTemplateType, {
        ...buildEmailTemplatePayload(),
        active: true,
      });
      applyEmailTemplateDetail(created);
      await loadEmailTemplates(created.templateType);
      toast.success("Template criado com sucesso.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao criar template.";
      toast.error(message);
    } finally {
      setIsSavingEmailTemplate(false);
    }
  };

  const toggleEmailTemplateStatus = async (active: boolean) => {
    setIsSavingEmailTemplate(true);
    try {
      const updated = await systemAdminApi.updateEmailTemplateStatus(selectedEmailTemplateType, { active });
      applyEmailTemplateDetail(updated);
      await loadEmailTemplates(updated.templateType);
      toast.success(active ? "Template ativado." : "Template desativado.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao atualizar status do template.";
      toast.error(message);
    } finally {
      setIsSavingEmailTemplate(false);
    }
  };

  const restoreDefaultEmailTemplate = async () => {
    setIsSavingEmailTemplate(true);
    try {
      const restored = await systemAdminApi.restoreDefaultEmailTemplate(selectedEmailTemplateType);
      applyEmailTemplateDetail(restored);
      await loadEmailTemplates(restored.templateType);
      toast.success("Template restaurado para o padrao.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao restaurar template.";
      toast.error(message);
    } finally {
      setIsSavingEmailTemplate(false);
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

  const loadGlobalSuggestions = async (filters?: Partial<typeof suggestionFilters>) => {
    const payload = { ...suggestionFilters, ...(filters || {}) };
    setIsLoadingGlobalSuggestions(true);
    try {
      const response = await systemAdminApi.getGlobalSuggestions({
        tenantId: payload.tenantId || undefined,
        status: payload.status || undefined,
        category: payload.category || undefined,
        text: payload.text?.trim() || undefined,
        limit: payload.limit,
      });
      setGlobalSuggestions(response.items || []);
    } catch {
      toast.error("Nao foi possivel carregar sugestoes.");
      setGlobalSuggestions([]);
    } finally {
      setIsLoadingGlobalSuggestions(false);
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

  const openSuggestionDetail = async (id: string) => {
    setIsSuggestionDetailOpen(true);
    setIsLoadingSuggestionDetail(true);
    try {
      const detail = await systemAdminApi.getGlobalSuggestionDetail(id);
      setSelectedSuggestion(detail);
      setSuggestionAdminResponse(detail.adminResponse || "");
    } catch {
      toast.error("Nao foi possivel carregar detalhe da sugestao.");
      setSelectedSuggestion(null);
      setSuggestionAdminResponse("");
    } finally {
      setIsLoadingSuggestionDetail(false);
    }
  };

  const saveSuggestionResponse = async (closeSuggestion: boolean) => {
    if (!selectedSuggestion?.id) return;
    if (!suggestionAdminResponse.trim()) {
      toast.error("Informe a resposta administrativa.");
      return;
    }
    setIsSavingSuggestionDetail(true);
    try {
      const updated = await systemAdminApi.updateGlobalSuggestion(selectedSuggestion.id, {
        adminResponse: suggestionAdminResponse.trim(),
        status: closeSuggestion ? "CLOSED" : selectedSuggestion.status || "OPEN",
      });
      setSelectedSuggestion(updated);
      setSuggestionAdminResponse(updated.adminResponse || "");
      toast.success(closeSuggestion ? "Sugestao respondida e fechada." : "Resposta salva com sucesso.");
      await loadGlobalSuggestions({});
    } catch {
      toast.error("Falha ao salvar resposta da sugestao.");
    } finally {
      setIsSavingSuggestionDetail(false);
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
    loadActiveTenants();
    loadMenuCatalog();
    loadEmailTemplates();
    loadPlans();
    loadCommercialOverview();
    loadGlobalAudits({});
    loadGlobalSuggestions({});
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

          </TabsContent>

          <TabsContent value="monitoramento" className="space-y-6">

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

        <Card>
          <CardHeader>
            <CardTitle>Sugestoes dos usuarios</CardTitle>
            <CardDescription>
              Feedbacks enviados pelos usuarios para evolucao do produto.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 md:grid-cols-5">
              <Select
                value={suggestionFilters.tenantId || "ALL"}
                onValueChange={(value) =>
                  setSuggestionFilters((prev) => ({ ...prev, tenantId: value === "ALL" ? "" : value }))
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
              <Input
                placeholder="Status (ex.: OPEN)"
                value={suggestionFilters.status}
                onChange={(event) => setSuggestionFilters((prev) => ({ ...prev, status: event.target.value }))}
              />
              <Select
                value={suggestionFilters.category || "ALL"}
                onValueChange={(value) =>
                  setSuggestionFilters((prev) => ({ ...prev, category: value === "ALL" ? "" : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Categoria (todas)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Categoria: Todas</SelectItem>
                  {SUGGESTION_CATEGORY_OPTIONS.filter((item) => item).map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Buscar texto"
                value={suggestionFilters.text}
                onChange={(event) => setSuggestionFilters((prev) => ({ ...prev, text: event.target.value }))}
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => loadGlobalSuggestions({})} disabled={isLoadingGlobalSuggestions}>
                  Aplicar
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    const reset = { tenantId: "", status: "", category: "", text: "", limit: 50 };
                    setSuggestionFilters(reset);
                    loadGlobalSuggestions(reset);
                  }}
                  disabled={isLoadingGlobalSuggestions}
                >
                  Limpar
                </Button>
              </div>
            </div>

            <div className="rounded-md border">
              <div className="max-h-[320px] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left">Data</th>
                      <th className="px-3 py-2 text-left">Tenant</th>
                      <th className="px-3 py-2 text-left">Usuario</th>
                      <th className="px-3 py-2 text-left">Categoria</th>
                      <th className="px-3 py-2 text-left">Titulo</th>
                      <th className="px-3 py-2 text-left">Mensagem</th>
                      <th className="px-3 py-2 text-left">Origem</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Detalhe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {globalSuggestions.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="px-3 py-2 whitespace-nowrap">
                          {item.createdAt ? new Date(item.createdAt).toLocaleString("pt-BR") : "-"}
                        </td>
                        <td className="px-3 py-2">{item.tenantName || item.tenantId || "-"}</td>
                        <td className="px-3 py-2">
                          {item.userName || "-"} {item.userRole ? `(${item.userRole})` : ""}
                        </td>
                        <td className="px-3 py-2">{item.category || "-"}</td>
                        <td className="px-3 py-2">{item.title}</td>
                        <td className="px-3 py-2">{item.message}</td>
                        <td className="px-3 py-2">{item.sourcePage || "-"}</td>
                        <td className="px-3 py-2">{item.status || "-"}</td>
                        <td className="px-3 py-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => openSuggestionDetail(item.id)}
                            title="Detalhar sugestao"
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {!isLoadingGlobalSuggestions && globalSuggestions.length === 0 ? (
                      <tr>
                        <td className="px-3 py-4 text-muted-foreground" colSpan={9}>
                          Nenhuma sugestao encontrada.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

          </TabsContent>

          <TabsContent value="emails" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Templates de email</CardTitle>
                <CardDescription>
                  Edite assunto, remetente e HTML dos emails do sistema com preview em tempo real.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Tipos de template</h3>
                      <Button variant="outline" size="sm" onClick={() => loadEmailTemplates()} disabled={isLoadingEmailTemplates}>
                        Atualizar
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {emailTemplates.map((item) => (
                        <button
                          key={item.templateType}
                          type="button"
                          onClick={() => selectEmailTemplate(item.templateType)}
                          className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                            selectedEmailTemplateType === item.templateType
                              ? "border-primary bg-primary/5"
                              : "border-border hover:bg-muted/40"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium">{item.label}</p>
                              <p className="text-xs text-muted-foreground">{item.templateType}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge variant={item.configured ? "default" : "secondary"}>
                                {item.configured ? "Configurado" : "Padrao"}
                              </Badge>
                              <Badge variant={item.active ? "default" : "outline"}>
                                {item.active ? "Ativo" : "Inativo"}
                              </Badge>
                            </div>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {item.updatedAt ? `Atualizado em ${new Date(item.updatedAt).toLocaleString("pt-BR")}` : "Usando fallback padrao do sistema"}
                          </p>
                        </button>
                      ))}
                      {!isLoadingEmailTemplates && emailTemplates.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                          Nenhum template disponivel.
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-6 2xl:grid-cols-2">
                    <Card className="border-dashed">
                      <CardHeader>
                        <CardTitle className="text-base">{emailTemplateForm.label}</CardTitle>
                        <CardDescription>
                          O template salvo aqui passa a ser usado no envio real do sistema.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={emailTemplateForm.configured ? "default" : "secondary"}>
                            {emailTemplateForm.configured ? "Template criado" : "Template ainda nao criado"}
                          </Badge>
                          <Badge variant={emailTemplateForm.active ? "default" : "outline"}>
                            {emailTemplateForm.active ? "Ativo no envio" : "Inativo no envio"}
                          </Badge>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>From email</Label>
                            <Input
                              value={emailTemplateForm.fromEmail}
                              onChange={(event) =>
                                setEmailTemplateForm((prev) => ({ ...prev, fromEmail: event.target.value }))
                              }
                              placeholder="no-reply@azzoholding.com.br"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>From name</Label>
                            <Input
                              value={emailTemplateForm.fromName}
                              onChange={(event) =>
                                setEmailTemplateForm((prev) => ({ ...prev, fromName: event.target.value }))
                              }
                              placeholder="Azzo Agenda Pro"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Reply-to</Label>
                          <Input
                            value={emailTemplateForm.replyTo}
                            onChange={(event) =>
                              setEmailTemplateForm((prev) => ({ ...prev, replyTo: event.target.value }))
                            }
                            placeholder="support@azzoholding.com.br"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Assunto</Label>
                          <Input
                            value={emailTemplateForm.subjectTemplate}
                            onChange={(event) =>
                              setEmailTemplateForm((prev) => ({ ...prev, subjectTemplate: event.target.value }))
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>HTML</Label>
                          <Textarea
                            value={emailTemplateForm.htmlTemplate}
                            onChange={(event) =>
                              setEmailTemplateForm((prev) => ({ ...prev, htmlTemplate: event.target.value }))
                            }
                            rows={20}
                            className="font-mono text-xs"
                          />
                        </div>

                        <div className="rounded-lg border bg-muted/30 p-4">
                          <p className="text-sm font-medium">Placeholders disponiveis</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {emailTemplateForm.placeholders.map((placeholder) => (
                              <Badge key={placeholder} variant="secondary">
                                {placeholder}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-wrap justify-end gap-2">
                          <Button variant="outline" onClick={restoreDefaultEmailTemplate} disabled={isSavingEmailTemplate}>
                            Restaurar padrao
                          </Button>
                          {emailTemplateForm.configured ? (
                            <Button
                              variant="outline"
                              onClick={() => toggleEmailTemplateStatus(!emailTemplateForm.active)}
                              disabled={isSavingEmailTemplate}
                            >
                              {emailTemplateForm.active ? "Desativar" : "Ativar"}
                            </Button>
                          ) : null}
                          {emailTemplateForm.configured ? (
                            <Button onClick={saveEmailTemplate} disabled={isSavingEmailTemplate}>
                              {isSavingEmailTemplate ? "Salvando..." : "Salvar alteracoes"}
                            </Button>
                          ) : (
                            <Button onClick={createEmailTemplate} disabled={isSavingEmailTemplate}>
                              {isSavingEmailTemplate ? "Criando..." : "Criar template a partir do padrao"}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Preview</CardTitle>
                        <CardDescription>
                          A visualizacao ao lado usa dados de exemplo e atualiza conforme voce edita o codigo.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-3">
                          <div className="rounded-lg border p-3">
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">From</p>
                            <p className="mt-2 text-sm font-medium">{emailTemplateForm.fromName || "Sem nome"}</p>
                            <p className="text-sm text-muted-foreground">{emailTemplateForm.fromEmail || "Fallback global"}</p>
                          </div>
                          <div className="rounded-lg border p-3">
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Reply-to</p>
                            <p className="mt-2 text-sm">{emailTemplateForm.replyTo || "Nao definido"}</p>
                          </div>
                          <div className="rounded-lg border p-3">
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Assunto renderizado</p>
                            <p className="mt-2 text-sm font-medium">{emailTemplatePreviewSubject || "-"}</p>
                          </div>
                        </div>

                        <div className="rounded-lg border bg-muted/20 p-4">
                          <p className="text-sm font-medium">Valores de exemplo</p>
                          <div className="mt-3 grid gap-2 md:grid-cols-2">
                            {Object.entries(emailTemplateForm.sampleValues || {}).map(([key, value]) => (
                              <div key={key} className="rounded-md border bg-background p-3">
                                <p className="text-xs text-muted-foreground">{`{{${key}}}`}</p>
                                <p className="mt-1 text-sm">{value}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="overflow-hidden rounded-xl border bg-white">
                          <iframe
                            title="Preview do template de email"
                            srcDoc={emailTemplatePreviewHtml}
                            sandbox=""
                            className="h-[720px] w-full bg-white"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        <Dialog open={isMenuCatalogDialogOpen} onOpenChange={setIsMenuCatalogDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{menuCatalogForm.id ? "Editar menu" : "Novo menu"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Rota</Label>
                  <Input
                    placeholder="/financeiro/comissoes"
                    value={menuCatalogForm.route}
                    onChange={(event) =>
                      setMenuCatalogForm((prev) => ({ ...prev, route: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Titulo</Label>
                  <Input
                    placeholder="Comissoes"
                    value={menuCatalogForm.label}
                    onChange={(event) =>
                      setMenuCatalogForm((prev) => ({ ...prev, label: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Menu pai</Label>
                  <Select
                    value={menuCatalogForm.parentId || "__none__"}
                    onValueChange={(value) =>
                      setMenuCatalogForm((prev) => ({
                        ...prev,
                        parentId: value === "__none__" ? "" : value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sem pai" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sem pai</SelectItem>
                      {availableParentMenuItems.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.label} [{item.route}]
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ordem</Label>
                  <Input
                    type="number"
                    value={menuCatalogForm.displayOrder}
                    onChange={(event) =>
                      setMenuCatalogForm((prev) => ({ ...prev, displayOrder: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Icone</Label>
                  <Input
                    placeholder="Wallet"
                    value={menuCatalogForm.iconKey}
                    onChange={(event) =>
                      setMenuCatalogForm((prev) => ({ ...prev, iconKey: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Roles visiveis</Label>
                <div className="flex flex-wrap gap-4 rounded-md border p-3">
                  {ROLES.map((roleOption) => (
                    <label key={roleOption} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={menuCatalogForm.roleVisibilities[roleOption]}
                        onCheckedChange={(checked) =>
                          setMenuCatalogRoleVisibility(roleOption, Boolean(checked))
                        }
                      />
                      {roleOption}
                    </label>
                  ))}
                  <label className="ml-auto flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={menuCatalogForm.active}
                      onCheckedChange={(checked) =>
                        setMenuCatalogForm((prev) => ({ ...prev, active: Boolean(checked) }))
                      }
                    />
                    Ativo
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsMenuCatalogDialogOpen(false)}
                  disabled={isSavingMenuCatalog}
                >
                  Cancelar
                </Button>
                <Button onClick={saveMenuCatalogItem} disabled={isSavingMenuCatalog}>
                  {isSavingMenuCatalog ? "Salvando..." : "Salvar menu"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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

        <Dialog open={isSuggestionDetailOpen} onOpenChange={setIsSuggestionDetailOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Detalhe da Sugestao</DialogTitle>
            </DialogHeader>
            {isLoadingSuggestionDetail ? (
              <p className="text-sm text-muted-foreground">Carregando detalhe...</p>
            ) : !selectedSuggestion ? (
              <p className="text-sm text-muted-foreground">Nenhuma sugestao selecionada.</p>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-2 md:grid-cols-2 text-sm">
                  <p><strong>Tenant:</strong> {selectedSuggestion.tenantName || selectedSuggestion.tenantId || "-"}</p>
                  <p><strong>Usuario:</strong> {selectedSuggestion.userName || "-"} {selectedSuggestion.userRole ? `(${selectedSuggestion.userRole})` : ""}</p>
                  <p><strong>Categoria:</strong> {selectedSuggestion.category || "-"}</p>
                  <p><strong>Status:</strong> {selectedSuggestion.status || "-"}</p>
                  <p><strong>Criado em:</strong> {selectedSuggestion.createdAt ? new Date(selectedSuggestion.createdAt).toLocaleString("pt-BR") : "-"}</p>
                  <p><strong>Origem:</strong> {selectedSuggestion.sourcePage || "-"}</p>
                </div>

                <div className="rounded-md border p-3 space-y-2">
                  <p className="text-sm font-semibold">{selectedSuggestion.title}</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedSuggestion.message}</p>
                </div>

                {selectedSuggestion.respondedAt ? (
                  <div className="rounded-md border p-3 text-sm space-y-1">
                    <p><strong>Ultima resposta:</strong></p>
                    <p className="whitespace-pre-wrap text-muted-foreground">{selectedSuggestion.adminResponse || "-"}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedSuggestion.respondedByUserName || selectedSuggestion.respondedByUserId || "ADMIN"} em{" "}
                      {new Date(selectedSuggestion.respondedAt).toLocaleString("pt-BR")}
                    </p>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label>Resposta administrativa</Label>
                  <Textarea
                    value={suggestionAdminResponse}
                    onChange={(event) => setSuggestionAdminResponse(event.target.value)}
                    placeholder="Escreva a resposta para o usuario..."
                    rows={5}
                    maxLength={5000}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => saveSuggestionResponse(false)}
                    disabled={isSavingSuggestionDetail}
                  >
                    {isSavingSuggestionDetail ? "Salvando..." : "Responder"}
                  </Button>
                  <Button
                    onClick={() => saveSuggestionResponse(true)}
                    disabled={isSavingSuggestionDetail}
                  >
                    {isSavingSuggestionDetail ? "Salvando..." : "Responder e fechar"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

          <TabsContent value="acesso" className="space-y-6">
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
          </TabsContent>

          <TabsContent value="menus" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Catalogo de menus</CardTitle>
                <CardDescription>
                  Cadastre rotas, hierarquia, ordem, icone e visibilidade padrao por role.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button onClick={openCreateMenuCatalogDialog}>Novo menu</Button>
                  <Button variant="outline" onClick={loadMenuCatalog} disabled={isLoadingMenuCatalog}>
                    Atualizar catalogo
                  </Button>
                </div>

                <div className="rounded-md border">
                  <div className="max-h-[420px] overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-3 py-2 text-left">Titulo</th>
                          <th className="px-3 py-2 text-left">Rota</th>
                          <th className="px-3 py-2 text-left">Pai</th>
                          <th className="px-3 py-2 text-left">Ordem</th>
                          <th className="px-3 py-2 text-left">Icone</th>
                          <th className="px-3 py-2 text-left">Roles</th>
                          <th className="px-3 py-2 text-left">Status</th>
                          <th className="px-3 py-2 text-left">Acao</th>
                        </tr>
                      </thead>
                      <tbody>
                        {menuCatalogItems.map((item) => (
                          <tr key={item.id} className="border-t">
                            <td className="px-3 py-2">
                              <div className="flex flex-col">
                                <span className="font-medium">{item.label}</span>
                                {item.childrenCount > 0 ? (
                                  <span className="text-xs text-muted-foreground">
                                    {item.childrenCount} filho(s)
                                  </span>
                                ) : null}
                              </div>
                            </td>
                            <td className="px-3 py-2 font-mono text-xs">{item.route}</td>
                            <td className="px-3 py-2">{item.parentLabel || "-"}</td>
                            <td className="px-3 py-2">{item.displayOrder}</td>
                            <td className="px-3 py-2">{item.iconKey || "-"}</td>
                            <td className="px-3 py-2">
                              <div className="flex flex-wrap gap-1">
                                {item.roleVisibilities
                                  .filter((visibility) => visibility.enabled)
                                  .map((visibility) => (
                                    <Badge key={`${item.id}-${visibility.role}`} variant="secondary">
                                      {visibility.role}
                                    </Badge>
                                  ))}
                                {!item.roleVisibilities.some((visibility) => visibility.enabled) ? (
                                  <span className="text-xs text-muted-foreground">Nenhuma role</span>
                                ) : null}
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <Badge variant={item.active ? "default" : "secondary"}>
                                {item.active ? "ATIVO" : "INATIVO"}
                              </Badge>
                            </td>
                            <td className="px-3 py-2">
                              <Button size="sm" variant="outline" onClick={() => openEditMenuCatalogDialog(item)}>
                                Editar
                              </Button>
                            </td>
                          </tr>
                        ))}
                        {!isLoadingMenuCatalog && menuCatalogItems.length === 0 ? (
                          <tr>
                            <td className="px-3 py-4 text-muted-foreground" colSpan={8}>
                              Nenhum menu cadastrado.
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financeiro" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciador de planos</CardTitle>
                <CardDescription>Crie, edite, ative e desative planos e o plano trial.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button onClick={openCreatePlanDialog}>Novo plano</Button>
                  <Button variant="outline" onClick={loadPlans} disabled={isLoadingPlans}>
                    Atualizar planos
                  </Button>
                </div>

                <div className="rounded-md border">
                  <div className="max-h-[320px] overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-3 py-2 text-left">Plano</th>
                          <th className="px-3 py-2 text-left">Tipo</th>
                          <th className="px-3 py-2 text-left">Preco</th>
                          <th className="px-3 py-2 text-left">Validade</th>
                          <th className="px-3 py-2 text-left">Profissionais</th>
                          <th className="px-3 py-2 text-left">Prioridade</th>
                          <th className="px-3 py-2 text-left">Status</th>
                          <th className="px-3 py-2 text-left">Acao</th>
                        </tr>
                      </thead>
                      <tbody>
                        {plans.map((plan) => (
                          <tr key={plan.id} className="border-t">
                            <td className="px-3 py-2">
                              <div className="flex flex-col">
                                <span className="font-medium">{plan.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {plan.highlight || plan.description || "-"}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <Badge variant={plan.trial ? "default" : "secondary"}>
                                {plan.trial ? "TRIAL" : "PAGO"}
                              </Badge>
                            </td>
                            <td className="px-3 py-2">R$ {(Number(plan.priceCents || 0) / 100).toFixed(2)}</td>
                            <td className="px-3 py-2">{plan.validityDays || plan.validityMonths * 30} dias</td>
                            <td className="px-3 py-2">{plan.maxProfessionals ?? "-"}</td>
                            <td className="px-3 py-2">{plan.priority}</td>
                            <td className="px-3 py-2">
                              <Badge variant={plan.active ? "default" : "secondary"}>
                                {plan.active ? "ATIVO" : "INATIVO"}
                              </Badge>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex flex-wrap gap-2">
                                <Button size="sm" variant="outline" onClick={() => openEditPlanDialog(plan)}>
                                  Editar
                                </Button>
                                <Button size="sm" variant={plan.active ? "secondary" : "default"} onClick={() => togglePlanActive(plan)}>
                                  {plan.active ? "Desativar" : "Ativar"}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {!isLoadingPlans && plans.length === 0 ? (
                          <tr>
                            <td className="px-3 py-4 text-muted-foreground" colSpan={8}>
                              Nenhum plano cadastrado.
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
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{planForm.id ? "Editar plano" : "Novo plano"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Nome</Label>
              <Input value={planForm.name} onChange={(event) => setPlanForm((prev) => ({ ...prev, name: event.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Descricao</Label>
              <Textarea value={planForm.description} onChange={(event) => setPlanForm((prev) => ({ ...prev, description: event.target.value }))} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Moeda</Label>
              <Input value={planForm.currency} onChange={(event) => setPlanForm((prev) => ({ ...prev, currency: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Preco em centavos</Label>
              <Input type="number" value={planForm.priceCents} onChange={(event) => setPlanForm((prev) => ({ ...prev, priceCents: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Validade em meses</Label>
              <Input type="number" value={planForm.validityMonths} onChange={(event) => setPlanForm((prev) => ({ ...prev, validityMonths: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Validade em dias</Label>
              <Input type="number" value={planForm.validityDays} onChange={(event) => setPlanForm((prev) => ({ ...prev, validityDays: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Input type="number" value={planForm.priority} onChange={(event) => setPlanForm((prev) => ({ ...prev, priority: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Maximo de profissionais</Label>
              <Input type="number" value={planForm.maxProfessionals} onChange={(event) => setPlanForm((prev) => ({ ...prev, maxProfessionals: event.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Destaque</Label>
              <Input value={planForm.highlight} onChange={(event) => setPlanForm((prev) => ({ ...prev, highlight: event.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Features JSON</Label>
              <Textarea value={planForm.featuresJson} onChange={(event) => setPlanForm((prev) => ({ ...prev, featuresJson: event.target.value }))} rows={4} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={planForm.active} onCheckedChange={(checked) => setPlanForm((prev) => ({ ...prev, active: Boolean(checked) }))} />
              Ativo
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={planForm.trial} onCheckedChange={(checked) => setPlanForm((prev) => ({ ...prev, trial: Boolean(checked) }))} />
              Trial
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsPlanDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={savePlan} disabled={isSavingPlan}>
              {isSavingPlan ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
