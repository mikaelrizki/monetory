"use client";

import { useState } from 'react';
import { useFinance } from '@/hooks/useFinance';
import { Transaction } from '@/types';
import Dashboard from '@/components/Dashboard';
import TransactionsList from '@/components/TransactionsList';
import BudgetsManager from '@/components/BudgetsManager';
import AccountsManager from '@/components/AccountsManager';
import Charts from '@/components/Charts';
import TransactionModal from '@/components/TransactionModal';
import { LayoutDashboard, ArrowRightLeft, PiggyBank, PieChart, Coins, Plus, Menu, Wallet } from 'lucide-react';

export default function Home() {
  const {
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
    deleteAccount,
    exportData,
    importData,
    totalIncome,
    totalExpense,
    balance,
    categorySpend
  } = useFinance();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTxData, setEditTxData] = useState<Transaction | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!isLoaded) {
    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#060913',
        color: 'white',
        fontSize: '1.2rem',
        fontWeight: 600
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '4px solid rgba(255,255,255,0.1)',
            borderTopColor: 'var(--color-primary)',
            animation: 'spin 1s linear infinite'
          }} />
          <span>Memuat Aplikasi Monetory...</span>
          <style jsx global>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  const handleOpenAddModal = () => {
    if (accounts.length === 0) {
      alert('Silakan buat sumber dana terlebih dahulu di tab "Sumber Dana".');
      setActiveTab('accounts');
      return;
    }
    setEditTxData(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tx: Transaction) => {
    setEditTxData(tx);
    setIsModalOpen(true);
  };

  const handleModalSubmit = (txData: Omit<Transaction, 'id'>) => {
    if (editTxData) {
      editTransaction(editTxData.id, txData);
    } else {
      addTransaction(txData);
    }
    setIsModalOpen(false);
  };

  const renderActiveContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            transactions={transactions}
            budgets={budgets}
            categorySpend={categorySpend}
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            balance={balance}
            onAddTransactionClick={handleOpenAddModal}
            onNavigateToTab={(tab) => setActiveTab(tab)}
            accounts={accounts}
          />
        );
      case 'transactions':
        return (
          <TransactionsList
            transactions={transactions}
            accounts={accounts}
            onEditTransaction={handleOpenEditModal}
            onDeleteTransaction={deleteTransaction}
            onExport={exportData}
            onImport={importData}
          />
        );
      case 'budgets':
        return (
          <BudgetsManager
            budgets={budgets}
            categorySpend={categorySpend}
            onSetBudget={setBudget}
            onDeleteBudget={deleteBudget}
          />
        );
      case 'accounts':
        return (
          <AccountsManager
            accounts={accounts}
            onAddAccount={addAccount}
            onDeleteAccount={deleteAccount}
          />
        );
      case 'charts':
        return <Charts transactions={transactions} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Navigation Header */}
      <header className="glass-panel" style={{
        borderRadius: 0,
        borderLeft: 'none',
        borderRight: 'none',
        borderTop: 'none',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 50,
        position: 'sticky',
        top: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
            padding: '0.4rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <Coins size={20} />
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.025em', background: 'linear-gradient(to right, white, var(--text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Monetory
          </h1>
        </div>

        {/* Mobile Toggle */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{
            background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'none'
          }}
          className="mobile-menu-toggle"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* Main Layout Area */}
      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        {/* Sidebar Left */}
        <aside 
          className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}
          style={{
            width: '240px',
            borderRight: '1px solid rgba(255, 255, 255, 0.05)',
            background: 'rgba(6, 9, 19, 0.5)',
            backdropFilter: 'blur(10px)',
            padding: '1.5rem 0',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}
        >
          <button
            className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
          >
            <LayoutDashboard size={18} /> Ringkasan
          </button>
          <button
            className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => { setActiveTab('transactions'); setIsMobileMenuOpen(false); }}
          >
            <ArrowRightLeft size={18} /> Transaksi
          </button>
          <button
            className={`tab-btn ${activeTab === 'accounts' ? 'active' : ''}`}
            onClick={() => { setActiveTab('accounts'); setIsMobileMenuOpen(false); }}
          >
            <Wallet size={18} /> Sumber Dana
          </button>
          <button
            className={`tab-btn ${activeTab === 'budgets' ? 'active' : ''}`}
            onClick={() => { setActiveTab('budgets'); setIsMobileMenuOpen(false); }}
          >
            <PiggyBank size={18} /> Anggaran
          </button>
          <button
            className={`tab-btn ${activeTab === 'charts' ? 'active' : ''}`}
            onClick={() => { setActiveTab('charts'); setIsMobileMenuOpen(false); }}
          >
            <PieChart size={18} /> Analisis
          </button>

          <div style={{ marginTop: 'auto', padding: '0 1rem' }}>
            <button className="btn btn-primary" onClick={handleOpenAddModal} style={{ width: '100%', padding: '0.6rem' }}>
              <Plus size={16} /> Catat Baru
            </button>
          </div>
        </aside>

        {/* Content Area Right */}
        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto', maxHeight: 'calc(100vh - 65px)' }}>
          <div className="container" style={{ padding: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
            {renderActiveContent()}
          </div>
        </main>
      </div>

      {/* Transaction Entry Form Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        editTransactionData={editTxData}
        accounts={accounts}
      />

      {/* Embedded CSS for responsive adjustments */}
      <style jsx global>{`
        /* Sidebar default and mobile drawer logic */
        @media (max-width: 768px) {
          .mobile-menu-toggle {
            display: flex !important;
          }
          .sidebar {
            position: absolute;
            top: 0;
            left: 0;
            bottom: 0;
            z-index: 40;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
          }
          .sidebar.mobile-open {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
