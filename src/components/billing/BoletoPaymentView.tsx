import { ExternalLink, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type BoletoPaymentViewProps = {
  bankSlipUrl?: string | null;
};

export function BoletoPaymentView({ bankSlipUrl }: BoletoPaymentViewProps) {
  return (
    <Card className="border-amber-200 bg-amber-50/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <Receipt className="h-5 w-5" />
          Pagamento via Boleto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-700">
          Sua assinatura foi criada e aguarda compensacao do boleto.
        </p>
        {bankSlipUrl ? (
          <Button type="button" asChild className="gap-2">
            <a href={bankSlipUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
              Abrir boleto
            </a>
          </Button>
        ) : (
          <p className="text-sm text-slate-600">Link do boleto indisponivel no momento.</p>
        )}
      </CardContent>
    </Card>
  );
}
