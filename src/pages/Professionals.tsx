import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { MainLayout } from '@/components/layout/MainLayout';
import { ModuleIntro, WorkspaceNotice } from '@/components/layout/module-surfaces';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageEmptyState, PageErrorState, PageListLoadingState } from '@/components/ui/page-states';
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
import { useAuth } from '@/contexts/AuthContext';
import type { WorkingHours } from '@/types';

type ProfessionalData = {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialties: string[];
  isActive: boolean;
  accessUserCreated?: boolean;
  workingHours: WorkingHours[];
};

export default function Professionals() {
  const navigate = useNavigate();
  const { canAccess } = useMenuPermissions();
  const { user } = useAuth();
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
  const limitReached = !!professionalLimits && professionalLimits.remaining <= 0;
  const canAccessFinancialCommissions = canAccess('/financeiro/comissoes');
  const hasLinkedCurrentUserProfessional = professionals.some((professional) => professional.userId === user?.id);
  const activeProfessionalsCount = professionals.filter((professional) => professional.isActive).length;
  const inactiveProfessionalsCount = Math.max(0, professionals.length - activeProfessionalsCount);

  const openEditDialog = (prof: ProfessionalData) => {
    setEditingProfessional(prof);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    if (limitReached) {
      toast.error('Limite de profissionais do seu plano atingido. Faça upgrade para adicionar mais.');
      return;
    }
    setEditingProfessional(null);
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
        <div className="space-y-4 sm:space-y-6">
          <ProfessionalLimitMeter limits={null} isLoading />
          <PageListLoadingState metricCount={0} itemCount={6} itemHeightClassName="h-64" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Profissionais" subtitle="Gerencie sua equipe">
        <PageErrorState
          title="Não foi possível carregar os profissionais"
          description={error}
          action={{ label: 'Tentar novamente', onClick: refetch }}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Profissionais" subtitle="Gerencie sua equipe">
      <div className="space-y-4 sm:space-y-6">
        <ModuleIntro
          eyebrow="Equipe"
          title="Organize cadastro, disponibilidade e regras de acesso da equipe no mesmo fluxo."
          description="Use cards para leitura rápida do time e mude para lista quando precisar editar, ativar ou revisar várias pessoas em sequência."
          badges={[
            { label: `${professionals.length} profissional(is)` },
            { label: viewMode === 'grid' ? 'Cards' : 'Lista' },
            { label: `${filteredProfessionals.length} em foco` },
          ]}
          points={[
            {
              eyebrow: 'Operação',
              title: 'Cadastre e ative a equipe certa',
              description: 'Mantenha a equipe ativa enxuta e use o perfil individual para detalhes e regras mais profundas.',
            },
            {
              eyebrow: 'Comissão',
              title: 'Configuração saiu da tela principal',
              description: 'A tela agora serve melhor para gestão do time; a apuração fica concentrada no módulo financeiro.',
            },
            {
              eyebrow: 'Próximo passo',
              title: 'Busque, revise e abra o perfil',
              description: 'Use a lista quando precisar agir em sequência e os cards quando quiser leitura mais humana do time.',
            },
          ]}
        />

        <ProfessionalLimitMeter limits={professionalLimits} isLoading={isLimitsLoading} />

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Comissão por profissional</AlertTitle>
          <AlertDescription>
            {canAccessFinancialCommissions ? (
              <>
                A configuração principal de comissão agora é feita no módulo novo. Use o perfil do profissional ou
                <strong> Financeiro &gt; Comissões</strong> para configurar regras e acompanhar apuração.
              </>
            ) : (
              <>
                A configuração principal de comissão agora é feita no módulo novo. Use o perfil do profissional
                para configurar regras e acompanhar apuração.
              </>
            )}
          </AlertDescription>
        </Alert>

        <div className="grid gap-3 md:grid-cols-3 sm:gap-4">
          <Card className="border-border/70 bg-card/95 shadow-panel">
            <div className="space-y-1 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Equipe total</p>
              <p className="text-2xl font-semibold text-foreground">{professionals.length}</p>
              <p className="text-xs text-muted-foreground">Total carregado na página atual.</p>
            </div>
          </Card>
          <Card className="border-success/25 bg-success/8 shadow-panel">
            <div className="space-y-1 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-success">Ativos</p>
              <p className="text-2xl font-semibold text-success">{activeProfessionalsCount}</p>
              <p className="text-xs text-success/80">Disponíveis para a operação do dia.</p>
            </div>
          </Card>
          <Card className="border-border/70 bg-muted/30 shadow-panel">
            <div className="space-y-1 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Inativos</p>
              <p className="text-2xl font-semibold text-foreground">{inactiveProfessionalsCount}</p>
              <p className="text-xs text-muted-foreground/80">Fora da operação ativa ou aguardando uso.</p>
            </div>
          </Card>
        </div>

        <WorkspaceNotice
          title="Área de trabalho da equipe"
          description="Busque, alterne a visualização e siga para cadastro, edição, ativação ou perfil individual."
          badge={`${activeProfessionalsCount} ativo(s) no momento`}
        />

        <Alert className="border-primary/25 bg-primary/8">
          <Info className="h-4 w-4" />
          <AlertTitle>Acesso do profissional</AlertTitle>
          <AlertDescription>
            Novo profissional recebe acesso automático quando você informa um e-mail válido. A senha temporária é enviada por e-mail e pode ser reenviada pela ação <strong>Resetar senha</strong>.
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
          actionLabelDesktop="Novo profissional"
          actionIcon={Plus}
          actionDisabled={limitReached}
          actionDisabledReason="Limite de profissionais do seu plano atingido"
          onAction={openCreateDialog}
        />

        {filteredProfessionals.length === 0 ? (
          <PageEmptyState
            title={searchTerm ? "Nenhum profissional encontrado para esta busca" : "Nenhum profissional cadastrado"}
            description={
              searchTerm
                ? "A busca atual não retornou resultados. Limpe o termo para voltar a ver a lista completa."
                : "Cadastre o primeiro profissional para montar a equipe, horários e regras operacionais."
            }
            action={{
              label: searchTerm ? "Limpar busca" : "Novo profissional",
              onClick: () => {
                if (searchTerm) {
                  setSearchTerm('');
                  return;
                }
                openCreateDialog();
              },
              variant: searchTerm ? "outline" : "default",
              disabled: !searchTerm && limitReached,
            }}
          />
        ) : (
          viewMode === 'grid' ? (
            <div className="grid gap-3 md:grid-cols-2 sm:gap-4 lg:grid-cols-3">
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
            <Card className="overflow-hidden border-border/70 bg-card/95 shadow-panel">
              <div className="flex flex-col gap-3 border-b border-border/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Lista da equipe</p>
                  <p className="text-sm text-muted-foreground">
                    Leia status, contato e especialidades em uma visualização mais previsível para manutenção.
                  </p>
                </div>
                <Badge variant="outline" className="w-fit bg-background/80">
                  {filteredProfessionals.length} visível(is)
                </Badge>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profissional</TableHead>
                      <TableHead className="hidden md:table-cell">Telefone</TableHead>
                      <TableHead className="hidden lg:table-cell">Especialidades</TableHead>
                      <TableHead className="hidden xl:table-cell">Acesso</TableHead>
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
                              <p className="max-w-[220px] truncate font-medium">{professional.name}</p>
                              <p className="max-w-[220px] truncate text-xs text-muted-foreground">
                                {professional.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden text-sm md:table-cell">
                          {professional.phone}
                        </TableCell>
                        <TableCell className="hidden max-w-[340px] truncate lg:table-cell">
                          {professional.specialties.length
                            ? professional.specialties.join(', ')
                            : 'Sem especialidades'}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          <Badge variant="outline">
                            {professional.accessUserCreated ? 'Acesso ativo' : 'Sem acesso'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={professional.isActive ? 'default' : 'outline'}
                            className={professional.isActive ? 'border-success/25 bg-success/12 text-success' : undefined}
                          >
                            {professional.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                aria-label={`Abrir ações do profissional ${professional.name}`}
                              >
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
                                className="text-destructive"
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
        hasLinkedCurrentUserProfessional={hasLinkedCurrentUserProfessional}
        creationLimitReached={limitReached}
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
              Uma senha temporária será gerada para <strong>{professionalToReset.name}</strong>{' '}
              ({professionalToReset.email}).
            </>
          ) : (
            'Uma senha temporária será gerada e enviada.'
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
        description="Tem certeza que deseja remover este profissional? Esta ação não pode ser desfeita."
        onOpenChange={(open) => { if (isDeletingProfessional) return; if (!open) setProfessionalToDelete(null); }}
        onConfirm={handleDelete}
      />
    </MainLayout>
  );
}
