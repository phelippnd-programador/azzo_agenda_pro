import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { configApi } from '@/lib/api';
import { toast } from 'sonner';
import type { MenuCatalogItem, MenuCatalogItemRequest, MenuConfigScope, SystemAdminRole } from '@/types/system-admin';

const ROLES: SystemAdminRole[] = ['ADMIN', 'OWNER', 'PROFESSIONAL'];

type AdminMenusTabProps = {
  selectedTenantId?: string;
};

type MenuCatalogFormState = {
  id?: string;
  route: string;
  label: string;
  parentId: string;
  displayOrder: string;
  iconKey: string;
  active: boolean;
  sidebarVisible: boolean;
  roleVisibilities: Record<SystemAdminRole, boolean>;
};

const createEmptyForm = (): MenuCatalogFormState => ({
  route: '',
  label: '',
  parentId: '',
  displayOrder: '0',
  iconKey: '',
  active: true,
  sidebarVisible: true,
  roleVisibilities: { ADMIN: true, OWNER: false, PROFESSIONAL: false },
});

export function AdminMenusTab({ selectedTenantId }: AdminMenusTabProps) {
  const [items, setItems] = useState<MenuCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<SystemAdminRole>('OWNER');
  const [selectedScope, setSelectedScope] = useState<MenuConfigScope>('GLOBAL');
  const [routeState, setRouteState] = useState<Record<string, boolean>>({});
  const [pendingRouteState, setPendingRouteState] = useState<Record<string, boolean>>({});
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [isSavingRoutes, setIsSavingRoutes] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<MenuCatalogFormState>(createEmptyForm);

  const availableParents = useMemo(() => items.filter((item) => item.id !== form.id), [items, form.id]);

  const loadMenuCatalog = async () => {
    setIsLoading(true);
    try {
      const response = await configApi.getMenuCatalog();
      setItems(response.items || []);
    } catch {
      toast.error('Nao foi possivel carregar o catalogo de menus.');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMenuCatalog();
  }, []);

  const loadRoleRoutes = useCallback(async () => {
    if (selectedScope === 'TENANT' && !selectedTenantId) {
      setRouteState({});
      setPendingRouteState({});
      return;
    }

    setIsLoadingRoutes(true);
    try {
      const response = await configApi.getRoleRoutes(
        selectedRole,
        selectedScope,
        selectedScope === 'TENANT' ? selectedTenantId : undefined
      );
      const nextState = (response.items || []).reduce((acc, item) => {
        if (item.route) {
          acc[item.route] = item.enabled;
        }
        return acc;
      }, {} as Record<string, boolean>);
      setRouteState(nextState);
      setPendingRouteState(nextState);
    } catch {
      toast.error('Nao foi possivel carregar as permissoes de menu.');
      setRouteState({});
      setPendingRouteState({});
    } finally {
      setIsLoadingRoutes(false);
    }
  }, [selectedRole, selectedScope, selectedTenantId]);

  useEffect(() => {
    loadRoleRoutes();
  }, [loadRoleRoutes]);

  const openCreate = () => {
    setForm(createEmptyForm());
    setIsDialogOpen(true);
  };

  const openEdit = (item: MenuCatalogItem) => {
    const roleVisibilities = ROLES.reduce((acc, role) => {
      acc[role] = item.roleVisibilities.some((v) => v.role === role && v.enabled);
      return acc;
    }, {} as Record<SystemAdminRole, boolean>);
    setForm({
      id: item.id,
      route: item.route,
      label: item.label,
      parentId: item.parentId || '',
      displayOrder: String(item.displayOrder ?? 0),
      iconKey: item.iconKey || '',
      active: item.active,
      sidebarVisible: item.sidebarVisible !== false,
      roleVisibilities,
    });
    setIsDialogOpen(true);
  };

  const setRoleVisibility = (role: SystemAdminRole, enabled: boolean) => {
    setForm((prev) => ({ ...prev, roleVisibilities: { ...prev.roleVisibilities, [role]: enabled } }));
  };

  const setRouteVisibility = (route: string, enabled: boolean) => {
    setPendingRouteState((prev) => ({ ...prev, [route]: enabled }));
  };

  const buildPayload = (): MenuCatalogItemRequest => ({
    id: form.id,
    route: form.route.trim(),
    label: form.label.trim(),
    parentId: form.parentId || undefined,
    displayOrder: Number(form.displayOrder || 0),
    iconKey: form.iconKey.trim() || undefined,
    active: form.active,
    sidebarVisible: form.sidebarVisible,
    roleVisibilities: ROLES.map((role) => ({ role, enabled: Boolean(form.roleVisibilities[role]) })),
  });

  const save = async () => {
    if (!form.route.trim() || !form.label.trim()) {
      toast.error('Route e titulo sao obrigatorios.');
      return;
    }
    setIsSaving(true);
    try {
      const payload = buildPayload();
      if (form.id) {
        await configApi.updateMenuCatalogItem(form.id, payload);
      } else {
        await configApi.createMenuCatalogItem(payload);
      }
      toast.success(form.id ? 'Menu atualizado.' : 'Menu criado.');
      setIsDialogOpen(false);
      setForm(createEmptyForm());
      await loadMenuCatalog();
    } catch {
      toast.error('Falha ao salvar catalogo de menus.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveRoleRoutes = async () => {
    if (selectedScope === 'TENANT' && !selectedTenantId) {
      toast.error('Selecione um tenant na aba Contexto antes de aplicar permissoes.');
      return;
    }

    const changedItems = Object.entries(pendingRouteState)
      .filter(([route, enabled]) => routeState[route] !== enabled)
      .map(([route, enabled]) => ({ route, enabled }));

    if (changedItems.length === 0) {
      toast.success('Nenhuma permissao foi alterada.');
      return;
    }

    setIsSavingRoutes(true);
    try {
      await configApi.applyMenuOverridesBulk({
        tenantId: selectedScope === 'TENANT' ? selectedTenantId : undefined,
        scope: selectedScope,
        role: selectedRole,
        items: changedItems,
        reason: 'Ajuste pelo gerenciamento de menus',
      });
      toast.success(
        selectedScope === 'GLOBAL'
          ? 'Permissoes por role atualizadas.'
          : 'Permissoes do tenant atualizadas.'
      );
      await loadRoleRoutes();
    } catch {
      toast.error('Falha ao salvar permissoes de menu.');
    } finally {
      setIsSavingRoutes(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Catalogo de menus</CardTitle>
          <CardDescription>
            Cadastre rotas, hierarquia, ordem, icone e visibilidade padrao por role.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <Button onClick={openCreate}>Novo menu</Button>
            <Button variant="outline" onClick={loadMenuCatalog} disabled={isLoading}>
              Atualizar catalogo
            </Button>
            <div className="min-w-40 space-y-1">
              <Label className="text-xs">Role</Label>
              <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as SystemAdminRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-48 space-y-1">
              <Label className="text-xs">Escopo</Label>
              <Select value={selectedScope} onValueChange={(value) => setSelectedScope(value as MenuConfigScope)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GLOBAL">Padrao por role</SelectItem>
                  <SelectItem value="TENANT">Tenant selecionado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={loadRoleRoutes}
              disabled={(selectedScope === 'TENANT' && !selectedTenantId) || isLoadingRoutes}
            >
              Atualizar permissoes
            </Button>
            <Button
              onClick={saveRoleRoutes}
              disabled={(selectedScope === 'TENANT' && !selectedTenantId) || isLoadingRoutes || isSavingRoutes}
            >
              {isSavingRoutes ? 'Salvando permissoes...' : 'Salvar permissoes'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            "Padrao global" mostra as roles do catalogo. A coluna "{selectedRole} / {selectedScope === 'GLOBAL' ? 'padrao' : 'tenant'}"
            controla as permissoes de rota por role no escopo selecionado.
          </p>

          <div className="rounded-md border">
            <div className="max-h-[420px] overflow-auto">
              <table className="min-w-[1180px] w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left">Titulo</th>
                    <th className="px-3 py-2 text-left">Rota</th>
                    <th className="px-3 py-2 text-left">Pai</th>
                    <th className="px-3 py-2 text-left">Ordem</th>
                    <th className="px-3 py-2 text-left">Icone</th>
                    <th className="px-3 py-2 text-left">Padrao global</th>
                    <th className="px-3 py-2 text-left">
                      {selectedRole} / {selectedScope === 'GLOBAL' ? 'padrao' : 'tenant'}
                    </th>
                    <th className="px-3 py-2 text-left">Menu lateral</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Acao</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-3 py-2">
                        <div className="flex flex-col">
                          <span className="font-medium">{item.label}</span>
                          {item.childrenCount > 0 ? (
                            <span className="text-xs text-muted-foreground">{item.childrenCount} filho(s)</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{item.route}</td>
                      <td className="px-3 py-2">{item.parentLabel || '-'}</td>
                      <td className="px-3 py-2">{item.displayOrder}</td>
                      <td className="px-3 py-2">{item.iconKey || '-'}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {item.roleVisibilities
                            .filter((v) => v.enabled)
                            .map((v) => (
                              <Badge key={`${item.id}-${v.role}`} variant="secondary">
                                {v.role}
                              </Badge>
                            ))}
                          {!item.roleVisibilities.some((v) => v.enabled) ? (
                            <span className="text-xs text-muted-foreground">Nenhuma role</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <Checkbox
                          aria-label={`Permitir ${item.label} para ${selectedRole} no ${selectedScope === 'GLOBAL' ? 'padrao' : 'tenant'}`}
                          checked={Boolean(pendingRouteState[item.route])}
                          disabled={(selectedScope === 'TENANT' && !selectedTenantId) || isLoadingRoutes || isSavingRoutes}
                          onCheckedChange={(checked) => setRouteVisibility(item.route, Boolean(checked))}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={item.sidebarVisible !== false ? 'secondary' : 'outline'}>
                          {item.sidebarVisible !== false ? 'Visível' : 'Oculto'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={item.active ? 'default' : 'secondary'}>
                          {item.active ? 'ATIVO' : 'INATIVO'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(item)} className="w-full sm:w-auto">
                          Editar
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!isLoading && items.length === 0 ? (
                    <tr>
                      <td className="px-3 py-4 text-muted-foreground" colSpan={10}>
                        Nenhum menu cadastrado.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Editar menu' : 'Novo menu'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Rota</Label>
                <Input
                  placeholder="/financeiro/comissoes"
                  value={form.route}
                  onChange={(e) => setForm((prev) => ({ ...prev, route: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Titulo</Label>
                <Input
                  placeholder="Comissoes"
                  value={form.label}
                  onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Menu pai</Label>
                <Select
                  value={form.parentId || '__none__'}
                  onValueChange={(v) => setForm((prev) => ({ ...prev, parentId: v === '__none__' ? '' : v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sem pai" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sem pai</SelectItem>
                    {availableParents.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.label} [{item.route}]
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ordem</Label>
                <Input
                  type="number"
                  value={form.displayOrder}
                  onChange={(e) => setForm((prev) => ({ ...prev, displayOrder: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Icone</Label>
                <Input
                  placeholder="Wallet"
                  value={form.iconKey}
                  onChange={(e) => setForm((prev) => ({ ...prev, iconKey: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Roles visiveis</Label>
              <div className="flex flex-wrap gap-4 rounded-md border p-3">
                {ROLES.map((role) => (
                  <label key={role} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={form.roleVisibilities[role]}
                      onCheckedChange={(checked) => setRoleVisibility(role, Boolean(checked))}
                    />
                    {role}
                  </label>
                ))}
                <label className="ml-auto flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.sidebarVisible}
                    onCheckedChange={(checked) => setForm((prev) => ({ ...prev, sidebarVisible: Boolean(checked) }))}
                  />
                  Exibir no menu lateral
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.active}
                    onCheckedChange={(checked) => setForm((prev) => ({ ...prev, active: Boolean(checked) }))}
                  />
                  Ativo
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
                Cancelar
              </Button>
              <Button onClick={save} disabled={isSaving}>
                {isSaving ? 'Salvando...' : 'Salvar menu'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
