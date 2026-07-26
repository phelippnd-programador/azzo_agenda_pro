import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Scissors, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { formatCurrency } from "@/lib/format";
import { resolveUiError } from "@/lib/error-utils";
import { toast } from "sonner";
import type { ServiceDraft } from "@/stores/onboarding";

const DURATIONS = [15, 20, 30, 45, 60, 90, 120];

// Mesma lista fixa usada em ServicesOverviewPage.tsx (cadastro real de servicos).
const CATEGORIES = ["Cabelo", "Barba", "Unhas", "Estetica", "Maquiagem", "Outros"];

const serviceSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  durationMinutes: z.coerce.number().min(1, "Duração é obrigatória"),
  price: z.coerce.number().min(0, "Preço é obrigatório"),
  category: z.string().min(1, "Categoria é obrigatória"),
  description: z.string().optional(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

const SUGGESTIONS: Record<string, string[]> = {
  SALAO_FEMININO: ["Corte feminino", "Coloração", "Escova", "Mechas", "Hidratação", "Progressiva"],
  BARBEARIA: ["Corte masculino", "Barba", "Combo corte e barba", "Sobrancelha", "Relaxamento"],
  CLINICA_ESTETICA: ["Limpeza de pele", "Peeling", "Micropigmentação", "Design de sobrancelha", "Depilação"],
  MISTO: ["Corte", "Coloração", "Barba", "Manicure", "Pedicure", "Escova"],
};

type StepServicesProps = {
  services: ServiceDraft[];
  businessType: string | undefined;
  onAdd: (s: ServiceDraft) => Promise<void>;
  onRemove: (index: number) => Promise<void>;
};

export function StepServices({ services, businessType, onAdd, onRemove }: StepServicesProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [priceRaw, setPriceRaw] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { name: "", durationMinutes: 30, price: 0, category: "Cabelo", description: "" },
  });

  const suggestions = businessType ? (SUGGESTIONS[businessType] ?? []) : [];
  const addedNames = new Set(services.map((s) => s.name.toLowerCase()));

  const onSubmit = async (values: ServiceFormValues) => {
    setIsSaving(true);
    try {
      await onAdd({ ...values, professionalIds: [] });
      reset();
      setPriceRaw("");
      setSheetOpen(false);
    } catch (error) {
      toast.error(resolveUiError(error, "Não foi possível salvar o serviço. Tente novamente.").message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSuggestionClick = (name: string) => {
    if (!addedNames.has(name.toLowerCase())) {
      setValue("name", name, { shouldValidate: true });
      setSheetOpen(true);
    }
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

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    setPriceRaw(digits);
    setValue("price", Number(digits) / 100, { shouldValidate: true });
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
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSuggestionClick(s)}
                disabled={addedNames.has(s.toLowerCase())}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  addedNames.has(s.toLowerCase())
                    ? "border-primary/40 bg-primary/10 text-primary cursor-default"
                    : "border-border hover:border-primary hover:text-primary"
                }`}
              >
                {addedNames.has(s.toLowerCase()) ? "+" : "+"} {s}
              </button>
            ))}
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
            <div
              key={s.id ?? i}
              className="flex items-center justify-between rounded-lg border p-3"
            >
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
                    <span className="text-xs text-muted-foreground">
                      {formatCurrency(s.price)}
                    </span>
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

      <Button variant="outline" className="w-full" onClick={() => setSheetOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Adicionar serviço
      </Button>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Novo serviço</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="svc-name">Nome do serviço *</Label>
              <Input id="svc-name" placeholder="Ex: Corte feminino" {...register("name")} />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="svc-category">Categoria *</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="svc-category">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && (
                <p className="text-xs text-destructive">{errors.category.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="svc-duration">Duração *</Label>
              <Controller
                name="durationMinutes"
                control={control}
                render={({ field }) => (
                  <Select
                    value={String(field.value)}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger id="svc-duration">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATIONS.map((d) => (
                        <SelectItem key={d} value={String(d)}>
                          {d} minutos
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.durationMinutes && (
                <p className="text-xs text-destructive">{errors.durationMinutes.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="svc-price">Preço *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  R$
                </span>
                <Input
                  id="svc-price"
                  className="pl-9"
                  placeholder="0,00"
                  value={
                    priceRaw
                      ? (Number(priceRaw) / 100).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : ""
                  }
                  onChange={handlePriceChange}
                />
              </div>
              {errors.price && (
                <p className="text-xs text-destructive">{errors.price.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="svc-desc">Descrição</Label>
              <Textarea
                id="svc-desc"
                placeholder="Descrição opcional do serviço"
                rows={3}
                {...register("description")}
              />
            </div>

            <SheetFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)} disabled={isSaving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Salvar serviço
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
