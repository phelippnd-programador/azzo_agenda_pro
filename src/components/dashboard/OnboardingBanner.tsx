import { AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { onboardingApi } from "@/lib/api/onboarding";
import { appRouteManifest } from "@/app/route-manifest";

export function OnboardingBanner() {
  const navigate = useNavigate();

  const { data: status } = useQuery({
    queryKey: ["onboarding-status"],
    queryFn: onboardingApi.getStatus,
    retry: false,
  });

  if (!status) return null;
  if (status.onboardingComplete) return null;
  // Quem escolheu explicitamente "Pular configuração" não deve continuar
  // vendo a cobrança: skipOnboarding marca só onboardingSkipped no backend
  // (nunca onboardingComplete), então sem esta checagem o aviso ficaria para
  // sempre mesmo após a pessoa já ter recusado.
  if (status.onboardingSkipped) return null;
  if (status.hasProfessionals && status.hasServices && status.hasAssignments) return null;

  return (
    <div className="flex items-center gap-3 border-b border-warning/25 bg-warning/10 px-4 py-3">
      <AlertCircle className="h-4 w-4 shrink-0 text-warning" />
      <p className="flex-1 text-sm text-foreground">
        Sua agenda ainda não está completamente configurada. Adicione profissionais e serviços para começar a receber agendamentos.
      </p>
      <Button
        size="sm"
        variant="outline"
        className="shrink-0 border-warning/30 bg-background/90 text-foreground hover:border-warning/40 hover:bg-warning/10"
        onClick={() => navigate(appRouteManifest.shell.onboarding)}
      >
        Configurar agora
      </Button>
    </div>
  );
}
