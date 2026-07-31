import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogSection,
  DialogStickyFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { serviceFormSchema, type ServiceFormValues } from '@/schemas/service';
import type { Service } from '@/types';

/** Categorias do catalogo. Espelha a lista da pagina de servicos (sem "Todos", que e so filtro). */
export const SERVICE_CATEGORIES = ['Cabelo', 'Barba', 'Unhas', 'Estetica', 'Maquiagem', 'Outros'];

export type ServiceFormPayload = {
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
  professionalIds: string[];
  isActive: boolean;
  sinalObrigatorio: boolean;
  sinalTipo: 'PERCENTUAL' | 'FIXO' | null;
  sinalValor: number | null;
};

type ProfessionalOption = {
  id: string;
  name: string;
  isActive?: boolean;
};

interface ServiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Servico em edicao, ou null para criacao. */
  editingService: Service | null;
  professionals: ProfessionalOption[];
  isLoadingProfessionals: boolean;
  onCreate: (data: ServiceFormPayload) => Promise<unknown>;
  onUpdate: (id: string, data: Partial<ServiceFormPayload>) => Promise<unknown>;
  /**
   * Agrupa sinal/PIX e "servico ativo" num bloco "Opcoes avancadas" recolhido.
   * Usado pelo onboarding para nao competir com o essencial no primeiro uso —
   * os campos continuam existindo e funcionando igual. Default false mantem o
   * layout da pagina consolidada intacto.
   */
  advancedCollapsed?: boolean;
  /** Nome pre-preenchido ao abrir em modo criacao (sugestoes do onboarding). */
  initialName?: string;
}

const emptyDefaults: ServiceFormValues = {
  name: '',
  description: '',
  duration: '60',
  price: 0,
  category: 'Cabelo',
  professionalIds: [],
  isActive: true,
  sinalObrigatorio: false,
  sinalTipo: 'PERCENTUAL',
  sinalValor: '',
};

export function ServiceFormDialog({
  open,
  onOpenChange,
  editingService,
  professionals,
  isLoadingProfessionals,
  onCreate,
  onUpdate,
  advancedCollapsed = false,
  initialName,
}: ServiceFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(!advancedCollapsed);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: emptyDefaults,
  });

  useEffect(() => {
    if (!open) return;
    if (!editingService) {
      reset({ ...emptyDefaults, name: initialName ?? '' });
      setAdvancedOpen(!advancedCollapsed);
      return;
    }
    const service = editingService;
    reset({
      name: service.name,
      description: service.description,
      duration: String(service.duration),
      price: service.price,
      category: service.category,
      professionalIds: Array.isArray(service.professionalIds) ? service.professionalIds : [],
      isActive: service.isActive,
      sinalObrigatorio: Boolean(service.sinalObrigatorio),
      sinalTipo: service.sinalTipo === 'FIXO' ? 'FIXO' : 'PERCENTUAL',
      sinalValor: service.sinalValor != null ? String(service.sinalValor) : '',
    });
    setAdvancedOpen(!advancedCollapsed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingService, initialName]);

  const professionalIds = watch('professionalIds');
  const sinalObrigatorio = watch('sinalObrigatorio');
  const sinalTipo = watch('sinalTipo');

  const toggleProfessional = (professionalId: string) => {
    const next = professionalIds.includes(professionalId)
      ? professionalIds.filter((id) => id !== professionalId)
      : [...professionalIds, professionalId];
    setValue('professionalIds', next, { shouldDirty: true });
  };

  const closeAndReset = () => {
    onOpenChange(false);
    reset(emptyDefaults);
  };

  const onSubmit = async (values: ServiceFormValues) => {
    setIsSubmitting(true);
    try {
      const sinalValorNumber = values.sinalObrigatorio
        ? Number(values.sinalValor.replace(',', '.'))
        : null;
      const serviceData: ServiceFormPayload = {
        name: values.name.trim(),
        description: values.description,
        duration: Number.parseInt(values.duration, 10),
        price: values.price,
        category: values.category,
        professionalIds: values.professionalIds,
        isActive: values.isActive,
        sinalObrigatorio: values.sinalObrigatorio,
        sinalTipo: values.sinalObrigatorio ? values.sinalTipo : null,
        sinalValor: sinalValorNumber,
      };

      if (editingService) {
        await onUpdate(editingService.id, serviceData);
      } else {
        await onCreate(serviceData);
      }

      onOpenChange(false);
      reset(emptyDefaults);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onInvalid = () => {
    toast.error('Preencha todos os campos obrigatorios');
  };

  const depositAndActiveFields = (
    <>
      <DialogSection className="space-y-3 bg-transparent">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Label>Exigir sinal no agendamento online</Label>
            <p className="text-xs text-muted-foreground">
              Cliente paga um PIX antecipado para confirmar o horario (anti no-show).
            </p>
          </div>
          <Controller
            control={control}
            name="sinalObrigatorio"
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
        </div>
        {sinalObrigatorio && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="sinal-tipo">Tipo do sinal</Label>
              <Controller
                control={control}
                name="sinalTipo"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="sinal-tipo">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTUAL">Percentual do preco (%)</SelectItem>
                      <SelectItem value="FIXO">Valor fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sinal-valor">
                {sinalTipo === 'PERCENTUAL' ? 'Percentual (1 a 100)' : 'Valor (R$)'}
              </Label>
              <Input
                id="sinal-valor"
                inputMode="decimal"
                placeholder={sinalTipo === 'PERCENTUAL' ? '30' : '20,00'}
                aria-invalid={Boolean(errors.sinalValor)}
                {...register('sinalValor')}
              />
              {errors.sinalValor ? (
                <p className="text-xs text-destructive">{errors.sinalValor.message}</p>
              ) : null}
            </div>
          </div>
        )}
      </DialogSection>

      <DialogSection className="flex flex-col gap-3 bg-transparent sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Label>Servico ativo</Label>
          <p className="text-xs text-muted-foreground">Disponivel para agendamento</p>
        </div>
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
      </DialogSection>
    </>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) reset(emptyDefaults);
      }}
    >
      {/*
        O scroll fica no DialogBody, nao no DialogContent: o DialogStickyFooter
        usa position:sticky e, com o DialogContent em `grid` + overflow, o bloco
        conteiner do rodape vira a propria celula do grid (altura exata dele),
        sem espaco para grudar — o rodape acabava rolando no meio do conteudo.
      */}
      <DialogContent className="mx-4 flex max-h-[85vh] max-w-md flex-col overflow-hidden sm:mx-auto sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b border-border/70 pb-4 pr-10">
          <DialogTitle>{editingService ? 'Editar servico' : 'Novo servico'}</DialogTitle>
          <DialogDescription>
            {editingService ? 'Atualize os dados do servico' : 'Preencha os dados do novo servico'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="contents">
        <DialogBody className="min-h-0 flex-1 overflow-y-auto">
          <DialogSection>
            <p className="text-sm font-medium text-foreground">
              {editingService
                ? 'Revise nome, duracao, preco e disponibilidade antes de salvar.'
                : 'Cadastre o servico com nome claro, preco e duracao para manter o catalogo consistente.'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Se nenhum profissional for marcado, o servico continua disponivel para toda a equipe.
            </p>
          </DialogSection>

          <DialogSection className="bg-transparent">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Estrutura do servico</p>
              <p className="text-sm text-muted-foreground">
                Defina nome, categoria, duracao e preco com o minimo de ambiguidade operacional.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Nome do servico *</Label>
              <Input
                placeholder="Ex: Corte Feminino"
                aria-invalid={Boolean(errors.name)}
                {...register('name')}
              />
              {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
            </div>

            <div className="space-y-2">
              <Label>Descricao</Label>
              <Textarea
                placeholder="Descreva o servico..."
                rows={3}
                {...register('description')}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Duracao (min) *</Label>
                <Input
                  type="number"
                  placeholder="60"
                  aria-invalid={Boolean(errors.duration)}
                  {...register('duration')}
                />
                {errors.duration ? (
                  <p className="text-xs text-destructive">{errors.duration.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label>Preco (R$) *</Label>
                <Controller
                  control={control}
                  name="price"
                  render={({ field }) => (
                    <CurrencyInput
                      value={field.value}
                      onChange={field.onChange}
                      aria-invalid={Boolean(errors.price)}
                    />
                  )}
                />
                {errors.price ? (
                  <p className="text-xs text-destructive">{errors.price.message}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </DialogSection>

          <DialogSection className="bg-transparent">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Equipe elegivel</p>
              <p className="text-sm text-muted-foreground">
                Restrinja quando o servico depender de pessoas especificas. Caso contrario, mantenha o
                atendimento aberto para todos.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Profissionais</Label>
              <div className="max-h-48 space-y-3 overflow-y-auto rounded-xl border border-border/70 bg-background/80 p-3">
                {isLoadingProfessionals ? (
                  <p className="text-sm text-muted-foreground">Carregando profissionais...</p>
                ) : !professionals.length ? (
                  <p className="text-sm text-muted-foreground">Nenhum profissional cadastrado.</p>
                ) : (
                  professionals.map((professional) => (
                    <label
                      key={professional.id}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <Checkbox
                        checked={professionalIds.includes(professional.id)}
                        onCheckedChange={() => toggleProfessional(professional.id)}
                      />
                      <span>{professional.name}</span>
                      {professional.isActive === false ? (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          Inativo
                        </Badge>
                      ) : null}
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Servicos sem profissional vinculado nao aparecem no agendamento.
              </p>
              {professionalIds.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {professionalIds.map((id) => {
                    const professional = professionals.find((item) => item.id === id);
                    if (!professional) return null;
                    return (
                      <Badge key={id} variant="secondary" className="text-xs sm:text-xs">
                        {professional.name}
                      </Badge>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </DialogSection>

          {advancedCollapsed ? (
            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="flex w-full items-center justify-between px-4 text-sm font-medium"
                >
                  Opcoes avancadas
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>{depositAndActiveFields}</CollapsibleContent>
            </Collapsible>
          ) : (
            depositAndActiveFields
          )}
        </DialogBody>
        <DialogStickyFooter>
          <Button type="button" variant="outline" onClick={closeAndReset}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {editingService ? 'Salvando...' : 'Criando...'}
              </>
            ) : editingService ? (
              'Salvar servico'
            ) : (
              'Criar servico'
            )}
          </Button>
        </DialogStickyFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
