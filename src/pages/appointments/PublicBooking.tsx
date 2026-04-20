import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, ChevronLeft, ChevronRight, Loader2, Scissors } from 'lucide-react';
import {
  appointmentsApi,
  Professional,
  professionalsApi,
  publicBookingApi,
  salonApi,
  Service,
  servicesApi,
} from '@/lib/api';
import { resolveUiError } from '@/lib/error-utils';
import { toast } from 'sonner';
import { BookingCustomerStep } from '@/components/public-booking/BookingCustomerStep';
import { BookingDateTimeStep } from '@/components/public-booking/BookingDateTimeStep';
import { BookingProfessionalStep } from '@/components/public-booking/BookingProfessionalStep';
import { BookingServiceStep } from '@/components/public-booking/BookingServiceStep';
import { BookingSuccessScreen } from '@/components/public-booking/BookingSuccessScreen';
import { BookingSummaryCard } from '@/components/public-booking/BookingSummaryCard';

const BOOKING_STEPS = [
  {
    id: 1,
    eyebrow: 'Passo 1',
    title: 'Escolha os servicos',
    description: 'Monte o atendimento antes de escolher profissional e horario.',
  },
  {
    id: 2,
    eyebrow: 'Passo 2',
    title: 'Escolha quem vai atender',
    description: 'Mostramos apenas os profissionais compativeis com os servicos selecionados.',
  },
  {
    id: 3,
    eyebrow: 'Passo 3',
    title: 'Escolha data e horario',
    description: 'Selecione um horario realmente disponivel para concluir o agendamento.',
  },
  {
    id: 4,
    eyebrow: 'Passo 4',
    title: 'Confirme seus dados',
    description: 'Finalize o agendamento com seu nome e WhatsApp.',
  },
];

export default function PublicBooking() {
  const { slug } = useParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProfessionals, setIsLoadingProfessionals] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');
  const [servicePage, setServicePage] = useState(1);
  const [salonName, setSalonName] = useState('Agende seu horario');
  const [salonLogoUrl, setSalonLogoUrl] = useState<string | null>(null);

  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);

  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

  const servicePageSize = 10;

  const currentStepMeta = BOOKING_STEPS[currentStep - 1];
  const progressPercent = (currentStep / BOOKING_STEPS.length) * 100;

  const formatDateParam = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        if (slug) {
          const salonProfile = await salonApi.getPublicBySlug(slug);
          setSalonName(salonProfile.salonName?.trim() || 'Agende seu horario');
          setSalonLogoUrl(salonProfile.logoUrl || salonProfile.logo || null);
        } else {
          setSalonName('Agende seu horario');
          setSalonLogoUrl(null);
        }

        const servicesResponse = slug
          ? await publicBookingApi.getServices(slug)
          : await servicesApi.getAll();
        const availableServices = Array.isArray(servicesResponse)
          ? servicesResponse
          : servicesResponse.items || [];

        setServices(availableServices.filter((service) => service.isActive));
        setProfessionals([]);
      } catch (error) {
        toast.error(resolveUiError(error, 'Erro ao carregar dados').message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [slug]);

  useEffect(() => {
    if (!slug || !selectedDate) return;

    const date = formatDateParam(selectedDate);
    setIsLoadingAvailability(true);

    publicBookingApi
      .getAvailability({
        slug,
        date,
        serviceIds: selectedServiceIds,
        professionalId: selectedProfessional || undefined,
      })
      .then((data) => {
        const slots = (data.slots || [])
          .filter((slot) => slot.available)
          .map((slot) => slot.time);
        setAvailableSlots(slots);
        setSelectedTime((prev) => (prev && slots.includes(prev) ? prev : null));
      })
      .catch(() => {
        setAvailableSlots([]);
        setSelectedTime(null);
      })
      .finally(() => setIsLoadingAvailability(false));
  }, [slug, selectedDate, selectedServiceIds, selectedProfessional]);

  const selectedServicesData = useMemo(
    () => services.filter((service) => selectedServiceIds.includes(service.id)),
    [services, selectedServiceIds]
  );

  const filteredServices = useMemo(() => {
    const normalizedSearch = serviceSearch.trim().toLowerCase();
    if (!normalizedSearch) return services;

    return services.filter((service) => service.name.toLowerCase().includes(normalizedSearch));
  }, [services, serviceSearch]);

  const totalServicePages = useMemo(
    () => Math.max(1, Math.ceil(filteredServices.length / servicePageSize)),
    [filteredServices.length]
  );

  const paginatedServices = useMemo(() => {
    const start = (servicePage - 1) * servicePageSize;
    return filteredServices.slice(start, start + servicePageSize);
  }, [filteredServices, servicePage]);

  const selectedServiceDuration = useMemo(
    () => selectedServicesData.reduce((sum, service) => sum + Number(service.duration || 0), 0),
    [selectedServicesData]
  );

  const selectedServiceTotal = useMemo(
    () => selectedServicesData.reduce((sum, service) => sum + Number(service.price || 0), 0),
    [selectedServicesData]
  );

  const selectedProfessionalData = useMemo(
    () => professionals.find((professional) => professional.id === selectedProfessional),
    [professionals, selectedProfessional]
  );

  useEffect(() => {
    setServicePage(1);
  }, [serviceSearch]);

  useEffect(() => {
    setServicePage((current) => Math.min(current, totalServicePages));
  }, [totalServicePages]);

  const loadProfessionalsForServices = async (serviceIds: string[]) => {
    setIsLoadingProfessionals(true);
    try {
      if (slug) {
        const data = await publicBookingApi.getProfessionals(
          slug,
          serviceIds.length === 1 ? serviceIds[0] : undefined,
          serviceIds
        );
        const active = data.filter((professional) => professional.isActive);
        setProfessionals(active);
        setSelectedProfessional((prev) =>
          prev && active.some((professional) => professional.id === prev) ? prev : null
        );
        return;
      }

      const professionalsResponse = await professionalsApi.getAll();
      const availableProfessionals = Array.isArray(professionalsResponse)
        ? professionalsResponse
        : professionalsResponse.items || [];
      const active = availableProfessionals.filter((professional) => professional.isActive);
      const selectedServices = services.filter((service) => serviceIds.includes(service.id));
      const restrictedGroups = selectedServices
        .map((service) => service.professionalIds || [])
        .filter((ids) => ids.length > 0);
      const filtered = restrictedGroups.length
        ? active.filter((professional) =>
            restrictedGroups.every((ids) => ids.includes(professional.id))
          )
        : active;

      setProfessionals(filtered);
      setSelectedProfessional((prev) =>
        prev && filtered.some((professional) => professional.id === prev) ? prev : null
      );
    } catch (error) {
      setProfessionals([]);
      setSelectedProfessional(null);
      toast.error(resolveUiError(error, 'Erro ao carregar profissionais').message);
    } finally {
      setIsLoadingProfessionals(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const isDateSelectable = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today && date.getDay() !== 0;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentMonth(newMonth);
  };

  const getFirstSelectableDate = () => {
    const firstAvailable = getDaysInMonth().find((date) => isDateSelectable(date));
    return firstAvailable ?? null;
  };

  const handleNextStep = async () => {
    if (currentStep === 1 && selectedServiceIds.length) {
      await loadProfessionalsForServices(selectedServiceIds);
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2 && !selectedDate) {
      const defaultDate = getFirstSelectableDate();
      if (defaultDate) setSelectedDate(defaultDate);
    }

    setCurrentStep(currentStep + 1);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedServiceIds.length > 0 && !isLoadingProfessionals;
      case 2:
        return selectedProfessional !== null;
      case 3:
        if (!selectedDate || !selectedTime) return false;
        if (!slug) return true;
        return availableSlots.includes(selectedTime);
      case 4:
        return customerName.trim() !== '' && customerPhone.trim() !== '';
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (
      !selectedServiceIds.length ||
      !selectedProfessional ||
      !selectedDate ||
      !selectedTime ||
      !selectedServicesData.length
    ) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (slug && !availableSlots.includes(selectedTime)) {
      toast.error('Horario indisponivel. Selecione outro horario e tente novamente.');
      return;
    }

    setIsSubmitting(true);
    try {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const endDate = new Date();
      endDate.setHours(hours, minutes + selectedServiceDuration);
      const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;

      if (slug) {
        await publicBookingApi.createAppointment(slug, {
          customerName,
          customerPhone,
          customerEmail,
          professionalId: selectedProfessional,
          serviceId: selectedServiceIds.length === 1 ? selectedServiceIds[0] : undefined,
          items: selectedServiceIds.map((serviceId) => ({
            serviceId,
            quantity: 1,
          })),
          date: formatDateParam(selectedDate),
          startTime: selectedTime,
        });
      } else {
        await appointmentsApi.create({
          clientId: `public_${Date.now()}`,
          professionalId: selectedProfessional,
          date: formatDateParam(selectedDate),
          startTime: selectedTime,
          endTime,
          status: 'PENDING',
          totalPrice: selectedServiceTotal,
          items: selectedServicesData.map((service) => ({
            serviceId: service.id,
            durationMinutes: service.duration,
            unitPrice: service.price,
            totalPrice: service.price,
          })),
          notes: `Cliente: ${customerName} | Tel: ${customerPhone} | Email: ${customerEmail}`,
        });
      }

      setBookingComplete(true);
      toast.success('Agendamento realizado com sucesso!');
    } catch (error) {
      toast.error(resolveUiError(error, 'Erro ao realizar agendamento').message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectService = (serviceId: string, checked: boolean) => {
    setSelectedServiceIds((current) =>
      checked
        ? [...current, serviceId]
        : current.filter((currentServiceId) => currentServiceId !== serviceId)
    );
    setSelectedProfessional(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setAvailableSlots([]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe,transparent_35%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4">
        <div className="mx-auto max-w-6xl">
          <Skeleton className="mb-6 h-28 w-full rounded-3xl" />
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <Skeleton className="h-[34rem] w-full rounded-3xl" />
            <Skeleton className="hidden h-80 w-full rounded-3xl lg:block" />
          </div>
        </div>
      </div>
    );
  }

  if (bookingComplete) {
    return (
      <BookingSuccessScreen
        selectedServicesData={selectedServicesData}
        selectedProfessionalData={selectedProfessionalData}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        selectedServiceTotal={selectedServiceTotal}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe,transparent_35%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[2rem] border border-border/70 bg-background/90 p-5 shadow-sm backdrop-blur sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              {salonLogoUrl ? (
                <img
                  src={salonLogoUrl}
                  alt={`Logo do salao ${salonName}`}
                  className="h-16 w-16 rounded-2xl border border-border bg-background object-cover shadow-sm sm:h-20 sm:w-20"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-sm sm:h-20 sm:w-20">
                  <Scissors className="h-7 w-7 text-white sm:h-8 sm:w-8" />
                </div>
              )}

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  Agendamento online
                </p>
                <h1 className="mt-1 text-2xl font-semibold text-foreground sm:text-3xl">
                  {salonName}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                  Escolha servicos, profissional e horario em um fluxo simples para celular e desktop.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Etapa atual</p>
              <p className="text-sm font-semibold text-foreground">{currentStepMeta.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{currentStepMeta.description}</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  {currentStepMeta.eyebrow}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Etapa {currentStep} de {BOOKING_STEPS.length}
                </p>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {Math.round(progressPercent)}%
              </p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-border/70">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="mt-4 hidden gap-3 sm:grid sm:grid-cols-4">
              {BOOKING_STEPS.map((step) => {
                const isDone = currentStep > step.id;
                const isCurrent = currentStep === step.id;

                return (
                  <div
                    key={step.id}
                    className={`rounded-2xl border p-3 transition-colors ${
                      isCurrent
                        ? 'border-primary bg-primary/10'
                        : isDone
                          ? 'border-primary/20 bg-primary/5'
                          : 'border-border/70 bg-muted/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                          isCurrent || isDone
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {isDone ? <Check className="h-4 w-4" /> : step.id}
                      </div>
                      <p className="text-sm font-medium text-foreground">{step.title}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <div className="lg:hidden">
              <BookingSummaryCard
                title="Resumo rapido"
                description="Veja o essencial antes de seguir"
                selectedServicesData={selectedServicesData}
                selectedProfessionalData={selectedProfessionalData}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                selectedServiceDuration={selectedServiceDuration}
                selectedServiceTotal={selectedServiceTotal}
                currentStep={currentStep}
                totalSteps={BOOKING_STEPS.length}
                compact
              />
            </div>

            <Card className="overflow-hidden rounded-[2rem] border-0 shadow-xl">
              {currentStep === 1 ? (
                <BookingServiceStep
                  services={paginatedServices}
                  selectedServiceIds={selectedServiceIds}
                  selectedServicesData={selectedServicesData}
                  selectedServiceDuration={selectedServiceDuration}
                  selectedServiceTotal={selectedServiceTotal}
                  serviceSearch={serviceSearch}
                  servicePage={servicePage}
                  servicePageSize={servicePageSize}
                  totalFilteredServices={filteredServices.length}
                  totalPages={totalServicePages}
                  onSearchChange={setServiceSearch}
                  onPageChange={setServicePage}
                  onSelectService={handleSelectService}
                />
              ) : null}

              {currentStep === 2 ? (
                <BookingProfessionalStep
                  professionals={professionals}
                  selectedProfessional={selectedProfessional}
                  isLoadingProfessionals={isLoadingProfessionals}
                  onSelect={setSelectedProfessional}
                />
              ) : null}

              {currentStep === 3 ? (
                <BookingDateTimeStep
                  currentMonth={currentMonth}
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  availableSlots={availableSlots}
                  isLoadingAvailability={isLoadingAvailability}
                  slug={slug}
                  getDaysInMonth={getDaysInMonth}
                  isDateSelectable={isDateSelectable}
                  navigateMonth={navigateMonth}
                  onSelectDate={setSelectedDate}
                  onSelectTime={setSelectedTime}
                />
              ) : null}

              {currentStep === 4 ? (
                <BookingCustomerStep
                  customerName={customerName}
                  customerPhone={customerPhone}
                  customerEmail={customerEmail}
                  onChangeName={setCustomerName}
                  onChangePhone={setCustomerPhone}
                  onChangeEmail={setCustomerEmail}
                />
              ) : null}

              <div className="flex flex-col gap-3 border-t border-border/60 bg-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                {currentStep > 1 ? (
                  <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Voltar
                  </Button>
                ) : (
                  <div />
                )}

                {currentStep < 4 ? (
                  <Button
                    onClick={handleNextStep}
                    disabled={!canProceed()}
                    className="w-full bg-primary hover:bg-primary/90 sm:w-auto"
                  >
                    {isLoadingProfessionals && currentStep === 1 ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Carregando...
                      </>
                    ) : (
                      <>
                        Continuar
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!canProceed() || isSubmitting}
                    className="w-full bg-primary hover:bg-primary/90 sm:w-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Confirmando...
                      </>
                    ) : (
                      <>
                        <Check className="mr-1 h-4 w-4" />
                        Confirmar agendamento
                      </>
                    )}
                  </Button>
                )}
              </div>
            </Card>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-6">
              <BookingSummaryCard
                title="Resumo do agendamento"
                description="Acompanhe o que ja foi escolhido"
                selectedServicesData={selectedServicesData}
                selectedProfessionalData={selectedProfessionalData}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                selectedServiceDuration={selectedServiceDuration}
                selectedServiceTotal={selectedServiceTotal}
                currentStep={currentStep}
                totalSteps={BOOKING_STEPS.length}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
