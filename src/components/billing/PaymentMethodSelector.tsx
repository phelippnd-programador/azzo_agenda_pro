import { QrCode, Receipt, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BillingType } from "@/types/billing";

type PaymentMethodSelectorProps = {
  value: BillingType;
  onChange: (value: BillingType) => void;
};

const methods: Array<{ value: BillingType; label: string; icon: typeof QrCode }> = [
  { value: "PIX", label: "PIX", icon: QrCode },
  { value: "BOLETO", label: "Boleto", icon: Receipt },
  { value: "CREDIT_CARD", label: "Cartao", icon: CreditCard },
];

export function PaymentMethodSelector({ value, onChange }: PaymentMethodSelectorProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {methods.map((method) => {
        const active = method.value === value;
        const Icon = method.icon;

        return (
          <Button
            key={method.value}
            type="button"
            variant={active ? "default" : "outline"}
            className={cn("justify-start gap-2", active && "bg-emerald-600 hover:bg-emerald-700")}
            onClick={() => onChange(method.value)}
          >
            <Icon className="h-4 w-4" />
            {method.label}
          </Button>
        );
      })}
    </div>
  );
}
