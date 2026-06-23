import { AlertCircle } from "lucide-react";
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
import { useState } from "react";
import type { ProfessionalDraft, ServiceDraft } from "@/stores/onboarding";

type StepAssignmentsProps = {
  professionals: ProfessionalDraft[];
  services: ServiceDraft[];
  assignments: Record<string, string[]>;
  onAssignmentsChange: (assignments: Record<string, string[]>) => void;
};

function getProfessionalKey(index: number, p: ProfessionalDraft) {
  return p.id ?? `draft-${index}`;
}

function getServiceKey(index: number, s: ServiceDraft) {
  return s.id ?? `draft-svc-${index}`;
}

export function StepAssignments({
  professionals,
  services,
  assignments,
  onAssignmentsChange,
}: StepAssignmentsProps) {
  const [selectedProfessional, setSelectedProfessional] = useState<string>(
    professionals.length > 0 ? getProfessionalKey(0, professionals[0]) : ""
  );

  const toggle = (serviceKey: string, professionalKey: string) => {
    const current = assignments[serviceKey] ?? [];
    const updated = current.includes(professionalKey)
      ? current.filter((p) => p !== professionalKey)
      : [...current, professionalKey];
    onAssignmentsChange({ ...assignments, [serviceKey]: updated });
  };

  const markAllForService = (serviceKey: string) => {
    const allKeys = professionals.map((p, i) => getProfessionalKey(i, p));
    onAssignmentsChange({ ...assignments, [serviceKey]: allKeys });
  };

  const servicesWithoutProfessional = services.filter((s, i) => {
    const key = getServiceKey(i, s);
    return !assignments[key] || assignments[key].length === 0;
  });

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
          Marque quais serviços cada profissional executa.
        </p>
      </div>

      {servicesWithoutProfessional.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
          <span>
            {servicesWithoutProfessional.length === 1
              ? `O serviço "${servicesWithoutProfessional[0].name}" não tem nenhum profissional atribuído.`
              : `${servicesWithoutProfessional.length} serviços sem profissional atribuído.`}
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
              {professionals.map((p, pi) => (
                <th
                  key={getProfessionalKey(pi, p)}
                  className="text-center py-2 px-3 font-medium min-w-[100px]"
                >
                  {p.name}
                </th>
              ))}
              <th className="py-2 px-3 min-w-[100px]" />
            </tr>
          </thead>
          <tbody>
            {services.map((s, si) => {
              const sKey = getServiceKey(si, s);
              return (
                <tr key={sKey} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-medium">{s.name}</td>
                  {professionals.map((p, pi) => {
                    const pKey = getProfessionalKey(pi, p);
                    return (
                      <td key={pKey} className="py-3 px-3 text-center">
                        <Checkbox
                          checked={assignments[sKey]?.includes(pKey) ?? false}
                          onCheckedChange={() => toggle(sKey, pKey)}
                        />
                      </td>
                    );
                  })}
                  <td className="py-3 px-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground h-7"
                      onClick={() => markAllForService(sKey)}
                    >
                      Marcar todos
                    </Button>
                  </td>
                </tr>
              );
            })}
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
              {professionals.map((p, pi) => (
                <SelectItem key={getProfessionalKey(pi, p)} value={getProfessionalKey(pi, p)}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedProfessional && (
          <div className="space-y-2">
            {services.map((s, si) => {
              const sKey = getServiceKey(si, s);
              const checked = assignments[sKey]?.includes(selectedProfessional) ?? false;
              return (
                <div key={sKey} className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm font-medium">{s.name}</span>
                  <Switch
                    checked={checked}
                    onCheckedChange={() => toggle(sKey, selectedProfessional)}
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
