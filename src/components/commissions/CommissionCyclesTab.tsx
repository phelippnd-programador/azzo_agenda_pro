import { CheckCircle2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrencyCents as formatCurrency } from "@/lib/format";
import type { CommissionCycleResponse } from "@/types/commission";

interface CommissionCyclesTabProps {
  from: string;
  to: string;
  cycles: CommissionCycleResponse[];
  currentCycle: CommissionCycleResponse | null;
  isClosingCycle: boolean;
  payingCycleId: string | null;
  cyclePayNotes: Record<string, string>;
  onCloseCycle: () => void;
  onPayCycle: (cycleId: string) => void;
  onCyclePayNotesChange: (cycleId: string, value: string) => void;
}

export function CommissionCyclesTab({
  from,
  to,
  cycles,
  currentCycle,
  isClosingCycle,
  payingCycleId,
  cyclePayNotes,
  onCloseCycle,
  onPayCycle,
  onCyclePayNotesChange,
}: CommissionCyclesTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Fechamento do periodo atual</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Periodo {from} ate {to}
            </p>
            <div className="flex items-center gap-2">
              <Badge variant={currentCycle ? "secondary" : "outline"}>
                {currentCycle ? currentCycle.status : "Sem fechamento"}
              </Badge>
              {currentCycle ? (
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(currentCycle.totalAmountCents)} - {currentCycle.entryCount}{" "}
                  lancamentos
                </span>
              ) : null}
            </div>
          </div>
          {!currentCycle ? (
            <Button onClick={onCloseCycle} disabled={isClosingCycle}>
              {isClosingCycle ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Fechar ciclo
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historico de ciclos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!cycles.length ? (
            <p className="text-sm text-muted-foreground">Nenhum ciclo registrado.</p>
          ) : (
            cycles.map((cycle) => (
              <div key={cycle.id} className="rounded-lg border p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      {cycle.periodStart} ate {cycle.periodEnd}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(cycle.totalAmountCents)} - {cycle.entryCount} lancamentos
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={cycle.status === "PAID" ? "default" : "secondary"}>
                      {cycle.status === "PAID" ? "Pago" : "Fechado"}
                    </Badge>
                    {cycle.status !== "PAID" ? (
                      <Button
                        onClick={() => onPayCycle(cycle.id)}
                        disabled={payingCycleId === cycle.id}
                      >
                        {payingCycleId === cycle.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Marcar como pago
                      </Button>
                    ) : null}
                  </div>
                </div>
                {cycle.status !== "PAID" ? (
                  <div className="mt-3 space-y-2">
                    <Label>Observacoes do pagamento</Label>
                    <Textarea
                      value={cyclePayNotes[cycle.id] || ""}
                      onChange={(e) => onCyclePayNotesChange(cycle.id, e.target.value)}
                      placeholder="Opcional"
                    />
                  </div>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
