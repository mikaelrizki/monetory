"use client";

import { useState, useEffect } from 'react';
import { Transaction, Budget, Account } from '../types';

const STORAGE_KEY_LAST_SYNC = 'monetory_last_sync';

const INITIAL_ACCOUNTS = [
  {
    id: 'acc-bca',
    name: 'Bank BCA',
    type: 'bank',
    balance: 5000000 // Rp 5.000.000
  },
  {
    id: 'acc-gopay',
    name: 'GoPay',
    type: 'ewallet',
    balance: 350000 // Rp 350.000
  },
  {
    id: 'acc-tunai',
    name: 'Uang Tunai',
    type: 'cash',
    balance: 200000 // Rp 200.000
  }
];

const INITIAL_TRANSACTIONS = [
  {
    type: 'income',
    amount: 12500000,
    category: 'Gaji',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    note: 'Gaji Bulanan Utama',
    account_id: 'acc-bca'
  },
  {
    type: 'expense',
    amount: 150000,
    category: 'Makanan & Minuman',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    note: 'Makan siang Nasi Padang',
    account_id: 'acc-tunai'
  },
  {
    type: 'expense',
    amount: 45000,
    category: 'Transportasi',
    date: new Date().toISOString().split('T')[0],
    note: 'Ojek online ke kantor',
    account_id: 'acc-gopay'
  },
  {
    type: 'expense',
    amount: 650000,
    category: 'Belanja',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    note: 'Beli sepatu olahraga baru',
    account_id: 'acc-bca'
  },
  {
    type: 'expense',
    amount: 320000,
    category: 'Tagihan & Utilitas',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    note: 'Tagihan Wi-Fi rumah',
    account_id: 'acc-bca'
  },
  {
    type: 'income',
    amount: 1800000,
    category: 'Sampingan',
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    note: 'Desain logo freelance',
    account_id: 'acc-bca'
  },
  {
    type: 'expense',
    amount: 120000,
    category: 'Hiburan & Rekreasi',
    date: new Date().toISOString().split('T')[0],
    note: 'Tiket bioskop & popcorn',
    account_id: 'acc-gopay'
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
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      }
    } catch (err) {
      console.error('Error fetching accounts:', err);
    }
  };

  // Load database entries on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [txRes, budgetRes, accountRes] = await Promise.all([
          fetch('/api/transactions'),
          fetch('/api/budgets'),
          fetch('/api/accounts')
        ]);

        if (!txRes.ok || !budgetRes.ok || !accountRes.ok) {
          throw new Error('Gagal menyinkronkan data dengan database.');
        }

        const txData = await txRes.json();
        const budgetData = await budgetRes.json();
        const accountData = await accountRes.json();

        // Database seeding logic: if database is completely empty, populate it with demo values
        if (txData.length === 0 && budgetData.length === 0 && accountData.length === 0) {
          console.log('🌱 Database is empty. Seeding initial demo data with accounts...');
          
          const seededAccounts: Account[] = [];
          const seededBudgets: Budget[] = [];
          const seededTxs: Transaction[] = [];

          // 1. Seed Accounts
          for (const acc of INITIAL_ACCOUNTS) {
            const res = await fetch('/api/accounts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(acc)
            });
            if (res.ok) {
              seededAccounts.push(await res.json());
            }
          }

          // 2. Seed Budgets
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

          // 3. Seed Transactions
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

          // Update local state with seeded values
          // Note: accounts balances are updated by the backend triggers on transaction POSTs
          // We refetch accounts from backend to get the correct computed balances after seeds
          const finalAccountsRes = await fetch('/api/accounts');
          if (finalAccountsRes.ok) {
            setAccounts(await finalAccountsRes.json());
          } else {
            setAccounts(seededAccounts);
          }

          setTransactions(seededTxs);
          setBudgets(seededBudgets);
        } else {
          setTransactions(txData);
          setBudgets(budgetData);
          setAccounts(accountData);
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
      
      // Re-fetch accounts to update balances in UI
      await fetchAccounts();
    } catch (err) {
      console.error(err);
      alert('Gagal mencatat transaksi.');
    }
  };

  const editTransaction = async (id: string, updatedFields: Partial<Transaction>) => {
    try {
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
      
      // Re-fetch accounts to update balances in UI
      await fetchAccounts();
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
      
      // Re-fetch accounts to update balances in UI
      await fetchAccounts();
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

  // CRUD Accounts
  const addAccount = async (acc: Omit<Account, 'id'>) => {
    try {
      const id = crypto.randomUUID();
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...acc, id })
      });

      if (!res.ok) throw new Error('Gagal menyimpan rekening ke database.');

      const newAcc: Account = await res.json();
      setAccounts(prev => [...prev, newAcc]);
    } catch (err) {
      console.error(err);
      alert('Gagal membuat rekening baru.');
    }
  };

  const editAccount = async (id: string, updatedFields: Partial<Account>) => {
    try {
      const current = accounts.find(a => a.id === id);
      if (!current) return;

      const patched = { ...current, ...updatedFields };

      const res = await fetch(`/api/accounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patched)
      });

      if (!res.ok) throw new Error('Gagal memperbarui rekening di database.');

      const updatedAcc: Account = await res.json();
      setAccounts(prev => prev.map(a => a.id === id ? updatedAcc : a));
    } catch (err) {
      console.error(err);
      alert('Gagal mengubah rekening.');
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      const res = await fetch(`/api/accounts/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Gagal menghapus rekening dari database.');

      setAccounts(prev => prev.filter(a => a.id !== id));
      
      // Update transactions state locally as backend updates transactions account_id to NULL
      setTransactions(prev => prev.map(t => t.account_id === id ? { ...t, account_id: undefined } : t));
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus rekening.');
    }
  };

  // Import / Export JSON
  const exportData = () => {
    const dataStr = JSON.stringify({ transactions, budgets, accounts }, null, 2);
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
      if (parsed && Array.isArray(parsed.transactions) && Array.isArray(parsed.budgets) && Array.isArray(parsed.accounts)) {
        
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
          // Clear current accounts
          for (const a of accounts) {
            await deleteAccount(a.id);
          }

          // Upload accounts
          const importedAccounts: Account[] = [];
          for (const a of parsed.accounts) {
            const res = await fetch('/api/accounts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(a)
            });
            if (res.ok) importedAccounts.push(await res.json());
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
          
          const finalAccsRes = await fetch('/api/accounts');
          if (finalAccsRes.ok) {
            setAccounts(await finalAccsRes.json());
          } else {
            setAccounts(importedAccounts);
          }

          setIsLoaded(true);
        }

        runImport();
        return { success: true };
      }
      return { success: false, error: 'File backup harus berisi array transaksi, anggaran, dan rekening.' };
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
    accounts,
    isLoaded,
    addTransaction,
    editTransaction,
    deleteTransaction,
    setBudget,
    deleteBudget,
    addAccount,
    editAccount,
    deleteAccount,
    exportData,
    importData,
    totalIncome,
    totalExpense,
    balance,
    categorySpend
  };
}
