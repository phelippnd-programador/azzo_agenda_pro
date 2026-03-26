import { Clock } from 'lucide-react';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Service } from '@/lib/api';
import { formatCurrency } from '@/lib/format';

interface BookingServiceStepProps {
  services: Service[];
  selectedServiceIds: string[];
  selectedServicesData: Service[];
  selectedServiceDuration: number;
  selectedServiceTotal: number;
  onSelectService: (id: string, checked: boolean) => void;
}

export function BookingServiceStep({
  services,
  selectedServiceIds,
  selectedServicesData,
  selectedServiceDuration,
  selectedServiceTotal,
  onSelectService,
}: BookingServiceStepProps) {
  return (
    <>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Escolha o Serviço</CardTitle>
        <CardDescription className="text-sm">
          Selecione o serviço que deseja agendar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {services.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum servico disponivel</p>
        ) : (
          services.map((service) => {
            const checked = selectedServiceIds.includes(service.id);
            return (
              <label
                key={service.id}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 sm:p-4 transition-all ${
                  checked ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
                }`}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(value) => onSelectService(service.id, value === true)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-foreground text-sm sm:text-base truncate">
                        {service.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                          {service.duration} min
                        </span>
                        <Badge variant="secondary" className="text-[10px] sm:text-xs">
                          {service.category}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-base sm:text-lg font-bold text-primary">
                        {formatCurrency(service.price)}
                      </span>
                    </div>
                  </div>
                </div>
              </label>
            );
          })
        )}
        {selectedServicesData.length ? (
          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Servicos selecionados</span>
              <span className="font-medium">{selectedServicesData.length}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Duracao total</span>
              <span>{selectedServiceDuration} min</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Valor total</span>
              <span className="font-semibold text-primary">{formatCurrency(selectedServiceTotal)}</span>
            </div>
          </div>
        ) : null}
      </CardContent>
    </>
  );
}
