import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2, Tag } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import { useSpecialties } from "@/hooks/useSpecialties";
import { toast } from "sonner";

export default function Specialties() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [specialtyToDelete, setSpecialtyToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [specialtyToEdit, setSpecialtyToEdit] = useState<{
    id: string;
    name: string;
    description?: string | null;
  } | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    specialties,
    isLoading,
    error,
    refetch,
    createSpecialty,
    updateSpecialty,
    deleteSpecialty,
  } = useSpecialties();

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return specialties;
    return specialties.filter((item) => {
      const nameMatches = item.name.toLowerCase().includes(term);
      const descriptionMatches = (item.description || "").toLowerCase().includes(term);
      return nameMatches || descriptionMatches;
    });
  }, [specialties, searchTerm]);

  const handleCreate = async () => {
    const payload = name.trim();
    if (!payload) {
      toast.error("Informe o nome da especialidade");
      return;
    }

    setIsCreating(true);
    try {
      await createSpecialty({
        name: payload,
        description,
      });
      setName("");
      setDescription("");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    if (!specialtyToDelete) return;
    setIsDeleting(true);
    try {
      await deleteSpecialty(specialtyToDelete.id);
      setSpecialtyToDelete(null);
    } catch {
      // Erro tratado no hook
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditDialog = (specialty: { id: string; name: string; description?: string | null }) => {
    setSpecialtyToEdit(specialty);
    setEditName(specialty.name);
    setEditDescription(specialty.description || "");
  };

  const handleUpdate = async () => {
    if (!specialtyToEdit || isUpdating) return;
    const payload = editName.trim();
    if (!payload) {
      toast.error("Informe o nome da especialidade");
      return;
    }

    setIsUpdating(true);
    try {
      await updateSpecialty(specialtyToEdit.id, {
        name: payload,
        description: editDescription,
      });
      setSpecialtyToEdit(null);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <MainLayout
      title="Especialidades"
      subtitle="Crie e remova as especialidades usadas no cadastro de profissionais."
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Nova especialidade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Ex.: Corte, Coloracao, Escova..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Button onClick={handleCreate} disabled={isCreating} className="gap-2">
                <Plus className="w-4 h-4" />
                {isCreating ? "Salvando..." : "Criar"}
              </Button>
            </div>
            <Textarea
              placeholder="Descricao opcional da especialidade (usada para detalhamento e contexto do assistente)."
              value={description}
              maxLength={500}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Input
              placeholder="Buscar especialidade ou descricao..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : null}

        {error ? (
          <Card>
            <CardContent className="py-6 space-y-3">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" onClick={refetch}>
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !error ? (
          filtered.length ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((specialty) => (
                <Card key={specialty.id}>
                  <CardContent className="py-4 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 min-w-0">
                      <Tag className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{specialty.name}</p>
                        {specialty.description ? (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {specialty.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          openEditDialog({
                            id: specialty.id,
                            name: specialty.name,
                            description: specialty.description,
                          })
                        }
                        aria-label="Editar especialidade"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() =>
                          setSpecialtyToDelete({ id: specialty.id, name: specialty.name })
                        }
                        aria-label="Remover especialidade"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Nenhuma especialidade encontrada.
              </CardContent>
            </Card>
          )
        ) : null}
      </div>

      <DeleteConfirmationDialog
        open={!!specialtyToDelete}
        isLoading={isDeleting}
        title="Remover especialidade?"
        description={
          specialtyToDelete
            ? `A especialidade "${specialtyToDelete.name}" sera removida permanentemente.`
            : "Esta acao nao pode ser desfeita."
        }
        cancelLabel="Cancelar"
        confirmLabel="Remover"
        loadingLabel="Removendo..."
        onOpenChange={(open) => {
          if (isDeleting) return;
          if (!open) setSpecialtyToDelete(null);
        }}
        onConfirm={handleDelete}
      />

      <Dialog
        open={!!specialtyToEdit}
        onOpenChange={(open) => {
          if (isUpdating) return;
          if (!open) setSpecialtyToEdit(null);
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar especialidade</DialogTitle>
            <DialogDescription>Atualize nome e descricao da especialidade.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Nome da especialidade"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <Textarea
              placeholder="Descricao opcional"
              value={editDescription}
              maxLength={500}
              onChange={(e) => setEditDescription(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSpecialtyToEdit(null)}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdate}
              isLoading={isUpdating}
              loadingText="Salvando..."
            >
              Salvar alteracoes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
