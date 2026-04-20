import { Clock, Search } from 'lucide-react';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Service } from '@/lib/api';
import { formatCurrencyCents } from '@/lib/format';

interface BookingServiceStepProps {
  services: Service[];
  selectedServiceIds: string[];
  selectedServicesData: Service[];
  selectedServiceDuration: number;
  selectedServiceTotal: number;
  serviceSearch: string;
  servicePage: number;
  servicePageSize: number;
  totalFilteredServices: number;
  totalPages: number;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onSelectService: (id: string, checked: boolean) => void;
}

export function BookingServiceStep({
  services,
  selectedServiceIds,
  selectedServicesData,
  selectedServiceDuration,
  selectedServiceTotal,
  serviceSearch,
  servicePage,
  servicePageSize,
  totalFilteredServices,
  totalPages,
  onSearchChange,
  onPageChange,
  onSelectService,
}: BookingServiceStepProps) {
  const startItem = totalFilteredServices === 0 ? 0 : (servicePage - 1) * servicePageSize + 1;
  const endItem = Math.min(servicePage * servicePageSize, totalFilteredServices);

  return (
    <>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Escolha o serviço</CardTitle>
        <CardDescription className="text-sm">
          Selecione o serviço que deseja agendar
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
          <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Buscar por nome
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={serviceSearch}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Ex.: corte, escova, hidratação"
              className="pl-9"
            />
          </div>
        </div>

        {services.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">Nenhum serviço disponível</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => {
              const checked = selectedServiceIds.includes(service.id);

              return (
                <label
                  key={service.id}
                  className={`flex h-full cursor-pointer items-start gap-3 rounded-xl border-2 p-3 transition-all sm:p-4 ${
                    checked ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
                  }`}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(value) => onSelectService(service.id, value === true)}
                    className="mt-0.5"
                  />

                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-medium text-foreground sm:text-base">
                        {service.name}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-3">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground sm:text-sm">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                          {service.duration} min
                        </span>
                        <Badge variant="secondary" className="text-[10px] sm:text-xs">
                          {service.category}
                        </Badge>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-bold text-primary sm:text-lg">
                        {formatCurrencyCents(service.price)}
                      </span>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        )}

        <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground sm:text-sm">
            {totalFilteredServices === 0
              ? 'Nenhum serviço encontrado para esse filtro.'
              : `Mostrando ${startItem}-${endItem} de ${totalFilteredServices} serviços`}
          </p>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, servicePage - 1))}
              disabled={servicePage <= 1}
            >
              Anterior
            </Button>
            <span className="min-w-16 text-center text-xs text-muted-foreground sm:text-sm">
              Página {servicePage} de {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, servicePage + 1))}
              disabled={servicePage >= totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>

        {selectedServicesData.length ? (
          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Serviços selecionados</span>
              <span className="font-medium">{selectedServicesData.length}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Duração total</span>
              <span>{selectedServiceDuration} min</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Valor total</span>
              <span className="font-semibold text-primary">
                {formatCurrencyCents(selectedServiceTotal)}
              </span>
            </div>
          </div>
        ) : null}
      </CardContent>
    </>
  );
}
