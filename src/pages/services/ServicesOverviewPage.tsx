import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { PageErrorState } from '@/components/ui/page-states';
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
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Search, Plus, Clock, MoreVertical, Scissors, Loader2, Grid3X3, List } from 'lucide-react';
import { useServices } from '@/hooks/useServices';
import { DeleteConfirmationDialog } from '@/components/common/DeleteConfirmationDialog';
import { useProfessionals } from '@/hooks/useProfessionals';
import { toast } from 'sonner';
import { formatCurrencyCents } from '@/lib/format';

const categories = ['Todos', 'Cabelo', 'Barba', 'Unhas', 'Estetica', 'Maquiagem', 'Outros'];

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
  const [formPrice, setFormPrice] = useState('');
  const [formCategory, setFormCategory] = useState('Cabelo');
  const [formProfessionalIds, setFormProfessionalIds] = useState<string[]>([]);
  const [formIsActive, setFormIsActive] = useState(true);

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

  const parsePriceInputToCents = (value: string) => {
    const normalized = value.trim().replace(',', '.');
    if (!normalized) return 0;
    return Math.round(Number(normalized) * 100);
  };

  const formatPriceCentsToInput = (value: number) => (Number(value || 0) / 100).toFixed(2);

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormDuration('60');
    setFormPrice('');
    setFormCategory('Cabelo');
    setFormProfessionalIds([]);
    setFormIsActive(true);
    setEditingService(null);
  };

  const openEditDialog = (service: typeof services[0]) => {
    setFormName(service.name);
    setFormDescription(service.description);
    setFormDuration(String(service.duration));
    setFormPrice(formatPriceCentsToInput(service.price));
    setFormCategory(service.category);
    setFormProfessionalIds(Array.isArray(service.professionalIds) ? service.professionalIds : []);
    setFormIsActive(service.isActive);
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
    if (!formName || !formPrice || !formDuration) {
      toast.error('Preencha todos os campos obrigatorios');
      return;
    }

    setIsSubmitting(true);
    try {
      const serviceData = {
        name: formName,
        description: formDescription,
        duration: parseInt(formDuration),
        price: parsePriceInputToCents(formPrice),
        category: formCategory,
        professionalIds: formProfessionalIds,
        isActive: formIsActive,
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
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
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
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar servicos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex overflow-hidden rounded-lg border">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className="h-8 w-8 rounded-none sm:h-9 sm:w-9"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('table')}
              className="h-8 w-8 rounded-none sm:h-9 sm:w-9"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Dialog
            open={isNewServiceOpen}
            onOpenChange={(open) => {
              setIsNewServiceOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Servico
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md mx-4 sm:mx-auto sm:max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingService ? 'Editar Servico' : 'Novo Servico'}</DialogTitle>
                <DialogDescription>
                  {editingService ? 'Atualize os dados do servico' : 'Preencha os dados do novo servico'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome do Servico *</Label>
                  <Input
                    placeholder="Ex: Corte Feminino"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descricao</Label>
                  <Textarea
                    placeholder="Descreva o servico..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Duracao (min) *</Label>
                    <Input
                      type="number"
                      placeholder="60"
                      value={formDuration}
                      onChange={(e) => setFormDuration(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Preco (R$) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="80.00"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                    />
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

                <div className="space-y-2">
                  <Label>Profissionais</Label>
                  <div className="rounded-lg border p-3 space-y-3 max-h-48 overflow-y-auto">
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
                    Se nenhum profissional for selecionado, o servico fica disponivel para todos.
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

                <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                  <div>
                    <Label>Servico Ativo</Label>
                    <p className="text-xs text-muted-foreground">Disponivel para agendamento</p>
                  </div>
                  <Switch
                    checked={formIsActive}
                    onCheckedChange={setFormIsActive}
                  />
                </div>
              </div>
              <DialogFooter>
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
                  ) : editingService ? 'Salvar' : 'Criar Servico'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={allFilteredSelected}
            onCheckedChange={(checked) => toggleSelectAllFiltered(checked === true)}
          />
          Selecionar todos da lista
        </label>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive"
            disabled={!selectedServiceIds.length}
            onClick={() => setIsRemoveSelectedOpen(true)}
          >
            Remover selecionados ({selectedServiceIds.length})
          </Button>
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive"
            disabled={!services.length}
            onClick={() => setIsRemoveAllOpen(true)}
          >
            Remover todos
          </Button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
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

      {filteredServices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Scissors className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum servico encontrado</p>
            <Button
              variant="link"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('Todos');
              }}
            >
              Limpar filtros
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredServices.map((service) => (
            <Card
              key={service.id}
              className={`hover:shadow-md transition-shadow ${!service.isActive ? 'opacity-60' : ''}`}
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <Checkbox
                      checked={selectedServiceIds.includes(service.id)}
                      onCheckedChange={() => toggleServiceSelection(service.id)}
                      aria-label="Selecionar servico"
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">
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
                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
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

                <p className="text-xs sm:text-sm text-muted-foreground mb-4 line-clamp-2">
                  {service.description || 'Sem descricao'}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm">{service.duration} min</span>
                  </div>
                  <div className="flex items-center gap-1 text-primary font-semibold">
                    <span className="text-sm sm:text-base">{formatCurrencyCents(service.price)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
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
                      {formatCurrencyCents(service.price)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={service.isActive ? 'default' : 'outline'} className="text-[10px] sm:text-xs">
                        {service.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
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
        <div className="flex items-center justify-between gap-3 border rounded-lg p-3 bg-muted/20">
          <p className="text-sm text-muted-foreground">
            Pagina {pagination.page} de {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(pagination.page - 1)}
              disabled={pagination.page <= 1 || isLoading}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(pagination.page + 1)}
              disabled={pagination.page >= totalPages || isLoading || !pagination.hasMore}
            >
              Proxima
            </Button>
          </div>
        </div>
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
