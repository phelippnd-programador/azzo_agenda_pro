import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { PageEmptyState } from "@/components/ui/page-states";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { stockApi } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import type {
  StockImportErrorLine,
  StockImportJob,
  StockImportTemplateFormat,
  StockImportType,
} from "@/types/stock";
import { Download, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { formatDateTime } from "./utils";

const IMPORT_TYPE_OPTIONS: StockImportType[] = ["ITENS", "ENTRADAS", "AJUSTES"];

export default function StockImportsPage() {
  const [jobs, setJobs] = useState<StockImportJob[]>([]);
  const [errorsByJob, setErrorsByJob] = useState<Record<string, StockImportErrorLine[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tipoImportacao, setTipoImportacao] = useState<StockImportType>("ENTRADAS");
  const [formatoModelo, setFormatoModelo] = useState<StockImportTemplateFormat>("xlsx");
  const [dryRun, setDryRun] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const load = async () => {
    try {
      setIsLoading(true);
      const list = await stockApi.listImportJobs();
      setJobs(list);
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel carregar importacoes.").message);
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
      const created = await stockApi.createImportJob({
        arquivo: selectedFile,
        tipoImportacao,
        dryRun,
      });
      toast.success("Importacao enviada com sucesso.");
      setJobs((prev) => [created, ...prev]);
      setSelectedFile(null);
      setPage(1);
    } catch (error) {
      toast.error(resolveUiError(error, "Erro ao enviar importacao.").message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoadErrors = async (jobId: string) => {
    try {
      const errors = await stockApi.getImportErrors(jobId);
      setErrorsByJob((prev) => ({ ...prev, [jobId]: errors }));
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel carregar erros da importacao.").message);
    }
  };

  const handleCancel = async (jobId: string) => {
    try {
      const updated = await stockApi.cancelImportJob(jobId);
      setJobs((prev) => prev.map((job) => (job.jobId === jobId ? updated : job)));
      toast.success("Importacao cancelada.");
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel cancelar importacao.").message);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      const blob = await stockApi.downloadImportTemplate({
        tipoImportacao,
        formato: formatoModelo,
      });
      const fileName = `modelo-importacao-${tipoImportacao.toLowerCase()}.${formatoModelo}`;
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

  const getStatusVariant = (status: StockImportJob["status"]) => {
    if (status === "FALHOU" || status === "CONCLUIDO_COM_ERROS") return "destructive" as const;
    if (status === "CONCLUIDO") return "secondary" as const;
    if (status === "CANCELADO") return "outline" as const;
    return "default" as const;
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/80">
        <CardHeader>
          <CardTitle>Nova importacao</CardTitle>
          <p className="text-sm text-muted-foreground">
            Escolha o tipo de arquivo, baixe o modelo correto e acompanhe o processamento por job.
          </p>
        </CardHeader>
        <CardContent data-tour="stock-imports-form" className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label>Tipo de importacao</Label>
              <Select value={tipoImportacao} onValueChange={(value) => setTipoImportacao(value as StockImportType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IMPORT_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Formato do modelo</Label>
              <Select value={formatoModelo} onValueChange={(value) => setFormatoModelo(value as StockImportTemplateFormat)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="xlsx">XLSX</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 md:col-span-2">
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
            Rodar em modo dry-run
          </label>

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

      <Card className="border-border/80">
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
              description="Envie um arquivo para criar o primeiro job de importacao."
            />
          ) : (
            pagedJobs.map((job) => {
              const errors = errorsByJob[job.jobId] || [];
              const canCancel = ["RECEBIDO", "EM_VALIDACAO", "PROCESSANDO"].includes(job.status);
              return (
                <div key={job.jobId} className="rounded-xl border border-border/70 bg-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{job.tipoImportacao}</Badge>
                      <Badge variant={getStatusVariant(job.status)}>{job.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Criado em: {formatDateTime(job.createdAt)}</p>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
                    <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Progresso</p>
                      <p className="mt-1 font-medium text-foreground">
                        {job.linhasProcessadas}/{job.totalLinhas}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Tipo</p>
                      <p className="mt-1 font-medium text-foreground">{job.tipoImportacao}</p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Erros</p>
                      <p className="mt-1 font-medium text-foreground">{job.linhasComErro}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/estoque/importacoes/${job.jobId}`}>Detalhes</Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => void handleLoadErrors(job.jobId)}>Ver erros</Button>
                    <Button variant="outline" size="sm" onClick={() => void handleCancel(job.jobId)} disabled={!canCancel}>
                      Cancelar
                    </Button>
                  </div>
                  {!!errors.length && (
                    <div className="mt-3 rounded-lg border border-border/60 bg-muted/30 p-3 text-xs">
                      {errors.slice(0, 5).map((line) => (
                        <p key={`${line.linha}-${line.coluna}`}>Linha {line.linha} / {line.coluna}: {line.mensagem}</p>
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
