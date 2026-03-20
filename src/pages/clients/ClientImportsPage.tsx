import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { PageEmptyState } from "@/components/ui/page-states";
import { clientImportApi } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import type {
  ClientImportErrorLine,
  ClientImportJob,
  ClientImportMode,
  ClientImportTemplateFormat,
} from "@/types/client-import";
import { formatDateTime } from "@/pages/stock/utils";

const IMPORT_MODE_OPTIONS: ClientImportMode[] = ["INSERT_ONLY", "UPSERT"];
const IMPORT_MODE_LABELS: Record<ClientImportMode, string> = {
  INSERT_ONLY: "Inserir somente novos",
  UPSERT: "Inserir e atualizar existentes",
};

export default function ClientImportsPage() {
  const [jobs, setJobs] = useState<ClientImportJob[]>([]);
  const [errorsByJob, setErrorsByJob] = useState<Record<string, ClientImportErrorLine[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [modoImportacao, setModoImportacao] = useState<ClientImportMode>("INSERT_ONLY");
  const [formatoModelo, setFormatoModelo] = useState<ClientImportTemplateFormat>("xlsx");
  const [dryRun, setDryRun] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const load = async () => {
    try {
      setIsLoading(true);
      const list = await clientImportApi.listImportJobs();
      setJobs(list);
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel carregar importacoes de clientes.").message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const hasRunningJob = useMemo(
    () => jobs.some((job) => ["RECEBIDO", "EM_VALIDACAO", "PROCESSANDO"].includes(job.status)),
    [jobs]
  );

  useEffect(() => {
    if (!hasRunningJob) return;
    const timer = window.setInterval(() => {
      void load();
    }, 10000);
    return () => window.clearInterval(timer);
  }, [hasRunningJob]);

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error("Selecione um arquivo para importar.");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await clientImportApi.createImportJob({
        arquivo: selectedFile,
        modoImportacao,
        dryRun,
      });
      toast.success("Importacao de clientes enviada com sucesso.");
      setJobs((prev) => [created, ...prev]);
      setSelectedFile(null);
      setPage(1);
    } catch (error) {
      toast.error(resolveUiError(error, "Erro ao enviar importacao de clientes.").message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoadErrors = async (jobId: string) => {
    try {
      const errors = await clientImportApi.getImportErrors(jobId);
      setErrorsByJob((prev) => ({ ...prev, [jobId]: errors }));
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel carregar erros da importacao.").message);
    }
  };

  const handleCancel = async (jobId: string) => {
    try {
      const updated = await clientImportApi.cancelImportJob(jobId);
      setJobs((prev) => prev.map((job) => (job.jobId === jobId ? updated : job)));
      toast.success("Importacao cancelada.");
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel cancelar importacao.").message);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      const blob = await clientImportApi.downloadImportTemplate({ formato: formatoModelo });
      const fileName = `modelo-importacao-clientes.${formatoModelo}`;
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Modelo baixado com sucesso.");
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel baixar o modelo.").message);
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const sortedJobs = useMemo(
    () => [...jobs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [jobs]
  );
  const pagedJobs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedJobs.slice(start, start + pageSize);
  }, [sortedJobs, page]);
  const totalPages = Math.max(1, Math.ceil(sortedJobs.length / pageSize));

  const getStatusVariant = (status: ClientImportJob["status"]) => {
    if (status === "FALHOU" || status === "CONCLUIDO_COM_ERROS") return "destructive" as const;
    if (status === "CONCLUIDO") return "secondary" as const;
    if (status === "CANCELADO") return "outline" as const;
    return "default" as const;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Nova importacao de clientes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <Label>Modo de importacao</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={modoImportacao}
                onChange={(e) => setModoImportacao(e.target.value as ClientImportMode)}
              >
                {IMPORT_MODE_OPTIONS.map((option) => (
                  <option key={option} value={option}>{IMPORT_MODE_LABELS[option]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Formato do modelo</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={formatoModelo}
                onChange={(e) => setFormatoModelo(e.target.value as ClientImportTemplateFormat)}
              >
                <option value="xlsx">XLSX</option>
                <option value="csv">CSV</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Arquivo (xlsx/csv)</Label>
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
            Simular importacao sem salvar
          </label>
          <p className="text-xs text-muted-foreground">
            Quando ativado, o sistema valida o arquivo e mostra erros, mas nao cria nem atualiza clientes.
          </p>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => void handleDownloadTemplate()}
              disabled={isDownloadingTemplate}
            >
              <Download className="h-4 w-4" />
              {isDownloadingTemplate ? "Baixando..." : "Baixar modelo"}
            </Button>
            <Button className="gap-2" onClick={() => void handleSubmit()} disabled={isSubmitting}>
              <Upload className="h-4 w-4" />
              {isSubmitting ? "Enviando..." : "Enviar importacao"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Historico de importacoes</CardTitle>
            {hasRunningJob ? (
              <Badge variant="default">Atualizando automaticamente</Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : !sortedJobs.length ? (
            <PageEmptyState
              title="Nenhuma importacao encontrada"
              description="Envie um arquivo para criar o primeiro job de importacao de clientes."
            />
          ) : (
            pagedJobs.map((job) => {
              const errors = errorsByJob[job.jobId] || [];
              const canCancel = ["RECEBIDO", "EM_VALIDACAO", "PROCESSANDO"].includes(job.status);
              return (
                <div key={job.jobId} className="rounded-md border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{IMPORT_MODE_LABELS[job.modoImportacao]}</Badge>
                      <Badge variant={getStatusVariant(job.status)}>{job.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Criado em: {formatDateTime(job.createdAt)}</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Processadas: {job.linhasProcessadas}/{job.linhasRecebidas} | Sucesso: {job.linhasSucesso} | Erros: {job.linhasErro}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/clientes/importacoes/${job.jobId}`}>Detalhes</Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => void handleLoadErrors(job.jobId)}>Ver erros</Button>
                    <Button variant="outline" size="sm" onClick={() => void handleCancel(job.jobId)} disabled={!canCancel}>
                      Cancelar
                    </Button>
                  </div>
                  {!!errors.length && (
                    <div className="mt-2 rounded-md bg-muted p-2 text-xs">
                      {errors.slice(0, 5).map((line, index) => (
                        <p key={`${line.linha}-${line.coluna}-${index}`}>
                          Linha {line.linha} / {line.coluna || "-"}: {line.mensagem}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <PaginationControls
            page={page}
            totalPages={totalPages}
            isLoading={isLoading}
            onPrevious={() => setPage((prev) => Math.max(1, prev - 1))}
            onNext={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
