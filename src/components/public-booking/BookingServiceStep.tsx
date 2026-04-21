import { CheckCircle2, Clock, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-lg sm:text-xl">Escolha os servicos</CardTitle>
            <CardDescription className="mt-1 text-sm">
              Selecione um ou mais servicos. O valor e o tempo total sao atualizados em tempo real.
            </CardDescription>
          </div>
          <Badge variant="secondary" className="w-fit">
            {selectedServicesData.length} selecionado(s)
          </Badge>
        </div>

        <div className="rounded-2xl border border-border/70 bg-muted/20 p-3">
          <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Buscar por nome
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={serviceSearch}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Ex.: corte, escova, hidratacao"
              className="pl-9"
              aria-label="Buscar servicos"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {services.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">Nenhum servico disponivel para esse filtro.</p>
          </div>
        ) : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {services.map((service) => {
              const checked = selectedServiceIds.includes(service.id);

              return (
                <label
                  key={service.id}
                  className={`flex h-full cursor-pointer items-start gap-3 rounded-2xl border-2 p-3.5 transition-all sm:p-4 ${
                    checked
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-border bg-background hover:border-primary/40 hover:bg-muted/10'
                  }`}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(value) => onSelectService(service.id, value === true)}
                    className="mt-1"
                  />

                  <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-foreground sm:text-base">
                          {service.name}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground sm:text-sm">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                            {service.duration} min
                          </span>
                          {service.category ? (
                            <Badge variant="outline" className="text-[10px] sm:text-xs">
                              {service.category}
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                      {checked ? (
                        <Badge className="gap-1 self-start bg-primary/15 text-primary hover:bg-primary/15">
                          <CheckCircle2 className="h-3 w-3" />
                          Selecionado
                        </Badge>
                      ) : null}
                    </div>

                    <p className="line-clamp-2 text-xs text-muted-foreground sm:text-sm">
                        {service.description || 'Servico disponivel para agendamento publico.'}
                    </p>

                    <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/20 px-3 py-2">
                      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        Valor
                      </span>
                      <span className="whitespace-nowrap text-base font-bold text-primary sm:text-lg">
                        {formatCurrencyCents(service.price)}
                      </span>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        )}

        <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground sm:text-sm">
            {totalFilteredServices === 0
              ? 'Nenhum servico encontrado para esse filtro.'
              : `Mostrando ${startItem}-${endItem} de ${totalFilteredServices} servicos`}
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
              Pagina {servicePage} de {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, servicePage + 1))}
              disabled={servicePage >= totalPages}
            >
              Proxima
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Servicos selecionados</span>
            <span className="font-medium">{selectedServicesData.length}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Duracao total</span>
            <span>{selectedServiceDuration} min</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Valor total</span>
            <span className="font-semibold text-primary">
              {formatCurrencyCents(selectedServiceTotal)}
            </span>
          </div>
          {selectedServicesData.length ? (
            <p className="mt-3 text-xs text-muted-foreground">
              {selectedServicesData.map((service) => service.name).join(', ')}
            </p>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              Escolha pelo menos um servico para continuar.
            </p>
          )}
        </div>
      </CardContent>
    </>
  );
}
