import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { settingsApi } from '@/lib/api';
import { resolveUiError } from '@/lib/error-utils';
import { toast } from 'sonner';
import { Cpu } from 'lucide-react';
import type { TenantFeatureFlags } from '@/lib/api';

const DEFAULT_FLAGS: TenantFeatureFlags = {
  asaasEnabled: false,
  minioEnabled: false,
  chatRetentionDaysCompleted: 180,
  chatRetentionDaysCanceled: 90,
  chatRetentionDaysDefault: 365,
  auditRetentionDays: 365,
};

export function SettingsFeatureFlagsTab() {
  const [flags, setFlags] = useState<TenantFeatureFlags>(DEFAULT_FLAGS);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    settingsApi
      .getFeatureFlags()
      .then((data) => setFlags(data))
      .catch(() => undefined);
  }, []);

  const handleToggle = (field: keyof Pick<TenantFeatureFlags, 'asaasEnabled' | 'minioEnabled'>) => {
    setFlags((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleNumber = (field: keyof TenantFeatureFlags, value: string) => {
    setFlags((prev) => ({ ...prev, [field]: Number(value) || 0 }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await settingsApi.updateFeatureFlags(flags);
      toast.success('Configuracoes de recursos salvas com sucesso!');
    } catch (error) {
      toast.error(resolveUiError(error, 'Erro ao salvar configuracoes de recursos').message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary" />
            Integracoes
          </CardTitle>
          <CardDescription>
            Ative ou desative modulos opcionais do tenant. Alteracoes tem efeito imediato.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Asaas (pagamentos)</Label>
              <p className="text-xs text-muted-foreground">
                Habilita a integracao de cobran&ccedil;as e pagamentos via Asaas.
              </p>
            </div>
            <Switch
              checked={flags.asaasEnabled}
              onCheckedChange={() => handleToggle('asaasEnabled')}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">MinIO (armazenamento de arquivos)</Label>
              <p className="text-xs text-muted-foreground">
                Habilita o armazenamento de arquivos via MinIO para o tenant.
              </p>
            </div>
            <Switch
              checked={flags.minioEnabled}
              onCheckedChange={() => handleToggle('minioEnabled')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Retencao de dados</CardTitle>
          <CardDescription>
            Define por quantos dias os registros sao retidos antes da exclusao automatica.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Alteracoes na retencao de dados so afetam novos registros criados apos a mudanca.
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="retention-completed">Retencao de conversas concluidas (dias)</Label>
              <Input
                id="retention-completed"
                type="number"
                min={1}
                value={flags.chatRetentionDaysCompleted}
                onChange={(e) => handleNumber('chatRetentionDaysCompleted', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="retention-canceled">Retencao de conversas canceladas (dias)</Label>
              <Input
                id="retention-canceled"
                type="number"
                min={1}
                value={flags.chatRetentionDaysCanceled}
                onChange={(e) => handleNumber('chatRetentionDaysCanceled', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="retention-default">Retencao padrao de conversas (dias)</Label>
              <Input
                id="retention-default"
                type="number"
                min={1}
                value={flags.chatRetentionDaysDefault}
                onChange={(e) => handleNumber('chatRetentionDaysDefault', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="retention-audit">Retencao de registros de auditoria (dias)</Label>
              <Input
                id="retention-audit"
                type="number"
                min={1}
                value={flags.auditRetentionDays}
                onChange={(e) => handleNumber('auditRetentionDays', e.target.value)}
              />
            </div>
          </div>

          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar configuracoes'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
