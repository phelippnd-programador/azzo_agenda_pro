import { useCallback, useEffect, useState } from "react";
import { CreditCard, Plus, Trash2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { membershipApi, type MembershipBenefit, type MembershipPlan } from "@/lib/api/membership";
import { servicesApi, type Service } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import { formatCurrency } from "@/lib/format";

const EMPTY_FORM = {
  nome: "",
  descricao: "",
  precoMensal: 0,
  cumulativo: false,
  ativo: true,
};

function unwrapList<T>(data: T[] | { items: T[] }): T[] {
  return Array.isArray(data) ? data : data.items ?? [];
}

export default function MembershipPlansPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MembershipPlan | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [benefits, setBenefits] = useState<MembershipBenefit[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPlans(await membershipApi.listarPlanos());
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel carregar os planos.").message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    servicesApi.getAll().then((data) => setServices(unwrapList(data))).catch(() => {});
  }, [load]);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setBenefits([]);
    setOpen(true);
  };

  const openEdit = (plan: MembershipPlan) => {
    setEditing(plan);
    setForm({
      nome: plan.nome,
      descricao: plan.descricao || "",
      precoMensal: plan.precoMensal,
      cumulativo: plan.cumulativo,
      ativo: plan.ativo,
    });
    setBenefits(plan.beneficios || []);
    setOpen(true);
  };

  const addBenefit = () => {
    const service = services.find((item) => !benefits.some((benefit) => benefit.serviceId === item.id));
    if (!service) return;
    setBenefits((current) => [...current, { serviceId: service.id, quantidadeMensal: 1 }]);
  };

  const save = async () => {
    if (!form.nome.trim() || !(form.precoMensal > 0) || benefits.length === 0) {
      toast.error("Informe nome, valor mensal e ao menos um beneficio.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        descricao: form.descricao.trim() || undefined,
        precoMensal: form.precoMensal,
        cumulativo: form.cumulativo,
        ativo: form.ativo,
        beneficios: benefits,
      };
      if (editing) {
        await membershipApi.atualizarPlano(editing.id, payload);
        toast.success("Plano atualizado.");
      } else {
        await membershipApi.criarPlano(payload);
        toast.success("Plano criado.");
      }
      setOpen(false);
      await load();
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel salvar o plano.").message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout
      title="Clube de Assinaturas"
      subtitle="Planos recorrentes para clientes com franquia mensal de servicos"
    >
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" />
            Novo plano
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando planos...</p>
        ) : plans.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <CreditCard className="h-9 w-9 text-muted-foreground" />
              <div>
                <p className="font-medium">Nenhum plano cadastrado</p>
                <p className="text-sm text-muted-foreground">Crie o primeiro clube recorrente para seus clientes.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => openEdit(plan)}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between gap-3 text-base">
                    <span className="truncate">{plan.nome}</span>
                    <Badge variant={plan.ativo ? "default" : "outline"}>{plan.ativo ? "Ativo" : "Inativo"}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mensalidade</span>
                    <span className="font-semibold">{formatCurrency(plan.precoMensal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Beneficios</span>
                    <span>{plan.beneficios?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Acumula saldo</span>
                    <span>{plan.cumulativo ? "Sim" : "Nao"}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar plano" : "Novo plano"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Nome*</Label>
                <Input value={form.nome} onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Mensalidade (R$)*</Label>
                <CurrencyInput
                  value={form.precoMensal}
                  onChange={(value) => setForm((current) => ({ ...current, precoMensal: value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Descricao</Label>
              <Textarea value={form.descricao} onChange={(event) => setForm((current) => ({ ...current, descricao: event.target.value }))} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex items-center justify-between rounded-md border p-3">
                <Label>Ativo</Label>
                <Switch checked={form.ativo} onCheckedChange={(value) => setForm((current) => ({ ...current, ativo: value }))} />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <Label>Saldo cumulativo</Label>
                <Switch checked={form.cumulativo} onCheckedChange={(value) => setForm((current) => ({ ...current, cumulativo: value }))} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Beneficios mensais*</Label>
                <Button type="button" variant="outline" size="sm" onClick={addBenefit}>
                  <Plus className="mr-1 h-3 w-3" />
                  Adicionar servico
                </Button>
              </div>
              {benefits.map((benefit, index) => (
                <div key={`${benefit.serviceId}-${index}`} className="flex items-center gap-2">
                  <Select
                    value={benefit.serviceId}
                    onValueChange={(value) =>
                      setBenefits((current) =>
                        current.map((item, itemIndex) => itemIndex === index ? { ...item, serviceId: value } : item)
                      )
                    }
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Servico" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={1}
                    className="w-28"
                    value={benefit.quantidadeMensal}
                    onChange={(event) =>
                      setBenefits((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, quantidadeMensal: Number(event.target.value) || 1 } : item
                        )
                      )
                    }
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => setBenefits((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {benefits.length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhum beneficio configurado.</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar plano"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
