import { Clock3, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { CheckoutIntentResponse } from "@/types/checkout";

interface CheckoutIntentPanelProps {
  intent: CheckoutIntentResponse;
  formattedPrice: string;
  isConfirming: boolean;
  onConfirm: () => Promise<void> | void;
  onRefreshIntent: () => Promise<void> | void;
  expired: boolean;
  error?: string | null;
}

export function CheckoutIntentPanel({
  intent,
  formattedPrice,
  isConfirming,
  onConfirm,
  onRefreshIntent,
  expired,
  error,
}: CheckoutIntentPanelProps) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Resumo seguro do checkout</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 rounded-lg bg-muted/40 p-4 text-sm">
          <p>
            <strong>Intent:</strong> {intent.intentId}
          </p>
          <p>
            <strong>Produto:</strong> {intent.productName}
          </p>
          <p>
            <strong>Valor:</strong> {formattedPrice}
          </p>
          <p className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-muted-foreground" />
            <span>
              <strong>Validade:</strong>{" "}
              {new Date(intent.expiresAt).toLocaleString("pt-BR")}
            </span>
          </p>
        </div>

        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
          <ShieldCheck className="h-4 w-4 !text-emerald-700" />
          <AlertTitle>Preco validado no servidor</AlertTitle>
          <AlertDescription>
            O valor exibido vem da intent gerada no backend e nao pode ser alterado
            no frontend.
          </AlertDescription>
        </Alert>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Falha no checkout</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {expired ? (
          <Button type="button" className="w-full" onClick={onRefreshIntent}>
            Revalidar oferta
          </Button>
        ) : (
          <Button
            type="button"
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            onClick={onConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? "Confirmando..." : "Confirmar compra"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

