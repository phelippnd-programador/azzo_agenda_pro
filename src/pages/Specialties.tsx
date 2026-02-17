import { useMemo, useState } from "react";
import { Plus, Trash2, Tag } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSpecialties } from "@/hooks/useSpecialties";
import { toast } from "sonner";

export default function Specialties() {
  const [name, setName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [specialtyToDelete, setSpecialtyToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const {
    specialties,
    isLoading,
    error,
    refetch,
    createSpecialty,
    deleteSpecialty,
  } = useSpecialties();

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return specialties;
    return specialties.filter((item) => item.name.toLowerCase().includes(term));
  }, [specialties, searchTerm]);

  const handleCreate = async () => {
    const payload = name.trim();
    if (!payload) {
      toast.error("Informe o nome da especialidade");
      return;
    }

    setIsCreating(true);
    try {
      await createSpecialty(payload);
      setName("");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!specialtyToDelete) return;
    try {
      await deleteSpecialty(specialtyToDelete.id);
      setSpecialtyToDelete(null);
    } catch {
      // Erro tratado no hook
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
            <Input
              placeholder="Buscar especialidade..."
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
              <p className="text-sm text-red-600">{error}</p>
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
                  <CardContent className="py-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Tag className="w-4 h-4 text-violet-600 flex-shrink-0" />
                      <p className="font-medium truncate">{specialty.name}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() =>
                        setSpecialtyToDelete({ id: specialty.id, name: specialty.name })
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-gray-500">
                Nenhuma especialidade encontrada.
              </CardContent>
            </Card>
          )
        ) : null}
      </div>

      <AlertDialog
        open={!!specialtyToDelete}
        onOpenChange={(open) => {
          if (!open) setSpecialtyToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover especialidade?</AlertDialogTitle>
            <AlertDialogDescription>
              {specialtyToDelete ? (
                <>A especialidade "{specialtyToDelete.name}" sera removida permanentemente.</>
              ) : (
                "Esta acao nao pode ser desfeita."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
