import { Coins, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Professional } from "@/types";

interface CommissionAdjustmentsTabProps {
  professionals: Professional[];
  adjustmentProfessionalId: string;
  adjustmentAmount: string;
  adjustmentReason: string;
  isSubmittingAdjustment: boolean;
  onChangeProfessionalId: (value: string) => void;
  onChangeAmount: (value: string) => void;
  onChangeReason: (value: string) => void;
  onSubmit: () => void;
}

export function CommissionAdjustmentsTab({
  professionals,
  adjustmentProfessionalId,
  adjustmentAmount,
  adjustmentReason,
  isSubmittingAdjustment,
  onChangeProfessionalId,
  onChangeAmount,
  onChangeReason,
  onSubmit,
}: CommissionAdjustmentsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ajuste manual auditado</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Profissional</Label>
          <Select value={adjustmentProfessionalId} onValueChange={onChangeProfessionalId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um profissional" />
            </SelectTrigger>
            <SelectContent>
              {professionals.map((professional) => (
                <SelectItem key={professional.id} value={professional.id}>
                  {professional.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Valor do ajuste (R$)</Label>
          <Input
            type="number"
            step="0.01"
            value={adjustmentAmount}
            onChange={(e) => onChangeAmount(e.target.value)}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Motivo</Label>
          <Textarea
            value={adjustmentReason}
            onChange={(e) => onChangeReason(e.target.value)}
            placeholder="Descreva o motivo do ajuste manual."
          />
        </div>
        <div className="md:col-span-2">
          <Button
            onClick={onSubmit}
            disabled={
              isSubmittingAdjustment || !adjustmentProfessionalId || !adjustmentReason.trim()
            }
          >
            {isSubmittingAdjustment ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Coins className="mr-2 h-4 w-4" />
            )}
            Registrar ajuste
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
