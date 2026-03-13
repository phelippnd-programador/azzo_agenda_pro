import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Professional, Service } from "@/types";
import type {
  CommissionRuleItemResponse,
  CommissionRuleRequest,
  CommissionRuleSetResponse,
  CommissionRuleSetUpsertRequest,
  CommissionScopeType,
  CommissionTargetType,
} from "@/types/commission";

type ProductOption = {
  id: string;
  nome: string;
};

type Props = {
  title: string;
  scopeType: CommissionScopeType;
  professional?: Professional | null;
  existingRuleSet?: CommissionRuleSetResponse | null;
  services: Service[];
  products: ProductOption[];
  isSaving: boolean;
  onSave: (payload: CommissionRuleSetUpsertRequest, existingRuleSetId?: string) => Promise<void>;
};

type EditableRule = {
  id?: string;
  targetType: CommissionTargetType;
  targetId: string;
  targetCode: string;
  percentValue: string;
  fixedAmount: string;
  percentBaseType: "GROSS" | "NET_OF_DISCOUNT";
  refundPolicy: "KEEP_COMMISSION" | "REVERSE_COMMISSION";
  active: boolean;
};

const createEmptyRule = (): EditableRule => ({
  targetType: "GENERAL",
  targetId: "",
  targetCode: "",
  percentValue: "0",
  fixedAmount: "0",
  percentBaseType: "GROSS",
  refundPolicy: "KEEP_COMMISSION",
  active: true,
});

const centsToAmount = (value: number) => (value / 100).toFixed(2);
const amountToCents = (value: string) => Math.round(Number(value || 0) * 100);

const toEditableRule = (rule: CommissionRuleItemResponse): EditableRule => ({
  id: rule.id,
  targetType: rule.targetType,
  targetId: rule.targetId || "",
  targetCode: rule.targetCode || "",
  percentValue: String(rule.percentValue ?? 0),
  fixedAmount: centsToAmount(rule.fixedAmountCents ?? 0),
  percentBaseType: rule.percentBaseType,
  refundPolicy: rule.refundPolicy,
  active: rule.active,
});

const normalizeRule = (rule: EditableRule): CommissionRuleRequest => ({
  targetType: rule.targetType,
  targetId:
    rule.targetType === "SERVICE" || rule.targetType === "PRODUCT"
      ? rule.targetId || null
      : null,
  targetCode:
    rule.targetType === "SERVICE_CATEGORY" || rule.targetType === "PRODUCT_CATEGORY"
      ? rule.targetCode.trim() || null
      : null,
  percentValue: Number(rule.percentValue || 0),
  fixedAmountCents: amountToCents(rule.fixedAmount),
  percentBaseType: rule.percentBaseType,
  refundPolicy: rule.refundPolicy,
  active: rule.active,
});

export function CommissionRuleSetEditor({
  title,
  scopeType,
  professional,
  existingRuleSet,
  services,
  products,
  isSaving,
  onSave,
}: Props) {
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [rules, setRules] = useState<EditableRule[]>([createEmptyRule()]);

  useEffect(() => {
    if (existingRuleSet) {
      setName(existingRuleSet.name);
      setActive(existingRuleSet.active);
      setRules(
        existingRuleSet.rules.length
          ? existingRuleSet.rules.map(toEditableRule)
          : [createEmptyRule()]
      );
      return;
    }
    setName(scopeType === "GLOBAL" ? "Regra global de comissao" : `Regra de ${professional?.name || "profissional"}`);
    setActive(true);
    setRules([createEmptyRule()]);
  }, [existingRuleSet, professional?.name, scopeType]);

  const serviceCategoryOptions = useMemo(
    () => Array.from(new Set(services.map((service) => service.category).filter(Boolean))).sort(),
    [services]
  );

  const updateRule = (index: number, patch: Partial<EditableRule>) => {
    setRules((current) =>
      current.map((rule, ruleIndex) => {
        if (ruleIndex !== index) return rule;
        const next = { ...rule, ...patch };
        if (patch.targetType) {
          next.targetId = "";
          next.targetCode = "";
        }
        return next;
      })
    );
  };

  const handleSubmit = async () => {
    const payload: CommissionRuleSetUpsertRequest = {
      scopeType,
      professionalId: scopeType === "PROFESSIONAL" ? professional?.id || null : null,
      name: name.trim(),
      active,
      rules: rules.map(normalizeRule),
    };
    await onSave(payload, existingRuleSet?.id);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Nome da regra</Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium text-foreground">Regra ativa</p>
              <p className="text-xs text-muted-foreground">
                {scopeType === "GLOBAL"
                  ? "Aplicada quando nao houver configuracao especifica."
                  : "Sobrescreve a regra global para este profissional."}
              </p>
            </div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
        </div>

        <div className="space-y-4">
          {rules.map((rule, index) => (
            <Card key={rule.id || index} className="border-dashed">
              <CardContent className="space-y-4 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Regra {index + 1}</p>
                  {rules.length > 1 ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setRules((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tipo de alvo</Label>
                    <Select
                      value={rule.targetType}
                      onValueChange={(value) =>
                        updateRule(index, { targetType: value as CommissionTargetType })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GENERAL">Geral</SelectItem>
                        <SelectItem value="SERVICE">Servico especifico</SelectItem>
                        <SelectItem value="SERVICE_CATEGORY">Categoria de servico</SelectItem>
                        <SelectItem value="PRODUCT">Produto especifico</SelectItem>
                        <SelectItem value="PRODUCT_CATEGORY">Categoria de produto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {rule.targetType === "SERVICE" ? (
                    <div className="space-y-2">
                      <Label>Servico</Label>
                      <Select value={rule.targetId} onValueChange={(value) => updateRule(index, { targetId: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um servico" />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}

                  {rule.targetType === "PRODUCT" ? (
                    <div className="space-y-2">
                      <Label>Produto</Label>
                      <Select value={rule.targetId} onValueChange={(value) => updateRule(index, { targetId: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}

                  {rule.targetType === "SERVICE_CATEGORY" ? (
                    <div className="space-y-2">
                      <Label>Categoria de servico</Label>
                      <Select value={rule.targetCode} onValueChange={(value) => updateRule(index, { targetCode: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {serviceCategoryOptions.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}

                  {rule.targetType === "PRODUCT_CATEGORY" ? (
                    <div className="space-y-2">
                      <Label>Categoria de produto</Label>
                      <Input
                        placeholder="Ex: Varejo, Tratamento, Home Care"
                        value={rule.targetCode}
                        onChange={(event) => updateRule(index, { targetCode: event.target.value })}
                      />
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Percentual (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={rule.percentValue}
                      onChange={(event) => updateRule(index, { percentValue: event.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fixo (R$)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={rule.fixedAmount}
                      onChange={(event) => updateRule(index, { fixedAmount: event.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Base do percentual</Label>
                    <Select
                      value={rule.percentBaseType}
                      onValueChange={(value) =>
                        updateRule(index, { percentBaseType: value as EditableRule["percentBaseType"] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GROSS">Valor bruto</SelectItem>
                        <SelectItem value="NET_OF_DISCOUNT">Com desconto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Estorno</Label>
                    <Select
                      value={rule.refundPolicy}
                      onValueChange={(value) =>
                        updateRule(index, { refundPolicy: value as EditableRule["refundPolicy"] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KEEP_COMMISSION">Manter comissao</SelectItem>
                        <SelectItem value="REVERSE_COMMISSION">Reverter comissao</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Regra ativa</p>
                    <p className="text-xs text-muted-foreground">Permite desligar esta linha sem excluir.</p>
                  </div>
                  <Switch checked={rule.active} onCheckedChange={(checked) => updateRule(index, { active: checked })} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="outline" onClick={() => setRules((current) => [...current, createEmptyRule()])}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar regra
          </Button>
          <Button type="button" onClick={() => void handleSubmit()} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Salvar configuracao
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
