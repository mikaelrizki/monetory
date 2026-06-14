"use client";

import { useState, useRef } from 'react';
import { Transaction, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../types';
import { Edit2, Trash2, Search, Filter, ArrowUpDown, Download, Upload, AlertCircle } from 'lucide-react';

interface TransactionsListProps {
  transactions: Transaction[];
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onExport: () => void;
  onImport: (data: string) => { success: boolean; error?: string };
}

type SortField = 'date' | 'amount';
type SortOrder = 'asc' | 'desc';

export default function TransactionsList({
  transactions,
  onEditTransaction,
  onDeleteTransaction,
  onExport,
  onImport
}: TransactionsListProps) {
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Sort States
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // File Import Ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const res = onImport(text);
        if (res.success) {
          setImportStatus({ type: 'success', message: 'Data berhasil diimpor!' });
          setTimeout(() => setImportStatus(null), 3000);
        } else {
          setImportStatus({ type: 'error', message: res.error || 'Gagal mengimpor data.' });
        }
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset file input
  };

  // Filter logic
  const filteredTransactions = transactions.filter(t => {
    // 1. Note search
    const matchesSearch = t.note.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 2. Type filter
    const matchesType = filterType === 'all' || t.type === filterType;

    // 3. Category filter
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;

    // 4. Date range filter
    const matchesStartDate = !startDate || t.date >= startDate;
    const matchesEndDate = !endDate || t.date <= endDate;

    return matchesSearch && matchesType && matchesCategory && matchesStartDate && matchesEndDate;
  });

  // Sort logic
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortField === 'date') {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    } else {
      return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
    }
  });

  const allCategories = Array.from(new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Import / Export Backup Panel */}
      <div className="glass-panel" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontWeight: 600, fontSize: '0.95rem' }}>Backup & Pulihkan Data</h4>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ekspor data Anda ke file JSON atau pulihkan dari backup.</span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {importStatus && (
            <span style={{ 
              fontSize: '0.8rem', 
              color: importStatus.type === 'success' ? 'var(--color-income)' : 'var(--color-expense)',
              fontWeight: 500,
              marginRight: '0.5rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <AlertCircle size={14} /> {importStatus.message}
            </span>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".json" 
            style={{ display: 'none' }} 
          />
          <button onClick={handleImportClick} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
            <Upload size={14} /> Impor
          </button>
          <button onClick={onExport} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
            <Download size={14} /> Ekspor
          </button>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Filter & Cari Transaksi</h3>
        
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {/* Note Search */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="search" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Search size={14} /> Cari Deskripsi/Kategori
            </label>
            <input
              type="text"
              id="search"
              placeholder="Cari..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Type Filter */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="filterType">Tipe Transaksi</label>
            <select
              id="filterType"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
            >
              <option value="all">Semua Tipe</option>
              <option value="expense">Pengeluaran</option>
              <option value="income">Pemasukan</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="filterCategory">Kategori</label>
            <select
              id="filterCategory"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">Semua Kategori</option>
              {allCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="startDate">Mulai Tanggal</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* End Date */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="endDate">Sampai Tanggal</label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Transaction List Table/Cards */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '300px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
            Daftar Transaksi ({sortedTransactions.length})
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className={`btn ${sortField === 'date' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '6px' }}
              onClick={() => handleSort('date')}
            >
              Tanggal {sortField === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button 
              className={`btn ${sortField === 'amount' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '6px' }}
              onClick={() => handleSort('amount')}
            >
              Jumlah {sortField === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>

        {sortedTransactions.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', padding: '3rem 0' }}>
            <p>Tidak ada transaksi yang cocok dengan filter.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', width: '100%' }}>
            {/* Table layout for larger screens */}
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Tanggal</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Kategori</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Deskripsi</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Jumlah</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {sortedTransactions.map((tx) => {
                  const isExpense = tx.type === 'expense';
                  return (
                    <tr 
                      key={tx.id} 
                      style={{ 
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        fontSize: '0.85rem',
                        transition: 'background 0.2s ease',
                        background: 'transparent'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '1rem' }}>{tx.date}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          display: 'inline-block',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          background: isExpense ? 'var(--color-expense-bg)' : 'var(--color-income-bg)',
                          color: isExpense ? 'var(--color-expense)' : 'var(--color-income)',
                          fontSize: '0.75rem',
                          fontWeight: 500
                        }}>
                          {tx.category}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', color: tx.note ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {tx.note || '-'}
                      </td>
                      <td style={{ 
                        padding: '1rem', 
                        textAlign: 'right',
                        fontWeight: 600,
                        color: isExpense ? 'var(--color-expense)' : 'var(--color-income)'
                      }}>
                        {isExpense ? '-' : '+'}{formatCurrency(tx.amount)}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button 
                            onClick={() => onEditTransaction(tx)}
                            style={{ 
                              background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center', transition: 'var(--transition-smooth)'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                            title="Ubah"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => onDeleteTransaction(tx.id)}
                            style={{ 
                              background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center', transition: 'var(--transition-smooth)'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-expense)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                            title="Hapus"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
