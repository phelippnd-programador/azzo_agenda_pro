import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PlugZap, Building2, ShieldCheck, Receipt, Boxes } from "lucide-react";
import QRCode from "qrcode";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { settingsApi, usersApi } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import {
  hasNonEssentialCookieConsent,
  readCookieConsent,
  revokeCookieConsent,
} from "@/lib/cookie-consent";

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "notifications";
  const [activeTab, setActiveTab] = useState(initialTab);
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [whatsappNotifications, setWhatsappNotifications] = useState(true);
  const [reminderHours, setReminderHours] = useState("24");

  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
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
  const [cookieStatusText, setCookieStatusText] = useState("Nao definido");

  useEffect(() => {
    setUserName(user?.name || "");
    setUserEmail(user?.email || "");
  }, [user]);

  useEffect(() => {
    settingsApi
      .get()
      .then((data) => {
        setEmailNotifications(data.notifications.emailNotifications);
        setSmsNotifications(data.notifications.smsNotifications);
        setWhatsappNotifications(data.notifications.whatsappNotifications);
        setReminderHours(String(data.notifications.reminderHours));
      })
      .catch(() => undefined);
  }, []);

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
    const record = readCookieConsent();
    if (!record) {
      setCookieStatusText("Nao definido");
      return;
    }
    setCookieStatusText(
      hasNonEssentialCookieConsent()
        ? `Aceito (expira em ${new Date(record.expiresAt).toLocaleDateString("pt-BR")})`
        : `Rejeitado (expira em ${new Date(record.expiresAt).toLocaleDateString("pt-BR")})`
    );
  }, []);

  const handleSaveNotifications = async () => {
    try {
      setIsSaving(true);
      await settingsApi.updateNotifications({
        emailNotifications,
        smsNotifications,
        whatsappNotifications,
        reminderHours: Number(reminderHours || 0),
      });
      toast.success("Notificacoes salvas com sucesso!");
    } catch (error) {
      toast.error(resolveUiError(error, "Erro ao salvar notificacoes").message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAccount = async () => {
    try {
      setIsSaving(true);
      await usersApi.updateMe({
        name: userName,
        email: userEmail,
      });
      toast.success("Dados da conta salvos com sucesso!");
    } catch (error) {
      toast.error(resolveUiError(error, "Erro ao salvar dados da conta").message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Preencha todos os campos de senha");
      return;
    }

    try {
      setIsSaving(true);
      await usersApi.updatePassword({ currentPassword, newPassword, confirmPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Senha alterada com sucesso");
    } catch (error) {
      toast.error(resolveUiError(error, "Erro ao alterar senha").message);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrepareMfa = async () => {
    try {
      setIsSaving(true);
      const data = await usersApi.setupMfa();
      setMfaSecret(data.secret);
      setMfaUri(data.otpauthUri);
      setMfaEnrolled(true);
      setMfaEnabled(false);
      toast.success("MFA preparado. Escaneie o URI no app autenticador e confirme o codigo.");
    } catch (error) {
      toast.error(resolveUiError(error, "Erro ao preparar MFA").message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEnableMfa = async () => {
    if (!mfaEnableCode || mfaEnableCode.length !== 6) {
      toast.error("Informe o codigo MFA de 6 digitos");
      return;
    }
    try {
      setIsSaving(true);
      const data = await usersApi.enableMfa(mfaEnableCode);
      setMfaEnabled(Boolean(data.enabled));
      setMfaEnrolled(Boolean(data.enrolled));
      setMfaEnableCode("");
      setMfaSecret("");
      setMfaUri("");
      toast.success("MFA habilitado com sucesso.");
    } catch (error) {
      toast.error(resolveUiError(error, "Erro ao habilitar MFA").message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisableMfa = async () => {
    if (!mfaDisablePassword || !mfaDisableCode || mfaDisableCode.length !== 6) {
      toast.error("Informe senha atual e codigo MFA de 6 digitos");
      return;
    }
    try {
      setIsSaving(true);
      const data = await usersApi.disableMfa(mfaDisablePassword, mfaDisableCode);
      setMfaEnabled(Boolean(data.enabled));
      setMfaEnrolled(Boolean(data.enrolled));
      setMfaDisableCode("");
      setMfaDisablePassword("");
      setMfaSecret("");
      setMfaUri("");
      toast.success("MFA desabilitado com sucesso.");
    } catch (error) {
      toast.error(resolveUiError(error, "Erro ao desabilitar MFA").message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevokeCookieConsent = () => {
    revokeCookieConsent();
    setCookieStatusText("Nao definido");
    toast.success("Consentimento de cookies revogado. O banner sera exibido novamente.");
  };

  useEffect(() => {
    const tab = searchParams.get("tab") || "notifications";
    setActiveTab(tab);
  }, [searchParams]);

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

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    setSearchParams(next, { replace: true });
  };

  return (
    <MainLayout
      title="Configuracoes"
      subtitle="Gerencie conta, notificacoes e integracoes. Dados do salao ficam em Perfil do Salao."
    >
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 gap-2 h-auto">
          <TabsTrigger value="notifications">Notificacoes</TabsTrigger>
          <TabsTrigger value="account">Conta</TabsTrigger>
          <TabsTrigger value="integrations">Integracoes</TabsTrigger>
          <TabsTrigger value="fiscal">Fiscal</TabsTrigger>
          <TabsTrigger value="salon">Perfil do Salao</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notificacoes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Email</Label>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
              <div className="flex items-center justify-between">
                <Label>SMS</Label>
                <Switch checked={smsNotifications} onCheckedChange={setSmsNotifications} />
              </div>
              <div className="flex items-center justify-between">
                <Label>WhatsApp</Label>
                <Switch checked={whatsappNotifications} onCheckedChange={setWhatsappNotifications} />
              </div>
              <div className="space-y-2">
                <Label>Lembrete (horas)</Label>
                <Input
                  type="number"
                  value={reminderHours}
                  onChange={(e) => setReminderHours(e.target.value)}
                />
              </div>
              <Button onClick={handleSaveNotifications} disabled={isSaving}>
                Salvar
              </Button>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Privacidade de Cookies</CardTitle>
              <CardDescription>
                Gerencie seu consentimento para cookies nao essenciais.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Status atual: {cookieStatusText}</p>
              <Button variant="outline" onClick={handleRevokeCookieConsent}>
                Revogar consentimento
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Dados da Conta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={userName} onChange={(e) => setUserName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleSaveAccount} disabled={isSaving}>
                Salvar
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

          {user?.role === "OWNER" ? (
            <Card className="mt-6">
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
                  Status:{" "}
                  <span className={mfaEnabled ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>
                    {mfaEnabled ? "Habilitado" : "Desabilitado"}
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
                              <img
                                src={mfaQrCodeDataUrl}
                                alt="QR Code MFA"
                                className="h-[180px] w-[180px]"
                              />
                            </div>
                          </div>
                        ) : null}
                        <div className="space-y-1">
                          <Label>Codigo atual do app</Label>
                          <Input
                            value={mfaEnableCode}
                            onChange={(e) => setMfaEnableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
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
                      onChange={(e) => setMfaDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    />
                    <Button variant="destructive" onClick={handleDisableMfa} disabled={isSaving}>
                      Desabilitar MFA
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Integracoes</CardTitle>
              <CardDescription>Configure integracoes externas da sua operacao.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="font-medium flex items-center gap-2">
                    <PlugZap className="h-4 w-4 text-primary" />
                    WhatsApp Cloud API
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Defina credenciais por tenant e valide conexao.
                  </p>
                </div>
                <Button asChild>
                  <Link to="/configuracoes/integracoes/whatsapp">Abrir configuracao</Link>
                </Button>
              </div>
              <div className="rounded-lg border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="font-medium flex items-center gap-2">
                    <Boxes className="h-4 w-4 text-primary" />
                    Estoque
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Parametros de alerta e politicas operacionais de estoque.
                  </p>
                </div>
                <Button asChild variant="outline">
                  <Link to="/configuracoes/estoque">Abrir configuracao</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fiscal">
          <Card>
            <CardHeader>
              <CardTitle>Configuracoes Fiscais</CardTitle>
              <CardDescription>
                Toda configuracao fiscal deve ser acessada a partir desta aba.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="font-medium flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-primary" />
                    Configuracao de Impostos
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Defina regime, aliquotas e parametros fiscais.
                  </p>
                </div>
                <Button asChild>
                  <Link to="/configuracoes/fiscal/impostos">Abrir configuracao</Link>
                </Button>
              </div>
              <div className="rounded-lg border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="font-medium flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Certificados Fiscais
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Gerencie upload, ativacao e remocao de certificado A1 do tenant.
                  </p>
                </div>
                <Button asChild variant="outline">
                  <Link to="/configuracoes/fiscal/certificados">Abrir certificados</Link>
                </Button>
              </div>
              <div className="rounded-lg border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="font-medium flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-primary" />
                    Configuracao NFS-e
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Configure emissao de servicos (municipio, provedor, RPS e capacidades).
                  </p>
                </div>
                <Button asChild variant="outline">
                  <Link to="/configuracoes/fiscal/nfse">Abrir NFS-e</Link>
                </Button>
              </div>
              <div className="rounded-lg border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="font-medium flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-primary" />
                    Modulo NFS-e
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Gerencie rascunhos, autorizacoes, cancelamentos e PDF da NFS-e.
                  </p>
                </div>
                <Button asChild variant="outline">
                  <Link to="/fiscal/nfse">Abrir modulo</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salon">
          <Card>
            <CardHeader>
              <CardTitle>Perfil do Salao</CardTitle>
              <CardDescription>
                Dados do salao, endereco, slug e horarios ficam centralizados em uma unica pagina.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="gap-2">
                <Link to="/perfil-salao">
                  <Building2 className="h-4 w-4" />
                  Abrir Perfil do Salao
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
