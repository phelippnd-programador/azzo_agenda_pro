import type { AuditEventDetailDto, AuditStatus } from "@/types/auditoria";

export const toDateTimeLocal = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hour = String(parsed.getHours()).padStart(2, "0");
  const minute = String(parsed.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
};

export const statusBadgeClass: Record<AuditStatus, string> = {
  SUCCESS: "bg-primary/10 text-primary border-primary/30",
  ERROR: "bg-destructive/10 text-destructive border-destructive/30",
  DENIED: "bg-muted text-muted-foreground border-border",
};

export const maskIpAddress = (ipAddress: string | null) => {
  if (!ipAddress) return "-";
  const chunks = ipAddress.split(".");
  if (chunks.length !== 4) return ipAddress;
  return `${chunks[0]}.${chunks[1]}.***.***`;
};

const toComparableString = (value: unknown) => JSON.stringify(value ?? null);

export type AuditUiMeta = {
  label: string;
  description: string;
};

export const ACTION_META: Record<string, AuditUiMeta> = {
  RBAC_PERMISSION_UPDATE: {
    label: "Permissao de acesso atualizada",
    description: "Uma permissao de acesso do sistema foi alterada.",
  },
  AUTH_LOGIN: { label: "Login", description: "Autenticacao de usuario no sistema." },
  AUTH_REFRESH: { label: "Renovacao de sessao", description: "Renovacao do token de acesso." },
  AUTH_LOGIN_MFA_REQUIRED: { label: "MFA obrigatorio", description: "Login bloqueado aguardando codigo MFA." },
  AUTH_LOGIN_MFA_DENIED: { label: "MFA recusado", description: "Codigo MFA invalido no login." },
  AUTH_MFA_ENABLE: { label: "MFA ativado", description: "Ativacao de autenticacao multifator." },
  AUTH_MFA_DISABLE: { label: "MFA desativado", description: "Desativacao de autenticacao multifator." },
  PROFESSIONAL_CREATE: { label: "Criacao de profissional", description: "Cadastro de novo profissional." },
  PROFESSIONAL_UPDATE: { label: "Atualizacao de profissional", description: "Edicao de dados do profissional." },
  PROFESSIONAL_DELETE: { label: "Remocao de profissional", description: "Exclusao de profissional." },
  PROFESSIONAL_PASSWORD_RESET: { label: "Reset de senha", description: "Geracao de senha temporaria para profissional." },
  CLIENT_CREATE: { label: "Criacao de cliente", description: "Cadastro de novo cliente." },
  CLIENT_UPDATE: { label: "Atualizacao de cliente", description: "Edicao de dados do cliente." },
  CLIENT_DELETE: { label: "Remocao de cliente", description: "Exclusao de cliente." },
  FINANCE_TRANSACTION_CREATE: {
    label: "Lancamento financeiro criado",
    description: "Um novo lancamento financeiro foi registrado.",
  },
  FINANCE_TRANSACTION_UPDATE: {
    label: "Lancamento financeiro atualizado",
    description: "Um lancamento financeiro foi alterado.",
  },
  FINANCE_TRANSACTION_DELETE: {
    label: "Lancamento financeiro removido",
    description: "Um lancamento financeiro foi removido.",
  },
  FISCAL_INVOICE_AUTHORIZE: {
    label: "Nota fiscal autorizada",
    description: "A nota fiscal foi enviada e autorizada pelo provedor fiscal.",
  },
  APPOINTMENT_CREATE: { label: "Agendamento criado", description: "Um novo agendamento foi criado." },
  APPOINTMENT_UPDATE: { label: "Agendamento atualizado", description: "Um agendamento foi alterado." },
  APPOINTMENT_CANCEL: { label: "Agendamento cancelado", description: "Um agendamento foi cancelado." },
  APPOINTMENT_DELETE: { label: "Agendamento removido", description: "Um agendamento foi removido." },
  LGPD_REQUEST_CREATE: { label: "Solicitacao LGPD criada", description: "Nova solicitacao de titular registrada." },
  LGPD_REQUEST_STATUS_UPDATE: { label: "Status LGPD atualizado", description: "Atualizacao de status de solicitacao LGPD." },
};

export const MODULE_META: Record<string, string> = {
  RBAC: "Permissoes de acesso",
};

export const ENTITY_META: Record<string, AuditUiMeta> = {
  ENTITY: { label: "Permissao/Menu", description: "Alteracao de permissao, menu ou configuracao de acesso." },
  USER_AUTH: { label: "Autenticacao", description: "Eventos de autenticacao de usuario." },
  PROFESSIONAL: { label: "Profissional", description: "Dados e operacoes de profissionais." },
  CLIENT: { label: "Cliente", description: "Dados e operacoes de clientes." },
  LGPD_REQUEST: { label: "Solicitacao LGPD", description: "Atendimento de requisicoes LGPD." },
  AUDIT_READ: { label: "Consulta de auditoria", description: "Acesso aos eventos e filtros da auditoria." },
  FINANCE_TRANSACTION: { label: "Lancamento financeiro", description: "Dados e operacoes de lancamentos financeiros." },
  APPOINTMENT: { label: "Agendamento", description: "Dados e operacoes de agendamentos." },
};

export const humanizeToken = (value: string) =>
  value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const actionMeta = (action: string): AuditUiMeta =>
  ACTION_META[action] || {
    label: humanizeToken(action),
    description: "Evento registrado pelo sistema para controle e rastreabilidade.",
  };

export const entityMeta = (entityType: string | null): AuditUiMeta => {
  if (!entityType) return { label: "-", description: "Evento sem entidade vinculada." };
  return (
    ENTITY_META[entityType] || {
      label: humanizeToken(entityType),
      description: "Tipo de registro impactado por este evento.",
    }
  );
};

export const moduleLabel = (module: string) => MODULE_META[module] || humanizeToken(module);

export const statusLabel = (status: string) =>
  ({ SUCCESS: "Sucesso", ERROR: "Erro", DENIED: "Negado" }[status] || humanizeToken(status));

export const buildDiffEntries = (detail: AuditEventDetailDto | null) => {
  if (!detail) return [];
  const before = detail.before ?? {};
  const after = detail.after ?? {};
  const allKeys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).sort();
  return allKeys
    .map((key) => {
      const previous = before[key];
      const current = after[key];
      const changed = toComparableString(previous) !== toComparableString(current);
      return { key, previous, current, changed };
    })
    .filter((entry) => entry.changed);
};
