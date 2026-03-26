import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { billingApi, systemAdminApi } from '@/lib/api';
import { toast } from 'sonner';
import type { SystemPlanItem, SystemPlanUpsertRequest } from '@/types/system-admin';
import type { BillingPaymentItem } from '@/types/billing';

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

const createEmptyPlanForm = (): PlanFormState => ({
  name: '',
  description: '',
  currency: 'BRL',
  priceCents: '0',
  validityMonths: '1',
  validityDays: '',
  highlight: '',
  featuresJson: '[]',
  active: true,
  trial: false,
  priority: '0',
  maxProfessionals: '',
});

interface AdminFinanceiroTabProps {
  selectedTenantId: string;
}

export function AdminFinanceiroTab({ selectedTenantId }: AdminFinanceiroTabProps) {
  const [plans, setPlans] = useState<SystemPlanItem[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [planForm, setPlanForm] = useState<PlanFormState>(createEmptyPlanForm);

  const [payments, setPayments] = useState<BillingPaymentItem[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [isChangingLicense, setIsChangingLicense] = useState(false);

  const pendingPayments = useMemo(
    () => payments.filter((item) => String(item.status || '').toUpperCase() === 'PENDING'),
    [payments]
  );

  const loadPlans = async () => {
    setIsLoadingPlans(true);
    try {
      const response = await systemAdminApi.listPlans();
      setPlans(response.items || []);
    } catch {
      toast.error('Nao foi possivel carregar planos.');
      setPlans([]);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const loadPayments = async (tenantId: string) => {
    if (!tenantId) { setPayments([]); return; }
    setIsLoadingPayments(true);
    try {
      const response = await billingApi.adminGetTenantPayments(tenantId);
      setPayments(response.items || []);
    } catch {
      toast.error('Nao foi possivel carregar pagamentos.');
      setPayments([]);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    if (!selectedTenantId) return;
    loadPayments(selectedTenantId);
  }, [selectedTenantId]);

  const openCreate = () => {
    setPlanForm(createEmptyPlanForm());
    setIsDialogOpen(true);
  };

  const openEdit = (plan: SystemPlanItem) => {
    setPlanForm({
      id: plan.id,
      name: plan.name || '',
      description: plan.description || '',
      currency: plan.currency || 'BRL',
      priceCents: String(plan.priceCents ?? 0),
      validityMonths: String(plan.validityMonths ?? 1),
      validityDays: plan.validityDays != null ? String(plan.validityDays) : '',
      highlight: plan.highlight || '',
      featuresJson: plan.featuresJson || '[]',
      active: plan.active,
      trial: plan.trial,
      priority: String(plan.priority ?? 0),
      maxProfessionals: plan.maxProfessionals != null ? String(plan.maxProfessionals) : '',
    });
    setIsDialogOpen(true);
  };

  const buildPayload = (): SystemPlanUpsertRequest => ({
    name: planForm.name.trim(),
    description: planForm.description.trim() || undefined,
    currency: planForm.currency.trim().toUpperCase() || 'BRL',
    priceCents: Number(planForm.priceCents || 0),
    validityMonths: Number(planForm.validityMonths || 1),
    validityDays: planForm.validityDays.trim() ? Number(planForm.validityDays) : undefined,
    highlight: planForm.highlight.trim() || undefined,
    featuresJson: planForm.featuresJson.trim() || '[]',
    active: planForm.active,
    trial: planForm.trial,
    priority: Number(planForm.priority || 0),
    maxProfessionals: planForm.maxProfessionals.trim() ? Number(planForm.maxProfessionals) : undefined,
  });

  const savePlan = async () => {
    if (!planForm.name.trim()) {
      toast.error('Nome do plano obrigatorio.');
      return;
    }
    setIsSavingPlan(true);
    try {
      const payload = buildPayload();
      if (planForm.id) {
        await systemAdminApi.updatePlan(planForm.id, payload);
      } else {
        await systemAdminApi.createPlan(payload);
      }
      toast.success(planForm.id ? 'Plano atualizado.' : 'Plano criado.');
      setIsDialogOpen(false);
      setPlanForm(createEmptyPlanForm());
      await loadPlans();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao salvar plano.');
    } finally {
      setIsSavingPlan(false);
    }
  };

  const togglePlanActive = async (plan: SystemPlanItem) => {
    try {
      await systemAdminApi.updatePlanActive(plan.id, !plan.active);
      toast.success(!plan.active ? 'Plano ativado.' : 'Plano desativado.');
      await loadPlans();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao atualizar status do plano.');
    }
  };

  const forceExpired = async () => {
    if (!selectedTenantId) { toast.error('Selecione um tenant.'); return; }
    setIsChangingLicense(true);
    try {
      const result = await billingApi.adminExpireLicense(selectedTenantId, 5);
      toast.success(result.message || 'Plano marcado como vencido.');
    } catch {
      toast.error('Falha ao marcar plano como vencido.');
    } finally {
      setIsChangingLicense(false);
    }
  };

  const releaseLicense = async () => {
    if (!selectedTenantId) { toast.error('Selecione um tenant.'); return; }
    setIsChangingLicense(true);
    try {
      const result = await billingApi.adminReleaseLicense({ tenantId: selectedTenantId, validityDays: 30 });
      toast.success(result.message || 'Licenca liberada.');
      await loadPayments(selectedTenantId);
    } catch {
      toast.error('Falha ao liberar licenca.');
    } finally {
      setIsChangingLicense(false);
    }
  };

  const markPaymentReceived = async (paymentId: string) => {
    if (!selectedTenantId) { toast.error('Selecione um tenant.'); return; }
    setIsChangingLicense(true);
    try {
      const result = await billingApi.adminMarkPaymentReceived(selectedTenantId, paymentId, 30);
      toast.success(result.message || 'Pagamento liberado e licenca atualizada.');
      await loadPayments(selectedTenantId);
    } catch {
      toast.error('Falha ao liberar pagamento.');
    } finally {
      setIsChangingLicense(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Gerenciador de planos</CardTitle>
            <CardDescription>Crie, edite, ative e desative planos e o plano trial.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={openCreate}>Novo plano</Button>
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
                              {plan.highlight || plan.description || '-'}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant={plan.trial ? 'default' : 'secondary'}>
                            {plan.trial ? 'TRIAL' : 'PAGO'}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">R$ {(Number(plan.priceCents || 0) / 100).toFixed(2)}</td>
                        <td className="px-3 py-2">{plan.validityDays || plan.validityMonths * 30} dias</td>
                        <td className="px-3 py-2">{plan.maxProfessionals ?? '-'}</td>
                        <td className="px-3 py-2">{plan.priority}</td>
                        <td className="px-3 py-2">
                          <Badge variant={plan.active ? 'default' : 'secondary'}>
                            {plan.active ? 'ATIVO' : 'INATIVO'}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => openEdit(plan)}>
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant={plan.active ? 'secondary' : 'default'}
                              onClick={() => togglePlanActive(plan)}
                            >
                              {plan.active ? 'Desativar' : 'Ativar'}
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
                          Valor: R$ {(Number(payment.amountCents || 0) / 100).toFixed(2)} | Vencimento:{' '}
                          {payment.dueDate || '-'}
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
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{planForm.id ? 'Editar plano' : 'Novo plano'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Nome</Label>
              <Input
                value={planForm.name}
                onChange={(e) => setPlanForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Descricao</Label>
              <Textarea
                value={planForm.description}
                onChange={(e) => setPlanForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Moeda</Label>
              <Input
                value={planForm.currency}
                onChange={(e) => setPlanForm((prev) => ({ ...prev, currency: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Preco em centavos</Label>
              <Input
                type="number"
                value={planForm.priceCents}
                onChange={(e) => setPlanForm((prev) => ({ ...prev, priceCents: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Validade em meses</Label>
              <Input
                type="number"
                value={planForm.validityMonths}
                onChange={(e) => setPlanForm((prev) => ({ ...prev, validityMonths: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Validade em dias</Label>
              <Input
                type="number"
                value={planForm.validityDays}
                onChange={(e) => setPlanForm((prev) => ({ ...prev, validityDays: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Input
                type="number"
                value={planForm.priority}
                onChange={(e) => setPlanForm((prev) => ({ ...prev, priority: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Maximo de profissionais</Label>
              <Input
                type="number"
                value={planForm.maxProfessionals}
                onChange={(e) => setPlanForm((prev) => ({ ...prev, maxProfessionals: e.target.value }))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Destaque</Label>
              <Input
                value={planForm.highlight}
                onChange={(e) => setPlanForm((prev) => ({ ...prev, highlight: e.target.value }))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Features JSON</Label>
              <Textarea
                value={planForm.featuresJson}
                onChange={(e) => setPlanForm((prev) => ({ ...prev, featuresJson: e.target.value }))}
                rows={4}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={planForm.active}
                onCheckedChange={(checked) => setPlanForm((prev) => ({ ...prev, active: Boolean(checked) }))}
              />
              Ativo
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={planForm.trial}
                onCheckedChange={(checked) => setPlanForm((prev) => ({ ...prev, trial: Boolean(checked) }))}
              />
              Trial
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={savePlan} disabled={isSavingPlan}>
              {isSavingPlan ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
