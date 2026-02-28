import type { StockItem, StockMovement } from "@/types/stock";

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(parsed);
};

export const getListItems = <T,>(response: T[] | { items?: T[] } | null | undefined) =>
  Array.isArray(response) ? response : response?.items || [];

export const buildStockSummary = (items: StockItem[], movements: StockMovement[]) => {
  const itensAbaixoMinimo = items.filter((item) => item.saldoAtual <= item.estoqueMinimo).length;
  const itensZerados = items.filter((item) => item.saldoAtual <= 0).length;
  const valorEstoque = items.reduce(
    (sum, item) => sum + item.saldoAtual * Number(item.custoMedioUnitario || 0),
    0
  );

  return {
    itensAbaixoMinimo,
    itensZerados,
    valorEstoque,
    totalItens: items.length,
    totalMovimentacoes: movements.length,
  };
};
