import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { stockApi } from "@/lib/api";
import { resolveUiError } from "@/lib/error-utils";
import type { StockImportErrorLine, StockImportJob, StockImportType } from "@/types/stock";
import { Upload } from "lucide-react";
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
  const [dryRun, setDryRun] = useState(false);
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

  const sortedJobs = useMemo(
    () => [...jobs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [jobs]
  );
  const pagedJobs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedJobs.slice(start, start + pageSize);
  }, [sortedJobs, page]);
  const totalPages = Math.max(1, Math.ceil(sortedJobs.length / pageSize));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Nova importacao</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <Label>Tipo de importacao</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={tipoImportacao}
                onChange={(e) => setTipoImportacao(e.target.value as StockImportType)}
              >
                {IMPORT_TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
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

          <Button className="gap-2" onClick={() => void handleSubmit()} disabled={isSubmitting}>
            <Upload className="h-4 w-4" />
            {isSubmitting ? "Enviando..." : "Enviar importacao"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historico de importacoes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : !sortedJobs.length ? (
            <p className="text-sm text-muted-foreground">Nenhum job de importacao encontrado.</p>
          ) : (
            pagedJobs.map((job) => {
              const errors = errorsByJob[job.jobId] || [];
              const canCancel = ["RECEBIDO", "EM_VALIDACAO", "PROCESSANDO"].includes(job.status);
              return (
                <div key={job.jobId} className="rounded-md border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{job.tipoImportacao}</Badge>
                      <Badge variant={job.status.includes("ERROS") || job.status === "FALHOU" ? "destructive" : "secondary"}>{job.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Criado em: {formatDateTime(job.createdAt)}</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Processadas: {job.linhasProcessadas}/{job.totalLinhas} | Erros: {job.linhasComErro}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => void handleLoadErrors(job.jobId)}>Ver erros</Button>
                    <Button variant="outline" size="sm" onClick={() => void handleCancel(job.jobId)} disabled={!canCancel}>
                      Cancelar
                    </Button>
                  </div>
                  {!!errors.length && (
                    <div className="mt-2 rounded-md bg-muted p-2 text-xs">
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
