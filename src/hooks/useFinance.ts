"use client";

import { useState, useEffect } from 'react';
import { Transaction, Budget } from '../types';

const INITIAL_TRANSACTIONS = [
  {
    type: 'income',
    amount: 12500000,
    category: 'Gaji',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    note: 'Gaji Bulanan Utama'
  },
  {
    type: 'expense',
    amount: 150000,
    category: 'Makanan & Minuman',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    note: 'Makan siang Nasi Padang'
  },
  {
    type: 'expense',
    amount: 45000,
    category: 'Transportasi',
    date: new Date().toISOString().split('T')[0],
    note: 'Ojek online ke kantor'
  },
  {
    type: 'expense',
    amount: 650000,
    category: 'Belanja',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    note: 'Beli sepatu olahraga baru'
  },
  {
    type: 'expense',
    amount: 320000,
    category: 'Tagihan & Utilitas',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    note: 'Tagihan Wi-Fi rumah'
  },
  {
    type: 'income',
    amount: 1800000,
    category: 'Sampingan',
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    note: 'Desain logo freelance'
  },
  {
    type: 'expense',
    amount: 120000,
    category: 'Hiburan & Rekreasi',
    date: new Date().toISOString().split('T')[0],
    note: 'Tiket bioskop & popcorn'
  }
];

const INITIAL_BUDGETS = [
  { category: 'Makanan & Minuman', limit: 2000000 },
  { category: 'Transportasi', limit: 800000 },
  { category: 'Belanja', limit: 1500000 },
  { category: 'Hiburan & Rekreasi', limit: 600000 }
];

export function useFinance() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load database entries on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [txRes, budgetRes] = await Promise.all([
          fetch('/api/transactions'),
          fetch('/api/budgets')
        ]);

        if (!txRes.ok || !budgetRes.ok) {
          throw new Error('Gagal menyinkronkan data dengan database.');
        }

        const txData = await txRes.json();
        const budgetData = await budgetRes.json();

        // Database seeding logic: if database is completely empty, populate it with demo values
        if (txData.length === 0 && budgetData.length === 0) {
          console.log('🌱 Database is empty. Seeding initial demo data...');
          
          const seededTxs: Transaction[] = [];
          const seededBudgets: Budget[] = [];

          // 1. Seed Budgets
          for (const b of INITIAL_BUDGETS) {
            const res = await fetch('/api/budgets', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(b)
            });
            if (res.ok) {
              seededBudgets.push(await res.json());
            }
          }

          // 2. Seed Transactions
          for (const tx of INITIAL_TRANSACTIONS) {
            const res = await fetch('/api/transactions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...tx, id: crypto.randomUUID() })
            });
            if (res.ok) {
              seededTxs.push(await res.json());
            }
          }

          setTransactions(seededTxs);
          setBudgets(seededBudgets);
        } else {
          setTransactions(txData);
          setBudgets(budgetData);
        }
      } catch (err) {
        console.error('Error fetching database:', err);
      } finally {
        setIsLoaded(true);
      }
    }

    loadData();
  }, []);

  // CRUD Transaction
  const addTransaction = async (tx: Omit<Transaction, 'id'>) => {
    try {
      const id = crypto.randomUUID();
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...tx, id })
      });

      if (!res.ok) throw new Error('Gagal menyimpan transaksi ke database.');

      const newTx: Transaction = await res.json();
      setTransactions(prev => [newTx, ...prev]);
    } catch (err) {
      console.error(err);
      alert('Gagal mencatat transaksi.');
    }
  };

  const editTransaction = async (id: string, updatedFields: Partial<Transaction>) => {
    try {
      // Fetch full transaction data to patch
      const current = transactions.find(t => t.id === id);
      if (!current) return;

      const patched = { ...current, ...updatedFields };

      const res = await fetch(`/api/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patched)
      });

      if (!res.ok) throw new Error('Gagal memperbarui transaksi di database.');

      const updatedTx: Transaction = await res.json();
      setTransactions(prev => prev.map(t => t.id === id ? updatedTx : t));
    } catch (err) {
      console.error(err);
      alert('Gagal mengubah transaksi.');
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Gagal menghapus transaksi dari database.');

      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus transaksi.');
    }
  };

  // CRUD Budget
  const setBudget = async (category: string, limit: number) => {
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, limit })
      });

      if (!res.ok) throw new Error('Gagal menyimpan anggaran ke database.');

      const newBudget: Budget = await res.json();
      setBudgets(prev => {
        const exists = prev.some(b => b.category === category);
        if (exists) {
          return prev.map(b => b.category === category ? newBudget : b);
        }
        return [...prev, newBudget];
      });
    } catch (err) {
      console.error(err);
      alert('Gagal memperbarui anggaran.');
    }
  };

  const deleteBudget = async (category: string) => {
    try {
      const encodedCategory = encodeURIComponent(category);
      const res = await fetch(`/api/budgets/${encodedCategory}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Gagal menghapus anggaran dari database.');

      setBudgets(prev => prev.filter(b => b.category !== category));
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus anggaran.');
    }
  };

  // Import / Export JSON
  const exportData = () => {
    const dataStr = JSON.stringify({ transactions, budgets }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `monetory-neon-backup-${new Date().toISOString().split('T')[0]}.json`;
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

        // Asynchronously upload everything to database in background
        // First delete local entries and upload
        async function runImport() {
          setIsLoaded(false);
          
          // Clear current budgets
          for (const b of budgets) {
            await deleteBudget(b.category);
          }
          // Clear current transactions
          for (const t of transactions) {
            await deleteTransaction(t.id);
          }

          // Upload budgets
          const importedBudgets: Budget[] = [];
          for (const b of parsed.budgets) {
            const res = await fetch('/api/budgets', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(b)
            });
            if (res.ok) importedBudgets.push(await res.json());
          }

          // Upload transactions
          const importedTxs: Transaction[] = [];
          for (const tx of parsed.transactions) {
            const res = await fetch('/api/transactions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(tx)
            });
            if (res.ok) importedTxs.push(await res.json());
          }

          setBudgets(importedBudgets);
          setTransactions(importedTxs);
          setIsLoaded(true);
        }

        runImport();
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
