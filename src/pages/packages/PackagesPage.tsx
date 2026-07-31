import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageEmptyState, PageListLoadingState } from '@/components/ui/page-states';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { packagesApi, type ServicePackage, type PackageItem } from '@/lib/api/packages';
import { servicesApi, type Service } from '@/lib/api';
import { resolveUiError } from '@/lib/error-utils';
import { formatCurrency } from '@/lib/format';

function unwrapList<T>(data: T[] | { items: T[] }): T[] {
  return Array.isArray(data) ? data : data.items ?? [];
}

const EMPTY_FORM = { nome: '', descricao: '', preco: 0, validadeDias: '90', ativo: true };

/** F04 — catalogo de pacotes de servicos (venda antecipada de sessoes). */
export default function PackagesPage() {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ServicePackage | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [itens, setItens] = useState<PackageItem[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setPackages(await packagesApi.listar());
    } catch (error) {
      toast.error(resolveUiError(error, 'Nao foi possivel carregar os pacotes.').message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    servicesApi.getAll().then((d) => setServices(unwrapList(d))).catch(() => {});
  }, [load]);

  const abrirNovo = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setItens([]);
    setDialogOpen(true);
  };

  const abrirEdicao = (pacote: ServicePackage) => {
    setEditing(pacote);
    setForm({
      nome: pacote.nome,
      descricao: pacote.descricao || '',
      preco: pacote.preco,
      validadeDias: String(pacote.validadeDias),
      ativo: pacote.ativo,
    });
    setItens(pacote.itens);
    setDialogOpen(true);
  };

  const adicionarItem = () => {
    if (services.length === 0) return;
    const disponivel = services.find((s) => !itens.some((i) => i.serviceId === s.id));
    if (!disponivel) return;
    setItens((prev) => [...prev, { serviceId: disponivel.id, sessoes: 1 }]);
  };

  const salvar = async () => {
    if (!form.nome.trim() || !(form.preco > 0) || !form.validadeDias || itens.length === 0) {
      toast.error('Preencha nome, preco, validade e ao menos um servico.');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        descricao: form.descricao.trim() || undefined,
        preco: form.preco,
        validadeDias: Number(form.validadeDias),
        ativo: form.ativo,
        itens,
      };
      if (editing) {
        await packagesApi.atualizar(editing.id, payload);
        toast.success('Pacote atualizado.');
      } else {
        await packagesApi.criar(payload);
        toast.success('Pacote criado.');
      }
      setDialogOpen(false);
      await load();
    } catch (error) {
      toast.error(resolveUiError(error, 'Nao foi possivel salvar o pacote.').message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <MainLayout title="Pacotes de servicos" subtitle="Venda antecipada de sessoes com validade">
      <div className="space-y-4">
        <div className="flex justify-end">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={abrirNovo}>
                <Plus className="mr-2 h-4 w-4" />
                Novo pacote
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? 'Editar pacote' : 'Novo pacote'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Nome*</Label>
                  <Input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Descricao</Label>
                  <Textarea value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Preco (R$)*</Label>
                    <CurrencyInput value={form.preco} onChange={(value) => setForm((f) => ({ ...f, preco: value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Validade (dias)*</Label>
                    <Input type="number" min={1} value={form.validadeDias} onChange={(e) => setForm((f) => ({ ...f, validadeDias: e.target.value }))} />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <Label htmlFor="pacote-ativo">Ativo</Label>
                  <Switch id="pacote-ativo" checked={form.ativo} onCheckedChange={(v) => setForm((f) => ({ ...f, ativo: v }))} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Servicos do pacote*</Label>
                    <Button type="button" size="sm" variant="outline" onClick={adicionarItem}>
                      <Plus className="mr-1 h-3 w-3" />
                      Adicionar servico
                    </Button>
                  </div>
                  {itens.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Select
                        value={item.serviceId}
                        onValueChange={(v) =>
                          setItens((prev) => prev.map((it, i) => (i === idx ? { ...it, serviceId: v } : it)))
                        }
                      >
                        <SelectTrigger className="flex-1"><SelectValue placeholder="Servico..." /></SelectTrigger>
                        <SelectContent>
                          {services.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min={1}
                        className="w-24"
                        value={item.sessoes}
                        onChange={(e) =>
                          setItens((prev) =>
                            prev.map((it, i) => (i === idx ? { ...it, sessoes: Number(e.target.value) || 1 } : it))
                          )
                        }
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label="Remover servico do pacote"
                        onClick={() => setItens((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {itens.length === 0 && (
                    <p className="text-xs text-muted-foreground">Nenhum servico adicionado ainda.</p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button onClick={salvar} isLoading={busy} loadingText="Salvando...">
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <PageListLoadingState metricCount={0} itemCount={6} itemHeightClassName="h-36" />
        ) : packages.length === 0 ? (
          <PageEmptyState
            title="Nenhum pacote cadastrado"
            description="Crie pacotes para vender sessões antecipadas com validade e serviços definidos."
            action={{ label: "Novo pacote", onClick: abrirNovo }}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((pacote) => (
              <Card key={pacote.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => abrirEdicao(pacote)}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate">{pacote.nome}</span>
                    <div className="flex flex-shrink-0 items-center gap-1">
                      <Badge variant={pacote.ativo ? 'default' : 'outline'}>{pacote.ativo ? 'Ativo' : 'Inativo'}</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Editar pacote ${pacote.nome}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          abrirEdicao(pacote);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Preco</span>
                    <span className="font-semibold">{formatCurrency(pacote.preco)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Validade</span>
                    <span>{pacote.validadeDias} dias</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Servicos</span>
                    <span>{pacote.itens.length}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
