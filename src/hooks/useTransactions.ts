import { useState, useEffect, useCallback } from 'react';
import { transactionsApi, Transaction } from '@/lib/api';
import { toast } from 'sonner';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpenses: 0, balance: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      const [data, summaryData] = await Promise.all([
        transactionsApi.getAll(),
        transactionsApi.getSummary(),
      ]);
      setTransactions(data);
      setSummary(summaryData);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar transações');
      toast.error('Erro ao carregar transações');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const createTransaction = async (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    try {
      const newTransaction = await transactionsApi.create(data);
      setTransactions(prev => [...prev, newTransaction]);
      
      // Update summary
      if (data.type === 'INCOME') {
        setSummary(prev => ({
          ...prev,
          totalIncome: prev.totalIncome + data.amount,
          balance: prev.balance + data.amount,
        }));
      } else {
        setSummary(prev => ({
          ...prev,
          totalExpenses: prev.totalExpenses + data.amount,
          balance: prev.balance - data.amount,
        }));
      }
      
      toast.success(data.type === 'INCOME' ? 'Entrada registrada!' : 'Saída registrada!');
      return newTransaction;
    } catch (err) {
      toast.error('Erro ao registrar transação');
      throw err;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const transaction = transactions.find(t => t.id === id);
      await transactionsApi.delete(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
      
      // Update summary
      if (transaction) {
        if (transaction.type === 'INCOME') {
          setSummary(prev => ({
            ...prev,
            totalIncome: prev.totalIncome - transaction.amount,
            balance: prev.balance - transaction.amount,
          }));
        } else {
          setSummary(prev => ({
            ...prev,
            totalExpenses: prev.totalExpenses - transaction.amount,
            balance: prev.balance + transaction.amount,
          }));
        }
      }
      
      toast.success('Transação excluída!');
    } catch (err) {
      toast.error('Erro ao excluir transação');
      throw err;
    }
  };

  return {
    transactions,
    summary,
    isLoading,
    error,
    refetch: fetchTransactions,
    createTransaction,
    deleteTransaction,
  };
}