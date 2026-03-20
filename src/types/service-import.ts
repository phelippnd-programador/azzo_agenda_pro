export type ServiceImportMode = "INSERT_ONLY" | "UPSERT";
export type ServiceImportTemplateFormat = "xlsx" | "csv";
export type ServiceImportStatus =
  | "RECEBIDO"
  | "EM_VALIDACAO"
  | "PROCESSANDO"
  | "CONCLUIDO"
  | "CONCLUIDO_COM_ERROS"
  | "FALHOU"
  | "CANCELADO";

export type ServiceImportJob = {
  jobId: string;
  nomeArquivo: string;
  status: ServiceImportStatus;
  modoImportacao: ServiceImportMode;
  dryRun: boolean;
  linhasRecebidas: number;
  linhasProcessadas: number;
  linhasSucesso: number;
  linhasErro: number;
  mensagemResumo?: string | null;
  errorMessage?: string | null;
  arquivoHashSha256?: string | null;
  arquivoStorageKey?: string | null;
  requestedBy?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ServiceImportErrorLine = {
  linha: number;
  coluna?: string | null;
  codigo?: string | null;
  mensagem: string;
  valorOriginal?: string | null;
};
