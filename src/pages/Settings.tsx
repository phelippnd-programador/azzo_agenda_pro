import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PlugZap, Building2 } from "lucide-react";
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

export default function Settings() {
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
    } catch {
      toast.error("Erro ao salvar notificacoes");
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
    } catch {
      toast.error("Erro ao salvar dados da conta");
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
    } catch {
      toast.error("Erro ao alterar senha");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MainLayout
      title="Configuracoes"
      subtitle="Gerencie conta, notificacoes e integracoes. Dados do salao ficam em Perfil do Salao."
    >
      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2 h-auto">
          <TabsTrigger value="notifications">Notificacoes</TabsTrigger>
          <TabsTrigger value="account">Conta</TabsTrigger>
          <TabsTrigger value="integrations">Integracoes</TabsTrigger>
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
                    <PlugZap className="h-4 w-4 text-violet-600" />
                    WhatsApp Cloud API
                  </p>
                  <p className="text-sm text-gray-500">
                    Defina credenciais por tenant e valide conexao.
                  </p>
                </div>
                <Button asChild>
                  <Link to="/configuracoes/integracoes/whatsapp">Abrir configuracao</Link>
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
