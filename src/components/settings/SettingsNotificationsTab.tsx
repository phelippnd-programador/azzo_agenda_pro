import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  const [reactivationEnabled, setReactivationEnabled] = useState(true);
  const [reactivationRespectBusinessHours, setReactivationRespectBusinessHours] = useState(true);
  const [reactivationSendWindowStart, setReactivationSendWindowStart] = useState('09:00');
  const [reactivationSendWindowEnd, setReactivationSendWindowEnd] = useState('19:00');
  const [reactivationMaxAttemptsEnabled, setReactivationMaxAttemptsEnabled] = useState('3');
  const [cookieStatusText, setCookieStatusText] = useState('Nao definido');
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingReactivation, setIsSavingReactivation] = useState(false);

  useEffect(() => {
    settingsApi
      .get()
      .then((data) => {
        setEmailNotifications(data.notifications.emailNotifications);
        setSmsNotifications(data.notifications.smsNotifications);
        setWhatsappNotifications(data.notifications.whatsappNotifications);
        setReminderHours(String(data.notifications.reminderHours));
        setReactivationEnabled(data.reactivation?.enabled ?? true);
        setReactivationRespectBusinessHours(data.reactivation?.respectBusinessHours ?? true);
        setReactivationSendWindowStart(data.reactivation?.sendWindowStart || '09:00');
        setReactivationSendWindowEnd(data.reactivation?.sendWindowEnd || '19:00');
        setReactivationMaxAttemptsEnabled(String(data.reactivation?.maxAttemptsEnabled ?? 3));
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

  const handleSaveReactivation = async () => {
    setIsSavingReactivation(true);
    try {
      await settingsApi.updateReactivation({
        enabled: reactivationEnabled,
        respectBusinessHours: reactivationRespectBusinessHours,
        sendWindowStart: reactivationSendWindowStart,
        sendWindowEnd: reactivationSendWindowEnd,
        maxAttemptsEnabled: Number(reactivationMaxAttemptsEnabled || 3),
      });
      toast.success('Reativacao salva com sucesso!');
    } catch (error) {
      toast.error(resolveUiError(error, 'Erro ao salvar configuracoes de reativacao').message);
    } finally {
      setIsSavingReactivation(false);
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
          <CardTitle>Reativacao de abandono no WhatsApp</CardTitle>
          <CardDescription>
            Configure quando o sistema pode tentar recuperar clientes que pararam no meio do agendamento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Fluxo ativo</Label>
            <Switch checked={reactivationEnabled} onCheckedChange={setReactivationEnabled} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Respeitar horario comercial</Label>
            <Switch
              checked={reactivationRespectBusinessHours}
              onCheckedChange={setReactivationRespectBusinessHours}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Janela inicial</Label>
              <Input
                type="time"
                value={reactivationSendWindowStart}
                onChange={(e) => setReactivationSendWindowStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Janela final</Label>
              <Input
                type="time"
                value={reactivationSendWindowEnd}
                onChange={(e) => setReactivationSendWindowEnd(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Rollout do scheduler</Label>
            <Select value={reactivationMaxAttemptsEnabled} onValueChange={setReactivationMaxAttemptsEnabled}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a cadencia liberada" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Somente D+2</SelectItem>
                <SelectItem value="2">D+2 e D+4</SelectItem>
                <SelectItem value="3">D+2, D+4 e D+7</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Use esta configuracao para liberar a reativacao de forma gradual sem desligar o fluxo inteiro.
            </p>
          </div>
          <Button onClick={handleSaveReactivation} disabled={isSavingReactivation}>
            {isSavingReactivation ? 'Salvando...' : 'Salvar reativacao'}
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
