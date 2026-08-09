import { useEffect, useState } from 'react';
import { Loader2, MessageCircle } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogSection, DialogStickyFooter, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { maskPhoneBr } from '@/lib/input-masks';
import { utilsApi } from '@/lib/api';
import { resolveUiError } from '@/lib/error-utils';
import { toast } from 'sonner';
import { clientFormSchema, type ClientFormValues } from '@/schemas/client';
import type { Client } from '@/types';
import { DateInput } from "@/components/ui/date-input";

type ClientUpsertPayload = {
  name: string;
  email?: string;
  phone: string;
  birthDate?: string;
  notes?: string;
  cpfCnpj?: string;
  clientType?: 'PF' | 'PJ';
  whatsAppOptIn?: boolean;
  address: {
    zipCode?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
  };
};

type ClientUpsertDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialClient?: Client | null;
  onSubmit: (payload: ClientUpsertPayload, clientId?: string) => Promise<Client | void>;
  onSubmitted?: (client?: Client | void) => void;
};

const normalizeCep = (value: string) => value.replace(/\D/g, '').slice(0, 8);

const formatCep = (value: string) => {
  const cep = normalizeCep(value);
  if (cep.length <= 5) return cep;
  return `${cep.slice(0, 5)}-${cep.slice(5)}`;
};

const emptyDefaults: ClientFormValues = {
  name: '',
  email: '',
  phone: '',
  birthDate: '',
  whatsAppOptIn: false,
  notes: '',
  cpfCnpj: '',
  clientType: 'PF',
  zipCode: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
};

export function ClientUpsertDialog({
  open,
  onOpenChange,
  initialClient,
  onSubmit,
  onSubmitted,
}: ClientUpsertDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [lastResolvedCep, setLastResolvedCep] = useState('');

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: emptyDefaults,
  });

  useEffect(() => {
    if (!open) {
      reset(emptyDefaults);
      setLastResolvedCep('');
      return;
    }

    reset({
      name: initialClient?.name || '',
      email: initialClient?.email || '',
      phone: initialClient?.phone || '',
      birthDate: (initialClient?.birthDate as string) || '',
      whatsAppOptIn: initialClient?.whatsAppOptIn ?? false,
      notes: initialClient?.notes || '',
      cpfCnpj: initialClient?.cpfCnpj || '',
      clientType: initialClient?.clientType || 'PF',
      zipCode: initialClient?.address?.zipCode || '',
      street: initialClient?.address?.street || '',
      number: initialClient?.address?.number || '',
      complement: initialClient?.address?.complement || '',
      neighborhood: initialClient?.address?.neighborhood || '',
      city: initialClient?.address?.city || '',
      state: initialClient?.address?.state || '',
    });
    setLastResolvedCep(normalizeCep(initialClient?.address?.zipCode || ''));
  }, [initialClient, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const formZipCode = watch('zipCode');

  useEffect(() => {
    const cep = normalizeCep(formZipCode);

    if (cep.length < 8) {
      if (lastResolvedCep) setLastResolvedCep('');
      return;
    }

    if (cep === lastResolvedCep) return;

    const timer = setTimeout(async () => {
      try {
        setIsAddressLoading(true);
        const data = await utilsApi.getAddressByCep(cep);
        setValue('street', (data.street || '').trim());
        setValue('complement', (data.complement || '').trim());
        setValue('neighborhood', (data.neighborhood || '').trim());
        setValue('city', (data.city || '').trim());
        setValue('state', (data.state || '').trim().toUpperCase());
        setLastResolvedCep(cep);
      } catch (err) {
        toast.error(resolveUiError(err, 'Não foi possível buscar o endereço pelo CEP').message);
      } finally {
        setIsAddressLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formZipCode, lastResolvedCep]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmitForm = async (values: ClientFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await onSubmit(
        {
          name: values.name,
          email: values.email || undefined,
          phone: values.phone,
          birthDate: values.birthDate || undefined,
          whatsAppOptIn: values.whatsAppOptIn,
          notes: values.notes || undefined,
          cpfCnpj: values.cpfCnpj || undefined,
          clientType: values.clientType,
          address: {
            zipCode: values.zipCode || undefined,
            street: values.street || undefined,
            number: values.number || undefined,
            complement: values.complement || undefined,
            neighborhood: values.neighborhood || undefined,
            city: values.city || undefined,
            state: values.state || undefined,
          },
        },
        initialClient?.id
      );
      onOpenChange(false);
      onSubmitted?.(result);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onInvalid = () => {
    toast.error('Nome e telefone são obrigatórios');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mx-4 flex max-h-[85vh] max-w-md flex-col overflow-hidden sm:mx-auto sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b border-border/70 pb-4 pr-10">
          <DialogTitle>{initialClient ? 'Editar cliente' : 'Novo cliente'}</DialogTitle>
          <DialogDescription>
            {initialClient ? 'Atualize os dados do cliente' : 'Cadastre um novo cliente'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmitForm, onInvalid)} className="contents">
        <DialogBody className="min-h-0 flex-1 overflow-y-auto">
          <DialogSection>
            <p className="text-sm font-medium text-foreground">
              {initialClient ? 'Revise os dados principais e mantenha o cadastro atualizado.' : 'Comece com os dados essenciais e complemente o endereço se fizer sentido para a operação.'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Nome e telefone são os campos mínimos para criar o cadastro e seguir com o histórico do cliente.
            </p>
          </DialogSection>

          <DialogSection className="bg-transparent">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Dados principais</p>
              <p className="text-sm text-muted-foreground">Informações básicas para identificar o cliente e manter o relacionamento organizado.</p>
            </div>

            <div className="space-y-2">
              <Label>Nome completo *</Label>
              <Input
                placeholder="Nome do cliente"
                {...register('name')}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Telefone *</Label>
                <Input
                  placeholder="(11) 99999-0000"
                  {...register('phone', {
                    onChange: (e) => setValue('phone', maskPhoneBr(e.target.value)),
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  {...register('email')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Data de nascimento</Label>
              <DateInput
                {...register('birthDate')}
              />
              <p className="text-xs text-muted-foreground">Necessário para verificações de privacidade.</p>
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-2">
              <div className="flex items-start gap-3">
                <input
                  id="whatsapp-opt-in"
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 cursor-pointer rounded border-input accent-primary"
                  {...register('whatsAppOptIn')}
                />
                <div className="space-y-1">
                  <label
                    htmlFor="whatsapp-opt-in"
                    className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground"
                  >
                    <MessageCircle className="h-4 w-4 text-emerald-600" />
                    Aceito receber mensagens automáticas de lembrete de agendamento via WhatsApp
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Você pode cancelar a qualquer momento respondendo PARE no WhatsApp.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>CPF / CNPJ</Label>
                <Input
                  placeholder="000.000.000-00"
                  {...register('cpfCnpj', {
                    onChange: (e) => setValue('cpfCnpj', e.target.value.replace(/\D/g, '').slice(0, 14)),
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de pessoa</Label>
                <Controller
                  control={control}
                  name="clientType"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PF">Pessoa física (PF)</SelectItem>
                        <SelectItem value="PJ">Pessoa jurídica (PJ)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                placeholder="Preferências, alergias, etc."
                rows={3}
                {...register('notes')}
              />
            </div>
          </DialogSection>

          <DialogSection className="bg-transparent">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Endereço</p>
              <p className="text-sm text-muted-foreground">Opcional, mas útil para operação, segmentação e contexto de atendimento.</p>
            </div>

            <div className="space-y-2">
              <Label>CEP</Label>
              <Input
                placeholder="00000-000"
                {...register('zipCode', {
                  onChange: (e) => setValue('zipCode', formatCep(e.target.value)),
                })}
              />
              <p className="text-xs text-muted-foreground">
                {isAddressLoading ? 'Buscando endereço pelo CEP...' : 'Ao informar um CEP válido, o endereço será sugerido automaticamente.'}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Logradouro</Label>
              <Input
                placeholder="Rua, avenida..."
                {...register('street')}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Número</Label>
                <Input
                  placeholder="123"
                  {...register('number')}
                />
              </div>
              <div className="space-y-2">
                <Label>Complemento</Label>
                <Input
                  placeholder="Apto, sala..."
                  {...register('complement')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Bairro</Label>
              <Input
                placeholder="Bairro"
                {...register('neighborhood')}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input
                  placeholder="Cidade"
                  {...register('city')}
                />
              </div>
              <div className="space-y-2">
                <Label>UF</Label>
                <Input
                  placeholder="SP"
                  maxLength={2}
                  {...register('state', {
                    onChange: (e) => setValue('state', e.target.value.toUpperCase()),
                  })}
                />
              </div>
            </div>
          </DialogSection>
        </DialogBody>
        <DialogStickyFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {initialClient ? 'Salvando...' : 'Cadastrando...'}
              </>
            ) : (
              initialClient ? 'Salvar cliente' : 'Criar cliente'
            )}
          </Button>
        </DialogStickyFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
