import { useEffect, useState } from 'react';
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
import { parseDecimalInput } from '@/lib/format';
import type { Service } from '@/types';

/** Categorias do catalogo. Espelha a lista da pagina de servicos (sem "Todos", que e so filtro). */
export const SERVICE_CATEGORIES = ['Cabelo', 'Barba', 'Unhas', 'Estetica', 'Maquiagem', 'Outros'];

type ServiceFormErrors = {
  name?: string;
  duration?: string;
  price?: string;
};

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
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDuration, setFormDuration] = useState('60');
  const [formPrice, setFormPrice] = useState(0);
  const [formCategory, setFormCategory] = useState('Cabelo');
  const [formProfessionalIds, setFormProfessionalIds] = useState<string[]>([]);
  const [formIsActive, setFormIsActive] = useState(true);
  // F02 — sinal de reserva (anti no-show) no agendamento publico
  const [formSinalObrigatorio, setFormSinalObrigatorio] = useState(false);
  const [formSinalTipo, setFormSinalTipo] = useState<'PERCENTUAL' | 'FIXO'>('PERCENTUAL');
  const [formSinalValor, setFormSinalValor] = useState('');
  const [formErrors, setFormErrors] = useState<ServiceFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(!advancedCollapsed);

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormDuration('60');
    setFormPrice(0);
    setFormCategory('Cabelo');
    setFormProfessionalIds([]);
    setFormIsActive(true);
    setFormSinalObrigatorio(false);
    setFormSinalTipo('PERCENTUAL');
    setFormSinalValor('');
    setFormErrors({});
    setAdvancedOpen(!advancedCollapsed);
  };

  useEffect(() => {
    if (!open) return;
    if (!editingService) {
      resetForm();
      setFormName(initialName ?? '');
      return;
    }
    const service = editingService;
    setFormName(service.name);
    setFormDescription(service.description);
    setFormDuration(String(service.duration));
    setFormPrice(service.price);
    setFormCategory(service.category);
    setFormProfessionalIds(Array.isArray(service.professionalIds) ? service.professionalIds : []);
    setFormIsActive(service.isActive);
    setFormSinalObrigatorio(Boolean(service.sinalObrigatorio));
    setFormSinalTipo(service.sinalTipo === 'FIXO' ? 'FIXO' : 'PERCENTUAL');
    setFormSinalValor(service.sinalValor != null ? String(service.sinalValor) : '');
    setFormErrors({});
    setAdvancedOpen(!advancedCollapsed);
  }, [open, editingService, initialName]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleProfessional = (professionalId: string) => {
    setFormProfessionalIds((prev) =>
      prev.includes(professionalId)
        ? prev.filter((id) => id !== professionalId)
        : [...prev, professionalId]
    );
  };

  const handleSubmit = async () => {
    const nextErrors: ServiceFormErrors = {};
    const durationValue = Number.parseInt(formDuration, 10);

    if (!formName.trim()) {
      nextErrors.name = 'Informe o nome do servico.';
    }
    if (!formDuration.trim() || !Number.isFinite(durationValue) || durationValue <= 0) {
      nextErrors.duration = 'Informe uma duracao valida em minutos.';
    }
    if (!Number.isFinite(formPrice) || formPrice <= 0) {
      nextErrors.price = 'Informe um preco maior que zero.';
    }
    const sinalValorNumber = parseDecimalInput(formSinalValor);
    if (formSinalObrigatorio) {
      if (!formSinalValor.trim() || !Number.isFinite(sinalValorNumber) || sinalValorNumber <= 0) {
        toast.error('Informe o valor do sinal (maior que zero).');
        return;
      }
      if (formSinalTipo === 'PERCENTUAL' && sinalValorNumber > 100) {
        toast.error('O sinal percentual nao pode exceder 100%.');
        return;
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      toast.error('Preencha todos os campos obrigatorios');
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);
    try {
      const serviceData: ServiceFormPayload = {
        name: formName.trim(),
        description: formDescription,
        duration: durationValue,
        price: formPrice,
        category: formCategory,
        professionalIds: formProfessionalIds,
        isActive: formIsActive,
        sinalObrigatorio: formSinalObrigatorio,
        sinalTipo: formSinalObrigatorio ? formSinalTipo : null,
        sinalValor: formSinalObrigatorio ? sinalValorNumber : null,
      };

      if (editingService) {
        await onUpdate(editingService.id, serviceData);
      } else {
        await onCreate(serviceData);
      }

      onOpenChange(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
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
          <Switch checked={formSinalObrigatorio} onCheckedChange={setFormSinalObrigatorio} />
        </div>
        {formSinalObrigatorio && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="sinal-tipo">Tipo do sinal</Label>
              <Select
                value={formSinalTipo}
                onValueChange={(value) => setFormSinalTipo(value as 'PERCENTUAL' | 'FIXO')}
              >
                <SelectTrigger id="sinal-tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTUAL">Percentual do preco (%)</SelectItem>
                  <SelectItem value="FIXO">Valor fixo (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sinal-valor">
                {formSinalTipo === 'PERCENTUAL' ? 'Percentual (1 a 100)' : 'Valor (R$)'}
              </Label>
              <Input
                id="sinal-valor"
                inputMode="decimal"
                placeholder={formSinalTipo === 'PERCENTUAL' ? '30' : '20,00'}
                value={formSinalValor}
                onChange={(e) => setFormSinalValor(e.target.value)}
              />
            </div>
          </div>
        )}
      </DialogSection>

      <DialogSection className="flex flex-col gap-3 bg-transparent sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Label>Servico ativo</Label>
          <p className="text-xs text-muted-foreground">Disponivel para agendamento</p>
        </div>
        <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
      </DialogSection>
    </>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) resetForm();
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
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                  if (formErrors.name) {
                    setFormErrors((current) => ({ ...current, name: undefined }));
                  }
                }}
                aria-invalid={Boolean(formErrors.name)}
              />
              {formErrors.name ? <p className="text-xs text-destructive">{formErrors.name}</p> : null}
            </div>

            <div className="space-y-2">
              <Label>Descricao</Label>
              <Textarea
                placeholder="Descreva o servico..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Duracao (min) *</Label>
                <Input
                  type="number"
                  placeholder="60"
                  value={formDuration}
                  onChange={(e) => {
                    setFormDuration(e.target.value);
                    if (formErrors.duration) {
                      setFormErrors((current) => ({ ...current, duration: undefined }));
                    }
                  }}
                  aria-invalid={Boolean(formErrors.duration)}
                />
                {formErrors.duration ? (
                  <p className="text-xs text-destructive">{formErrors.duration}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label>Preco (R$) *</Label>
                <CurrencyInput
                  value={formPrice}
                  onChange={(val) => {
                    setFormPrice(val);
                    if (formErrors.price) {
                      setFormErrors((current) => ({ ...current, price: undefined }));
                    }
                  }}
                  aria-invalid={Boolean(formErrors.price)}
                />
                {formErrors.price ? (
                  <p className="text-xs text-destructive">{formErrors.price}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
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
                        checked={formProfessionalIds.includes(professional.id)}
                        onCheckedChange={() => toggleProfessional(professional.id)}
                      />
                      <span>{professional.name}</span>
                      {professional.isActive === false ? (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">
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
              {formProfessionalIds.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {formProfessionalIds.map((id) => {
                    const professional = professionals.find((item) => item.id === id);
                    if (!professional) return null;
                    return (
                      <Badge key={id} variant="secondary" className="text-[10px] sm:text-xs">
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
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
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
      </DialogContent>
    </Dialog>
  );
}
