import { useState, useMemo, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { PageErrorState } from '@/components/ui/page-states';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MoreVertical,
  Loader2,
  User,
  Scissors,
  DollarSign,
  Phone,
  Mail,
  FileText,
  Eye,
  Receipt,
} from 'lucide-react';
import { useAppointments, Appointment } from '@/hooks/useAppointments';
import { appointmentsApi, nfseApi, type NfseInvoice } from '@/lib/api';
import { resolveUiError } from '@/lib/error-utils';
import { useProfessionals } from '@/hooks/useProfessionals';
import { useClients } from '@/hooks/useClients';
import { useServices } from '@/hooks/useServices';
import { useAvailableSlots } from '@/hooks/useAvailableSlots';
import { useAuth } from '@/contexts/AuthContext';
import { AvailableSlotsList } from '@/components/appointments/AvailableSlotsList';
import { DeleteConfirmationDialog } from '@/components/common/DeleteConfirmationDialog';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
];

const normalizeTimeToHourMinute = (value?: string | null) => {
  if (!value) return '';
  const [hours = '', minutes = ''] = value.split(':');
  if (!hours || !minutes) return value;
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
};

const toMinutes = (time: string) => {
  const [hours = '0', minutes = '0'] = time.split(':');
  return Number(hours) * 60 + Number(minutes);
};

const toDateKey = (value: string | Date) => {
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  const directMatch = value.match(/^\d{4}-\d{2}-\d{2}/);
  if (directMatch) return directMatch[0];
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return toDateKey(parsed);
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-900 border border-amber-200 border-l-4 border-l-amber-500',
    CONFIRMED: 'bg-sky-50 text-sky-900 border border-sky-200 border-l-4 border-l-sky-500',
    IN_PROGRESS: 'bg-primary/10 text-primary border border-primary/20 border-l-4 border-l-primary',
    COMPLETED: 'bg-green-50 text-green-900 border border-green-200 border-l-4 border-l-green-500',
    CANCELLED: 'bg-red-50 text-red-900 border border-red-200 border-l-4 border-l-red-500',
    NO_SHOW: 'bg-slate-100 text-slate-600 border border-slate-200 border-l-4 border-l-slate-400',
  };
  return colors[status] || colors.PENDING;
};

const getStatusBadgeColor = (status: string) => {
  const colors: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
    CONFIRMED: 'bg-sky-100 text-sky-700 border-sky-200',
    IN_PROGRESS: 'bg-primary/10 text-primary border-primary/20',
    COMPLETED: 'bg-green-100 text-green-700 border-green-200',
    CANCELLED: 'bg-red-100 text-red-700 border-red-200',
    NO_SHOW: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return colors[status] || colors.PENDING;
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PENDING: 'Pendente',
    CONFIRMED: 'Confirmado',
    IN_PROGRESS: 'Em Atendimento',
    COMPLETED: 'Concluído',
    CANCELLED: 'Cancelado',
    NO_SHOW: 'Não Compareceu',
  };
  return labels[status] || status;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export default function Agenda() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const [dayAppointmentsFallback, setDayAppointmentsFallback] = useState<Appointment[] | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // View appointment details
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false);
  const [appointmentToReassign, setAppointmentToReassign] = useState<Appointment | null>(null);
  const [reassignProfessionalId, setReassignProfessionalId] = useState('');
  const [isReassigning, setIsReassigning] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [appointmentToDeleteId, setAppointmentToDeleteId] = useState<string | null>(null);
  const [isDeletingAppointment, setIsDeletingAppointment] = useState(false);

  // Form state
  const [newClientId, setNewClientId] = useState('');
  const [newProfessionalId, setNewProfessionalId] = useState('');
  const [newServiceId, setNewServiceId] = useState('');
  const [newDate, setNewDate] = useState(toDateKey(currentDate));
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const dateString = toDateKey(currentDate);
  const dateFilter = viewMode === 'day' ? dateString : undefined;
  const [monthlyMetrics, setMonthlyMetrics] = useState<Array<{ dia: number; mes: number; quantidadeAgendamentos: number }>>([]);
  const [isLoadingMonthlyMetrics, setIsLoadingMonthlyMetrics] = useState(false);
  const defaultAppointmentsLimit = 20;

  const {
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
  } = useAppointments({
    date: dateFilter,
    professionalId: selectedProfessional !== 'all' ? selectedProfessional : undefined,
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
  }, {
    defaultLimit: defaultAppointmentsLimit,
    enabled: viewMode === 'day',
  });
  const { professionals } = useProfessionals();
  const shouldLoadAppointmentCatalogs = isNewAppointmentOpen;
  const { clients } = useClients({ enabled: shouldLoadAppointmentCatalogs });
  const { services } = useServices({ enabled: shouldLoadAppointmentCatalogs });

  const activeProfessionals = professionals.filter(p => p.isActive);
  const canReassignAppointments = activeProfessionals.length > 1;
  const loggedProfessional = useMemo(
    () => activeProfessionals.find((p) => p.userId === user?.id) ?? null,
    [activeProfessionals, user?.id]
  );
  const isProfessionalUser = user?.role === 'PROFESSIONAL';
  const effectiveSelectedProfessional = isProfessionalUser
    ? loggedProfessional?.id || ''
    : selectedProfessional;
  const activeServices = services.filter(s => s.isActive);
  const newServiceData = useMemo(
    () => services.find((service) => service.id === newServiceId) ?? null,
    [services, newServiceId]
  );
  const {
    slots: availableSlots,
    isLoading: isLoadingAvailableSlots,
    error: availableSlotsError,
    canFetch: canFetchAvailableSlots,
  } = useAvailableSlots({
    professionalId: newProfessionalId || undefined,
    date: newDate || undefined,
    serviceDurationMinutes: newServiceData?.duration,
    bufferMinutes: 0,
  });

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    if (viewMode === 'day') {
      setDayAppointmentsFallback(null);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setDayAppointmentsFallback(null);
    setCurrentDate(new Date());
  };

  const openDayView = (date: Date, fallbackAppointments?: Appointment[]) => {
    setCurrentDate(date);
    setViewMode('day');
    setDayAppointmentsFallback(fallbackAppointments && fallbackAppointments.length ? fallbackAppointments : null);
  };

  useEffect(() => {
    if (viewMode !== 'month') return;
    let active = true;
    const loadMonthlyMetrics = async () => {
      try {
        setIsLoadingMonthlyMetrics(true);
        const data = await appointmentsApi.getMonthlyMetric(currentDate.getMonth() + 1, currentDate.getFullYear());
        if (!active) return;
        setMonthlyMetrics(data);
      } catch {
        if (!active) return;
        toast.error('Nao foi possivel carregar os totais mensais de agendamentos.');
        setMonthlyMetrics([]);
      } finally {
        if (active) setIsLoadingMonthlyMetrics(false);
      }
    };
    void loadMonthlyMetrics();
    return () => {
      active = false;
    };
  }, [currentDate, viewMode]);

  const monthCalendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstWeekday = firstDay.getDay(); // 0 Sunday ... 6 Saturday
    const leadingEmpty = (firstWeekday + 6) % 7; // Monday first
    const totalDays = lastDay.getDate();

    const days: Array<{ date: Date; key: string; day: number } | null> = [];
    for (let i = 0; i < leadingEmpty; i += 1) {
      days.push(null);
    }
    for (let day = 1; day <= totalDays; day += 1) {
      const date = new Date(year, month, day);
      days.push({
        date,
        key: toDateKey(date),
        day,
      });
    }
    return days;
  }, [currentDate]);

  const monthAppointmentsByDay = useMemo(() => {
    const map = new Map<string, number>();
    monthCalendarDays.forEach((day) => {
      if (!day) return;
      map.set(day.key, 0);
    });

    monthlyMetrics.forEach((metric) => {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), metric.dia);
      const key = toDateKey(date);
      if (!map.has(key)) return;
      map.set(key, metric.quantidadeAgendamentos);
    });
    return map;
  }, [currentDate, monthCalendarDays, monthlyMetrics]);
  const totalAppointmentsInMonth = useMemo(
    () => monthlyMetrics.reduce((sum, metric) => sum + metric.quantidadeAgendamentos, 0),
    [monthlyMetrics]
  );

  const filteredAppointments =
    viewMode === 'month'
      ? appointments.filter((appointment) => {
          const appointmentDateKey = toDateKey(appointment.date);
          return monthCalendarDays.some((day) => day?.key === appointmentDateKey);
        })
      : (() => {
          const dayItems = appointments.filter((appointment) => toDateKey(appointment.date) === dateString);
          if (dayItems.length > 0) return dayItems;
          return dayAppointmentsFallback && toDateKey(currentDate) === dateString
            ? dayAppointmentsFallback
            : [];
        })();

  const displayedTimeSlots = useMemo(() => {
    const appointmentTimes = filteredAppointments
      .map((appointment) => normalizeTimeToHourMinute(appointment.startTime))
      .filter(Boolean);
    const uniqueTimes = new Set([...timeSlots, ...appointmentTimes]);
    return Array.from(uniqueTimes).sort((left, right) => toMinutes(left) - toMinutes(right));
  }, [filteredAppointments]);

  useEffect(() => {
    if (!isProfessionalUser) return;
    if (!loggedProfessional?.id) return;
    setSelectedProfessional(loggedProfessional.id);
    setNewProfessionalId(loggedProfessional.id);
  }, [isProfessionalUser, loggedProfessional?.id]);

  useEffect(() => {
    setNewStartTime('');
    setNewEndTime('');
  }, [newDate, newProfessionalId, newServiceId]);

  useEffect(() => {
    setNewDate(toDateKey(currentDate));
  }, [currentDate]);

  const handleCreateAppointment = async () => {
    if (isSubmitting) return;
    if (!newClientId || !newProfessionalId || !newServiceId || !newDate || !newStartTime || !newEndTime) {
      toast.error('Preencha todos os campos');
      return;
    }

    const service = services.find(s => s.id === newServiceId);
    if (!service) {
      toast.error('Serviço não encontrado');
      return;
    }

    setIsSubmitting(true);
    try {
      await createAppointment({
        clientId: newClientId,
        professionalId: newProfessionalId,
        serviceId: newServiceId,
        date: newDate,
        startTime: newStartTime,
        endTime: newEndTime,
        status: 'PENDING',
        totalPrice: service.price,
      });
      
      setIsNewAppointmentOpen(false);
      // Reset form
      setNewClientId('');
      setNewProfessionalId('');
      setNewServiceId('');
      setNewStartTime('');
      setNewEndTime('');
    } catch (error) {
      // Error is handled in the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (appointmentId: string, newStatus: Appointment['status']) => {
    try {
      await updateAppointmentStatus(appointmentId, newStatus);
      // Update selected appointment if it's the one being changed
      if (selectedAppointment?.id === appointmentId) {
        setSelectedAppointment(prev => prev ? { ...prev, status: newStatus } : null);
      }

      if (newStatus === 'COMPLETED') {
        const appointment =
          appointments.find((apt) => apt.id === appointmentId) ??
          (selectedAppointment?.id === appointmentId ? selectedAppointment : null);
        if (appointment) {
          await handleNfseOnAppointmentCompleted(appointment);
        }
      }
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleNfseOnAppointmentCompleted = async (appointment: Appointment) => {
    try {
      const config = await nfseApi.getConfig('HOMOLOGACAO');
      if (config.emissionMode === 'MANUAL') return;

      const client = appointment.client ?? clients.find((item) => item.id === appointment.clientId);
      const service = appointment.service ?? services.find((item) => item.id === appointment.serviceId);
      const customerDocument = (client as { document?: string } | undefined)?.document || '';
      const customerType = customerDocument.length > 11 ? 'CNPJ' : 'CPF';

      const prefill: Partial<NfseInvoice> = {
        appointmentId: appointment.id,
        ambiente: config.ambiente,
        municipioCodigoIbge: config.municipioCodigoIbge,
        provedor: config.provedor,
        serieRps: config.serieRps,
        numeroRps: Date.now(),
        dataCompetencia: toDateKey(appointment.date),
        naturezaOperacao: 'Prestacao de servico',
        itemListaServico: config.itemListaServicoPadrao,
        valorServicos: Number(appointment.totalPrice || 0),
        valorDeducoes: 0,
        valorIss: Number(appointment.totalPrice || 0) * (Number(config.aliquotaIssPadrao || 0) / 100),
        aliquotaIss: Number(config.aliquotaIssPadrao || 0),
        issRetido: false,
        customer: {
          type: customerType,
          document: customerDocument,
          name: client?.name || 'Consumidor final',
          email: client?.email || '',
          phone: client?.phone || '',
        },
        items: [
          {
            lineNumber: 1,
            descricaoServico: service?.name || 'Servico',
            quantidade: 1,
            valorUnitario: Number(appointment.totalPrice || 0),
            valorTotal: Number(appointment.totalPrice || 0),
            itemListaServico: config.itemListaServicoPadrao,
            aliquotaIss: Number(config.aliquotaIssPadrao || 0),
            valorIss: Number(appointment.totalPrice || 0) * (Number(config.aliquotaIssPadrao || 0) / 100),
          },
        ],
      };
      sessionStorage.setItem('nfseDraftPrefill', JSON.stringify(prefill));

      if (config.emissionMode === 'ASK_ON_CLOSE') {
        const shouldOpen = window.confirm(
          'Atendimento concluido. Deseja abrir a emissao da NFS-e agora?'
        );
        if (!shouldOpen) return;
      }

      toast.info('Fluxo NFS-e preparado a partir do agendamento concluido.');
      navigate(`/fiscal/nfse/nova?appointmentId=${encodeURIComponent(appointment.id)}`);
    } catch (error) {
      const uiError = resolveUiError(error, 'Nao foi possivel preparar a emissao automatica de NFS-e.');
      const prefix = uiError.code ? `[${uiError.code}] ` : '';
      toast.warning(`${prefix}${uiError.message}`);
    }
  };

  const openDeleteAppointmentDialog = (appointmentId: string) => {
    setAppointmentToDeleteId(appointmentId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDeleteAppointment = async () => {
    if (isDeletingAppointment) return;
    if (!appointmentToDeleteId) return;
    setIsDeletingAppointment(true);
    try {
      await deleteAppointment(appointmentToDeleteId);
      if (selectedAppointment?.id === appointmentToDeleteId) {
        setIsViewDetailsOpen(false);
        setSelectedAppointment(null);
      }
      setIsDeleteDialogOpen(false);
      setAppointmentToDeleteId(null);
    } catch (error) {
      // Error is handled in the hook
    } finally {
      setIsDeletingAppointment(false);
    }
  };

  const openReassignDialog = (appointment: Appointment) => {
    if (isProfessionalUser || !canReassignAppointments) return;
    setAppointmentToReassign(appointment);
    setReassignProfessionalId('');
    setIsReassignDialogOpen(true);
  };

  const handleReassignAppointment = async () => {
    if (!appointmentToReassign?.id || !reassignProfessionalId) {
      toast.error('Selecione o novo profissional');
      return;
    }

    setIsReassigning(true);
    try {
      const updated = await reassignAppointmentProfessional(
        appointmentToReassign.id,
        reassignProfessionalId
      );
      if (selectedAppointment?.id === updated.id) {
        setSelectedAppointment(updated);
      }
      setIsReassignDialogOpen(false);
      setAppointmentToReassign(null);
      setReassignProfessionalId('');
    } catch (error) {
      // Error is handled in the hook
    } finally {
      setIsReassigning(false);
    }
  };

  const openAppointmentDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsViewDetailsOpen(true);
  };

  const handleViewInvoice = () => {
    if (selectedAppointment) {
      // Store appointment data in sessionStorage for invoice preview
      sessionStorage.setItem('invoiceAppointment', JSON.stringify({
        appointment: selectedAppointment,
        client: selectedClient,
        service: selectedService,
        professional: selectedProfessionalData,
      }));
      navigate('/nota-fiscal');
    }
  };

  const formattedDate =
    viewMode === 'day'
      ? currentDate.toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })
      : viewMode === 'month'
      ? currentDate.toLocaleDateString('pt-BR', {
          month: 'long',
          year: 'numeric',
        })
      : '';

  const findClientByAppointment = (appointment: Appointment) =>
    appointment.client ?? clients.find((client) => client.id === appointment.clientId) ?? null;
  const findServiceByAppointment = (appointment: Appointment) =>
    appointment.service ?? services.find((service) => service.id === appointment.serviceId) ?? null;

  // Get details for selected appointment
  const selectedClient = selectedAppointment ? findClientByAppointment(selectedAppointment) : null;
  const selectedProfessionalData = selectedAppointment ? professionals.find(p => p.id === selectedAppointment.professionalId) : null;
  const selectedService = selectedAppointment ? findServiceByAppointment(selectedAppointment) : null;
  const reassignTargetProfessionals = useMemo(() => {
    if (!appointmentToReassign) return [];
    return activeProfessionals.filter((prof) => prof.id !== appointmentToReassign.professionalId);
  }, [activeProfessionals, appointmentToReassign]);

  if (isLoading) {
    return (
      <MainLayout title="Agenda" subtitle="Gerencie seus agendamentos">
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Agenda" subtitle="Gerencie seus agendamentos">
        <PageErrorState
          title="Nao foi possivel carregar a agenda"
          description={error}
          action={{ label: 'Tentar novamente', onClick: refetch }}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Agenda" subtitle="Gerencie seus agendamentos">
      <div className="space-y-4 sm:space-y-6">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="outline" size="icon" onClick={() => navigateDate('prev')} className="h-8 w-8 sm:h-9 sm:w-9">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday} className="text-xs sm:text-sm">
              Hoje
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigateDate('next')} className="h-8 w-8 sm:h-9 sm:w-9">
              <ChevronRight className="w-4 h-4" />
            </Button>
            <span className="text-xs sm:text-base font-medium text-foreground capitalize truncate">
              {formattedDate}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {!isProfessionalUser ? (
              <Select
                value={effectiveSelectedProfessional || selectedProfessional}
                onValueChange={setSelectedProfessional}
              >
                <SelectTrigger className="w-36 sm:w-44 h-8 sm:h-9 text-xs sm:text-sm">
                  <SelectValue placeholder="Profissional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {activeProfessionals.map((prof) => (
                    <SelectItem key={prof.id} value={prof.id}>
                      {prof.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="h-8 sm:h-9 min-w-36 sm:min-w-44 rounded-md border bg-muted/40 px-3 flex items-center text-xs sm:text-sm text-muted-foreground">
                {loggedProfessional?.name || "Profissional logado"}
              </div>
            )}

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-36 sm:w-44 h-8 sm:h-9 text-xs sm:text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                <SelectItem value="PENDING">Pendente</SelectItem>
                <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                <SelectItem value="IN_PROGRESS">Em atendimento</SelectItem>
                <SelectItem value="COMPLETED">Concluido</SelectItem>
                <SelectItem value="CANCELLED">Cancelado</SelectItem>
                <SelectItem value="NO_SHOW">Nao compareceu</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'day' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => {
                  setViewMode('day');
                  setDayAppointmentsFallback(null);
                }}
                className="rounded-none text-xs sm:text-sm h-8 sm:h-9"
              >
                Dia
              </Button>
              <Button
                variant={viewMode === 'month' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('month')}
                className="rounded-none text-xs sm:text-sm h-8 sm:h-9"
              >
                Mensal
              </Button>
            </div>

            <Dialog open={isNewAppointmentOpen} onOpenChange={setIsNewAppointmentOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1 sm:gap-2 h-8 sm:h-9 text-xs sm:text-sm">
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Novo</span> Agendamento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md mx-4 sm:mx-auto max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Novo Agendamento</DialogTitle>
                  <DialogDescription>
                    Preencha os dados para criar um novo agendamento
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Cliente</Label>
                    <Select value={newClientId} onValueChange={setNewClientId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Serviço</Label>
                    <Select value={newServiceId} onValueChange={setNewServiceId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o serviço" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeServices.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name} - {formatCurrency(service.price)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Profissional</Label>
                    <Select
                      value={isProfessionalUser ? (loggedProfessional?.id || newProfessionalId) : newProfessionalId}
                      onValueChange={setNewProfessionalId}
                      disabled={isProfessionalUser}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o profissional" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeProfessionals.map((prof) => (
                          <SelectItem key={prof.id} value={prof.id}>
                            {prof.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Data</Label>
                    <Input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Horários sugeridos</Label>
                    <AvailableSlotsList
                      slots={availableSlots}
                      isLoading={isLoadingAvailableSlots}
                      error={availableSlotsError}
                      canFetch={canFetchAvailableSlots}
                      selectedStartTime={newStartTime}
                      onSelect={(slot) => {
                        setNewStartTime(slot.startTime);
                        setNewEndTime(slot.endTime);
                      }}
                    />
                    {newStartTime && newEndTime ? (
                      <p className="text-xs text-muted-foreground">
                        Selecionado: {newStartTime} - {newEndTime}
                      </p>
                    ) : null}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsNewAppointmentOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateAppointment}
                    disabled={isSubmitting || !newStartTime || !newEndTime}
                    isLoading={isSubmitting}
                    loadingText="Criando..."
                  >
                    Criar Agendamento
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Calendar Grid */}
        {viewMode === 'month' ? (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground capitalize">
                  {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </p>
                <Badge variant="outline">{totalAppointmentsInMonth} agendamento(s)</Badge>
              </div>

              <div className="grid grid-cols-7 gap-2 text-xs text-muted-foreground uppercase">
                <span>Seg</span>
                <span>Ter</span>
                <span>Qua</span>
                <span>Qui</span>
                <span>Sex</span>
                <span>Sab</span>
                <span>Dom</span>
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {monthCalendarDays.map((day, index) => {
                  if (!day) return <div key={`empty-${index}`} className="min-h-[72px] sm:min-h-24" />;
                  const apptCount = monthAppointmentsByDay.get(day.key) || 0;
                  const isToday = day.key === toDateKey(new Date());
                  return (
                    <button
                      key={day.key}
                      type="button"
                      className={`h-auto min-h-[72px] sm:min-h-24 w-full p-2 text-left rounded-lg border transition-all duration-150 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
                        isToday
                          ? 'border-primary bg-primary/5'
                          : apptCount > 0
                            ? 'border-border bg-card hover:bg-accent/40 hover:border-primary/30'
                            : 'border-dashed border-border/50 bg-transparent hover:bg-muted/30 hover:border-border'
                      }`}
                      onClick={() => openDayView(day.date)}
                    >
                      <div className="flex flex-col gap-1.5">
                        <span className={`text-sm font-semibold leading-none ${isToday ? 'text-primary' : ''}`}>
                          {day.day}
                        </span>
                        {apptCount > 0 ? (
                          <span className="inline-flex items-center self-start text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary leading-none">
                            {apptCount}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-muted-foreground">
                Clique em um dia para abrir a grade por horario.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              {filteredAppointments.length === 0 ? (
                <div className="px-4 py-3 text-xs text-muted-foreground border-b border-border/50 bg-muted/20 flex items-center gap-2">
                  <CalendarIcon className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground/60" />
                  <span>Nenhum agendamento neste dia.</span>
                </div>
              ) : null}
              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                {/* Time slots header */}
                <div className="grid grid-cols-[60px_1fr] sm:grid-cols-[80px_1fr] border-b">
                  <div className="p-2 sm:p-3 bg-muted/40 border-r">
                    <Clock className="w-4 h-4 text-muted-foreground mx-auto" />
                  </div>
                  <div className="p-2 sm:p-3 bg-muted/40">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-primary" />
                      <span className="font-medium text-sm capitalize">{formattedDate}</span>
                    </div>
                  </div>
                </div>

                {/* Time slots */}
                <div className="divide-y max-h-[500px] sm:max-h-[600px] overflow-y-auto">
                  {displayedTimeSlots.map((time) => {
                    const slotAppointments = filteredAppointments.filter(
                      (apt) => normalizeTimeToHourMinute(apt.startTime) === time
                    );

                    return (
                      <div key={time} className="grid grid-cols-[60px_1fr] sm:grid-cols-[80px_1fr] min-h-[60px] sm:min-h-[70px]">
                        <div className="p-2 sm:p-3 bg-muted/40 border-r text-xs sm:text-sm text-muted-foreground font-medium">
                          {time}
                        </div>
                        <div className="p-1 sm:p-2">
                          {slotAppointments.map((apt) => {
                            const client = findClientByAppointment(apt);
                            const professional = professionals.find(p => p.id === apt.professionalId);
                            const service = findServiceByAppointment(apt);

                            return (
                              <div
                                key={apt.id}
                                className={`p-2 sm:p-3 rounded-lg ${getStatusColor(apt.status)} mb-1.5 cursor-pointer hover:shadow-md hover:-translate-y-px transition-all duration-150`}
                                onClick={() => openAppointmentDetails(apt)}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-2 min-w-0 flex-1">
                                    <Avatar className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 mt-0.5">
                                      <AvatarImage src={professional?.avatar} />
                                      <AvatarFallback className="text-xs font-medium">
                                        {client?.name?.slice(0, 2).toUpperCase() ?? '??'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                      <p className="font-semibold text-xs sm:text-sm leading-tight truncate">
                                        {client?.name || 'Cliente'}
                                      </p>
                                      <p className="text-[10px] sm:text-xs leading-tight truncate mt-0.5 opacity-80">
                                        {service?.name}
                                      </p>
                                      <p className="text-[10px] opacity-60 truncate leading-tight hidden sm:block">
                                        {professional?.name}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <span className="text-[9px] sm:text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-black/5 whitespace-nowrap hidden sm:block">
                                      {getStatusLabel(apt.status)}
                                    </span>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-6 w-6 sm:h-7 sm:w-7"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openAppointmentDetails(apt);
                                      }}
                                    >
                                      <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </Button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-6 w-6 sm:h-7 sm:w-7"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <MoreVertical className="w-3 h-3 sm:w-4 sm:h-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleStatusChange(apt.id, 'CONFIRMED')}>
                                          Confirmar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleStatusChange(apt.id, 'IN_PROGRESS')}>
                                          Iniciar Atendimento
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleStatusChange(apt.id, 'COMPLETED')}>
                                          Concluir
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleStatusChange(apt.id, 'NO_SHOW')}>
                                          Não Compareceu
                                        </DropdownMenuItem>
                                        {!isProfessionalUser && canReassignAppointments && (
                                          <DropdownMenuItem onClick={() => openReassignDialog(apt)}>
                                            Realocar profissional
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem 
                                          className="text-red-600"
                                          onClick={() => handleStatusChange(apt.id, 'CANCELLED')}
                                        >
                                          Cancelar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          className="text-red-600"
                                          onClick={() => openDeleteAppointmentDialog(apt.id)}
                                        >
                                          Excluir
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {Math.ceil(pagination.total / pagination.limit) > 1 ? (
          <div className="flex items-center justify-between gap-3 border rounded-lg p-3 bg-muted/20">
            <p className="text-sm text-muted-foreground">
              Pagina {pagination.page} de {Math.max(1, Math.ceil(pagination.total / pagination.limit))}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(pagination.page - 1)}
                disabled={pagination.page <= 1 || isLoading}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(pagination.page + 1)}
                disabled={!pagination.hasMore || isLoading}
              >
                Proxima
              </Button>
            </div>
          </div>
        ) : null}

        <Dialog open={isReassignDialogOpen} onOpenChange={setIsReassignDialogOpen}>
          <DialogContent className="max-w-md mx-4 sm:mx-auto max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Realocar Agendamento</DialogTitle>
              <DialogDescription>
                Selecione o novo profissional para este agendamento.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label className="text-sm">Novo profissional</Label>
              <Select value={reassignProfessionalId} onValueChange={setReassignProfessionalId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o profissional" />
                </SelectTrigger>
                <SelectContent>
                  {reassignTargetProfessionals.map((prof) => (
                    <SelectItem key={prof.id} value={prof.id}>
                      {prof.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsReassignDialogOpen(false);
                  setAppointmentToReassign(null);
                  setReassignProfessionalId('');
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleReassignAppointment}
                disabled={isReassigning || !reassignProfessionalId}
              >
                {isReassigning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Realocando...
                  </>
                ) : (
                  'Confirmar realocacao'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Appointment Details Sheet */}
        <Sheet open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Detalhes do Agendamento</SheetTitle>
              <SheetDescription>
                Informações completas do agendamento
              </SheetDescription>
            </SheetHeader>

            {selectedAppointment && (
              <div className="mt-6 space-y-6">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge className={getStatusBadgeColor(selectedAppointment.status)}>
                    {getStatusLabel(selectedAppointment.status)}
                  </Badge>
                </div>

                <Separator />

                {/* Date and Time */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-primary" />
                    Data e Horário
                  </h4>
                  <div className="bg-muted/40 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Data:</span>
                      <span className="font-medium">
                        {new Date(selectedAppointment.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Horário:</span>
                      <span className="font-medium">
                        {selectedAppointment.startTime} - {selectedAppointment.endTime}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Client Info */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Cliente
                  </h4>
                  {selectedClient && (
                    <div className="bg-muted/40 rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-primary/15 text-primary">
                            {selectedClient.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{selectedClient.name}</p>
                          <p className="text-xs text-muted-foreground">Cliente desde {new Date(selectedClient.createdAt).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      {selectedClient.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span>{selectedClient.phone}</span>
                        </div>
                      )}
                      {selectedClient.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span>{selectedClient.email}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Service Info */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-primary" />
                    Serviço
                  </h4>
                  {selectedService && (
                    <div className="bg-muted/40 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{selectedService.name}</span>
                        <Badge variant="outline">{selectedService.category}</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Duração:</span>
                        <span>{selectedService.duration} minutos</span>
                      </div>
                      {selectedService.description && (
                        <p className="text-sm text-muted-foreground mt-2">{selectedService.description}</p>
                      )}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Professional Info */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Profissional
                  </h4>
                  {selectedProfessionalData && (
                    <div className="bg-muted/40 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={selectedProfessionalData.avatar} />
                          <AvatarFallback className="bg-primary/15 text-primary">
                            {selectedProfessionalData.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{selectedProfessionalData.name}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedProfessionalData.specialties.slice(0, 3).map((spec, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {spec}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Price */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    Valor
                  </h4>
                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total:</span>
                      <span className="text-2xl font-bold text-primary">
                        {formatCurrency(selectedAppointment.totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedAppointment.notes && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        Observações
                      </h4>
                      <div className="bg-muted/40 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">{selectedAppointment.notes}</p>
                      </div>
                    </div>
                  </>
                )}

                {/* Invoice Preview Button */}
                {selectedAppointment.status === 'COMPLETED' && (
                  <>
                    <Separator />
                    <Button 
                      className="w-full"
                      onClick={handleViewInvoice}
                    >
                      <Receipt className="w-4 h-4 mr-2" />
                      Ver Pré-visualização da Nota Fiscal
                    </Button>
                  </>
                )}

                {/* Actions */}
                <div className="pt-4 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {selectedAppointment.status === 'PENDING' && (
                      <Button 
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleStatusChange(selectedAppointment.id, 'CONFIRMED')}
                      >
                        Confirmar
                      </Button>
                    )}
                    {selectedAppointment.status === 'CONFIRMED' && (
                      <Button 
                        className=""
                        onClick={() => handleStatusChange(selectedAppointment.id, 'IN_PROGRESS')}
                      >
                        Iniciar
                      </Button>
                    )}
                    {selectedAppointment.status === 'IN_PROGRESS' && (
                      <Button 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleStatusChange(selectedAppointment.id, 'COMPLETED')}
                      >
                        Concluir
                      </Button>
                    )}
                    {!['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(selectedAppointment.status) && (
                      <Button 
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleStatusChange(selectedAppointment.id, 'CANCELLED')}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                  <Button 
                    variant="destructive"
                    className="w-full"
                    onClick={() => openDeleteAppointmentDialog(selectedAppointment.id)}
                  >
                    Excluir Agendamento
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>

        <DeleteConfirmationDialog
          open={isDeleteDialogOpen}
          isLoading={isDeletingAppointment}
          title="Excluir agendamento?"
          description="Você tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita."
          cancelLabel="Cancel"
          confirmLabel="Confirm Delete"
          loadingLabel="Excluindo..."
          onOpenChange={(open) => {
            if (isDeletingAppointment) return;
            setIsDeleteDialogOpen(open);
            if (!open) setAppointmentToDeleteId(null);
          }}
          onConfirm={handleConfirmDeleteAppointment}
        />
      </div>
    </MainLayout>
  );
}


