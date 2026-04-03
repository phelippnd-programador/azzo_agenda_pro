import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { usersApi } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import { prepareImageUpload } from "@/lib/image-upload";
import { Building2, CalendarDays, Loader2, Mail, Phone, Save, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";

function resolveAvatarPreview(user?: { avatarUrl?: string | null; avatar?: string | null } | null) {
  if (user?.avatarUrl) return user.avatarUrl;
  if (user?.avatar?.startsWith("http://") || user?.avatar?.startsWith("https://")) {
    return user.avatar;
  }
  return null;
}

function formatCreatedAt(value?: string | Date | null) {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function UserProfileContent() {
  const { user, refreshUser } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(resolveAvatarPreview(user));

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaEnrolled, setMfaEnrolled] = useState(false);
  const [mfaSecret, setMfaSecret] = useState("");
  const [mfaUri, setMfaUri] = useState("");
  const [mfaEnableCode, setMfaEnableCode] = useState("");
  const [mfaDisableCode, setMfaDisableCode] = useState("");
  const [mfaDisablePassword, setMfaDisablePassword] = useState("");
  const [mfaQrCodeDataUrl, setMfaQrCodeDataUrl] = useState("");

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isMfaLoading, setIsMfaLoading] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [isAvatarRemoving, setIsAvatarRemoving] = useState(false);

  useEffect(() => {
    setName(user?.name || "");
    setEmail(user?.email || "");
    setPhone(user?.phone || "");
    setAvatarUrl(resolveAvatarPreview(user));
  }, [user]);

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
    if (!mfaUri) {
      setMfaQrCodeDataUrl("");
      return;
    }
    let isMounted = true;
    void QRCode.toDataURL(mfaUri, { margin: 1, width: 180 })
      .then((dataUrl) => {
        if (isMounted) setMfaQrCodeDataUrl(dataUrl);
      })
      .catch(() => {
        if (isMounted) setMfaQrCodeDataUrl("");
      });
    return () => {
      isMounted = false;
    };
  }, [mfaUri]);

  const profileInitials = useMemo(() => {
    const base = user?.name || user?.email || "Usuario";
    return (
      base
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "US"
    );
  }, [user?.email, user?.name]);

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const updatedUser = await usersApi.updateMe({ name, email, phone });
      setName(updatedUser.name || "");
      setEmail(updatedUser.email || "");
      setPhone(updatedUser.phone || "");
      setAvatarUrl(resolveAvatarPreview(updatedUser));
      await refreshUser();
      toast.success("Perfil atualizado com sucesso");
    } catch (error) {
      toast.error(resolveUiError(error, "Erro ao salvar perfil").message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Preencha todos os campos de senha");
      return;
    }

    setIsChangingPassword(true);
    try {
      await usersApi.updatePassword({ currentPassword, newPassword, confirmPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Senha alterada com sucesso");
    } catch (error) {
      toast.error(resolveUiError(error, "Erro ao alterar senha").message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleAvatarUpload = async (selectedFile: File) => {
    setIsAvatarUploading(true);
    try {
      const preparedFile = await prepareImageUpload(selectedFile);
      await usersApi.uploadAvatar(preparedFile);
      const refreshedUser = await refreshUser();
      setAvatarUrl(resolveAvatarPreview(refreshedUser));
      toast.success("Foto de perfil atualizada com sucesso");
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel enviar a foto de perfil").message);
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const handleAvatarRemove = async () => {
    setIsAvatarRemoving(true);
    try {
      await usersApi.removeAvatar();
      const refreshedUser = await refreshUser();
      setAvatarUrl(resolveAvatarPreview(refreshedUser));
      toast.success("Foto de perfil removida com sucesso");
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel remover a foto de perfil").message);
    } finally {
      setIsAvatarRemoving(false);
    }
  };

  const handlePrepareMfa = async () => {
    setIsMfaLoading(true);
    try {
      const data = await usersApi.setupMfa();
      setMfaSecret(data.secret);
      setMfaUri(data.otpauthUri);
      setMfaEnrolled(true);
      setMfaEnabled(false);
      toast.success("MFA preparado. Escaneie o QR Code e confirme o codigo.");
    } catch (error) {
      toast.error(resolveUiError(error, "Erro ao preparar MFA").message);
    } finally {
      setIsMfaLoading(false);
    }
  };

  const handleEnableMfa = async () => {
    if (!mfaEnableCode || mfaEnableCode.length !== 6) {
      toast.error("Informe o codigo MFA de 6 digitos");
      return;
    }

    setIsMfaLoading(true);
    try {
      const data = await usersApi.enableMfa(mfaEnableCode);
      setMfaEnabled(Boolean(data.enabled));
      setMfaEnrolled(Boolean(data.enrolled));
      setMfaEnableCode("");
      setMfaSecret("");
      setMfaUri("");
      toast.success("MFA habilitado com sucesso");
    } catch (error) {
      toast.error(resolveUiError(error, "Erro ao habilitar MFA").message);
    } finally {
      setIsMfaLoading(false);
    }
  };

  const handleDisableMfa = async () => {
    if (!mfaDisablePassword || !mfaDisableCode || mfaDisableCode.length !== 6) {
      toast.error("Informe senha atual e codigo MFA de 6 digitos");
      return;
    }

    setIsMfaLoading(true);
    try {
      const data = await usersApi.disableMfa(mfaDisablePassword, mfaDisableCode);
      setMfaEnabled(Boolean(data.enabled));
      setMfaEnrolled(Boolean(data.enrolled));
      setMfaDisablePassword("");
      setMfaDisableCode("");
      setMfaSecret("");
      setMfaUri("");
      toast.success("MFA desabilitado com sucesso");
    } catch (error) {
      toast.error(resolveUiError(error, "Erro ao desabilitar MFA").message);
    } finally {
      setIsMfaLoading(false);
    }
  };

  const isOwner = user?.role === "OWNER";

  return (
    <div className="max-w-4xl space-y-4 sm:space-y-6">
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <FileDropzone
              title="Foto de perfil"
              helperText="JPG, PNG ou WEBP"
              accept={{
                "image/jpeg": [".jpg", ".jpeg"],
                "image/png": [".png"],
                "image/webp": [".webp"],
              }}
              capture="user"
              enableWebcamCapture
              cameraFacingMode="user"
              maxSizeBytes={10 * 1024 * 1024}
              currentPreviewUrl={avatarUrl}
              previewAlt={user?.name || "Foto de perfil"}
              isLoading={isAvatarUploading || isAvatarRemoving}
              onFileSelected={handleAvatarUpload}
              onRemove={avatarUrl ? handleAvatarRemove : undefined}
              inputTestId="user-avatar-input"
              variant="avatar"
              className="shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-xl font-bold text-foreground sm:text-2xl">{user?.name || "Usuario"}</h2>
                <Badge variant="secondary">{user?.role || "USER"}</Badge>
              </div>
              <div className="mt-2 flex flex-col gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{user?.email || "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>{user?.salonName || "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  <span>Criado em {formatCreatedAt(user?.createdAt)}</span>
                </div>
              </div>
              {!avatarUrl ? (
                <div className="mt-3 text-xs text-muted-foreground">
                  Avatar atual: {profileInitials}
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dados da conta</CardTitle>
          <CardDescription>Atualize suas informacoes pessoais e de contato.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="(11) 99999-0000" />
            </div>
            <div className="space-y-2">
              <Label>Perfil de acesso</Label>
              <Input value={user?.role || ""} readOnly />
            </div>
          </div>
          <Button onClick={handleSaveProfile} disabled={isSavingProfile} className="gap-2">
            {isSavingProfile ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar perfil
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alterar senha</CardTitle>
          <CardDescription>Use sua senha atual para definir uma nova senha de acesso.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="password"
            placeholder="Senha atual"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
          />
          <Input
            type="password"
            placeholder="Nova senha"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
          />
          <Input
            type="password"
            placeholder="Confirmar nova senha"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
          />
          <Button variant="outline" onClick={handleChangePassword} disabled={isChangingPassword}>
            {isChangingPassword ? "Alterando..." : "Alterar senha"}
          </Button>
        </CardContent>
      </Card>

      {isOwner ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              MFA / 2FA
            </CardTitle>
            <CardDescription>
              Ative segundo fator por aplicativo autenticador para proteger o acesso administrativo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm">
              Status:{" "}
              <span className={mfaEnabled ? "font-medium text-green-600" : "font-medium text-amber-600"}>
                {mfaEnabled ? "Habilitado" : "Desabilitado"}
              </span>
            </div>

            {!mfaEnabled ? (
              <>
                <Button variant="outline" onClick={handlePrepareMfa} disabled={isMfaLoading}>
                  Preparar MFA
                </Button>

                {mfaEnrolled && mfaSecret ? (
                  <div className="space-y-3 rounded-md border p-3">
                    <div className="space-y-1">
                      <Label>Secret (backup manual)</Label>
                      <Input value={mfaSecret} readOnly />
                    </div>
                    <div className="space-y-1">
                      <Label>URI do autenticador</Label>
                      <Input value={mfaUri} readOnly />
                    </div>
                    {mfaQrCodeDataUrl ? (
                      <div className="space-y-2">
                        <Label>QR Code</Label>
                        <div className="inline-flex rounded-md border bg-white p-2">
                          <img src={mfaQrCodeDataUrl} alt="QR Code MFA" className="h-[180px] w-[180px]" />
                        </div>
                      </div>
                    ) : null}
                    <div className="space-y-1">
                      <Label>Codigo atual do app</Label>
                      <Input
                        value={mfaEnableCode}
                        onChange={(event) => setMfaEnableCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="000000"
                      />
                    </div>
                    <Button onClick={handleEnableMfa} disabled={isMfaLoading}>
                      Confirmar e habilitar MFA
                    </Button>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="space-y-3 rounded-md border p-3">
                <Label>Desabilitar MFA</Label>
                <Input
                  type="password"
                  placeholder="Senha atual"
                  value={mfaDisablePassword}
                  onChange={(event) => setMfaDisablePassword(event.target.value)}
                  autoComplete="current-password"
                />
                <Input
                  placeholder="Codigo MFA (6 digitos)"
                  value={mfaDisableCode}
                  onChange={(event) => setMfaDisableCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                />
                <Button variant="destructive" onClick={handleDisableMfa} disabled={isMfaLoading}>
                  Desabilitar MFA
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Seguranca da conta
            </CardTitle>
            <CardDescription>Seu perfil de acesso nao exige configuracao de MFA nesta versao.</CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
