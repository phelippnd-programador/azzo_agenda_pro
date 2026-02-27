import { useState, useEffect, useCallback } from "react";
import { appointmentsApi, type Appointment, isPlanExpiredApiError } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import { toast } from "sonner";

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await appointmentsApi.getAll({ page: 1, limit: 100 });
      setAppointments(Array.isArray(data) ? data : data.items || []);
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
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const createAppointment = async (data: Omit<Appointment, "id" | "createdAt">) => {
    try {
      const newAppointment = await appointmentsApi.create(data);
      setAppointments((prev) => [...prev, newAppointment]);
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
      setAppointments((prev) => prev.map((appointment) => (appointment.id === id ? updated : appointment)));

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
      setAppointments((prev) => prev.filter((appointment) => appointment.id !== id));
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
      setAppointments((prev) => prev.map((appointment) => (appointment.id === id ? updated : appointment)));
      toast.success("Agendamento realocado com sucesso!");
      return updated;
    } catch (err) {
      if (!isPlanExpiredApiError(err)) {
        toast.error(resolveUiError(err, "Erro ao realocar agendamento").message);
      }
      throw err;
    }
  };

  return {
    appointments,
    isLoading,
    error,
    refetch: fetchAppointments,
    createAppointment,
    updateAppointmentStatus,
    deleteAppointment,
    reassignAppointmentProfessional,
  };
}
