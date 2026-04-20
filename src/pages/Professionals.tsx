import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageEmptyState, PageErrorState } from '@/components/ui/page-states';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
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
import { Info, MoreVertical, Plus, Users } from 'lucide-react';
import { useProfessionals } from '@/hooks/useProfessionals';
import { useSpecialties } from '@/hooks/useSpecialties';
import { DeleteConfirmationDialog } from '@/components/common/DeleteConfirmationDialog';
import { ProfessionalLimitMeter } from '@/components/professionals/ProfessionalLimitMeter';
import { ProfessionalCard } from '@/components/professionals/ProfessionalCard';
import { ProfessionalFormDialog } from '@/components/professionals/ProfessionalFormDialog';
import { useMenuPermissions } from '@/contexts/MenuPermissionsContext';
import type { WorkingHours } from '@/types';

type ProfessionalData = {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialties: string[];
  isActive: boolean;
  workingHours: WorkingHours[];
};

export default function Professionals() {
  const navigate = useNavigate();
  const { canAccess } = useMenuPermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<ProfessionalData | null>(null);
  const [professionalToReset, setProfessionalToReset] = useState<{ id: string; name: string; email: string } | null>(null);
  const [professionalToDelete, setProfessionalToDelete] = useState<string | null>(null);
  const [isDeletingProfessional, setIsDeletingProfessional] = useState(false);

  const {
    professionals, professionalLimits, pagination,
    isLoading, isLimitsLoading, error, refetch, goToPage,
    createProfessional, updateProfessional, deleteProfessional, resetProfessionalPassword,
  } = useProfessionals({ fetchLimits: true });

  const { specialties, isLoading: isLoadingSpecialties, error: specialtiesError, refetch: refetchSpecialties } = useSpecialties();

  const filteredProfessionals = professionals.filter((prof) => {
    const term = searchTerm.toLowerCase();
    return (
      prof.name.toLowerCase().includes(term) ||
      prof.email.toLowerCase().includes(term) ||
      prof.specialties.some((s) => s.toLowerCase().includes(term))
    );
  });
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));
  const canAccessFinancialCommissions = canAccess('/financeiro/comissoes');

  const openEditDialog = (prof: ProfessionalData) => {
    setEditingProfessional(prof);
    setIsDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) setEditingProfessional(null);
  };

  const handleDelete = async () => {
    if (!professionalToDelete) return;
    setIsDeletingProfessional(true);
    try {
      await deleteProfessional(professionalToDelete);
      setProfessionalToDelete(null);
    } finally {
      setIsDeletingProfessional(false);
    }
  };

  const handleResetPasswordConfirm = async () => {
    if (!professionalToReset) return;
    try {
      await resetProfessionalPassword(professionalToReset.id);
      setProfessionalToReset(null);
    } catch {
      // handled in hook
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="Profissionais" subtitle="Gerencie sua equipe">
        <div className="space-y-4">
          <ProfessionalLimitMeter limits={null} isLoading />
          <Skeleton className="h-12 w-full" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-64" />)}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Profissionais" subtitle="Gerencie sua equipe">
        <PageErrorState
          title="Nao foi possivel carregar os profissionais"
          description={error}
          action={{ label: 'Tentar novamente', onClick: refetch }}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Profissionais" subtitle="Gerencie sua equipe">
      <div className="space-y-4 sm:space-y-6">
        <ProfessionalLimitMeter limits={professionalLimits} isLoading={isLimitsLoading} />

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Comissao por profissional</AlertTitle>
          <AlertDescription>
            {canAccessFinancialCommissions ? (
              <>
                A configuracao principal de comissao agora e feita no modulo novo. Use o perfil do profissional ou
                <strong> Financeiro &gt; Comissoes</strong> para configurar regras e acompanhar apuracao.
              </>
            ) : (
              <>
                A configuracao principal de comissao agora e feita no modulo novo. Use o perfil do profissional
                para configurar regras e acompanhar apuracao.
              </>
            )}
          </AlertDescription>
        </Alert>

        <CrudListToolbar
          searchPlaceholder="Buscar profissionais..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          gridAriaLabel="Visualizar profissionais em cards"
          tableAriaLabel="Visualizar profissionais em lista"
          actionLabel="Profissional"
          actionLabelMobile="Novo"
          actionIcon={Plus}
          onAction={() => {
            setEditingProfessional(null);
            setIsDialogOpen(true);
          }}
        />

        {filteredProfessionals.length === 0 ? (
          <PageEmptyState
            title={searchTerm ? "Nenhum profissional encontrado para esta busca" : "Nenhum profissional cadastrado"}
            description={
              searchTerm
                ? "A busca atual nao retornou resultados. Limpe o termo para voltar a ver a lista completa."
                : "Cadastre o primeiro profissional para montar a equipe, horários e regras operacionais."
            }
            action={{
              label: searchTerm ? "Limpar busca" : "Novo profissional",
              onClick: () => {
                if (searchTerm) {
                  setSearchTerm('');
                  return;
                }
                setEditingProfessional(null);
                setIsDialogOpen(true);
              },
              variant: searchTerm ? "outline" : "default",
            }}
          />
        ) : (
          viewMode === 'grid' ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredProfessionals.map((professional) => (
                <ProfessionalCard
                  key={professional.id}
                  professional={professional}
                  onOpenProfile={(id) => navigate(`/profissionais/${id}`)}
                  onEdit={openEditDialog}
                  onToggleActive={(id, isActive) => updateProfessional(id, { isActive })}
                  onDelete={(id) => setProfessionalToDelete(id)}
                  onResetPassword={(item) =>
                    setProfessionalToReset({ id: item.id, name: item.name, email: item.email })
                  }
                />
              ))}
            </div>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profissional</TableHead>
                      <TableHead className="hidden md:table-cell">Telefone</TableHead>
                      <TableHead className="hidden lg:table-cell">Especialidades</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProfessionals.map((professional) => (
                      <TableRow key={professional.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarImage src={professional.avatar} />
                              <AvatarFallback className="bg-primary/15 text-xs text-primary">
                                {professional.name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate font-medium">{professional.name}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {professional.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden text-sm md:table-cell">
                          {professional.phone}
                        </TableCell>
                        <TableCell className="hidden max-w-[280px] truncate lg:table-cell">
                          {professional.specialties.length
                            ? professional.specialties.join(', ')
                            : 'Sem especialidades'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={professional.isActive ? 'default' : 'outline'}
                            className={professional.isActive ? 'bg-green-100 text-green-700' : undefined}
                          >
                            {professional.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/profissionais/${professional.id}`)}>
                                Ver perfil
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditDialog(professional)}>
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  updateProfessional(professional.id, { isActive: !professional.isActive })
                                }
                              >
                                {professional.isActive ? 'Desativar' : 'Ativar'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  setProfessionalToReset({
                                    id: professional.id,
                                    name: professional.name,
                                    email: professional.email,
                                  })
                                }
                              >
                                Resetar senha
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => setProfessionalToDelete(professional.id)}
                              >
                                Remover
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
          )
        )}

        {!searchTerm && totalPages > 1 ? (
          <PaginationControls
            page={pagination.page}
            totalPages={totalPages}
            isLoading={isLoading}
            hasNextPage={pagination.hasMore}
            onPrevious={() => goToPage(pagination.page - 1)}
            onNext={() => goToPage(pagination.page + 1)}
          />
        ) : null}
      </div>

      <ProfessionalFormDialog
        open={isDialogOpen}
        onOpenChange={handleDialogOpenChange}
        editingProfessional={editingProfessional}
        specialties={specialties}
        isLoadingSpecialties={isLoadingSpecialties}
        specialtiesError={specialtiesError}
        refetchSpecialties={refetchSpecialties}
        onCreate={createProfessional}
        onUpdate={updateProfessional}
      />

      <ConfirmationDialog
        open={!!professionalToReset}
        title="Resetar senha do profissional?"
        description={
          professionalToReset ? (
            <>
              Uma senha temporaria sera gerada para <strong>{professionalToReset.name}</strong>{' '}
              ({professionalToReset.email}).
            </>
          ) : (
            'Uma senha temporaria sera gerada e enviada.'
          )
        }
        cancelLabel="Cancelar"
        confirmLabel="Sim, resetar senha"
        onOpenChange={(open) => { if (!open) setProfessionalToReset(null); }}
        onConfirm={handleResetPasswordConfirm}
      />

      <DeleteConfirmationDialog
        open={!!professionalToDelete}
        isLoading={isDeletingProfessional}
        title="Remover profissional?"
        description="Tem certeza que deseja remover este profissional? Esta acao nao pode ser desfeita."
        onOpenChange={(open) => { if (isDeletingProfessional) return; if (!open) setProfessionalToDelete(null); }}
        onConfirm={handleDelete}
      />
    </MainLayout>
  );
}
