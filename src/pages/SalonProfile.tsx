import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
  CalendarDays,
  Phone,
  Globe,
  Save,
  Loader2,
  Instagram,
  Facebook,
  Copy,
  ExternalLink,
  ArrowRight,
  AlertCircle,
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
import { CnpjAutoFillField } from '@/components/shared/CnpjAutoFillField';
import type { CnpjConsultaResponse } from '@/lib/api/cnpj';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

const sanitizeSalonSlug = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const buildProfileSnapshot = (value: {
  salonName: string;
  salonSlug: string;
  salonDescription: string;
  salonPhone: string;
  salonWhatsapp: string;
  salonCpfCnpj: string;
  salonEmail: string;
  salonWebsite: string;
  salonInstagram: string;
  salonFacebook: string;
  address: AddressValues;
  businessHours: BusinessHours[];
}) =>
  JSON.stringify({
    salonName: value.salonName,
    salonSlug: sanitizeSalonSlug(value.salonSlug),
    salonDescription: value.salonDescription,
    salonPhone: value.salonPhone,
    salonWhatsapp: value.salonWhatsapp,
    salonCpfCnpj: onlyDigits(value.salonCpfCnpj),
    salonEmail: value.salonEmail,
    salonWebsite: value.salonWebsite,
    salonInstagram: value.salonInstagram,
    salonFacebook: value.salonFacebook,
    address: value.address,
    businessHours: value.businessHours,
  });

const findInvalidBusinessHours = (businessHours: BusinessHours[]) =>
  businessHours
    .map((hours, index) => (hours.enabled && hours.open >= hours.close ? index : -1))
    .filter((index) => index >= 0);

export default function SalonProfile() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const [isLogoRemoving, setIsLogoRemoving] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profileLoadError, setProfileLoadError] = useState('');
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
  const [profileSnapshot, setProfileSnapshot] = useState('');

  const persistSalonSlug = (value: string) => {
    if (!value?.trim()) return;
    localStorage.setItem('salon_public_slug', value.trim());
    window.dispatchEvent(new CustomEvent('salon_slug_updated', { detail: value.trim() }));
  };

  const unlockAddressFields = () => setLockedAddressFields(emptyLockedFields);

  const applyProfileData = (data: Partial<SalonProfileData>) => {
    setSalonName(data.salonName || '');
    const resolvedSlug = sanitizeSalonSlug(data.salonSlug || 'meu-salao') || 'meu-salao';
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
    const nextAddress = {
      street: data.street || '',
      number: data.number || '',
      complement: data.complement || '',
      neighborhood: data.neighborhood || '',
      city: data.city || '',
      state: data.state || '',
      zipCode: loadedZip,
    };
    const nextBusinessHours = data.businessHours?.length ? data.businessHours : defaultBusinessHours;
    setAddress(nextAddress);
    setLastResolvedCep(normalizeCep(loadedZip));
    setBusinessHours(nextBusinessHours);
    setProfileSnapshot(buildProfileSnapshot({
      salonName: data.salonName || '',
      salonSlug: resolvedSlug,
      salonDescription: data.salonDescription || '',
      salonPhone: data.salonPhone || '',
      salonWhatsapp: data.salonWhatsapp || '',
      salonCpfCnpj: data.salonCpfCnpj || '',
      salonEmail: data.salonEmail || '',
      salonWebsite: data.salonWebsite || '',
      salonInstagram: data.salonInstagram || '',
      salonFacebook: data.salonFacebook || '',
      address: nextAddress,
      businessHours: nextBusinessHours,
    }));
  };

  const loadSalonProfile = async () => {
    setIsProfileLoading(true);
    setProfileLoadError('');
    try {
      const data = await salonApi.getProfile();
      applyProfileData(data);
    } catch (error) {
      setProfileLoadError(resolveUiError(error, 'Não foi possível carregar o perfil do salão').message);
    } finally {
      setIsProfileLoading(false);
    }
  };

  useEffect(() => {
    setSalonName(user?.salonName || '');
    setSalonEmail(user?.email || '');
    setSalonPhone(user?.phone || '');

    void loadSalonProfile();
  }, [user?.email, user?.phone, user?.salonName]); // eslint-disable-line react-hooks/exhaustive-deps

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
        toast.error(resolveUiError(error, 'Não foi possível buscar o endereço pelo CEP').message);
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
    const digits = onlyDigits(salonCpfCnpj);
    const normalizedSlug = sanitizeSalonSlug(salonSlug);
    const invalidBusinessHours = findInvalidBusinessHours(businessHours);
    if (!digits) {
      toast.error("CPF ou CNPJ do salão é obrigatório");
      return;
    }
    if (digits.length !== 11 && digits.length !== 14) {
      toast.error("CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos");
      return;
    }
    if (!normalizedSlug) {
      toast.error("Informe uma URL de agendamento válida");
      return;
    }
    if (invalidBusinessHours.length > 0) {
      toast.error("Corrija os horários de funcionamento. A abertura deve ser menor que o fechamento.");
      return;
    }
    setIsLoading(true);
    try {
      const profileData: Partial<SalonProfileData> = {
        salonName,
        salonSlug: normalizedSlug,
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
      setSalonSlug(normalizedSlug);
      persistSalonSlug(normalizedSlug);
      setPublicBookingUrl(updatedProfile.publicBookingUrl || '');
      setProfileSnapshot(buildProfileSnapshot({
        salonName,
        salonSlug: normalizedSlug,
        salonDescription,
        salonPhone,
        salonWhatsapp,
        salonCpfCnpj,
        salonEmail,
        salonWebsite,
        salonInstagram,
        salonFacebook,
        address,
        businessHours,
      }));
      toast.success('Perfil do salão atualizado com sucesso');
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
      toast.error(resolveUiError(error, 'Não foi possível enviar a imagem do estabelecimento').message);
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
      toast.error(resolveUiError(error, 'Não foi possível remover a imagem do estabelecimento').message);
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

  const copyBookingLink = async () => {
    const link = buildPublicBookingUrl(salonSlug, publicBookingUrl || undefined);
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Link copiado para a área de transferência');
    } catch (error) {
      toast.error(resolveUiError(error, 'Não foi possível copiar o link').message);
    }
  };

  const bookingAbsoluteUrl = buildPublicBookingUrl(salonSlug, publicBookingUrl || undefined);
  const invalidBusinessHourIndexes = useMemo(() => findInvalidBusinessHours(businessHours), [businessHours]);
  const hasUnsavedChanges = useMemo(
    () =>
      Boolean(profileSnapshot) &&
      buildProfileSnapshot({
        salonName,
        salonSlug,
        salonDescription,
        salonPhone,
        salonWhatsapp,
        salonCpfCnpj,
        salonEmail,
        salonWebsite,
        salonInstagram,
        salonFacebook,
        address,
        businessHours,
      }) !== profileSnapshot,
    [
      address,
      businessHours,
      profileSnapshot,
      salonCpfCnpj,
      salonDescription,
      salonEmail,
      salonFacebook,
      salonInstagram,
      salonName,
      salonPhone,
      salonSlug,
      salonWebsite,
      salonWhatsapp,
    ],
  );

  useEffect(() => {
    if (!hasUnsavedChanges) return undefined;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  if (isProfileLoading) {
    return (
      <MainLayout
        title="Perfil do Salão"
        subtitle="Gerencie as informações do seu estabelecimento"
      >
        <div className="grid max-w-6xl gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-5">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-72 w-full rounded-xl" />
            <Skeleton className="h-72 w-full rounded-xl" />
          </div>
          <div className="space-y-5">
            <Skeleton className="h-56 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-36 w-full rounded-xl" />
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title="Perfil do Salão"
      subtitle="Gerencie as informações do seu estabelecimento"
    >
      <div className="max-w-6xl space-y-5">
        {profileLoadError ? (
          <Card className="border-destructive/30 bg-destructive/5 shadow-panel">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Não foi possível carregar todos os dados</p>
                  <p className="text-sm text-muted-foreground">{profileLoadError}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void loadSalonProfile()}
                className="w-full sm:w-auto"
              >
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <Tabs defaultValue="identidade" className="space-y-5">
          <div className="overflow-x-auto pb-1">
            <TabsList className="flex h-auto min-w-max gap-1 rounded-xl border bg-muted/30 p-1">
              <TabsTrigger value="identidade" className="gap-2 whitespace-nowrap">
                <Building2 className="h-4 w-4" />
                Identidade
              </TabsTrigger>
              <TabsTrigger value="contato" className="gap-2 whitespace-nowrap">
                <Phone className="h-4 w-4" />
                Contato
              </TabsTrigger>
              <TabsTrigger value="endereco" className="gap-2 whitespace-nowrap">
                <Globe className="h-4 w-4" />
                Endereço
              </TabsTrigger>
              <TabsTrigger value="horarios" className="gap-2 whitespace-nowrap">
                <CalendarDays className="h-4 w-4" />
                Horários
              </TabsTrigger>
              <TabsTrigger value="operacao" className="gap-2 whitespace-nowrap">
                <CalendarDays className="h-4 w-4" />
                Operação
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="identidade" className="space-y-5">
            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {/* Avatar / header card */}
        <Card className="lg:col-start-2 lg:row-start-1">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
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
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                    {salonName || 'Nome do Salão'}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {address.city && address.state
                      ? `${address.city}, ${address.state}`
                      : 'Localização não definida'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="secondary" className="max-w-full gap-1">
                      <Globe className="h-3 w-3 shrink-0" />
                      <span className="truncate">{salonSlug || 'meu-salao'}</span>
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking URL card */}
        <Card className="border-border/70 bg-card/95 shadow-panel lg:col-start-2 lg:row-start-2">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-foreground">Link de Agendamento Público</h3>
                  <Badge variant="outline">Visível para clientes</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Compartilhe este link com seus clientes para agendamento online
                </p>
                <code className="mt-2 inline-block break-all rounded bg-background/80 px-2 py-1 text-xs text-primary sm:text-sm">
                  {bookingAbsoluteUrl}
                </code>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void copyBookingLink()}
                  className="w-full gap-2 sm:w-auto"
                >
                  <Copy className="w-4 h-4" />
                  Copiar
                </Button>
                <Button size="sm" asChild className="w-full gap-2 sm:w-auto">
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
        <Card className="lg:col-start-1 lg:row-start-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Building2 className="w-5 h-5 text-primary" />
              Informações Básicas
            </CardTitle>
            <CardDescription>Dados principais do seu salão</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salon-name">Nome do Salão *</Label>
                <Input
                  id="salon-name"
                  placeholder="Ex: Bella Studio"
                  value={salonName}
                  onChange={(e) => setSalonName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salon-slug">URL do Agendamento</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted border border-r-0 border-border rounded-l-md">
                    /agendar/
                  </span>
                  <Input
                    id="salon-slug"
                    placeholder="meu-salao"
                    value={salonSlug}
                    onChange={(e) =>
                      setSalonSlug(sanitizeSalonSlug(e.target.value))
                    }
                    className="rounded-l-none"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="salon-description">Descrição</Label>
              <Textarea
                id="salon-description"
                placeholder="Descreva seu salão, especialidades, diferenciais..."
                value={salonDescription}
                onChange={(e) => setSalonDescription(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact card */}
            </div>
          </TabsContent>

          <TabsContent value="contato" className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Phone className="w-5 h-5 text-primary" />
              Contato
            </CardTitle>
            <CardDescription>Informações de contato do salão</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salon-phone">Telefone</Label>
                <Input
                  id="salon-phone"
                  placeholder="(11) 3333-4444"
                  value={salonPhone}
                  onChange={(e) => setSalonPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salon-whatsapp">WhatsApp</Label>
                <Input
                  id="salon-whatsapp"
                  placeholder="(11) 99999-0000"
                  value={salonWhatsapp}
                  onChange={(e) => setSalonWhatsapp(e.target.value)}
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salon-email">E-mail</Label>
                <Input
                  id="salon-email"
                  type="email"
                  placeholder="contato@meusalao.com"
                  value={salonEmail}
                  onChange={(e) => setSalonEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salon-website">Website</Label>
                <Input
                  id="salon-website"
                  placeholder="https://meusalao.com"
                  value={salonWebsite}
                  onChange={(e) => setSalonWebsite(e.target.value)}
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <CnpjAutoFillField
                  id="salon-cpf-cnpj"
                  label="CPF/CNPJ"
                  helperText="Informe CPF ou CNPJ. A consulta automática de dados está disponível para CNPJ."
                  value={salonCpfCnpj}
                  onChange={(v) => {
                    // Mantém máscara de CPF quando tiver 11 dígitos ou menos
                    const digits = v.replace(/\D/g, '');
                    setSalonCpfCnpj(digits.length <= 11 ? maskCpfCnpj(v) : v);
                  }}
                  onDataLoaded={(data: CnpjConsultaResponse) => {
                    setSalonName((prev) => prev || data.razaoSocial);
                    if (data.endereco) {
                      setAddress((prev) => ({
                        ...prev,
                        street: data.endereco!.logradouro,
                        number: data.endereco!.numero,
                        complement: data.endereco!.complemento ?? '',
                        neighborhood: data.endereco!.bairro,
                        city: data.endereco!.municipio,
                        state: data.endereco!.uf.toUpperCase(),
                        zipCode: data.endereco!.cep,
                      }));
                      setLastResolvedCep(normalizeCep(data.endereco.cep));
                    }
                    // emailSugestao e telefoneSugestao não são preenchidos automaticamente (LGPD).
                  }}
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salon-instagram" className="flex items-center gap-2">
                  <Instagram className="w-4 h-4" />
                  Instagram
                </Label>
                <Input
                  id="salon-instagram"
                  placeholder="@meusalao"
                  value={salonInstagram}
                  onChange={(e) => setSalonInstagram(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salon-facebook" className="flex items-center gap-2">
                  <Facebook className="w-4 h-4" />
                  Facebook
                </Label>
                <Input
                  id="salon-facebook"
                  placeholder="facebook.com/meusalao"
                  value={salonFacebook}
                  onChange={(e) => setSalonFacebook(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address card */}
          </TabsContent>

          <TabsContent value="endereco" className="space-y-5">
        <div>
          <SalonAddressCard
            values={address}
            onChange={handleAddressChange}
            isAddressLoading={isAddressLoading}
            lockedFields={lockedAddressFields}
          />
        </div>
          </TabsContent>

        {/* Business hours card */}
          <TabsContent value="horarios" className="space-y-5">
        <div>
          <SalonBusinessHoursCard
            businessHours={businessHours}
            onUpdate={updateBusinessHours}
            invalidIndexes={invalidBusinessHourIndexes}
          />
        </div>
          </TabsContent>

          <TabsContent value="operacao" className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <CalendarDays className="w-5 h-5 text-primary" />
              Fechamentos Especiais
            </CardTitle>
            <CardDescription>
              Gerencie feriados, férias e datas excepcionais em que o salão não irá funcionar.
              O gerenciamento centralizado de fechamentos foi movido para as Configurações.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
              Cadastre e edite fechamentos especiais, com suporte a tipo (feriado, férias, recesso),
              horário parcial e vínculo por profissional.
            </div>
            <Button asChild variant="outline" className="gap-2">
              <Link to="/configuracoes?tab=closures">
                <CalendarDays className="h-4 w-4" />
                Abrir Fechamentos Especiais
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
          </TabsContent>
        </Tabs>

        <div className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/90 p-3 shadow-panel backdrop-blur sm:bottom-4 sm:flex-row sm:items-center sm:justify-between lg:col-span-2">
          <p className="text-sm text-muted-foreground">
            {hasUnsavedChanges ? 'Existem alterações pendentes.' : 'Nenhuma alteração pendente.'}
          </p>
          <Button
            onClick={() => void handleSave()}
            disabled={isLoading || !hasUnsavedChanges}
            className="w-full gap-2 sm:w-auto"
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
