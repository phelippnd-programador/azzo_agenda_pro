import { MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface AddressValues {
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface LockedAddressFields {
  street: boolean;
  complement: boolean;
  neighborhood: boolean;
  city: boolean;
  state: boolean;
}

interface SalonAddressCardProps {
  values: AddressValues;
  onChange: (field: keyof AddressValues, value: string) => void;
  isAddressLoading: boolean;
  lockedFields: LockedAddressFields;
}

const normalizeCep = (value: string) => value.replace(/\D/g, '').slice(0, 8);

const formatCep = (value: string) => {
  const cep = normalizeCep(value);
  if (cep.length <= 5) return cep;
  return `${cep.slice(0, 5)}-${cep.slice(5)}`;
};

export function SalonAddressCard({
  values,
  onChange,
  isAddressLoading,
  lockedFields,
}: SalonAddressCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <MapPin className="w-5 h-5 text-primary" />
          Endereço
        </CardTitle>
        <CardDescription>Localização do seu estabelecimento</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="salon-address-street">Rua</Label>
            <Input
              id="salon-address-street"
              placeholder="Av. Paulista"
              value={values.street}
              onChange={(e) => onChange('street', e.target.value)}
              disabled={lockedFields.street}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="salon-address-number">Número</Label>
            <Input
              id="salon-address-number"
              placeholder="1000"
              value={values.number}
              onChange={(e) => onChange('number', e.target.value)}
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="salon-address-complement">Complemento</Label>
            <Input
              id="salon-address-complement"
              placeholder="Sala 101"
              value={values.complement}
              onChange={(e) => onChange('complement', e.target.value)}
              disabled={lockedFields.complement}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="salon-address-neighborhood">Bairro</Label>
            <Input
              id="salon-address-neighborhood"
              placeholder="Bela Vista"
              value={values.neighborhood}
              onChange={(e) => onChange('neighborhood', e.target.value)}
              disabled={lockedFields.neighborhood}
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="salon-address-city">Cidade</Label>
            <Input
              id="salon-address-city"
              placeholder="São Paulo"
              value={values.city}
              onChange={(e) => onChange('city', e.target.value)}
              disabled={lockedFields.city}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="salon-address-state">Estado</Label>
            <Input
              id="salon-address-state"
              placeholder="SP"
              value={values.state}
              onChange={(e) => onChange('state', e.target.value)}
              maxLength={2}
              disabled={lockedFields.state}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="salon-address-zip-code">CEP</Label>
            <Input
              id="salon-address-zip-code"
              placeholder="01310-100"
              value={values.zipCode}
              onChange={(e) => onChange('zipCode', formatCep(e.target.value))}
              maxLength={9}
            />
            {isAddressLoading ? (
              <p className="text-xs text-muted-foreground">Buscando endereço pelo CEP...</p>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
