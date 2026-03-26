import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck } from 'lucide-react';
import { usersApi } from '@/lib/api';
import { resolveUiError } from '@/lib/error-utils';
import { toast } from 'sonner';

interface SettingsAccountTabProps {
  userName: string;
  userEmail: string;
  userRole?: string;
}

export function SettingsAccountTab({ userName, userEmail, userRole }: SettingsAccountTabProps) {
  const [name, setName] = useState(userName);
  const [email, setEmail] = useState(userEmail);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaEnrolled, setMfaEnrolled] = useState(false);
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaUri, setMfaUri] = useState('');
  const [mfaEnableCode, setMfaEnableCode] = useState('');
  const [mfaDisableCode, setMfaDisableCode] = useState('');
  const [mfaDisablePassword, setMfaDisablePassword] = useState('');
  const [mfaQrCodeDataUrl, setMfaQrCodeDataUrl] = useState('');

  useEffect(() => {
    setName(userName);
    setEmail(userEmail);
  }, [userName, userEmail]);

  useEffect(() => {
    usersApi
      .getMfaStatus()
      .then((data) => {
        setMfaEnabled(Boolean(data.enabled));
        setMfaEnrolled(Boolean(data.enrolled));
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!mfaUri) { setMfaQrCodeDataUrl(''); return; }
    let isMounted = true;
    void QRCode.toDataURL(mfaUri, { margin: 1, width: 180 })
      .then((dataUrl) => { if (isMounted) setMfaQrCodeDataUrl(dataUrl); })
      .catch(() => { if (isMounted) setMfaQrCodeDataUrl(''); });
    return () => { isMounted = false; };
  }, [mfaUri]);

  const handleSaveAccount = async () => {
    setIsSaving(true);
    try {
      await usersApi.updateMe({ name, email });
      toast.success('Dados da conta salvos com sucesso!');
    } catch (error) {
      toast.error(resolveUiError(error, 'Erro ao salvar dados da conta').message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Preencha todos os campos de senha');
      return;
    }
    setIsSaving(true);
    try {
      await usersApi.updatePassword({ currentPassword, newPassword, confirmPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Senha alterada com sucesso');
    } catch (error) {
      toast.error(resolveUiError(error, 'Erro ao alterar senha').message);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrepareMfa = async () => {
    setIsSaving(true);
    try {
      const data = await usersApi.setupMfa();
      setMfaSecret(data.secret);
      setMfaUri(data.otpauthUri);
      setMfaEnrolled(true);
      setMfaEnabled(false);
      toast.success('MFA preparado. Escaneie o URI no app autenticador e confirme o codigo.');
    } catch (error) {
      toast.error(resolveUiError(error, 'Erro ao preparar MFA').message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEnableMfa = async () => {
    if (!mfaEnableCode || mfaEnableCode.length !== 6) {
      toast.error('Informe o codigo MFA de 6 digitos');
      return;
    }
    setIsSaving(true);
    try {
      const data = await usersApi.enableMfa(mfaEnableCode);
      setMfaEnabled(Boolean(data.enabled));
      setMfaEnrolled(Boolean(data.enrolled));
      setMfaEnableCode('');
      setMfaSecret('');
      setMfaUri('');
      toast.success('MFA habilitado com sucesso.');
    } catch (error) {
      toast.error(resolveUiError(error, 'Erro ao habilitar MFA').message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisableMfa = async () => {
    if (!mfaDisablePassword || !mfaDisableCode || mfaDisableCode.length !== 6) {
      toast.error('Informe senha atual e codigo MFA de 6 digitos');
      return;
    }
    setIsSaving(true);
    try {
      const data = await usersApi.disableMfa(mfaDisablePassword, mfaDisableCode);
      setMfaEnabled(Boolean(data.enabled));
      setMfaEnrolled(Boolean(data.enrolled));
      setMfaDisableCode('');
      setMfaDisablePassword('');
      setMfaSecret('');
      setMfaUri('');
      toast.success('MFA desabilitado com sucesso.');
    } catch (error) {
      toast.error(resolveUiError(error, 'Erro ao desabilitar MFA').message);
    } finally {
      setIsSaving(false);
    }
  };

  const isOwner = userRole === 'OWNER';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dados da Conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleSaveAccount} disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alterar Senha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="password"
            placeholder="Senha atual"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Nova senha"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Confirmar nova senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button variant="outline" onClick={handleChangePassword} disabled={isSaving}>
            Alterar senha
          </Button>
        </CardContent>
      </Card>

      {isOwner ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              MFA / 2FA (Administrador)
            </CardTitle>
            <CardDescription>
              Ative segundo fator por aplicativo autenticador (TOTP) para proteger o acesso administrativo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm">
              Status:{' '}
              <span className={mfaEnabled ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>
                {mfaEnabled ? 'Habilitado' : 'Desabilitado'}
              </span>
            </div>

            {!mfaEnabled ? (
              <>
                <Button variant="outline" onClick={handlePrepareMfa} disabled={isSaving}>
                  Preparar MFA
                </Button>

                {mfaEnrolled && mfaSecret ? (
                  <div className="space-y-3 rounded-md border p-3">
                    <div className="space-y-1">
                      <Label>Secret (backup manual)</Label>
                      <Input value={mfaSecret} readOnly />
                    </div>
                    <div className="space-y-1">
                      <Label>URI do autenticador (otpauth)</Label>
                      <Input value={mfaUri} readOnly />
                    </div>
                    {mfaQrCodeDataUrl ? (
                      <div className="space-y-2">
                        <Label>QR Code para app autenticador</Label>
                        <div className="inline-flex rounded-md border bg-white p-2">
                          <img src={mfaQrCodeDataUrl} alt="QR Code MFA" className="h-[180px] w-[180px]" />
                        </div>
                      </div>
                    ) : null}
                    <div className="space-y-1">
                      <Label>Codigo atual do app</Label>
                      <Input
                        value={mfaEnableCode}
                        onChange={(e) => setMfaEnableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                      />
                    </div>
                    <Button onClick={handleEnableMfa} disabled={isSaving}>
                      Confirmar e habilitar MFA
                    </Button>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="space-y-3 rounded-md border p-3">
                <Label>Desabilitar MFA (exige senha atual + codigo do app)</Label>
                <Input
                  type="password"
                  placeholder="Senha atual"
                  value={mfaDisablePassword}
                  onChange={(e) => setMfaDisablePassword(e.target.value)}
                />
                <Input
                  placeholder="Codigo MFA (6 digitos)"
                  value={mfaDisableCode}
                  onChange={(e) => setMfaDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
                <Button variant="destructive" onClick={handleDisableMfa} disabled={isSaving}>
                  Desabilitar MFA
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
