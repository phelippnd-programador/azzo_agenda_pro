import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageEmptyState, PageListLoadingState } from "@/components/ui/page-states";
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
import { membershipApi, type MembershipPlan } from "@/lib/api/membership";
import { servicesApi, type Service } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import { formatCurrency } from "@/lib/format";
import { membershipPlanFormSchema, type MembershipPlanFormValues } from "@/schemas/membershipPlan";

const EMPTY_FORM: MembershipPlanFormValues = {
  nome: "",
  descricao: "",
  precoMensal: 0,
  cumulativo: false,
  ativo: true,
  beneficios: [],
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

  const { register, handleSubmit, watch, setValue, reset } = useForm<MembershipPlanFormValues>({
    resolver: zodResolver(membershipPlanFormSchema),
    defaultValues: EMPTY_FORM,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPlans(await membershipApi.listarPlanos());
    } catch (error) {
      toast.error(resolveUiError(error, "Não foi possível carregar os planos.").message);
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
    reset(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (plan: MembershipPlan) => {
    setEditing(plan);
    reset({
      nome: plan.nome,
      descricao: plan.descricao || "",
      precoMensal: plan.precoMensal,
      cumulativo: plan.cumulativo,
      ativo: plan.ativo,
      beneficios: plan.beneficios || [],
    });
    setOpen(true);
  };

  const benefits = watch("beneficios");

  const addBenefit = () => {
    const service = services.find((item) => !benefits.some((benefit) => benefit.serviceId === item.id));
    if (!service) return;
    setValue("beneficios", [...benefits, { serviceId: service.id, quantidadeMensal: 1 }], { shouldDirty: true });
  };

  const onInvalidForm = () => {
    toast.error("Informe nome, valor mensal e ao menos um benefício.");
  };

  const save = async (values: MembershipPlanFormValues) => {
    setSaving(true);
    try {
      const payload = {
        nome: values.nome.trim(),
        descricao: values.descricao.trim() || undefined,
        precoMensal: values.precoMensal,
        cumulativo: values.cumulativo,
        ativo: values.ativo,
        beneficios: values.beneficios,
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
      toast.error(resolveUiError(error, "Não foi possível salvar o plano.").message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout
      title="Clube de Assinaturas"
      subtitle="Planos recorrentes para clientes com franquia mensal de serviços"
    >
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" />
            Novo plano
          </Button>
        </div>

        {loading ? (
          <PageListLoadingState metricCount={0} itemCount={6} itemHeightClassName="h-36" showHeader={false} showToolbar={false} />
        ) : plans.length === 0 ? (
          <PageEmptyState
            title="Nenhum plano cadastrado"
            description="Crie o primeiro clube recorrente com benefícios mensais para seus clientes."
            action={{ label: "Novo plano", onClick: openNew }}
          />
        ) : (
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id} className="cursor-pointer border-border/70 bg-card/90 shadow-none transition hover:-translate-y-0.5 hover:shadow-[0_12px_36px_-28px_rgba(15,23,42,0.18)]" onClick={() => openEdit(plan)}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between gap-2 text-base">
                    <span className="min-w-0 truncate">{plan.nome}</span>
                    <div className="flex flex-shrink-0 items-center gap-1">
                      <Badge variant={plan.ativo ? "default" : "outline"}>{plan.ativo ? "Ativo" : "Inativo"}</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Editar plano ${plan.nome}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          openEdit(plan);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Mensalidade</span>
                    <span className="font-semibold">{formatCurrency(plan.precoMensal)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Benefícios</span>
                    <span>{plan.beneficios?.length || 0}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Acumula saldo</span>
                    <span>{plan.cumulativo ? "Sim" : "Não"}</span>
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
                <Input {...register("nome")} />
              </div>
              <div className="space-y-1.5">
                <Label>Mensalidade (R$)*</Label>
                <CurrencyInput
                  value={watch("precoMensal")}
                  onChange={(value) => setValue("precoMensal", value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea {...register("descricao")} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border border-border/70 bg-background/60 p-3">
                <Label>Ativo</Label>
                <Switch checked={watch("ativo")} onCheckedChange={(value) => setValue("ativo", value)} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/70 bg-background/60 p-3">
                <Label>Saldo cumulativo</Label>
                <Switch checked={watch("cumulativo")} onCheckedChange={(value) => setValue("cumulativo", value)} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Label>Benefícios mensais*</Label>
                <Button type="button" variant="outline" size="sm" onClick={addBenefit}>
                  <Plus className="mr-1 h-3 w-3" />
                  Adicionar serviço
                </Button>
              </div>
              {benefits.map((benefit, index) => (
                <div key={`${benefit.serviceId}-${index}`} className="flex flex-col gap-2 rounded-lg border border-border/70 bg-background/50 p-2 sm:flex-row sm:items-center">
                  <Select
                    value={benefit.serviceId}
                    onValueChange={(value) =>
                      setValue(
                        "beneficios",
                        benefits.map((item, itemIndex) => itemIndex === index ? { ...item, serviceId: value } : item)
                      )
                    }
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Serviço" />
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
                    className="w-full sm:w-28"
                    value={benefit.quantidadeMensal}
                    onChange={(event) =>
                      setValue(
                        "beneficios",
                        benefits.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, quantidadeMensal: Number(event.target.value) || 1 } : item
                        )
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remover benefício do plano"
                    onClick={() => setValue("beneficios", benefits.filter((_, itemIndex) => itemIndex !== index))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {benefits.length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhum benefício configurado.</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => void handleSubmit(save, onInvalidForm)()}
              isLoading={saving}
              loadingText="Salvando..."
            >
              Salvar plano
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
