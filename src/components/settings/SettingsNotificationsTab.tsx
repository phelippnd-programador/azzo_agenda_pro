import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { settingsApi } from '@/lib/api';
import { resolveUiError } from '@/lib/error-utils';
import {
  hasNonEssentialCookieConsent,
  readCookieConsent,
  revokeCookieConsent,
} from '@/lib/cookie-consent';
import { toast } from 'sonner';

export function SettingsNotificationsTab() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [whatsappNotifications, setWhatsappNotifications] = useState(true);
  const [reminderHours, setReminderHours] = useState('24');
  const [cookieStatusText, setCookieStatusText] = useState('Nao definido');
  const [isSaving, setIsSaving] = useState(false);

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

    const record = readCookieConsent();
    if (!record) {
      setCookieStatusText('Nao definido');
    } else {
      setCookieStatusText(
        hasNonEssentialCookieConsent()
          ? `Aceito (expira em ${new Date(record.expiresAt).toLocaleDateString('pt-BR')})`
          : `Rejeitado (expira em ${new Date(record.expiresAt).toLocaleDateString('pt-BR')})`
      );
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await settingsApi.updateNotifications({
        emailNotifications,
        smsNotifications,
        whatsappNotifications,
        reminderHours: Number(reminderHours || 0),
      });
      toast.success('Notificacoes salvas com sucesso!');
    } catch (error) {
      toast.error(resolveUiError(error, 'Erro ao salvar notificacoes').message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevokeCookieConsent = () => {
    revokeCookieConsent();
    setCookieStatusText('Nao definido');
    toast.success('Consentimento de cookies revogado. O banner sera exibido novamente.');
  };

  return (
    <div className="space-y-6">
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
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacidade de Cookies</CardTitle>
          <CardDescription>Gerencie seu consentimento para cookies nao essenciais.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Status atual: {cookieStatusText}</p>
          <Button variant="outline" onClick={handleRevokeCookieConsent}>
            Revogar consentimento
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
