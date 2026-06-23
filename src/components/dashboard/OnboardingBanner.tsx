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
  if (status.hasProfessionals && status.hasServices && status.hasAssignments) return null;

  return (
    <div className="flex items-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-3">
      <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
      <p className="flex-1 text-sm text-amber-800">
        Sua agenda ainda não está completamente configurada. Adicione profissionais e serviços para começar a receber agendamentos.
      </p>
      <Button
        size="sm"
        variant="outline"
        className="shrink-0 border-amber-300 bg-white text-amber-800 hover:bg-amber-50 hover:border-amber-400"
        onClick={() => navigate(appRouteManifest.shell.onboarding)}
      >
        Configurar agora
      </Button>
    </div>
  );
}
