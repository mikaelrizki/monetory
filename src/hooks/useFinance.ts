"use client";

import { useState, useEffect } from 'react';
import { Transaction, Budget } from '../types';

const STORAGE_KEY_TRANSACTIONS = 'monetory_transactions';
const STORAGE_KEY_BUDGETS = 'monetory_budgets';

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    type: 'income',
    amount: 12500000,
    category: 'Gaji',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days ago
    note: 'Gaji Bulanan Utama'
  },
  {
    id: '2',
    type: 'expense',
    amount: 150000,
    category: 'Makanan & Minuman',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 day ago
    note: 'Makan siang Nasi Padang'
  },
  {
    id: '3',
    type: 'expense',
    amount: 45000,
    category: 'Transportasi',
    date: new Date().toISOString().split('T')[0], // Today
    note: 'Ojek online ke kantor'
  },
  {
    id: '4',
    type: 'expense',
    amount: 650000,
    category: 'Belanja',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days ago
    note: 'Beli sepatu olahraga baru'
  },
  {
    id: '5',
    type: 'expense',
    amount: 320000,
    category: 'Tagihan & Utilitas',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days ago
    note: 'Tagihan Wi-Fi rumah'
  },
  {
    id: '6',
    type: 'income',
    amount: 1800000,
    category: 'Sampingan',
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 4 days ago
    note: 'Desain logo freelance'
  },
  {
    id: '7',
    type: 'expense',
    amount: 120000,
    category: 'Hiburan & Rekreasi',
    date: new Date().toISOString().split('T')[0], // Today
    note: 'Tiket bioskop & popcorn'
  }
];

const INITIAL_BUDGETS: Budget[] = [
  { category: 'Makanan & Minuman', limit: 2000000 },
  { category: 'Transportasi', limit: 800000 },
  { category: 'Belanja', limit: 1500000 },
  { category: 'Hiburan & Rekreasi', limit: 600000 }
];

export function useFinance() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data from LocalStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTx = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
      const storedBudgets = localStorage.getItem(STORAGE_KEY_BUDGETS);

      if (storedTx) {
        setTransactions(JSON.parse(storedTx));
      } else {
        setTransactions(INITIAL_TRANSACTIONS);
        localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
      }

      if (storedBudgets) {
        setBudgets(JSON.parse(storedBudgets));
      } else {
        setBudgets(INITIAL_BUDGETS);
        localStorage.setItem(STORAGE_KEY_BUDGETS, JSON.stringify(INITIAL_BUDGETS));
      }

      setIsLoaded(true);
    }
  }, []);

  // Save transactions to localStorage
  const saveTransactions = (newTx: Transaction[]) => {
    setTransactions(newTx);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(newTx));
    }
  };

  // Save budgets to localStorage
  const saveBudgets = (newBudgets: Budget[]) => {
    setBudgets(newBudgets);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_BUDGETS, JSON.stringify(newBudgets));
    }
  };

  // CRUD Transaction
  const addTransaction = (tx: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...tx,
      id: crypto.randomUUID()
    };
    saveTransactions([newTx, ...transactions]);
  };

  const editTransaction = (id: string, updatedFields: Partial<Transaction>) => {
    const updated = transactions.map(t => {
      if (t.id === id) {
        return { ...t, ...updatedFields };
      }
      return t;
    });
    saveTransactions(updated);
  };

  const deleteTransaction = (id: string) => {
    const updated = transactions.filter(t => t.id !== id);
    saveTransactions(updated);
  };

  // CRUD Budget
  const setBudget = (category: string, limit: number) => {
    const exists = budgets.find(b => b.category === category);
    let newBudgets: Budget[];
    if (exists) {
      newBudgets = budgets.map(b => b.category === category ? { ...b, limit } : b);
    } else {
      newBudgets = [...budgets, { category, limit }];
    }
    saveBudgets(newBudgets);
  };

  const deleteBudget = (category: string) => {
    const newBudgets = budgets.filter(b => b.category !== category);
    saveBudgets(newBudgets);
  };

  // Import / Export JSON
  const exportData = () => {
    const dataStr = JSON.stringify({ transactions, budgets }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `monetory-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importData = (jsonData: string): { success: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed && Array.isArray(parsed.transactions) && Array.isArray(parsed.budgets)) {
        // Validate transaction shape minimally
        const isValidTx = parsed.transactions.every((t: any) => 
          typeof t.id === 'string' &&
          (t.type === 'income' || t.type === 'expense') &&
          typeof t.amount === 'number' &&
          typeof t.category === 'string' &&
          typeof t.date === 'string'
        );

        if (!isValidTx) {
          return { success: false, error: 'Format data transaksi tidak valid.' };
        }

        saveTransactions(parsed.transactions);
        saveBudgets(parsed.budgets);
        return { success: true };
      }
      return { success: false, error: 'File backup harus berisi array transaksi dan anggaran.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal membaca file JSON.' };
    }
  };

  // Calculations
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  // Calculate actual spending per category (only from expenses)
  const categorySpend = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  return {
    transactions,
    budgets,
    isLoaded,
    addTransaction,
    editTransaction,
    deleteTransaction,
    setBudget,
    deleteBudget,
    exportData,
    importData,
    totalIncome,
    totalExpense,
    balance,
    categorySpend
  };
}
