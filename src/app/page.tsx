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
import { LayoutDashboard, ArrowRightLeft, PiggyBank, PieChart, Coins, Plus, Menu, Wallet, LogOut, User as UserIcon, Settings } from 'lucide-react';

function SettingsView({
  user,
  onUpdateProfile
}: {
  user: any;
  onUpdateProfile: (name: string, password?: string) => Promise<{ success: boolean; error?: string }>
}) {
  const [name, setName] = useState(user.name || user.username);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Nama Lengkap wajib diisi.');
      return;
    }

    if (password) {
      if (password.length < 6) {
        setError('Kata sandi baru minimal 6 karakter.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Konfirmasi kata sandi baru tidak cocok.');
        return;
      }
    }

    setSubmitting(true);
    const res = await onUpdateProfile(name.trim(), password || undefined);
    setSubmitting(false);

    if (res.success) {
      setSuccess('Profil berhasil diperbarui!');
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(res.error || 'Gagal memperbarui profil.');
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', maxWidth: '500px', width: '100%', margin: '0 auto' }}>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.25rem' }}>Pengaturan Profil</h3>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Perbarui nama lengkap dan kata sandi akun Anda.</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }} noValidate>
        {error && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', color: 'var(--color-expense)', fontSize: '0.8rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: 'var(--color-income)', fontSize: '0.8rem', textAlign: 'center' }}>
            {success}
          </div>
        )}

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label htmlFor="profileUsername">Nama Pengguna (Username)</label>
          <input
            type="text"
            id="profileUsername"
            value={user.username}
            disabled
            style={{ opacity: 0.6, cursor: 'not-allowed' }}
          />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>Username tidak dapat diubah.</span>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label htmlFor="profileName">Nama Lengkap *</label>
          <input
            type="text"
            id="profileName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Masukkan nama lengkap Anda"
            required
            disabled={submitting}
          />
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', margin: '0.5rem 0' }} />

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label htmlFor="profilePassword">Kata Sandi Baru (Opsional)</label>
          <input
            type="password"
            id="profilePassword"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Kosongkan jika tidak ingin mengubah"
            disabled={submitting}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label htmlFor="profileConfirmPassword">Konfirmasi Kata Sandi Baru</label>
          <input
            type="password"
            id="profileConfirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Masukkan ulang kata sandi baru"
            disabled={submitting}
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.7rem', marginTop: '0.5rem', fontWeight: 600 }} disabled={submitting}>
          {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </form>
    </div>
  );
}

export default function Home() {
  const {
    user,
    transactions,
    budgets,
    accounts,
    isLoaded,
    login,
    register,
    logout,
    updateProfile,
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

  // Authentication UI States
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [fullNameInput, setFullNameInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

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

  // Handle Authentication Submission
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!usernameInput.trim() || !passwordInput) {
      setAuthError('Nama pengguna dan kata sandi wajib diisi.');
      return;
    }
    if (authMode === 'register' && !fullNameInput.trim()) {
      setAuthError('Nama lengkap wajib diisi.');
      return;
    }

    setAuthSubmitting(true);
    const result = authMode === 'login'
      ? await login(usernameInput.trim(), passwordInput)
      : await register(usernameInput.trim(), passwordInput, fullNameInput.trim());
    setAuthSubmitting(false);

    if (!result.success) {
      setAuthError(result.error || 'Terjadi kesalahan.');
    } else {
      // Clear inputs on success
      setUsernameInput('');
      setPasswordInput('');
      setFullNameInput('');
    }
  };

  // Render Authentication View if User is not Logged In
  if (!user) {
    return (
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100vw',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#060913',
        backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.05) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(168, 85, 247, 0.05) 0%, transparent 40%)',
        color: 'white',
        padding: '1.5rem'
      }}>
        <div className="glass-panel" style={{
          width: '100%',
          maxWidth: '400px',
          padding: '2.5rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
        }}>
          {/* Logo & Header */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
              padding: '0.6rem',
              borderRadius: '12px',
              display: 'inline-flex',
              color: 'white',
              boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)'
            }}>
              <Coins size={32} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.025em', background: 'linear-gradient(to right, #fff, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginTop: '0.25rem' }}>
              Monetory
            </h1>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
              Catatan Keuangan Pribadi Harian Multi-Akun
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleAuthSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.2rem' }} noValidate>
            {authError && (
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid rgba(244, 63, 94, 0.2)',
                color: 'var(--color-expense)',
                fontSize: '0.8rem',
                width: '100%',
                textAlign: 'center'
              }}>
                {authError}
              </div>
            )}

            {authMode === 'register' && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="fullName">Nama Lengkap</label>
                <input
                  type="text"
                  id="fullName"
                  value={fullNameInput}
                  onChange={(e) => setFullNameInput(e.target.value)}
                  placeholder="Contoh: Mikael Kiki"
                  required
                  disabled={authSubmitting}
                />
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="username">Nama Pengguna (Username)</label>
              <input
                type="text"
                id="username"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Masukkan username Anda"
                required
                disabled={authSubmitting}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="password">Kata Sandi (Password)</label>
              <input
                type="password"
                id="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Masukkan password Anda"
                required
                disabled={authSubmitting}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', fontWeight: 600 }} disabled={authSubmitting}>
              {authSubmitting ? 'Memproses...' : authMode === 'login' ? 'Masuk' : 'Daftar Akun Baru'}
            </button>
          </form>

          {/* Selector Link */}
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {authMode === 'login' ? (
              <span>Belum punya akun? <button onClick={() => { setAuthMode('register'); setAuthError(''); }} style={{ background: 'none', border: 'none', color: 'var(--color-primary-light)', fontWeight: 600, cursor: 'pointer', padding: 0 }}>Daftar di sini</button></span>
            ) : (
              <span>Sudah punya akun? <button onClick={() => { setAuthMode('login'); setAuthError(''); }} style={{ background: 'none', border: 'none', color: 'var(--color-primary-light)', fontWeight: 600, cursor: 'pointer', padding: 0 }}>Masuk di sini</button></span>
            )}
          </div>
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
      case 'settings':
        return (
          <SettingsView
            user={user}
            onUpdateProfile={updateProfile}
          />
        );
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

        {/* User profile & Mobile Menu toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.04)', padding: '0.4rem 0.8rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <UserIcon size={14} style={{ color: 'var(--color-primary-light)' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{user.name || user.username}</span>
          </div>

          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{
              background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'none'
            }}
            className="mobile-menu-toggle"
          >
            <Menu size={20} />
          </button>
        </div>
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
          <button
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
          >
            <Settings size={18} /> Pengaturan
          </button>

          {/* Quick Record Button */}
          <div style={{ padding: '1rem 1rem 0.5rem 1rem', marginTop: '1rem' }}>
            <button className="btn btn-primary" onClick={handleOpenAddModal} style={{ width: '100%', padding: '0.6rem' }}>
              <Plus size={16} /> Catat Baru
            </button>
          </div>

          {/* Logout Section at the Bottom */}
          <div style={{ marginTop: 'auto', padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* Mobile-only User info inside sidebar */}
            <div className="mobile-only" style={{ display: 'none', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.04)', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <UserIcon size={14} style={{ color: 'var(--color-primary-light)' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{user.name || user.username}</span>
            </div>

            <button 
              onClick={logout} 
              className="btn btn-secondary" 
              style={{ 
                width: '100%', 
                padding: '0.6rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '0.5rem',
                background: 'rgba(244, 63, 94, 0.05)',
                border: '1px solid rgba(244, 63, 94, 0.1)',
                color: 'var(--color-expense)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(244, 63, 94, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(244, 63, 94, 0.05)';
              }}
            >
              <LogOut size={16} /> Keluar
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
          .desktop-only {
            display: none !important;
          }
          .mobile-only {
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
