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
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Escolha o Profissional</CardTitle>
        <CardDescription className="text-sm">
          Selecione quem irá atendê-lo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoadingProfessionals ? (
          <p className="text-center text-muted-foreground py-8">Carregando profissionais...</p>
        ) : professionals.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum profissional disponível</p>
        ) : (
          professionals.map((professional) => (
            <div
              key={professional.id}
              onClick={() => onSelect(professional.id)}
              className={`p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedProfessional === professional.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <Avatar className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0">
                  <AvatarImage src={professional.avatar} />
                  <AvatarFallback className="bg-primary/15 text-primary text-sm">
                    {professional.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-foreground text-sm sm:text-base truncate">
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
  );
}
