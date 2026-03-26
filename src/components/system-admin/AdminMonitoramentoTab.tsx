import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye } from 'lucide-react';
import { systemAdminApi } from '@/lib/api';
import { toast } from 'sonner';
import type {
  AdminTenantItem,
  GlobalAuditDetail,
  GlobalAuditItem,
  GlobalSuggestionItem,
} from '@/types/system-admin';

const AUDIT_MODULE_OPTIONS = ['', 'AUTH', 'RBAC', 'FINANCE', 'FISCAL', 'SYSTEM'];
const AUDIT_STATUS_OPTIONS = ['', 'SUCCESS', 'ERROR', 'DENIED'];
const AUDIT_CHANNEL_OPTIONS = ['', 'API', 'WEBHOOK', 'SCHEDULER', 'SYSTEM'];
const SUGGESTION_CATEGORY_OPTIONS = ['', 'BUG', 'MELHORIA', 'FUNCIONALIDADE', 'USABILIDADE', 'OUTRO'];

const DEFAULT_AUDIT_FILTERS = {
  tenantId: '', module: '', action: '', status: '', sourceChannel: '',
  entityType: '', actorUserId: '', requestId: '', text: '', from: '', to: '', limit: 50,
};
const DEFAULT_SUGGESTION_FILTERS = { tenantId: '', status: '', category: '', text: '', limit: 50 };

interface AdminMonitoramentoTabProps {
  activeTenants: AdminTenantItem[];
}

export function AdminMonitoramentoTab({ activeTenants }: AdminMonitoramentoTabProps) {
  const [globalAudits, setGlobalAudits] = useState<GlobalAuditItem[]>([]);
  const [isLoadingAudits, setIsLoadingAudits] = useState(false);
  const [auditFilters, setAuditFilters] = useState(DEFAULT_AUDIT_FILTERS);
  const [isAuditDetailOpen, setIsAuditDetailOpen] = useState(false);
  const [auditDetail, setAuditDetail] = useState<GlobalAuditDetail | null>(null);
  const [isLoadingAuditDetail, setIsLoadingAuditDetail] = useState(false);

  const [globalSuggestions, setGlobalSuggestions] = useState<GlobalSuggestionItem[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestionFilters, setSuggestionFilters] = useState(DEFAULT_SUGGESTION_FILTERS);
  const [isSuggestionDetailOpen, setIsSuggestionDetailOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<GlobalSuggestionItem | null>(null);
  const [isLoadingSuggestionDetail, setIsLoadingSuggestionDetail] = useState(false);
  const [isSavingSuggestion, setIsSavingSuggestion] = useState(false);
  const [suggestionAdminResponse, setSuggestionAdminResponse] = useState('');

  const loadGlobalAudits = async (filters?: Partial<typeof auditFilters>) => {
    const payload = { ...auditFilters, ...(filters || {}) };
    setIsLoadingAudits(true);
    try {
      const response = await systemAdminApi.getGlobalAudits({
        tenantId: payload.tenantId || undefined,
        module: payload.module || undefined,
        action: payload.action || undefined,
        status: payload.status || undefined,
        sourceChannel: payload.sourceChannel || undefined,
        entityType: payload.entityType || undefined,
        actorUserId: payload.actorUserId || undefined,
        requestId: payload.requestId || undefined,
        text: payload.text?.trim() || undefined,
        from: payload.from ? new Date(payload.from).toISOString() : undefined,
        to: payload.to ? new Date(payload.to).toISOString() : undefined,
        limit: payload.limit,
      });
      setGlobalAudits(response.items || []);
    } catch {
      toast.error('Nao foi possivel carregar auditoria global.');
      setGlobalAudits([]);
    } finally {
      setIsLoadingAudits(false);
    }
  };

  const loadGlobalSuggestions = async (filters?: Partial<typeof suggestionFilters>) => {
    const payload = { ...suggestionFilters, ...(filters || {}) };
    setIsLoadingSuggestions(true);
    try {
      const response = await systemAdminApi.getGlobalSuggestions({
        tenantId: payload.tenantId || undefined,
        status: payload.status || undefined,
        category: payload.category || undefined,
        text: payload.text?.trim() || undefined,
        limit: payload.limit,
      });
      setGlobalSuggestions(response.items || []);
    } catch {
      toast.error('Nao foi possivel carregar sugestoes.');
      setGlobalSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    loadGlobalAudits({});
    loadGlobalSuggestions({});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openAuditDetail = async (id: string) => {
    setIsLoadingAuditDetail(true);
    setIsAuditDetailOpen(true);
    try {
      const detail = await systemAdminApi.getGlobalAuditDetail(id);
      setAuditDetail(detail);
    } catch {
      toast.error('Nao foi possivel carregar detalhe da auditoria.');
      setAuditDetail(null);
    } finally {
      setIsLoadingAuditDetail(false);
    }
  };

  const openSuggestionDetail = async (id: string) => {
    setIsSuggestionDetailOpen(true);
    setIsLoadingSuggestionDetail(true);
    try {
      const detail = await systemAdminApi.getGlobalSuggestionDetail(id);
      setSelectedSuggestion(detail);
      setSuggestionAdminResponse(detail.adminResponse || '');
    } catch {
      toast.error('Nao foi possivel carregar detalhe da sugestao.');
      setSelectedSuggestion(null);
      setSuggestionAdminResponse('');
    } finally {
      setIsLoadingSuggestionDetail(false);
    }
  };

  const saveSuggestionResponse = async (closeSuggestion: boolean) => {
    if (!selectedSuggestion?.id) return;
    if (!suggestionAdminResponse.trim()) {
      toast.error('Informe a resposta administrativa.');
      return;
    }
    setIsSavingSuggestion(true);
    try {
      const updated = await systemAdminApi.updateGlobalSuggestion(selectedSuggestion.id, {
        adminResponse: suggestionAdminResponse.trim(),
        status: closeSuggestion ? 'CLOSED' : selectedSuggestion.status || 'OPEN',
      });
      setSelectedSuggestion(updated);
      setSuggestionAdminResponse(updated.adminResponse || '');
      toast.success(closeSuggestion ? 'Sugestao respondida e fechada.' : 'Resposta salva com sucesso.');
      await loadGlobalSuggestions({});
    } catch {
      toast.error('Falha ao salvar resposta da sugestao.');
    } finally {
      setIsSavingSuggestion(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Auditoria Completa</CardTitle>
            <CardDescription>Eventos globais de todos os tenants, incluindo modulo SYSTEM.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-4">
              <Select
                value={auditFilters.tenantId || 'ALL'}
                onValueChange={(v) => setAuditFilters((prev) => ({ ...prev, tenantId: v === 'ALL' ? '' : v }))}
              >
                <SelectTrigger><SelectValue placeholder="Tenant (todos)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tenant: Todos</SelectItem>
                  {activeTenants.map((t) => (
                    <SelectItem key={t.tenantId} value={t.tenantId}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={auditFilters.module || 'ALL'}
                onValueChange={(v) => setAuditFilters((prev) => ({ ...prev, module: v === 'ALL' ? '' : v }))}
              >
                <SelectTrigger><SelectValue placeholder="Modulo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Modulo: Todos</SelectItem>
                  {AUDIT_MODULE_OPTIONS.filter(Boolean).map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={auditFilters.status || 'ALL'}
                onValueChange={(v) => setAuditFilters((prev) => ({ ...prev, status: v === 'ALL' ? '' : v }))}
              >
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Status: Todos</SelectItem>
                  {AUDIT_STATUS_OPTIONS.filter(Boolean).map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={auditFilters.sourceChannel || 'ALL'}
                onValueChange={(v) => setAuditFilters((prev) => ({ ...prev, sourceChannel: v === 'ALL' ? '' : v }))}
              >
                <SelectTrigger><SelectValue placeholder="Canal" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Canal: Todos</SelectItem>
                  {AUDIT_CHANNEL_OPTIONS.filter(Boolean).map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="Acao exata"
                value={auditFilters.action}
                onChange={(e) => setAuditFilters((prev) => ({ ...prev, action: e.target.value }))}
              />
              <Input
                placeholder="Entity type"
                value={auditFilters.entityType}
                onChange={(e) => setAuditFilters((prev) => ({ ...prev, entityType: e.target.value }))}
              />
              <Input
                placeholder="Actor user id"
                value={auditFilters.actorUserId}
                onChange={(e) => setAuditFilters((prev) => ({ ...prev, actorUserId: e.target.value }))}
              />
              <Input
                placeholder="Request ID"
                value={auditFilters.requestId}
                onChange={(e) => setAuditFilters((prev) => ({ ...prev, requestId: e.target.value }))}
              />
              <Input
                type="datetime-local"
                value={auditFilters.from}
                onChange={(e) => setAuditFilters((prev) => ({ ...prev, from: e.target.value }))}
              />
              <Input
                type="datetime-local"
                value={auditFilters.to}
                onChange={(e) => setAuditFilters((prev) => ({ ...prev, to: e.target.value }))}
              />
              <Input
                placeholder="Buscar por acao, modulo, request id, tenant..."
                value={auditFilters.text}
                onChange={(e) => setAuditFilters((prev) => ({ ...prev, text: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => loadGlobalAudits({})} disabled={isLoadingAudits}>
                Aplicar filtros
              </Button>
              <Button
                variant="ghost"
                onClick={() => { setAuditFilters(DEFAULT_AUDIT_FILTERS); loadGlobalAudits(DEFAULT_AUDIT_FILTERS); }}
                disabled={isLoadingAudits}
              >
                Limpar
              </Button>
            </div>

            <div className="rounded-md border">
              <div className="max-h-[360px] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left">Data</th>
                      <th className="px-3 py-2 text-left">Tenant</th>
                      <th className="px-3 py-2 text-left">Modulo</th>
                      <th className="px-3 py-2 text-left">Acao</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Request ID</th>
                      <th className="px-3 py-2 text-left">Detalhe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {globalAudits.map((event) => (
                      <tr key={event.id} className="border-t">
                        <td className="px-3 py-2 whitespace-nowrap">
                          {event.createdAt ? new Date(event.createdAt).toLocaleString('pt-BR') : '-'}
                        </td>
                        <td className="px-3 py-2">{event.tenantName || event.tenantId || '-'}</td>
                        <td className="px-3 py-2">{event.module || '-'}</td>
                        <td className="px-3 py-2">{event.action || '-'}</td>
                        <td className="px-3 py-2">{event.status || '-'}</td>
                        <td className="px-3 py-2 font-mono text-xs">{event.requestId || '-'}</td>
                        <td className="px-3 py-2">
                          <Button size="icon" variant="outline" onClick={() => openAuditDetail(event.id)} title="Ver detalhe">
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {!isLoadingAudits && globalAudits.length === 0 ? (
                      <tr>
                        <td className="px-3 py-4 text-muted-foreground" colSpan={7}>Nenhum evento encontrado.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sugestoes dos usuarios</CardTitle>
            <CardDescription>Feedbacks enviados pelos usuarios para evolucao do produto.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 md:grid-cols-5">
              <Select
                value={suggestionFilters.tenantId || 'ALL'}
                onValueChange={(v) => setSuggestionFilters((prev) => ({ ...prev, tenantId: v === 'ALL' ? '' : v }))}
              >
                <SelectTrigger><SelectValue placeholder="Tenant (todos)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tenant: Todos</SelectItem>
                  {activeTenants.map((t) => (
                    <SelectItem key={t.tenantId} value={t.tenantId}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Status (ex.: OPEN)"
                value={suggestionFilters.status}
                onChange={(e) => setSuggestionFilters((prev) => ({ ...prev, status: e.target.value }))}
              />
              <Select
                value={suggestionFilters.category || 'ALL'}
                onValueChange={(v) => setSuggestionFilters((prev) => ({ ...prev, category: v === 'ALL' ? '' : v }))}
              >
                <SelectTrigger><SelectValue placeholder="Categoria (todas)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Categoria: Todas</SelectItem>
                  {SUGGESTION_CATEGORY_OPTIONS.filter(Boolean).map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Buscar texto"
                value={suggestionFilters.text}
                onChange={(e) => setSuggestionFilters((prev) => ({ ...prev, text: e.target.value }))}
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => loadGlobalSuggestions({})} disabled={isLoadingSuggestions}>
                  Aplicar
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => { setSuggestionFilters(DEFAULT_SUGGESTION_FILTERS); loadGlobalSuggestions(DEFAULT_SUGGESTION_FILTERS); }}
                  disabled={isLoadingSuggestions}
                >
                  Limpar
                </Button>
              </div>
            </div>

            <div className="rounded-md border">
              <div className="max-h-[320px] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left">Data</th>
                      <th className="px-3 py-2 text-left">Tenant</th>
                      <th className="px-3 py-2 text-left">Usuario</th>
                      <th className="px-3 py-2 text-left">Categoria</th>
                      <th className="px-3 py-2 text-left">Titulo</th>
                      <th className="px-3 py-2 text-left">Mensagem</th>
                      <th className="px-3 py-2 text-left">Origem</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Detalhe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {globalSuggestions.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="px-3 py-2 whitespace-nowrap">
                          {item.createdAt ? new Date(item.createdAt).toLocaleString('pt-BR') : '-'}
                        </td>
                        <td className="px-3 py-2">{item.tenantName || item.tenantId || '-'}</td>
                        <td className="px-3 py-2">
                          {item.userName || '-'} {item.userRole ? `(${item.userRole})` : ''}
                        </td>
                        <td className="px-3 py-2">{item.category || '-'}</td>
                        <td className="px-3 py-2">{item.title}</td>
                        <td className="px-3 py-2">{item.message}</td>
                        <td className="px-3 py-2">{item.sourcePage || '-'}</td>
                        <td className="px-3 py-2">{item.status || '-'}</td>
                        <td className="px-3 py-2">
                          <Button size="icon" variant="outline" onClick={() => openSuggestionDetail(item.id)} title="Detalhar sugestao">
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {!isLoadingSuggestions && globalSuggestions.length === 0 ? (
                      <tr>
                        <td className="px-3 py-4 text-muted-foreground" colSpan={9}>Nenhuma sugestao encontrada.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAuditDetailOpen} onOpenChange={setIsAuditDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Detalhe da Auditoria</DialogTitle>
          </DialogHeader>
          {isLoadingAuditDetail ? (
            <p className="text-sm text-muted-foreground">Carregando detalhe...</p>
          ) : !auditDetail ? (
            <p className="text-sm text-muted-foreground">Nenhum detalhe encontrado.</p>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="grid gap-2 md:grid-cols-2">
                <p><strong>Tenant:</strong> {auditDetail.tenantName || auditDetail.tenantId || '-'}</p>
                <p><strong>Data:</strong> {auditDetail.createdAt ? new Date(auditDetail.createdAt).toLocaleString('pt-BR') : '-'}</p>
                <p><strong>Modulo:</strong> {auditDetail.module || '-'}</p>
                <p><strong>Acao:</strong> {auditDetail.action || '-'}</p>
                <p><strong>Status:</strong> {auditDetail.status || '-'}</p>
                <p><strong>Canal:</strong> {auditDetail.sourceChannel || '-'}</p>
                <p><strong>Actor:</strong> {auditDetail.actorUserId || '-'} ({auditDetail.actorRole || '-'})</p>
                <p><strong>Request ID:</strong> {auditDetail.requestId || '-'}</p>
              </div>
              <Separator />
              <p><strong>Error:</strong> {auditDetail.errorCode || '-'} {auditDetail.errorMessage ? `- ${auditDetail.errorMessage}` : ''}</p>
              <p><strong>IP:</strong> {auditDetail.ipAddress || '-'}</p>
              <p><strong>User-Agent:</strong> {auditDetail.userAgent || '-'}</p>
              <p><strong>Hash:</strong> {auditDetail.eventHash || '-'}</p>
              <p><strong>Hash anterior:</strong> {auditDetail.prevEventHash || '-'}</p>
              <p><strong>Campos alterados:</strong> {auditDetail.changedFieldsJson || '-'}</p>
              <div>
                <p className="font-medium mb-1">Before</p>
                <pre className="rounded border p-2 text-xs whitespace-pre-wrap">{auditDetail.beforeJson || '{}'}</pre>
              </div>
              <div>
                <p className="font-medium mb-1">After</p>
                <pre className="rounded border p-2 text-xs whitespace-pre-wrap">{auditDetail.afterJson || '{}'}</pre>
              </div>
              <div>
                <p className="font-medium mb-1">Metadata</p>
                <pre className="rounded border p-2 text-xs whitespace-pre-wrap">{auditDetail.metadataJson || '{}'}</pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isSuggestionDetailOpen} onOpenChange={setIsSuggestionDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Detalhe da Sugestao</DialogTitle>
          </DialogHeader>
          {isLoadingSuggestionDetail ? (
            <p className="text-sm text-muted-foreground">Carregando detalhe...</p>
          ) : !selectedSuggestion ? (
            <p className="text-sm text-muted-foreground">Nenhuma sugestao selecionada.</p>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-2 md:grid-cols-2 text-sm">
                <p><strong>Tenant:</strong> {selectedSuggestion.tenantName || selectedSuggestion.tenantId || '-'}</p>
                <p><strong>Usuario:</strong> {selectedSuggestion.userName || '-'} {selectedSuggestion.userRole ? `(${selectedSuggestion.userRole})` : ''}</p>
                <p><strong>Categoria:</strong> {selectedSuggestion.category || '-'}</p>
                <p><strong>Status:</strong> {selectedSuggestion.status || '-'}</p>
                <p><strong>Criado em:</strong> {selectedSuggestion.createdAt ? new Date(selectedSuggestion.createdAt).toLocaleString('pt-BR') : '-'}</p>
                <p><strong>Origem:</strong> {selectedSuggestion.sourcePage || '-'}</p>
              </div>

              <div className="rounded-md border p-3 space-y-2">
                <p className="text-sm font-semibold">{selectedSuggestion.title}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedSuggestion.message}</p>
              </div>

              {selectedSuggestion.respondedAt ? (
                <div className="rounded-md border p-3 text-sm space-y-1">
                  <p><strong>Ultima resposta:</strong></p>
                  <p className="whitespace-pre-wrap text-muted-foreground">{selectedSuggestion.adminResponse || '-'}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedSuggestion.respondedByUserName || selectedSuggestion.respondedByUserId || 'ADMIN'} em{' '}
                    {new Date(selectedSuggestion.respondedAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label>Resposta administrativa</Label>
                <Textarea
                  value={suggestionAdminResponse}
                  onChange={(e) => setSuggestionAdminResponse(e.target.value)}
                  placeholder="Escreva a resposta para o usuario..."
                  rows={5}
                  maxLength={5000}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => saveSuggestionResponse(false)} disabled={isSavingSuggestion}>
                  {isSavingSuggestion ? 'Salvando...' : 'Responder'}
                </Button>
                <Button onClick={() => saveSuggestionResponse(true)} disabled={isSavingSuggestion}>
                  {isSavingSuggestion ? 'Salvando...' : 'Responder e fechar'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
