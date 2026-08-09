import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { loyaltyApi, type LoyaltySettings } from "@/lib/api/loyalty";
import { resolveUiError } from "@/lib/error-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const DEFAULT_SETTINGS: LoyaltySettings = {
  enabled: false,
  pointsPerReal: 1,
  includeProducts: false,
  validityMonths: 12,
  redeemPointsPerReal: 100,
};

/**
 * F08 — programa de fidelidade: pontos por real gasto na comanda, resgatáveis
 * como desconto em atendimentos futuros.
 */
export function LoyaltySettingsCard() {
  const [settings, setSettings] = useState<LoyaltySettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;
    loyaltyApi
      .getSettings()
      .then((data) => {
        if (active) setSettings(data);
      })
      .catch(() => {
        // backend antigo sem o endpoint — mantém defaults silenciosamente
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSave = async () => {
    if (settings.pointsPerReal < 1 || settings.redeemPointsPerReal < 1 || settings.validityMonths < 1) {
      toast.error("Os valores do programa de fidelidade devem ser maiores que zero.");
      return;
    }
    try {
      setIsSaving(true);
      const updated = await loyaltyApi.updateSettings(settings);
      setSettings(updated);
      toast.success("Programa de fidelidade salvo com sucesso.");
    } catch (error) {
      toast.error(resolveUiError(error, "Não foi possível salvar o programa de fidelidade.").message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Star className="h-4 w-4 text-primary" />
          Programa de fidelidade
        </CardTitle>
        <CardDescription>
          O cliente acumula pontos a cada comanda fechada e pode trocá-los por desconto em atendimentos futuros.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <Label htmlFor="loyalty-enabled">Programa ativo</Label>
                <p className="text-xs text-muted-foreground">Habilita o acúmulo e resgate de pontos.</p>
              </div>
              <Switch
                id="loyalty-enabled"
                checked={settings.enabled}
                onCheckedChange={(checked) => setSettings((s) => ({ ...s, enabled: checked }))}
              />
            </div>

            {settings.enabled && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="loyalty-points-per-real">Pontos ganhos por R$1 gasto</Label>
                  <Input
                    id="loyalty-points-per-real"
                    type="number"
                    min={1}
                    className="max-w-[140px]"
                    value={settings.pointsPerReal}
                    onChange={(e) => setSettings((s) => ({ ...s, pointsPerReal: Number(e.target.value) }))}
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <Label htmlFor="loyalty-include-products">Produtos também acumulam pontos</Label>
                    <p className="text-xs text-muted-foreground">
                      Quando desativado, só serviços contam para o acúmulo.
                    </p>
                  </div>
                  <Switch
                    id="loyalty-include-products"
                    checked={settings.includeProducts}
                    onCheckedChange={(checked) => setSettings((s) => ({ ...s, includeProducts: checked }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="loyalty-validity">Validade dos pontos (meses)</Label>
                  <Input
                    id="loyalty-validity"
                    type="number"
                    min={1}
                    className="max-w-[140px]"
                    value={settings.validityMonths}
                    onChange={(e) => setSettings((s) => ({ ...s, validityMonths: Number(e.target.value) }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="loyalty-redeem">Pontos necessários para R$1 de desconto</Label>
                  <Input
                    id="loyalty-redeem"
                    type="number"
                    min={1}
                    className="max-w-[140px]"
                    value={settings.redeemPointsPerReal}
                    onChange={(e) => setSettings((s) => ({ ...s, redeemPointsPerReal: Number(e.target.value) }))}
                  />
                </div>
              </>
            )}

            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar fidelidade"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
