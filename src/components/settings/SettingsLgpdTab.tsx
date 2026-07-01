import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { settingsApi } from '@/lib/api';
import { resolveUiError } from '@/lib/error-utils';
import { toast } from 'sonner';
import { ShieldCheck } from 'lucide-react';

export function SettingsLgpdTab() {
  const [lgpdContactEmail, setLgpdContactEmail] = useState('');
  const [lgpdContactChannel, setLgpdContactChannel] = useState('');
  const [lgpdContactResponseSlaDays, setLgpdContactResponseSlaDays] = useState('15');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    settingsApi
      .getLgpdContact()
      .then((data) => {
        setLgpdContactEmail(data.lgpdContactEmail ?? '');
        setLgpdContactChannel(data.lgpdContactChannel ?? '');
        setLgpdContactResponseSlaDays(String(data.lgpdContactResponseSlaDays ?? 15));
      })
      .catch(() => undefined);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await settingsApi.updateLgpdContact({
        lgpdContactEmail: lgpdContactEmail || null,
        lgpdContactChannel: lgpdContactChannel || null,
        lgpdContactResponseSlaDays: Number(lgpdContactResponseSlaDays || 15),
      });
      toast.success('Configuracoes LGPD salvas com sucesso!');
    } catch (error) {
      toast.error(resolveUiError(error, 'Erro ao salvar configuracoes LGPD').message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Contato LGPD
          </CardTitle>
          <CardDescription>
            Defina o canal de contato para solicitacoes de titulares de dados conforme a Lei Geral de Protecao de Dados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
            Essas informacoes sao exibidas quando o titular de dados solicita acesso, correcao ou exclusao de seus dados.
          </div>

          <div className="space-y-2">
            <Label htmlFor="lgpd-email">E-mail do responsavel LGPD</Label>
            <Input
              id="lgpd-email"
              type="email"
              placeholder="dpo@exemplo.com.br"
              value={lgpdContactEmail}
              onChange={(e) => setLgpdContactEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lgpd-channel">Canal de atendimento</Label>
            <Input
              id="lgpd-channel"
              type="text"
              placeholder="ex: WhatsApp, e-mail, formulario online"
              value={lgpdContactChannel}
              onChange={(e) => setLgpdContactChannel(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lgpd-sla">Prazo de resposta (dias)</Label>
            <Input
              id="lgpd-sla"
              type="number"
              min={1}
              max={60}
              value={lgpdContactResponseSlaDays}
              onChange={(e) => setLgpdContactResponseSlaDays(e.target.value)}
              className="max-w-[140px]"
            />
            <p className="text-xs text-muted-foreground">
              Padrao legal: 15 dias. Maximo configuravel: 60 dias.
            </p>
          </div>

          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar configuracoes LGPD'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
