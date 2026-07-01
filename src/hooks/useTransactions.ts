import { useState, useEffect, useCallback } from "react";
import {
  transactionsApi,
  transactionCategoriesApi,
  isPlanExpiredApiError,
  type TransactionListParams,
  type TransactionMutationInput,
} from "@/lib/api";
import type { Transaction, TransactionCategory } from "@/types";
import { resolveUiError } from "@/lib/error-utils";
import { toDateKey } from "@/lib/format";
import { toast } from "sonner";

// ─── Calcula o range de datas a partir do filtro de período ─────────────────

export function getDateRangeFromFilter(filter: string): { from?: string; to?: string } {
  const now = new Date();

  if (filter === "today") {
    return { from: toDateKey(now), to: toDateKey(now) };
  }

  if (filter === "week") {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return { from: toDateKey(start), to: toDateKey(now) };
  }

  if (filter === "month") {
    const start = new Date(now);
    start.setMonth(start.getMonth() - 1);
    return { from: toDateKey(start), to: toDateKey(now) };
  }

  return {}; // "all" — sem filtro
}

// ─── Hook principal de transações ────────────────────────────────────────────

export function useTransactions(filters?: TransactionListParams & { dateFilter?: string }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpenses: 0, balance: 0 });
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Resolve from/to a partir do dateFilter ou dos params diretos
  const dateRange = filters?.dateFilter
    ? getDateRangeFromFilter(filters.dateFilter)
    : { from: filters?.from, to: filters?.to };

  const apiParams: TransactionListParams = {
    ...dateRange,
    type: filters?.type,
    categoryId: filters?.categoryId,
    paymentMethod: filters?.paymentMethod,
    professionalId: filters?.professionalId,
    reconciled: filters?.reconciled,
    page,
    limit: filters?.limit ?? 50,
  };

  const fetchAll = useCallback(async () => {
    try {
      setIsLoading(true);

      const [listData, summaryData] = await Promise.all([
        transactionsApi.getAll(apiParams),
        transactionsApi.getSummary({
          from: dateRange.from,
          to: dateRange.to,
          type: filters?.type,
          categoryId: filters?.categoryId,
          paymentMethod: filters?.paymentMethod,
          professionalId: filters?.professionalId,
          reconciled: filters?.reconciled,
        }),
      ]);

      setTransactions(listData.items);
      setTotalCount(listData.totalCount);
      setTotalPages(listData.totalPages);
      setSummary(summaryData);
      setError(null);
    } catch (err) {
      if (isPlanExpiredApiError(err)) {
        setError(null);
        return;
      }
      const uiError = resolveUiError(err, "Erro ao carregar transacoes");
      setError(uiError.message);
      toast.error(uiError.message);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    dateRange.from,
    dateRange.to,
    filters?.type,
    filters?.categoryId,
    filters?.paymentMethod,
    filters?.professionalId,
    filters?.reconciled,
  ]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Reseta para página 0 quando qualquer filtro muda
  useEffect(() => {
    setPage(0);
  }, [
    filters?.dateFilter,
    filters?.from,
    filters?.to,
    filters?.type,
    filters?.categoryId,
    filters?.paymentMethod,
    filters?.professionalId,
    filters?.reconciled,
  ]);

  const createTransaction = async (
    data: TransactionMutationInput
  ) => {
    try {
      const newTransaction = await transactionsApi.create(data);
      toast.success(data.type === "INCOME" ? "Entrada registrada!" : "Saida registrada!");
      await fetchAll();
      return newTransaction;
    } catch (err) {
      if (!isPlanExpiredApiError(err)) {
        toast.error(resolveUiError(err, "Erro ao registrar transacao").message);
      }
      throw err;
    }
  };

  const updateTransaction = async (
    id: string,
    data: TransactionMutationInput
  ) => {
    try {
      const updated = await transactionsApi.update(id, data);
      toast.success("Lancamento atualizado!");
      await fetchAll();
      return updated;
    } catch (err) {
      if (!isPlanExpiredApiError(err)) {
        toast.error(resolveUiError(err, "Erro ao atualizar lancamento").message);
      }
      throw err;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await transactionsApi.delete(id);
      toast.success("Transacao excluida!");
      await fetchAll();
    } catch (err) {
      if (!isPlanExpiredApiError(err)) {
        toast.error(resolveUiError(err, "Erro ao excluir transacao").message);
      }
      throw err;
    }
  };

  return {
    transactions,
    summary,
    totalCount,
    totalPages,
    page,
    setPage,
    isLoading,
    error,
    refetch: fetchAll,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
}

// ─── Hook de categorias ───────────────────────────────────────────────────────

export type CategoryWithCount = TransactionCategory & { transactionCount: number };

export function useTransactionCategories() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await transactionCategoriesApi.getAll();
      setCategories(data);
    } catch {
      // Silencioso — se falhar, Select mostra lista vazia
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = async (name: string): Promise<CategoryWithCount | null> => {
    try {
      const created = await transactionCategoriesApi.create(name);
      setCategories((prev) => {
        const exists = prev.some((c) => c.id === created.id);
        if (exists) return prev;
        return [...prev, created].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
      });
      return created;
    } catch {
      toast.error("Nao foi possivel criar a categoria");
      return null;
    }
  };

  const updateCategory = async (id: string, name: string): Promise<boolean> => {
    try {
      const updated = await transactionCategoriesApi.update(id, name);
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
            .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
      );
      toast.success("Categoria renomeada!");
      return true;
    } catch (err) {
      toast.error(resolveUiError(err, "Erro ao renomear categoria").message);
      return false;
    }
  };

  const deleteCategory = async (id: string): Promise<boolean> => {
    try {
      await transactionCategoriesApi.delete(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Categoria excluida!");
      return true;
    } catch (err) {
      toast.error(resolveUiError(err, "Erro ao excluir categoria").message);
      return false;
    }
  };

  return { categories, isLoading, createCategory, updateCategory, deleteCategory, refetch: fetchCategories };
}
