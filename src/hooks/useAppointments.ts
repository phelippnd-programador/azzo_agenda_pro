import { useState, useEffect, useCallback } from "react";
import { appointmentsApi, type Appointment, isPlanExpiredApiError } from "@/lib/api";
import { toast } from "sonner";

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await appointmentsApi.getAll();
      setAppointments(data);
      setError(null);
    } catch (err) {
      if (isPlanExpiredApiError(err)) {
        setError(null);
        return;
      }
      setError("Erro ao carregar agendamentos");
      toast.error("Erro ao carregar agendamentos");
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
        toast.error("Erro ao criar agendamento");
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
        toast.error("Erro ao atualizar status");
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
        toast.error("Erro ao excluir agendamento");
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
        toast.error("Erro ao realocar agendamento");
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
