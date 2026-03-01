import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { stockApi } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import type { StockSettings } from "@/types/stock";

export default function StockSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<StockSettings | null>(null);

  const load = async () => {
    try {
      setIsLoading(true);
      const response = await stockApi.getSettings();
      setSettings(response);
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel carregar configuracoes de estoque.").message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    if (settings.diasCoberturaMeta <= 0) {
      toast.error("Dias de cobertura deve ser maior que zero.");
      return;
    }
    try {
      setIsSaving(true);
      const updated = await stockApi.updateSettings(settings);
      setSettings(updated);
      toast.success("Configuracoes salvas com sucesso.");
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel salvar configuracoes.").message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !settings) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuracoes de estoque</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.alertaEstoqueMinimoAtivo}
            onChange={(e) =>
              setSettings((prev) =>
                prev ? { ...prev, alertaEstoqueMinimoAtivo: e.target.checked } : prev
              )
            }
          />
          Ativar alerta de estoque minimo
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.bloquearSaidaSemSaldo}
            onChange={(e) =>
              setSettings((prev) => (prev ? { ...prev, bloquearSaidaSemSaldo: e.target.checked } : prev))
            }
          />
          Bloquear saida sem saldo
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.permitirAjusteNegativoComPermissao}
            onChange={(e) =>
              setSettings((prev) =>
                prev ? { ...prev, permitirAjusteNegativoComPermissao: e.target.checked } : prev
              )
            }
          />
          Permitir ajuste negativo com permissao
        </label>

        <div className="space-y-1">
          <Label>Dias de cobertura meta</Label>
          <Input
            type="number"
            min="1"
            value={settings.diasCoberturaMeta}
            onChange={(e) =>
              setSettings((prev) => (prev ? { ...prev, diasCoberturaMeta: Number(e.target.value || 0) } : prev))
            }
          />
        </div>

        <Button onClick={() => void handleSave()} disabled={isSaving}>
          {isSaving ? "Salvando..." : "Salvar configuracoes"}
        </Button>
      </CardContent>
    </Card>
  );
}
