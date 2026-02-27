import { useCallback, useEffect, useState } from "react";
import { auditoriaApi } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import type { AuditEventDetailDto } from "@/types/auditoria";

export function useAuditEventDetail(eventId: string | null) {
  const [eventDetail, setEventDetail] = useState<AuditEventDetailDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!eventId) {
      setEventDetail(null);
      setError(null);
      return;
    }
    try {
      setIsLoading(true);
      const data = await auditoriaApi.getEventDetail(eventId);
      setEventDetail(data);
      setError(null);
    } catch (err) {
      const uiError = resolveUiError(err, "Erro ao carregar detalhe do evento.");
      setError(uiError.message);
      setEventDetail(null);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  return {
    eventDetail,
    isLoading,
    error,
    refetch: fetchDetail,
  };
}
