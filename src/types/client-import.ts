export type ClientImportMode = "INSERT_ONLY" | "UPSERT";
export type ClientImportTemplateFormat = "xlsx" | "csv";
export type ClientImportStatus =
  | "RECEBIDO"
  | "EM_VALIDACAO"
  | "PROCESSANDO"
  | "CONCLUIDO"
  | "CONCLUIDO_COM_ERROS"
  | "FALHOU"
  | "CANCELADO";

export type ClientImportJob = {
  jobId: string;
  nomeArquivo: string;
  status: ClientImportStatus;
  modoImportacao: ClientImportMode;
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

export type ClientImportErrorLine = {
  linha: number;
  coluna?: string | null;
  codigo?: string | null;
  mensagem: string;
  valorOriginal?: string | null;
};
