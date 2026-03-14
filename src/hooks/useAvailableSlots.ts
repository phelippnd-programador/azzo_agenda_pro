import { useEffect, useMemo, useState } from "react";
import { appointmentsApi } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import type { TimeSlotResponse } from "@/types/available-slots";

type UseAvailableSlotsParams = {
  professionalId?: string;
  date?: string;
  serviceDurationMinutes?: number;
  serviceIds?: string[];
  bufferMinutes?: number;
};

function getValidationErrorMessage() {
  return "Revise profissional, data e duracao do servico para consultar horarios.";
}

export function useAvailableSlots(params: UseAvailableSlotsParams) {
  const [slots, setSlots] = useState<TimeSlotResponse[]>([]);
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
        const response = await appointmentsApi.getAvailableSlots({
          professionalId: params.professionalId!,
          date: params.date!,
          serviceIds: params.serviceIds,
          serviceDurationMinutes: params.serviceDurationMinutes!,
          bufferMinutes: params.bufferMinutes ?? 0,
        });

        if (!isMounted) return;
        setSlots(Array.isArray(response) ? response : []);
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
  }, [canFetch, params.bufferMinutes, params.date, params.professionalId, params.serviceDurationMinutes, params.serviceIds]);

  return {
    slots,
    isLoading,
    error,
    canFetch,
  };
}
