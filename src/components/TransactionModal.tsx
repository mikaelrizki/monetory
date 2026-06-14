"use client";

import { useEffect, useRef, useState } from 'react';
import { Transaction, Account, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../types';
import { X } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tx: Omit<Transaction, 'id'>) => void;
  editTransactionData: Transaction | null;
  accounts: Account[];
}

export default function TransactionModal({
  isOpen,
  onClose,
  onSubmit,
  editTransactionData,
  accounts
}: TransactionModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');

  // Handle open/close state of native dialog
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  // Load edit transaction data when supplied
  useEffect(() => {
    if (editTransactionData) {
      setType(editTransactionData.type);
      setAmount(editTransactionData.amount.toString());
      setCategory(editTransactionData.category);
      setDate(editTransactionData.date);
      setNote(editTransactionData.note);
      setAccountId(editTransactionData.account_id || '');
    } else {
      setType('expense');
      setAmount('');
      setCategory('');
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');
      setAccountId('');
    }
  }, [editTransactionData, isOpen]);

  // Sync aria-invalid with :user-invalid state for accessibility
  useEffect(() => {
    const syncAria = (el: HTMLElement) => {
      if (el.setAttribute) {
        el.setAttribute('aria-invalid', el.matches(':user-invalid') ? 'true' : 'false');
      }
    };

    const handleBlur = (e: FocusEvent) => {
      if (e.target) syncAria(e.target as HTMLElement);
    };

    const handleInput = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target && target.hasAttribute('aria-invalid')) {
        syncAria(target);
      }
    };

    const dialog = dialogRef.current;
    if (dialog) {
      dialog.addEventListener('blur', handleBlur, true);
      dialog.addEventListener('input', handleInput);
    }

    return () => {
      if (dialog) {
        dialog.removeEventListener('blur', handleBlur, true);
        dialog.removeEventListener('input', handleInput);
      }
    };
  }, []);

  const handleClose = () => {
    onClose();
  };

  // Close dialog on backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    
    const rect = dialog.getBoundingClientRect();
    const isInDialog = (
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom
    );
    
    if (!isInDialog) {
      handleClose();
    }
  };

  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    setCategory(''); // reset category on type switch
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;
    if (!category) return;
    if (!date) return;
    if (!accountId) return; // Account is now required for new transactions

    onSubmit({
      type,
      amount: parsedAmount,
      category,
      date,
      note,
      account_id: accountId
    });

    handleClose();
  };

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <dialog
      ref={dialogRef}
      className="transaction-modal"
      onClick={handleBackdropClick}
      onClose={handleClose}
    >
      <div className="modal-header">
        <h3>{editTransactionData ? 'Ubah Transaksi' : 'Catat Transaksi'}</h3>
        <button className="close-btn" onClick={handleClose} aria-label="Tutup">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* Income / Expense Tabs */}
        <div className="flex gap-2" style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '8px' }}>
          <button
            type="button"
            className="btn flex-1"
            style={{
              background: type === 'expense' ? 'var(--color-expense-bg)' : 'transparent',
              color: type === 'expense' ? 'var(--color-expense)' : 'var(--text-secondary)',
              border: type === 'expense' ? '1px solid var(--color-expense-border)' : 'none',
              padding: '0.5rem'
            }}
            onClick={() => handleTypeChange('expense')}
          >
            Pengeluaran
          </button>
          <button
            type="button"
            className="btn flex-1"
            style={{
              background: type === 'income' ? 'var(--color-income-bg)' : 'transparent',
              color: type === 'income' ? 'var(--color-income)' : 'var(--text-secondary)',
              border: type === 'income' ? '1px solid var(--color-income-border)' : 'none',
              padding: '0.5rem'
            }}
            onClick={() => handleTypeChange('income')}
          >
            Pemasukan
          </button>
        </div>

        {/* Amount Field */}
        <div className="form-group">
          <label htmlFor="amount">Jumlah (IDR) *</label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            min="1"
            placeholder="Contoh: 50000"
            aria-describedby="amount-error"
          />
          <div id="amount-error" className="error-msg">
            ❌ Masukkan jumlah yang valid (minimal Rp 1).
          </div>
        </div>

        {/* Account Selector Field */}
        <div className="form-group">
          <label htmlFor="accountId">Sumber Dana *</label>
          <select
            id="accountId"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            required
            aria-describedby="accountId-error"
          >
            <option value="" disabled hidden>Pilih Sumber Dana</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} (Saldo: {formatCurrency(acc.balance)})
              </option>
            ))}
          </select>
          <div id="accountId-error" className="error-msg">
            ❌ Silakan pilih salah satu sumber dana.
          </div>
        </div>

        {/* Category Field */}
        <div className="form-group">
          <label htmlFor="category">Kategori *</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            aria-describedby="category-error"
          >
            <option value="" disabled hidden>Pilih Kategori</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <div id="category-error" className="error-msg">
            ❌ Silakan pilih salah satu kategori.
          </div>
        </div>

        {/* Date Field */}
        <div className="form-group">
          <label htmlFor="date">Tanggal *</label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            aria-describedby="date-error"
          />
          <div id="date-error" className="error-msg">
            ❌ Tanggal transaksi harus diisi.
          </div>
        </div>

        {/* Note Field */}
        <div className="form-group">
          <label htmlFor="note">Catatan / Deskripsi (Opsional)</label>
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Contoh: Makan siang nasi goreng, Gojek ke stasiun"
          />
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={handleClose}>
            Batal
          </button>
          <button type="submit" className="btn btn-primary">
            {editTransactionData ? 'Simpan Perubahan' : 'Catat'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
