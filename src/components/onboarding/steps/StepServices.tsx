import { useState } from "react";
import { Loader2, Plus, Scissors, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { resolveUiError } from "@/lib/error-utils";
import { toast } from "sonner";
import {
  ServiceFormDialog,
  type ServiceFormPayload,
} from "@/components/services/ServiceFormDialog";
import type { ServiceDraft } from "@/stores/onboarding";

const SUGGESTIONS: Record<string, string[]> = {
  SALAO_FEMININO: ["Corte feminino", "Coloração", "Escova", "Mechas", "Hidratação", "Progressiva"],
  BARBEARIA: ["Corte masculino", "Barba", "Combo corte e barba", "Sobrancelha", "Relaxamento"],
  CLINICA_ESTETICA: ["Limpeza de pele", "Peeling", "Micropigmentação", "Design de sobrancelha", "Depilação"],
  MISTO: ["Corte", "Coloração", "Barba", "Manicure", "Pedicure", "Escova"],
};

type ProfessionalOption = {
  id: string;
  name: string;
  isActive?: boolean;
};

type StepServicesProps = {
  services: ServiceDraft[];
  businessType: string | undefined;
  /** Profissionais criados na etapa anterior, para escolher quem executa o servico. */
  professionals: ProfessionalOption[];
  onAdd: (payload: ServiceFormPayload) => Promise<void>;
  onRemove: (index: number) => Promise<void>;
};

export function StepServices({
  services,
  businessType,
  professionals,
  onAdd,
  onRemove,
}: StepServicesProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [initialName, setInitialName] = useState("");
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);

  const suggestions = businessType ? (SUGGESTIONS[businessType] ?? []) : [];
  const addedNames = new Set(services.map((s) => s.name.toLowerCase()));

  const openDialog = (name = "") => {
    setInitialName(name);
    setDialogOpen(true);
  };

  const handleRemove = async (index: number) => {
    setRemovingIndex(index);
    try {
      await onRemove(index);
    } catch (error) {
      toast.error(resolveUiError(error, "Não foi possível remover o serviço.").message);
    } finally {
      setRemovingIndex(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Quais serviços vocês oferecem?</h2>
        <p className="text-sm text-muted-foreground">
          Adicione os serviços do seu estabelecimento.
        </p>
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Sugestões para o seu negócio
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => {
              const alreadyAdded = addedNames.has(s.toLowerCase());
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => openDialog(s)}
                  disabled={alreadyAdded}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    alreadyAdded
                      ? "border-primary/40 bg-primary/10 text-primary cursor-default"
                      : "border-border hover:border-primary hover:text-primary"
                  }`}
                >
                  {alreadyAdded ? "✓" : "+"} {s}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {services.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-12 text-center">
          <Scissors className="h-10 w-10 text-muted-foreground/50" />
          <div>
            <p className="text-sm font-medium">Nenhum serviço adicionado</p>
            <p className="text-xs text-muted-foreground">Use as sugestões acima ou clique no botão abaixo</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {services.map((s, i) => (
            <div key={s.id ?? i} className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{s.name}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {s.category}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {s.durationMinutes} min
                  </Badge>
                  {s.price > 0 && (
                    <span className="text-xs text-muted-foreground">{formatCurrency(s.price)}</span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remover ${s.name}`}
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

      <Button variant="outline" className="w-full" onClick={() => openDialog()}>
        <Plus className="mr-2 h-4 w-4" />
        Adicionar serviço
      </Button>

      <ServiceFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setInitialName("");
        }}
        editingService={null}
        professionals={professionals}
        isLoadingProfessionals={false}
        initialName={initialName}
        advancedCollapsed
        onCreate={async (payload) => {
          await onAdd(payload);
        }}
        onUpdate={async () => {
          // O onboarding so cria servicos; a edicao acontece depois em /servicos.
        }}
      />
    </div>
  );
}
