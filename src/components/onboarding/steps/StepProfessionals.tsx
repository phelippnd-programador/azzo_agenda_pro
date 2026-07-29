import { useEffect, useState, type ComponentProps } from "react";
import { Loader2, Plus, Trash2, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { resolveUiError } from "@/lib/error-utils";
import { professionalsApi } from "@/lib/api/professionals";
import type { ProfessionalLimits } from "@/lib/api/contracts";
import { useSpecialties } from "@/hooks/useSpecialties";
import { ProfessionalFormDialog } from "@/components/professionals/ProfessionalFormDialog";
import { toast } from "sonner";
import type { ProfessionalDraft } from "@/stores/onboarding";

type ProfessionalCreatePayload = Parameters<
  ComponentProps<typeof ProfessionalFormDialog>["onCreate"]
>[0];

type StepProfessionalsProps = {
  professionals: ProfessionalDraft[];
  /** Id do usuario logado, para o toggle "este usuario tambem atende clientes?". */
  currentUserId?: string;
  onAdd: (payload: ProfessionalCreatePayload) => Promise<void>;
  onRemove: (index: number) => Promise<void>;
};

export function StepProfessionals({
  professionals,
  currentUserId,
  onAdd,
  onRemove,
}: StepProfessionalsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);
  const [limits, setLimits] = useState<ProfessionalLimits | null>(null);
  const [limitsError, setLimitsError] = useState(false);

  const {
    specialties,
    isLoading: isLoadingSpecialties,
    error: specialtiesError,
    refetch: refetchSpecialties,
    createSpecialty,
  } = useSpecialties();

  const loadLimits = () => {
    professionalsApi
      .getLimits()
      .then((data) => {
        setLimits(data);
        setLimitsError(false);
      })
      .catch(() => setLimitsError(true));
  };

  useEffect(() => {
    loadLimits();
  }, []);

  const reachedLimit = limits != null && limits.remaining <= 0;
  const hasLinkedCurrentUserProfessional = professionals.some(
    (p) => currentUserId != null && p.userId === currentUserId
  );

  const handleRemove = async (index: number) => {
    const professional = professionals[index];
    const confirmed = window.confirm(
      `Remover ${professional?.name ?? "este profissional"}?\n\n` +
        "Atenção: o acesso criado para esta pessoa (com a senha temporária já enviada por e-mail) " +
        "continuará existindo. Para revogar o login, procure o suporte."
    );
    if (!confirmed) return;

    setRemovingIndex(index);
    try {
      await onRemove(index);
      loadLimits();
    } catch (error) {
      toast.error(resolveUiError(error, "Não foi possível remover o profissional.").message);
    } finally {
      setRemovingIndex(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Quem trabalha no seu salão?</h2>
        <p className="text-sm text-muted-foreground">
          Adicione os profissionais que realizam atendimentos.
        </p>
      </div>

      {limits && (
        <div className="rounded-lg border bg-muted/30 p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Profissionais do seu plano</span>
            <span className="font-medium">
              {limits.currentProfessionals} de {limits.maxProfessionals} usados
            </span>
          </div>
          {reachedLimit && (
            <p className="mt-1 text-xs text-amber-700">
              Limite de profissionais do plano atingido. Faça upgrade do plano para adicionar mais.
            </p>
          )}
        </div>
      )}
      {limitsError && (
        <p className="text-xs text-destructive">
          Não foi possível verificar o limite de profissionais do seu plano.
        </p>
      )}

      {professionals.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-12 text-center">
          <UserCircle2 className="h-10 w-10 text-muted-foreground/50" />
          <div>
            <p className="text-sm font-medium">Nenhum profissional adicionado</p>
            <p className="text-xs text-muted-foreground">Clique no botão abaixo para adicionar</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {professionals.map((p, i) => (
            <div key={p.id ?? i} className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.email}</p>
                <div className="flex flex-wrap gap-1">
                  {p.specialties.map((s) => (
                    <Badge key={s} variant="secondary" className="text-xs px-1.5 py-0">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remover ${p.name}`}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => handleRemove(i)}
                disabled={removingIndex === i}
              >
                {removingIndex === i ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button
        variant="outline"
        className="w-full"
        onClick={() => setDialogOpen(true)}
        disabled={reachedLimit}
      >
        <Plus className="mr-2 h-4 w-4" />
        Adicionar profissional
      </Button>

      <ProfessionalFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingProfessional={null}
        hasLinkedCurrentUserProfessional={hasLinkedCurrentUserProfessional}
        creationLimitReached={reachedLimit}
        specialties={specialties}
        isLoadingSpecialties={isLoadingSpecialties}
        specialtiesError={specialtiesError}
        refetchSpecialties={refetchSpecialties}
        onCreateSpecialty={async (name) => {
          await createSpecialty({ name });
          await refetchSpecialties();
        }}
        advancedCollapsed
        onCreate={async (payload) => {
          await onAdd(payload);
          loadLimits();
        }}
        onUpdate={async () => {
          // O onboarding so cria profissionais; a edicao acontece depois em /profissionais.
        }}
      />
    </div>
  );
}
