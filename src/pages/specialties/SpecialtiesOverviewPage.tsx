import { useMemo, useState } from "react";
import { Grid3X3, List, Pencil, Plus, Search, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useSpecialties } from "@/hooks/useSpecialties";

export default function SpecialtiesOverviewPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [isNewSpecialtyOpen, setIsNewSpecialtyOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [specialtyToDelete, setSpecialtyToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedSpecialtyIds, setSelectedSpecialtyIds] = useState<string[]>([]);
  const [isDeleteSelectedOpen, setIsDeleteSelectedOpen] = useState(false);
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
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
    deleteSelectedSpecialties,
    deleteAllSpecialties,
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

  const allFilteredSelected =
    filtered.length > 0 &&
    filtered.every((specialty) => selectedSpecialtyIds.includes(specialty.id));

  const resetCreateForm = () => {
    setName("");
    setDescription("");
  };

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
      resetCreateForm();
      setIsNewSpecialtyOpen(false);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting || !specialtyToDelete) return;
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

  const openEditDialog = (specialty: {
    id: string;
    name: string;
    description?: string | null;
  }) => {
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

  const toggleSpecialtySelection = (id: string) => {
    setSelectedSpecialtyIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllFiltered = (checked: boolean) => {
    if (checked) {
      setSelectedSpecialtyIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((specialty) => next.add(specialty.id));
        return Array.from(next);
      });
      return;
    }
    setSelectedSpecialtyIds((prev) =>
      prev.filter((id) => !filtered.some((specialty) => specialty.id === id))
    );
  };

  const handleDeleteSelected = async () => {
    if (!selectedSpecialtyIds.length) return;
    setIsDeletingSelected(true);
    try {
      await deleteSelectedSpecialties(selectedSpecialtyIds);
      setSelectedSpecialtyIds([]);
      setIsDeleteSelectedOpen(false);
    } finally {
      setIsDeletingSelected(false);
    }
  };

  const handleDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      await deleteAllSpecialties();
      setSelectedSpecialtyIds([]);
      setIsDeleteAllOpen(false);
    } finally {
      setIsDeletingAll(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar especialidade ou descricao..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex overflow-hidden rounded-lg border bg-background">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
                className="h-8 w-8 rounded-none sm:h-9 sm:w-9"
                aria-label="Visualizar especialidades em cards"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("table")}
                className="h-8 w-8 rounded-none sm:h-9 sm:w-9"
                aria-label="Visualizar especialidades em lista"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            <Dialog
              open={isNewSpecialtyOpen}
              onOpenChange={(open) => {
                setIsNewSpecialtyOpen(open);
                if (!open) resetCreateForm();
              }}
            >
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nova Especialidade
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Nova especialidade</DialogTitle>
                  <DialogDescription>
                    Preencha os dados da nova especialidade.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-4">
                  <Input
                    placeholder="Ex.: Corte, Coloracao, Escova..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <Textarea
                    placeholder="Descricao opcional da especialidade (usada para detalhamento e contexto do assistente)."
                    value={description}
                    maxLength={500}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsNewSpecialtyOpen(false);
                      resetCreateForm();
                    }}
                    disabled={isCreating}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleCreate} disabled={isCreating}>
                    {isCreating ? "Salvando..." : "Criar especialidade"}
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
            Selecionar todas da lista
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              disabled={!selectedSpecialtyIds.length}
              onClick={() => setIsDeleteSelectedOpen(true)}
            >
              Remover selecionadas ({selectedSpecialtyIds.length})
            </Button>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              disabled={!specialties.length}
              onClick={() => setIsDeleteAllOpen(true)}
            >
              Remover todas
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : null}

        {error ? (
          <Card>
            <CardContent className="space-y-3 py-6">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" onClick={refetch}>
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !error ? (
          filtered.length ? (
            viewMode === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((specialty) => (
                <Card key={specialty.id}>
                  <CardContent className="flex items-start justify-between gap-3 py-4">
                    <div className="flex min-w-0 items-start gap-2">
                      <Checkbox
                        checked={selectedSpecialtyIds.includes(specialty.id)}
                        onCheckedChange={() => toggleSpecialtySelection(specialty.id)}
                        aria-label="Selecionar especialidade"
                        className="mt-1"
                      />
                      <Tag className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{specialty.name}</p>
                        {specialty.description ? (
                          <p className="line-clamp-2 text-sm text-muted-foreground">
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
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() =>
                          setSpecialtyToDelete({ id: specialty.id, name: specialty.name })
                        }
                        aria-label="Remover especialidade"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
                            onCheckedChange={(checked) =>
                              toggleSelectAllFiltered(checked === true)
                            }
                            aria-label="Selecionar todas as especialidades filtradas"
                          />
                        </TableHead>
                        <TableHead>Especialidade</TableHead>
                        <TableHead className="hidden md:table-cell">Descricao</TableHead>
                        <TableHead className="w-24 text-right">Acoes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((specialty) => (
                        <TableRow key={specialty.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedSpecialtyIds.includes(specialty.id)}
                              onCheckedChange={() => toggleSpecialtySelection(specialty.id)}
                              aria-label={`Selecionar especialidade ${specialty.name}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex min-w-0 items-center gap-2">
                              <Tag className="h-4 w-4 flex-shrink-0 text-primary" />
                              <span className="truncate font-medium">{specialty.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden max-w-[420px] truncate text-sm text-muted-foreground md:table-cell">
                            {specialty.description || "Sem descricao"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
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
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() =>
                                  setSpecialtyToDelete({
                                    id: specialty.id,
                                    name: specialty.name,
                                  })
                                }
                                aria-label="Remover especialidade"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )
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

      <DeleteConfirmationDialog
        open={isDeleteSelectedOpen}
        isLoading={isDeletingSelected}
        title="Remover especialidades selecionadas?"
        description={`Tem certeza que deseja remover ${selectedSpecialtyIds.length} especialidade(s) selecionada(s)? Esta acao nao pode ser desfeita.`}
        onOpenChange={(open) => {
          if (isDeletingSelected) return;
          setIsDeleteSelectedOpen(open);
        }}
        onConfirm={handleDeleteSelected}
      />

      <DeleteConfirmationDialog
        open={isDeleteAllOpen}
        isLoading={isDeletingAll}
        title="Remover todas as especialidades?"
        description="Tem certeza que deseja remover todas as especialidades cadastradas? Esta acao nao pode ser desfeita."
        onOpenChange={(open) => {
          if (isDeletingAll) return;
          setIsDeleteAllOpen(open);
        }}
        onConfirm={handleDeleteAll}
      />

      <Dialog
        open={!!specialtyToEdit}
        onOpenChange={(open) => {
          if (isUpdating) return;
          if (!open) setSpecialtyToEdit(null);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
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
            <Button onClick={handleUpdate} isLoading={isUpdating} loadingText="Salvando...">
              Salvar alteracoes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
