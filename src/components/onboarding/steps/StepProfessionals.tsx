import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProfessionalDraft, BusinessHoursDraft, DayOfWeek } from "@/stores/onboarding";

const ROLES = [
  { value: "CABELEIREIRO", label: "Cabeleireiro(a)" },
  { value: "BARBEIRO", label: "Barbeiro" },
  { value: "ESTETICISTA", label: "Esteticista" },
  { value: "MANICURE", label: "Manicure/Pedicure" },
  { value: "MAQUIADOR", label: "Maquiador(a)" },
  { value: "OUTRO", label: "Outro" },
];

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: "SEG", label: "Seg" },
  { key: "TER", label: "Ter" },
  { key: "QUA", label: "Qua" },
  { key: "QUI", label: "Qui" },
  { key: "SEX", label: "Sex" },
  { key: "SAB", label: "Sáb" },
  { key: "DOM", label: "Dom" },
];

const professionalSchema = z
  .object({
    name: z.string().min(2, "Nome é obrigatório"),
    role: z.string().min(1, "Função é obrigatória"),
    days: z.array(z.string()).min(1, "Selecione ao menos um dia"),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  })
  .refine(
    (data) =>
      data.days.length === 0 || (data.startTime && data.endTime),
    { message: "Informe o horário de início e fim", path: ["startTime"] }
  );

type ProfessionalFormValues = z.infer<typeof professionalSchema>;

type StepProfessionalsProps = {
  professionals: ProfessionalDraft[];
  onAdd: (p: ProfessionalDraft) => void;
  onRemove: (index: number) => void;
};

export function StepProfessionals({ professionals, onAdd, onRemove }: StepProfessionalsProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProfessionalFormValues>({
    resolver: zodResolver(professionalSchema),
    defaultValues: { name: "", role: "", days: [], startTime: "", endTime: "" },
  });

  const selectedDays = watch("days") || [];

  const onSubmit = (values: ProfessionalFormValues) => {
    const businessHours: BusinessHoursDraft[] = values.days.map((day) => ({
      day: day as DayOfWeek,
      startTime: values.startTime ?? "09:00",
      endTime: values.endTime ?? "18:00",
    }));
    onAdd({ name: values.name, role: values.role, businessHours });
    reset();
    setSheetOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Quem trabalha no seu salão?</h2>
        <p className="text-sm text-muted-foreground">
          Adicione os profissionais que realizam atendimentos.
        </p>
      </div>

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
              key={i}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium">{p.name}</p>
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs text-muted-foreground mr-1">
                    {ROLES.find((r) => r.value === p.role)?.label ?? p.role}
                  </span>
                  {p.businessHours.map((bh) => (
                    <Badge key={bh.day} variant="secondary" className="text-xs px-1.5 py-0">
                      {bh.day}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => onRemove(i)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button variant="outline" className="w-full" onClick={() => setSheetOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Adicionar profissional
      </Button>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Novo profissional</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pro-name">Nome *</Label>
              <Input id="pro-name" placeholder="Nome completo" {...register("name")} />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pro-role">Função *</Label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="pro-role">
                      <SelectValue placeholder="Selecione a função" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.role && (
                <p className="text-xs text-destructive">{errors.role.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Dias de atendimento *</Label>
              <Controller
                name="days"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((d) => {
                      const checked = field.value.includes(d.key);
                      return (
                        <label
                          key={d.key}
                          className={`flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                            checked
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          <Checkbox
                            className="sr-only"
                            checked={checked}
                            onCheckedChange={(ch) => {
                              if (ch) {
                                field.onChange([...field.value, d.key]);
                              } else {
                                field.onChange(field.value.filter((v) => v !== d.key));
                              }
                            }}
                          />
                          {d.label}
                        </label>
                      );
                    })}
                  </div>
                )}
              />
              {errors.days && (
                <p className="text-xs text-destructive">{errors.days.message}</p>
              )}
            </div>

            {selectedDays.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pro-start">Início *</Label>
                  <Input id="pro-start" type="time" {...register("startTime")} />
                  {errors.startTime && (
                    <p className="text-xs text-destructive">{errors.startTime.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pro-end">Fim *</Label>
                  <Input id="pro-end" type="time" {...register("endTime")} />
                </div>
              </div>
            )}

            <SheetFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar profissional</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
