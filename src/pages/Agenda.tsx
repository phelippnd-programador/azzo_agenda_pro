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
import { PageEmptyState, PageErrorState } from '@/components/ui/page-states';
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
import { useProfessionals } from '@/hooks/useProfessionals';
import { useClients } from '@/hooks/useClients';
import { useServices } from '@/hooks/useServices';
import { useAvailableSlots } from '@/hooks/useAvailableSlots';
import { useAuth } from '@/contexts/AuthContext';
import { AvailableSlotsList } from '@/components/appointments/AvailableSlotsList';
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

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
    CONFIRMED: 'bg-blue-100 text-blue-700 border-blue-200',
    IN_PROGRESS: 'bg-primary/15 text-primary border-primary/30',
    COMPLETED: 'bg-green-100 text-green-700 border-green-200',
    CANCELLED: 'bg-red-100 text-red-700 border-red-200',
    NO_SHOW: 'bg-muted text-muted-foreground border-border',
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
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
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

  // Form state
  const [newClientId, setNewClientId] = useState('');
  const [newProfessionalId, setNewProfessionalId] = useState('');
  const [newServiceId, setNewServiceId] = useState('');
  const [newDate, setNewDate] = useState(currentDate.toISOString().split('T')[0]);
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const dateString = currentDate.toISOString().split('T')[0];

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
    date: dateString,
    professionalId: selectedProfessional !== 'all' ? selectedProfessional : undefined,
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
  });
  const { professionals } = useProfessionals();
  const { clients } = useClients();
  const { services } = useServices();

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
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const filteredAppointments = appointments;

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

  const handleCreateAppointment = async () => {
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
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    try {
      await deleteAppointment(appointmentId);
      setIsViewDetailsOpen(false);
      setSelectedAppointment(null);
    } catch (error) {
      // Error is handled in the hook
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

  const formattedDate = currentDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  // Get details for selected appointment
  const selectedClient = selectedAppointment ? clients.find(c => c.id === selectedAppointment.clientId) : null;
  const selectedProfessionalData = selectedAppointment ? professionals.find(p => p.id === selectedAppointment.professionalId) : null;
  const selectedService = selectedAppointment ? services.find(s => s.id === selectedAppointment.serviceId) : null;
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
            <span className="text-sm sm:text-lg font-medium text-foreground capitalize truncate">
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
                onClick={() => setViewMode('day')}
                className="rounded-none text-xs sm:text-sm h-8 sm:h-9"
              >
                Dia
              </Button>
              <Button
                variant={viewMode === 'week' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('week')}
                className="rounded-none text-xs sm:text-sm h-8 sm:h-9"
              >
                Semana
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
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      'Criar Agendamento'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Calendar Grid */}
        {filteredAppointments.length === 0 ? (
          <PageEmptyState
            title="Nenhum agendamento para este filtro"
            description="Altere a data, os filtros ou crie um novo agendamento."
          />
        ) : (
        <Card>
          <CardContent className="p-0">
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
                            const client = clients.find(c => c.id === apt.clientId);
                            const professional = professionals.find(p => p.id === apt.professionalId);
                            const service = services.find(s => s.id === apt.serviceId);

                            return (
                              <div
                                key={apt.id}
                                className={`p-2 sm:p-3 rounded-lg border ${getStatusColor(apt.status)} mb-1 cursor-pointer hover:shadow-md transition-shadow`}
                                onClick={() => openAppointmentDetails(apt)}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <Avatar className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0">
                                      <AvatarImage src={professional?.avatar} />
                                      <AvatarFallback className="text-xs">
                                        {client?.name?.slice(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                      <p className="font-medium text-xs sm:text-sm truncate">
                                        {client?.name || 'Cliente'}
                                      </p>
                                      <p className="text-[10px] sm:text-xs opacity-80 truncate">
                                        {service?.name} • {professional?.name}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <Badge variant="outline" className="text-[10px] sm:text-xs hidden sm:inline-flex">
                                      {getStatusLabel(apt.status)}
                                    </Badge>
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
                                          onClick={() => handleDeleteAppointment(apt.id)}
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
                  <Badge className={getStatusColor(selectedAppointment.status)}>
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
                    onClick={() => handleDeleteAppointment(selectedAppointment.id)}
                  >
                    Excluir Agendamento
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </MainLayout>
  );
}


