import { Button } from "@/components/ui/button";
import type { TimeSlotResponse } from "@/types/available-slots";

type AvailableSlotsListProps = {
  slots: TimeSlotResponse[];
  isLoading: boolean;
  error: string | null;
  canFetch: boolean;
  selectedStartTime: string;
  onSelect: (slot: TimeSlotResponse) => void;
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
      <p className="text-sm text-gray-500">
        Selecione profissional, servico e data para ver horarios sugeridos.
      </p>
    );
  }

  if (isLoading) {
    return <p className="text-sm text-gray-500">Consultando horarios sugeridos...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!slots.length) {
    return <p className="text-sm text-gray-500">Nenhum horario disponivel para esta selecao.</p>;
  }

  return (
    <div className="max-h-64 overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {slots.map((slot, index) => (
          <Button
            key={`${slot.startTime}-${slot.endTime}-${index}`}
            type="button"
            variant={selectedStartTime === slot.startTime ? "default" : "outline"}
            onClick={() => onSelect(slot)}
            title={index < 3 ? "Recomendado" : undefined}
            className={`justify-center gap-1 overflow-hidden px-2 ${
              selectedStartTime === slot.startTime
                ? "bg-violet-600 hover:bg-violet-700"
                : index < 3
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : ""
            }`}
          >
            <span>{slot.startTime}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
