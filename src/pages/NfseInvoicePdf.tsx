import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { nfseApi } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import { toast } from "sonner";

export default function NfseInvoicePdf() {
  const { id = "" } = useParams();
  const [status, setStatus] = useState<string>("IDLE");
  const [jobId, setJobId] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const showError = (error: unknown, fallbackMessage: string) => {
    const uiError = resolveUiError(error, fallbackMessage);
    toast.error(uiError.code ? `[${uiError.code}] ${uiError.message}` : uiError.message);
  };

  const gerarEbaixar = async () => {
    if (!id) return;
    try {
      setIsProcessing(true);
      setStatus("QUEUED");
      const job = await nfseApi.requestInvoicePdfJob(id);
      setJobId(job.jobId);
      let attempts = 0;
      while (attempts < 30) {
        const current = await nfseApi.getInvoicePdfJobStatus(id, job.jobId);
        setStatus(current.status);
        if (current.status === "DONE") {
          const blob = await nfseApi.downloadInvoicePdfJob(id, job.jobId);
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = `nfse-${id}.pdf`;
          anchor.click();
          URL.revokeObjectURL(url);
          toast.success("PDF da NFS-e gerado e baixado.");
          return;
        }
        if (current.status === "ERROR") {
          toast.error(current.errorMessage || "Falha ao gerar PDF da NFS-e.");
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
        attempts += 1;
      }
      toast.warning("Geracao ainda em andamento. Tente novamente em alguns instantes.");
    } catch (error) {
      showError(error, "Erro ao gerar PDF da NFS-e");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <MainLayout title="PDF NFS-e" subtitle="Geracao assincrona com download unico e expiracao por seguranca.">
      <Card>
        <CardHeader>
          <CardTitle>Gerador de PDF</CardTitle>
          <CardDescription>Invoice: {id || "--"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">Job atual: <strong>{jobId || "--"}</strong></p>
          <p className="text-sm">Status: <strong>{status}</strong></p>
          <div className="flex gap-2">
            <Button onClick={gerarEbaixar} disabled={isProcessing || !id}>
              {isProcessing ? "Processando..." : "Gerar e baixar PDF"}
            </Button>
            <Button asChild variant="outline">
              <Link to={`/fiscal/nfse/${id}`}>Voltar detalhes</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
