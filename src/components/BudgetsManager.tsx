"use client";

import { useState } from 'react';
import { Budget, EXPENSE_CATEGORIES } from '../types';
import { Trash2, AlertTriangle, Plus } from 'lucide-react';

interface BudgetsManagerProps {
  budgets: Budget[];
  categorySpend: Record<string, number>;
  onSetBudget: (category: string, limit: number) => void;
  onDeleteBudget: (category: string) => void;
}

export default function BudgetsManager({
  budgets,
  categorySpend,
  onSetBudget,
  onDeleteBudget
}: BudgetsManagerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [limit, setLimit] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedLimit = parseFloat(limit);
    if (!selectedCategory || isNaN(parsedLimit) || parsedLimit <= 0) return;

    onSetBudget(selectedCategory, parsedLimit);
    setSelectedCategory('');
    setLimit('');
    setShowAddForm(false);
  };

  // Get categories that don't have budgets configured yet
  const availableCategories = EXPENSE_CATEGORIES.filter(
    cat => !budgets.some(b => b.category === cat)
  );

  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start', width: '100%' }}>
      {/* Active Budgets List */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Anggaran Bulanan</h3>
          {!showAddForm && availableCategories.length > 0 && (
            <button 
              onClick={() => setShowAddForm(true)} 
              className="btn btn-secondary" 
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '6px' }}
            >
              <Plus size={14} /> Atur Anggaran
            </button>
          )}
        </div>

        {budgets.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: '0.9rem' }}>Belum ada batas anggaran bulanan yang diatur.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {budgets.map(budget => {
              const spend = categorySpend[budget.category] || 0;
              const ratio = budget.limit > 0 ? spend / budget.limit : 0;
              const percentage = Math.min(ratio * 100, 100);
              const isOver = spend > budget.limit;
              const isClose = !isOver && ratio >= 0.75; // 75% to 100%

              // Colors based on usage percentage
              let barColor = 'var(--color-success)';
              let bgGlow = 'rgba(16, 185, 129, 0.2)';
              if (isOver) {
                barColor = 'var(--color-expense)';
                bgGlow = 'rgba(244, 63, 94, 0.2)';
              } else if (isClose) {
                barColor = 'var(--color-warning)';
                bgGlow = 'rgba(245, 158, 11, 0.2)';
              }

              return (
                <div key={budget.category} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {/* Budget Details Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{budget.category}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {formatCurrency(spend)} terpakai dari {formatCurrency(budget.limit)}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {isOver && (
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.25rem',
                          background: 'var(--color-expense-bg)',
                          color: 'var(--color-expense)',
                          border: '1px solid var(--color-expense-border)',
                          fontSize: '0.7rem',
                          padding: '0.2rem 0.4rem',
                          borderRadius: '4px',
                          fontWeight: 500
                        }}>
                          <AlertTriangle size={10} /> Lebih!
                        </span>
                      )}
                      <button 
                        onClick={() => onDeleteBudget(budget.category)} 
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'var(--transition-smooth)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-expense)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                        title="Hapus anggaran"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar Container */}
                  <div style={{ 
                    width: '100%', 
                    height: '8px', 
                    background: 'rgba(255,255,255,0.05)', 
                    borderRadius: '4px',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    {/* Active Progress */}
                    <div style={{
                      width: `${percentage}%`,
                      height: '100%',
                      background: barColor,
                      boxShadow: `0 0 8px ${bgGlow}`,
                      borderRadius: '4px',
                      transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Budget Form */}
      {showAddForm && (
        <div className="glass-panel" style={{ padding: '1.5rem', animation: 'fadeIn 0.25s ease' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Atur Anggaran Kategori</h3>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} noValidate>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="budgetCategory">Kategori Pengeluaran *</label>
              <select
                id="budgetCategory"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                required
              >
                <option value="" disabled hidden>Pilih Kategori</option>
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="budgetLimit">Batas Bulanan (IDR) *</label>
              <input
                type="number"
                id="budgetLimit"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                required
                min="1"
                placeholder="Contoh: 1500000"
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary flex-1" 
                onClick={() => setShowAddForm(false)}
                style={{ padding: '0.6rem' }}
              >
                Batal
              </button>
              <button 
                type="submit" 
                className="btn btn-primary flex-1"
                style={{ padding: '0.6rem' }}
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
