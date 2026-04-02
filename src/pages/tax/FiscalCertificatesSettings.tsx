import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { fiscalApi, type FiscalCertificateResponse } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import { toast } from "sonner";

export default function FiscalCertificatesSettings() {
  const [certificates, setCertificates] = useState<FiscalCertificateResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [certificateToDelete, setCertificateToDelete] = useState<string | null>(null);
  const [isDeletingCertificate, setIsDeletingCertificate] = useState(false);

  const activeCertificate = useMemo(
    () => certificates.find((item) => item.status === "ACTIVE") || null,
    [certificates]
  );

  const loadCertificates = async () => {
    try {
      setIsLoading(true);
      const data = await fiscalApi.listCertificates();
      setCertificates(data);
    } catch (error) {
      toast.error(resolveUiError(error, "Erro ao carregar certificados fiscais").message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCertificates();
  }, []);

  const toBase64 = (selectedFile: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result !== "string") {
          reject(new Error("Falha ao converter certificado para base64."));
          return;
        }
        const base64 = result.includes(",") ? result.split(",")[1] : result;
        resolve(base64);
      };
      reader.onerror = () => reject(new Error("Falha ao ler o arquivo do certificado."));
      reader.readAsDataURL(selectedFile);
    });

  const handleUpload = async () => {
    if (!file) {
      toast.error("Selecione o arquivo do certificado (.pfx/.p12).");
      return;
    }
    if (!password.trim()) {
      toast.error("Informe a senha do certificado.");
      return;
    }

    try {
      setIsSubmitting(true);
      const pfxBase64 = await toBase64(file);
      await fiscalApi.uploadCertificate(pfxBase64, password.trim());
      toast.success("Certificado fiscal enviado com sucesso.");
      setFile(null);
      setPassword("");
      await loadCertificates();
    } catch (error) {
      toast.error(resolveUiError(error, "Erro ao enviar certificado fiscal").message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      setIsSubmitting(true);
      await fiscalApi.activateCertificate(id);
      toast.success("Certificado ativado com sucesso.");
      await loadCertificates();
    } catch (error) {
      toast.error(resolveUiError(error, "Erro ao ativar certificado").message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteDialog = (id: string) => {
    setCertificateToDelete(id);
  };

  const handleDelete = async () => {
    if (!certificateToDelete) return;
    try {
      setIsDeletingCertificate(true);
      await fiscalApi.deleteCertificate(certificateToDelete);
      toast.success("Certificado removido com sucesso.");
      await loadCertificates();
      setCertificateToDelete(null);
    } catch (error) {
      toast.error(resolveUiError(error, "Erro ao remover certificado").message);
    } finally {
      setIsDeletingCertificate(false);
    }
  };

  return (
    <MainLayout title="Certificados Fiscais" subtitle="Gerencie certificado A1 por tenant.">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload de Certificado A1</CardTitle>
            <CardDescription>
              Envie arquivo `.pfx` ou `.p12`. O sistema mantera apenas um certificado ativo por tenant.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fiscal-cert-file">Arquivo do certificado</Label>
              <Input
                id="fiscal-cert-file"
                type="file"
                accept=".pfx,.p12,application/x-pkcs12"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fiscal-cert-password">Senha do certificado</Label>
              <Input
                id="fiscal-cert-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha do certificado"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleUpload} disabled={isSubmitting}>
                {isSubmitting ? "Processando..." : "Enviar Certificado"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Certificados Cadastrados</CardTitle>
            <CardDescription>
              Certificado ativo atual: {activeCertificate?.subjectName || "Nenhum certificado ativo"}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando certificados...</p>
            ) : certificates.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum certificado cadastrado.</p>
            ) : (
              certificates.map((item) => (
                <div key={item.id} className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{item.subjectName}</p>
                    <Badge variant={item.status === "ACTIVE" ? "default" : "outline"}>
                      {item.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground break-all">Thumbprint: {item.thumbprint}</p>
                  <p className="text-xs text-muted-foreground">
                    Validade: {new Date(item.validTo).toLocaleDateString("pt-BR")}
                  </p>
                  <div className="flex gap-2 justify-end">
                    {item.status !== "ACTIVE" ? (
                      <Button
                        variant="outline"
                        onClick={() => handleActivate(item.id)}
                        disabled={isSubmitting}
                      >
                        Ativar
                      </Button>
                    ) : null}
                    <Button
                      variant="destructive"
                      onClick={() => openDeleteDialog(item.id)}
                      disabled={isSubmitting}
                    >
                      Remover
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button asChild variant="outline">
            <Link to="/configuracoes?tab=fiscal">Voltar para Configuracoes</Link>
          </Button>
        </div>

        <DeleteConfirmationDialog
          open={!!certificateToDelete}
          isLoading={isDeletingCertificate}
          title="Remover certificado?"
          description="Tem certeza que deseja remover este certificado? Esta acao nao pode ser desfeita."
          onOpenChange={(open) => {
            if (isDeletingCertificate) return;
            if (!open) setCertificateToDelete(null);
          }}
          onConfirm={handleDelete}
        />
      </div>
    </MainLayout>
  );
}
