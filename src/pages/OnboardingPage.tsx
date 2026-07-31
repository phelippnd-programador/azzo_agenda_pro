import { useState, useCallback, useEffect, useMemo, useRef } from "react";
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
import { salonApi } from "@/lib/api/salon";
import { servicesApi } from "@/lib/api/services";
import { professionalsApi } from "@/lib/api/professionals";
import { resolveUiError } from "@/lib/error-utils";
import { useOnboardingStore } from "@/stores/onboarding";
import { useAuth } from "@/contexts/AuthContext";
import { appRouteManifest } from "@/app/route-manifest";
import type { ListResponse } from "@/lib/api/contracts";
import type { ServiceFormPayload } from "@/components/services/ServiceFormDialog";
import type { ProfessionalUpsertPayload } from "@/lib/api/professionals";
import type { SalonDraft } from "@/stores/onboarding";

type ProfessionalCreatePayload = ProfessionalUpsertPayload;

const STEPS = [
  { index: 0, label: "Termos de uso", icon: FileText },
  { index: 1, label: "Seu salão", icon: Store },
  // Profissionais vem antes de Servicos: o formulario de servico escolhe quais
  // profissionais executam o servico, entao a lista precisa ja estar preenchida.
  { index: 2, label: "Profissionais", icon: UserCircle2 },
  { index: 3, label: "Serviços", icon: Scissors },
  { index: 4, label: "Atribuições", icon: LayoutGrid },
  { index: 5, label: "Extras", icon: Settings },
  { index: 6, label: "Pronto!", icon: PartyPopper },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const store = useOnboardingStore();
  const { user } = useAuth();

  const [termsRead, setTermsRead] = useState(false);
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [salonValid, setSalonValid] = useState(false);
  const [pendingSalonData, setPendingSalonData] = useState<SalonDraft | null>(null);
  const [legalVersions, setLegalVersions] = useState<{ termsVersion: string; privacyVersion: string } | null>(null);
  const [savingSalon, setSavingSalon] = useState(false);

  const { data: salonProfile } = useQuery({
    queryKey: ["onboarding-salon-prefill"],
    queryFn: salonApi.getProfile,
    retry: false,
    enabled: !store.salonData,
  });

  // Memoizado: um objeto novo a cada render faria o efeito de pre-preenchimento
  // do StepSalon (dependente de initialData por referencia) disparar de novo a
  // cada render, chamando reset() -> watch() -> setPendingSalonData no pai ->
  // novo render -> novo objeto aqui -> loop infinito (React error #185).
  const salonInitialData: SalonDraft | null = useMemo(() => {
    if (store.salonData) return store.salonData;
    if (!salonProfile) return null;
    return {
      name: salonProfile.salonName || "",
      type: "",
      phone: salonProfile.salonPhone || "",
      city: salonProfile.city || "",
      state: salonProfile.state || "",
      email: salonProfile.salonEmail || "",
    };
  }, [store.salonData, salonProfile]);

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

  // O rascunho local (Zustand + localStorage) so existe no navegador onde o
  // wizard foi iniciado. Retomando em outro dispositivo/sessao — ou apos
  // limpar o storage — as listas apareceriam vazias mesmo com servicos e
  // profissionais ja criados de verdade, levando a duplicatas e impedindo a
  // etapa de atribuicoes de funcionar. Sincroniza uma vez no mount com o que
  // existe no backend (fonte de verdade).
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    const toList = <T,>(data: ListResponse<T>): T[] =>
      Array.isArray(data) ? data : data.items ?? [];

    void (async () => {
      try {
        const [servicesData, professionalsData] = await Promise.all([
          servicesApi.getAll({ limit: 200 }),
          professionalsApi.getAll({ limit: 200 }),
        ]);
        store.hydrateFromServer({
          services: toList(servicesData).map((s) => ({
            id: s.id,
            name: s.name,
            durationMinutes: s.duration,
            price: s.price,
            description: s.description,
            category: s.category,
            professionalIds: s.professionalIds ?? [],
          })),
          professionals: toList(professionalsData).map((p) => ({
            id: p.id,
            userId: p.userId,
            name: p.name,
            email: p.email,
            phone: p.phone,
            specialties: p.specialties ?? [],
            workingHours: p.workingHours ?? [],
          })),
        });
      } catch {
        // Falha ao sincronizar nao impede o uso do wizard — segue com o
        // rascunho local que ja estiver carregado.
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Clampeado: o backend aceita qualquer step maior que o atual sem limite
  // superior, e a tela renderiza por igualdade exata (currentStep === N). Um
  // valor fora da faixa deixaria a pagina em branco e sem rodape, sem saida.
  const currentStep = Math.min(Math.max(store.currentStep, 0), STEPS.length - 1);
  const lastStepIndex = STEPS.length - 1;

  const canAdvance = (() => {
    if (currentStep === 0) return termsRead;
    if (currentStep === 1) return salonValid;
    if (currentStep === 2) return store.professionals.length > 0;
    if (currentStep === 3) return store.services.length > 0;
    return true;
  })();

  const advanceStep = () => {
    const next = currentStep + 1;
    store.setStep(next);
    updateStep(next);
  };

  const handleNext = async () => {
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

    if (currentStep === 1) {
      if (!pendingSalonData) {
        toast.error("Preencha os dados do salão antes de continuar.");
        return;
      }
      setSavingSalon(true);
      try {
        // PUT /salon/profile trata a chamada como substituicao completa (todo
        // campo ausente no payload sobrescreve o existente com null/vazio) e
        // exige CPF/CNPJ em toda atualizacao. O formulario do onboarding so
        // coleta nome/telefone/e-mail/cidade/estado, entao busca o perfil
        // completo primeiro e manda os demais campos (endereco, redes
        // sociais, documento, horarios etc.) inalterados junto — nunca so o
        // que mudou, senao o resto do perfil e apagado.
        const currentProfile = salonProfile ?? (await salonApi.getProfile());
        if (!currentProfile.salonCpfCnpj) {
          toast.error("CPF ou CNPJ do salão não encontrado. Cadastre em Perfil do Salão antes de continuar.");
          return;
        }
        await salonApi.updateProfile({
          ...currentProfile,
          salonName: pendingSalonData.name,
          salonPhone: pendingSalonData.phone,
          salonEmail: pendingSalonData.email,
          city: pendingSalonData.city,
          state: pendingSalonData.state,
        });
        store.setSalonData(pendingSalonData);
      } catch (error) {
        toast.error(resolveUiError(error, "Não foi possível salvar os dados do salão. Tente novamente.").message);
        return;
      } finally {
        setSavingSalon(false);
      }
    }

    advanceStep();
  };

  const handleServiceAdd = async (payload: ServiceFormPayload) => {
    const created = await servicesApi.create(payload);
    store.addService({
      id: created.id,
      name: created.name,
      durationMinutes: created.duration,
      price: created.price,
      description: created.description,
      category: created.category,
      professionalIds: created.professionalIds ?? [],
    });
  };

  const handleServiceRemove = async (index: number) => {
    const service = store.services[index];
    if (service?.id) {
      await servicesApi.delete(service.id);
    }
    store.removeService(index);
  };

  const handleProfessionalAdd = async (payload: ProfessionalCreatePayload) => {
    const created = await professionalsApi.create(payload);
    store.addProfessional({
      id: created.id,
      userId: created.userId,
      name: created.name,
      email: created.email,
      phone: created.phone,
      specialties: created.specialties ?? [],
      workingHours: created.workingHours ?? payload.workingHours ?? [],
    });
  };

  const handleProfessionalRemove = async (index: number) => {
    const professional = store.professionals[index];
    if (professional?.id) {
      await professionalsApi.delete(professional.id);
    }
    store.removeProfessional(index);
  };

  const handleServiceProfessionalsChange = async (serviceIndex: number, professionalIds: string[]) => {
    const service = store.services[serviceIndex];
    if (!service?.id) return;
    const updated = await servicesApi.update(service.id, { professionalIds });
    store.updateService(serviceIndex, { ...service, professionalIds: updated.professionalIds ?? professionalIds });
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
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/30">
      {/* Cabeçalho */}
      <header className="flex items-center justify-between border-b border-border/70 bg-background/95 px-4 py-3 backdrop-blur-sm sm:px-6">
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
        <aside className="hidden w-64 shrink-0 border-r border-border/70 bg-card/85 p-6 backdrop-blur-sm md:flex md:flex-col">
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
          <div className="surface-panel rounded-2xl p-5 sm:p-7">
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
                initialData={salonInitialData}
                onValidityChange={setSalonValid}
                onDataChange={handleSalonDataChange}
              />
            )}
            {currentStep === 2 && (
              <StepProfessionals
                professionals={store.professionals}
                currentUserId={user?.id}
                onAdd={handleProfessionalAdd}
                onRemove={handleProfessionalRemove}
              />
            )}
            {currentStep === 3 && (
              <StepServices
                services={store.services}
                businessType={store.salonData?.type}
                professionals={store.professionals
                  .filter((p): p is typeof p & { id: string } => Boolean(p.id))
                  .map((p) => ({ id: p.id, name: p.name }))}
                onAdd={handleServiceAdd}
                onRemove={handleServiceRemove}
              />
            )}
            {currentStep === 4 && (
              <StepAssignments
                professionals={store.professionals}
                services={store.services}
                onServiceProfessionalsChange={handleServiceProfessionalsChange}
              />
            )}
            {currentStep === 5 && <StepOptional />}
            {currentStep === lastStepIndex && (
              <StepDone
                professionalsCount={store.professionals.length}
                servicesCount={store.services.length}
                onComplete={() => completeOnboarding()}
                isCompleting={completing}
              />
            )}
          </div>
          </div>

          {/* Rodapé fixo */}
          {currentStep < lastStepIndex && (
            <footer className="border-t border-border/70 bg-background/95 px-4 py-4 backdrop-blur-sm sm:px-8">
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
                  disabled={!canAdvance || acceptingTerms || savingSalon}
                  className="w-36"
                >
                  {acceptingTerms || savingSalon ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {/* Esta etapa so avanca para a tela "Pronto!" — a conclusao
                      de fato (POST /onboarding/complete) acontece la. */}
                  {currentStep === lastStepIndex - 1 ? "Revisar e concluir" : "Próxima etapa"}
                </Button>
              </div>
            </footer>
          )}
        </main>
      </div>
    </div>
  );
}
