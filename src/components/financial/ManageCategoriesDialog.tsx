import { useState } from 'react';
import { Check, Loader2, Pencil, Plus, Tag, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import type { CategoryWithCount } from '@/hooks/useTransactions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';

interface ManageCategoriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryWithCount[];
  isLoading: boolean;
  createCategory: (name: string) => Promise<{ id: string; name: string } | undefined>;
  updateCategory: (id: string, name: string) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<void>;
}

export function ManageCategoriesDialog({
  open,
  onOpenChange,
  categories,
  isLoading,
  createCategory,
  updateCategory,
  deleteCategory,
}: ManageCategoriesDialogProps) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const handleAdd = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    await createCategory(name);
    setNewCategoryName('');
  };

  const handleSaveEdit = async (id: string) => {
    const name = editingName.trim();
    if (!name) return;
    const ok = await updateCategory(id, name);
    if (ok) {
      setEditingId(null);
      setEditingName('');
    }
  };

  const handleDelete = async (category: CategoryWithCount) => {
    if (category.transactionCount > 0) {
      toast.error(`Existem ${category.transactionCount} lançamento(s) vinculados. Não é possível excluir.`);
      return;
    }
    setIsDeletingId(category.id);
    await deleteCategory(category.id);
    setIsDeletingId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mx-4 max-h-[80vh] max-w-md overflow-y-auto sm:mx-auto">
        <DialogHeader className="border-b border-border/70 pb-4 pr-10">
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Gerenciar Categorias
          </DialogTitle>
          <DialogDescription>
            Crie, renomeie ou exclua categorias de lançamentos.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <DialogSection>
            <p className="text-sm font-medium text-foreground">
              Padronize as categorias para deixar filtros, relatórios e conciliação mais confiáveis.
            </p>
          </DialogSection>

          <DialogSection className="bg-transparent">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Nova categoria</p>
              <p className="text-sm text-muted-foreground">Use nomes curtos e claros para evitar duplicidade semântica.</p>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Nova categoria..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void handleAdd();
                  }
                }}
              />
              <Button type="button" size="icon" onClick={() => void handleAdd()} disabled={!newCategoryName.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </DialogSection>

          <DialogSection className="bg-transparent">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Categorias existentes</p>
              <p className="text-sm text-muted-foreground">Renomeie ou remova apenas o que não comprometer o histórico financeiro.</p>
            </div>

            <div className="max-h-80 space-y-1.5 overflow-y-auto pr-1">
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : categories.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma categoria cadastrada</p>
              ) : (
                categories.map((category) => (
                  <div key={category.id} className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/10 p-3">
                    {editingId === category.id ? (
                      <>
                        <Input
                          className="h-8 flex-1 text-sm"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') void handleSaveEdit(category.id);
                            if (e.key === 'Escape') {
                              setEditingId(null);
                              setEditingName('');
                            }
                          }}
                          autoFocus
                        />
                        <Button type="button" variant="ghost" size="icon" className="text-success" aria-label={`Salvar categoria ${category.name}`} onClick={() => void handleSaveEdit(category.id)}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" aria-label={`Cancelar edicao da categoria ${category.name}`} onClick={() => { setEditingId(null); setEditingName(''); }}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm">{category.name}</span>
                        {category.transactionCount > 0 ? (
                          <Badge variant="secondary" className="px-1.5 py-0 text-xs">
                            {category.transactionCount}
                          </Badge>
                        ) : null}
                        <Button type="button" variant="ghost" size="icon" aria-label={`Editar categoria ${category.name}`} onClick={() => { setEditingId(category.id); setEditingName(category.name); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive/90"
                          aria-label={`Excluir categoria ${category.name}`}
                          disabled={isDeletingId === category.id}
                          onClick={() => void handleDelete(category)}
                        >
                          {isDeletingId === category.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </DialogSection>
        </DialogBody>

        <DialogStickyFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogStickyFooter>
      </DialogContent>
    </Dialog>
  );
}
