import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Professional } from '@/lib/api';

interface BookingProfessionalStepProps {
  professionals: Professional[];
  selectedProfessional: string | null;
  isLoadingProfessionals: boolean;
  onSelect: (id: string) => void;
}

export function BookingProfessionalStep({
  professionals,
  selectedProfessional,
  isLoadingProfessionals,
  onSelect,
}: BookingProfessionalStepProps) {
  return (
    <>
      <CardHeader className="space-y-3">
        <CardTitle className="text-lg sm:text-xl">Escolha o profissional</CardTitle>
        <CardDescription className="text-sm">
          Selecione quem ira atende-lo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoadingProfessionals ? (
          <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center text-muted-foreground">
            Carregando profissionais...
          </div>
        ) : professionals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center">
            <p className="text-sm font-medium text-foreground">Nenhum profissional disponivel.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ajuste os servicos escolhidos para ver outras combinacoes.
            </p>
          </div>
        ) : (
          professionals.map((professional) => (
            <button
              key={professional.id}
              type="button"
              onClick={() => onSelect(professional.id)}
              aria-pressed={selectedProfessional === professional.id}
              className={`w-full rounded-xl border-2 p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:p-4 ${
                selectedProfessional === professional.id
                  ? 'border-primary bg-primary/10 shadow-sm'
                  : 'border-border bg-background hover:border-primary/40 hover:bg-muted/10'
              }`}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <Avatar className="h-12 w-12 flex-shrink-0 sm:h-14 sm:w-14">
                  <AvatarImage src={professional.avatar} />
                  <AvatarFallback className="bg-primary/15 text-sm text-primary">
                    {professional.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <h3 className="truncate text-sm font-medium text-foreground sm:text-base">
                    {professional.name}
                    </h3>
                    {selectedProfessional === professional.id ? (
                      <Badge className="w-fit bg-primary/15 text-primary hover:bg-primary/15">
                        Selecionado
                      </Badge>
                    ) : null}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(Array.isArray(professional.specialties) ? professional.specialties : [])
                      .slice(0, 3)
                      .map((spec, index) => (
                        <Badge key={index} variant="outline" className="text-xs sm:text-xs">
                          {spec}
                        </Badge>
                      ))}
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </CardContent>
    </>
  );
}
