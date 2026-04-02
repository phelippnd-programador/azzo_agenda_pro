import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check, Loader2, Pencil, Plus, Tag, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import type { CategoryWithCount } from '@/hooks/useTransactions';

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
    if (ok) { setEditingId(null); setEditingName(''); }
  };

  const handleDelete = async (cat: CategoryWithCount) => {
    if (cat.transactionCount > 0) {
      toast.error(`Existem ${cat.transactionCount} lançamento(s) vinculados. Não é possível excluir.`);
      return;
    }
    setIsDeletingId(cat.id);
    await deleteCategory(cat.id);
    setIsDeletingId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-4 sm:mx-auto max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-4 h-4" /> Gerenciar Categorias
          </DialogTitle>
          <DialogDescription>Crie, renomeie ou exclua categorias de lançamentos.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex gap-2">
            <Input
              placeholder="Nova categoria..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
            />
            <Button type="button" size="sm" onClick={handleAdd} disabled={!newCategoryName.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
            {isLoading ? (
              <div className="py-4 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : categories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma categoria cadastrada</p>
            ) : (
              categories.map((cat) => (
                <div key={cat.id} className="flex items-center gap-2 p-2 rounded-lg border bg-muted/20 hover:bg-muted/40">
                  {editingId === cat.id ? (
                    <>
                      <Input
                        className="h-7 text-sm flex-1"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(cat.id);
                          if (e.key === 'Escape') { setEditingId(null); setEditingName(''); }
                        }}
                        autoFocus
                      />
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={() => handleSaveEdit(cat.id)}>
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingId(null); setEditingName(''); }}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm">{cat.name}</span>
                      {cat.transactionCount > 0 && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{cat.transactionCount}</Badge>
                      )}
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingId(cat.id); setEditingName(cat.name); }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-600"
                        disabled={isDeletingId === cat.id}
                        onClick={() => handleDelete(cat)}
                      >
                        {isDeletingId === cat.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </Button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
