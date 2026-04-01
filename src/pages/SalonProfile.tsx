import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileDropzone } from '@/components/ui/file-dropzone';
import {
  Building2,
  Phone,
  Globe,
  Save,
  Loader2,
  Instagram,
  Facebook,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { SalonAddressCard, type AddressValues, type LockedAddressFields } from '@/components/salon/SalonAddressCard';
import { SalonBusinessHoursCard, type BusinessHours } from '@/components/salon/SalonBusinessHoursCard';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { salonApi, utilsApi, type SalonProfile as SalonProfileData } from '@/lib/api';
import { resolveUiError } from '@/lib/error-utils';
import { prepareImageUpload } from '@/lib/image-upload';
import { buildPublicBookingUrl } from '@/lib/public-booking-url';
import { maskCpfCnpj, onlyDigits } from '@/lib/input-masks';

const defaultBusinessHours: BusinessHours[] = [
  { day: 'Segunda-feira', enabled: true, open: '09:00', close: '19:00' },
  { day: 'Terca-feira', enabled: true, open: '09:00', close: '19:00' },
  { day: 'Quarta-feira', enabled: true, open: '09:00', close: '19:00' },
  { day: 'Quinta-feira', enabled: true, open: '09:00', close: '19:00' },
  { day: 'Sexta-feira', enabled: true, open: '09:00', close: '19:00' },
  { day: 'Sabado', enabled: true, open: '09:00', close: '17:00' },
  { day: 'Domingo', enabled: false, open: '09:00', close: '17:00' },
];

const emptyAddress: AddressValues = {
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  zipCode: '',
};

const emptyLockedFields: LockedAddressFields = {
  street: false,
  complement: false,
  neighborhood: false,
  city: false,
  state: false,
};

const normalizeCep = (value: string) => value.replace(/\D/g, '').slice(0, 8);

export default function SalonProfile() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const [isLogoRemoving, setIsLogoRemoving] = useState(false);
  const [lastResolvedCep, setLastResolvedCep] = useState('');
  const [lockedAddressFields, setLockedAddressFields] = useState<LockedAddressFields>(emptyLockedFields);

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
  const [salonLogoUrl, setSalonLogoUrl] = useState('');
  const [address, setAddress] = useState<AddressValues>(emptyAddress);
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>(defaultBusinessHours);

  const persistSalonSlug = (value: string) => {
    if (!value?.trim()) return;
    localStorage.setItem('salon_public_slug', value.trim());
  };

  const unlockAddressFields = () => setLockedAddressFields(emptyLockedFields);

  const applyProfileData = (data: Partial<SalonProfileData>) => {
    setSalonName(data.salonName || '');
    const resolvedSlug = data.salonSlug || 'meu-salao';
    setSalonSlug(resolvedSlug);
    persistSalonSlug(resolvedSlug);
    setPublicBookingUrl(data.publicBookingUrl || '');
    setSalonLogoUrl(data.logoUrl || '');
    setSalonDescription(data.salonDescription || '');
    setSalonPhone(data.salonPhone || '');
    setSalonWhatsapp(data.salonWhatsapp || '');
    setSalonCpfCnpj(maskCpfCnpj(data.salonCpfCnpj || ''));
    setSalonEmail(data.salonEmail || '');
    setSalonWebsite(data.salonWebsite || '');
    setSalonInstagram(data.salonInstagram || '');
    setSalonFacebook(data.salonFacebook || '');
    const loadedZip = data.zipCode || '';
    setAddress({
      street: data.street || '',
      number: data.number || '',
      complement: data.complement || '',
      neighborhood: data.neighborhood || '',
      city: data.city || '',
      state: data.state || '',
      zipCode: loadedZip,
    });
    setLastResolvedCep(normalizeCep(loadedZip));
    if (data.businessHours?.length) {
      setBusinessHours(data.businessHours);
      return;
    }
    setBusinessHours(defaultBusinessHours);
  };

  useEffect(() => {
    setSalonName(user?.salonName || '');
    setSalonEmail(user?.email || '');
    setSalonPhone(user?.phone || '');

    salonApi
      .getProfile()
      .then((data) => applyProfileData(data))
      .catch(() => undefined);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const cep = normalizeCep(address.zipCode);

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
          resolvedStreet || resolvedComplement || resolvedNeighborhood || resolvedCity || resolvedState,
        );

        setAddress((prev) => ({
          ...prev,
          street: resolvedStreet,
          complement: resolvedComplement,
          neighborhood: resolvedNeighborhood,
          city: resolvedCity,
          state: resolvedState,
        }));

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
  }, [address.zipCode, lastResolvedCep]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddressChange = (field: keyof AddressValues, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
  };

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
        street: address.street,
        number: address.number,
        complement: address.complement,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
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

  const handleLogoUpload = async (selectedFile: File) => {
    setIsLogoUploading(true);
    try {
      const preparedFile = await prepareImageUpload(selectedFile);
      const updatedProfile = await salonApi.uploadLogo(preparedFile);
      applyProfileData(updatedProfile);
      toast.success('Imagem do estabelecimento atualizada com sucesso');
    } catch (error) {
      toast.error(resolveUiError(error, 'Nao foi possivel enviar a imagem do estabelecimento').message);
    } finally {
      setIsLogoUploading(false);
    }
  };

  const handleLogoRemove = async () => {
    setIsLogoRemoving(true);
    try {
      const updatedProfile = await salonApi.removeLogo();
      applyProfileData(updatedProfile);
      toast.success('Imagem do estabelecimento removida com sucesso');
    } catch (error) {
      toast.error(resolveUiError(error, 'Nao foi possivel remover a imagem do estabelecimento').message);
    } finally {
      setIsLogoRemoving(false);
    }
  };

  const updateBusinessHours = (
    index: number,
    field: keyof BusinessHours,
    value: string | boolean,
  ) => {
    const updated = [...businessHours];
    updated[index] = { ...updated[index], [field]: value };
    setBusinessHours(updated);
  };

  const copyBookingLink = () => {
    const link = buildPublicBookingUrl(salonSlug, publicBookingUrl || undefined);
    void navigator.clipboard.writeText(link);
    toast.success('Link copiado para a area de transferencia');
  };

  const bookingAbsoluteUrl = buildPublicBookingUrl(salonSlug, publicBookingUrl || undefined);

  return (
    <MainLayout
      title="Perfil do Salao"
      subtitle="Gerencie as informacoes do seu estabelecimento"
    >
      <div className="space-y-4 sm:space-y-6 max-w-4xl">
        {/* Avatar / header card */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <FileDropzone
                title="Imagem do estabelecimento"
                helperText="JPG, PNG ou WEBP"
                accept={{
                  'image/jpeg': ['.jpg', '.jpeg'],
                  'image/png': ['.png'],
                  'image/webp': ['.webp'],
                }}
                maxSizeBytes={10 * 1024 * 1024}
                currentPreviewUrl={salonLogoUrl || null}
                previewAlt={salonName || 'Imagem do estabelecimento'}
                isLoading={isLogoUploading || isLogoRemoving}
                onFileSelected={handleLogoUpload}
                onRemove={salonLogoUrl ? handleLogoRemove : undefined}
                inputTestId="salon-logo-input"
                variant="avatar"
                className="shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                  {salonName || 'Nome do Salao'}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {address.city && address.state
                    ? `${address.city}, ${address.state}`
                    : 'Localizacao nao definida'}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="secondary" className="gap-1">
                    <Globe className="w-3 h-3" />
                    {salonSlug || 'meu-salao'}
                  </Badge>
                </div>
              </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking URL card */}
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

        {/* Basic info card */}
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
                    onChange={(e) =>
                      setSalonSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))
                    }
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

        {/* Contact card */}
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

        {/* Address card */}
        <SalonAddressCard
          values={address}
          onChange={handleAddressChange}
          isAddressLoading={isAddressLoading}
          lockedFields={lockedAddressFields}
        />

        {/* Business hours card */}
        <SalonBusinessHoursCard
          businessHours={businessHours}
          onUpdate={updateBusinessHours}
        />

        <div className="flex justify-end pb-6">
          <Button onClick={() => void handleSave()} disabled={isLoading} className="gap-2" size="lg">
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
