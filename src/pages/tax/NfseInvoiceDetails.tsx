import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nfseApi, type NfseInvoice } from "@/lib/api";
import {
  requiresFiscalTaxConfiguration,
  requiresNfseConfiguration,
  resolveUiError,
} from "@/lib/error-utils";
import { toast } from "sonner";

export default function NfseInvoiceDetails() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<NfseInvoice | null>(null);
  const [certificatePassword, setCertificatePassword] = useState("");
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlockTokenId, setUnlockTokenId] = useState<string | undefined>(undefined);
  const [cancelReason, setCancelReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const showError = (error: unknown, fallbackMessage: string) => {
    const uiError = resolveUiError(error, fallbackMessage);
    toast.error(uiError.code ? `[${uiError.code}] ${uiError.message}` : uiError.message);
  };

  const load = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const [invoiceResponse, unlockStatus] = await Promise.all([
        nfseApi.getInvoice(id),
        nfseApi.getCertificateUnlockStatus().catch(() => ({ active: false, status: "INACTIVE" })),
      ]);
      setInvoice(invoiceResponse);
      setUnlockTokenId(unlockStatus.active ? unlockStatus.unlockTokenId : undefined);
    } catch (error) {
      showError(error, "Erro ao carregar detalhes da NFS-e");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  return (
    <MainLayout title="Detalhes NFS-e" subtitle="Autorizacao, cancelamento e geracao de PDF do documento.">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Documento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>ID:</strong> {invoice?.id || "--"}</p>
            <p><strong>Status fiscal:</strong> {invoice?.fiscalStatus || "--"}</p>
            <p><strong>Status operacional:</strong> {invoice?.operationalStatus || "--"}</p>
            <p><strong>Numero NFS-e:</strong> {invoice?.numeroNfse || "--"}</p>
            <p><strong>RPS:</strong> {invoice?.numeroRps || "--"}</p>
            <p><strong>Tomador:</strong> {invoice?.customer?.name || "--"}</p>
            <p><strong>Valor:</strong> R$ {(invoice?.valorServicos || 0).toFixed(2)}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              {invoice?.fiscalStatus === "DRAFT" && (
                <Button asChild variant="outline" size="sm">
                  <Link to={`/fiscal/nfse/${id}/editar`}>Editar rascunho</Link>
                </Button>
              )}
              <Button asChild variant="outline" size="sm">
                <Link to={`/fiscal/nfse/${id}/pdf`}>Abrir PDF</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Desbloqueio de certificado (opcional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Senha do certificado para criar sessao temporaria</Label>
              <Input
                type="password"
                value={unlockPassword}
                onChange={(e) => setUnlockPassword(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const status = await nfseApi.createCertificateUnlock(unlockPassword.trim());
                    setUnlockTokenId(status.unlockTokenId);
                    setUnlockPassword("");
                    toast.success("Sessao de desbloqueio criada.");
                  } catch (error) {
                    showError(error, "Erro ao desbloquear certificado");
                  }
                }}
              >
                Criar sessao
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await nfseApi.revokeCertificateUnlock();
                    setUnlockTokenId(undefined);
                    toast.success("Sessao de desbloqueio revogada.");
                  } catch (error) {
                    showError(error, "Erro ao revogar desbloqueio");
                  }
                }}
              >
                Revogar sessao
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Token ativo: <strong>{unlockTokenId || "--"}</strong>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acoes fiscais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Senha do certificado (deixe vazio para usar unlock token)</Label>
              <Input
                type="password"
                value={certificatePassword}
                onChange={(e) => setCertificatePassword(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={async () => {
                  if (!id) return;
                  try {
                    await nfseApi.authorizeInvoice(id, {
                      certificatePassword: certificatePassword.trim() || undefined,
                      unlockTokenId: !certificatePassword.trim() ? unlockTokenId : undefined,
                    });
                    toast.success("NFS-e enviada para autorizacao.");
                    await load();
                  } catch (error) {
                    if (requiresFiscalTaxConfiguration(error)) {
                      toast.error("Configure os dados fiscais do emitente antes de emitir a nota.");
                      navigate("/configuracoes/fiscal/impostos");
                      return;
                    }
                    if (requiresNfseConfiguration(error)) {
                      toast.error("Configure a NFS-e deste ambiente antes de emitir a nota.");
                      navigate("/configuracoes/fiscal/nfse");
                      return;
                    }
                    showError(error, "Erro ao autorizar NFS-e");
                  }
                }}
                disabled={!id || isLoading}
              >
                Autorizar
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!id || !cancelReason.trim()) {
                    toast.error("Informe o motivo do cancelamento.");
                    return;
                  }
                  try {
                    await nfseApi.cancelInvoice(id, cancelReason.trim());
                    toast.success("Cancelamento solicitado com sucesso.");
                    await load();
                  } catch (error) {
                    showError(error, "Erro ao cancelar NFS-e");
                  }
                }}
              >
                Cancelar
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Motivo cancelamento</Label>
              <Input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
