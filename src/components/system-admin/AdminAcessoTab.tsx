import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { systemAdminApi, usersApi } from '@/lib/api';
import { toast } from 'sonner';
import type { SessionItem } from '@/types/system-admin';

interface AdminAcessoTabProps {
  selectedTenantId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
}

export function AdminAcessoTab({ selectedTenantId, userName, userEmail, userPhone }: AdminAcessoTabProps) {
  const [sessionUserId, setSessionUserId] = useState('');
  const [sessionItems, setSessionItems] = useState<SessionItem[]>([]);
  const [includeRevokedSessions, setIncludeRevokedSessions] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isRevokingSessions, setIsRevokingSessions] = useState(false);

  const [adminName, setAdminName] = useState(userName);
  const [adminEmail, setAdminEmail] = useState(userEmail);
  const [adminCurrentPassword, setAdminCurrentPassword] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [isSavingCredentials, setIsSavingCredentials] = useState(false);

  const loadSessions = async (tenantId?: string) => {
    setIsLoadingSessions(true);
    try {
      const response = await systemAdminApi.listSessions({
        tenantId: tenantId || undefined,
        includeRevoked: includeRevokedSessions,
        limit: 100,
      });
      setSessionItems(response.items || []);
    } catch {
      toast.error('Nao foi possivel carregar sessoes.');
      setSessionItems([]);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    setAdminName(userName);
    setAdminEmail(userEmail);
  }, [userName, userEmail]);

  useEffect(() => {
    if (!selectedTenantId) return;
    loadSessions(selectedTenantId);
  }, [selectedTenantId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadSessions(selectedTenantId);
  }, [includeRevokedSessions]); // eslint-disable-line react-hooks/exhaustive-deps

  const revokeSessions = async () => {
    if (!selectedTenantId && !sessionUserId.trim()) {
      toast.error('Informe tenant ou userId para revogar sessoes.');
      return;
    }
    setIsRevokingSessions(true);
    try {
      const response = await systemAdminApi.revokeSessions({
        tenantId: selectedTenantId || undefined,
        userId: sessionUserId.trim() || undefined,
      });
      toast.success(response.message || `Sessoes revogadas: ${response.revokedCount}`);
      await loadSessions(selectedTenantId);
    } catch {
      toast.error('Falha ao revogar sessoes.');
    } finally {
      setIsRevokingSessions(false);
    }
  };

  const revokeSingleSession = async (refreshTokenId: string) => {
    setIsRevokingSessions(true);
    try {
      const response = await systemAdminApi.revokeSessionToken({
        refreshTokenId,
        tenantId: selectedTenantId || undefined,
      });
      toast.success(response.message || `Sessoes revogadas: ${response.revokedCount}`);
      await loadSessions(selectedTenantId);
    } catch {
      toast.error('Falha ao revogar sessao.');
    } finally {
      setIsRevokingSessions(false);
    }
  };

  const saveAdminProfile = async () => {
    if (!adminName.trim() || !adminEmail.trim()) {
      toast.error('Nome e usuario (email) sao obrigatorios.');
      return;
    }
    setIsSavingCredentials(true);
    try {
      await usersApi.updateMe({
        name: adminName.trim(),
        email: adminEmail.trim(),
        phone: userPhone ?? '',
      });
      toast.success('Usuario administrativo atualizado.');
    } catch {
      toast.error('Falha ao atualizar usuario administrativo.');
    } finally {
      setIsSavingCredentials(false);
    }
  };

  const saveAdminPassword = async () => {
    if (!adminCurrentPassword || !adminNewPassword || !adminConfirmPassword) {
      toast.error('Preencha todos os campos de senha.');
      return;
    }
    setIsSavingCredentials(true);
    try {
      await usersApi.updatePassword({
        currentPassword: adminCurrentPassword,
        newPassword: adminNewPassword,
        confirmPassword: adminConfirmPassword,
      });
      setAdminCurrentPassword('');
      setAdminNewPassword('');
      setAdminConfirmPassword('');
      toast.success('Senha administrativa atualizada.');
    } catch {
      toast.error('Falha ao atualizar senha administrativa.');
    } finally {
      setIsSavingCredentials(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sessoes</CardTitle>
          <CardDescription>
            Revoga refresh tokens para encerrar sessoes de um tenant inteiro ou de um usuario especifico.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            O access token atual expira naturalmente; a revogacao bloqueia renovacao e efetiva logout.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={includeRevokedSessions ? 'outline' : 'default'}
              onClick={() => setIncludeRevokedSessions(false)}
            >
              Ativas
            </Button>
            <Button
              variant={includeRevokedSessions ? 'default' : 'outline'}
              onClick={() => setIncludeRevokedSessions(true)}
            >
              Todas
            </Button>
            <Button
              variant="outline"
              onClick={() => loadSessions(selectedTenantId)}
              disabled={isLoadingSessions}
            >
              Atualizar lista
            </Button>
          </div>
          <Input
            placeholder="User ID (opcional) para revogar apenas esse usuario"
            value={sessionUserId}
            onChange={(e) => setSessionUserId(e.target.value)}
          />
          <Button onClick={revokeSessions} disabled={isRevokingSessions}>
            {isRevokingSessions ? 'Revogando...' : 'Revogar sessoes'}
          </Button>

          <div className="rounded-md border">
            <div className="max-h-[260px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left">Usuario</th>
                    <th className="px-3 py-2 text-left">Role</th>
                    <th className="px-3 py-2 text-left">Criado</th>
                    <th className="px-3 py-2 text-left">Expira</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Acao</th>
                  </tr>
                </thead>
                <tbody>
                  {sessionItems.map((session) => (
                    <tr key={session.refreshTokenId} className="border-t">
                      <td className="px-3 py-2">
                        <div className="flex flex-col">
                          <span>{session.userName || session.userEmail || session.userId || '-'}</span>
                          <span className="text-xs text-muted-foreground">{session.userEmail || session.userId}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">{session.userRole || '-'}</td>
                      <td className="px-3 py-2">
                        {session.createdAt ? new Date(session.createdAt).toLocaleString('pt-BR') : '-'}
                      </td>
                      <td className="px-3 py-2">
                        {session.expiresAt ? new Date(session.expiresAt).toLocaleString('pt-BR') : '-'}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={session.active ? 'default' : 'secondary'}>
                          {session.active ? 'ATIVA' : 'INATIVA'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!session.active || isRevokingSessions}
                          onClick={() => revokeSingleSession(session.refreshTokenId)}
                        >
                          Revogar
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!isLoadingSessions && sessionItems.length === 0 ? (
                    <tr>
                      <td className="px-3 py-4 text-muted-foreground" colSpan={6}>
                        Nenhuma sessao encontrada.
                      </td>
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
          <CardTitle>Credenciais do administrador</CardTitle>
          <CardDescription>
            Altere o usuario (email) e a senha da conta administrativa do sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={adminName} onChange={(e) => setAdminName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Usuario (email)</Label>
              <Input value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
            </div>
          </div>
          <Button variant="outline" onClick={saveAdminProfile} disabled={isSavingCredentials}>
            Salvar usuario
          </Button>

          <Separator />

          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Senha atual</Label>
              <Input
                type="password"
                value={adminCurrentPassword}
                onChange={(e) => setAdminCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Nova senha</Label>
              <Input
                type="password"
                value={adminNewPassword}
                onChange={(e) => setAdminNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Confirmar senha</Label>
              <Input
                type="password"
                value={adminConfirmPassword}
                onChange={(e) => setAdminConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={saveAdminPassword} disabled={isSavingCredentials}>
            Atualizar senha
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
