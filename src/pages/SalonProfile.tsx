import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  MapPin,
  Phone,
  Globe,
  Clock,
  Camera,
  Save,
  Loader2,
  Instagram,
  Facebook,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { salonApi, utilsApi, type SalonProfile as SalonProfileData } from '@/lib/api';
import { resolveUiError } from '@/lib/error-utils';
import { buildPublicBookingUrl } from '@/lib/public-booking-url';
import { maskCpfCnpj, onlyDigits } from '@/lib/input-masks';

interface BusinessHours {
  day: string;
  enabled: boolean;
  open: string;
  close: string;
}

const defaultBusinessHours: BusinessHours[] = [
  { day: 'Segunda-feira', enabled: true, open: '09:00', close: '19:00' },
  { day: 'Terca-feira', enabled: true, open: '09:00', close: '19:00' },
  { day: 'Quarta-feira', enabled: true, open: '09:00', close: '19:00' },
  { day: 'Quinta-feira', enabled: true, open: '09:00', close: '19:00' },
  { day: 'Sexta-feira', enabled: true, open: '09:00', close: '19:00' },
  { day: 'Sabado', enabled: true, open: '09:00', close: '17:00' },
  { day: 'Domingo', enabled: false, open: '09:00', close: '17:00' },
];

export default function SalonProfile() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [lastResolvedCep, setLastResolvedCep] = useState('');
  const [lockedAddressFields, setLockedAddressFields] = useState({
    street: false,
    complement: false,
    neighborhood: false,
    city: false,
    state: false,
  });

  const [salonName, setSalonName] = useState('');
  const [salonSlug, setSalonSlug] = useState('');
  const [publicBookingUrl, setPublicBookingUrl] = useState('');
  const [salonDescription, setSalonDescription] = useState('');
  const [salonPhone, setSalonPhone] = useState('');
  const [salonWhatsapp, setSalonWhatsapp] = useState('');
  const [salonCpfCnpj, setSalonCpfCnpj] = useState('');
  const [salonEmail, setSalonEmail] = useState('');
  const [salonWebsite, setSalonWebsite] = useState('');
  const [salonInstagram, setSalonInstagram] = useState('');
  const [salonFacebook, setSalonFacebook] = useState('');

  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');

  const [businessHours, setBusinessHours] = useState<BusinessHours[]>(defaultBusinessHours);
  const persistSalonSlug = (value: string) => {
    if (!value?.trim()) return;
    localStorage.setItem("salon_public_slug", value.trim());
  };

  const normalizeCep = (value: string) => value.replace(/\D/g, '').slice(0, 8);
  const formatCep = (value: string) => {
    const cep = normalizeCep(value);
    if (cep.length <= 5) return cep;
    return `${cep.slice(0, 5)}-${cep.slice(5)}`;
  };

  const unlockAddressFields = () => {
    setLockedAddressFields({
      street: false,
      complement: false,
      neighborhood: false,
      city: false,
      state: false,
    });
  };

  useEffect(() => {
    setSalonName(user?.salonName || '');
    setSalonEmail(user?.email || '');
    setSalonPhone(user?.phone || '');

    salonApi
      .getProfile()
      .then((data) => {
        setSalonName(data.salonName || '');
        const resolvedSlug = data.salonSlug || "meu-salao";
        setSalonSlug(resolvedSlug);
        persistSalonSlug(resolvedSlug);
        setPublicBookingUrl(data.publicBookingUrl || '');
        setSalonDescription(data.salonDescription || '');
        setSalonPhone(data.salonPhone || '');
        setSalonWhatsapp(data.salonWhatsapp || '');
        setSalonCpfCnpj(maskCpfCnpj(data.salonCpfCnpj || ''));
        setSalonEmail(data.salonEmail || '');
        setSalonWebsite(data.salonWebsite || '');
        setSalonInstagram(data.salonInstagram || '');
        setSalonFacebook(data.salonFacebook || '');
        setStreet(data.street || '');
        setNumber(data.number || '');
        setComplement(data.complement || '');
        setNeighborhood(data.neighborhood || '');
        setCity(data.city || '');
        setState(data.state || '');
        setZipCode(data.zipCode || '');
        if (data.businessHours?.length) {
          setBusinessHours(data.businessHours);
        }
      })
      .catch(() => undefined);
  }, [user]);

  useEffect(() => {
    const cep = normalizeCep(zipCode);

    if (cep.length < 8) {
      if (lastResolvedCep) setLastResolvedCep('');
      unlockAddressFields();
      return;
    }

    if (cep === lastResolvedCep) return;

    const timer = setTimeout(async () => {
      try {
        setIsAddressLoading(true);
        const data = await utilsApi.getAddressByCep(cep);
        const resolvedStreet = (data.street || '').trim();
        const resolvedComplement = (data.complement || '').trim();
        const resolvedNeighborhood = (data.neighborhood || '').trim();
        const resolvedCity = (data.city || '').trim();
        const resolvedState = (data.state || '').trim().toUpperCase();

        const hasAnyResolvedField = Boolean(
          resolvedStreet || resolvedComplement || resolvedNeighborhood || resolvedCity || resolvedState
        );

        setStreet(resolvedStreet);
        setComplement(resolvedComplement);
        setNeighborhood(resolvedNeighborhood);
        setCity(resolvedCity);
        setState(resolvedState);

        if (hasAnyResolvedField) {
          setLockedAddressFields({
            street: Boolean(resolvedStreet),
            complement: Boolean(resolvedComplement),
            neighborhood: Boolean(resolvedNeighborhood),
            city: Boolean(resolvedCity),
            state: Boolean(resolvedState),
          });
        } else {
          unlockAddressFields();
        }

        setLastResolvedCep(cep);
      } catch (error) {
        unlockAddressFields();
        toast.error(resolveUiError(error, 'Nao foi possivel buscar o endereco pelo CEP').message);
      } finally {
        setIsAddressLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [zipCode, lastResolvedCep]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const profileData: Partial<SalonProfileData> = {
        salonName,
        salonSlug,
        salonDescription,
        salonPhone,
        salonWhatsapp,
        salonCpfCnpj: onlyDigits(salonCpfCnpj),
        salonEmail,
        salonWebsite,
        salonInstagram,
        salonFacebook,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        zipCode,
        businessHours,
      };

      const updatedProfile = await salonApi.updateProfile(profileData);
      persistSalonSlug(salonSlug);
      setPublicBookingUrl(updatedProfile.publicBookingUrl || '');
      toast.success('Perfil do salao atualizado com sucesso');
    } catch (error) {
      toast.error(resolveUiError(error, 'Erro ao salvar perfil').message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateBusinessHours = (index: number, field: keyof BusinessHours, value: string | boolean) => {
    const updated = [...businessHours];
    updated[index] = { ...updated[index], [field]: value };
    setBusinessHours(updated);
  };

  const copyBookingLink = () => {
    const link = buildPublicBookingUrl(salonSlug, publicBookingUrl || undefined);
    navigator.clipboard.writeText(link);
    toast.success('Link copiado para a area de transferencia');
  };

  const bookingAbsoluteUrl = buildPublicBookingUrl(salonSlug, publicBookingUrl || undefined);

  return (
    <MainLayout title="Perfil do Salao" subtitle="Gerencie as informacoes do seu estabelecimento">
      <div className="space-y-4 sm:space-y-6 max-w-4xl">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative">
                <Avatar className="w-20 h-20 sm:w-24 sm:h-24">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl sm:text-2xl">
                    {salonName.slice(0, 2).toUpperCase() || 'SL'}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full"
                >
                  <Camera className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                  {salonName || 'Nome do Salao'}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {city && state ? `${city}, ${state}` : 'Localizacao nao definida'}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="secondary" className="gap-1">
                    <Globe className="w-3 h-3" />
                    {salonSlug || 'meu-salao'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-accent border-primary/20">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-foreground">Link de Agendamento Publico</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Compartilhe este link com seus clientes para agendamento online
                </p>
                <code className="text-xs sm:text-sm bg-background/70 px-2 py-1 rounded mt-2 inline-block text-primary">
                  {bookingAbsoluteUrl}
                </code>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyBookingLink} className="gap-2">
                  <Copy className="w-4 h-4" />
                  Copiar
                </Button>
                <Button size="sm" asChild className="gap-2">
                  <a href={bookingAbsoluteUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                    Abrir
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Building2 className="w-5 h-5 text-primary" />
              Informacoes Basicas
            </CardTitle>
            <CardDescription>Dados principais do seu salao</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Salao *</Label>
                <Input
                  placeholder="Ex: Bella Studio"
                  value={salonName}
                  onChange={(e) => setSalonName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>URL do Agendamento</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted border border-r-0 border-border rounded-l-md">
                    /agendar/
                  </span>
                  <Input
                    placeholder="meu-salao"
                    value={salonSlug}
                    onChange={(e) => setSalonSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    className="rounded-l-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descricao</Label>
              <Textarea
                placeholder="Descreva seu salao, especialidades, diferenciais..."
                value={salonDescription}
                onChange={(e) => setSalonDescription(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Phone className="w-5 h-5 text-primary" />
              Contato
            </CardTitle>
            <CardDescription>Informacoes de contato do salao</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  placeholder="(11) 3333-4444"
                  value={salonPhone}
                  onChange={(e) => setSalonPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp</Label>
                <Input
                  placeholder="(11) 99999-0000"
                  value={salonWhatsapp}
                  onChange={(e) => setSalonWhatsapp(e.target.value)}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  placeholder="contato@meusalao.com"
                  value={salonEmail}
                  onChange={(e) => setSalonEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  placeholder="https://meusalao.com"
                  value={salonWebsite}
                  onChange={(e) => setSalonWebsite(e.target.value)}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CPF/CNPJ</Label>
                <Input
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  value={salonCpfCnpj}
                  onChange={(e) => setSalonCpfCnpj(maskCpfCnpj(e.target.value))}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Instagram className="w-4 h-4" />
                  Instagram
                </Label>
                <Input
                  placeholder="@meusalao"
                  value={salonInstagram}
                  onChange={(e) => setSalonInstagram(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Facebook className="w-4 h-4" />
                  Facebook
                </Label>
                <Input
                  placeholder="facebook.com/meusalao"
                  value={salonFacebook}
                  onChange={(e) => setSalonFacebook(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <MapPin className="w-5 h-5 text-primary" />
              Endereco
            </CardTitle>
            <CardDescription>Localizacao do seu estabelecimento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-2">
                <Label>Rua</Label>
                <Input
                  placeholder="Av. Paulista"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  disabled={lockedAddressFields.street}
                />
              </div>
              <div className="space-y-2">
                <Label>Numero</Label>
                <Input placeholder="1000" value={number} onChange={(e) => setNumber(e.target.value)} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Complemento</Label>
                <Input
                  placeholder="Sala 101"
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  disabled={lockedAddressFields.complement}
                />
              </div>
              <div className="space-y-2">
                <Label>Bairro</Label>
                <Input
                  placeholder="Bela Vista"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  disabled={lockedAddressFields.neighborhood}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input
                  placeholder="Sao Paulo"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={lockedAddressFields.city}
                />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Input
                  placeholder="SP"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  maxLength={2}
                  disabled={lockedAddressFields.state}
                />
              </div>
              <div className="space-y-2">
                <Label>CEP</Label>
                <Input
                  placeholder="01310-100"
                  value={zipCode}
                  onChange={(e) => setZipCode(formatCep(e.target.value))}
                  maxLength={9}
                />
                {isAddressLoading && <p className="text-xs text-muted-foreground">Buscando endereco pelo CEP...</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Clock className="w-5 h-5 text-primary" />
              Horario de Funcionamento
            </CardTitle>
            <CardDescription>Defina os horarios de atendimento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {businessHours.map((hours, index) => (
                <div
                  key={hours.day}
                  className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg ${
                    hours.enabled ? 'bg-muted/50' : 'bg-muted/30 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-[140px]">
                    <Switch
                      checked={hours.enabled}
                      onCheckedChange={(checked) => updateBusinessHours(index, 'enabled', checked)}
                    />
                    <span className="font-medium text-sm">{hours.day}</span>
                  </div>
                  {hours.enabled && (
                    <div className="flex items-center gap-2 ml-auto">
                      <Input
                        type="time"
                        value={hours.open}
                        onChange={(e) => updateBusinessHours(index, 'open', e.target.value)}
                        className="w-28"
                      />
                      <span className="text-muted-foreground">ate</span>
                      <Input
                        type="time"
                        value={hours.close}
                        onChange={(e) => updateBusinessHours(index, 'close', e.target.value)}
                        className="w-28"
                      />
                    </div>
                  )}
                  {!hours.enabled && <span className="text-sm text-muted-foreground ml-auto">Fechado</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pb-6">
          <Button onClick={handleSave} disabled={isLoading} className="gap-2" size="lg">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Alteracoes
              </>
            )}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
