import { useEffect, useMemo, useState } from "react";
import { appointmentsApi } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import type { ManualTimeSlotResponse } from "@/types/available-slots";

type UseAvailableSlotsParams = {
  professionalId?: string;
  date?: string;
  serviceDurationMinutes?: number;
  serviceIds?: string[];
  bufferMinutes?: number;
  mode?: "strict" | "manual";
};

function getValidationErrorMessage() {
  return "Revise profissional, data e duracao do servico para consultar horarios.";
}

export function useAvailableSlots(params: UseAvailableSlotsParams) {
  const [slots, setSlots] = useState<ManualTimeSlotResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canFetch = useMemo(
    () =>
      !!params.professionalId &&
      !!params.date &&
      ((Array.isArray(params.serviceIds) && params.serviceIds.length > 0) ||
        (!!params.serviceDurationMinutes && params.serviceDurationMinutes > 0)),
    [params.date, params.professionalId, params.serviceDurationMinutes, params.serviceIds]
  );

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!canFetch) {
        setSlots([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const response =
          params.mode === "manual"
            ? await appointmentsApi.getManualSlots({
                professionalId: params.professionalId!,
                date: params.date!,
                serviceIds: params.serviceIds,
                serviceDurationMinutes: params.serviceDurationMinutes!,
                bufferMinutes: params.bufferMinutes ?? 0,
              })
            : await appointmentsApi.getAvailableSlots({
                professionalId: params.professionalId!,
                date: params.date!,
                serviceIds: params.serviceIds,
                serviceDurationMinutes: params.serviceDurationMinutes!,
                bufferMinutes: params.bufferMinutes ?? 0,
              });

        const normalized = Array.isArray(response)
          ? response.map((slot) => ({
              ...slot,
              conflicting: Boolean((slot as ManualTimeSlotResponse).conflicting),
              slotType:
                (slot as ManualTimeSlotResponse).slotType ||
                (Boolean((slot as ManualTimeSlotResponse).conflicting) ? "CONFLICT" : "AVAILABLE"),
              conflicts: (slot as ManualTimeSlotResponse).conflicts || [],
            }))
          : [];

        if (!isMounted) return;
        setSlots(normalized);
      } catch (err) {
        if (!isMounted) return;
        const uiError = resolveUiError(err, "Nao foi possivel consultar horarios disponiveis.");
        if (uiError.status === 400) {
          setError(getValidationErrorMessage());
        } else {
          setError(uiError.message);
        }
        setSlots([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [
    canFetch,
    params.bufferMinutes,
    params.date,
    params.mode,
    params.professionalId,
    params.serviceDurationMinutes,
    params.serviceIds,
  ]);

  return {
    slots,
    isLoading,
    error,
    canFetch,
  };
}
