// Utilitários de formatação — fonte única para todo o projeto.
// Importe daqui em vez de declarar localmente em cada página/componente.

// ─── Moeda ────────────────────────────────────────────────────────────────────

/** Formata um valor em reais. Ex: 1500 → "R$ 1.500,00" */
export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

/** Formata um valor em centavos. Ex: 150000 → "R$ 1.500,00" */
export const formatCurrencyCents = (valueCents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valueCents / 100);

// ─── Data / Hora ──────────────────────────────────────────────────────────────

/**
 * Parseia qualquer valor de data (string ISO, objeto Date) de forma segura.
 * Datas no formato YYYY-MM-DD recebem T12:00:00 para evitar off-by-one de fuso.
 * Retorna null para valores inválidos.
 */
const parseDateValue = (value?: string | Date | null): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/** Formata data e hora curtos. Ex: "23/03/2026 14:30" */
export const formatDateTime = (value?: string | Date | null): string => {
  const parsed = parseDateValue(value);
  if (!parsed) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsed);
};

/** Formata somente a data. Ex: "23/03/2026" */
export const formatDateOnly = (value?: string | Date | null): string => {
  const parsed = parseDateValue(value);
  return parsed ? parsed.toLocaleDateString("pt-BR") : "-";
};

/** Formata data por extenso. Ex: "segunda-feira, 23 de março de 2026" */
export const formatDateLong = (value?: string | Date | null): string => {
  const parsed = parseDateValue(value);
  if (!parsed) return "-";
  return parsed.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// ─── Chave de data ────────────────────────────────────────────────────────────

/**
 * Converte Date ou string ISO em "YYYY-MM-DD" para uso como chave de filtro.
 * Ex: new Date("2026-03-23T15:00:00") → "2026-03-23"
 */
export const toDateKey = (value: string | Date): string => {
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return value.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? "";
};
