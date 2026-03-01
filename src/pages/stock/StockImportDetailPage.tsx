import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Download, RefreshCw, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { PageEmptyState } from "@/components/ui/page-states";
import { stockApi } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import type { StockImportErrorLine, StockImportJob } from "@/types/stock";
import { formatDateTime } from "./utils";

const RUNNING_STATUSES = ["RECEBIDO", "EM_VALIDACAO", "PROCESSANDO"];

export default function StockImportDetailPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<StockImportJob | null>(null);
  const [errors, setErrors] = useState<StockImportErrorLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingErrors, setIsLoadingErrors] = useState(false);
  const [isDownloadingResult, setIsDownloadingResult] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const loadJob = async () => {
    if (!jobId) return;
    const response = await stockApi.getImportJobById(jobId);
    setJob(response);
  };

  const loadErrors = async () => {
    if (!jobId) return;
    setIsLoadingErrors(true);
    try {
      const response = await stockApi.getImportErrors(jobId);
      setErrors(response);
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel carregar erros do job.").message);
    } finally {
      setIsLoadingErrors(false);
    }
  };

  const loadAll = async () => {
    if (!jobId) return;
    try {
      setIsLoading(true);
      await Promise.all([loadJob(), loadErrors()]);
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel carregar o detalhe da importacao.").message);
      navigate("/estoque/importacoes", { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, [jobId]);

  const isRunning = useMemo(
    () => (job ? RUNNING_STATUSES.includes(job.status) : false),
    [job]
  );

  useEffect(() => {
    if (!isRunning || !jobId) return;
    const timer = window.setInterval(() => {
      void loadAll();
    }, 10000);
    return () => window.clearInterval(timer);
  }, [isRunning, jobId]);

  const handleCancel = async () => {
    if (!jobId) return;
    try {
      const updated = await stockApi.cancelImportJob(jobId);
      setJob(updated);
      toast.success("Importacao cancelada.");
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel cancelar o job.").message);
    }
  };

  const handleDownloadResult = async () => {
    if (!jobId) return;
    try {
      setIsDownloadingResult(true);
      const response = await stockApi.getImportResultFile(jobId);
      window.open(response.downloadUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(resolveUiError(error, "Nao foi possivel baixar o arquivo resultado.").message);
    } finally {
      setIsDownloadingResult(false);
    }
  };

  const getStatusVariant = (status: StockImportJob["status"]) => {
    if (status === "FALHOU" || status === "CONCLUIDO_COM_ERROS") return "destructive" as const;
    if (status === "CONCLUIDO") return "secondary" as const;
    if (status === "CANCELADO") return "outline" as const;
    return "default" as const;
  };

  const progressPercent = useMemo(() => {
    if (!job?.totalLinhas) return 0;
    return Math.min(100, Math.round((job.linhasProcessadas / job.totalLinhas) * 100));
  }, [job]);

  const totalPages = Math.max(1, Math.ceil(errors.length / pageSize));
  const pagedErrors = useMemo(() => {
    const start = (page - 1) * pageSize;
    return errors.slice(start, start + pageSize);
  }, [errors, page]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-muted-foreground">Carregando detalhe da importacao...</CardContent>
      </Card>
    );
  }

  if (!job) {
    return (
      <PageEmptyState
        title="Importacao nao encontrada"
        description="Nao foi possivel encontrar o job solicitado."
        action={
          <Button asChild variant="outline">
            <Link to="/estoque/importacoes">Voltar para importacoes</Link>
          </Button>
        }
      />
    );
  }

  const canCancel = RUNNING_STATUSES.includes(job.status);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" className="gap-2" asChild>
          <Link to="/estoque/importacoes">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => void loadAll()}>
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => void handleDownloadResult()}
            disabled={isDownloadingResult}
          >
            <Download className="h-4 w-4" />
            {isDownloadingResult ? "Baixando..." : "Arquivo resultado"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={!canCancel}
            onClick={() => void handleCancel()}
          >
            <XCircle className="h-4 w-4" />
            Cancelar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Job {job.jobId}</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{job.tipoImportacao}</Badge>
              <Badge variant={getStatusVariant(job.status)}>{job.status}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <p><strong>Criado em:</strong> {formatDateTime(job.createdAt)}</p>
            <p><strong>Atualizado em:</strong> {formatDateTime(job.updatedAt)}</p>
            <p><strong>Finalizado em:</strong> {formatDateTime(job.finishedAt || undefined)}</p>
            <p><strong>Dry-run:</strong> {job.dryRun ? "Sim" : "Nao"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">
              Progresso: {job.linhasProcessadas}/{job.totalLinhas} linhas ({progressPercent}%)
            </p>
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">Linhas com erro: {job.linhasComErro}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Erros por linha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoadingErrors ? (
            <p className="text-sm text-muted-foreground">Carregando erros...</p>
          ) : !errors.length ? (
            <PageEmptyState
              title="Sem erros no job"
              description="Este job nao retornou erros de validacao/processamento."
            />
          ) : (
            <>
              <div className="space-y-2">
                {pagedErrors.map((line, index) => (
                  <div
                    key={`${line.linha}-${line.coluna}-${index}`}
                    className="rounded-md border p-3 text-sm"
                  >
                    <p><strong>Linha:</strong> {line.linha} | <strong>Coluna:</strong> {line.coluna}</p>
                    <p><strong>Codigo:</strong> {line.codigoErro}</p>
                    <p><strong>Mensagem:</strong> {line.mensagem}</p>
                    <p className="text-muted-foreground"><strong>Valor recebido:</strong> {line.valorRecebido || "-"}</p>
                  </div>
                ))}
              </div>
              <PaginationControls
                page={page}
                totalPages={totalPages}
                isLoading={isLoadingErrors}
                onPrevious={() => setPage((prev) => Math.max(1, prev - 1))}
                onNext={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
