import type { StockItem, StockMovement } from "@/types/stock";

// Re-exportado de @/lib/format para manter compatibilidade com imports existentes no módulo stock
export { formatCurrency, formatDateTime } from "@/lib/format";

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
