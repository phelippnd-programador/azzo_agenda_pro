import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Scissors, Trash2 } from "lucide-react";
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
import type { ServiceDraft } from "@/stores/onboarding";

const DURATIONS = [15, 20, 30, 45, 60, 90, 120];

const serviceSchema = z.object({
  name: z.string().min(2, "Nome Ã© obrigatÃ³rio"),
  durationMinutes: z.coerce.number().min(1, "DuraÃ§Ã£o Ã© obrigatÃ³ria"),
  price: z.coerce.number().min(0, "PreÃ§o Ã© obrigatÃ³rio"),
  description: z.string().optional(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

const SUGGESTIONS: Record<string, string[]> = {
  SALAO_FEMININO: ["Corte feminino", "ColoraÃ§Ã£o", "Escova", "Mechas", "HidrataÃ§Ã£o", "Progressiva"],
  BARBEARIA: ["Corte masculino", "Barba", "Combo corte e barba", "Sobrancelha", "Relaxamento"],
  CLINICA_ESTETICA: ["Limpeza de pele", "Peeling", "MicropigmentaÃ§Ã£o", "Design de sobrancelha", "DepilaÃ§Ã£o"],
  MISTO: ["Corte", "ColoraÃ§Ã£o", "Barba", "Manicure", "Pedicure", "Escova"],
};

type StepServicesProps = {
  services: ServiceDraft[];
  businessType: string | undefined;
  onAdd: (s: ServiceDraft) => void;
  onRemove: (index: number) => void;
};

export function StepServices({ services, businessType, onAdd, onRemove }: StepServicesProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [priceRaw, setPriceRaw] = useState("");

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { name: "", durationMinutes: 30, price: 0, description: "" },
  });

  const suggestions = businessType ? (SUGGESTIONS[businessType] ?? []) : [];
  const addedNames = new Set(services.map((s) => s.name.toLowerCase()));

  const onSubmit = (values: ServiceFormValues) => {
    onAdd(values as ServiceDraft);
    reset();
    setPriceRaw("");
    setSheetOpen(false);
  };

  const handleSuggestionClick = (name: string) => {
    if (!addedNames.has(name.toLowerCase())) {
      onAdd({ name, durationMinutes: 30, price: 0 });
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    setPriceRaw(digits);
    setValue("price", Number(digits), { shouldValidate: true });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Quais serviÃ§os vocÃªs oferecem?</h2>
        <p className="text-sm text-muted-foreground">
          Adicione os serviÃ§os do seu estabelecimento.
        </p>
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            SugestÃµes para o seu negÃ³cio
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
            <p className="text-sm font-medium">Nenhum serviÃ§o adicionado</p>
            <p className="text-xs text-muted-foreground">Use as sugestÃµes acima ou clique no botÃ£o abaixo</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {services.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{s.name}</p>
                <div className="flex items-center gap-2">
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
        Adicionar serviÃ§o
      </Button>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Novo serviÃ§o</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="svc-name">Nome do serviÃ§o *</Label>
              <Input id="svc-name" placeholder="Ex: Corte feminino" {...register("name")} />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="svc-duration">DuraÃ§Ã£o *</Label>
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
              <Label htmlFor="svc-price">PreÃ§o *</Label>
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
              <Label htmlFor="svc-desc">DescriÃ§Ã£o</Label>
              <Textarea
                id="svc-desc"
                placeholder="DescriÃ§Ã£o opcional do serviÃ§o"
                rows={3}
                {...register("description")}
              />
            </div>

            <SheetFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar serviÃ§o</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
