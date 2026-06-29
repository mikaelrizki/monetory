"use client";

import { useState } from 'react';
import { Transaction, Budget, Account } from '../types';
import { ArrowUpRight, ArrowDownRight, Wallet, AlertTriangle, Plus, ArrowRight } from 'lucide-react';
import { getCycleRange, getTransactionsInCurrentCycle } from '../lib/dateUtils';

interface DashboardProps {
  transactions: Transaction[];
  budgets: Budget[];
  categorySpend: Record<string, number>;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  onAddTransactionClick: () => void;
  onNavigateToTab: (tab: string) => void;
  accounts: Account[];
  user?: any;
}

export default function Dashboard({
  transactions,
  budgets,
  categorySpend,
  totalIncome,
  totalExpense,
  balance,
  onAddTransactionClick,
  onNavigateToTab,
  accounts,
  user
}: DashboardProps) {
  const [balanceType, setBalanceType] = useState<'monthly' | 'total'>('monthly');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const recentTxs = transactions.slice(0, 4);

  // Compute current month cash flow using payday cycle settings
  const startDay = user?.summary_start_day || 1;
  const cycleInfo = getCycleRange(startDay);
  const currentMonthTxs = getTransactionsInCurrentCycle(transactions, startDay);
  const currentMonthIncome = currentMonthTxs
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const currentMonthExpense = currentMonthTxs
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const currentMonthNet = currentMonthIncome - currentMonthExpense;

  // Compute total balance across all source funds
  const totalAccountsBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const displayBalance = balanceType === 'monthly' ? currentMonthNet : totalAccountsBalance;

  // Check for budget alerts
  const budgetAlerts = budgets
    .map(b => {
      const spend = categorySpend[b.category] || 0;
      const ratio = b.limit > 0 ? spend / b.limit : 0;
      return {
        category: b.category,
        spend,
        limit: b.limit,
        ratio,
        isOver: spend > b.limit,
        isClose: spend <= b.limit && ratio >= 0.75
      };
    })
    .filter(a => a.isOver || a.isClose);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Welcome Banner */}
      <div className="glass-panel" style={{ 
        padding: '1.5rem 2rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(99, 102, 241, 0.15) 100%)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Halo! Selamat Datang Kembali</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Berikut adalah rangkuman catatan keuangan Anda hari ini.
            </span>
            <span style={{
              fontSize: '0.75rem',
              background: 'rgba(99, 102, 241, 0.15)',
              color: 'var(--color-primary-light)',
              padding: '0.1rem 0.5rem',
              borderRadius: '12px',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              fontWeight: 600
            }}>
              Periode: {cycleInfo.label}
            </span>
          </div>
        </div>
        <button className="btn btn-primary" onClick={onAddTransactionClick}>
          <Plus size={16} /> Catat Transaksi
        </button>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', width: '100%' }}>
        {/* Balance Card */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            width: '45px', height: '45px', borderRadius: '12px', background: 'var(--color-primary-glow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-light)',
            flexShrink: 0
          }}>
            <Wallet size={20} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Saldo Bersih</span>
            {/* Interactive Select Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.1rem' }}>
              <select
                value={balanceType}
                onChange={(e) => setBalanceType(e.target.value as any)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-primary-light)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0',
                  cursor: 'pointer',
                  outline: 'none',
                  width: 'auto',
                  margin: 0
                }}
              >
                <option value="monthly" style={{ background: '#0f131f', color: 'white' }}>Selisih Bulan Ini</option>
                <option value="total" style={{ background: '#0f131f', color: 'white' }}>Total Sumber Dana</option>
              </select>
            </div>
            <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'white', marginTop: '0.3rem' }}>
              {formatCurrency(displayBalance)}
            </span>
          </div>
        </div>

        {/* Income Card */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            width: '45px', height: '45px', borderRadius: '12px', background: 'var(--color-income-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-income)',
            flexShrink: 0
          }}>
            <ArrowUpRight size={20} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Total Pemasukan</span>
            <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-income)' }}>{formatCurrency(totalIncome)}</span>
          </div>
        </div>

        {/* Expense Card */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            width: '45px', height: '45px', borderRadius: '12px', background: 'var(--color-expense-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-expense)',
            flexShrink: 0
          }}>
            <ArrowDownRight size={20} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Total Pengeluaran</span>
            <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-expense)' }}>{formatCurrency(totalExpense)}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left (Recent transactions), Right (Budget warnings) */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', width: '100%', alignItems: 'start' }}>
        
        {/* Recent Transactions Card */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Transaksi Terbaru</h3>
            <button 
              onClick={() => onNavigateToTab('transactions')} 
              style={{ background: 'none', border: 'none', color: 'var(--color-primary-light)', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 500 }}
            >
              Lihat Semua <ArrowRight size={12} />
            </button>
          </div>

          {recentTxs.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Belum ada transaksi dicatat.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentTxs.map(tx => {
                const isExpense = tx.type === 'expense';
                return (
                  <div 
                    key={tx.id} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.02)',
                      fontSize: '0.85rem'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: 0 }}>
                      <span style={{ fontWeight: 600, color: 'white' }}>{tx.category}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {tx.note || '-'}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem', flexShrink: 0 }}>
                      <span style={{ fontWeight: 700, color: isExpense ? 'var(--color-expense)' : 'var(--color-income)' }}>
                        {isExpense ? '-' : '+'}{formatCurrency(tx.amount)}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{tx.date}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Budget Alerts Card */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Peringatan Anggaran</h3>
            <button 
              onClick={() => onNavigateToTab('budgets')} 
              style={{ background: 'none', border: 'none', color: 'var(--color-primary-light)', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 500 }}
            >
              Kelola <ArrowRight size={12} />
            </button>
          </div>

          {budgetAlerts.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--color-income)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🎉</span>
              <span>Semua pengeluaran Anda masih aman di bawah anggaran!</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {budgetAlerts.map(alert => (
                <div 
                  key={alert.category}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    background: alert.isOver ? 'rgba(244, 63, 94, 0.05)' : 'rgba(245, 158, 11, 0.05)',
                    border: alert.isOver ? '1px solid rgba(244, 63, 94, 0.15)' : '1px solid rgba(245, 158, 11, 0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                    fontSize: '0.8rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: 'white' }}>{alert.category}</span>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      color: alert.isOver ? 'var(--color-expense)' : 'var(--color-warning)',
                      fontWeight: 600
                    }}>
                      {alert.isOver ? 'Melebihi Batas' : 'Mendekati Batas'}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                    <span>Terpakai: {formatCurrency(alert.spend)}</span>
                    <span>Batas: {formatCurrency(alert.limit)}</span>
                  </div>

                  {/* Tiny progress bar */}
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${Math.min(alert.ratio * 100, 100)}%`, 
                      height: '100%', 
                      background: alert.isOver ? 'var(--color-expense)' : 'var(--color-warning)' 
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
