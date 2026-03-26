import { useCallback } from "react";
import { appointmentsApi, isPlanExpiredApiError, type Appointment, type AppointmentCreateRequest } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import { useResourceList, type UseResourceListOptions } from "@/hooks/useResourceList";
import { toast } from "sonner";

export type { Appointment };

type AppointmentFilters = {
  date?: string;
  professionalId?: string;
  status?: string;
};

const STATUS_MESSAGES: Record<string, string> = {
  CONFIRMED:   "Agendamento confirmado!",
  IN_PROGRESS: "Atendimento iniciado!",
  COMPLETED:   "Atendimento concluído!",
  CANCELLED:   "Agendamento cancelado.",
  NO_SHOW:     "Cliente não compareceu.",
};

export function useAppointments(
  filters?: AppointmentFilters,
  options?: UseResourceListOptions,
) {
  // fetchFn fecha sobre os filtros — quando filters muda, useCallback recria a fn
  // e useResourceList re-executa o fetch automaticamente via dep do useEffect interno
  const fetchFn = useCallback(
    (params: { page: number; limit: number }) =>
      appointmentsApi.getAll({
        ...params,
        date: filters?.date,
        professionalId: filters?.professionalId,
        status: filters?.status,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters?.date, filters?.professionalId, filters?.status],
  );

  const { items: appointments, pagination, isLoading, error, refetch, goToPage, _fetch } =
    useResourceList<Appointment>(fetchFn, "Erro ao carregar agendamentos", options);

  const createAppointment = async (data: AppointmentCreateRequest) => {
    try {
      const result = await appointmentsApi.create(data);
      await _fetch({ page: pagination.page, limit: pagination.limit });
      toast.success("Agendamento criado com sucesso!");
      return result;
    } catch (err) {
      if (!isPlanExpiredApiError(err))
        toast.error(resolveUiError(err, "Erro ao criar agendamento").message);
      throw err;
    }
  };

  const updateAppointmentStatus = async (id: string, status: Appointment["status"]) => {
    try {
      const result = await appointmentsApi.updateStatus(id, status);
      await _fetch({ page: pagination.page, limit: pagination.limit });
      toast.success(STATUS_MESSAGES[status] ?? "Status atualizado!");
      return result;
    } catch (err) {
      if (!isPlanExpiredApiError(err))
        toast.error(resolveUiError(err, "Erro ao atualizar status").message);
      throw err;
    }
  };

  const deleteAppointment = async (id: string) => {
    try {
      await appointmentsApi.delete(id);
      await _fetch({ page: pagination.page, limit: pagination.limit });
      toast.success("Agendamento excluído!");
    } catch (err) {
      if (!isPlanExpiredApiError(err))
        toast.error(resolveUiError(err, "Erro ao excluir agendamento").message);
      throw err;
    }
  };

  const reassignAppointmentProfessional = async (id: string, professionalId: string) => {
    try {
      const result = await appointmentsApi.reassignProfessional(id, professionalId);
      await _fetch({ page: pagination.page, limit: pagination.limit });
      toast.success("Agendamento realocado com sucesso!");
      return result;
    } catch (err) {
      if (!isPlanExpiredApiError(err))
        toast.error(resolveUiError(err, "Erro ao realocar agendamento").message);
      throw err;
    }
  };

  return {
    appointments,
    pagination,
    isLoading,
    error,
    refetch,
    goToPage,
    createAppointment,
    updateAppointmentStatus,
    deleteAppointment,
    reassignAppointmentProfessional,
  };
}
