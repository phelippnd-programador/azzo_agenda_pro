import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Clock, MoreVertical, Package } from 'lucide-react';
import { useServices } from '@/hooks/useServices';
import { DeleteConfirmationDialog } from '@/components/common/DeleteConfirmationDialog';
import { useProfessionals } from '@/hooks/useProfessionals';
import { formatCurrency } from '@/lib/format';
import { ModuleIntro, WorkspaceNotice } from '@/components/layout/module-surfaces';
import { ServiceFormDialog } from '@/components/services/ServiceFormDialog';
import type { Service } from '@/types';

const categories = ['Todos', 'Cabelo', 'Barba', 'Unhas', 'Estetica', 'Maquiagem', 'Outros'];

const formatCategoryLabel = (category: string) => (category === 'Estetica' ? 'Estética' : category);

export default function ServicesOverviewPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [isNewServiceOpen, setIsNewServiceOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [isDeletingService, setIsDeletingService] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isRemoveSelectedOpen, setIsRemoveSelectedOpen] = useState(false);
  const [isRemoveAllOpen, setIsRemoveAllOpen] = useState(false);

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

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    setIsNewServiceOpen(true);
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
        title="Não foi possível carregar os serviços"
        description={error}
        action={{ label: 'Tentar novamente', onClick: refetch }}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <ModuleIntro
        eyebrow="Catálogo"
        title="Estruture o portfólio de serviços com preço, duração, categoria e disponibilidade por equipe."
        description="Use a busca, os filtros e a alternância entre cards e tabela para revisar o catálogo com menos atrito."
        badges={[
          { label: `${pagination.total} serviço(s)` },
          { label: formatCategoryLabel(selectedCategory) },
          { label: viewMode === 'grid' ? 'Cards' : 'Lista' },
        ]}
        points={[
          {
            eyebrow: 'Catálogo',
            title: 'Preço, duração e contexto',
            description: 'Mantenha nome, tempo e valor claros para reduzir dúvidas no agendamento e na operação.',
          },
          {
            eyebrow: 'Equipe',
            title: 'Disponibilidade por profissional',
            description: 'Restrinja apenas quando o serviço depender de pessoas específicas; no restante, mantenha amplo.',
          },
          {
            eyebrow: 'Navegação',
            title: 'Cards para leitura, lista para manutenção',
            description: 'Troque de visualização conforme a tarefa: revisar rápido ou editar em sequência.',
          },
        ]}
      />

      <div className="flex justify-end">
        <Button variant="outline" size="sm" asChild>
          <Link to="/pacotes">
            <Package className="mr-2 h-4 w-4" />
            Pacotes de serviços
          </Link>
        </Button>
      </div>

      <CrudListToolbar
        searchPlaceholder="Buscar serviços..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        gridAriaLabel="Visualizar serviços em cards"
        tableAriaLabel="Visualizar serviços em lista"
        actionLabel="Serviço"
        actionLabelMobile="Novo"
        actionLabelDesktop="Novo serviço"
        actionIcon={Plus}
        onAction={() => {
          setEditingService(null);
          setIsNewServiceOpen(true);
        }}
      />

      <ServiceFormDialog
        open={isNewServiceOpen}
        onOpenChange={(open) => {
          setIsNewServiceOpen(open);
          if (!open) setEditingService(null);
        }}
        editingService={editingService}
        professionals={professionals}
        isLoadingProfessionals={isLoadingProfessionals}
        onCreate={createService}
        onUpdate={updateService}
      />

        <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/80 p-3 shadow-[0_14px_34px_-30px_rgba(15,23,42,0.28)] sm:flex-row sm:items-center sm:justify-between">
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
                {formatCategoryLabel(category)}
              </Button>
            ))}
          </div>
        </div>

      <WorkspaceNotice
        title="Área de trabalho de serviços"
        description="Filtre por categoria, selecione itens em lote e abra o cadastro para ajustar preço, duração e equipe."
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
              ? 'Nenhum serviço encontrado para os filtros atuais'
              : 'Nenhum serviço cadastrado'
          }
          description={
            searchTerm || selectedCategory !== 'Todos'
              ? 'A busca e os filtros atuais esconderam todos os resultados. Limpe os filtros para voltar a ver a lista completa.'
              : 'Cadastre o primeiro serviço para começar a montar o catálogo operacional do salão.'
          }
          action={{
            label: searchTerm || selectedCategory !== 'Todos' ? 'Limpar filtros' : 'Novo serviço',
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
              className={`border-border/70 bg-card/95 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-panel ${!service.isActive ? 'opacity-60' : ''}`}
            >
              <CardContent className="p-4 sm:p-5">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-1 items-start gap-2">
                    <Checkbox
                      checked={selectedServiceIds.includes(service.id)}
                      onCheckedChange={() => toggleServiceSelection(service.id)}
                      aria-label="Selecionar serviço"
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-foreground sm:text-base">
                          {service.name}
                        </h3>
                        {!service.isActive && (
                          <Badge variant="outline" className="text-xs sm:text-xs text-muted-foreground">
                            Inativo
                          </Badge>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-xs sm:text-xs">
                        {formatCategoryLabel(service.category)}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        aria-label={`Abrir ações do serviço ${service.name}`}
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
                  {service.description || 'Sem descrição'}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3">
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
        <Card className="overflow-hidden border-border/70 bg-card/95 shadow-panel">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allFilteredSelected}
                      onCheckedChange={(checked) => toggleSelectAllFiltered(checked === true)}
                      aria-label="Selecionar todos os serviços filtrados"
                    />
                  </TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead className="hidden md:table-cell">Descrição</TableHead>
                  <TableHead className="text-center">Duração</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
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
                        aria-label={`Selecionar serviço ${service.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium">{service.name}</p>
                          <Badge variant="secondary" className="text-xs sm:text-xs">
                            {formatCategoryLabel(service.category)}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden max-w-[320px] truncate text-sm text-muted-foreground md:table-cell">
                      {service.description || 'Sem descrição'}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {service.duration} min
                    </TableCell>
                    <TableCell className="text-right font-medium text-primary">
                      {formatCurrency(service.price)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={service.isActive ? 'default' : 'outline'} className="text-xs sm:text-xs">
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
                            aria-label={`Abrir ações do serviço ${service.name}`}
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
        title="Excluir serviço?"
        description="Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita."
        onOpenChange={(open) => {
          if (isDeletingService) return;
          if (!open) setServiceToDelete(null);
        }}
        onConfirm={handleDelete}
      />

      <DeleteConfirmationDialog
        open={isRemoveSelectedOpen}
        isLoading={isDeletingSelected}
        title="Remover serviços selecionados?"
        description={`Tem certeza que deseja remover ${selectedServiceIds.length} serviço(s) selecionado(s)? Esta ação não pode ser desfeita.`}
        onOpenChange={(open) => {
          if (isDeletingSelected) return;
          setIsRemoveSelectedOpen(open);
        }}
        onConfirm={handleDeleteSelected}
      />

      <DeleteConfirmationDialog
        open={isRemoveAllOpen}
        isLoading={isDeletingAll}
        title="Remover todos os serviços?"
        description="Tem certeza que deseja remover todos os serviços cadastrados? Esta ação não pode ser desfeita."
        onOpenChange={(open) => {
          if (isDeletingAll) return;
          setIsRemoveAllOpen(open);
        }}
        onConfirm={handleDeleteAll}
      />
    </div>
  );
}
