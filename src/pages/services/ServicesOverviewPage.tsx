import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { PageEmptyState, PageErrorState, PageListLoadingState } from '@/components/ui/page-states';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { CrudListToolbar } from '@/components/crud/CrudListToolbar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Clock, MoreVertical, Scissors, Loader2, Package } from 'lucide-react';
import { useServices } from '@/hooks/useServices';
import { DeleteConfirmationDialog } from '@/components/common/DeleteConfirmationDialog';
import { useProfessionals } from '@/hooks/useProfessionals';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format';
import { CurrencyInput } from '@/components/ui/currency-input';
import { ModuleIntro, WorkspaceNotice } from '@/components/layout/module-surfaces';

const categories = ['Todos', 'Cabelo', 'Barba', 'Unhas', 'Estetica', 'Maquiagem', 'Outros'];
type ServiceFormErrors = {
  name?: string;
  duration?: string;
  price?: string;
};

export default function ServicesOverviewPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [isNewServiceOpen, setIsNewServiceOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingService, setEditingService] = useState<string | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [isDeletingService, setIsDeletingService] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isRemoveSelectedOpen, setIsRemoveSelectedOpen] = useState(false);
  const [isRemoveAllOpen, setIsRemoveAllOpen] = useState(false);

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

  const {
    services,
    pagination,
    isLoading,
    error,
    refetch,
    goToPage,
    createService,
    updateService,
    deleteService,
    deleteSelectedServices,
    deleteAllServices,
  } = useServices();
  const { professionals, isLoading: isLoadingProfessionals } = useProfessionals();

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));
  const allFilteredSelected =
    filteredServices.length > 0 &&
    filteredServices.every((service) => selectedServiceIds.includes(service.id));

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
    setEditingService(null);
  };

  const openEditDialog = (service: typeof services[0]) => {
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
    setEditingService(service.id);
    setIsNewServiceOpen(true);
  };

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
    const sinalValorNumber = Number(formSinalValor.replace(',', '.'));
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
      const serviceData = {
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
        await updateService(editingService, serviceData);
      } else {
        await createService(serviceData);
      }

      setIsNewServiceOpen(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!serviceToDelete) return;
    setIsDeletingService(true);
    try {
      await deleteService(serviceToDelete);
      setServiceToDelete(null);
    } finally {
      setIsDeletingService(false);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await updateService(id, { isActive });
    } catch {
      // handled in hook
    }
  };

  const toggleServiceSelection = (id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllFiltered = (checked: boolean) => {
    if (checked) {
      setSelectedServiceIds((prev) => {
        const next = new Set(prev);
        filteredServices.forEach((service) => next.add(service.id));
        return Array.from(next);
      });
      return;
    }
    setSelectedServiceIds((prev) =>
      prev.filter((id) => !filteredServices.some((service) => service.id === id))
    );
  };

  const handleDeleteSelected = async () => {
    if (!selectedServiceIds.length) return;
    setIsDeletingSelected(true);
    try {
      await deleteSelectedServices(selectedServiceIds);
      setSelectedServiceIds([]);
      setIsRemoveSelectedOpen(false);
    } finally {
      setIsDeletingSelected(false);
    }
  };

  const handleDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      await deleteAllServices();
      setSelectedServiceIds([]);
      setIsRemoveAllOpen(false);
    } finally {
      setIsDeletingAll(false);
    }
  };

  if (isLoading) {
    return <PageListLoadingState />;
  }

  if (error) {
    return (
      <PageErrorState
        title="Nao foi possivel carregar os servicos"
        description={error}
        action={{ label: 'Tentar novamente', onClick: refetch }}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <ModuleIntro
        eyebrow="Catalogo"
        title="Estruture o portifolio de servicos com preco, duracao, categoria e disponibilidade por equipe."
        description="Use a busca, os filtros e a alternancia entre cards e tabela para revisar o catalogo com menos atrito."
        badges={[
          { label: `${pagination.total} servico(s)` },
          { label: selectedCategory },
          { label: viewMode === 'grid' ? 'Cards' : 'Lista' },
        ]}
        points={[
          {
            eyebrow: 'Catalogo',
            title: 'Preco, duracao e contexto',
            description: 'Mantenha nome, tempo e valor claros para reduzir duvidas no agendamento e na operacao.',
          },
          {
            eyebrow: 'Equipe',
            title: 'Disponibilidade por profissional',
            description: 'Restrinja apenas quando o servico depender de pessoas especificas; no restante, mantenha amplo.',
          },
          {
            eyebrow: 'Navegacao',
            title: 'Cards para leitura, lista para manutencao',
            description: 'Troque de visualizacao conforme a tarefa: revisar rapido ou editar em sequencia.',
          },
        ]}
      />

      <div className="flex justify-end">
        <Button variant="outline" size="sm" asChild>
          <Link to="/pacotes">
            <Package className="mr-2 h-4 w-4" />
            Pacotes de servicos
          </Link>
        </Button>
      </div>

      <Dialog
        open={isNewServiceOpen}
        onOpenChange={(open) => {
          setIsNewServiceOpen(open);
          if (!open) resetForm();
        }}
      >
        <CrudListToolbar
          searchPlaceholder="Buscar servicos..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          gridAriaLabel="Visualizar servicos em cards"
          tableAriaLabel="Visualizar servicos em lista"
          actionLabel="Servico"
          actionLabelMobile="Novo"
          actionLabelDesktop="Novo servico"
          actionIcon={Plus}
          onAction={() => {
            setEditingService(null);
            setIsNewServiceOpen(true);
          }}
        />

        <DialogContent className="mx-4 max-h-[85vh] max-w-md overflow-y-auto sm:mx-auto sm:max-w-2xl">
          <DialogHeader className="border-b border-border/70 pb-4 pr-10">
            <DialogTitle>{editingService ? 'Editar servico' : 'Novo servico'}</DialogTitle>
            <DialogDescription>
              {editingService ? 'Atualize os dados do servico' : 'Preencha os dados do novo servico'}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
                <DialogSection>
                  <p className="text-sm font-medium text-foreground">
                    {editingService ? 'Revise nome, duracao, preco e disponibilidade antes de salvar.' : 'Cadastre o servico com nome claro, preco e duracao para manter o catalogo consistente.'}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Se nenhum profissional for marcado, o servico continua disponivel para toda a equipe.
                  </p>
                </DialogSection>

                <DialogSection className="bg-transparent">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Estrutura do servico</p>
                    <p className="text-sm text-muted-foreground">Defina nome, categoria, duracao e preco com o minimo de ambiguidade operacional.</p>
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
                    {formErrors.name ? (
                      <p className="text-xs text-destructive">{formErrors.name}</p>
                    ) : null}
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
                        {categories.filter((c) => c !== 'Todos').map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </DialogSection>

                <DialogSection className="bg-transparent">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Equipe elegivel</p>
                    <p className="text-sm text-muted-foreground">Restrinja quando o servico depender de pessoas especificas. Caso contrario, mantenha o atendimento aberto para todos.</p>
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
                          {!professional.isActive ? (
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

                <DialogSection className="space-y-3 bg-transparent">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <Label>Exigir sinal no agendamento online</Label>
                      <p className="text-xs text-muted-foreground">
                        Cliente paga um PIX antecipado para confirmar o horario (anti no-show).
                      </p>
                    </div>
                    <Switch
                      checked={formSinalObrigatorio}
                      onCheckedChange={setFormSinalObrigatorio}
                    />
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
                  <Switch
                    checked={formIsActive}
                    onCheckedChange={setFormIsActive}
                  />
                </DialogSection>
          </DialogBody>
          <DialogStickyFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsNewServiceOpen(false);
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
              ) : editingService ? 'Salvar servico' : 'Criar servico'}
            </Button>
          </DialogStickyFooter>
        </DialogContent>
      </Dialog>

        <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox
              checked={allFilteredSelected}
              onCheckedChange={(checked) => toggleSelectAllFiltered(checked === true)}
            />
            Selecionar todos da lista
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              variant="outline"
              className="w-full text-destructive hover:text-destructive sm:w-auto"
              disabled={!selectedServiceIds.length}
              onClick={() => setIsRemoveSelectedOpen(true)}
            >
              Remover selecionados ({selectedServiceIds.length})
            </Button>
            <Button
              variant="outline"
              className="w-full text-destructive hover:text-destructive sm:w-auto"
              disabled={!services.length}
              onClick={() => setIsRemoveAllOpen(true)}
            >
              Remover todos
            </Button>
          </div>
        </div>

        <div className="-mx-1 overflow-x-auto pb-2">
          <div className="flex min-w-max gap-2 px-1">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap text-xs sm:text-sm"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

      <WorkspaceNotice
        title="Area de trabalho de servicos"
        description="Filtre por categoria, selecione itens em lote e abra o cadastro para ajustar preco, duracao e equipe."
        badge={
          selectedServiceIds.length
            ? `${selectedServiceIds.length} selecionado(s)`
            : `${filteredServices.length} em foco`
        }
      />

      {filteredServices.length === 0 ? (
        <PageEmptyState
          title={
            searchTerm || selectedCategory !== 'Todos'
              ? 'Nenhum servico encontrado para os filtros atuais'
              : 'Nenhum servico cadastrado'
          }
          description={
            searchTerm || selectedCategory !== 'Todos'
              ? 'A busca e os filtros atuais esconderam todos os resultados. Limpe os filtros para voltar a ver a lista completa.'
              : 'Cadastre o primeiro servico para comecar a montar o catalogo operacional do salao.'
          }
          action={{
            label: searchTerm || selectedCategory !== 'Todos' ? 'Limpar filtros' : 'Novo servico',
            onClick: () => {
              if (searchTerm || selectedCategory !== 'Todos') {
                setSearchTerm('');
                setSelectedCategory('Todos');
                return;
              }
              setEditingService(null);
              setIsNewServiceOpen(true);
            },
            variant: searchTerm || selectedCategory !== 'Todos' ? 'outline' : 'default',
          }}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid gap-3 md:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {filteredServices.map((service) => (
            <Card
              key={service.id}
              className={`transition-shadow hover:shadow-md ${!service.isActive ? 'opacity-60' : ''}`}
            >
              <CardContent className="p-4 sm:p-5">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-1 items-start gap-2">
                    <Checkbox
                      checked={selectedServiceIds.includes(service.id)}
                      onCheckedChange={() => toggleServiceSelection(service.id)}
                      aria-label="Selecionar servico"
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-foreground sm:text-base">
                          {service.name}
                        </h3>
                        {!service.isActive && (
                          <Badge variant="outline" className="text-[10px] sm:text-xs text-muted-foreground">
                            Inativo
                          </Badge>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-[10px] sm:text-xs">
                        {service.category}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        aria-label={`Abrir acoes do servico ${service.name}`}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(service)}>
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleActive(service.id, !service.isActive)}>
                        {service.isActive ? 'Desativar' : 'Ativar'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => setServiceToDelete(service.id)}
                      >
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <p className="mb-4 line-clamp-2 text-xs text-muted-foreground sm:text-sm">
                  {service.description || 'Sem descricao'}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm">{service.duration} min</span>
                  </div>
                  <div className="flex items-center gap-1 font-semibold text-primary">
                    <span className="text-sm sm:text-base">{formatCurrency(service.price)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border/70 shadow-none">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allFilteredSelected}
                      onCheckedChange={(checked) => toggleSelectAllFiltered(checked === true)}
                      aria-label="Selecionar todos os servicos filtrados"
                    />
                  </TableHead>
                  <TableHead>Servico</TableHead>
                  <TableHead className="hidden md:table-cell">Descricao</TableHead>
                  <TableHead className="text-center">Duracao</TableHead>
                  <TableHead className="text-right">Preco</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((service) => (
                  <TableRow
                    key={service.id}
                    className={!service.isActive ? 'opacity-60' : undefined}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedServiceIds.includes(service.id)}
                        onCheckedChange={() => toggleServiceSelection(service.id)}
                        aria-label={`Selecionar servico ${service.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium">{service.name}</p>
                          <Badge variant="secondary" className="text-[10px] sm:text-xs">
                            {service.category}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden max-w-[320px] truncate text-sm text-muted-foreground md:table-cell">
                      {service.description || 'Sem descricao'}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {service.duration} min
                    </TableCell>
                    <TableCell className="text-right font-medium text-primary">
                      {formatCurrency(service.price)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={service.isActive ? 'default' : 'outline'} className="text-[10px] sm:text-xs">
                        {service.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={`Abrir acoes do servico ${service.name}`}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(service)}>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(service.id, !service.isActive)}>
                            {service.isActive ? 'Desativar' : 'Ativar'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => setServiceToDelete(service.id)}
                          >
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {!searchTerm && selectedCategory === 'Todos' && totalPages > 1 ? (
        <PaginationControls
          page={pagination.page}
          totalPages={totalPages}
          isLoading={isLoading}
          hasNextPage={pagination.hasMore}
          onPrevious={() => goToPage(pagination.page - 1)}
          onNext={() => goToPage(pagination.page + 1)}
        />
      ) : null}

      <DeleteConfirmationDialog
        open={!!serviceToDelete}
        isLoading={isDeletingService}
        title="Excluir servico?"
        description="Tem certeza que deseja excluir este servico? Esta acao nao pode ser desfeita."
        onOpenChange={(open) => {
          if (isDeletingService) return;
          if (!open) setServiceToDelete(null);
        }}
        onConfirm={handleDelete}
      />

      <DeleteConfirmationDialog
        open={isRemoveSelectedOpen}
        isLoading={isDeletingSelected}
        title="Remover servicos selecionados?"
        description={`Tem certeza que deseja remover ${selectedServiceIds.length} servico(s) selecionado(s)? Esta acao nao pode ser desfeita.`}
        onOpenChange={(open) => {
          if (isDeletingSelected) return;
          setIsRemoveSelectedOpen(open);
        }}
        onConfirm={handleDeleteSelected}
      />

      <DeleteConfirmationDialog
        open={isRemoveAllOpen}
        isLoading={isDeletingAll}
        title="Remover todos os servicos?"
        description="Tem certeza que deseja remover todos os servicos cadastrados? Esta acao nao pode ser desfeita."
        onOpenChange={(open) => {
          if (isDeletingAll) return;
          setIsRemoveAllOpen(open);
        }}
        onConfirm={handleDeleteAll}
      />
    </div>
  );
}
