import { useEffect, useState } from "react";
import { Copy, ExternalLink, MapPinned } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { googleBookingApi, type GoogleBookingConfig } from "@/lib/api/google-booking";
import { resolveUiError } from "@/lib/error-utils";
import { toast } from "sonner";

export default function GoogleBookingSettingsPage() {
  const [config, setConfig] = useState<GoogleBookingConfig>({ habilitado: false, placeId: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    googleBookingApi
      .obter()
      .then((data) => {
        if (active) setConfig(data);
      })
      .catch((error) => toast.error(resolveUiError(error, "Nao foi possivel carregar a configuracao.").message))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await googleBookingApi.salvar({
        habilitado: config.habilitado,
        placeId: config.placeId,
      });
      setConfig(updated);
      toast.success("Configuracao do Google salva.");
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel salvar a configuracao.").message);
    } finally {
      setSaving(false);
    }
  };

  const copyLink = async () => {
    if (!config.bookingLink) return;
    await navigator.clipboard.writeText(config.bookingLink);
    toast.success("Link copiado.");
  };

  return (
    <MainLayout
      title="Reserve with Google"
      subtitle="Use o link publico do salao com atribuicao de origem Google"
    >
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPinned className="h-5 w-5 text-primary" />
            Configuracao do Google
          </CardTitle>
          <CardDescription>
            O modo simples direciona o Perfil da Empresa no Google para o link de agendamento do salao.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4 rounded-md border p-4">
                <div>
                  <Label htmlFor="google-booking-enabled">Habilitar atribuicao Google</Label>
                  <p className="text-sm text-muted-foreground">Exige Place ID preenchido para ativar.</p>
                </div>
                <Switch
                  id="google-booking-enabled"
                  checked={config.habilitado}
                  onCheckedChange={(value) => setConfig((current) => ({ ...current, habilitado: value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="google-place-id">Place ID do salao</Label>
                <Input
                  id="google-place-id"
                  value={config.placeId || ""}
                  placeholder="Ex.: ChIJ..."
                  onChange={(event) => setConfig((current) => ({ ...current, placeId: event.target.value }))}
                />
              </div>

              <div className="space-y-2 rounded-md border bg-muted/30 p-4">
                <Label>Link para configurar no Google Business Profile</Label>
                <div className="flex gap-2">
                  <Input value={config.bookingLink || "Link indisponivel enquanto o slug publico nao existir"} readOnly />
                  <Button type="button" variant="outline" size="icon" disabled={!config.bookingLink} onClick={copyLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  {config.bookingLink ? (
                    <Button type="button" variant="outline" size="icon" asChild>
                      <a href={config.bookingLink} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  ) : null}
                </div>
              </div>

              <Button onClick={save} disabled={saving}>
                {saving ? "Salvando..." : "Salvar configuracao"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}
