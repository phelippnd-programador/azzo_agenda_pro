import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { PageErrorState } from '@/components/ui/page-states';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { Search, Plus, Users, Info } from 'lucide-react';
import { useProfessionals } from '@/hooks/useProfessionals';
import { useSpecialties } from '@/hooks/useSpecialties';
import { DeleteConfirmationDialog } from '@/components/common/DeleteConfirmationDialog';
import { ProfessionalLimitMeter } from '@/components/professionals/ProfessionalLimitMeter';
import { ProfessionalCard } from '@/components/professionals/ProfessionalCard';
import { ProfessionalFormDialog } from '@/components/professionals/ProfessionalFormDialog';
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
  const [searchTerm, setSearchTerm] = useState('');
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
            A configuracao principal de comissao agora e feita no modulo novo. Use o perfil do profissional ou
            <strong> Financeiro &gt; Comissoes</strong> para configurar regras e acompanhar apuracao.
          </AlertDescription>
        </Alert>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar profissionais..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button className="gap-2" onClick={() => { setEditingProfessional(null); setIsDialogOpen(true); }}>
            <Plus className="w-4 h-4" />
            Novo Profissional
          </Button>
        </div>

        {filteredProfessionals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum profissional encontrado</p>
              {searchTerm && (
                <Button variant="link" onClick={() => setSearchTerm('')}>Limpar busca</Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredProfessionals.map((professional) => (
              <ProfessionalCard
                key={professional.id}
                professional={professional}
                onOpenProfile={(id) => navigate(`/profissionais/${id}`)}
                onEdit={openEditDialog}
                onToggleActive={(id, isActive) => updateProfessional(id, { isActive })}
                onDelete={(id) => setProfessionalToDelete(id)}
                onResetPassword={(item) => setProfessionalToReset({ id: item.id, name: item.name, email: item.email })}
              />
            ))}
          </div>
        )}

        {!searchTerm && totalPages > 1 ? (
          <div className="flex items-center justify-between gap-3 border rounded-lg p-3 bg-muted/20">
            <p className="text-sm text-muted-foreground">
              Pagina {pagination.page} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline" size="sm"
                onClick={() => goToPage(pagination.page - 1)}
                disabled={pagination.page <= 1 || isLoading}
              >
                Anterior
              </Button>
              <Button
                variant="outline" size="sm"
                onClick={() => goToPage(pagination.page + 1)}
                disabled={pagination.page >= totalPages || isLoading || !pagination.hasMore}
              >
                Proxima
              </Button>
            </div>
          </div>
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
