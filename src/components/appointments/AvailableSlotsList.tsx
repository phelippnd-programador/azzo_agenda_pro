import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ManualTimeSlotResponse } from "@/types/available-slots";

type AvailableSlotsListProps = {
  slots: ManualTimeSlotResponse[];
  isLoading: boolean;
  error: string | null;
  canFetch: boolean;
  selectedStartTime: string;
  onSelect: (slot: ManualTimeSlotResponse) => void;
};

export function AvailableSlotsList({
  slots,
  isLoading,
  error,
  canFetch,
  selectedStartTime,
  onSelect,
}: AvailableSlotsListProps) {
  if (!canFetch) {
    return (
      <p className="text-sm text-muted-foreground">
        Selecione profissional, servico e data para ver horarios sugeridos.
      </p>
    );
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Consultando horarios sugeridos...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!slots.length) {
    return <p className="text-sm text-muted-foreground">Nenhum horario disponivel para esta selecao.</p>;
  }

  const availableSlots = slots.filter((slot) => !slot.conflicting);
  const conflictSlots = slots.filter((slot) => slot.conflicting);

  const renderSlotButton = (slot: ManualTimeSlotResponse, index: number, highlighted = false) => (
    <Button
      key={`${slot.startTime}-${slot.endTime}-${slot.slotType || "slot"}-${index}`}
      type="button"
      variant={selectedStartTime === slot.startTime ? "default" : "outline"}
      onClick={() => onSelect(slot)}
      className={`justify-center gap-1 overflow-hidden px-2 ${
        selectedStartTime === slot.startTime
          ? slot.conflicting
            ? "bg-red-600 text-white hover:bg-red-700"
            : "bg-primary hover:bg-primary/90"
          : slot.conflicting
            ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
            : highlighted
              ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              : ""
      }`}
    >
      <span>{slot.startTime}</span>
    </Button>
  );

  return (
    <div className="max-h-72 space-y-4 overflow-y-auto pr-1">
      {availableSlots.length ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Horarios vagos
            </p>
            <Badge variant="secondary">{availableSlots.length}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {availableSlots.map((slot, index) => renderSlotButton(slot, index, index < 3))}
          </div>
        </div>
      ) : null}

      {conflictSlots.length ? (
        <div className="space-y-2 rounded-lg border border-red-200 bg-red-50/70 p-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-red-700">
                Horarios com conflito
              </p>
              <p className="text-xs text-red-600">
                Esses horarios ja possuem outro atendimento e exigem confirmacao explicita.
              </p>
            </div>
            <Badge className="bg-red-100 text-red-700 hover:bg-red-100">{conflictSlots.length}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {conflictSlots.map((slot, index) => renderSlotButton(slot, index))}
          </div>
        </div>
      ) : null}

      {!availableSlots.length && !conflictSlots.length ? (
        <p className="text-sm text-muted-foreground">Nenhum horario disponivel para esta selecao.</p>
      ) : null}
    </div>
  );
}
