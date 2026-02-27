import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BillingPlanOption } from "@/components/billing/types";

type PlanSelectorProps = {
  plans: BillingPlanOption[];
  selectedPlanCode: string;
  onSelect: (planCode: string) => void;
};

const formatCurrency = (amountCents: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amountCents / 100);

export function PlanSelector({
  plans,
  selectedPlanCode,
  onSelect,
}: PlanSelectorProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {plans.map((plan) => {
        const selected = plan.code === selectedPlanCode;

        return (
          <Card
            key={plan.code}
            className={cn(
              "border-border transition-colors",
              selected && "border-emerald-500 ring-1 ring-emerald-200"
            )}
          >
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                {plan.highlight ? <Badge>{plan.highlight}</Badge> : null}
              </div>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(plan.amountCents)}
                <span className="ml-1 text-sm font-normal text-muted-foreground">/mes</span>
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2 text-sm text-foreground">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                variant={selected ? "secondary" : "outline"}
                className="w-full"
                onClick={() => onSelect(plan.code)}
              >
                {selected ? "Plano selecionado" : "Selecionar plano"}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

