import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
    return (
      <MainLayout
        title="Configuracoes de estoque"
        subtitle="Parametros de alerta e politicas operacionais do modulo de estoque."
      >
        <Skeleton className="h-64 w-full" />
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title="Configuracoes de estoque"
      subtitle="Parametros de alerta e politicas operacionais do modulo de estoque."
    >
      <Card className="border-border/80">
        <CardHeader>
          <CardTitle>Configuracoes de estoque</CardTitle>
          <p className="text-sm text-muted-foreground">
            Defina alertas e travas operacionais para manter a rotina de estoque consistente.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <label className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
              <Checkbox
                checked={settings.alertaEstoqueMinimoAtivo}
                onCheckedChange={(checked) =>
                  setSettings((prev) =>
                    prev ? { ...prev, alertaEstoqueMinimoAtivo: checked === true } : prev
                  )
                }
              />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Ativar alerta de estoque minimo</p>
                <p className="text-xs text-muted-foreground">
                  Sinaliza itens com saldo abaixo do nivel configurado.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
              <Checkbox
                checked={settings.bloquearSaidaSemSaldo}
                onCheckedChange={(checked) =>
                  setSettings((prev) =>
                    prev ? { ...prev, bloquearSaidaSemSaldo: checked === true } : prev
                  )
                }
              />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Bloquear saida sem saldo</p>
                <p className="text-xs text-muted-foreground">
                  Evita movimentacoes que levem o item para saldo indisponivel.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
              <Checkbox
                checked={settings.permitirAjusteNegativoComPermissao}
                onCheckedChange={(checked) =>
                  setSettings((prev) =>
                    prev ? { ...prev, permitirAjusteNegativoComPermissao: checked === true } : prev
                  )
                }
              />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Permitir ajuste negativo com permissao</p>
                <p className="text-xs text-muted-foreground">
                  Libera ajustes excepcionais mediante autorizacao apropriada.
                </p>
              </div>
            </label>
          </div>

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
            <p className="text-xs text-muted-foreground">
              Referencia usada para acompanhar previsao de cobertura dos itens.
            </p>
          </div>

          <Button onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar configuracoes"}
          </Button>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
