export type SpecialtyImportMode = "INSERT_ONLY" | "UPSERT";
export type SpecialtyImportTemplateFormat = "xlsx" | "csv";
export type SpecialtyImportStatus =
  | "RECEBIDO"
  | "EM_VALIDACAO"
  | "PROCESSANDO"
  | "CONCLUIDO"
  | "CONCLUIDO_COM_ERROS"
  | "FALHOU"
  | "CANCELADO";

export type SpecialtyImportJob = {
  jobId: string;
  nomeArquivo: string;
  status: SpecialtyImportStatus;
  modoImportacao: SpecialtyImportMode;
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

export type SpecialtyImportErrorLine = {
  linha: number;
  coluna?: string | null;
  codigo?: string | null;
  mensagem: string;
  valorOriginal?: string | null;
};
