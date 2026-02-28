import { useState, useEffect, useCallback } from "react";
import { appointmentsApi, type Appointment, isPlanExpiredApiError } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import { toast } from "sonner";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

type AppointmentFilters = {
  date?: string;
  professionalId?: string;
  status?: string;
};

type UseAppointmentsOptions = {
  defaultLimit?: number;
  enabled?: boolean;
};

type PaginationState = {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

export function useAppointments(filters?: AppointmentFilters, options?: UseAppointmentsOptions) {
  const defaultLimit = options?.defaultLimit ?? DEFAULT_LIMIT;
  const enabled = options?.enabled ?? true;
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    page: DEFAULT_PAGE,
    limit: defaultLimit,
    total: 0,
    hasMore: false,
  });

  const fetchAppointments = useCallback(
    async (options?: { page?: number; limit?: number }) => {
      if (!enabled) return;
      const page = options?.page ?? DEFAULT_PAGE;
      const limit = options?.limit ?? defaultLimit;
    try {
      setIsLoading(true);
      const data = await appointmentsApi.getAll({
        page,
        limit,
        date: filters?.date,
        professionalId: filters?.professionalId,
        status: filters?.status,
      });
      if (Array.isArray(data)) {
        setAppointments(data);
        setPagination({
          page,
          limit,
          total: data.length,
          hasMore: false,
        });
      } else {
        const items = data.items || [];
        const total = data.total ?? items.length;
        const hasMore = data.hasMore ?? page * limit < total;
        setAppointments(items);
        setPagination({
          page: data.page ?? page,
          limit: data.pageSize ?? limit,
          total,
          hasMore,
        });
      }
      setError(null);
    } catch (err) {
      if (isPlanExpiredApiError(err)) {
        setError(null);
        return;
      }
      const uiError = resolveUiError(err, "Erro ao carregar agendamentos");
      setError(uiError.message);
      toast.error(uiError.message);
    } finally {
      setIsLoading(false);
    }
    },
    [defaultLimit, enabled, filters?.date, filters?.professionalId, filters?.status]
  );

  useEffect(() => {
    if (!enabled) {
      setAppointments([]);
      setPagination({
        page: DEFAULT_PAGE,
        limit: defaultLimit,
        total: 0,
        hasMore: false,
      });
      setIsLoading(false);
      setError(null);
      return;
    }
    fetchAppointments({ page: DEFAULT_PAGE, limit: defaultLimit });
  }, [defaultLimit, enabled, fetchAppointments]);

  const createAppointment = async (data: Omit<Appointment, "id" | "createdAt">) => {
    try {
      const newAppointment = await appointmentsApi.create(data);
      await fetchAppointments({ page: pagination.page, limit: pagination.limit });
      toast.success("Agendamento criado com sucesso!");
      return newAppointment;
    } catch (err) {
      if (!isPlanExpiredApiError(err)) {
        toast.error(resolveUiError(err, "Erro ao criar agendamento").message);
      }
      throw err;
    }
  };

  const updateAppointmentStatus = async (id: string, status: Appointment["status"]) => {
    try {
      const updated = await appointmentsApi.updateStatus(id, status);
      await fetchAppointments({ page: pagination.page, limit: pagination.limit });

      const statusMessages: Record<string, string> = {
        CONFIRMED: "Agendamento confirmado!",
        IN_PROGRESS: "Atendimento iniciado!",
        COMPLETED: "Atendimento concluido!",
        CANCELLED: "Agendamento cancelado.",
        NO_SHOW: "Cliente nao compareceu.",
      };

      toast.success(statusMessages[status] || "Status atualizado!");
      return updated;
    } catch (err) {
      if (!isPlanExpiredApiError(err)) {
        toast.error(resolveUiError(err, "Erro ao atualizar status").message);
      }
      throw err;
    }
  };

  const deleteAppointment = async (id: string) => {
    try {
      await appointmentsApi.delete(id);
      await fetchAppointments({ page: pagination.page, limit: pagination.limit });
      toast.success("Agendamento excluido!");
    } catch (err) {
      if (!isPlanExpiredApiError(err)) {
        toast.error(resolveUiError(err, "Erro ao excluir agendamento").message);
      }
      throw err;
    }
  };

  const reassignAppointmentProfessional = async (id: string, professionalId: string) => {
    try {
      const updated = await appointmentsApi.reassignProfessional(id, professionalId);
      await fetchAppointments({ page: pagination.page, limit: pagination.limit });
      toast.success("Agendamento realocado com sucesso!");
      return updated;
    } catch (err) {
      if (!isPlanExpiredApiError(err)) {
        toast.error(resolveUiError(err, "Erro ao realocar agendamento").message);
      }
      throw err;
    }
  };

  const goToPage = async (page: number) => {
    if (page < 1) return;
    await fetchAppointments({ page, limit: pagination.limit });
  };

  return {
    appointments,
    pagination,
    isLoading,
    error,
    refetch: () => fetchAppointments({ page: pagination.page, limit: pagination.limit }),
    goToPage,
    createAppointment,
    updateAppointmentStatus,
    deleteAppointment,
    reassignAppointmentProfessional,
  };
}
