import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Check,
  FileText,
  Store,
  UserCircle2,
  Scissors,
  LayoutGrid,
  Settings,
  PartyPopper,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { BrandLockup } from "@/components/common/BrandLockup";
import { StepTerms } from "@/components/onboarding/steps/StepTerms";
import { StepSalon } from "@/components/onboarding/steps/StepSalon";
import { StepProfessionals } from "@/components/onboarding/steps/StepProfessionals";
import { StepServices } from "@/components/onboarding/steps/StepServices";
import { StepAssignments } from "@/components/onboarding/steps/StepAssignments";
import { StepOptional } from "@/components/onboarding/steps/StepOptional";
import { StepDone } from "@/components/onboarding/steps/StepDone";
import { onboardingApi } from "@/lib/api/onboarding";
import { useOnboardingStore } from "@/stores/onboarding";
import { appRouteManifest } from "@/app/route-manifest";
import type { SalonDraft } from "@/stores/onboarding";

const STEPS = [
  { index: 0, label: "Termos de uso", icon: FileText },
  { index: 1, label: "Seu salão", icon: Store },
  { index: 2, label: "Profissionais", icon: UserCircle2 },
  { index: 3, label: "Serviços", icon: Scissors },
  { index: 4, label: "Atribuições", icon: LayoutGrid },
  { index: 5, label: "Extras", icon: Settings },
  { index: 6, label: "Pronto!", icon: PartyPopper },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const store = useOnboardingStore();

  const [termsRead, setTermsRead] = useState(false);
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [salonValid, setSalonValid] = useState(false);
  const [pendingSalonData, setPendingSalonData] = useState<SalonDraft | null>(null);
  const [legalVersions, setLegalVersions] = useState<{ termsVersion: string; privacyVersion: string } | null>(null);

  const { isLoading: statusLoading } = useQuery({
    queryKey: ["onboarding-status"],
    queryFn: onboardingApi.getStatus,
    retry: false,
    onSuccess: (data) => {
      if (data.onboardingComplete) {
        navigate(appRouteManifest.shell.dashboard, { replace: true });
        return;
      }
      if (data.currentStep > 0) {
        store.setStep(data.currentStep);
      }
    },
  });

  const { mutate: acceptTerms, isLoading: acceptingTerms } = useMutation({
    mutationFn: (versions: { termsVersion: string; privacyVersion: string }) =>
      onboardingApi.acceptTerms(versions),
    onError: () => toast.error("Erro ao aceitar os termos. Tente novamente."),
  });

  const { mutate: updateStep } = useMutation({
    mutationFn: (step: number) => onboardingApi.updateStep(step),
  });

  const { mutate: skipOnboarding, isLoading: skipping } = useMutation({
    mutationFn: onboardingApi.skip,
    onSuccess: () => navigate(appRouteManifest.shell.dashboard, { replace: true }),
    onError: () => toast.error("Erro ao pular a configuração. Tente novamente."),
  });

  const { mutate: completeOnboarding, isLoading: completing } = useMutation({
    mutationFn: onboardingApi.complete,
    onSuccess: () => {
      store.reset();
      navigate(appRouteManifest.shell.agenda, { replace: true });
    },
    onError: () => toast.error("Erro ao finalizar. Tente novamente."),
  });

  const currentStep = store.currentStep;

  const canAdvance = (() => {
    if (currentStep === 0) return termsRead;
    if (currentStep === 1) return salonValid;
    if (currentStep === 2) return store.professionals.length > 0;
    if (currentStep === 3) return store.services.length > 0;
    return true;
  })();

  const handleNext = () => {
    if (currentStep === 0) {
      if (!legalVersions) {
        toast.error("Não foi possível carregar a versão dos termos. Recarregue a página e tente novamente.");
        return;
      }
      acceptTerms(legalVersions, {
        onSuccess: () => {
          const next = 1;
          store.setStep(next);
          updateStep(next);
        },
      });
      return;
    }

    if (currentStep === 1 && pendingSalonData) {
      store.setSalonData(pendingSalonData);
    }

    const next = currentStep + 1;
    store.setStep(next);
    updateStep(next);
  };

  const handleBack = () => {
    const prev = currentStep - 1;
    store.setStep(prev);
  };

  const handleSalonDataChange = useCallback((data: SalonDraft) => {
    setPendingSalonData(data);
  }, []);

  const progressPercent = Math.round((currentStep / (STEPS.length - 1)) * 100);

  if (statusLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Cabeçalho */}
      <header className="flex items-center justify-between border-b px-4 py-3 sm:px-6">
        <BrandLockup compact />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="link"
              size="sm"
              className="text-muted-foreground text-xs"
              disabled={skipping}
            >
              Pular configuração
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Pular a configuração inicial?</AlertDialogTitle>
              <AlertDialogDescription>
                Você pode configurar o salão a qualquer momento pelas configurações. Agendamentos só serão possíveis após adicionar profissionais e serviços.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => skipOnboarding()}>
                {skipping ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Pular mesmo assim
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </header>

      {/* Corpo */}
      <div className="flex flex-1 overflow-hidden">
        {/* Stepper lateral — desktop */}
        <aside className="hidden w-64 shrink-0 border-r bg-muted/20 p-6 md:flex md:flex-col">
          <p className="mb-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Configuração inicial
          </p>
          <nav className="space-y-1">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isDone = step.index < currentStep;
              const isActive = step.index === currentStep;
              return (
                <div
                  key={step.index}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : isDone
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                      isDone
                        ? "bg-primary text-primary-foreground"
                        : isActive
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isDone ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                  </div>
                  <span>{step.label}</span>
                  {isActive && (
                    <ChevronRight className="ml-auto h-3.5 w-3.5 text-primary/70" />
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Conteúdo central */}
        <main className="flex flex-1 flex-col overflow-auto">
          <div className="flex-1 px-4 py-8 sm:px-8 md:px-12 max-w-2xl mx-auto w-full">
            {currentStep === 0 && (
              <StepTerms
                termsRead={termsRead}
                lgpdConsent={lgpdConsent}
                onReadComplete={setTermsRead}
                onLgpdConsent={setLgpdConsent}
                onVersionsLoaded={setLegalVersions}
              />
            )}
            {currentStep === 1 && (
              <StepSalon
                initialData={store.salonData}
                onValidityChange={setSalonValid}
                onDataChange={handleSalonDataChange}
              />
            )}
            {currentStep === 2 && (
              <StepProfessionals
                professionals={store.professionals}
                onAdd={store.addProfessional}
                onRemove={store.removeProfessional}
              />
            )}
            {currentStep === 3 && (
              <StepServices
                services={store.services}
                businessType={store.salonData?.type}
                onAdd={store.addService}
                onRemove={store.removeService}
              />
            )}
            {currentStep === 4 && (
              <StepAssignments
                professionals={store.professionals}
                services={store.services}
                assignments={store.assignments}
                onAssignmentsChange={store.setAssignments}
              />
            )}
            {currentStep === 5 && <StepOptional />}
            {currentStep === 6 && (
              <StepDone
                professionalsCount={store.professionals.length}
                servicesCount={store.services.length}
                onComplete={() => completeOnboarding()}
                isCompleting={completing}
              />
            )}
          </div>

          {/* Rodapé fixo */}
          {currentStep < 6 && (
            <footer className="border-t bg-background px-4 py-4 sm:px-8">
              <div className="max-w-2xl mx-auto w-full flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className="w-24"
                >
                  Voltar
                </Button>

                <div className="flex-1 space-y-1">
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground text-right">
                    Etapa {currentStep + 1} de {STEPS.length}
                  </p>
                </div>

                <Button
                  onClick={handleNext}
                  disabled={!canAdvance || acceptingTerms}
                  className="w-36"
                >
                  {acceptingTerms ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {currentStep === 5 ? "Finalizar" : "Próxima etapa"}
                </Button>
              </div>
            </footer>
          )}
        </main>
      </div>
    </div>
  );
}
