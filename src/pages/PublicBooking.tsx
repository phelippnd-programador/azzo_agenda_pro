import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Scissors,
  Clock,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Check,
  Calendar,
  User,
  Phone,
  Loader2,
} from 'lucide-react';
import { servicesApi, professionalsApi, appointmentsApi, publicBookingApi, Service, Professional } from '@/lib/api';
import { toast } from 'sonner';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30',
];

export default function PublicBooking() {
  const { slug } = useParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);

  // Data
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);

  // Selection state
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Customer info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

  const formatDateParam = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [servicesData, professionalsData] = slug
          ? await Promise.all([
              publicBookingApi.getServices(slug),
              publicBookingApi.getProfessionals(slug),
            ])
          : await Promise.all([servicesApi.getAll(), professionalsApi.getAll()]);
        setServices(servicesData.filter(s => s.isActive));
        setProfessionals(professionalsData.filter(p => p.isActive));
      } catch (error) {
        toast.error('Erro ao carregar dados');
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
        serviceId: selectedService || undefined,
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
  }, [slug, selectedDate, selectedService, selectedProfessional]);

  const selectedServiceData = useMemo(() => 
    services.find(s => s.id === selectedService),
    [services, selectedService]
  );

  const selectedProfessionalData = useMemo(() => 
    professionals.find(p => p.id === selectedProfessional),
    [professionals, selectedProfessional]
  );

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];

    // Add empty days for the start of the week
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const isDateSelectable = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today && date.getDay() !== 0; // Not in the past and not Sunday
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

  const handleNextStep = () => {
    if (currentStep === 2 && !selectedDate) {
      const defaultDate = getFirstSelectableDate();
      if (defaultDate) setSelectedDate(defaultDate);
    }
    setCurrentStep(currentStep + 1);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedService !== null;
      case 2:
        return selectedProfessional !== null;
      case 3:
        return selectedDate !== null && selectedTime !== null;
      case 4:
        return customerName.trim() !== '' && customerPhone.trim() !== '';
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!selectedService || !selectedProfessional || !selectedDate || !selectedTime || !selectedServiceData) {
      toast.error('Preencha todos os campos');
      return;
    }

    setIsSubmitting(true);
    try {
      // Calculate end time
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const endDate = new Date();
      endDate.setHours(hours, minutes + selectedServiceData.duration);
      const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;

      if (slug) {
        await publicBookingApi.createAppointment(slug, {
          customerName,
          customerPhone,
          customerEmail,
          professionalId: selectedProfessional,
          serviceId: selectedService,
          date: formatDateParam(selectedDate),
          startTime: selectedTime,
        });
      } else {
        await appointmentsApi.create({
          clientId: 'public_' + Date.now(), // fallback
          professionalId: selectedProfessional,
          serviceId: selectedService,
          date: formatDateParam(selectedDate),
          startTime: selectedTime,
          endTime,
          status: 'PENDING',
          totalPrice: selectedServiceData.price,
          notes: `Cliente: ${customerName} | Tel: ${customerPhone} | Email: ${customerEmail}`,
        });
      }

      setBookingComplete(true);
      toast.success('Agendamento realizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao realizar agendamento');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 p-4">
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-16 w-48 mx-auto mb-8" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (bookingComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Agendamento Confirmado!
            </h2>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">
              Seu agendamento foi realizado com sucesso. Você receberá uma confirmação em breve.
            </p>
            
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Serviço:</span>
                <span className="font-medium">{selectedServiceData?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Profissional:</span>
                <span className="font-medium">{selectedProfessionalData?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Data:</span>
                <span className="font-medium">
                  {selectedDate?.toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Horário:</span>
                <span className="font-medium">{selectedTime}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="text-gray-500">Total:</span>
                <span className="font-bold text-violet-600">
                  {formatCurrency(selectedServiceData?.price || 0)}
                </span>
              </div>
            </div>

            <Button
              onClick={() => window.location.reload()}
              className="w-full bg-violet-600 hover:bg-violet-700"
            >
              Fazer Novo Agendamento
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-violet-600 to-pink-500 rounded-xl flex items-center justify-center">
              <Scissors className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Bella Studio</h1>
              <p className="text-xs sm:text-sm text-violet-600 font-medium">Agende seu horário</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6 sm:mb-8">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-colors ${
                  currentStep >= step
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {currentStep > step ? <Check className="w-3 h-3 sm:w-4 sm:h-4" /> : step}
              </div>
              {step < 4 && (
                <div
                  className={`w-6 sm:w-12 h-1 mx-1 sm:mx-2 rounded ${
                    currentStep > step ? 'bg-violet-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Card className="shadow-xl border-0">
          {/* Step 1: Select Service */}
          {currentStep === 1 && (
            <>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Escolha o Serviço</CardTitle>
                <CardDescription className="text-sm">
                  Selecione o serviço que deseja agendar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {services.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Nenhum serviço disponível</p>
                ) : (
                  services.map((service) => (
                    <div
                      key={service.id}
                      onClick={() => setSelectedService(service.id)}
                      className={`p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedService === service.id
                          ? 'border-violet-600 bg-violet-50'
                          : 'border-gray-200 hover:border-violet-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                            {service.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                            <span className="flex items-center gap-1 text-xs sm:text-sm text-gray-500">
                              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                              {service.duration} min
                            </span>
                            <Badge variant="secondary" className="text-[10px] sm:text-xs">
                              {service.category}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-base sm:text-lg font-bold text-violet-600">
                            {formatCurrency(service.price)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </>
          )}

          {/* Step 2: Select Professional */}
          {currentStep === 2 && (
            <>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Escolha o Profissional</CardTitle>
                <CardDescription className="text-sm">
                  Selecione quem irá atendê-lo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {professionals.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Nenhum profissional disponível</p>
                ) : (
                  professionals.map((professional) => (
                    <div
                      key={professional.id}
                      onClick={() => setSelectedProfessional(professional.id)}
                      className={`p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedProfessional === professional.id
                          ? 'border-violet-600 bg-violet-50'
                          : 'border-gray-200 hover:border-violet-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <Avatar className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0">
                          <AvatarImage src={professional.avatar} />
                          <AvatarFallback className="bg-violet-100 text-violet-700 text-sm">
                            {professional.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                            {professional.name}
                          </h3>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(Array.isArray(professional.specialties)
                              ? professional.specialties
                              : []
                            )
                              .slice(0, 3)
                              .map((spec, i) => (
                              <Badge key={i} variant="outline" className="text-[10px] sm:text-xs">
                                {spec}
                              </Badge>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </>
          )}

          {/* Step 3: Select Date and Time */}
          {currentStep === 3 && (
            <>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Escolha Data e Horário</CardTitle>
                <CardDescription className="text-sm">
                  Selecione quando deseja ser atendido
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                {/* Calendar */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Button variant="ghost" size="icon" onClick={() => navigateMonth('prev')} className="h-8 w-8">
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="font-medium text-sm sm:text-base capitalize">
                      {currentMonth.toLocaleDateString('pt-BR', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => navigateMonth('next')} className="h-8 w-8">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                      <span key={i} className="text-[10px] sm:text-xs font-medium text-gray-500 py-1">
                        {day}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {getDaysInMonth().map((date, i) => (
                      <button
                        key={i}
                        onClick={() => date && isDateSelectable(date) && setSelectedDate(date)}
                        disabled={!date || !isDateSelectable(date)}
                        className={`aspect-square rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                          !date
                            ? 'invisible'
                            : !isDateSelectable(date)
                            ? 'text-gray-300 cursor-not-allowed'
                            : selectedDate?.toDateString() === date.toDateString()
                            ? 'bg-violet-600 text-white'
                            : 'hover:bg-violet-100 text-gray-700'
                        }`}
                      >
                        {date?.getDate()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Slots */}
                {selectedDate && (
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Horários Disponíveis</Label>
                    {isLoadingAvailability && slug && (
                      <p className="text-sm text-gray-500 mb-2">Consultando disponibilidade...</p>
                    )}
                    {!isLoadingAvailability && slug && availableSlots.length === 0 && (
                      <p className="text-sm text-gray-500 mb-2">
                        Nao ha horarios disponiveis para esta data.
                      </p>
                    )}
                    <div className="grid grid-cols-4 gap-2">
                      {(slug ? availableSlots : timeSlots).map((time) => (
                        <Button
                          key={time}
                          variant={selectedTime === time ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedTime(time)}
                          className={`text-xs sm:text-sm ${
                            selectedTime === time ? 'bg-violet-600 hover:bg-violet-700' : ''
                          }`}
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </>
          )}

          {/* Step 4: Customer Info */}
          {currentStep === 4 && (
            <>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Seus Dados</CardTitle>
                <CardDescription className="text-sm">
                  Preencha seus dados para confirmar o agendamento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm">Nome Completo *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="name"
                      placeholder="Seu nome"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm">WhatsApp *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="phone"
                      placeholder="(11) 99999-0000"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm">E-mail (opcional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                  />
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-xl p-4 mt-6">
                  <h4 className="font-medium text-gray-900 mb-3 text-sm">Resumo do Agendamento</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Serviço:</span>
                      <span className="font-medium truncate ml-2">{selectedServiceData?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Profissional:</span>
                      <span className="font-medium truncate ml-2">{selectedProfessionalData?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Data:</span>
                      <span className="font-medium">
                        {selectedDate?.toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Horário:</span>
                      <span className="font-medium">{selectedTime}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t mt-2">
                      <span className="text-gray-700 font-medium">Total:</span>
                      <span className="font-bold text-violet-600">
                        {formatCurrency(selectedServiceData?.price || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between p-4 sm:p-6 pt-0">
            {currentStep > 1 ? (
              <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Voltar
              </Button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <Button
                onClick={handleNextStep}
                disabled={!canProceed()}
                className="bg-violet-600 hover:bg-violet-700"
              >
                Continuar
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
                className="bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-700 hover:to-pink-600"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Confirmando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Confirmar Agendamento
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
