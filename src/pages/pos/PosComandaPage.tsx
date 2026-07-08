import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Copy, Percent, Plus, Trash2, Wallet } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { posApi, type Comanda, type ComandaMeioPagamento } from '@/lib/api/pos';
import { servicesApi, professionalsApi, type Service, type Professional } from '@/lib/api';
import { stockApi } from '@/lib/api/stock';
import type { StockItem } from '@/types/stock';
import { resolveUiError } from '@/lib/error-utils';
import { formatCurrency } from '@/lib/format';

const MEIOS: { value: ComandaMeioPagamento; label: string }[] = [
  { value: 'DINHEIRO', label: 'Dinheiro' },
  { value: 'PIX_ASAAS', label: 'PIX (Asaas do salao)' },
  { value: 'CARTAO_CREDITO_EXTERNO', label: 'Cartao de credito (maquininha)' },
  { value: 'CARTAO_DEBITO_EXTERNO', label: 'Cartao de debito (maquininha)' },
];

function unwrapList<T>(data: T[] | { items: T[] }): T[] {
  return Array.isArray(data) ? data : data.items ?? [];
}

/** F01 — detalhe/operacao da comanda. */
export default function PosComandaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOwner = user?.role === 'OWNER';

  const [comanda, setComanda] = useState<Comanda | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [troco, setTroco] = useState<number | null>(null);

  // dialogs
  const [itemOpen, setItemOpen] = useState(false);
  const [descontoOpen, setDescontoOpen] = useState(false);
  const [gorjetaOpen, setGorjetaOpen] = useState(false);
  const [pagamentoOpen, setPagamentoOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // form: item
  const [itemTipo, setItemTipo] = useState<'SERVICO' | 'PRODUTO'>('SERVICO');
  const [itemRef, setItemRef] = useState('');
  const [itemQtd, setItemQtd] = useState('1');
  const [itemPreco, setItemPreco] = useState('');
  const [itemProfissional, setItemProfissional] = useState('');
  // form: desconto
  const [descontoPercent, setDescontoPercent] = useState('');
  const [descontoMotivo, setDescontoMotivo] = useState('');
  // form: gorjeta
  const [gorjetaValor, setGorjetaValor] = useState('');
  const [gorjetaProfissional, setGorjetaProfissional] = useState('');
  // form: pagamento
  const [pagMeio, setPagMeio] = useState<ComandaMeioPagamento>('DINHEIRO');
  const [pagValor, setPagValor] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setComanda(await posApi.detalhe(id));
    } catch (error) {
      toast.error(resolveUiError(error, 'Comanda nao encontrada.').message);
      navigate('/pos');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    load();
    servicesApi.getAll().then((d) => setServices(unwrapList(d))).catch(() => {});
    professionalsApi.getAll().then((d) => setProfessionals(unwrapList(d))).catch(() => {});
    stockApi.getItems({ ativo: true }).then((d) => setStockItems(unwrapList(d))).catch(() => {});
  }, [load]);

  const faltando = useMemo(() => {
    if (!comanda) return 0;
    return Math.max(0, comanda.total + comanda.gorjeta - comanda.totalPago);
  }, [comanda]);

  const aberta = comanda?.status === 'ABERTA';

  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    setBusy(true);
    try {
      await fn();
      await load();
      if (ok) toast.success(ok);
      return true;
    } catch (error) {
      toast.error(resolveUiError(error, 'Operacao nao concluida.').message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const adicionarItem = async () => {
    if (!id || !itemRef) return;
    const okRun = await run(() =>
      posApi.adicionarItem(id, {
        tipo: itemTipo,
        referenciaId: itemRef,
        quantidade: Number(itemQtd) || 1,
        precoUnitario: itemPreco.trim() ? Number(itemPreco.replace(',', '.')) : undefined,
        professionalId: itemProfissional || undefined,
      })
    );
    if (okRun) {
      setItemOpen(false);
      setItemRef('');
      setItemQtd('1');
      setItemPreco('');
    }
  };

  const aplicarDesconto = async () => {
    if (!id) return;
    const okRun = await run(() =>
      posApi.aplicarDesconto(id, {
        descontoPercent: Number(descontoPercent) || 0,
        motivo: descontoMotivo,
      })
    );
    if (okRun) setDescontoOpen(false);
  };

  const definirGorjeta = async () => {
    if (!id) return;
    const okRun = await run(() =>
      posApi.definirGorjeta(id, {
        gorjeta: Number(gorjetaValor.replace(',', '.')) || 0,
        professionalId: gorjetaProfissional || undefined,
      })
    );
    if (okRun) setGorjetaOpen(false);
  };

  const registrarPagamento = async () => {
    if (!id) return;
    const okRun = await run(
      () => posApi.registrarPagamento(id, { meio: pagMeio, valor: Number(pagValor.replace(',', '.')) }),
      pagMeio === 'PIX_ASAAS' ? 'Cobranca PIX gerada — aguarde a confirmacao.' : 'Pagamento registrado.'
    );
    if (okRun) {
      setPagamentoOpen(false);
      setPagValor('');
    }
  };

  const fechar = async () => {
    if (!id) return;
    setBusy(true);
    try {
      const fechada = await posApi.fechar(id);
      setComanda(fechada);
      setTroco(fechada.troco);
      toast.success(
        fechada.troco > 0
          ? `Comanda fechada! Troco: ${formatCurrency(fechada.troco)}`
          : 'Comanda fechada com sucesso!'
      );
    } catch (error) {
      toast.error(resolveUiError(error, 'Nao foi possivel fechar a comanda.').message);
    } finally {
      setBusy(false);
    }
  };

  const cancelar = async () => {
    if (!id) return;
    const motivo = window.prompt('Motivo do cancelamento:');
    if (!motivo) return;
    const okRun = await run(() => posApi.cancelar(id, motivo), 'Comanda cancelada.');
    if (okRun) navigate('/pos');
  };

  const copiarPix = (payload: string) => {
    navigator.clipboard.writeText(payload);
    toast.success('Codigo PIX copiado.');
  };

  if (isLoading || !comanda) {
    return (
      <MainLayout title="Comanda" subtitle="Carregando...">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Comanda" subtitle={comanda.appointmentId ? 'Atendimento' : 'Avulsa'}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/pos')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Badge variant={aberta ? 'default' : 'outline'}>{comanda.status}</Badge>
        </div>

        {troco !== null && troco > 0 && (
          <Card className="border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30">
            <CardContent className="py-4 text-center">
              <p className="text-sm text-muted-foreground">Troco do cliente</p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {formatCurrency(troco)}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Itens */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Itens</CardTitle>
              {aberta && (
                <Dialog open={itemOpen} onOpenChange={setItemOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="mr-1 h-4 w-4" />
                      Adicionar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar item</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label>Tipo</Label>
                        <Select value={itemTipo} onValueChange={(v) => { setItemTipo(v as 'SERVICO' | 'PRODUTO'); setItemRef(''); }}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SERVICO">Servico</SelectItem>
                            <SelectItem value="PRODUTO">Produto (estoque)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>{itemTipo === 'SERVICO' ? 'Servico' : 'Produto'}</Label>
                        <Select value={itemRef} onValueChange={setItemRef}>
                          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>
                            {itemTipo === 'SERVICO'
                              ? services.map((s) => (
                                  <SelectItem key={s.id} value={s.id}>
                                    {s.name} — {formatCurrency(s.price)}
                                  </SelectItem>
                                ))
                              : stockItems.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.nome} (saldo: {p.saldoAtual})
                                  </SelectItem>
                                ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Quantidade</Label>
                          <Input type="number" min={1} value={itemQtd} onChange={(e) => setItemQtd(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>{itemTipo === 'PRODUTO' ? 'Preco de venda (R$)*' : 'Preco (R$, opcional)'}</Label>
                          <Input inputMode="decimal" value={itemPreco} onChange={(e) => setItemPreco(e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Profissional (comissao)</Label>
                        <Select value={itemProfissional || 'none'} onValueChange={(v) => setItemProfissional(v === 'none' ? '' : v)}>
                          <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nenhum</SelectItem>
                            {professionals.map((p) => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={adicionarItem} disabled={busy || !itemRef}>Adicionar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {comanda.itens.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum item na comanda.</p>
              ) : (
                <div className="space-y-2">
                  {comanda.itens.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                      <div>
                        <p className="font-medium">
                          {item.descricao}
                          <Badge variant="outline" className="ml-2 text-[10px]">{item.tipo}</Badge>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantidade}x {formatCurrency(item.precoUnitario)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{formatCurrency(item.total)}</span>
                        {aberta && (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Remover item"
                            onClick={() => run(() => posApi.removerItem(comanda.id, item.id))}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resumo + pagamentos */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Resumo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(comanda.subtotal)}</span></div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Desconto{comanda.descontoMotivo ? ` (${comanda.descontoMotivo})` : ''}</span>
                  <span className="text-destructive">-{formatCurrency(comanda.desconto)}</span>
                </div>
                <div className="flex justify-between border-t pt-1 font-semibold"><span>Total</span><span>{formatCurrency(comanda.total)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Gorjeta</span><span>{formatCurrency(comanda.gorjeta)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Pago</span><span>{formatCurrency(comanda.totalPago)}</span></div>
                <div className="flex justify-between font-semibold text-primary"><span>Faltando</span><span>{formatCurrency(faltando)}</span></div>
                {aberta && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Dialog open={descontoOpen} onOpenChange={setDescontoOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline"><Percent className="mr-1 h-3 w-3" />Desconto</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Aplicar desconto</DialogTitle></DialogHeader>
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <Label>Percentual (%)</Label>
                            <Input type="number" min={0} max={100} value={descontoPercent} onChange={(e) => setDescontoPercent(e.target.value)} />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Motivo*</Label>
                            <Input value={descontoMotivo} onChange={(e) => setDescontoMotivo(e.target.value)} />
                          </div>
                        </div>
                        <DialogFooter><Button onClick={aplicarDesconto} disabled={busy}>Aplicar</Button></DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Dialog open={gorjetaOpen} onOpenChange={setGorjetaOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">Gorjeta</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Gorjeta do profissional</DialogTitle></DialogHeader>
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <Label>Valor (R$)</Label>
                            <Input inputMode="decimal" value={gorjetaValor} onChange={(e) => setGorjetaValor(e.target.value)} />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Profissional*</Label>
                            <Select value={gorjetaProfissional} onValueChange={setGorjetaProfissional}>
                              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                              <SelectContent>
                                {professionals.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter><Button onClick={definirGorjeta} disabled={busy}>Salvar</Button></DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">Pagamentos</CardTitle>
                {aberta && (
                  <Dialog open={pagamentoOpen} onOpenChange={setPagamentoOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline"><Wallet className="mr-1 h-3 w-3" />Receber</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Registrar pagamento</DialogTitle></DialogHeader>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label>Meio</Label>
                          <Select value={pagMeio} onValueChange={(v) => setPagMeio(v as ComandaMeioPagamento)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {MEIOS.map((m) => (
                                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Valor (R$)</Label>
                          <Input
                            inputMode="decimal"
                            placeholder={faltando > 0 ? String(faltando.toFixed(2)) : ''}
                            value={pagValor}
                            onChange={(e) => setPagValor(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={registrarPagamento} disabled={busy || !pagValor.trim()}>Registrar</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {comanda.pagamentos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum pagamento registrado.</p>
                ) : (
                  comanda.pagamentos.map((p) => (
                    <div key={p.id} className="rounded-md border p-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>{MEIOS.find((m) => m.value === p.meio)?.label ?? p.meio}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{formatCurrency(p.valor)}</span>
                          <Badge variant={p.status === 'CONFIRMADO' ? 'default' : 'outline'} className="text-[10px]">
                            {p.status}
                          </Badge>
                        </div>
                      </div>
                      {p.status === 'PENDENTE' && p.pixPayload && (
                        <div className="mt-2 flex items-center gap-2">
                          <code className="max-h-14 flex-1 overflow-y-auto break-all rounded border bg-muted/30 p-1 text-[10px]">
                            {p.pixPayload}
                          </code>
                          <Button size="icon" variant="outline" aria-label="Copiar PIX" onClick={() => copiarPix(p.pixPayload!)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {aberta && (
              <div className="flex flex-col gap-2">
                <Button onClick={fechar} disabled={busy || faltando > 0}>
                  {faltando > 0 ? `Faltam ${formatCurrency(faltando)}` : 'Fechar comanda'}
                </Button>
                {isOwner && (
                  <Button variant="outline" className="text-destructive" onClick={cancelar} disabled={busy}>
                    Cancelar comanda
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
