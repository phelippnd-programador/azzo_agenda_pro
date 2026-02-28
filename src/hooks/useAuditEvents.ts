import { useCallback, useEffect, useMemo, useState } from "react";
import { auditoriaApi } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import type {
  AuditEventListItemDto,
  AuditSearchQueryDto,
  AuditSearchResponseDto,
} from "@/types/auditoria";

const createDefaultPeriod = () => {
  const now = new Date();
  const from = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7);
  return {
    from: from.toISOString(),
    to: now.toISOString(),
  };
};

const INITIAL_RESPONSE: AuditSearchResponseDto = {
  items: [],
  nextCursor: null,
  limit: 50,
  hasNext: false,
  aggregations: {
    byModule: [],
    byStatus: [],
    byAction: [],
  },
};

const normalizeAuditResponse = (
  data: Partial<AuditSearchResponseDto> | null | undefined
): AuditSearchResponseDto => ({
  items: Array.isArray(data?.items) ? data.items : [],
  nextCursor: data?.nextCursor ?? null,
  limit: typeof data?.limit === "number" ? data.limit : 50,
  hasNext: Boolean(data?.hasNext),
  aggregations: {
    byModule: Array.isArray(data?.aggregations?.byModule) ? data.aggregations.byModule : [],
    byStatus: Array.isArray(data?.aggregations?.byStatus) ? data.aggregations.byStatus : [],
    byAction: Array.isArray(data?.aggregations?.byAction) ? data.aggregations.byAction : [],
  },
});

export function useAuditEvents() {
  const defaultPeriod = useMemo(createDefaultPeriod, []);
  const [filters, setFilters] = useState<AuditSearchQueryDto>({
    from: defaultPeriod.from,
    to: defaultPeriod.to,
    limit: 50,
    sortBy: "createdAt",
    sortDir: "desc",
  });
  const [response, setResponse] = useState<AuditSearchResponseDto>(INITIAL_RESPONSE);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(
    async (nextCursor?: string | null, append = false) => {
      const loadingSetter = append ? setIsLoadingMore : setIsLoading;
      try {
        loadingSetter(true);
        const data = await auditoriaApi.listEvents({
          ...filters,
          cursor: nextCursor || undefined,
        });
        const normalized = normalizeAuditResponse(data);

        setResponse((prev) =>
          append
            ? {
                ...normalized,
                items: [...prev.items, ...normalized.items],
              }
            : normalized
        );
        setError(null);
      } catch (err) {
        const uiError = resolveUiError(err, "Erro ao carregar eventos de auditoria.");
        setError(uiError.message);
      } finally {
        loadingSetter(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  const applyFilters = useCallback((nextFilters: AuditSearchQueryDto) => {
    setFilters({
      ...nextFilters,
      sortBy: "createdAt",
      sortDir: "desc",
    });
  }, []);

  const fetchNextPage = useCallback(async () => {
    if (!response.hasNext || !response.nextCursor || isLoadingMore) return;
    await fetchEvents(response.nextCursor, true);
  }, [fetchEvents, isLoadingMore, response.hasNext, response.nextCursor]);

  const refetch = useCallback(async () => {
    await fetchEvents();
  }, [fetchEvents]);

  return {
    filters,
    setFilters,
    applyFilters,
    items: response.items as AuditEventListItemDto[],
    aggregations: response.aggregations,
    hasNext: response.hasNext,
    nextCursor: response.nextCursor,
    limit: response.limit,
    isLoading,
    isLoadingMore,
    error,
    fetchNextPage,
    refetch,
  };
}
