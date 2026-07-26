import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Trash2, UserCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { maskPhoneBr } from "@/lib/input-masks";
import { resolveUiError } from "@/lib/error-utils";
import { professionalsApi } from "@/lib/api/professionals";
import type { ProfessionalLimits } from "@/lib/api/contracts";
import { toast } from "sonner";
import type { ProfessionalDraft, WorkingHoursDraft } from "@/stores/onboarding";

const weekdayLabels: Record<number, string> = {
  0: "Domingo", 1: "Segunda", 2: "Terça", 3: "Quarta",
  4: "Quinta", 5: "Sexta", 6: "Sábado",
};

// Mesmo padrao de horario semanal default usado em ProfessionalFormDialog.tsx
// (cadastro real de profissionais): seg-sex 09-18, sab 09-13, dom fechado.
const defaultWorkingHours: WorkingHoursDraft[] = [
  { dayOfWeek: 1, startTime: "09:00", endTime: "18:00", isWorking: true },
  { dayOfWeek: 2, startTime: "09:00", endTime: "18:00", isWorking: true },
  { dayOfWeek: 3, startTime: "09:00", endTime: "18:00", isWorking: true },
  { dayOfWeek: 4, startTime: "09:00", endTime: "18:00", isWorking: true },
  { dayOfWeek: 5, startTime: "09:00", endTime: "18:00", isWorking: true },
  { dayOfWeek: 6, startTime: "09:00", endTime: "13:00", isWorking: true },
  { dayOfWeek: 0, startTime: "00:00", endTime: "00:00", isWorking: false },
];

const professionalSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().min(14, "Telefone é obrigatório"),
});

type ProfessionalFormValues = z.infer<typeof professionalSchema>;

type StepProfessionalsProps = {
  professionals: ProfessionalDraft[];
  onAdd: (p: ProfessionalDraft) => Promise<void>;
  onRemove: (index: number) => Promise<void>;
};

export function StepProfessionals({ professionals, onAdd, onRemove }: StepProfessionalsProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [specialtyInput, setSpecialtyInput] = useState("");
  const [workingHours, setWorkingHours] = useState<WorkingHoursDraft[]>(defaultWorkingHours);
  const [isSaving, setIsSaving] = useState(false);
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);
  const [limits, setLimits] = useState<ProfessionalLimits | null>(null);
  const [limitsError, setLimitsError] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfessionalFormValues>({
    resolver: zodResolver(professionalSchema),
    defaultValues: { name: "", email: "", phone: "" },
  });

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

  const addSpecialty = () => {
    const value = specialtyInput.trim();
    if (!value || specialties.includes(value)) {
      setSpecialtyInput("");
      return;
    }
    setSpecialties((prev) => [...prev, value]);
    setSpecialtyInput("");
  };

  const removeSpecialty = (value: string) => {
    setSpecialties((prev) => prev.filter((s) => s !== value));
  };

  const updateWorkingHour = (dayOfWeek: number, field: "startTime" | "endTime" | "isWorking", value: string | boolean) => {
    setWorkingHours((prev) => prev.map((item) => (item.dayOfWeek === dayOfWeek ? { ...item, [field]: value } : item)));
  };

  const resetForm = () => {
    reset();
    setSpecialties([]);
    setSpecialtyInput("");
    setWorkingHours(defaultWorkingHours);
  };

  const onSubmit = async (values: ProfessionalFormValues) => {
    const invalidWorkingRange = workingHours.some((item) => item.isWorking && item.startTime >= item.endTime);
    if (invalidWorkingRange) {
      toast.error("Revise os horários: o início deve ser menor que o fim.");
      return;
    }
    setIsSaving(true);
    try {
      await onAdd({
        name: values.name,
        email: values.email,
        phone: values.phone,
        specialties,
        workingHours,
      });
      resetForm();
      setSheetOpen(false);
      loadLimits();
    } catch (error) {
      toast.error(resolveUiError(error, "Não foi possível salvar o profissional. Tente novamente.").message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (index: number) => {
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
            <div
              key={p.id ?? i}
              className="flex items-center justify-between rounded-lg border p-3"
            >
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
        onClick={() => setSheetOpen(true)}
        disabled={reachedLimit}
      >
        <Plus className="mr-2 h-4 w-4" />
        Adicionar profissional
      </Button>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Novo profissional</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <p className="rounded-lg border border-emerald-200/70 bg-emerald-50/80 p-3 text-xs text-emerald-900">
              Ao salvar, o sistema cria o acesso do profissional automaticamente e envia uma senha temporária para o e-mail informado.
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="pro-name">Nome completo *</Label>
              <Input id="pro-name" placeholder="Nome completo" {...register("name")} />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="pro-email">E-mail *</Label>
                <Input id="pro-email" type="email" placeholder="email@exemplo.com" {...register("email")} />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pro-phone">Telefone *</Label>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="pro-phone"
                      placeholder="(11) 99999-0000"
                      value={field.value}
                      onChange={(e) => field.onChange(maskPhoneBr(e.target.value))}
                    />
                  )}
                />
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pro-specialty">Especialidades</Label>
              <div className="flex gap-2">
                <Input
                  id="pro-specialty"
                  placeholder="Ex: Corte, Coloração"
                  value={specialtyInput}
                  onChange={(e) => setSpecialtyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSpecialty();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addSpecialty}>
                  Adicionar
                </Button>
              </div>
              {specialties.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {specialties.map((s) => (
                    <Badge key={s} variant="secondary" className="gap-1 text-xs">
                      {s}
                      <button type="button" onClick={() => removeSpecialty(s)} aria-label={`Remover ${s}`}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Horário de trabalho</Label>
              <div className="space-y-2 rounded-xl border p-3">
                {workingHours
                  .slice()
                  .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                  .map((hour) => (
                    <div
                      key={hour.dayOfWeek}
                      className="grid grid-cols-1 items-center gap-2 rounded-lg border bg-muted/10 p-2 sm:grid-cols-[92px_1fr_1fr_auto]"
                    >
                      <span className="text-xs font-medium text-muted-foreground">{weekdayLabels[hour.dayOfWeek]}</span>
                      <Input
                        type="time"
                        value={hour.startTime}
                        onChange={(e) => updateWorkingHour(hour.dayOfWeek, "startTime", e.target.value)}
                        disabled={!hour.isWorking}
                      />
                      <Input
                        type="time"
                        value={hour.endTime}
                        onChange={(e) => updateWorkingHour(hour.dayOfWeek, "endTime", e.target.value)}
                        disabled={!hour.isWorking}
                      />
                      <Switch
                        checked={hour.isWorking}
                        onCheckedChange={(checked) => updateWorkingHour(hour.dayOfWeek, "isWorking", checked)}
                      />
                    </div>
                  ))}
              </div>
            </div>

            <SheetFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)} disabled={isSaving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Criar profissional
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
