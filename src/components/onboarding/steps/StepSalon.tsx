import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SalonDraft } from "@/stores/onboarding";

const salonSchema = z.object({
  name: z.string().min(2, "Nome do salão é obrigatório"),
  type: z.string().min(1, "Tipo de negócio é obrigatório"),
  phone: z.string().min(10, "Telefone é obrigatório"),
  city: z.string().min(2, "Cidade é obrigatória"),
  state: z.string().min(2, "Estado é obrigatório"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
});

type SalonFormValues = z.infer<typeof salonSchema>;

const BUSINESS_TYPES = [
  { value: "SALAO_FEMININO", label: "Salão Feminino" },
  { value: "BARBEARIA", label: "Barbearia" },
  { value: "CLINICA_ESTETICA", label: "Clínica de Estética" },
  { value: "MISTO", label: "Misto" },
];

const BR_STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

function applyPhoneMask(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim();
}

type StepSalonProps = {
  initialData: SalonDraft | null;
  onValidityChange: (valid: boolean) => void;
  onDataChange: (data: SalonDraft) => void;
};

export function StepSalon({ initialData, onValidityChange, onDataChange }: StepSalonProps) {
  const {
    register,
    control,
    watch,
    reset,
    formState: { errors, isValid, isDirty },
    setValue,
    getValues,
  } = useForm<SalonFormValues>({
    resolver: zodResolver(salonSchema),
    mode: "onChange",
    defaultValues: {
      name: initialData?.name ?? "",
      type: initialData?.type ?? "",
      phone: initialData?.phone ?? "",
      city: initialData?.city ?? "",
      state: initialData?.state ?? "",
      email: initialData?.email ?? "",
    },
  });

  useEffect(() => {
    onValidityChange(isValid);
  }, [isValid, onValidityChange]);

  // Pre-preenche com os dados do tenant (nome do salão, telefone, e-mail
  // informados no cadastro) quando eles chegam depois do mount — ex.: a
  // consulta ao perfil do salão ainda estava em andamento quando esta etapa
  // foi renderizada. Nunca sobrescreve o que a pessoa já digitou aqui.
  useEffect(() => {
    if (initialData && !isDirty) {
      reset({
        name: initialData.name ?? "",
        type: initialData.type ?? "",
        phone: initialData.phone ?? "",
        city: initialData.city ?? "",
        state: initialData.state ?? "",
        email: initialData.email ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  useEffect(() => {
    const subscription = watch((values) => {
      onDataChange(values as SalonDraft);
    });
    return () => subscription.unsubscribe();
  }, [watch, onDataChange]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Conte-nos sobre o seu salão</h2>
        <p className="text-sm text-muted-foreground">
          Essas informações serão usadas para personalizar sua experiência.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="salon-name">Nome do salão *</Label>
          <Input
            id="salon-name"
            placeholder="Ex: Salão da Maria"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="salon-type">Tipo de negócio *</Label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="salon-type">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.type && (
            <p className="text-xs text-destructive">{errors.type.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="salon-phone">Telefone *</Label>
          <Input
            id="salon-phone"
            placeholder="(11) 99999-9999"
            {...register("phone")}
            onChange={(e) => {
              const masked = applyPhoneMask(e.target.value);
              setValue("phone", masked, { shouldValidate: true });
              onDataChange({ ...getValues(), phone: masked });
            }}
          />
          {errors.phone && (
            <p className="text-xs text-destructive">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="salon-email">E-mail de contato</Label>
          <Input
            id="salon-email"
            type="email"
            placeholder="contato@seusalao.com.br"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="salon-city">Cidade *</Label>
          <Input
            id="salon-city"
            placeholder="São Paulo"
            {...register("city")}
          />
          {errors.city && (
            <p className="text-xs text-destructive">{errors.city.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="salon-state">Estado *</Label>
          <Controller
            name="state"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="salon-state">
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent>
                  {BR_STATES.map((uf) => (
                    <SelectItem key={uf} value={uf}>
                      {uf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.state && (
            <p className="text-xs text-destructive">{errors.state.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
