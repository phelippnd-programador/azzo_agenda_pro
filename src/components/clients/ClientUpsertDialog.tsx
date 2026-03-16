import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { maskPhoneBr } from '@/lib/input-masks';
import { utilsApi } from '@/lib/api';
import { resolveUiError } from '@/lib/error-utils';
import { toast } from 'sonner';
import type { Client } from '@/types';

type ClientUpsertPayload = {
  name: string;
  email?: string;
  phone: string;
  birthDate?: string;
  notes?: string;
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
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formBirthDate, setFormBirthDate] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formZipCode, setFormZipCode] = useState('');
  const [formStreet, setFormStreet] = useState('');
  const [formNumber, setFormNumber] = useState('');
  const [formComplement, setFormComplement] = useState('');
  const [formNeighborhood, setFormNeighborhood] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('');

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormBirthDate('');
    setFormNotes('');
    setFormZipCode('');
    setFormStreet('');
    setFormNumber('');
    setFormComplement('');
    setFormNeighborhood('');
    setFormCity('');
    setFormState('');
    setLastResolvedCep('');
  };

  useEffect(() => {
    if (!open) {
      resetForm();
      return;
    }

    setFormName(initialClient?.name || '');
    setFormEmail(initialClient?.email || '');
    setFormPhone(initialClient?.phone || '');
    setFormBirthDate((initialClient?.birthDate as string) || '');
    setFormNotes(initialClient?.notes || '');
    setFormZipCode(initialClient?.address?.zipCode || '');
    setFormStreet(initialClient?.address?.street || '');
    setFormNumber(initialClient?.address?.number || '');
    setFormComplement(initialClient?.address?.complement || '');
    setFormNeighborhood(initialClient?.address?.neighborhood || '');
    setFormCity(initialClient?.address?.city || '');
    setFormState(initialClient?.address?.state || '');
    setLastResolvedCep(normalizeCep(initialClient?.address?.zipCode || ''));
  }, [initialClient, open]);

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
        setFormStreet((data.street || '').trim());
        setFormComplement((data.complement || '').trim());
        setFormNeighborhood((data.neighborhood || '').trim());
        setFormCity((data.city || '').trim());
        setFormState((data.state || '').trim().toUpperCase());
        setLastResolvedCep(cep);
      } catch (err) {
        toast.error(resolveUiError(err, 'Nao foi possivel buscar o endereco pelo CEP').message);
      } finally {
        setIsAddressLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formZipCode, lastResolvedCep]);

  const handleSubmit = async () => {
    if (!formName || !formPhone) {
      toast.error('Nome e telefone sao obrigatorios');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onSubmit(
        {
          name: formName,
          email: formEmail || undefined,
          phone: formPhone,
          birthDate: formBirthDate || undefined,
          notes: formNotes || undefined,
          address: {
            zipCode: formZipCode || undefined,
            street: formStreet || undefined,
            number: formNumber || undefined,
            complement: formComplement || undefined,
            neighborhood: formNeighborhood || undefined,
            city: formCity || undefined,
            state: formState || undefined,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-4 sm:mx-auto sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialClient ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          <DialogDescription>
            {initialClient ? 'Atualize os dados do cliente' : 'Cadastre um novo cliente'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nome Completo *</Label>
            <Input
              placeholder="Nome do cliente"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Telefone *</Label>
              <Input
                placeholder="(11) 99999-0000"
                value={formPhone}
                onChange={(e) => setFormPhone(maskPhoneBr(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Data de Nascimento</Label>
            <Input
              type="date"
              value={formBirthDate}
              onChange={(e) => setFormBirthDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Observacoes</Label>
            <Textarea
              placeholder="Preferencias, alergias, etc."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>CEP</Label>
            <Input
              placeholder="00000-000"
              value={formZipCode}
              onChange={(e) => setFormZipCode(formatCep(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              {isAddressLoading ? 'Buscando endereco pelo CEP...' : 'Ao informar um CEP valido, o endereco sera sugerido automaticamente.'}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Logradouro</Label>
            <Input
              placeholder="Rua, avenida..."
              value={formStreet}
              onChange={(e) => setFormStreet(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Numero</Label>
              <Input
                placeholder="123"
                value={formNumber}
                onChange={(e) => setFormNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Complemento</Label>
              <Input
                placeholder="Apto, sala..."
                value={formComplement}
                onChange={(e) => setFormComplement(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Bairro</Label>
            <Input
              placeholder="Bairro"
              value={formNeighborhood}
              onChange={(e) => setFormNeighborhood(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input
                placeholder="Cidade"
                value={formCity}
                onChange={(e) => setFormCity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>UF</Label>
              <Input
                placeholder="SP"
                value={formState}
                onChange={(e) => setFormState(e.target.value.toUpperCase())}
                maxLength={2}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {initialClient ? 'Salvando...' : 'Cadastrando...'}
              </>
            ) : (
              initialClient ? 'Salvar' : 'Cadastrar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
