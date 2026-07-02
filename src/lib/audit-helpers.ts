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
    label: "Permissão de acesso atualizada",
    description: "Uma permissão de acesso do sistema foi alterada.",
  },
  AUTH_LOGIN: { label: "Login", description: "Autenticação de usuário no sistema." },
  AUTH_REFRESH: { label: "Renovação de sessão", description: "Renovação do token de acesso." },
  AUTH_LOGIN_MFA_REQUIRED: { label: "MFA obrigatório", description: "Login bloqueado aguardando código MFA." },
  AUTH_LOGIN_MFA_DENIED: { label: "MFA recusado", description: "Código MFA inválido no login." },
  AUTH_MFA_ENABLE: { label: "MFA ativado", description: "Ativação de autenticação multifator." },
  AUTH_MFA_DISABLE: { label: "MFA desativado", description: "Desativação de autenticação multifator." },
  PROFESSIONAL_CREATE: { label: "Criação de profissional", description: "Cadastro de novo profissional." },
  PROFESSIONAL_UPDATE: { label: "Atualização de profissional", description: "Edição de dados do profissional." },
  PROFESSIONAL_DELETE: { label: "Remoção de profissional", description: "Exclusão de profissional." },
  PROFESSIONAL_PASSWORD_RESET: { label: "Reset de senha", description: "Geração de senha temporária para profissional." },
  CLIENT_CREATE: { label: "Criação de cliente", description: "Cadastro de novo cliente." },
  CLIENT_UPDATE: { label: "Atualização de cliente", description: "Edição de dados do cliente." },
  CLIENT_DELETE: { label: "Remoção de cliente", description: "Exclusão de cliente." },
  FINANCE_TRANSACTION_CREATE: {
    label: "Lançamento financeiro criado",
    description: "Um novo lançamento financeiro foi registrado.",
  },
  FINANCE_TRANSACTION_UPDATE: {
    label: "Lançamento financeiro atualizado",
    description: "Um lançamento financeiro foi alterado.",
  },
  FINANCE_TRANSACTION_DELETE: {
    label: "Lançamento financeiro removido",
    description: "Um lançamento financeiro foi removido.",
  },
  FISCAL_INVOICE_AUTHORIZE: {
    label: "Nota fiscal autorizada",
    description: "A nota fiscal foi enviada e autorizada pelo provedor fiscal.",
  },
  APPOINTMENT_CREATE: { label: "Agendamento criado", description: "Um novo agendamento foi criado." },
  APPOINTMENT_UPDATE: { label: "Agendamento atualizado", description: "Um agendamento foi alterado." },
  APPOINTMENT_CANCEL: { label: "Agendamento cancelado", description: "Um agendamento foi cancelado." },
  APPOINTMENT_DELETE: { label: "Agendamento removido", description: "Um agendamento foi removido." },
  LGPD_REQUEST_CREATE: { label: "Solicitação LGPD criada", description: "Nova solicitação de titular registrada." },
  LGPD_REQUEST_STATUS_UPDATE: { label: "Status LGPD atualizado", description: "Atualização de status de solicitação LGPD." },
  WHATSAPP_CONFIG_UPDATE: { label: "Config WhatsApp salva", description: "Configuração do WhatsApp foi atualizada." },
  WHATSAPP_CONNECTION_TEST: { label: "Teste de conexão WhatsApp", description: "Conexão com a API do WhatsApp foi testada." },
  WHATSAPP_TEST_MESSAGE: { label: "Mensagem de teste WhatsApp", description: "Mensagem de teste enviada via WhatsApp." },
  WHATSAPP_EMBEDDED_SIGNUP_COMPLETE: { label: "Embedded Signup concluído", description: "Onboarding via Meta Embedded Signup foi concluído." },
  INVENTORY_MOVEMENT_CREATE: { label: "Movimentação de estoque", description: "Nova entrada ou saída de estoque registrada." },
  INVENTORY_ADJUSTMENT: { label: "Ajuste de estoque", description: "Ajuste manual no estoque realizado." },
  CHAT_MESSAGE_SEND: { label: "Mensagem de chat enviada", description: "Mensagem enviada no chat." },
  APPOINTMENT_STATUS_UPDATE: { label: "Status do agendamento alterado", description: "Status de um agendamento foi atualizado." },
};

export const MODULE_META: Record<string, string> = {
  RBAC: "Permissões de acesso",
  FISCAL: "Fiscal",
  FINANCE: "Financeiro",
  AUTH: "Autenticação",
  APPOINTMENT: "Agendamentos",
  CUSTOMER: "Clientes",
  PROFESSIONAL: "Profissionais",
  INVENTORY: "Estoque",
  LGPD: "LGPD",
  CHAT: "Chat",
  WHATSAPP: "WhatsApp",
  TENANT: "Configurações",
  SYSTEM: "Sistema",
};

export const ENTITY_META: Record<string, AuditUiMeta> = {
  ENTITY: { label: "Permissão/Menu", description: "Alteração de permissão, menu ou configuração de acesso." },
  USER_AUTH: { label: "Autenticação", description: "Eventos de autenticação de usuário." },
  PROFESSIONAL: { label: "Profissional", description: "Dados e operações de profissionais." },
  CLIENT: { label: "Cliente", description: "Dados e operações de clientes." },
  LGPD_REQUEST: { label: "Solicitação LGPD", description: "Atendimento de requisições LGPD." },
  AUDIT_READ: { label: "Consulta de auditoria", description: "Acesso aos eventos e filtros da auditoria." },
  FINANCE_TRANSACTION: { label: "Lançamento financeiro", description: "Dados e operações de lançamentos financeiros." },
  APPOINTMENT: { label: "Agendamento", description: "Dados e operações de agendamentos." },
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
