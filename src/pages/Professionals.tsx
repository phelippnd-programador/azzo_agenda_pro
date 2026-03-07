import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { PageErrorState } from "@/components/ui/page-states";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ConfirmationDialog,
} from "@/components/common/ConfirmationDialog";
import { Search, Plus, Users, Loader2 } from "lucide-react";
import { useProfessionals } from "@/hooks/useProfessionals";
import { useSpecialties } from "@/hooks/useSpecialties";
import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import { maskPhoneBr } from "@/lib/input-masks";
import type { WorkingHours } from "@/types";
import { toast } from "sonner";
import { ProfessionalLimitMeter } from "@/components/professionals/ProfessionalLimitMeter";
import { ProfessionalCard } from "@/components/professionals/ProfessionalCard";

const defaultWorkingHours: WorkingHours[] = [
  { dayOfWeek: 1, startTime: "09:00", endTime: "18:00", isWorking: true },
  { dayOfWeek: 2, startTime: "09:00", endTime: "18:00", isWorking: true },
  { dayOfWeek: 3, startTime: "09:00", endTime: "18:00", isWorking: true },
  { dayOfWeek: 4, startTime: "09:00", endTime: "18:00", isWorking: true },
  { dayOfWeek: 5, startTime: "09:00", endTime: "18:00", isWorking: true },
  { dayOfWeek: 6, startTime: "09:00", endTime: "13:00", isWorking: true },
  { dayOfWeek: 0, startTime: "00:00", endTime: "00:00", isWorking: false },
];

const weekdayLabels: Record<number, string> = {
  0: "Domingo",
  1: "Segunda",
  2: "Terca",
  3: "Quarta",
  4: "Quinta",
  5: "Sexta",
  6: "Sabado",
};

export default function Professionals() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewProfessionalOpen, setIsNewProfessionalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<string | null>(null);
  const [professionalToReset, setProfessionalToReset] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);
  const [professionalToDelete, setProfessionalToDelete] = useState<string | null>(null);
  const [isDeletingProfessional, setIsDeletingProfessional] = useState(false);

  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [formCommission, setFormCommission] = useState("40");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formWorkingHours, setFormWorkingHours] = useState<WorkingHours[]>(
    defaultWorkingHours
  );
  const [isWorkingHoursDisabled, setIsWorkingHoursDisabled] = useState(false);

  const {
    professionals,
    professionalLimits,
    pagination,
    isLoading,
    isLimitsLoading,
    error,
    refetch,
    goToPage,
    createProfessional,
    updateProfessional,
    deleteProfessional,
    resetProfessionalPassword,
  } = useProfessionals({ fetchLimits: true });
  const {
    specialties,
    isLoading: isLoadingSpecialties,
    error: specialtiesError,
    refetch: refetchSpecialties,
  } = useSpecialties();

  const filteredProfessionals = professionals.filter((prof) => {
    const term = searchTerm.toLowerCase();
    return (
      prof.name.toLowerCase().includes(term) ||
      prof.email.toLowerCase().includes(term) ||
      prof.specialties.some((s) => s.toLowerCase().includes(term))
    );
  });
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));

  const resetForm = () => {
    setFormName("");
    setFormEmail("");
    setFormPhone("");
    setSelectedSpecialties([]);
    setFormCommission("40");
    setFormIsActive(true);
    setFormWorkingHours(defaultWorkingHours);
    setIsWorkingHoursDisabled(false);
    setEditingProfessional(null);
  };

  const openEditDialog = (prof: (typeof professionals)[number]) => {
    setFormName(prof.name);
    setFormEmail(prof.email);
    setFormPhone(prof.phone);
    setSelectedSpecialties(prof.specialties || []);
    setFormCommission(String(prof.commissionRate));
    setFormIsActive(prof.isActive);
    const hasWorkingHours = Array.isArray(prof.workingHours) && prof.workingHours.length > 0;
    if (!hasWorkingHours) {
      setFormWorkingHours(
        defaultWorkingHours.map((item) => ({
          ...item,
          startTime: "00:00",
          endTime: "00:00",
          isWorking: false,
        }))
      );
      setIsWorkingHoursDisabled(true);
    } else {
      const normalized = defaultWorkingHours.map((defaultHour) => {
        const current = prof.workingHours.find((item) => item.dayOfWeek === defaultHour.dayOfWeek);
        return current
          ? {
              dayOfWeek: current.dayOfWeek,
              startTime: current.startTime || defaultHour.startTime,
              endTime: current.endTime || defaultHour.endTime,
              isWorking: !!current.isWorking,
            }
          : defaultHour;
      });
      setFormWorkingHours(normalized);
      setIsWorkingHoursDisabled(false);
    }
    setEditingProfessional(prof.id);
    setIsNewProfessionalOpen(true);
  };

  const toggleSpecialty = (specialtyName: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(specialtyName)
        ? prev.filter((name) => name !== specialtyName)
        : [...prev, specialtyName]
    );
  };

  const updateWorkingHour = (
    dayOfWeek: number,
    field: "startTime" | "endTime" | "isWorking",
    value: string | boolean
  ) => {
    setFormWorkingHours((prev) =>
      prev.map((item) =>
        item.dayOfWeek === dayOfWeek ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSubmit = async () => {
    if (!formName || !formEmail || !formPhone) {
      toast.error("Preencha todos os campos obrigatorios");
      return;
    }

    const invalidWorkingRange = formWorkingHours.some(
      (item) => item.isWorking && item.startTime >= item.endTime
    );
    if (invalidWorkingRange) {
      toast.error("Revise os horarios: o inicio deve ser menor que o fim.");
      return;
    }

    setIsSubmitting(true);
    try {
      const professionalData = {
        name: formName,
        email: formEmail,
        phone: formPhone,
        specialties: selectedSpecialties,
        commissionRate: parseInt(formCommission, 10),
        isActive: formIsActive,
        workingHours: formWorkingHours,
      };

      if (editingProfessional) {
        await updateProfessional(editingProfessional, professionalData);
      } else {
        await createProfessional(professionalData);
      }

      setIsNewProfessionalOpen(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteDialog = (id: string) => {
    setProfessionalToDelete(id);
  };

  const openProfilePage = (id: string) => {
    navigate(`/profissionais/${id}`);
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

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await updateProfessional(id, { isActive });
  };

  const handleResetPasswordConfirm = async () => {
    if (!professionalToReset) return;
    try {
      await resetProfessionalPassword(professionalToReset.id);
      setProfessionalToReset(null);
    } catch {
      // Erro tratado no hook
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="Profissionais" subtitle="Gerencie sua equipe">
        <div className="space-y-4">
          <ProfessionalLimitMeter limits={null} isLoading />
          <Skeleton className="h-12 w-full" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
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
          action={{ label: "Tentar novamente", onClick: refetch }}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Profissionais" subtitle="Gerencie sua equipe">
      <div className="space-y-4 sm:space-y-6">
        <ProfessionalLimitMeter
          limits={professionalLimits}
          isLoading={isLimitsLoading}
        />

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

          <Dialog
            open={isNewProfessionalOpen}
            onOpenChange={(open) => {
              setIsNewProfessionalOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Profissional
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md mx-4 sm:mx-auto max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProfessional ? "Editar Profissional" : "Novo Profissional"}
                </DialogTitle>
                <DialogDescription>
                  {editingProfessional
                    ? "Atualize os dados do profissional"
                    : "Adicione um novo membro a equipe"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome Completo *</Label>
                  <Input
                    placeholder="Nome do profissional"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>E-mail *</Label>
                    <Input
                      type="email"
                      placeholder="email@exemplo.com"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      disabled={!!editingProfessional}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone *</Label>
                    <Input
                      placeholder="(11) 99999-0000"
                      value={formPhone}
                      onChange={(e) => setFormPhone(maskPhoneBr(e.target.value))}
                      disabled={!!editingProfessional}
                    />
                  </div>
                </div>
                {editingProfessional ? (
                  <p className="text-xs text-muted-foreground">
                    E-mail e telefone nao podem ser alterados na edicao do profissional.
                  </p>
                ) : null}

                <div className="space-y-2">
                  <Label>Especialidades</Label>
                  <div className="rounded-lg border p-3 space-y-3 max-h-48 overflow-y-auto">
                    {isLoadingSpecialties && (
                      <p className="text-sm text-muted-foreground">Carregando especialidades...</p>
                    )}
                    {specialtiesError && (
                      <div className="space-y-2">
                        <p className="text-sm text-red-600">{specialtiesError}</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={refetchSpecialties}
                        >
                          Tentar novamente
                        </Button>
                      </div>
                    )}
                    {!isLoadingSpecialties && !specialtiesError && !specialties.length && (
                      <p className="text-sm text-muted-foreground">Nenhuma especialidade cadastrada.</p>
                    )}
                    {!isLoadingSpecialties &&
                      specialties.map((specialty) => (
                        <label
                          key={specialty.id}
                          className="flex items-center gap-2 text-sm cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedSpecialties.includes(specialty.name)}
                            onCheckedChange={() => toggleSpecialty(specialty.name)}
                          />
                          <span>{specialty.name}</span>
                        </label>
                      ))}
                  </div>
                  {selectedSpecialties.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedSpecialties.map((specialty) => (
                        <Badge key={specialty} variant="secondary" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Taxa de Comissao (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="40"
                    value={formCommission}
                    onChange={(e) => setFormCommission(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Horario de trabalho</Label>
                  <div className="rounded-lg border p-3 space-y-2">
                    {formWorkingHours
                      .slice()
                      .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                      .map((hour) => (
                        <div
                          key={hour.dayOfWeek}
                          className="grid grid-cols-[80px_1fr_1fr_auto] items-center gap-2"
                        >
                          <span className="text-xs text-muted-foreground">
                            {weekdayLabels[hour.dayOfWeek]}
                          </span>
                          <Input
                            type="time"
                            value={hour.startTime}
                            onChange={(event) =>
                              updateWorkingHour(hour.dayOfWeek, "startTime", event.target.value)
                            }
                            disabled={isWorkingHoursDisabled || !hour.isWorking}
                          />
                          <Input
                            type="time"
                            value={hour.endTime}
                            onChange={(event) =>
                              updateWorkingHour(hour.dayOfWeek, "endTime", event.target.value)
                            }
                            disabled={isWorkingHoursDisabled || !hour.isWorking}
                          />
                          <Switch
                            checked={hour.isWorking}
                            onCheckedChange={(checked) =>
                              updateWorkingHour(hour.dayOfWeek, "isWorking", checked)
                            }
                            disabled={isWorkingHoursDisabled}
                          />
                        </div>
                      ))}
                  </div>
                  {isWorkingHoursDisabled ? (
                    <p className="text-xs text-amber-700">
                      Horarios de trabalho nao informados pelo backend. Edicao desativada.
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                  <div>
                    <Label>Profissional Ativo</Label>
                    <p className="text-xs text-muted-foreground">Disponivel para agendamentos</p>
                  </div>
                  <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsNewProfessionalOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {editingProfessional ? "Salvando..." : "Adicionando..."}
                    </>
                  ) : editingProfessional ? (
                    "Salvar"
                  ) : (
                    "Adicionar"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {filteredProfessionals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum profissional encontrado</p>
              {searchTerm && (
                <Button variant="link" onClick={() => setSearchTerm("")}>
                  Limpar busca
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredProfessionals.map((professional) => (
              <ProfessionalCard
                key={professional.id}
                professional={professional}
                onOpenProfile={openProfilePage}
                onEdit={openEditDialog}
                onToggleActive={handleToggleActive}
                onDelete={openDeleteDialog}
                onResetPassword={(item) =>
                  setProfessionalToReset({
                    id: item.id,
                    name: item.name,
                    email: item.email,
                  })
                }
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
      </div>

      <ConfirmationDialog
        open={!!professionalToReset}
        title="Resetar senha do profissional?"
        description={
          professionalToReset ? (
            <>
              Uma senha temporaria sera gerada para <strong>{professionalToReset.name}</strong>{" "}
              ({professionalToReset.email}).
            </>
          ) : (
            "Uma senha temporaria sera gerada e enviada."
          )
        }
        cancelLabel="Cancelar"
        confirmLabel="Sim, resetar senha"
        onOpenChange={(open) => {
          if (!open) setProfessionalToReset(null);
        }}
        onConfirm={handleResetPasswordConfirm}
      />

      <DeleteConfirmationDialog
        open={!!professionalToDelete}
        isLoading={isDeletingProfessional}
        title="Remover profissional?"
        description="Tem certeza que deseja remover este profissional? Esta acao nao pode ser desfeita."
        onOpenChange={(open) => {
          if (isDeletingProfessional) return;
          if (!open) setProfessionalToDelete(null);
        }}
        onConfirm={handleDelete}
      />
    </MainLayout>
  );
}
