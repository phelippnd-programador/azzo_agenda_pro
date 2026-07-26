import { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { resolveUiError } from "@/lib/error-utils";
import { toast } from "sonner";
import type { ProfessionalDraft, ServiceDraft } from "@/stores/onboarding";

type StepAssignmentsProps = {
  professionals: ProfessionalDraft[];
  services: ServiceDraft[];
  onServiceProfessionalsChange: (serviceIndex: number, professionalIds: string[]) => Promise<void>;
};

export function StepAssignments({
  professionals,
  services,
  onServiceProfessionalsChange,
}: StepAssignmentsProps) {
  const [selectedProfessional, setSelectedProfessional] = useState<string>(
    professionals.length > 0 ? professionals[0].id ?? "" : ""
  );
  const [savingServiceIndex, setSavingServiceIndex] = useState<number | null>(null);

  const applyChange = async (serviceIndex: number, professionalIds: string[]) => {
    setSavingServiceIndex(serviceIndex);
    try {
      await onServiceProfessionalsChange(serviceIndex, professionalIds);
    } catch (error) {
      toast.error(resolveUiError(error, "Não foi possível atualizar os profissionais deste serviço.").message);
    } finally {
      setSavingServiceIndex(null);
    }
  };

  const toggle = (serviceIndex: number, professionalId: string) => {
    const service = services[serviceIndex];
    const current = service.professionalIds ?? [];
    const updated = current.includes(professionalId)
      ? current.filter((p) => p !== professionalId)
      : [...current, professionalId];
    void applyChange(serviceIndex, updated);
  };

  const markAllForService = (serviceIndex: number) => {
    const allIds = professionals.map((p) => p.id).filter((id): id is string => Boolean(id));
    void applyChange(serviceIndex, allIds);
  };

  const servicesWithoutProfessional = services.filter(
    (s) => !s.professionalIds || s.professionalIds.length === 0
  );

  if (professionals.length === 0 || services.length === 0) {
    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Quem faz o quê?</h2>
          <p className="text-sm text-muted-foreground">
            Marque quais serviços cada profissional executa.
          </p>
        </div>
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Adicione profissionais e serviços nas etapas anteriores para configurar as atribuições.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Quem faz o quê?</h2>
        <p className="text-sm text-muted-foreground">
          Marque quais serviços cada profissional executa. Deixar em branco significa que o serviço fica disponível para todos os profissionais.
        </p>
      </div>

      {servicesWithoutProfessional.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
          <span>
            {servicesWithoutProfessional.length === 1
              ? `O serviço "${servicesWithoutProfessional[0].name}" está disponível para todos os profissionais.`
              : `${servicesWithoutProfessional.length} serviços estão disponíveis para todos os profissionais.`}
          </span>
        </div>
      )}

      {/* Desktop: tabela */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 pr-4 font-medium text-muted-foreground min-w-[160px]">
                Serviço
              </th>
              {professionals.map((p) => (
                <th key={p.id} className="text-center py-2 px-3 font-medium min-w-[100px]">
                  {p.name}
                </th>
              ))}
              <th className="py-2 px-3 min-w-[100px]" />
            </tr>
          </thead>
          <tbody>
            {services.map((s, si) => (
              <tr key={s.id} className="border-b last:border-0">
                <td className="py-3 pr-4 font-medium">{s.name}</td>
                {professionals.map((p) => (
                  <td key={p.id} className="py-3 px-3 text-center">
                    <Checkbox
                      checked={p.id ? (s.professionalIds ?? []).includes(p.id) : false}
                      onCheckedChange={() => p.id && toggle(si, p.id)}
                      disabled={savingServiceIndex === si}
                    />
                  </td>
                ))}
                <td className="py-3 px-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground h-7"
                    onClick={() => markAllForService(si)}
                    disabled={savingServiceIndex === si}
                  >
                    {savingServiceIndex === si ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Marcar todos"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: por profissional com Switch */}
      <div className="md:hidden space-y-4">
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Profissional</p>
          <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {professionals.map((p) => (
                <SelectItem key={p.id} value={p.id ?? ""}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedProfessional && (
          <div className="space-y-2">
            {services.map((s, si) => {
              const checked = (s.professionalIds ?? []).includes(selectedProfessional);
              return (
                <div key={s.id} className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm font-medium">{s.name}</span>
                  <Switch
                    checked={checked}
                    onCheckedChange={() => toggle(si, selectedProfessional)}
                    disabled={savingServiceIndex === si}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
