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
  Mail,
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
import { salonApi, utilsApi } from '@/lib/api';

interface BusinessHours {
  day: string;
  enabled: boolean;
  open: string;
  close: string;
}

const defaultBusinessHours: BusinessHours[] = [
  { day: 'Segunda-feira', enabled: true, open: '09:00', close: '19:00' },
  { day: 'Terça-feira', enabled: true, open: '09:00', close: '19:00' },
  { day: 'Quarta-feira', enabled: true, open: '09:00', close: '19:00' },
  { day: 'Quinta-feira', enabled: true, open: '09:00', close: '19:00' },
  { day: 'Sexta-feira', enabled: true, open: '09:00', close: '19:00' },
  { day: 'Sábado', enabled: true, open: '09:00', close: '17:00' },
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

  // Salon info
  const [salonName, setSalonName] = useState('');
  const [salonSlug, setSalonSlug] = useState('');
  const [salonDescription, setSalonDescription] = useState('');
  const [salonPhone, setSalonPhone] = useState('');
  const [salonWhatsapp, setSalonWhatsapp] = useState('');
  const [salonEmail, setSalonEmail] = useState('');
  const [salonWebsite, setSalonWebsite] = useState('');
  const [salonInstagram, setSalonInstagram] = useState('');
  const [salonFacebook, setSalonFacebook] = useState('');

  // Address
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');

  // Business hours
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>(defaultBusinessHours);

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

  // Load saved data
  useEffect(() => {
    const savedProfile = localStorage.getItem('azzo_salon_profile');
    if (savedProfile) {
      const data = JSON.parse(savedProfile);
      setSalonName(data.salonName || user?.salonName || '');
      setSalonSlug(data.salonSlug || 'meu-salao');
      setSalonDescription(data.salonDescription || '');
      setSalonPhone(data.salonPhone || user?.phone || '');
      setSalonWhatsapp(data.salonWhatsapp || '');
      setSalonEmail(data.salonEmail || user?.email || '');
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
      if (data.businessHours) {
        setBusinessHours(data.businessHours);
      }
    } else {
      setSalonName(user?.salonName || '');
      setSalonEmail(user?.email || '');
      setSalonPhone(user?.phone || '');
    }
  }, [user]);
  useEffect(() => {
    salonApi
      .getProfile()
      .then((data) => {
        setSalonName(data.salonName || '');
        setSalonSlug(data.salonSlug || 'meu-salao');
        setSalonDescription(data.salonDescription || '');
        setSalonPhone(data.salonPhone || '');
        setSalonWhatsapp(data.salonWhatsapp || '');
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
  }, []);

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
          resolvedStreet ||
          resolvedComplement ||
          resolvedNeighborhood ||
          resolvedCity ||
          resolvedState
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
      } catch {
        unlockAddressFields();
        toast.error('Nao foi possivel buscar o endereco pelo CEP');
      } finally {
        setIsAddressLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [zipCode, lastResolvedCep]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const profileData = {
        salonName,
        salonSlug,
        salonDescription,
        salonPhone,
        salonWhatsapp,
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

      await salonApi.updateProfile(profileData as any);
      localStorage.setItem('azzo_salon_profile', JSON.stringify(profileData));
      toast.success('Perfil do salão atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar perfil');
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
    const link = `${window.location.origin}/agendar/${salonSlug}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copiado para a área de transferência!');
  };

  const bookingLink = `/agendar/${salonSlug}`;

  return (
    <MainLayout title="Perfil do Salão" subtitle="Gerencie as informações do seu estabelecimento">
      <div className="space-y-4 sm:space-y-6 max-w-4xl">
        {/* Salon Header Card */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative">
                <Avatar className="w-20 h-20 sm:w-24 sm:h-24">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-violet-100 text-violet-700 text-xl sm:text-2xl">
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
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                  {salonName || 'Nome do Salão'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {city && state ? `${city}, ${state}` : 'Localização não definida'}
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

        {/* Public Booking Link */}
        <Card className="bg-gradient-to-br from-violet-50 to-pink-50 border-violet-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-gray-900">Link de Agendamento Público</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Compartilhe este link com seus clientes para agendamento online
                </p>
                <code className="text-xs sm:text-sm bg-white/50 px-2 py-1 rounded mt-2 inline-block text-violet-700">
                  {window.location.origin}{bookingLink}
                </code>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyBookingLink} className="gap-2">
                  <Copy className="w-4 h-4" />
                  Copiar
                </Button>
                <Button size="sm" asChild className="gap-2 bg-violet-600 hover:bg-violet-700">
                  <a href={bookingLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                    Abrir
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Building2 className="w-5 h-5 text-violet-600" />
              Informações Básicas
            </CardTitle>
            <CardDescription>Dados principais do seu salão</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Salão *</Label>
                <Input
                  placeholder="Ex: Bella Studio"
                  value={salonName}
                  onChange={(e) => setSalonName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>URL do Agendamento</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-sm text-gray-500 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md">
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
              <Label>Descrição</Label>
              <Textarea
                placeholder="Descreva seu salão, especialidades, diferenciais..."
                value={salonDescription}
                onChange={(e) => setSalonDescription(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Phone className="w-5 h-5 text-violet-600" />
              Contato
            </CardTitle>
            <CardDescription>Informações de contato do salão</CardDescription>
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

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <MapPin className="w-5 h-5 text-violet-600" />
              Endereço
            </CardTitle>
            <CardDescription>Localização do seu estabelecimento</CardDescription>
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
                <Label>Número</Label>
                <Input
                  placeholder="1000"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                />
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
                  placeholder="São Paulo"
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
                {isAddressLoading && (
                  <p className="text-xs text-gray-500">Buscando endereco pelo CEP...</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Clock className="w-5 h-5 text-violet-600" />
              Horário de Funcionamento
            </CardTitle>
            <CardDescription>Defina os horários de atendimento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {businessHours.map((hours, index) => (
                <div
                  key={hours.day}
                  className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg ${
                    hours.enabled ? 'bg-gray-50' : 'bg-gray-100 opacity-60'
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
                      <span className="text-gray-500">até</span>
                      <Input
                        type="time"
                        value={hours.close}
                        onChange={(e) => updateBusinessHours(index, 'close', e.target.value)}
                        className="w-28"
                      />
                    </div>
                  )}
                  {!hours.enabled && (
                    <span className="text-sm text-gray-500 ml-auto">Fechado</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end pb-6">
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="gap-2 bg-violet-600 hover:bg-violet-700"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}

